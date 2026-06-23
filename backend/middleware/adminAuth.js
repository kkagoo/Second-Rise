// Admin auth middleware
// Checks X-Admin-Secret header against ADMIN_SECRET env var
// Set ADMIN_SECRET in Railway environment variables

function adminAuth(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({ error: 'ADMIN_SECRET not configured on server.' });
  }
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = adminAuth;
