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

    const readiness = computeReadiness(req.userId, checkinData, profile);

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
