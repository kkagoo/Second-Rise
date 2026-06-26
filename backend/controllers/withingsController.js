const db              = require('../db/database');
const jwt             = require('jsonwebtoken');
const withingsService = require('../services/withingsService');
const { oauthSuccessPage, oauthDeniedPage, oauthErrorPage } = require('../utils/oauthResponse');

const WITHINGS_AUTH_URL  = 'https://account.withings.com/oauth2_user/authorize2';
const WITHINGS_TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';

function connect(req, res, next) {
  try {
    if (!process.env.WITHINGS_CLIENT_ID || !process.env.WITHINGS_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Withings OAuth not configured on this server.' });
    }
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    const returnTo   = (req.query.returnTo || '/profile').replace(/[^a-zA-Z0-9/_-]/g, '');
    const state      = Buffer.from(JSON.stringify({ jwt: userJwt, returnTo })).toString('base64url');
    const redirectUri = process.env.WITHINGS_REDIRECT_URI ||
      `${process.env.BACKEND_URL || 'https://second-rise-production.up.railway.app'}/api/withings/callback`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.WITHINGS_CLIENT_ID,
      redirect_uri:  redirectUri,
      scope:         'user.info,user.metrics,user.activity',
      state,
    });
    res.json({ url: `${WITHINGS_AUTH_URL}?${params}` });
  } catch (err) { next(err); }
}

async function callback(req, res, next) {
  try {
    const { code, state, error: withingsError } = req.query;

    if (withingsError || !code) {
      return res.send(oauthDeniedPage('Withings'));
    }

    let userId;
    try {
      const parsed  = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(parsed.jwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.send(oauthErrorPage('Withings'));
    }

    const redirectUri = process.env.WITHINGS_REDIRECT_URI ||
      `${process.env.BACKEND_URL || 'https://second-rise-production.up.railway.app'}/api/withings/callback`;

    const tokenRes = await fetch(WITHINGS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'requesttoken',
        client_id:     process.env.WITHINGS_CLIENT_ID,
        client_secret: process.env.WITHINGS_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
      }),
    });

    const json = await tokenRes.json();
    if (json.status !== 0) {
      return res.send(oauthErrorPage('Withings'));
    }

    const tokens = json.body;
    db.prepare(`
      UPDATE user_profiles SET
        withings_access_token = ?, withings_refresh_token = ?, withings_token_expires_at = ?
      WHERE user_id = ?
    `).run(tokens.access_token, tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 10800) * 1000).toISOString(), userId);

    withingsService.syncToday(userId).catch(() => {});
    res.send(oauthSuccessPage('Withings'));
  } catch (err) { next(err); }
}

async function syncToday(req, res, next) {
  try {
    const row = await withingsService.syncToday(req.userId);
    res.json(row ?? {});
  } catch (err) { next(err); }
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare('SELECT * FROM withings_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
    res.json(row ?? null);
  } catch (err) { next(err); }
}

function getStatus(req, res, next) {
  try {
    const row = db.prepare('SELECT withings_access_token, withings_token_expires_at FROM user_profiles WHERE user_id = ?').get(req.userId);
    res.json({ connected: !!(row?.withings_access_token), expires_at: row?.withings_token_expires_at ?? null });
  } catch (err) { next(err); }
}

module.exports = { connect, callback, syncToday, getToday, getStatus };
