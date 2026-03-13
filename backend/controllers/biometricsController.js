const db = require('../db/database');

function energySuggestionFromReadiness(score) {
  if (score <= 40) return 20;
  if (score <= 60) return 40;
  if (score <= 80) return 65;
  return 85;
}

function energySuggestionFromApple(hrv, sleepMin) {
  let score = 65;
  if (hrv !== null) {
    if (hrv < 25)      score -= 15;
    else if (hrv > 60) score += 10;
  }
  if (sleepMin !== null) {
    if (sleepMin < 330) score -= 15;
    else if (sleepMin > 450) score += 5;
  }
  score = Math.max(0, Math.min(100, score));
  return energySuggestionFromReadiness(score);
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const oura = db.prepare(
      'SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const whoop = db.prepare(
      'SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    // If we have either Oura or Whoop, combine them
    if (oura || whoop) {
      // Sleep: Oura has priority, fall back to Whoop
      const sleepSource = oura ? 'oura' : 'whoop';
      const sleepScore     = oura ? oura.sleep_score         : whoop.sleep_performance;
      const totalSleepMin  = oura ? oura.total_sleep_min     : whoop.total_sleep_min;
      const remSleepMin    = oura ? oura.rem_sleep_min       : whoop.rem_sleep_min;
      const deepSleepMin   = oura ? oura.deep_sleep_min      : whoop.deep_sleep_min;

      // Recovery: Whoop has priority, fall back to Oura
      const recoverySource = whoop ? 'whoop' : 'oura';
      const recoveryScore  = whoop ? whoop.recovery_score    : oura.readiness_score;

      // HRV
      const hrvBalance = oura ? oura.hrv_balance_score : null;
      const hrvRmssd   = whoop ? whoop.hrv_rmssd_ms    : null;

      // Resting HR: Oura priority
      const restingHr = oura ? oura.resting_hr : whoop?.resting_hr ?? null;

      // Temp flag: Oura body temp deviation
      const bodyTempDeviation = oura ? oura.body_temp_deviation : null;
      const tempFlag = typeof bodyTempDeviation === 'number' && bodyTempDeviation > 0.4;

      // Energy suggestion from best available readiness
      const readinessForEnergy = whoop ? whoop.recovery_score : (oura ? oura.readiness_score : 65);

      return res.json({
        // Per-metric sources
        sleep_source:        sleepSource,
        recovery_source:     recoverySource,
        // Sleep data (Oura priority)
        sleep_score:         sleepScore,
        total_sleep_min:     totalSleepMin,
        rem_sleep_min:       remSleepMin,
        deep_sleep_min:      deepSleepMin,
        // Recovery data (Whoop priority)
        recovery_score:      recoveryScore,
        // HRV
        hrv_balance:         hrvBalance,
        hrv_rmssd_ms:        hrvRmssd,
        // Other
        resting_hr:          restingHr,
        body_temp_deviation: bodyTempDeviation,
        steps:               oura ? oura.steps : null,
        respiratory_rate:    whoop ? whoop.respiratory_rate : null,
        strain_score:        whoop ? whoop.strain_score : null,
        spo2_percentage:     whoop ? whoop.spo2_percentage : null,
        energy_suggestion:   energySuggestionFromReadiness(readinessForEnergy ?? 65),
        temp_flag:           tempFlag,
      });
    }

    // Priority 3: Apple Health
    const apple = db.prepare(
      'SELECT * FROM apple_health_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (apple) {
      return res.json({
        sleep_source:        'apple_health',
        recovery_source:     null,
        sleep_score:         null,
        recovery_score:      null,
        hrv_balance:         null,
        hrv_rmssd_ms:        null,
        resting_hr:          apple.resting_hr,
        total_sleep_min:     apple.sleep_min,
        rem_sleep_min:       null,
        deep_sleep_min:      null,
        body_temp_deviation: null,
        steps:               apple.step_count,
        energy_suggestion:   energySuggestionFromApple(apple.hrv_ms, apple.sleep_min),
        temp_flag:           false,
      });
    }

    res.json({ source: null });
  } catch (err) {
    next(err);
  }
}

module.exports = { getToday };
