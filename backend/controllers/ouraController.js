const db          = require('../db/database');
const jwt         = require('jsonwebtoken');
const ouraService = require('../services/ouraService');

const OURA_AUTH_URL  = 'https://cloud.ouraring.com/oauth/authorize';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

// GET /api/oura/connect  (authenticated)
// Returns the Oura OAuth URL — frontend redirects the browser to it
function connect(req, res, next) {
  try {
    if (!process.env.OURA_CLIENT_ID || !process.env.OURA_REDIRECT_URI) {
      return res.status(500).json({ error: 'Oura OAuth not configured on this server.' });
    }

    // Encode the user's JWT as state so the callback can identify the user
    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';

    const state  = Buffer.from(JSON.stringify({ jwt: userJwt })).toString('base64url');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     process.env.OURA_CLIENT_ID,
      redirect_uri:  process.env.OURA_REDIRECT_URI,
      scope:         'daily',
      state,
    });

    res.json({ url: `${OURA_AUTH_URL}?${params}` });
  } catch (err) {
    next(err);
  }
}

// GET /api/oura/callback  (no auth middleware — Oura redirects here)
async function callback(req, res, next) {
  try {
    const { code, state, error: ouraError } = req.query;

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (ouraError || !code) {
      return res.redirect(`${frontendBase}/profile?oura=denied`);
    }

    // Recover userId from state
    let userId;
    try {
      const { jwt: userJwt } = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(userJwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.redirect(`${frontendBase}/profile?oura=error`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch(OURA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: process.env.OURA_REDIRECT_URI,
        client_id:    process.env.OURA_CLIENT_ID,
        client_secret: process.env.OURA_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(`${frontendBase}/profile?oura=error`);
    }

    const tokens = await tokenRes.json();

    db.prepare(`
      UPDATE user_profiles SET
        oura_access_token     = ?,
        oura_refresh_token    = ?,
        oura_token_expires_at = ?
      WHERE user_id = ?
    `).run(
      tokens.access_token,
      tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      userId,
    );

    // Kick off an immediate sync + personal info auto-fill (non-blocking)
    ouraService.syncToday(userId).catch(() => {});
    ouraService.syncPersonalInfo(userId).catch(() => {});

    res.redirect(`${frontendBase}/profile?oura=connected`);
  } catch (err) {
    next(err);
  }
}

// POST /api/oura/sync  (authenticated)
async function syncToday(req, res, next) {
  try {
    const row = await ouraService.syncToday(req.userId);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

// GET /api/oura/today  (authenticated)
function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare(
      'SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);
    res.json(row ?? null);
  } catch (err) {
    next(err);
  }
}

// GET /api/oura/status  (authenticated) — is Oura connected?
function getStatus(req, res, next) {
  try {
    const row = db.prepare(
      'SELECT oura_access_token, oura_token_expires_at FROM user_profiles WHERE user_id = ?'
    ).get(req.userId);
    const connected = !!(row?.oura_access_token);
    res.json({ connected, expires_at: row?.oura_token_expires_at ?? null });
  } catch (err) {
    next(err);
  }
}

// POST /api/oura/personal_info  (authenticated) — fetch & save personal info
async function syncPersonalInfo(req, res, next) {
  try {
    const info = await ouraService.syncPersonalInfo(req.userId);
    res.json(info ?? { age: null, age_range: null, biological_sex: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { connect, callback, syncToday, getToday, getStatus, syncPersonalInfo };
