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

// Body-area to workout category mapping for lag correlation
const AREA_TO_CATEGORY = {
  'shoulder': ['Strength', 'Upper Body', 'Functional'],
  'arm':      ['Strength', 'Upper Body', 'Functional'],
  'neck':     ['Strength', 'Upper Body', 'Yoga & Flexibility'],
  'upper back': ['Strength', 'Yoga & Flexibility', 'Functional'],
  'lower back': ['Strength', 'Yoga & Flexibility', 'Cardio'],
  'hip':      ['Strength', 'Lower Body', 'Cardio', 'Yoga & Flexibility'],
  'knee':     ['Strength', 'Lower Body', 'Cardio', 'Cycling'],
  'ankle':    ['Cardio', 'Lower Body'],
  'wrist':    ['Strength', 'Upper Body'],
  'chest':    ['Strength', 'Upper Body'],
  'glute':    ['Strength', 'Lower Body'],
};

// ── Pain history with 1-2 day lag activity overlay ────────────────────────────
function getPainHistory(req, res, next) {
  try {
    const { days = 90 } = req.query;

    // Pain entries (grouped by day)
    const checkins = db.prepare(`
      SELECT
        date(timestamp)    AS day,
        MAX(pain_flagged)  AS pain_flagged,
        body_map_flags,
        secondary_flags
      FROM daily_checkins
      WHERE user_id = ?
        AND timestamp >= datetime('now', ?)
      GROUP BY date(timestamp)
      ORDER BY day ASC
    `).all(req.userId, `-${days} days`);

    // Activities (for 1-2 day lag: for each pain day, look at D-1 and D-2)
    const activities = db.prepare(`
      SELECT activity_date AS day, category, activity, intensity
      FROM activity_log
      WHERE user_id = ?
        AND activity_date >= date('now', ?)
      ORDER BY activity_date DESC
    `).all(req.userId, `-${parseInt(days) + 2} days`);

    // Build activity map: day → list of activities
    const actByDay = {};
    activities.forEach((a) => {
      if (!actByDay[a.day]) actByDay[a.day] = [];
      actByDay[a.day].push(a);
    });

    function prevDay(dateStr, n) {
      const d = new Date(dateStr + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() - n);
      return d.toISOString().slice(0, 10);
    }

    const data = checkins.map((c) => {
      const areas = c.body_map_flags ? (() => {
        try {
          const parsed = JSON.parse(c.body_map_flags);
          // body_map_flags stores objects {region, pain_type, severity} — extract region string
          return parsed.map((a) => (typeof a === 'string' ? a : a.region)).filter(Boolean);
        } catch { return []; }
      })() : [];

      // Activities from day-before and two-days-before
      const prevDayActs  = actByDay[prevDay(c.day, 1)] || [];
      const prev2DayActs = actByDay[prevDay(c.day, 2)] || [];
      const precedingActs = [...prevDayActs, ...prev2DayActs];

      // Check if any preceding activity category matches a flagged body area
      const relatedWorkouts = precedingActs.filter((act) => {
        return areas.some((area) => {
          const matchCats = AREA_TO_CATEGORY[area.toLowerCase()] || [];
          return matchCats.some((cat) => act.category?.toLowerCase().includes(cat.toLowerCase()) || act.activity?.toLowerCase().includes(cat.toLowerCase()));
        });
      });

      return {
        day:              c.day,
        pain_flagged:     c.pain_flagged,
        body_areas:       areas,
        // activities on same day (for display)
        same_day_count:   (actByDay[c.day] || []).length,
        // activities 1-2 days prior
        prior_activities: precedingActs,
        related_workouts: relatedWorkouts,
        has_match:        relatedWorkouts.length > 0,
      };
    });

    res.json({ data });
  } catch (err) { next(err); }
}

module.exports = { logActivity, getActivityLog, deleteActivity, exportActivityCSV, getPainHistory };
