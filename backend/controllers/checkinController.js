const db = require('../db/database');
const { computeReadiness } = require('../services/readinessEngine');

function submitCheckin(req, res, next) {
  try {
    const { layer1_energy, layer1_time_avail, pain_flagged, body_map_flags, secondary_flags, workout_preference, localDate, sleep_quality, menstruating } = req.body;

    if (!layer1_energy || !layer1_time_avail) {
      return res.status(400).json({ error: 'Energy and time available are required' });
    }

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId);

    const checkinData = {
      layer1_energy,
      body_map_flags: body_map_flags ? JSON.stringify(body_map_flags) : null,
      secondary_flags: secondary_flags ? JSON.stringify(secondary_flags) : null,
      sleep_quality: sleep_quality != null ? Number(sleep_quality) : null,
      menstruating: menstruating || null,
    };

    // Use client's local date if provided (avoids UTC midnight rollover bug)
    const today = localDate || new Date().toISOString().slice(0, 10);
    let biometrics = null;
    try {
      const oura = db.prepare('SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
      if (oura) {
        biometrics = {
          source:              'oura',
          hrv_balance:         oura.hrv_balance_score,
          sleep_score:         oura.sleep_score,
          total_sleep_min:     oura.total_sleep_min,
          body_temp_deviation: oura.body_temp_deviation,
          temp_flag:           typeof oura.body_temp_deviation === 'number' && oura.body_temp_deviation > 0.4,
        };
      } else {
        const whoop = db.prepare('SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
        if (whoop) {
          biometrics = {
            source:          'whoop',
            hrv_balance:     null,
            sleep_score:     whoop.sleep_performance,
            total_sleep_min: whoop.total_sleep_min,
            temp_flag:       false,
          };
        } else {
          const hc = db.prepare('SELECT * FROM health_connect_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
          if (hc) {
            biometrics = {
              source:          'health_connect',
              hrv_balance:     null,
              sleep_score:     hc.sleep_score,
              total_sleep_min: hc.total_sleep_min,
              temp_flag:       false,
            };
          } else {
          const fitbit = db.prepare('SELECT * FROM fitbit_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
          if (fitbit) {
            biometrics = {
              source:          'fitbit',
              hrv_balance:     null,
              sleep_score:     null,
              total_sleep_min: fitbit.total_sleep_min,
              temp_flag:       false,
            };
          } else {
          const apple = db.prepare('SELECT * FROM apple_health_data WHERE user_id = ? AND date = ?').get(req.userId, today);
          if (apple) {
            biometrics = {
              source:          'apple_health',
              hrv_balance:     null,
              sleep_score:     null,
              total_sleep_min: apple.sleep_min,
              temp_flag:       false,
            };
          }
          }
          }
        }
      }
    } catch { /* no biometrics available */ }

    const readiness = computeReadiness(req.userId, checkinData, profile, biometrics);

    // Delete any existing recommendation for today so a fresh one is generated
    const todayStr = checkinData.checkin_date || new Date().toISOString().slice(0, 10);
    db.prepare(`
      DELETE FROM recommendations WHERE user_id = ?
        AND checkin_id IN (
          SELECT checkin_id FROM daily_checkins
          WHERE user_id = ? AND COALESCE(checkin_date, date(timestamp)) = ?
        )
    `).run(req.userId, req.userId, todayStr);

    const result = db.prepare(`
      INSERT INTO daily_checkins
        (user_id, layer1_energy, layer1_time_avail, pain_flagged, body_map_flags, secondary_flags, computed_readiness, workout_preference, checkin_date, sleep_quality, menstruating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      layer1_energy,
      layer1_time_avail,
      pain_flagged ? 1 : 0,
      checkinData.body_map_flags,
      checkinData.secondary_flags,
      readiness,
      workout_preference || null,
      today,
      checkinData.sleep_quality,
      checkinData.menstruating,
    );

    // Update streak
    const streak = computeStreak(req.userId, today);
    // Increment milestone counter when user hits a new 7-day milestone (each = $1 pledge to Girls Who Code)
    const prevStreak = db.prepare('SELECT current_streak FROM user_profiles WHERE user_id = ?').get(req.userId)?.current_streak ?? 0;
    const hitNewMilestone = streak > 0 && streak % 7 === 0 && prevStreak < streak;
    db.prepare(`
      UPDATE user_profiles
      SET current_streak    = ?,
          longest_streak    = MAX(longest_streak, ?),
          last_streak_date  = ?,
          streak_milestones = streak_milestones + ?
      WHERE user_id = ?
    `).run(streak, streak, today, hitNewMilestone ? 1 : 0, req.userId);

    res.status(201).json({ checkin_id: result.lastInsertRowid, computed_readiness: readiness, streak });
  } catch (err) {
    next(err);
  }
}

// Count consecutive days (ending today or yesterday) that have a checkin
function computeStreak(userId, today) {
  try {
    // Get all distinct checkin dates desc
    const rows = db.prepare(`
      SELECT DISTINCT COALESCE(checkin_date, date(timestamp)) AS d
      FROM daily_checkins
      WHERE user_id = ?
      ORDER BY d DESC
    `).all(userId);

    if (!rows.length) return 0;

    let streak = 0;
    let expected = today;

    for (const { d } of rows) {
      if (d === expected) {
        streak++;
        // Move expected back one day
        const dt = new Date(expected + 'T00:00:00Z');
        dt.setUTCDate(dt.getUTCDate() - 1);
        expected = dt.toISOString().slice(0, 10);
      } else if (d < expected) {
        break; // gap — streak ends
      }
      // d > expected means future dates (shouldn't happen), skip
    }
    return streak;
  } catch {
    return 0;
  }
}

function getTodayCheckin(req, res, next) {
  try {
    // Use client-provided local date if available, fall back to UTC
    const today = req.query.localDate || new Date().toISOString().slice(0, 10);
    const checkin = db.prepare(`
      SELECT * FROM daily_checkins
      WHERE user_id = ?
        AND COALESCE(checkin_date, date(timestamp)) = ?
      ORDER BY timestamp DESC LIMIT 1
    `).get(req.userId, today);

    if (!checkin) return res.json(null);

    if (checkin.body_map_flags) checkin.body_map_flags = JSON.parse(checkin.body_map_flags);
    if (checkin.secondary_flags) checkin.secondary_flags = JSON.parse(checkin.secondary_flags);

    // Check if the user already completed a session today (feedback submitted).
    // Use checkin_id (not timestamp date) to avoid UTC vs local-date mismatch.
    const feedbackToday = db.prepare(`
      SELECT 1 FROM post_session_feedback psf
      JOIN recommendations r ON r.rec_id = psf.rec_id
      WHERE psf.user_id = ?
        AND r.checkin_id = ?
      LIMIT 1
    `).get(req.userId, checkin.checkin_id);

    res.json({ ...checkin, session_done: !!feedbackToday });
  } catch (err) {
    next(err);
  }
}

function getStreak(req, res, next) {
  try {
    const profile = db.prepare('SELECT current_streak, longest_streak FROM user_profiles WHERE user_id = ?').get(req.userId);
    const today   = new Date().toISOString().slice(0, 10);
    // Recompute live in case the stored value is stale
    const current = computeStreak(req.userId, today);
    res.json({ current_streak: current, longest_streak: Math.max(current, profile?.longest_streak ?? 0) });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitCheckin, getTodayCheckin, getStreak };
