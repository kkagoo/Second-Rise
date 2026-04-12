const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const db      = require('../db/database');

const buildSample = () => ({
  date:               new Date().toISOString().slice(0, 10),
  sourceSummary:      'Sample data',
  sleepScore:         72,
  recoveryScore:      68,
  hrv:                45.0,
  restingHr:          58,
  readinessScore:     62,
  recommendation:     'WALK',
  explanation:        'Using sample data — connect Oura or WHOOP in your profile to see real data.',
  lastUpdatedEpochMs: Date.now(),
});

function buildExplanation(recommendation, score) {
  switch (recommendation) {
    case 'STRENGTH':
      return `Readiness ${score}/100 — your body is primed for a strength session today.`;
    case 'WALK':
      return `Readiness ${score}/100 — moderate recovery supports a brisk walk or light cardio.`;
    default:
      return `Readiness ${score}/100 — prioritize gentle mobility work and rest today.`;
  }
}

router.get('/snapshot', auth, (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const oura = db.prepare(`
      SELECT sleep_score, hrv_balance_score, resting_hr
      FROM oura_daily_data
      WHERE user_id = ?
      ORDER BY date DESC LIMIT 1
    `).get(req.userId);

    const whoop = db.prepare(`
      SELECT recovery_score, hrv_rmssd_ms, resting_hr, sleep_performance
      FROM whoop_daily_data
      WHERE user_id = ?
      ORDER BY date DESC LIMIT 1
    `).get(req.userId);

    const rec = db.prepare(`
      SELECT primary_session_type
      FROM recommendations
      WHERE user_id = ?
      ORDER BY timestamp DESC LIMIT 1
    `).get(req.userId);

    if (!oura && !whoop && !rec) return res.json(buildSample());

    const recommendation = rec?.primary_session_type?.toUpperCase() ?? 'WALK';
    const readinessScore = recommendation === 'STRENGTH' ? 85
      : recommendation === 'WALK' ? 65
      : 35;

    const sources = [];
    if (oura)  sources.push('Oura');
    if (whoop) sources.push('WHOOP');

    res.json({
      date:               today,
      sourceSummary:      sources.join(' + ') || 'Sample data',
      sleepScore:         oura?.sleep_score         ?? null,
      recoveryScore:      whoop?.recovery_score      ?? null,
      hrv:                whoop?.hrv_rmssd_ms        ?? null,
      restingHr:          whoop?.resting_hr ?? oura?.resting_hr ?? null,
      readinessScore:     Math.round(readinessScore),
      recommendation,
      explanation:        buildExplanation(recommendation, Math.round(readinessScore)),
      lastUpdatedEpochMs: Date.now(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;