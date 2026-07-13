const db = require('../db/database');

module.exports = function adminAuth(req, res, next) {
  const profile = db.prepare('SELECT is_admin FROM user_profiles WHERE user_id = ?').get(req.userId);
  if (!profile?.is_admin) return res.status(403).json({ error: 'Forbidden' });
  next();
};
