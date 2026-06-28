const db = require('../db/database');

const PLANNED_INTENSITY = {
  rest: 'low',
  recover: 'low',
  recovery: 'low',
  mobility: 'low',
  yoga: 'low',
  pilates: 'moderate',
  walk: 'moderate',
  walking: 'moderate',
  low_impact_cardio: 'moderate',
  cardio: 'moderate',
  strength: 'high',
  strength_upper: 'high',
  strength_lower: 'high',
  strength_full: 'high',
};

function getDate(date) {
  return date || new Date().toISOString().slice(0, 10);
}

function loadRecommendation(userId, date) {
  return db.prepare(`
    SELECT r.*, dc.computed_readiness
    FROM recommendations r
    JOIN daily_checkins dc ON r.checkin_id = dc.checkin_id
    WHERE r.user_id = ?
      AND date(dc.timestamp) = ?
    ORDER BY r.timestamp DESC
    LIMIT 1
  `).get(userId, date);
}

function loadFeedback(userId, recId) {
  if (!recId) return null;
  return db.prepare(`
    SELECT effort_rating, flare_up_regions, notes, energy_level, soreness_level
    FROM post_session_feedback
    WHERE user_id = ? AND rec_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `).get(userId, recId);
}

function loadWearableData(userId, date) {
  return {
    whoop:     db.prepare('SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?').get(userId, date),
    oura:      db.prepare('SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?').get(userId, date),
    apple:     db.prepare('SELECT * FROM apple_health_data WHERE user_id = ? AND date = ?').get(userId, date),
    fitbit:    db.prepare('SELECT * FROM fitbit_daily_data WHERE user_id = ? AND date = ?').get(userId, date),
    googleFit: db.prepare('SELECT * FROM google_fit_daily_data WHERE user_id = ? AND date = ?').get(userId, date),
    garmin:    db.prepare('SELECT * FROM garmin_daily_data WHERE user_id = ? AND date = ?').get(userId, date),
  };
}

function plannedIntensityFor(recommendation) {
  if (!recommendation) return 'unknown';
  const selected = recommendation.selected_session_type || recommendation.primary_session_type;
  return PLANNED_INTENSITY[selected] || PLANNED_INTENSITY[recommendation.body_focus] || 'moderate';
}

function getStepCount(wearable) {
  return wearable.apple?.step_count
    ?? wearable.fitbit?.step_count
    ?? wearable.googleFit?.step_count
    ?? wearable.garmin?.steps
    ?? wearable.oura?.steps
    ?? null;
}

function getSleepMin(wearable) {
  const garminSleepMin = wearable.garmin?.total_sleep_sec != null
    ? Math.round(wearable.garmin.total_sleep_sec / 60) : null;
  return wearable.whoop?.total_sleep_min
    ?? wearable.oura?.total_sleep_min
    ?? wearable.apple?.sleep_min
    ?? wearable.fitbit?.total_sleep_min
    ?? wearable.googleFit?.total_sleep_min
    ?? garminSleepMin
    ?? null;
}

function getRecoveryScore(wearable) {
  return wearable.whoop?.recovery_score ?? wearable.oura?.readiness_score ?? null;
}

function actualLoadFrom(wearable) {
  const strain = wearable.whoop?.strain_score ?? null;
  if (typeof strain === 'number') {
    if (strain >= 14) return 'high';
    if (strain >= 8) return 'moderate';
    return 'low';
  }

  const activity = wearable.oura?.activity_score ?? null;
  if (typeof activity === 'number') {
    if (activity >= 85) return 'high';
    if (activity >= 65) return 'moderate';
    return 'low';
  }

  const steps = getStepCount(wearable);
  if (typeof steps === 'number') {
    if (steps >= 10000) return 'high';
    if (steps >= 5000) return 'moderate';
    return 'low';
  }

  return 'unknown';
}

function intensityRank(intensity) {
  return { unknown: -1, low: 0, moderate: 1, high: 2 }[intensity] ?? -1;
}

function evaluateStatus(planned, actual, feedback) {
  if (feedback?.effort_rating === 'too_much') return 'over';
  if (feedback?.effort_rating === 'didnt_finish') return 'under';
  if (planned === 'unknown' || actual === 'unknown') return 'unknown';

  const delta = intensityRank(actual) - intensityRank(planned);
  if (delta >= 1) return 'over';
  if (delta <= -1) return 'under';
  return 'followed';
}

