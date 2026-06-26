const db             = require('../db/database');
const jwt            = require('jsonwebtoken');
const googleFitService = require('../services/googleFitService');
const { oauthSuccessPage, oauthDeniedPage, oauthErrorPage } = require('../utils/oauthResponse');

const GOOGLE_AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function connect(req, res, next) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      return res.status(500).json({ error: 'Google OAuth not configured on this server.' });
    }
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    const returnTo   = (req.query.returnTo || '/profile').replace(/[^a-zA-Z0-9/_-]/g, '');
    const state      = Buffer.from(JSON.stringify({ jwt: userJwt, returnTo })).toString('base64url');
    const params = new URLSearchParams({
      response_type:   'code',
      client_id:       process.env.GOOGLE_CLIENT_ID,
      redirect_uri:    process.env.GOOGLE_REDIRECT_URI,
      scope:           'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.heart_rate.read',
      access_type:     'offline',
      prompt:          'consent',
      state,
    });
    res.json({ url: `${GOOGLE_AUTH_URL}?${params}` });
  } catch (err) { next(err); }
}

async function callback(req, res, next) {
  try {
    const { code, state, error: googleError } = req.query;

    if (googleError || !code) {
      return res.send(oauthDeniedPage('Google Health'));
    }

    let userId;
    try {
      const parsed  = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(parsed.jwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.send(oauthErrorPage('Google Health'));
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[GoogleFit callback] token exchange failed', tokenRes.status);
      return res.send(oauthErrorPage('Google Health'));
    }

    const tokens = await tokenRes.json();
    db.prepare(`
      UPDATE user_profiles SET
        google_fit_access_token = ?, google_fit_refresh_token = ?, google_fit_token_expires_at = ?
      WHERE user_id = ?
    `).run(tokens.access_token, tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(), userId);

    googleFitService.syncToday(userId).catch(() => {});
    res.send(oauthSuccessPage('Google Health'));
  } catch (err) { next(err); }
}

async function syncToday(req, res, next) {
  try {
    const row = await googleFitService.syncToday(req.userId);
    res.json(row ?? {});
  } catch (err) { next(err); }
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare('SELECT * FROM google_fit_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
    res.json(row ?? null);
  } catch (err) { next(err); }
}

function getStatus(req, res, next) {
  try {
    const row = db.prepare('SELECT google_fit_access_token FROM user_profiles WHERE user_id = ?').get(req.userId);
    res.json({ connected: !!(row?.google_fit_access_token) });
  } catch (err) { next(err); }
}

module.exports = { connect, callback, syncToday, getToday, getStatus };
