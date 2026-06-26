const db           = require('../db/database');
const jwt          = require('jsonwebtoken');
const whoopService = require('../services/whoopService');
const wearableReviewService = require('../services/wearableReviewService');
const { oauthSuccessPage, oauthDeniedPage, oauthErrorPage } = require('../utils/oauthResponse');

const WHOOP_AUTH_URL  = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

function connect(req, res, next) {
  try {
    if (!process.env.WHOOP_CLIENT_ID || !process.env.WHOOP_CLIENT_SECRET || !process.env.WHOOP_REDIRECT_URI) {
      return res.status(500).json({ error: 'Whoop OAuth not configured on this server.' });
    }
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    const returnTo   = (req.query.returnTo || '/profile').replace(/[^a-zA-Z0-9/_-]/g, '');
    const state      = Buffer.from(JSON.stringify({ jwt: userJwt, returnTo })).toString('base64url');
    const fullUrl = `${WHOOP_AUTH_URL}?response_type=code`
      + `&client_id=${encodeURIComponent(process.env.WHOOP_CLIENT_ID)}`
      + `&redirect_uri=${encodeURIComponent(process.env.WHOOP_REDIRECT_URI)}`
      + `&scope=${encodeURIComponent('read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement')}`
      + `&state=${state}`;
    res.json({ url: fullUrl });
  } catch (err) { next(err); }
}

async function callback(req, res, next) {
  try {
    const { code, state, error: whoopError, error_description } = req.query;
    console.log('[Whoop callback]', { code: !!code, state: !!state, whoopError });

    if (whoopError || !code) {
      return res.send(oauthDeniedPage('Whoop'));
    }

    let userId;
    try {
      const parsed  = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(parsed.jwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.send(oauthErrorPage('Whoop'));
    }

    const tokenRes = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri:  process.env.WHOOP_REDIRECT_URI,
        client_id:     process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[Whoop callback] token exchange failed', tokenRes.status);
      return res.send(oauthErrorPage('Whoop'));
    }

    const tokens = await tokenRes.json();
    db.prepare(`
      UPDATE user_profiles SET
        whoop_access_token = ?, whoop_refresh_token = ?, whoop_token_expires_at = ?
      WHERE user_id = ?
    `).run(tokens.access_token, tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(), userId);

    whoopService.syncToday(userId).catch(() => {});
    res.send(oauthSuccessPage('Whoop'));
  } catch (err) { next(err); }
}

async function syncToday(req, res, next) {
  try {
    const row    = await whoopService.syncToday(req.userId);
    const review = wearableReviewService.evaluateDay(req.userId, row?.date);
    res.json({ ...row, review });
  } catch (err) { next(err); }
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare('SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
    res.json(row ?? null);
  } catch (err) { next(err); }
}

function getStatus(req, res, next) {
  try {
    const row = db.prepare('SELECT whoop_access_token, whoop_token_expires_at FROM user_profiles WHERE user_id = ?').get(req.userId);
    res.json({ connected: !!(row?.whoop_access_token), expires_at: row?.whoop_token_expires_at ?? null });
  } catch (err) { next(err); }
}

module.exports = { connect, callback, syncToday, getToday, getStatus };
