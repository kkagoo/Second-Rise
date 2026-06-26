const db          = require('../db/database');
const jwt         = require('jsonwebtoken');
const ouraService = require('../services/ouraService');
const wearableReviewService = require('../services/wearableReviewService');
const { oauthSuccessPage, oauthDeniedPage, oauthErrorPage } = require('../utils/oauthResponse');

const OURA_AUTH_URL  = 'https://cloud.ouraring.com/oauth/authorize';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

function connect(req, res, next) {
  try {
    if (!process.env.OURA_CLIENT_ID || !process.env.OURA_CLIENT_SECRET || !process.env.OURA_REDIRECT_URI) {
      return res.status(500).json({ error: 'Oura OAuth not configured on this server.' });
    }
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    const returnTo   = (req.query.returnTo || '/profile').replace(/[^a-zA-Z0-9/_-]/g, '');
    const state      = Buffer.from(JSON.stringify({ jwt: userJwt, returnTo })).toString('base64url');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.OURA_CLIENT_ID,
      redirect_uri:  process.env.OURA_REDIRECT_URI,
      scope:         'daily',
      state,
    });
    res.json({ url: `${OURA_AUTH_URL}?${params}` });
  } catch (err) { next(err); }
}

async function callback(req, res, next) {
  try {
    const { code, state, error: ouraError } = req.query;

    if (ouraError || !code) {
      return res.send(oauthDeniedPage('Oura'));
    }

    let userId;
    try {
      const parsed  = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(parsed.jwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.send(oauthErrorPage('Oura'));
    }

    const tokenRes = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.OURA_REDIRECT_URI,
        client_id:     process.env.OURA_CLIENT_ID,
        client_secret: process.env.OURA_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      console.error('[Oura callback] token exchange failed', tokenRes.status);
      return res.send(oauthErrorPage('Oura'));
    }

    const tokens = await tokenRes.json();
    db.prepare(`
      UPDATE user_profiles SET
        oura_access_token = ?, oura_refresh_token = ?, oura_token_expires_at = ?
      WHERE user_id = ?
    `).run(tokens.access_token, tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(), userId);

    ouraService.syncToday(userId).catch(() => {});
    ouraService.syncPersonalInfo(userId).catch(() => {});
    res.send(oauthSuccessPage('Oura Ring'));
  } catch (err) { next(err); }
}

async function syncToday(req, res, next) {
  try {
    const row    = await ouraService.syncToday(req.userId);
    const review = wearableReviewService.evaluateDay(req.userId, row?.date);
    res.json({ ...row, review });
  } catch (err) { next(err); }
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare('SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
    res.json(row ?? null);
  } catch (err) { next(err); }
}

function getStatus(req, res, next) {
  try {
    const row = db.prepare('SELECT oura_access_token, oura_token_expires_at FROM user_profiles WHERE user_id = ?').get(req.userId);
    res.json({ connected: !!(row?.oura_access_token), expires_at: row?.oura_token_expires_at ?? null });
  } catch (err) { next(err); }
}

async function syncPersonalInfo(req, res, next) {
  try {
    const info = await ouraService.syncPersonalInfo(req.userId);
    res.json(info ?? { age: null, age_range: null, biological_sex: null });
  } catch (err) { next(err); }
}

module.exports = { connect, callback, syncToday, getToday, getStatus, syncPersonalInfo };
