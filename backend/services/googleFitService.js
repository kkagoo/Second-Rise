const db = require('../db/database');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me';

function todayWindow() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return {
    today: now.toISOString().slice(0, 10),
    startMs: start.getTime(),
    endMs: now.getTime(),
    startIso: start.toISOString(),
    endIso: now.toISOString(),
  };
}

async function refreshAccessToken(userId, refreshToken) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error('Google Fit token refresh failed — please reconnect Google Fit in your profile.');
  }

  const tokens = await res.json();

  db.prepare(`
    UPDATE user_profiles SET
      google_fit_access_token     = ?,
      google_fit_refresh_token    = ?,
      google_fit_token_expires_at = ?
    WHERE user_id = ?
  `).run(
    tokens.access_token,
    tokens.refresh_token || refreshToken,
    new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    userId,
  );

  return tokens.access_token;
}

async function getValidToken(userId) {
  const row = db.prepare(
    'SELECT google_fit_access_token, google_fit_refresh_token, google_fit_token_expires_at FROM user_profiles WHERE user_id = ?'
  ).get(userId);

  if (!row?.google_fit_access_token) {
    throw new Error('Google Fit not connected. Please connect Google Fit in your profile.');
  }

  if (row.google_fit_token_expires_at) {
    const expiresAt = new Date(row.google_fit_token_expires_at);
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      if (!row.google_fit_refresh_token) {
        throw new Error('Google Fit refresh token missing — please reconnect Google Fit in your profile.');
      }
      return refreshAccessToken(userId, row.google_fit_refresh_token);
    }
  }

  return row.google_fit_access_token;
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

  if (res.status === 401) {
    throw new Error('Google Fit token invalid — please reconnect Google Fit in your profile.');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Google Fit request failed: ${res.status}`);
  }

  return res.json();
}

async function aggregateDataset(token, body) {
  return fetchJson(`${GOOGLE_FIT_BASE}/dataset:aggregate`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function sumPoints(points, fieldName) {
  return points.reduce((sum, point) => {
    const value = point.value?.find((entry) => Object.prototype.hasOwnProperty.call(entry, fieldName));
    return sum + (value?.[fieldName] || 0);
  }, 0);
}

async function safeAggregate(token, body) {
  try {
    return await aggregateDataset(token, body);
  } catch (_) {
    return null;
  }
}

async function fetchGoogleFitToday(token) {
  const { startMs, endMs, startIso, endIso } = todayWindow();

  const [stepsAgg, heartAgg, sleepSessions] = await Promise.all([
    safeAggregate(token, {
      aggregateBy: [{
        dataTypeName: 'com.google.step_count.delta',
        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
    safeAggregate(token, {
      aggregateBy: [{
        dataTypeName: 'com.google.heart_rate.bpm',
        dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
      }],
      bucketByTime: { durationMillis: endMs - startMs },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
    fetchJson(`${GOOGLE_FIT_BASE}/sessions?startTime=${encodeURIComponent(startIso)}&endTime=${encodeURIComponent(endIso)}&activityType=72`, token).catch(() => null),
  ]);

  const stepPoints = stepsAgg?.bucket?.[0]?.dataset?.[0]?.point ?? [];
  const stepCount = sumPoints(stepPoints, 'intVal');

  // Get resting HR as the minimum BPM reading of the day
  const heartPoints = heartAgg?.bucket?.[0]?.dataset?.[0]?.point ?? [];
  const allBpm = heartPoints.flatMap(p => p.value?.filter(v => v.fpVal != null).map(v => v.fpVal) ?? []);
  const avgHeart = allBpm.length > 0 ? allBpm.reduce((a, b) => a + b, 0) / allBpm.length : null;

  const sleepSession = (sleepSessions?.session ?? [])
    .filter((session) => Number(session.activityType) === 72)
    .sort((a, b) => Number(b.endTimeMillis) - Number(a.endTimeMillis))[0];

  let totalSleepMin = null;
  let remSleepMin = null;
  let deepSleepMin = null;
  let lightSleepMin = null;

  if (sleepSession) {
    totalSleepMin = Math.max(
      0,
      Math.round((Number(sleepSession.endTimeMillis) - Number(sleepSession.startTimeMillis)) / 60000)
    );

    const sleepSegments = await safeAggregate(token, {
      aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
      startTimeMillis: Number(sleepSession.startTimeMillis),
      endTimeMillis: Number(sleepSession.endTimeMillis),
    });

    const points = sleepSegments?.bucket?.[0]?.dataset?.[0]?.point ?? [];
    let rem = 0;
    let deep = 0;
    let light = 0;

    for (const point of points) {
      const intVal = point.value?.[0]?.intVal;
      const startNanos = Number(point.startTimeNanos || 0);
      const endNanos = Number(point.endTimeNanos || 0);
      const mins = Math.max(0, Math.round((endNanos - startNanos) / 60000000000));
      if (intVal === 4) light += mins;
      if (intVal === 5) deep += mins;
      if (intVal === 6) rem += mins;
    }

    lightSleepMin = light || null;
    deepSleepMin = deep || null;
    remSleepMin = rem || null;
  }

  return {
    resting_hr: avgHeart != null ? Math.round(avgHeart) : null,
    total_sleep_min: totalSleepMin,
    rem_sleep_min: remSleepMin,
    deep_sleep_min: deepSleepMin,
    light_sleep_min: lightSleepMin,
    step_count: stepCount || null,
  };
}

async function syncToday(userId) {
  const token = await getValidToken(userId);
  const { today } = todayWindow();
  const data = await fetchGoogleFitToday(token);

  db.prepare(`
    INSERT INTO google_fit_daily_data
      (user_id, date, resting_hr, total_sleep_min, rem_sleep_min, deep_sleep_min, light_sleep_min, step_count, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      resting_hr      = excluded.resting_hr,
      total_sleep_min = excluded.total_sleep_min,
      rem_sleep_min   = excluded.rem_sleep_min,
      deep_sleep_min  = excluded.deep_sleep_min,
      light_sleep_min = excluded.light_sleep_min,
      step_count      = excluded.step_count,
      synced_at       = datetime('now')
  `).run(
    userId,
    today,
    data.resting_hr,
    data.total_sleep_min,
    data.rem_sleep_min,
    data.deep_sleep_min,
    data.light_sleep_min,
    data.step_count,
  );

  return db.prepare(
    'SELECT * FROM google_fit_daily_data WHERE user_id = ? AND date = ?'
  ).get(userId, today);
}

module.exports = { syncToday, getValidToken };
