/**
 * garminService.js
 * Garmin Connect Health API integration — OAuth 1.0a + push webhook data parsing.
 *
 * Environment variables required (set in Railway once credentials are approved):
 *   GARMIN_CONSUMER_KEY    — from Garmin Developer Program
 *   GARMIN_CONSUMER_SECRET — from Garmin Developer Program
 *   GARMIN_CALLBACK_URL    — e.g. https://your-railway-url.up.railway.app/api/garmin/callback
 *
 * How it works:
 *   1. connect()    → request temp token → redirect user to Garmin authorization page
 *   2. callback()   → exchange verifier for access token → store in user_profiles
 *   3. Garmin pushes daily summaries + sleep JSON to /api/garmin/webhook automatically
 *      whenever the user syncs their device with Garmin Connect
 */

const crypto = require('crypto');
const db     = require('../db/database');

const GARMIN_BASE           = 'https://connectapi.garmin.com';
const GARMIN_REQUEST_TOKEN  = `${GARMIN_BASE}/oauth-service/oauth/request_token`;
const GARMIN_AUTHORIZE      = `${GARMIN_BASE}/oauth-service/oauth/authorize`;
const GARMIN_ACCESS_TOKEN   = `${GARMIN_BASE}/oauth-service/oauth/access_token`;

// ---------------------------------------------------------------------------
// OAuth 1.0a signing
// ---------------------------------------------------------------------------

