const db = require('../db/database');

function computeReadiness(userId, checkinData, profile, biometrics = null) {
  const { layer1_energy, body_map_flags, secondary_flags } = checkinData;

  let score = layer1_energy; // base: 20 | 40 | 65 | 85

  // Pain penalties per flagged region at moderate/severe
  const flags = body_map_flags ? JSON.parse(body_map_flags) : [];
  for (const flag of flags) {
    if (flag.severity === 'moderate' || flag.severity === 'severe') {
      score -= 5;
    }
  }

  // Secondary symptom penalties
  const secondary = secondary_flags ? JSON.parse(secondary_flags) : {};
  if (secondary.gi_bloating)  score -= 8;
  if (secondary.hot_flashes)  score -= 10;
  if (secondary.brain_fog)    score -= 5;

  // Prior session feedback adjustments
  try {
    const yesterday = db.prepare(`
      SELECT psf.effort_rating, psf.flare_up_regions
      FROM post_session_feedback psf
      JOIN recommendations r ON psf.rec_id = r.rec_id
      JOIN daily_checkins dc ON r.checkin_id = dc.checkin_id
      WHERE dc.user_id = ?
        AND date(dc.timestamp) = date('now', '-1 day')
      ORDER BY psf.timestamp DESC
      LIMIT 1
    `).get(userId);

    if (yesterday) {
      if (yesterday.effort_rating === 'too_much') score -= 10;
      if (yesterday.effort_rating === 'too_easy') score += 5;
      const flareRegions = yesterday.flare_up_regions
        ? JSON.parse(yesterday.flare_up_regions)
        : [];
      if (flareRegions.length > 0) score -= 8;
    }
  } catch {
    // No prior data — skip
  }

  // Profile guardrails
  if (profile) {
    if (profile.bone_health === 'osteopenia' || profile.bone_health === 'osteoporosis') {
      score = Math.max(score, 25);
    }
    if (profile.activity_baseline === 'sedentary') {
      try {
        const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(userId);
        if (user) {
          const daysSince = Math.floor(
            (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSince <= 14) score = Math.min(score, 65);
        }
      } catch {
        // skip
      }
    }
  }

  // Self-reported sleep quality (1–5 scale) — only applied when no wearable biometrics
  if (!biometrics && checkinData.sleep_quality != null) {
    const sq = Number(checkinData.sleep_quality);
    if (sq === 1)      score -= 15;
    else if (sq === 2) score -= 10;
    else if (sq === 3) score -= 3;
    else if (sq >= 5)  score += 3;
  }

  // Menstruation signal — mild fatigue adjustment
  if (checkinData.menstruating === 'yes') {
    score -= 5;
  }

  // Biometric modifiers
  if (biometrics) {
    const hrv = biometrics.hrv_balance ?? null;
    if (hrv !== null) {
      if (hrv < 40) score -= 8;
      if (hrv > 65) score += 5;
    }

    // Treat sleep_score of 0 as missing data — Health Connect can produce 0
    // for nights with no wear data, which would unfairly penalise the score
    const sleepScore = (biometrics.sleep_score != null && biometrics.sleep_score > 0)
      ? biometrics.sleep_score : null;
    if (sleepScore !== null) {
      if (sleepScore < 55)                         score -= 12;
      else if (sleepScore >= 55 && sleepScore <= 70) score -= 5;
      else if (sleepScore > 85)                    score += 3;
    } else {
      // Fall back to raw sleep duration (Google Health, Apple Health, etc.)
      const sleepMin = biometrics.total_sleep_min ?? null;
      if (sleepMin !== null) {
        if (sleepMin < 330) score -= 10;
        if (sleepMin > 450) score += 3;
      }
    }

    if (biometrics.temp_flag && !secondary.hot_flashes) {
      score -= 5;
    }
  }

  return Math.max(0, Math.min(85, score));
}

/**
 * Estimate readiness purely from wearable biometrics — no check-in required.
 * Used on the home screen before the user has checked in today.
 * Returns null if there isn't enough data to make a meaningful estimate.
 */
function estimateBiometricReadiness(biometrics) {
  if (!biometrics) return null;

  const { recovery_score, sleep_score, total_sleep_min, hrv_rmssd_ms, hrv_balance, resting_hr, strain_score } = biometrics;

  // Whoop/Oura recovery score is already a readiness signal — use it directly
  if (recovery_score != null) return Math.max(10, Math.min(85, Math.round(recovery_score)));

  // Need at least one meaningful signal
  const hasSignal = (sleep_score > 0) || total_sleep_min != null || hrv_rmssd_ms != null
    || hrv_balance != null || resting_hr != null || strain_score != null;
  if (!hasSignal) return null;

  let score = 65; // neutral baseline

  // Sleep score (Oura, Health Connect, Whoop sleep_performance)
  if (sleep_score != null && sleep_score > 0) {
    if      (sleep_score > 85) score += 10;
    else if (sleep_score > 70) score += 3;
    else if (sleep_score < 55) score -= 15;
    else if (sleep_score < 70) score -= 8;
  } else if (total_sleep_min != null) {
    // Raw duration fallback (Google Health, Fitbit, etc.)
    if      (total_sleep_min >= 450) score += 8;
    else if (total_sleep_min >= 390) score += 3;
    else if (total_sleep_min < 300)  score -= 18;
    else if (total_sleep_min < 360)  score -= 10;
  }

  // HRV — suppressed HRV signals accumulated fatigue
  const hrv = hrv_balance ?? (hrv_rmssd_ms != null ? Math.round(hrv_rmssd_ms) : null);
  if (hrv != null) {
    if      (hrv > 65) score += 8;
    else if (hrv > 45) score += 3;
    else if (hrv < 30) score -= 10;
    else if (hrv < 40) score -= 5;
  }

  // Resting HR — elevated HR signals stress or fatigue
  if (resting_hr != null) {
    if      (resting_hr < 55) score += 5;
    else if (resting_hr > 75) score -= 8;
    else if (resting_hr > 68) score -= 4;
  }

  // Whoop strain — high yesterday strain suggests need for recovery today
  // Only used as a signal when nothing else is available (sleep not yet processed)
  if (strain_score != null && sleep_score == null && total_sleep_min == null && hrv == null && resting_hr == null) {
    if      (strain_score > 18) score -= 15; // very high strain
    else if (strain_score > 14) score -= 8;  // high strain
    else if (strain_score > 10) score -= 3;  // moderate strain
    else if (strain_score < 6)  score += 5;  // low strain, likely recovery day
  }

  return Math.max(10, Math.min(85, Math.round(score)));
}

module.exports = { computeReadiness, estimateBiometricReadiness };
