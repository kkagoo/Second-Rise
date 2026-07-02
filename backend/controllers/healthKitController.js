const db = require('../db/database');

function syncToday(req, res, next) {
  try {
    const {
      resting_hr, hrv_ms, spo2, step_count,
      sleep_min, deep_sleep_min, rem_sleep_min,
      // Also accept Health Connect-style names in case the iOS plugin sends them
      hrv_rmssd, steps, total_sleep_min,
    } = req.body;

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

    // Normalise field names — HealthKit plugin may send either convention
    const finalHrv      = hrv_ms      ?? hrv_rmssd     ?? null;
    const finalSteps    = step_count  ?? steps          ?? null;
    const finalSleepMin = sleep_min   ?? total_sleep_min ?? null;

    db.prepare(`
      INSERT INTO apple_health_data
        (user_id, date, resting_hr, hrv_ms, step_count, sleep_min, imported_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, date) DO UPDATE SET
        resting_hr  = COALESCE(excluded.resting_hr,  resting_hr),
        hrv_ms      = COALESCE(excluded.hrv_ms,      hrv_ms),
        step_count  = COALESCE(excluded.step_count,  step_count),
        sleep_min   = COALESCE(excluded.sleep_min,   sleep_min),
        imported_at = datetime('now')
    `).run(
      req.userId, today,
      resting_hr  ?? null,
      finalHrv,
      finalSteps,
      finalSleepMin,
    );

    const row = db.prepare(
      'SELECT * FROM apple_health_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

module.exports = { syncToday };
