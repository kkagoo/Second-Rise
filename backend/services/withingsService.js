const db = require('../db/database');

const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';
const WITHINGS_API_BASE  = 'https://wbsapi.withings.net';

function dayString() {
  return new Date().toISOString().slice(0, 10);
}

// Withings uses epoch seconds for date ranges
function toEpoch(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

async function refreshAccessToken(userId, refreshToken) {
  const res = await fetch(WITHINGS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action:        'refreshaccesstoken',
      client_id:     process.env.WITHINGS_CLIENT_ID,
      client_secret: process.env.WITHINGS_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  const json = await res.json();
  if (json.status !== 0) {
    throw new Error('Withings token refresh failed — please reconnect in your profile.');
  }

  const tokens = json.body;
  db.prepare(`
    UPDATE user_profiles SET
      withings_access_token     = ?,
      withings_refresh_token    = ?,
      withings_token_expires_at = ?
    WHERE user_id = ?
  `).run(
    tokens.access_token,
    tokens.refresh_token || refreshToken,
    new Date(Date.now() + (tokens.expires_in ?? 10800) * 1000).toISOString(),
    userId,
  );

  return tokens.access_token;
}

async function getValidToken(userId) {
  const row = db.prepare(
    'SELECT withings_access_token, withings_refresh_token, withings_token_expires_at FROM user_profiles WHERE user_id = ?'
  ).get(userId);

  if (!row?.withings_access_token) {
    throw new Error('Withings not connected. Please connect Withings in your profile.');
  }

  if (row.withings_token_expires_at) {
    const expiresAt = new Date(row.withings_token_expires_at);
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      return refreshAccessToken(userId, row.withings_refresh_token);
    }
  }

  return row.withings_access_token;
}

async function apiPost(endpoint, action, params, token) {
  const body = new URLSearchParams({ action, ...params });
  const res = await fetch(`${WITHINGS_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const json = await res.json();
  if (json.status !== 0) {
    throw new Error(`Withings API error ${json.status}: ${json.error || endpoint}`);
  }

  return json.body;
}

async function fetchWithingsToday(token) {
  const today     = dayString();
  const startday  = toEpoch(today);
  const endday    = startday + 86400;

  // Sleep summary
  let total_sleep_min = null, deep_sleep_min = null, rem_sleep_min = null, light_sleep_min = null;
  try {
    const sleepBody = await apiPost('/v2/sleep', 'getsummary', {
      startdateymd: today,
      enddateymd:   today,
      data_fields:  'nb_rem_episodes,sleep_score,durationtosleep,durationtowakeup,total_sleep_time,total_timeinbed,wakeupcount,remsleepduration,lightsleepduration,deepsleepduration',
    }, token);

    const series = sleepBody?.series ?? [];
    if (series.length > 0) {
      const s = series[0].data ?? {};
      total_sleep_min  = s.total_sleep_time   != null ? Math.round(s.total_sleep_time / 60)  : null;
      deep_sleep_min   = s.deepsleepduration  != null ? Math.round(s.deepsleepduration / 60)  : null;
      rem_sleep_min    = s.remsleepduration   != null ? Math.round(s.remsleepduration / 60)   : null;
      light_sleep_min  = s.lightsleepduration != null ? Math.round(s.lightsleepduration / 60) : null;
    }
  } catch { /* sleep data unavailable */ }

  // Heart rate (meastype 11)
  let resting_hr = null;
  try {
    const measBody = await apiPost('/measure', 'getmeas', {
      meastype:  '11',
      category:  '1',
      startdate: startday,
      enddate:   endday,
    }, token);

    const groups = measBody?.measuregrps ?? [];
    if (groups.length > 0) {
      const m = groups[0].measures?.[0];
      if (m) resting_hr = Math.round(m.value * Math.pow(10, m.unit));
    }
  } catch { /* HR unavailable */ }

  return { total_sleep_min, deep_sleep_min, rem_sleep_min, light_sleep_min, resting_hr };
}

async function syncToday(userId) {
  const token = await getValidToken(userId);
  const data  = await fetchWithingsToday(token);
  const today = dayString();

  db.prepare(`
    INSERT INTO withings_daily_data
      (user_id, date, resting_hr, total_sleep_min, rem_sleep_min, deep_sleep_min, light_sleep_min, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      resting_hr      = excluded.resting_hr,
      total_sleep_min = excluded.total_sleep_min,
      rem_sleep_min   = excluded.rem_sleep_min,
      deep_sleep_min  = excluded.deep_sleep_min,
      light_sleep_min = excluded.light_sleep_min,
      synced_at       = datetime('now')
  `).run(userId, today, data.resting_hr, data.total_sleep_min, data.rem_sleep_min, data.deep_sleep_min, data.light_sleep_min);

  return db.prepare('SELECT * FROM withings_daily_data WHERE user_id = ? AND date = ?').get(userId, today);
}

module.exports = { syncToday, getValidToken };