function percentEncode(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,  '%21')
    .replace(/'/g,  '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function buildAuthHeader(method, url, params, consumerSecret, tokenSecret = '') {
  const consumerKey  = process.env.GARMIN_CONSUMER_KEY;
  const oauthParams  = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_version:          '1.0',
    ...params,
  };

  // Build signature base string
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join('&');

  const signingKey = `${percentEncode(process.env.GARMIN_CONSUMER_SECRET)}&${percentEncode(tokenSecret)}`;
  const signature  = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// ---------------------------------------------------------------------------
// OAuth 1.0a flow
// ---------------------------------------------------------------------------

/**
 * Step 1: Get a temporary request token from Garmin.
 * Returns { oauth_token, oauth_token_secret }.
 */
async function getRequestToken() {
  const callbackUrl = process.env.GARMIN_CALLBACK_URL;
  const authHeader  = buildAuthHeader(
    'POST',
    GARMIN_REQUEST_TOKEN,
    { oauth_callback: callbackUrl },
    process.env.GARMIN_CONSUMER_SECRET,
  );

  const res = await fetch(GARMIN_REQUEST_TOKEN, {
    method:  'POST',
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Garmin request token failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const text   = await res.text();
  const params = new URLSearchParams(text);
  return {
    oauth_token:        params.get('oauth_token'),
    oauth_token_secret: params.get('oauth_token_secret'),
  };
}

/**
 * Step 2: Build the authorization URL the user should be redirected to.
 */
function buildAuthorizationUrl(oauthToken) {
  return `${GARMIN_AUTHORIZE}?oauth_token=${encodeURIComponent(oauthToken)}`;
}

/**
 * Step 3: Exchange the verifier for an access token.
 * Stores the access token + secret in user_profiles.
 */
async function exchangeForAccessToken(userId, oauthToken, oauthTokenSecret, oauthVerifier) {
  const authHeader = buildAuthHeader(
    'POST',
    GARMIN_ACCESS_TOKEN,
    {
      oauth_token:    oauthToken,
      oauth_verifier: oauthVerifier,
    },
    process.env.GARMIN_CONSUMER_SECRET,
    oauthTokenSecret,
  );

  const res = await fetch(GARMIN_ACCESS_TOKEN, {
    method:  'POST',
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Garmin access token exchange failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const text   = await res.text();
  const params = new URLSearchParams(text);
  const accessToken       = params.get('oauth_token');
  const accessTokenSecret = params.get('oauth_token_secret');

  db.prepare(`
    UPDATE user_profiles SET
      garmin_oauth_token        = ?,
      garmin_oauth_token_secret = ?
    WHERE user_id = ?
  `).run(accessToken, accessTokenSecret, userId);

  return { accessToken, accessTokenSecret };
}

// ---------------------------------------------------------------------------
// Webhook data parsing — Garmin pushes JSON to /api/garmin/webhook
// ---------------------------------------------------------------------------

/**
 * Parse a Garmin DAILIES summary and upsert into garmin_daily_data.
 * Garmin sends UNIX timestamps; we derive the local date from startTimeInSeconds.
 */
function processDailySummary(userId, summary) {
  // startTimeInSeconds is local midnight UTC offset — derive date
  const date = new Date(summary.startTimeInSeconds * 1000)
    .toISOString()
    .slice(0, 10);

  db.prepare(`
    INSERT INTO garmin_daily_data
      (user_id, date, steps, resting_hr, avg_hr, active_kcal, avg_stress, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      steps       = COALESCE(excluded.steps,       steps),
      resting_hr  = COALESCE(excluded.resting_hr,  resting_hr),
      avg_hr      = COALESCE(excluded.avg_hr,       avg_hr),
      active_kcal = COALESCE(excluded.active_kcal, active_kcal),
      avg_stress  = COALESCE(excluded.avg_stress,   avg_stress),
      synced_at   = datetime('now')
  `).run(
    userId,
    date,
    summary.steps                              ?? null,
    summary.restingHeartRateInBeatsPerMinute   ?? null,
    summary.averageHeartRateInBeatsPerMinute   ?? null,
    summary.activeKilocalories                 ?? null,
    summary.averageStressLevel                 ?? null,
  );

  return date;
}

/**
 * Parse a Garmin SLEEP summary and upsert into garmin_daily_data.
 */
function processSleepSummary(userId, sleep) {
  // Use calendar date provided by Garmin or derive from start time
  const date = sleep.calendarDate
    || new Date(sleep.startTimeInSeconds * 1000).toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO garmin_daily_data
      (user_id, date, total_sleep_sec, deep_sleep_sec, light_sleep_sec,
       rem_sleep_sec, awake_sec, sleep_score, spo2_avg, avg_respiration,
       body_battery_charged, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      total_sleep_sec      = COALESCE(excluded.total_sleep_sec,      total_sleep_sec),
      deep_sleep_sec       = COALESCE(excluded.deep_sleep_sec,       deep_sleep_sec),
      light_sleep_sec      = COALESCE(excluded.light_sleep_sec,      light_sleep_sec),
      rem_sleep_sec        = COALESCE(excluded.rem_sleep_sec,        rem_sleep_sec),
      awake_sec            = COALESCE(excluded.awake_sec,            awake_sec),
      sleep_score          = COALESCE(excluded.sleep_score,          sleep_score),
      spo2_avg             = COALESCE(excluded.spo2_avg,             spo2_avg),
      avg_respiration      = COALESCE(excluded.avg_respiration,      avg_respiration),
      body_battery_charged = COALESCE(excluded.body_battery_charged, body_battery_charged),
      synced_at            = datetime('now')
  `).run(
    userId,
    date,
    sleep.durationInSeconds            ?? null,
    sleep.deepSleepDurationInSeconds   ?? null,
    sleep.lightSleepDurationInSeconds  ?? null,
    sleep.remSleepInSeconds            ?? null,
    sleep.awakeDurationInSeconds       ?? null,
    sleep.overallSleepScore            ?? null,
    sleep.averageSpO2Value             ?? null,
    sleep.averageRespirationValue      ?? null,
    sleep.bodyBatteryChargedValue      ?? null,
  );

  return date;
}

/**
 * Resolve a Garmin user ID (from webhook) to our internal user_id.
 * Garmin sends their userId; we store the access token keyed by our user_id.
 * We look up by oauth_token — Garmin sends the access token as the user identifier.
 */
function resolveUserId(garminUserId) {
  // Garmin's userId in webhooks corresponds to the oauth_token value
  const row = db.prepare(
    'SELECT user_id FROM user_profiles WHERE garmin_oauth_token = ?'
  ).get(garminUserId);
  return row?.user_id ?? null;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getTokens(userId) {
  return db.prepare(
    'SELECT garmin_oauth_token, garmin_oauth_token_secret FROM user_profiles WHERE user_id = ?'
  ).get(userId);
}

function isConnected(userId) {
  const row = getTokens(userId);
  return !!(row?.garmin_oauth_token);
}

function disconnect(userId) {
  db.prepare(`
    UPDATE user_profiles SET
      garmin_oauth_token        = NULL,
      garmin_oauth_token_secret = NULL
    WHERE user_id = ?
  `).run(userId);
}

module.exports = {
  getRequestToken,
  buildAuthorizationUrl,
  exchangeForAccessToken,
  processDailySummary,
  processSleepSummary,
  resolveUserId,
  isConnected,
  disconnect,
};
