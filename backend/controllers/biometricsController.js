const db = require('../db/database');

function energySuggestionFromReadiness(score) {
  if (score <= 40) return 20;
  if (score <= 60) return 40;
  if (score <= 80) return 65;
  return 85;
}

function energySuggestionFromApple(hrv, sleepMin) {
  // Rough heuristic when no readiness score available
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

    // Prefer Oura
    const oura = db.prepare(
      'SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (oura) {
      const tempFlag = typeof oura.body_temp_deviation === 'number'
        ? oura.body_temp_deviation > 0.4
        : false;
      return res.json({
        source:              'oura',
        readiness_score:     oura.readiness_score,
        sleep_score:         oura.sleep_score,
        hrv_balance:         oura.hrv_balance_score,
        resting_hr:          oura.resting_hr,
        total_sleep_min:     oura.total_sleep_min,
        rem_sleep_min:       oura.rem_sleep_min,
        deep_sleep_min:      oura.deep_sleep_min,
        body_temp_deviation: oura.body_temp_deviation,
        steps:               oura.steps,
        energy_suggestion:   energySuggestionFromReadiness(oura.readiness_score ?? 65),
        temp_flag:           tempFlag,
      });
    }

    // Fall back to Apple Health
    const apple = db.prepare(
      'SELECT * FROM apple_health_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (apple) {
      return res.json({
        source:              'apple_health',
        readiness_score:     null,
        sleep_score:         null,
        hrv_balance:         null,
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
