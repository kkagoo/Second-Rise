const db = require('../db/database');

function deleteAccount(req, res, next) {
  try {
    const uid = req.userId;
    // Delete in FK-dependency order (tables without CASCADE must go first)
    db.prepare('DELETE FROM post_session_feedback WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM daily_wearable_reviews WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM recommendations WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM weekly_reflections WHERE user_id = ?').run(uid);
    // The rest have ON DELETE CASCADE and will be wiped when users row is deleted,
    // but delete explicitly to be safe with any future tables.
    db.prepare('DELETE FROM daily_checkins WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM oura_daily_data WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM whoop_daily_data WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM fitbit_daily_data WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM google_fit_daily_data WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM garmin_daily_data WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM apple_health_data WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(uid);
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    res.json({ message: 'Account permanently deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { deleteAccount };
