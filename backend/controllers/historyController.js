const db = require('../db/database');

function getHistory(req, res, next) {
  try {
    const page   = parseInt(req.query.page || '1', 10);
    const limit  = 10;
    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT
        dc.checkin_id, dc.timestamp, dc.layer1_energy, dc.computed_readiness,
        r.rec_id, r.primary_session_type, r.selected_session_type,
        psf.effort_rating
      FROM daily_checkins dc
      LEFT JOIN recommendations r
        ON r.checkin_id = dc.checkin_id AND r.user_id = dc.user_id
      LEFT JOIN post_session_feedback psf
        ON psf.rec_id = r.rec_id AND psf.user_id = dc.user_id
      WHERE dc.user_id = ?
      ORDER BY dc.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset);

    const { count } = db.prepare(
      'SELECT COUNT(*) as count FROM daily_checkins WHERE user_id = ?'
    ).get(req.userId);

    res.json({ sessions: rows, total: count, page });
  } catch (err) {
    next(err);
  }
}

function getStats(req, res, next) {
  try {
    const total = db.prepare(
      'SELECT COUNT(*) as count FROM recommendations WHERE user_id = ?'
    ).get(req.userId);

    const completed = db.prepare(
      'SELECT COUNT(*) as count FROM post_session_feedback WHERE user_id = ?'
    ).get(req.userId);

    const effortBreakdown = db.prepare(`
      SELECT effort_rating, COUNT(*) as count
      FROM post_session_feedback WHERE user_id = ?
      GROUP BY effort_rating
    `).all(req.userId);

    const avgReadiness = db.prepare(
      'SELECT AVG(computed_readiness) as avg FROM daily_checkins WHERE user_id = ?'
    ).get(req.userId);

    res.json({
      total_sessions:    total.count,
      completed_sessions: completed.count,
      effort_breakdown:  effortBreakdown,
      avg_readiness:     Math.round(avgReadiness.avg || 0),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory, getStats };
