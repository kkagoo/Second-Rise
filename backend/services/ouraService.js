const db = require('../db/database');

const OURA_BASE = 'https://api.ouraring.com';

async function fetchOuraToday(token) {
  const today = new Date().toISOString().slice(0, 10);

  const headers = { Authorization: `Bearer ${token}` };
  const params  = `?start_date=${today}&end_date=${today}`;

  const [readinessRes, sleepRes, activityRes] = await Promise.all([
    fetch(`${OURA_BASE}/v2/usercollection/daily_readiness${params}`, { headers }),
    fetch(`${OURA_BASE}/v2/usercollection/daily_sleep${params}`,     { headers }),
    fetch(`${OURA_BASE}/v2/usercollection/daily_activity${params}`,  { headers }),
  ]);

  if (readinessRes.status === 401 || sleepRes.status === 401 || activityRes.status === 401) {
    throw new Error('Invalid Oura token — please re-enter your Personal Access Token.');
  }

  const [readinessJson, sleepJson, activityJson] = await Promise.all([
    readinessRes.json(),
    sleepRes.json(),
    activityRes.json(),
  ]);

  const readiness = readinessJson.data?.[0] ?? {};
  const sleep     = sleepJson.data?.[0]     ?? {};
  const activity  = activityJson.data?.[0]  ?? {};

  // Sleep contributor breakdown lives under sleep.contributors
  const sleepContribs = sleep.contributors ?? {};

  return {
    readiness_score:     readiness.score                      ?? null,
    hrv_balance_score:   readiness.contributors?.hrv_balance  ?? null,
    resting_hr:          readiness.contributors?.resting_heart_rate ?? null,
    body_temp_deviation: readiness.temperature_deviation       ?? null,
    sleep_score:         sleep.score                           ?? null,
    total_sleep_min:     sleep.contributors?.total_sleep       ?? null,
    rem_sleep_min:       sleep.contributors?.rem_sleep         ?? null,
    deep_sleep_min:      sleep.contributors?.deep_sleep        ?? null,
    sleep_efficiency:    sleep.contributors?.efficiency        ?? null,
    activity_score:      activity.score                        ?? null,
    steps:               activity.steps                        ?? null,
  };
}

async function syncToday(userId) {
  const row = db.prepare('SELECT oura_access_token FROM user_profiles WHERE user_id = ?').get(userId);
  if (!row?.oura_access_token) {
    throw new Error('No Oura token saved. Please connect Oura in your profile.');
  }

  const data = await fetchOuraToday(row.oura_access_token);
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

module.exports = { fetchOuraToday, syncToday };
