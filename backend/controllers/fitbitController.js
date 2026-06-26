const db             = require('../db/database');
const jwt            = require('jsonwebtoken');
const fitbitService  = require('../services/fitbitService');
const wearableReviewService = require('../services/wearableReviewService');
const { oauthSuccessPage, oauthDeniedPage, oauthErrorPage } = require('../utils/oauthResponse');

const FITBIT_AUTH_URL  = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

function connect(req, res, next) {
  try {
    if (!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_REDIRECT_URI) {
      return res.status(500).json({ error: 'Fitbit OAuth not configured on this server.' });
    }
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    const returnTo   = (req.query.returnTo || '/profile').replace(/[^a-zA-Z0-9/_-]/g, '');
    const state      = Buffer.from(JSON.stringify({ jwt: userJwt, returnTo })).toString('base64url');
    const params = new URLSearchParams({
      client_id: process.env.FITBIT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.FITBIT_REDIRECT_URI,
      scope: 'activity heartrate sleep profile',
      state,
    });
    res.json({ url: `${FITBIT_AUTH_URL}?${params}` });
  } catch (err) { next(err); }
}

async function callback(req, res, next) {
  try {
    const { code, state, error: fitbitError } = req.query;

    if (fitbitError || !code) {
      return res.send(oauthDeniedPage('Fitbit'));
    }

    let userId;
    try {
      const parsed  = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(parsed.jwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.send(oauthErrorPage('Fitbit'));
    }

    const basic = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: process.env.FITBIT_REDIRECT_URI }),
    });

    if (!tokenRes.ok) {
      console.error('[Fitbit callback] token exchange failed', tokenRes.status);
      return res.send(oauthErrorPage('Fitbit'));
    }

    const tokens = await tokenRes.json();
    db.prepare(`
      UPDATE user_profiles SET
        fitbit_access_token = ?, fitbit_refresh_token = ?, fitbit_token_expires_at = ?, fitbit_user_id = ?
      WHERE user_id = ?
    `).run(tokens.access_token, tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      tokens.user_id ?? null, userId);

    fitbitService.syncToday(userId).catch(() => {});
    res.send(oauthSuccessPage('Fitbit / Google Health'));
  } catch (err) { next(err); }
}

async function syncToday(req, res, next) {
  try {
    const row    = await fitbitService.syncToday(req.userId);
    const review = wearableReviewService.evaluateDay(req.userId, row?.date);
    res.json({ ...row, review });
  } catch (err) { next(err); }
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare('SELECT * FROM fitbit_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
    res.json(row ?? null);
  } catch (err) { next(err); }
}

function getStatus(req, res, next) {
  try {
    const row = db.prepare('SELECT fitbit_access_token, fitbit_token_expires_at FROM user_profiles WHERE user_id = ?').get(req.userId);
    res.json({ connected: !!(row?.fitbit_access_token), expires_at: row?.fitbit_token_expires_at ?? null });
  } catch (err) { next(err); }
}

module.exports = { connect, callback, syncToday, getToday, getStatus };
