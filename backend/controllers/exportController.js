const db = require('../db/database');

function toCSV(headers, rows, mapper) {
  const header = headers.join(',') + '\n';
  const body = rows.map((r) => mapper(r).map((v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, "'")}"` : s;
  }).join(',')).join('\n');
  return header + body;
}

// ── Check-ins CSV ─────────────────────────────────────────────────────────────
function exportCheckinCSV(req, res, next) {
  try {
    const rows = db.prepare(`
      SELECT date(timestamp) AS date, layer1_energy, layer1_time_avail,
             pain_flagged, body_map_flags, computed_readiness
      FROM daily_checkins WHERE user_id = ? ORDER BY timestamp DESC
    `).all(req.userId);

    const csv = toCSV(
      ['Date', 'Energy', 'Time Available', 'Pain Flagged', 'Body Areas', 'Readiness'],
      rows,
      (r) => [
        r.date, r.layer1_energy, r.layer1_time_avail,
        r.pain_flagged ? 'Yes' : 'No',
        r.body_map_flags ? JSON.parse(r.body_map_flags).join('; ') : '',
        r.computed_readiness,
      ]
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="checkin-history.csv"');
    res.send(csv);
  } catch (err) { next(err); }
}

// ── Full data export (all tables, multi-section CSV) ─────────────────────────
function exportAllDataCSV(req, res, next) {
  try {
    const checkins = db.prepare(`
      SELECT date(timestamp) AS date, layer1_energy, layer1_time_avail,
             pain_flagged, body_map_flags, computed_readiness
      FROM daily_checkins WHERE user_id = ? ORDER BY timestamp DESC
    `).all(req.userId);

    const sessions = db.prepare(`
      SELECT date(psf.timestamp) AS date, r.primary_session_type AS session_type,
             dc.layer1_energy AS energy, dc.computed_readiness AS readiness,
             psf.effort_rating AS effort, psf.notes
      FROM post_session_feedback psf
      JOIN recommendations r  ON r.rec_id     = psf.rec_id  AND r.user_id = psf.user_id
      JOIN daily_checkins  dc ON dc.checkin_id = r.checkin_id AND dc.user_id = psf.user_id
      WHERE psf.user_id = ? ORDER BY psf.timestamp DESC
    `).all(req.userId);

    const activities = db.prepare(`
      SELECT activity_date AS date, category, activity, duration_min, intensity, notes, source
      FROM activity_log WHERE user_id = ? ORDER BY activity_date DESC
    `).all(req.userId);

    // Combine into one CSV with section headers
    const parts = [];

    parts.push('=== CHECK-IN HISTORY ===');
    parts.push(toCSV(
      ['Date', 'Energy', 'Time Available', 'Pain Flagged', 'Body Areas', 'Readiness'],
      checkins,
      (r) => [r.date, r.layer1_energy, r.layer1_time_avail, r.pain_flagged ? 'Yes' : 'No',
              r.body_map_flags ? JSON.parse(r.body_map_flags).join('; ') : '', r.computed_readiness]
    ));

    parts.push('\n=== SESSION HISTORY (App Guided) ===');
    parts.push(toCSV(
      ['Date', 'Session Type', 'Energy', 'Readiness', 'Effort', 'Notes'],
      sessions,
      (r) => [r.date, r.session_type, r.energy, r.readiness, (r.effort || '').replace(/_/g, ' '), r.notes || '']
    ));

    parts.push('\n=== ACTIVITY LOG (Manual + Video) ===');
    parts.push(toCSV(
      ['Date', 'Category', 'Activity', 'Duration (min)', 'Intensity', 'Source', 'Notes'],
      activities,
      (r) => [r.date, r.category, r.activity, r.duration_min || '', r.intensity || '', r.source || 'manual', r.notes || '']
    ));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="second-rise-data-export.csv"');
    res.send(parts.join('\n'));
  } catch (err) { next(err); }
}

module.exports = { exportCheckinCSV, exportAllDataCSV };
