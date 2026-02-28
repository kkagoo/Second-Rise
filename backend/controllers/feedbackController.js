const db = require('../db/database');

const VALID_RATINGS = ['too_easy', 'just_right', 'too_much', 'didnt_finish'];

function submitFeedback(req, res, next) {
  try {
    const { rec_id, effort_rating, flare_up_regions, notes } = req.body;
    if (!rec_id || !effort_rating) return res.status(400).json({ error: 'rec_id and effort_rating required' });
    if (!VALID_RATINGS.includes(effort_rating)) return res.status(400).json({ error: 'Invalid effort_rating' });

    const result = db.prepare(`
      INSERT INTO post_session_feedback (rec_id, user_id, effort_rating, flare_up_regions, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      rec_id,
      req.userId,
      effort_rating,
      flare_up_regions ? JSON.stringify(flare_up_regions) : null,
      notes ?? null,
    );

    res.status(201).json({ feedback_id: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitFeedback };
