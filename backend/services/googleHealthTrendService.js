/**
 * googleHealthTrendService.js
 *
 * Fetches 14 days of per-day health metrics for trend analysis.
 *
 * Current implementation: Google Fit REST API (fitness.googleapis.com)
 *   — uses the existing Google OAuth token, no new scopes required.
 *
 * Upgrade path: Google Health API v4 (health.googleapis.com)
 *   — uses dailyRollUp endpoint, requires `https://www.googleapis.com/auth/health` scope.
 *   — see fetchGoogleHealthAPITrend() below for the v4 implementation.
 */

const db = require('../db/database');
const { getValidToken } = require('./googleFitService');

const GOOGLE_FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me';
const GOOGLE_HEALTH_BASE = 'https://health.googleapis.com/v4';

// ─── Helpers ────────────────────────────────────────────────────────────────

function dateRange(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function windowMs(days) {
  const end = Date.now();
  const start = end - days * 24 * 60 * 60 * 1000;
  return { startMs: start, endMs: end };
}

async function fetchJson(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Google Fit REST API — 14-day daily buckets ──────────────────────────────

async function fetchGoogleFitTrend(token, days = 14) {
  const { startMs, endMs } = windowMs(days);

  const [stepsData, heartData, sleepSessions] = await Promise.all([
    fetchJson(`${GOOGLE_FIT_BASE}/dataset:aggregate`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    }),
    fetchJson(`${GOOGLE_FIT_BASE}/dataset:aggregate`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [{
          dataTypeName: 'com.google.heart_rate.bpm',
          dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    }),
    fetchJson(
      `${GOOGLE_FIT_BASE}/sessions?startTime=${new Date(startMs).toISOString()}&endTime=${new Date(endMs).toISOString()}&activityType=72`,
      token,
    ),
  ]);

  // Build a map of date → step count
  const stepsByDate = {};
  for (const bucket of stepsData?.bucket ?? []) {
    const date = new Date(Number(bucket.startTimeMillis)).toISOString().slice(0, 10);
    const points = bucket.dataset?.[0]?.point ?? [];
    const total = points.reduce((s, p) => s + (p.value?.[0]?.intVal ?? 0), 0);
    if (total > 0) stepsByDate[date] = total;
  }

  // Build a map of date → min resting HR (lowest daily BPM as proxy for resting HR)
  const hrByDate = {};
  for (const bucket of heartData?.bucket ?? []) {
    const date = new Date(Number(bucket.startTimeMillis)).toISOString().slice(0, 10);
    const points = bucket.dataset?.[0]?.point ?? [];
    const bpms = points.flatMap(p => p.value?.filter(v => v.fpVal != null).map(v => v.fpVal) ?? []);
    if (bpms.length > 0) {
      hrByDate[date] = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
    }
  }

  // Build a map of date → sleep minutes from sessions
  const sleepByDate = {};
  for (const session of sleepSessions?.session ?? []) {
    if (Number(session.activityType) !== 72) continue;
    const date = new Date(Number(session.endTimeMillis)).toISOString().slice(0, 10);
    const mins = Math.round((Number(session.endTimeMillis) - Number(session.startTimeMillis)) / 60000);
    if (!sleepByDate[date] || mins > sleepByDate[date]) {
      sleepByDate[date] = mins;
    }
  }

  return { stepsByDate, hrByDate, sleepByDate };
}

// ─── Google Health API v4 — dailyRollUp (upgrade path) ───────────────────────
// Requires scope: https://www.googleapis.com/auth/health
// Data types: HEART_RATE, STEPS, SLEEP_DURATION
// This is the new canonical API that the Google Health CLI uses.

async function fetchGoogleHealthAPITrend(token, days = 14) {
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const body = JSON.stringify({
    startDate,
    endDate,
  });

  const [hrRollup, stepsRollup] = await Promise.all([
    fetchJson(`${GOOGLE_HEALTH_BASE}/users/me/dataTypes/HEART_RATE/dataPoints:dailyRollUp`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
    fetchJson(`${GOOGLE_HEALTH_BASE}/users/me/dataTypes/STEPS/dataPoints:dailyRollUp`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  ]);

  // Parse dailyRollUp responses into date maps
  const hrByDate = {};
  for (const point of hrRollup?.dataPoints ?? []) {
    const date = point.date;
    const minBpm = point.value?.minimumBeatsPerMinute;
    if (date && minBpm != null) hrByDate[date] = Math.round(minBpm);
  }

  const stepsByDate = {};
  for (const point of stepsRollup?.dataPoints ?? []) {
    const date = point.date;
    const count = point.value?.count;
    if (date && count != null) stepsByDate[date] = count;
  }

  return { hrByDate, stepsByDate, sleepByDate: {} };
}

// ─── Main: sync 14-day trend into DB ─────────────────────────────────────────

async function syncTrend(userId, days = 14) {
  const token = await getValidToken(userId);
  const { stepsByDate, hrByDate, sleepByDate } = await fetchGoogleFitTrend(token, days);

  const upsert = db.prepare(`
    INSERT INTO google_health_trends
      (user_id, date, resting_hr, total_sleep_min, step_count, synced_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      resting_hr      = COALESCE(excluded.resting_hr, resting_hr),
      total_sleep_min = COALESCE(excluded.total_sleep_min, total_sleep_min),
      step_count      = COALESCE(excluded.step_count, step_count),
      synced_at       = datetime('now')
  `);

  const dates = dateRange(days);
  const inserted = db.transaction(() => {
    for (const date of dates) {
      const hr    = hrByDate[date]    ?? null;
      const sleep = sleepByDate[date] ?? null;
      const steps = stepsByDate[date] ?? null;
      if (hr != null || sleep != null || steps != null) {
        upsert.run(userId, date, hr, sleep, steps);
      }
    }
  });
  inserted();

  return getTrend(userId, days);
}

// ─── Read trend from DB ───────────────────────────────────────────────────────

function getTrend(userId, days = 14) {
  return db.prepare(`
    SELECT date, resting_hr, total_sleep_min, step_count
    FROM google_health_trends
    WHERE user_id = ?
      AND date >= date('now', ?)
    ORDER BY date ASC
  `).all(userId, `-${days} days`);
}

module.exports = { syncTrend, getTrend, fetchGoogleHealthAPITrend };
