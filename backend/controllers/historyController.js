const db = require('../db/database');

function getHistory(req, res, next) {
  try {
    const page   = parseInt(req.query.page || '1', 10);
    const limit  = 10;
    const offset = (page - 1) * limit;

    // Only return sessions the user explicitly marked as done (feedback submitted).
    // INNER JOIN on post_session_feedback ensures only completed sessions appear.
    const rows = db.prepare(`
      SELECT
        dc.checkin_id, dc.timestamp, dc.layer1_energy, dc.computed_readiness,
        r.rec_id, r.primary_session_type, r.selected_session_type,
        psf.effort_rating, psf.timestamp AS completed_at
      FROM post_session_feedback psf
      INNER JOIN recommendations r  ON r.rec_id   = psf.rec_id   AND r.user_id  = psf.user_id
      INNER JOIN daily_checkins  dc ON dc.checkin_id = r.checkin_id AND dc.user_id = psf.user_id
      WHERE psf.user_id = ?
      ORDER BY psf.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset);

    const { count } = db.prepare(
      'SELECT COUNT(*) as count FROM post_session_feedback WHERE user_id = ?'
    ).get(req.userId);

    res.json({ sessions: rows, total: count, page });
  } catch (err) {
    next(err);
  }
}

function getStats(req, res, next) {
  try {
    const completed = db.prepare(
      'SELECT COUNT(*) as count FROM post_session_feedback WHERE user_id = ?'
    ).get(req.userId);

    const avgReadiness = db.prepare(
      'SELECT AVG(computed_readiness) as avg FROM daily_checkins WHERE user_id = ?'
    ).get(req.userId);

    res.json({
      completed_sessions: completed.count,
      avg_readiness:      Math.round(avgReadiness.avg || 0),
    });
  } catch (err) {
    next(err);
  }
}

function getWeekStats(req, res, next) {
  try {
    // Get Monday of current week (ISO week, Mon = start)
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon...
    const diff = day === 0 ? -6 : 1 - day; // days back to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    const mondayISO = monday.toISOString().slice(0, 10);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayISO = sunday.toISOString().slice(0, 10);

    const rows = db.prepare(`
      SELECT date(psf.timestamp) AS workout_date
      FROM post_session_feedback psf
      WHERE psf.user_id = ?
        AND date(psf.timestamp) BETWEEN ? AND ?
      GROUP BY date(psf.timestamp)
      ORDER BY workout_date ASC
    `).all(req.userId, mondayISO, sundayISO);

    res.json({
      week_start:    mondayISO,
      week_end:      sundayISO,
      days_worked:   rows.length,
      workout_dates: rows.map((r) => r.workout_date),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHistory, getStats, getWeekStats };
