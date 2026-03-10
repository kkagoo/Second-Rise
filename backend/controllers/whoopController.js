const db           = require('../db/database');
const jwt          = require('jsonwebtoken');
const whoopService = require('../services/whoopService');

const WHOOP_AUTH_URL  = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

function connect(req, res, next) {
  try {
    if (!process.env.WHOOP_CLIENT_ID || !process.env.WHOOP_REDIRECT_URI) {
      return res.status(500).json({ error: 'Whoop OAuth not configured on this server.' });
    }

    const authHeader = req.headers.authorization;
    const userJwt    = authHeader?.slice(7) ?? '';
    const state      = Buffer.from(JSON.stringify({ jwt: userJwt })).toString('base64url');

    const fullUrl = `${WHOOP_AUTH_URL}?response_type=code`
      + `&client_id=${encodeURIComponent(process.env.WHOOP_CLIENT_ID)}`
      + `&redirect_uri=${encodeURIComponent(process.env.WHOOP_REDIRECT_URI)}`
      + `&scope=${encodeURIComponent('read:recovery read:sleep read:cycle read:workout read:profile offline_access')}`
      + `&state=${state}`;
    console.log('[Whoop connect] OAuth URL:', fullUrl);
    res.json({ url: fullUrl });
  } catch (err) {
    next(err);
  }
}

async function callback(req, res, next) {
  try {
    const { code, state, error: whoopError, error_description } = req.query;
    const frontendBase = process.env.FRONTEND_URL || 'https://second-rise-production.up.railway.app';

    console.log('[Whoop callback] query params:', { code: !!code, state: !!state, whoopError, error_description });

    if (whoopError || !code) {
      console.log('[Whoop callback] denied — error:', whoopError, error_description);
      return res.redirect(`${frontendBase}/profile?whoop=denied`);
    }

    let userId;
    try {
      const { jwt: userJwt } = JSON.parse(Buffer.from(state, 'base64url').toString());
      const decoded = jwt.verify(userJwt, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return res.redirect(`${frontendBase}/profile?whoop=error`);
    }

    const tokenRes = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.WHOOP_REDIRECT_URI,
        client_id:     process.env.WHOOP_CLIENT_ID,
        client_secret: process.env.WHOOP_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      return res.redirect(`${frontendBase}/profile?whoop=error`);
    }

    const tokens = await tokenRes.json();

    db.prepare(`
      UPDATE user_profiles SET
        whoop_access_token     = ?,
        whoop_refresh_token    = ?,
        whoop_token_expires_at = ?
      WHERE user_id = ?
    `).run(
      tokens.access_token,
      tokens.refresh_token,
      new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      userId,
    );

    // Kick off an immediate sync (non-blocking)
    whoopService.syncToday(userId).catch(() => {});

    res.redirect(`${frontendBase}/profile?whoop=connected`);
  } catch (err) {
    next(err);
  }
}

async function syncToday(req, res, next) {
  try {
    const row = await whoopService.syncToday(req.userId);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row   = db.prepare(
      'SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);
    res.json(row ?? null);
  } catch (err) {
    next(err);
  }
}

function getStatus(req, res, next) {
  try {
    const row = db.prepare(
      'SELECT whoop_access_token, whoop_token_expires_at FROM user_profiles WHERE user_id = ?'
    ).get(req.userId);
    res.json({ connected: !!(row?.whoop_access_token), expires_at: row?.whoop_token_expires_at ?? null });
  } catch (err) {
    next(err);
  }
}

module.exports = { connect, callback, syncToday, getToday, getStatus };
