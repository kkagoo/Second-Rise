const db = require('../db/database');

function syncToday(req, res, next) {
  try {
    const {
      resting_hr, hrv_rmssd, spo2, steps,
      total_sleep_min, deep_sleep_min, rem_sleep_min, light_sleep_min,
      sleep_score,
    } = req.body;

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

    db.prepare(`
      INSERT INTO health_connect_daily_data
        (user_id, date, resting_hr, hrv_rmssd, spo2, steps,
         total_sleep_min, deep_sleep_min, rem_sleep_min, light_sleep_min, sleep_score, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, date) DO UPDATE SET
        resting_hr      = excluded.resting_hr,
        hrv_rmssd       = excluded.hrv_rmssd,
        spo2            = excluded.spo2,
        steps           = excluded.steps,
        total_sleep_min = excluded.total_sleep_min,
        deep_sleep_min  = excluded.deep_sleep_min,
        rem_sleep_min   = excluded.rem_sleep_min,
        light_sleep_min = excluded.light_sleep_min,
        sleep_score     = excluded.sleep_score,
        synced_at       = datetime('now')
    `).run(
      req.userId, today,
      resting_hr ?? null, hrv_rmssd ?? null, spo2 ?? null, steps ?? null,
      total_sleep_min ?? null, deep_sleep_min ?? null,
      rem_sleep_min ?? null, light_sleep_min ?? null,
      sleep_score ?? null,
    );

    const row = db.prepare(
      'SELECT * FROM health_connect_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

module.exports = { syncToday };
