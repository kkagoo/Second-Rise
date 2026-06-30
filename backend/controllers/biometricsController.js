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

function energySuggestionFromFitbit(restingHr, sleepMin) {
  let score = 65;
  if (restingHr !== null) {
    if (restingHr > 72) score -= 10;
    else if (restingHr < 58) score += 5;
  }
  if (sleepMin !== null) {
    if (sleepMin < 330) score -= 15;
    else if (sleepMin > 450) score += 5;
  }
  score = Math.max(0, Math.min(100, score));
  return energySuggestionFromReadiness(score);
}

function energySuggestionFromGoogleFit(restingHr, sleepMin) {
  return energySuggestionFromFitbit(restingHr, sleepMin);
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

    // Always fetch all sources — lower-priority sources supplement higher-priority ones
    const googleFit = db.prepare(
      'SELECT * FROM google_fit_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const hc = db.prepare(
      'SELECT * FROM health_connect_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (oura || whoop) {
      // Sleep: Oura > WHOOP > Health Connect > Google Fit
      const sleepScore    = oura?.sleep_score ?? whoop?.sleep_performance ?? hc?.sleep_score ?? null;
      const totalSleepMin = oura?.total_sleep_min ?? whoop?.total_sleep_min ?? hc?.total_sleep_min ?? googleFit?.total_sleep_min ?? null;
      const remSleepMin   = oura?.rem_sleep_min ?? whoop?.rem_sleep_min ?? hc?.rem_sleep_min ?? googleFit?.rem_sleep_min ?? null;
      const deepSleepMin  = oura?.deep_sleep_min ?? whoop?.deep_sleep_min ?? hc?.deep_sleep_min ?? googleFit?.deep_sleep_min ?? null;

      const sleepSource = oura ? 'oura' : (whoop ? 'whoop' : 'google_fit');

      // Recovery: Whoop > Oura
      const recoverySource = whoop ? 'whoop' : 'oura';
      const recoveryScore  = whoop?.recovery_score ?? oura?.readiness_score ?? null;

      // HRV: Oura balance score > WHOOP RMSSD > Health Connect RMSSD
      const hrvBalance = oura?.hrv_balance_score ?? null;
      const hrvRmssd   = whoop?.hrv_rmssd_ms ?? hc?.hrv_rmssd ?? null;

      // Resting HR: Oura > WHOOP > Health Connect
      const restingHr = oura?.resting_hr ?? whoop?.resting_hr ?? hc?.resting_hr ?? null;

      // Temp flag: Oura only
      const bodyTempDeviation = oura?.body_temp_deviation ?? null;
      const tempFlag = typeof bodyTempDeviation === 'number' && bodyTempDeviation > 0.4;

      const readinessForEnergy = whoop?.recovery_score ?? oura?.readiness_score ?? 65;

      // Steps: Oura > Health Connect > Google Fit (WHOOP doesn't track steps)
      const steps = oura?.steps ?? hc?.steps ?? googleFit?.step_count ?? null;

      // SpO2: WHOOP > Health Connect
      const spo2 = whoop?.spo2_percentage ?? hc?.spo2 ?? null;

      return res.json({
        sleep_source:        sleepSource,
        recovery_source:     recoverySource,
        sleep_score:         sleepScore,
        total_sleep_min:     totalSleepMin,
        rem_sleep_min:       remSleepMin,
        deep_sleep_min:      deepSleepMin,
        recovery_score:      recoveryScore,
        hrv_balance:         hrvBalance,
        hrv_rmssd_ms:        hrvRmssd,
        resting_hr:          restingHr,
        body_temp_deviation: bodyTempDeviation,
        steps,
        respiratory_rate:    whoop?.respiratory_rate ?? null,
        strain_score:        whoop?.strain_score ?? null,
        spo2_percentage:     spo2,
        energy_suggestion:   energySuggestionFromReadiness(readinessForEnergy),
        temp_flag:           tempFlag,
      });
    }

    // Health Connect (Android native) — richer than Google Fit, check first
    if (hc) {
      return res.json({
        sleep_source:        'health_connect',
        recovery_source:     null,
        sleep_score:         hc.sleep_score,
        recovery_score:      null,
        hrv_balance:         null,
        hrv_rmssd_ms:        hc.hrv_rmssd,
        resting_hr:          hc.resting_hr,
        total_sleep_min:     hc.total_sleep_min,
        rem_sleep_min:       hc.rem_sleep_min,
        deep_sleep_min:      hc.deep_sleep_min,
        body_temp_deviation: null,
        steps:               hc.steps ?? googleFit?.step_count ?? null,
        spo2_percentage:     hc.spo2,
        energy_suggestion:   energySuggestionFromFitbit(hc.resting_hr, hc.total_sleep_min),
        temp_flag:           false,
      });
    }

    if (googleFit) {
      return res.json({
        sleep_source:        'google_fit',
        recovery_source:     null,
        sleep_score:         null,
        recovery_score:      null,
        hrv_balance:         null,
        hrv_rmssd_ms:        null,
        resting_hr:          googleFit.resting_hr,
        total_sleep_min:     googleFit.total_sleep_min,
        rem_sleep_min:       googleFit.rem_sleep_min,
        deep_sleep_min:      googleFit.deep_sleep_min,
        body_temp_deviation: null,
        steps:               googleFit.step_count,
        energy_suggestion:   energySuggestionFromGoogleFit(googleFit.resting_hr, googleFit.total_sleep_min),
        temp_flag:           false,
      });
    }

    const fitbit = db.prepare(
      'SELECT * FROM fitbit_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (fitbit) {
      return res.json({
        sleep_source:        'fitbit',
        recovery_source:     null,
        sleep_score:         null,
        recovery_score:      null,
        hrv_balance:         null,
        hrv_rmssd_ms:        null,
        resting_hr:          fitbit.resting_hr,
        total_sleep_min:     fitbit.total_sleep_min,
        rem_sleep_min:       fitbit.rem_sleep_min,
        deep_sleep_min:      fitbit.deep_sleep_min,
        body_temp_deviation: null,
        steps:               fitbit.step_count,
        energy_suggestion:   energySuggestionFromFitbit(fitbit.resting_hr, fitbit.total_sleep_min),
        temp_flag:           false,
      });
    }

    // Priority 4: Withings
    const withings = db.prepare(
      'SELECT * FROM withings_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (withings) {
      return res.json({
        sleep_source:        'withings',
        recovery_source:     null,
        sleep_score:         null,
        recovery_score:      null,
        hrv_balance:         null,
        hrv_rmssd_ms:        null,
        resting_hr:          withings.resting_hr,
        total_sleep_min:     withings.total_sleep_min,
        rem_sleep_min:       withings.rem_sleep_min,
        deep_sleep_min:      withings.deep_sleep_min,
        body_temp_deviation: null,
        steps:               null,
        energy_suggestion:   energySuggestionFromFitbit(withings.resting_hr, withings.total_sleep_min),
        temp_flag:           false,
      });
    }

    // Priority 5: Garmin
    const garmin = db.prepare(
      'SELECT * FROM garmin_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    if (garmin) {
      const sleepMin = garmin.total_sleep_sec != null ? Math.round(garmin.total_sleep_sec / 60) : null;
      return res.json({
        sleep_source:        'garmin',
        recovery_source:     null,
        sleep_score:         garmin.sleep_score,
        recovery_score:      null,
        hrv_balance:         null,
        hrv_rmssd_ms:        null,
        resting_hr:          garmin.resting_hr,
        total_sleep_min:     sleepMin,
        rem_sleep_min:       garmin.rem_sleep_sec != null ? Math.round(garmin.rem_sleep_sec / 60) : null,
        deep_sleep_min:      garmin.deep_sleep_sec != null ? Math.round(garmin.deep_sleep_sec / 60) : null,
        body_temp_deviation: null,
        steps:               garmin.steps,
        avg_stress:          garmin.avg_stress,
        body_battery:        garmin.body_battery_charged,
        energy_suggestion:   energySuggestionFromFitbit(garmin.resting_hr, sleepMin),
        temp_flag:           false,
      });
    }

    // Priority 6: Apple Health
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
