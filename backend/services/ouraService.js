const db = require('../db/database');

const OURA_BASE      = 'https://api.ouraring.com';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

async function refreshAccessToken(userId, refreshToken) {
  const res = await fetch(OURA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     process.env.OURA_CLIENT_ID,
      client_secret: process.env.OURA_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error('Oura token refresh failed — please reconnect Oura in your profile.');
  const tokens = await res.json();

  db.prepare(`
    UPDATE user_profiles SET
      oura_access_token    = ?,
      oura_refresh_token   = ?,
      oura_token_expires_at = ?
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
    'SELECT oura_access_token, oura_refresh_token, oura_token_expires_at FROM user_profiles WHERE user_id = ?'
  ).get(userId);

  if (!row?.oura_access_token) {
    throw new Error('Oura not connected. Please connect Oura in your profile.');
  }

  // Refresh if expiring within 5 minutes
  if (row.oura_token_expires_at) {
    const expiresAt = new Date(row.oura_token_expires_at);
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      return refreshAccessToken(userId, row.oura_refresh_token);
    }
  }

  return row.oura_access_token;
}

async function fetchOuraToday(token) {
  const today  = new Date().toISOString().slice(0, 10);
  const headers = { Authorization: `Bearer ${token}` };
  const params  = `?start_date=${today}&end_date=${today}`;

  const [readinessRes, sleepRes, activityRes] = await Promise.all([
    fetch(`${OURA_BASE}/v2/usercollection/daily_readiness${params}`, { headers }),
    fetch(`${OURA_BASE}/v2/usercollection/daily_sleep${params}`,     { headers }),
    fetch(`${OURA_BASE}/v2/usercollection/daily_activity${params}`,  { headers }),
  ]);

  if ([readinessRes, sleepRes, activityRes].some((r) => r.status === 401)) {
    throw new Error('Oura token invalid — please reconnect Oura in your profile.');
  }

  const [readinessJson, sleepJson, activityJson] = await Promise.all([
    readinessRes.json(),
    sleepRes.json(),
    activityRes.json(),
  ]);

  const readiness = readinessJson.data?.[0] ?? {};
  const sleep     = sleepJson.data?.[0]     ?? {};
  const activity  = activityJson.data?.[0]  ?? {};

  return {
    readiness_score:     readiness.score                             ?? null,
    hrv_balance_score:   readiness.contributors?.hrv_balance         ?? null,
    resting_hr:          readiness.contributors?.resting_heart_rate  ?? null,
    body_temp_deviation: readiness.temperature_deviation             ?? null,
    sleep_score:         sleep.score                                 ?? null,
    total_sleep_min:     sleep.contributors?.total_sleep             ?? null,
    rem_sleep_min:       sleep.contributors?.rem_sleep               ?? null,
    deep_sleep_min:      sleep.contributors?.deep_sleep              ?? null,
    sleep_efficiency:    sleep.contributors?.efficiency              ?? null,
    activity_score:      activity.score                              ?? null,
    steps:               activity.steps                              ?? null,
  };
}

async function syncToday(userId) {
  const token = await getValidToken(userId);
  const data  = await fetchOuraToday(token);
  const today = new Date().toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO oura_daily_data
      (user_id, date, readiness_score, hrv_balance_score, resting_hr, body_temp_deviation,
       sleep_score, total_sleep_min, rem_sleep_min, deep_sleep_min, sleep_efficiency,
       activity_score, steps, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      readiness_score     = excluded.readiness_score,
      hrv_balance_score   = excluded.hrv_balance_score,
      resting_hr          = excluded.resting_hr,
      body_temp_deviation = excluded.body_temp_deviation,
      sleep_score         = excluded.sleep_score,
      total_sleep_min     = excluded.total_sleep_min,
      rem_sleep_min       = excluded.rem_sleep_min,
      deep_sleep_min      = excluded.deep_sleep_min,
      sleep_efficiency    = excluded.sleep_efficiency,
      activity_score      = excluded.activity_score,
      steps               = excluded.steps,
      synced_at           = datetime('now')
  `).run(
    userId, today,
    data.readiness_score, data.hrv_balance_score, data.resting_hr, data.body_temp_deviation,
    data.sleep_score, data.total_sleep_min, data.rem_sleep_min, data.deep_sleep_min,
    data.sleep_efficiency, data.activity_score, data.steps,
  );

  return db.prepare('SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?').get(userId, today);
}

module.exports = { syncToday, getValidToken };
