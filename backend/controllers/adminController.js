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

    // Cohort progress signals (last 7 days)
    const cohortEnergy = db.prepare(`
      SELECT ROUND(AVG(layer1_energy), 1) AS avg_energy
      FROM daily_checkins
      WHERE timestamp >= datetime('now', '-7 days')
    `).get();

    const cohortReadiness = db.prepare(`
      SELECT ROUND(AVG(computed_readiness), 0) AS avg_readiness
      FROM daily_checkins
      WHERE timestamp >= datetime('now', '-7 days')
    `).get();

    // Effort distribution (all time, last 30 days)
    const effortRows = db.prepare(`
      SELECT effort_rating, COUNT(*) AS n
      FROM post_session_feedback
      WHERE timestamp >= datetime('now', '-30 days')
      GROUP BY effort_rating
      ORDER BY n DESC
    `).all();
    const effortDistribution = {};
    effortRows.forEach(r => { effortDistribution[r.effort_rating] = r.n; });

    // Girls Who Code donation pledge total ($1 per 7-day streak milestone)
    const donationPledge = db.prepare(`
      SELECT COALESCE(SUM(streak_milestones), 0) AS total_milestones
      FROM user_profiles
    `).get();
    const totalDonationPledged = donationPledge.total_milestones; // in dollars

    // Users with any wearable data this week
    const wearableActiveUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) AS n FROM (
        SELECT user_id FROM oura_daily_data  WHERE date >= date('now', '-7 days')
        UNION SELECT user_id FROM whoop_daily_data WHERE date >= date('now', '-7 days')
        UNION SELECT user_id FROM garmin_daily_data WHERE date >= date('now', '-7 days')
        UNION SELECT user_id FROM fitbit_daily_data WHERE date >= date('now', '-7 days')
        UNION SELECT user_id FROM health_connect_daily_data WHERE date >= date('now', '-7 days')
        UNION SELECT user_id FROM withings_daily_data WHERE date >= date('now', '-7 days')
        UNION SELECT user_id FROM apple_health_data WHERE date >= date('now', '-7 days')
      )
    `).get().n;

    res.json({
      total_users:           totalUsers,
      new_this_week:         newThisWeek,
      new_this_month:        newThisMonth,
      total_checkins:        totalCheckins,
      total_workouts:        totalWorkouts,
      checkins_today:        checkinsToday,
      cohort_avg_energy:     cohortEnergy?.avg_energy ?? null,
      cohort_avg_readiness:  cohortReadiness?.avg_readiness ?? null,
      effort_distribution:   effortDistribution,
      wearable_active_users:    wearableActiveUsers,
      total_donation_pledged:   totalDonationPledged, // $ owed to Girls Who Code
    });
  } catch (err) { next(err); }
}

// ── 4-week cohort trends ──────────────────────────────────────────────────────
function getCohortTrends(req, res, next) {
  try {
    // Weekly averages for last 4 complete weeks + current partial week
    const weeklyCheckins = db.prepare(`
      SELECT
        strftime('%Y-W%W', timestamp) AS week,
        date(timestamp, 'weekday 1', '-7 days') AS week_start,
        ROUND(AVG(layer1_energy), 1)      AS avg_energy,
        ROUND(AVG(computed_readiness), 0) AS avg_readiness,
        COUNT(DISTINCT user_id)           AS active_users,
        COUNT(*)                          AS total_checkins
      FROM daily_checkins
      WHERE timestamp >= datetime('now', '-35 days')
      GROUP BY week
      ORDER BY week DESC
      LIMIT 5
    `).all();

    // Weekly workout counts + avg effort signal (numeric mapping)
    const weeklyWorkouts = db.prepare(`
      SELECT
        strftime('%Y-W%W', timestamp) AS week,
        COUNT(*) AS total_workouts,
        COUNT(DISTINCT user_id) AS users_who_worked_out,
        ROUND(AVG(CASE effort_rating
          WHEN 'easy'      THEN 1
          WHEN 'moderate'  THEN 2
          WHEN 'hard'      THEN 3
          WHEN 'very_hard' THEN 4
          WHEN '1' THEN 1 WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5
          ELSE NULL
        END), 1) AS avg_effort_score
      FROM post_session_feedback
      WHERE timestamp >= datetime('now', '-35 days')
      GROUP BY week
      ORDER BY week DESC
      LIMIT 5
    `).all();

    // Merge by week key
    const workoutMap = {};
    weeklyWorkouts.forEach(w => { workoutMap[w.week] = w; });

    const trends = weeklyCheckins.map(row => ({
      week:               row.week,
      week_start:         row.week_start,
      avg_energy:         row.avg_energy,
      avg_readiness:      row.avg_readiness,
      active_users:       row.active_users,
      total_checkins:     row.total_checkins,
      total_workouts:     workoutMap[row.week]?.total_workouts ?? 0,
      avg_effort_score:   workoutMap[row.week]?.avg_effort_score ?? null,
    }));

    // Effort distribution over last 30 days for breakdown chart
    const effortBreakdown = db.prepare(`
      SELECT effort_rating, COUNT(*) AS n
      FROM post_session_feedback
      WHERE timestamp >= datetime('now', '-30 days') AND effort_rating IS NOT NULL
      GROUP BY effort_rating
      ORDER BY n DESC
    `).all();

    res.json({ trends, effort_breakdown: effortBreakdown });
  } catch (err) { next(err); }
}

// ── User list (cohort activity + progress view — no raw health values) ────────
function getUsers(req, res, next) {
  try {
    const users = db.prepare(`
      SELECT
        u.id,
        u.email,
        u.created_at,
        up.menopause_stage,
        up.onboarding_complete,
        COALESCE(up.current_streak, 0) AS current_streak,
        CASE WHEN (
          up.oura_access_token IS NOT NULL OR
          up.whoop_access_token IS NOT NULL OR
          up.fitbit_access_token IS NOT NULL OR
          up.withings_access_token IS NOT NULL OR
          up.garmin_oauth_token IS NOT NULL
        ) THEN 1 ELSE 0 END AS wearable_connected,

        -- Self-reported: avg energy and readiness over last 7 days
        (
          SELECT ROUND(AVG(dc2.layer1_energy), 1)
          FROM daily_checkins dc2
          WHERE dc2.user_id = u.id
            AND dc2.timestamp >= datetime('now', '-7 days')
        ) AS avg_energy_7d,
        (
          SELECT ROUND(AVG(dc3.computed_readiness), 0)
          FROM daily_checkins dc3
          WHERE dc3.user_id = u.id
            AND dc3.timestamp >= datetime('now', '-7 days')
        ) AS avg_readiness_7d,

        -- Most recent workout effort rating
        (
          SELECT psf3.effort_rating
          FROM post_session_feedback psf3
          WHERE psf3.user_id = u.id
          ORDER BY psf3.timestamp DESC
          LIMIT 1
        ) AS latest_effort,

        -- Wearable recovery signal: avg recovery/readiness score from any connected device (last 7d)
        -- Uses 0-100 scale signals only (Oura readiness, WHOOP recovery, Garmin sleep score)
        (
          SELECT ROUND(AVG(r), 0) FROM (
            SELECT readiness_score AS r FROM oura_daily_data
              WHERE user_id = u.id AND date >= date('now', '-7 days') AND readiness_score IS NOT NULL
            UNION ALL
            SELECT recovery_score FROM whoop_daily_data
              WHERE user_id = u.id AND date >= date('now', '-7 days') AND recovery_score IS NOT NULL
            UNION ALL
            SELECT sleep_score FROM garmin_daily_data
              WHERE user_id = u.id AND date >= date('now', '-7 days') AND sleep_score IS NOT NULL
          )
        ) AS avg_wearable_recovery_7d,

        -- Total activity counts
        (
          SELECT COUNT(*) FROM daily_checkins dc
          WHERE dc.user_id = u.id
        ) AS total_checkins,
        (
          SELECT COUNT(*) FROM post_session_feedback psf
          WHERE psf.user_id = u.id
        ) AS total_workouts,
        (
          SELECT MAX(COALESCE(dc2.checkin_date, date(dc2.timestamp)))
          FROM daily_checkins dc2 WHERE dc2.user_id = u.id
        ) AS last_checkin,
        (
          SELECT COUNT(*) FROM post_session_feedback psf2
          WHERE psf2.user_id = u.id
            AND psf2.timestamp >= datetime('now', '-7 days')
        ) AS sessions_this_week

      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      ORDER BY u.created_at DESC
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

// ── Waitlist ──────────────────────────────────────────────────────────────────
function getWaitlist(req, res, next) {
  try {
    const rows = db.prepare(`SELECT * FROM waitlist ORDER BY created_at DESC`).all();
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = {
  getStats, getCohortTrends,
  getUsers, deleteUser,
  getResources, createResource, updateResource, deleteResource,
  getWaitlist,
};
