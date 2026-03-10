const db = require('../db/database');

const WHOOP_BASE      = 'https://api.prod.whoop.com/developer';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

async function refreshAccessToken(userId, refreshToken) {
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     process.env.WHOOP_CLIENT_ID,
      client_secret: process.env.WHOOP_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error('Whoop token refresh failed — please reconnect Whoop in your profile.');
  const tokens = await res.json();

  db.prepare(`
    UPDATE user_profiles SET
      whoop_access_token    = ?,
      whoop_refresh_token   = ?,
      whoop_token_expires_at = ?
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
    'SELECT whoop_access_token, whoop_refresh_token, whoop_token_expires_at FROM user_profiles WHERE user_id = ?'
  ).get(userId);

  if (!row?.whoop_access_token) {
    throw new Error('Whoop not connected. Please connect Whoop in your profile.');
  }

  if (row.whoop_token_expires_at) {
    const expiresAt = new Date(row.whoop_token_expires_at);
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      return refreshAccessToken(userId, row.whoop_refresh_token);
    }
  }

  return row.whoop_access_token;
}

async function fetchWhoopToday(token) {
  const headers = { Authorization: `Bearer ${token}` };

  // Get the most recent recovery, sleep, and cycle data
  const [recoveryRes, sleepRes, cycleRes] = await Promise.all([
    fetch(`${WHOOP_BASE}/v1/recovery?limit=1`, { headers }),
    fetch(`${WHOOP_BASE}/v1/sleep?limit=1`, { headers }),
    fetch(`${WHOOP_BASE}/v1/cycle?limit=1`, { headers }),
  ]);

  if ([recoveryRes, sleepRes, cycleRes].some((r) => r.status === 401)) {
    throw new Error('Whoop token invalid — please reconnect Whoop in your profile.');
  }

  const [recoveryJson, sleepJson, cycleJson] = await Promise.all([
    recoveryRes.ok ? recoveryRes.json() : Promise.resolve({ records: [] }),
    sleepRes.ok ? sleepRes.json() : Promise.resolve({ records: [] }),
    cycleRes.ok ? cycleRes.json() : Promise.resolve({ records: [] }),
  ]);

  const recovery = recoveryJson.records?.[0]?.score ?? {};
  const sleep    = sleepJson.records?.[0]?.score ?? {};
  const stages   = sleep.stage_summary ?? {};
  const cycle    = cycleJson.records?.[0]?.score ?? {};

  // Convert milliseconds to minutes
  const msToMin = (ms) => ms != null ? Math.round(ms / 60000) : null;

  return {
    recovery_score:    recovery.recovery_score        ?? null,
    hrv_rmssd_ms:      recovery.hrv_rmssd_milli       ?? null,
    resting_hr:        recovery.resting_heart_rate     ?? null,
    spo2_percentage:   recovery.spo2_percentage        ?? null,
    skin_temp_celsius: recovery.skin_temp_celsius      ?? null,
    sleep_performance: sleep.sleep_performance_percentage ?? null,
    sleep_efficiency:  sleep.sleep_efficiency_percentage  ?? null,
    respiratory_rate:  sleep.respiratory_rate          ?? null,
    total_sleep_min:   msToMin(stages.total_in_bed_time_milli != null
      ? stages.total_in_bed_time_milli - (stages.total_awake_time_milli ?? 0)
      : null),
    rem_sleep_min:     msToMin(stages.total_rem_sleep_time_milli),
    deep_sleep_min:    msToMin(stages.total_slow_wave_sleep_time_milli),
    light_sleep_min:   msToMin(stages.total_light_sleep_time_milli),
    strain_score:      cycle.strain                   ?? null,
  };
}

async function syncToday(userId) {
  const token = await getValidToken(userId);
  const data  = await fetchWhoopToday(token);
  const today = new Date().toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO whoop_daily_data
      (user_id, date, recovery_score, hrv_rmssd_ms, resting_hr, spo2_percentage, skin_temp_celsius,
       sleep_performance, sleep_efficiency, total_sleep_min, rem_sleep_min, deep_sleep_min,
       light_sleep_min, respiratory_rate, strain_score, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      recovery_score    = excluded.recovery_score,
      hrv_rmssd_ms      = excluded.hrv_rmssd_ms,
      resting_hr        = excluded.resting_hr,
      spo2_percentage   = excluded.spo2_percentage,
      skin_temp_celsius = excluded.skin_temp_celsius,
      sleep_performance = excluded.sleep_performance,
      sleep_efficiency  = excluded.sleep_efficiency,
      total_sleep_min   = excluded.total_sleep_min,
      rem_sleep_min     = excluded.rem_sleep_min,
      deep_sleep_min    = excluded.deep_sleep_min,
      light_sleep_min   = excluded.light_sleep_min,
      respiratory_rate  = excluded.respiratory_rate,
      strain_score      = excluded.strain_score,
      synced_at         = datetime('now')
  `).run(
    userId, today,
    data.recovery_score, data.hrv_rmssd_ms, data.resting_hr, data.spo2_percentage, data.skin_temp_celsius,
    data.sleep_performance, data.sleep_efficiency, data.total_sleep_min, data.rem_sleep_min,
    data.deep_sleep_min, data.light_sleep_min, data.respiratory_rate, data.strain_score,
  );

  return db.prepare('SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?').get(userId, today);
}

module.exports = { syncToday, getValidToken };
