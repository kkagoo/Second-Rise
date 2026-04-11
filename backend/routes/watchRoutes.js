const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const db      = require('../db/database');

// ── Fallback used when the user has no data synced yet ───────────────────────
const buildSample = () => ({
  date:              new Date().toISOString().slice(0, 10),
  sourceSummary:     'Sample data',
  sleepScore:        72,
  recoveryScore:     null,
  hrv:               45.0,
  restingHr:         58,
  readinessScore:    62,
  recommendation:    'WALK',
  explanation:       'Using sample data — connect Oura or WHOOP in your profile to see real data.',
  lastUpdatedEpochMs: Date.now(),
});

// ── Normalization helpers ────────────────────────────────────────────────────

// WHOOP hrv_rmssd_ms (ms) → 0–100  (typical range 20–100 ms)
function normalizeHrvMs(ms) {
  if (ms == null) return null;
  return Math.max(0, Math.min(100, (ms - 20) / 80 * 100));
}

// Resting HR (bpm) → 0–100, lower HR = higher score  (clamped 40–80 bpm)
function normalizeRhr(bpm) {
  if (bpm == null) return null;
  return Math.max(0, Math.min(100, (80 - bpm) / 40 * 100));
}

// ── Readiness formula ────────────────────────────────────────────────────────
function computeReadiness({ whoopRecovery, sleepScore, normalizedHrv, normalizedRhr }) {
  // Fill unknowns with a neutral 50
  const sleep = sleepScore    ?? 50;
  const hrv   = normalizedHrv ?? 50;
  const rhr   = normalizedRhr ?? 50;

  if (whoopRecovery != null) {
    return 0.7 * whoopRecovery + 0.15 * sleep + 0.15 * hrv;
  }
  return 0.4 * sleep + 0.35 * hrv + 0.25 * rhr;
}

function toRecommendation(score) {
  if (score >= 75) return 'STRENGTH';
  if (score >= 45) return 'WALK';
  return 'MOBILITY';
}

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

// ── GET /api/watch/snapshot ──────────────────────────────────────────────────
router.get('/snapshot', auth, (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Pull today's cached rows (written by /api/oura/sync and /api/whoop/sync)
    const oura = db.prepare(`
      SELECT sleep_score, hrv_balance_score, resting_hr
      FROM oura_daily_data
      WHERE user_id = ? AND date = ?
    `).get(req.userId, today);

    const whoop = db.prepare(`
      SELECT recovery_score, hrv_rmssd_ms, resting_hr, sleep_performance
      FROM whoop_daily_data
      WHERE user_id = ? AND date = ?
    `).get(req.userId, today);

    if (!oura && !whoop) {
      return res.json(buildSample());
    }

    // Source priority:
    //   recovery  → WHOOP first
    //   sleep     → Oura first, fall back to WHOOP sleep_performance
    //   HRV       → WHOOP hrv_rmssd_ms first (normalized), then Oura hrv_balance_score (already 0–100)
    //   resting HR → WHOOP first, then Oura
    const whoopRecovery = whoop?.recovery_score    ?? null;
    const sleepScore    = oura?.sleep_score        ?? whoop?.sleep_performance ?? null;
    const whoopHrvMs    = whoop?.hrv_rmssd_ms      ?? null;
    const ouraHrvScore  = oura?.hrv_balance_score  ?? null;   // already 0–100
    const restingHr     = whoop?.resting_hr        ?? oura?.resting_hr ?? null;

    const normalizedHrv = whoopHrvMs != null
      ? normalizeHrvMs(whoopHrvMs)
      : ouraHrvScore;                       // Oura score is already 0–100

    const normalizedRhr = normalizeRhr(restingHr);

    const rawReadiness    = computeReadiness({ whoopRecovery, sleepScore, normalizedHrv, normalizedRhr });
    const readinessScore  = Math.round(Math.max(0, Math.min(100, rawReadiness)));
    const recommendation  = toRecommendation(readinessScore);

    const sources = [];
    if (oura)  sources.push('Oura');
    if (whoop) sources.push('WHOOP');

    const snapshot = {
      date:              today,
      sourceSummary:     sources.join(' + '),
      sleepScore:        sleepScore    != null ? Math.round(sleepScore)              : null,
      recoveryScore:     whoopRecovery != null ? Math.round(whoopRecovery)           : null,
      hrv:               whoopHrvMs   != null ? Math.round(whoopHrvMs   * 10) / 10  : null,
      restingHr:         restingHr    != null ? Math.round(restingHr)               : null,
      readinessScore,
      recommendation,
      explanation:       buildExplanation(recommendation, readinessScore),
      lastUpdatedEpochMs: Date.now(),
    };

    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
