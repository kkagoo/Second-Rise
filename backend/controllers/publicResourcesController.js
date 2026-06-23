const db = require('../db/database');

// ── Browse resources (with optional filter/search) ───────────────────────────
function getResources(req, res, next) {
  try {
    const { type, q, featured } = req.query;
    let query = 'SELECT * FROM resources WHERE active = 1';
    const params = [];
    if (type)            { query += ' AND type = ?'; params.push(type); }
    if (q)               { query += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (featured === 'true') { query += ' AND featured = 1'; }
    query += ' ORDER BY featured DESC, date_added DESC';

    const resources = db.prepare(query).all(...params);

    // Attach bookmark status for this user
    const bookmarkSet = new Set(
      db.prepare('SELECT resource_id FROM resource_bookmarks WHERE user_id = ?')
        .all(req.userId)
        .map((r) => r.resource_id)
    );

    const enriched = resources.map((r) => ({
      ...r,
      tags: (() => { try { return JSON.parse(r.tags); } catch { return []; } })(),
      bookmarked: bookmarkSet.has(r.id),
    }));

    res.json({ resources: enriched });
  } catch (err) { next(err); }
}

// ── Get user's bookmarked resources ─────────────────────────────────────────
function getBookmarks(req, res, next) {
  try {
    const resources = db.prepare(`
      SELECT r.*, rb.saved_at FROM resources r
      JOIN resource_bookmarks rb ON rb.resource_id = r.id
      WHERE rb.user_id = ? AND r.active = 1
      ORDER BY rb.saved_at DESC
    `).all(req.userId);

    const enriched = resources.map((r) => ({
      ...r,
      tags: (() => { try { return JSON.parse(r.tags); } catch { return []; } })(),
      bookmarked: true,
    }));

    res.json({ resources: enriched });
  } catch (err) { next(err); }
}

// ── Bookmark a resource ──────────────────────────────────────────────────────
function bookmarkResource(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('INSERT OR IGNORE INTO resource_bookmarks (user_id, resource_id) VALUES (?, ?)').run(req.userId, id);
    res.status(201).json({ message: 'Saved.' });
  } catch (err) { next(err); }
}

// ── Remove bookmark ──────────────────────────────────────────────────────────
function unbookmarkResource(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM resource_bookmarks WHERE user_id = ? AND resource_id = ?').run(req.userId, id);
    res.json({ message: 'Removed.' });
  } catch (err) { next(err); }
}

module.exports = { getResources, getBookmarks, bookmarkResource, unbookmarkResource };
