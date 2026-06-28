const db = require('../db/database');

const VALID_RATINGS   = ['too_easy', 'just_right', 'too_much', 'didnt_finish'];
const VALID_ENERGY    = ['high', 'medium', 'low'];
const VALID_SORENESS  = ['none', 'mild', 'significant'];

function submitFeedback(req, res, next) {
  try {
    const { rec_id, effort_rating, flare_up_regions, notes, energy_level, soreness_level } = req.body;
    if (!rec_id || !effort_rating) return res.status(400).json({ error: 'rec_id and effort_rating required' });
    if (!VALID_RATINGS.includes(effort_rating)) return res.status(400).json({ error: 'Invalid effort_rating' });
    if (energy_level   && !VALID_ENERGY.includes(energy_level))   return res.status(400).json({ error: 'Invalid energy_level' });
    if (soreness_level && !VALID_SORENESS.includes(soreness_level)) return res.status(400).json({ error: 'Invalid soreness_level' });

    const result = db.prepare(`
      INSERT INTO post_session_feedback (rec_id, user_id, effort_rating, flare_up_regions, notes, energy_level, soreness_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      rec_id,
      req.userId,
      effort_rating,
      flare_up_regions ? JSON.stringify(flare_up_regions) : null,
      notes ?? null,
      energy_level ?? null,
      soreness_level ?? null,
    );

    res.status(201).json({ feedback_id: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitFeedback };
