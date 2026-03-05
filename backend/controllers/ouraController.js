const db          = require('../db/database');
const ouraService = require('../services/ouraService');

async function saveToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });

    db.prepare('UPDATE user_profiles SET oura_access_token = ? WHERE user_id = ?')
      .run(token.trim(), req.userId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function syncToday(req, res, next) {
  try {
    const row = await ouraService.syncToday(req.userId);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

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

module.exports = { saveToken, syncToday, getToday };
