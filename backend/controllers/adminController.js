const db = require('../db/database');

// ── Dashboard stats ───────────────────────────────────────────────────────────
function getStats(req, res, next) {
  try {
    const totalUsers     = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    const newThisWeek    = db.prepare(`SELECT COUNT(*) as n FROM users WHERE created_at >= datetime('now', '-7 days')`).get().n;
    const newThisMonth   = db.prepare(`SELECT COUNT(*) as n FROM users WHERE created_at >= datetime('now', '-30 days')`).get().n;
    const totalCheckins  = db.prepare('SELECT COUNT(*) as n FROM daily_checkins').get().n;
    const totalWorkouts  = db.prepare('SELECT COUNT(*) as n FROM post_session_feedback').get().n;
    const checkinsToday  = db.prepare(`SELECT COUNT(*) as n FROM daily_checkins WHERE date(timestamp) = date('now')`).get().n;

    res.json({
      total_users:     totalUsers,
      new_this_week:   newThisWeek,
      new_this_month:  newThisMonth,
      total_checkins:  totalCheckins,
      total_workouts:  totalWorkouts,
      checkins_today:  checkinsToday,
    });
  } catch (err) { next(err); }
}

// ── User list (cohort activity view — no raw health values) ───────────────────
function getUsers(req, res, next) {
  try {
    const users = db.prepare(`
      SELECT
        u.id,
        u.email,
        COALESCE(
          MAX(dc.checkin_date),
          MAX(date(dc.timestamp)),
          MAX(date(psf.created_at))
        ) AS last_active,
        (
          SELECT COUNT(*) FROM post_session_feedback psf2
          WHERE psf2.user_id = u.id
            AND psf2.created_at >= datetime('now', '-7 days')
        ) AS sessions_this_week,
        COALESCE(up.current_streak, 0) AS current_streak,
        CASE WHEN (
          up.oura_access_token IS NOT NULL OR
          up.whoop_access_token IS NOT NULL OR
          up.google_fit_access_token IS NOT NULL OR
          up.fitbit_access_token IS NOT NULL OR
          up.withings_access_token IS NOT NULL OR
          up.garmin_oauth_token IS NOT NULL
        ) THEN 1 ELSE 0 END AS wearable_connected
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN daily_checkins dc ON dc.user_id = u.id
      LEFT JOIN post_session_feedback psf ON psf.user_id = u.id
      GROUP BY u.id
      ORDER BY last_active DESC NULLS LAST
    `).all();
    res.json(users);
  } catch (err) { next(err); }
}

// ── Delete a user (admin action) ──────────────────────────────────────────────
function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: `User ${id} deleted.` });
  } catch (err) { next(err); }
}

// ── Resources CRUD ────────────────────────────────────────────────────────────
function getResources(req, res, next) {
  try {
    const resources = db.prepare('SELECT * FROM resources ORDER BY date_added DESC').all();
    res.json({ resources });
  } catch (err) { next(err); }
}

function createResource(req, res, next) {
  try {
    const { title, type, author, url, description, tags, featured, thumbnail_url } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'title and url are required' });
    const result = db.prepare(`
      INSERT INTO resources (title, type, author, url, description, tags, featured, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, type || 'article', author || '', url, description || '', JSON.stringify(tags || []), featured ? 1 : 0, thumbnail_url || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { next(err); }
}

function updateResource(req, res, next) {
  try {
    const { id } = req.params;
    const { title, type, author, url, description, tags, featured, active, thumbnail_url } = req.body;
    db.prepare(`
      UPDATE resources SET
        title         = COALESCE(?, title),
        type          = COALESCE(?, type),
        author        = COALESCE(?, author),
        url           = COALESCE(?, url),
        description   = COALESCE(?, description),
        tags          = COALESCE(?, tags),
        featured      = COALESCE(?, featured),
        active        = COALESCE(?, active),
        thumbnail_url = ?
      WHERE id = ?
    `).run(title, type, author, url, description,
           tags !== undefined ? JSON.stringify(tags) : undefined,
           featured !== undefined ? (featured ? 1 : 0) : undefined,
           active !== undefined ? (active ? 1 : 0) : undefined,
           thumbnail_url !== undefined ? thumbnail_url : null,
           id);
    res.json({ message: 'Updated.' });
  } catch (err) { next(err); }
}

function deleteResource(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM resources WHERE id = ?').run(id);
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
}

module.exports = { getStats, getUsers, deleteUser, getResources, createResource, updateResource, deleteResource };
