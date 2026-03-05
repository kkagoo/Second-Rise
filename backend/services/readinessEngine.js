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

  // Biometric modifiers
  if (biometrics) {
    const hrv = biometrics.hrv_balance ?? null;
    if (hrv !== null) {
      if (hrv < 40) score -= 8;
      if (hrv > 65) score += 5;
    }

    const sleepScore = biometrics.sleep_score ?? null;
    if (sleepScore !== null) {
      if (sleepScore < 55)                         score -= 12;
      else if (sleepScore >= 55 && sleepScore <= 70) score -= 5;
      else if (sleepScore > 85)                    score += 3;
    } else {
      // Apple Health path — use total_sleep_min
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

module.exports = { computeReadiness };
