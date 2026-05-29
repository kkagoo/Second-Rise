const db = require('../db/database');

const FITBIT_API_BASE = 'https://api.fitbit.com';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

function dayString() {
  return new Date().toISOString().slice(0, 10);
}

function buildBasicAuth() {
  return Buffer.from(
    `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
  ).toString('base64');
}

async function refreshAccessToken(userId, refreshToken) {
  const res = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${buildBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error('Fitbit token refresh failed — please reconnect Fitbit in your profile.');
  }

  const tokens = await res.json();

  db.prepare(`
    UPDATE user_profiles SET
      fitbit_access_token     = ?,
      fitbit_refresh_token    = ?,
      fitbit_token_expires_at = ?,
      fitbit_user_id          = COALESCE(?, fitbit_user_id)
    WHERE user_id = ?
  `).run(
    tokens.access_token,
    tokens.refresh_token || refreshToken,
    new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
    tokens.user_id ?? null,
    userId,
  );

  return tokens.access_token;
}

async function getValidToken(userId) {
  const row = db.prepare(
    'SELECT fitbit_access_token, fitbit_refresh_token, fitbit_token_expires_at FROM user_profiles WHERE user_id = ?'
  ).get(userId);

  if (!row?.fitbit_access_token) {
    throw new Error('Fitbit not connected. Please connect Fitbit in your profile.');
  }

  if (row.fitbit_token_expires_at) {
    const expiresAt = new Date(row.fitbit_token_expires_at);
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      return refreshAccessToken(userId, row.fitbit_refresh_token);
    }
  }

  return row.fitbit_access_token;
}

async function fetchJson(path, token) {
  const res = await fetch(`${FITBIT_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    throw new Error('Fitbit token invalid — please reconnect Fitbit in your profile.');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Fitbit request failed: ${res.status}`);
  }

  return res.json();
}

async function fetchFitbitToday(token) {
  const today = dayString();

  const [sleepJson, heartJson, stepsJson] = await Promise.all([
    fetchJson(`/1.2/user/-/sleep/date/${today}.json`, token),
    fetchJson(`/1/user/-/activities/heart/date/${today}/1d.json`, token),
    fetchJson(`/1/user/-/activities/steps/date/${today}/1d.json`, token),
  ]);

  const sleepSummary = sleepJson?.summary ?? {};
  const heartDay = heartJson?.['activities-heart']?.[0]?.value ?? {};
  const stepsDay = stepsJson?.['activities-steps']?.[0]?.value ?? null;

  return {
    sleep_score: sleepSummary.stages ? null : null,
    total_sleep_min: sleepSummary.totalMinutesAsleep ?? null,
    rem_sleep_min: sleepSummary.stages?.rem ?? null,
    deep_sleep_min: sleepSummary.stages?.deep ?? null,
    light_sleep_min: sleepSummary.stages?.light ?? null,
    resting_hr: heartDay.restingHeartRate ?? null,
    step_count: stepsDay != null ? Number(stepsDay) : null,
  };
}

async function syncToday(userId) {
  const token = await getValidToken(userId);
  const data = await fetchFitbitToday(token);
  const today = dayString();

  db.prepare(`
    INSERT INTO fitbit_daily_data
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
    'SELECT * FROM fitbit_daily_data WHERE user_id = ? AND date = ?'
  ).get(userId, today);
}

module.exports = { syncToday, getValidToken };