function buildCopy({ status, planned, strain, steps, feedback, hasWearable }) {
  const metric = strain != null
    ? `WHOOP strain ended at ${strain}.`
    : steps != null
      ? `Steps ended at ${steps}.`
      : null;

  if (status === 'over') {
    return {
      summary: `You went above the ${planned} plan.${metric ? ` ${metric}` : ''}`,
      recommendation: 'Treat tomorrow as recovery-focused unless your morning readiness is clearly high.',
    };
  }

  if (status === 'under') {
    return {
      summary: `You stayed below the ${planned} plan.${metric ? ` ${metric}` : ''}`,
      recommendation: 'Keep tomorrow flexible and avoid making up missed work in one session.',
    };
  }

  if (status === 'followed') {
    return {
      summary: `You stayed close to the ${planned} plan.${metric ? ` ${metric}` : ''}`,
      recommendation: 'Use this as a positive signal for tomorrow, while still checking sleep and soreness.',
    };
  }

  // Unknown — no wearable, use self-reported energy/soreness if available
  if (!hasWearable && feedback) {
    const energy   = feedback.energy_level;
    const soreness = feedback.soreness_level;

    if (energy || soreness) {
      const energyText   = energy   === 'high'        ? 'energy was high'
                         : energy   === 'medium'      ? 'energy was moderate'
                         : energy   === 'low'         ? 'energy was low'
                         : null;
      const sorenessText = soreness === 'none'        ? 'no soreness'
                         : soreness === 'mild'        ? 'mild soreness'
                         : soreness === 'significant' ? 'significant soreness'
                         : null;

      const parts = [energyText, sorenessText].filter(Boolean);
      const selfReport = parts.length ? `You reported ${parts.join(' and ')}.` : '';

      const rec = soreness === 'significant'
        ? 'Give your body space to recover tomorrow — prioritise sleep and lighter movement.'
        : energy === 'low'
        ? 'Low energy after a session is normal. Check in with how you sleep tonight.'
        : 'You completed your session. Keep an eye on how you feel tomorrow morning.';

      return {
        summary: `${selfReport} Session logged for the ${planned} plan.`.trim(),
        recommendation: rec,
      };
    }
  }

  // True fallback — no wearable, no self-report
  return {
    summary: 'You completed your session.',
    recommendation: 'Keep an eye on how you feel tomorrow morning.',
  };
}

function buildEvidence({ recommendation, feedback, wearable }) {
  return {
    selected_session_type: recommendation?.selected_session_type ?? null,
    primary_session_type: recommendation?.primary_session_type ?? null,
    body_focus: recommendation?.body_focus ?? null,
    feedback_effort_rating: feedback?.effort_rating ?? null,
    whoop_synced_at: wearable.whoop?.synced_at ?? null,
    oura_synced_at: wearable.oura?.synced_at ?? null,
    apple_imported_at: wearable.apple?.imported_at ?? null,
    fitbit_synced_at: wearable.fitbit?.synced_at ?? null,
    google_fit_synced_at: wearable.googleFit?.synced_at ?? null,
  };
}

function parseReview(row) {
  if (!row) return null;
  return {
    ...row,
    evidence: row.evidence ? JSON.parse(row.evidence) : null,
  };
}

function evaluateDay(userId, rawDate) {
  const date = getDate(rawDate);
  const recommendation = loadRecommendation(userId, date);
  const feedback = loadFeedback(userId, recommendation?.rec_id);
  const wearable = loadWearableData(userId, date);

  const plannedIntensity = plannedIntensityFor(recommendation);
  const actualLoad = actualLoadFrom(wearable);
  const status = evaluateStatus(plannedIntensity, actualLoad, feedback);
  const strainScore = wearable.whoop?.strain_score ?? null;
  const stepCount = getStepCount(wearable);
  const sleepMin = getSleepMin(wearable);
  const recoveryScore = getRecoveryScore(wearable);
  const hasWearable = Object.values(wearable).some(Boolean);
  const copy = buildCopy({
    status,
    planned: plannedIntensity,
    strain: strainScore,
    steps: stepCount,
    feedback,
    hasWearable,
  });

  db.prepare(`
    INSERT INTO daily_wearable_reviews
      (user_id, date, rec_id, planned_session_type, planned_intensity, actual_load,
       adherence_status, strain_score, cardio_load, step_count, sleep_min, recovery_score,
       feedback_effort_rating, summary, recommendation, evidence, evaluated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      rec_id = excluded.rec_id,
      planned_session_type = excluded.planned_session_type,
      planned_intensity = excluded.planned_intensity,
      actual_load = excluded.actual_load,
      adherence_status = excluded.adherence_status,
      strain_score = excluded.strain_score,
      cardio_load = excluded.cardio_load,
      step_count = excluded.step_count,
      sleep_min = excluded.sleep_min,
      recovery_score = excluded.recovery_score,
      feedback_effort_rating = excluded.feedback_effort_rating,
      summary = excluded.summary,
      recommendation = excluded.recommendation,
      evidence = excluded.evidence,
      evaluated_at = datetime('now')
  `).run(
    userId,
    date,
    recommendation?.rec_id ?? null,
    recommendation?.selected_session_type || recommendation?.primary_session_type || null,
    plannedIntensity,
    actualLoad,
    status,
    strainScore,
    strainScore,
    stepCount,
    sleepMin,
    recoveryScore,
    feedback?.effort_rating ?? null,
    copy.summary,
    copy.recommendation,
    JSON.stringify(buildEvidence({ recommendation, feedback, wearable })),
  );

  return getReview(userId, date);
}

function getReview(userId, rawDate) {
  const date = getDate(rawDate);
  const row = db.prepare(
    'SELECT * FROM daily_wearable_reviews WHERE user_id = ? AND date = ?'
  ).get(userId, date);
  return parseReview(row);
}

module.exports = { evaluateDay, getReview };
