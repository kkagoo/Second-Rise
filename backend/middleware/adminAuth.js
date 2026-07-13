const db = require('../db/database');

module.exports = function adminAuth(req, res, next) {
  try {
    // Primary check: ADMIN_EMAIL env var — works immediately without any DB seed
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    if (adminEmail) {
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId);
      if (user?.email?.toLowerCase() === adminEmail.toLowerCase()) return next();
    }
    // Fallback: is_admin flag on user_profiles (for future multi-admin support)
    const profile = db.prepare('SELECT is_admin FROM user_profiles WHERE user_id = ?').get(req.userId);
    if (profile?.is_admin) return next();

    return res.status(403).json({ error: 'Forbidden' });
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }
};
