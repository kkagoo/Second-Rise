const db = require('../db/database');

// ── Log a new activity ────────────────────────────────────────────────────────
function logActivity(req, res, next) {
  try {
    const { activity_date, category, activity, duration_min, intensity, notes, source, video_id } = req.body;
    if (!activity_date || !category || !activity) {
      return res.status(400).json({ error: 'activity_date, category, and activity are required' });
    }
    const result = db.prepare(`
      INSERT INTO activity_log (user_id, activity_date, category, activity, duration_min, intensity, notes, source, video_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      activity_date,
      category,
      activity,
      duration_min || null,
      intensity || 'moderate',
      notes || null,
      source || 'manual',
      video_id || null
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) { next(err); }
}

// ── Get activity log (with optional date filter) ──────────────────────────────
function getActivityLog(req, res, next) {
  try {
    const { from, to, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM activity_log WHERE user_id = ?';
    const params = [req.userId];
    if (from) { query += ' AND activity_date >= ?'; params.push(from); }
    if (to)   { query += ' AND activity_date <= ?'; params.push(to); }
    query += ' ORDER BY activity_date DESC, logged_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const activities = db.prepare(query).all(...params);

    let countQ = 'SELECT COUNT(*) as n FROM activity_log WHERE user_id = ?';
    const countP = [req.userId];
    if (from) { countQ += ' AND activity_date >= ?'; countP.push(from); }
    if (to)   { countQ += ' AND activity_date <= ?'; countP.push(to); }
    const total = db.prepare(countQ).get(...countP).n;

    res.json({ activities, total });
  } catch (err) { next(err); }
}

// ── Delete an activity entry ───────────────────────────────────────────────────
function deleteActivity(req, res, next) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM activity_log WHERE id = ? AND user_id = ?').run(id, req.userId);
    res.json({ message: 'Deleted.' });
  } catch (err) { next(err); }
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportActivityCSV(req, res, next) {
  try {
    const { from, to } = req.query;
    let query = 'SELECT activity_date, category, activity, duration_min, intensity, notes FROM activity_log WHERE user_id = ?';
    const params = [req.userId];
    if (from) { query += ' AND activity_date >= ?'; params.push(from); }
    if (to)   { query += ' AND activity_date <= ?'; params.push(to); }
    query += ' ORDER BY activity_date DESC';

    const activities = db.prepare(query).all(...params);

    const header = 'Date,Category,Activity,Duration (min),Intensity,Notes\n';
    const rows = activities.map((a) =>
      [
        a.activity_date,
        `"${a.category}"`,
        `"${a.activity}"`,
        a.duration_min || '',
        a.intensity || '',
        `"${(a.notes || '').replace(/"/g, "'")}"`,
      ].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity-history.csv"');
    res.send(header + rows);
  } catch (err) { next(err); }
}

// ── Pain history with activity overlay ───────────────────────────────────────
function getPainHistory(req, res, next) {
  try {
    const { days = 90 } = req.query;
    const checkins = db.prepare(`
      SELECT
        date(timestamp) as day,
        MAX(pain_flagged) as pain_flagged,
        body_map_flags,
        secondary_flags
      FROM daily_checkins
      WHERE user_id = ?
        AND timestamp >= datetime('now', ?)
      GROUP BY date(timestamp)
      ORDER BY day ASC
    `).all(req.userId, `-${days} days`);

    const activityCounts = db.prepare(`
      SELECT activity_date as day, COUNT(*) as count
      FROM activity_log
      WHERE user_id = ?
        AND activity_date >= date('now', ?)
      GROUP BY activity_date
    `).all(req.userId, `-${days} days`);

    const actMap = {};
    activityCounts.forEach((a) => { actMap[a.day] = a.count; });

    const data = checkins.map((c) => ({
      day: c.day,
      pain_flagged: c.pain_flagged,
      body_areas: c.body_map_flags ? JSON.parse(c.body_map_flags) : [],
      activity_count: actMap[c.day] || 0,
    }));

    res.json({ data });
  } catch (err) { next(err); }
}

module.exports = { logActivity, getActivityLog, deleteActivity, exportActivityCSV, getPainHistory };
