const db = require('../db/database');

function deleteAccount(req, res, next) {
  try {
    // All child tables have ON DELETE CASCADE, so deleting the user row
    // wipes everything: checkins, recommendations, feedback, wearable data, etc.
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
    res.json({ message: 'Account permanently deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { deleteAccount };
