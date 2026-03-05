const db = require('../db/database');
const { computeReadiness } = require('../services/readinessEngine');

function submitCheckin(req, res, next) {
  try {
    const { layer1_energy, layer1_time_avail, pain_flagged, body_map_flags, secondary_flags } = req.body;

    if (!layer1_energy || !layer1_time_avail) {
      return res.status(400).json({ error: 'Energy and time available are required' });
    }

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId);

    const checkinData = {
      layer1_energy,
      body_map_flags: body_map_flags ? JSON.stringify(body_map_flags) : null,
      secondary_flags: secondary_flags ? JSON.stringify(secondary_flags) : null,
    };

    const today = new Date().toISOString().slice(0, 10);
    let biometrics = null;
    try {
      const oura = db.prepare('SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?').get(req.userId, today);
      if (oura) {
        biometrics = {
          source:            'oura',
          hrv_balance:       oura.hrv_balance_score,
          sleep_score:       oura.sleep_score,
          total_sleep_min:   oura.total_sleep_min,
          body_temp_deviation: oura.body_temp_deviation,
          temp_flag:         typeof oura.body_temp_deviation === 'number' && oura.body_temp_deviation > 0.4,
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
    } catch { /* no biometrics available */ }

    const readiness = computeReadiness(req.userId, checkinData, profile, biometrics);

    const result = db.prepare(`
      INSERT INTO daily_checkins
        (user_id, layer1_energy, layer1_time_avail, pain_flagged, body_map_flags, secondary_flags, computed_readiness)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId,
      layer1_energy,
      layer1_time_avail,
      pain_flagged ? 1 : 0,
      checkinData.body_map_flags,
      checkinData.secondary_flags,
      readiness,
    );

    res.status(201).json({ checkin_id: result.lastInsertRowid, computed_readiness: readiness });
  } catch (err) {
    next(err);
  }
}

function getTodayCheckin(req, res, next) {
  try {
    const checkin = db.prepare(`
      SELECT * FROM daily_checkins
      WHERE user_id = ? AND date(timestamp) = date('now')
      ORDER BY timestamp DESC LIMIT 1
    `).get(req.userId);

    if (!checkin) return res.json(null);

    if (checkin.body_map_flags) checkin.body_map_flags = JSON.parse(checkin.body_map_flags);
    if (checkin.secondary_flags) checkin.secondary_flags = JSON.parse(checkin.secondary_flags);

    res.json(checkin);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitCheckin, getTodayCheckin };
