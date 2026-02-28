const db = require('../db/database');

function submitReflection(req, res, next) {
  try {
    const { week_of, sessions_completed, energy_trend, free_text_feedback } = req.body;
    if (!week_of) return res.status(400).json({ error: 'week_of required' });

    db.prepare(`
      INSERT INTO weekly_reflections (user_id, week_of, sessions_completed, energy_trend, free_text_feedback)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, week_of) DO UPDATE SET
        sessions_completed = excluded.sessions_completed,
        energy_trend       = excluded.energy_trend,
        free_text_feedback = excluded.free_text_feedback,
        timestamp          = datetime('now')
    `).run(req.userId, week_of, sessions_completed ?? null, energy_trend ?? null, free_text_feedback ?? null);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitReflection };
