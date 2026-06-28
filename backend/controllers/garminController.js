const db             = require('../db/database');
const jwt            = require('jsonwebtoken');
const garminService  = require('../services/garminService');
const wearableReviewService = require('../services/wearableReviewService');
const { oauthSuccessPage, oauthDeniedPage, oauthErrorPage } = require('../utils/oauthResponse');

// Temporary store for request token secrets during the OAuth dance.
// In production with multiple instances, use Redis; for single-instance Railway this is fine.
const pendingSecrets = new Map(); // oauth_token → { tokenSecret, userId }

// ---------------------------------------------------------------------------
// Step 1 — Start connect flow
// ---------------------------------------------------------------------------
async function connect(req, res, next) {
  try {
    if (!process.env.GARMIN_CONSUMER_KEY || !process.env.GARMIN_CONSUMER_SECRET || !process.env.GARMIN_CALLBACK_URL) {
      return res.status(500).json({ error: 'Garmin OAuth not configured on this server.' });
    }

    // Decode our JWT to get userId so we can associate it with the callback
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    let userId;
    try {
      userId = jwt.verify(userJwt, process.env.JWT_SECRET).userId;
    } catch {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    const { oauth_token, oauth_token_secret } = await garminService.getRequestToken();

    // Store userId + secret keyed by temp token (10-min TTL)
    pendingSecrets.set(oauth_token, { tokenSecret: oauth_token_secret, userId });
    setTimeout(() => pendingSecrets.delete(oauth_token), 10 * 60 * 1000);

    const url = garminService.buildAuthorizationUrl(oauth_token);
    res.json({ url });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Step 2 — OAuth callback from Garmin
// ---------------------------------------------------------------------------
async function callback(req, res, next) {
  try {
    const { oauth_token, oauth_verifier, error: garminError } = req.query;

    if (garminError || !oauth_token || !oauth_verifier) {
      return res.send(oauthDeniedPage('Garmin'));
    }

    const pending = pendingSecrets.get(oauth_token);
    if (!pending) {
      return res.send(oauthErrorPage('Garmin', 'Session expired — please try connecting again.'));
    }
    pendingSecrets.delete(oauth_token);

    const { tokenSecret, userId } = pending;

    await garminService.exchangeForAccessToken(userId, oauth_token, tokenSecret, oauth_verifier);

    res.send(oauthSuccessPage('Garmin'));
  } catch (err) {
    console.error('[Garmin callback]', err.message);
    res.send(oauthErrorPage('Garmin', err.message));
  }
}

// ---------------------------------------------------------------------------
// Webhook — Garmin pushes health data here when users sync
// ---------------------------------------------------------------------------
async function webhook(req, res) {
  // Respond 200 immediately so Garmin doesn't retry
  res.sendStatus(200);

  try {
    const body = req.body;

    // Garmin sends an array of user payloads
    const payloads = Array.isArray(body) ? body : [body];

    for (const payload of payloads) {
      const garminUserId = payload.userId;
      const userId = garminService.resolveUserId(garminUserId);

      if (!userId) {
        console.warn('[Garmin webhook] unknown garminUserId:', garminUserId);
        continue;
      }

      // Process daily summaries (steps, HR, stress, calories)
      if (Array.isArray(payload.summaries)) {
        for (const summary of payload.summaries) {
          if (summary.summaryType === 'DAILIES') {
            const date = garminService.processDailySummary(userId, summary);
            // Re-evaluate wearable review for that date
            try { wearableReviewService.evaluateDay(userId, date); } catch (_) {}
          }
        }
      }

      // Process sleep summaries
      if (Array.isArray(payload.sleeps)) {
        for (const sleep of payload.sleeps) {
          const date = garminService.processSleepSummary(userId, sleep);
          try { wearableReviewService.evaluateDay(userId, date); } catch (_) {}
        }
      }
    }
  } catch (err) {
    console.error('[Garmin webhook] processing error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------
function getStatus(req, res, next) {
  try {
    const connected = garminService.isConnected(req.userId);
    res.json({ connected });
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Get today's stored data
// ---------------------------------------------------------------------------
function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare('SELECT * FROM garmin_daily_data WHERE user_id = ? AND date = ?')
      .get(req.userId, today);
    res.json(row ?? null);
  } catch (err) { next(err); }
}

// ---------------------------------------------------------------------------
// Disconnect
// ---------------------------------------------------------------------------
function disconnectGarmin(req, res, next) {
  try {
    garminService.disconnect(req.userId);
    res.json({ message: 'Garmin disconnected.' });
  } catch (err) { next(err); }
}

module.exports = { connect, callback, webhook, getStatus, getToday, disconnectGarmin };
