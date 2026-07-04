const db = require('../db/database');
const { estimateBiometricReadiness } = require('../services/readinessEngine');

function energySuggestionFromReadiness(score) {
  if (score <= 40) return 20;
  if (score <= 60) return 40;
  if (score <= 80) return 65;
  return 85;
}

function getToday(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Fetch all sources unconditionally
    const oura = db.prepare(
      'SELECT * FROM oura_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const whoop = db.prepare(
      'SELECT * FROM whoop_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const hc = db.prepare(
      'SELECT * FROM health_connect_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const googleFit = db.prepare(
      'SELECT * FROM google_fit_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const fitbit = db.prepare(
      'SELECT * FROM fitbit_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const withings = db.prepare(
      'SELECT * FROM withings_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const garmin = db.prepare(
      'SELECT * FROM garmin_daily_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    const apple = db.prepare(
      'SELECT * FROM apple_health_data WHERE user_id = ? AND date = ?'
    ).get(req.userId, today);

    // Nothing at all
    if (!oura && !whoop && !hc && !googleFit && !fitbit && !withings && !garmin && !apple) {
      return res.json({ source: null });
    }

    // ── Per-metric merge (best source first, fill gaps from others) ─────────

    // Sleep score: Oura > WHOOP > Health Connect > Garmin
    const sleepScore =
      oura?.sleep_score ??
      whoop?.sleep_performance ??
      hc?.sleep_score ??
      garmin?.sleep_score ??
      null;

    // Sleep duration + stages: Oura > WHOOP > Health Connect > Garmin > Google Fit > Fitbit > Withings
    const garminSleepMin = garmin?.total_sleep_sec != null ? Math.round(garmin.total_sleep_sec / 60) : null;
    const totalSleepMin =
      oura?.total_sleep_min ??
      whoop?.total_sleep_min ??
      hc?.total_sleep_min ??
      garminSleepMin ??
      googleFit?.total_sleep_min ??
      fitbit?.total_sleep_min ??
      withings?.total_sleep_min ??
      apple?.sleep_min ??
      null;

    const remSleepMin =
      oura?.rem_sleep_min ??
      whoop?.rem_sleep_min ??
      hc?.rem_sleep_min ??
      (garmin?.rem_sleep_sec != null ? Math.round(garmin.rem_sleep_sec / 60) : null) ??
      googleFit?.rem_sleep_min ??
      fitbit?.rem_sleep_min ??
      null;

    const deepSleepMin =
      oura?.deep_sleep_min ??
      whoop?.deep_sleep_min ??
      hc?.deep_sleep_min ??
      (garmin?.deep_sleep_sec != null ? Math.round(garmin.deep_sleep_sec / 60) : null) ??
      googleFit?.deep_sleep_min ??
      fitbit?.deep_sleep_min ??
      null;

    // Recovery: WHOOP recovery > Oura readiness
    const recoveryScore = whoop?.recovery_score ?? oura?.readiness_score ?? null;

    // HRV: Oura balance > WHOOP RMSSD > Health Connect RMSSD > Apple Health
    const hrvBalance = oura?.hrv_balance_score ?? null;
    const hrvRmssd =
      whoop?.hrv_rmssd_ms ??
      hc?.hrv_rmssd ??
      apple?.hrv_ms ??
      null;

    // Resting HR: Oura > WHOOP > Health Connect > Fitbit > Withings > Garmin > Google Fit > Apple
    const restingHr =
      oura?.resting_hr ??
      whoop?.resting_hr ??
      hc?.resting_hr ??
      fitbit?.resting_hr ??
      withings?.resting_hr ??
      garmin?.resting_hr ??
      googleFit?.resting_hr ??
      apple?.resting_hr ??
      null;

    // Steps: Oura > Health Connect > Garmin > Google Fit > Fitbit > Apple (WHOOP doesn't track)
    const steps =
      oura?.steps ??
      hc?.steps ??
      garmin?.steps ??
      googleFit?.step_count ??
      fitbit?.step_count ??
      apple?.step_count ??
      null;

    // SpO2: WHOOP > Health Connect
    const spo2 = whoop?.spo2_percentage ?? hc?.spo2 ?? null;

    // Oura-only metrics
    const bodyTempDeviation = oura?.body_temp_deviation ?? null;
    const tempFlag = typeof bodyTempDeviation === 'number' && bodyTempDeviation > 0.4;

    // WHOOP-only metrics
    const respiratoryRate = whoop?.respiratory_rate ?? null;
    const strainScore = whoop?.strain_score ?? null;

    // Garmin-only metrics
    const avgStress = garmin?.avg_stress ?? null;
    const bodyBattery = garmin?.body_battery_charged ?? null;

    // Helper: does a row have at least one real metric value?
    const hasData = (row, fields) => row && fields.some(f => row[f] != null);

    // ── Sources list — only include if it actually contributed a metric ───────
    const sources = [];
    if (hasData(oura,     ['sleep_score','total_sleep_min','hrv_balance_score','resting_hr','readiness_score','steps'])) sources.push('oura');
    if (hasData(whoop,    ['recovery_score','sleep_performance','hrv_rmssd_ms','resting_hr','strain_score'])) sources.push('whoop');
    if (hasData(hc,       ['sleep_score','total_sleep_min','hrv_rmssd','resting_hr','steps','spo2'])) sources.push('health_connect');
    if (hasData(garmin,   ['sleep_score','total_sleep_sec','resting_hr','steps','avg_stress'])) sources.push('garmin');
    if (hasData(googleFit,['total_sleep_min','resting_hr','step_count'])) sources.push('google_fit');
    if (hasData(fitbit,   ['total_sleep_min','resting_hr','step_count'])) sources.push('fitbit');
    if (hasData(withings, ['total_sleep_min','resting_hr'])) sources.push('withings');
    if (hasData(apple,    ['sleep_min','resting_hr','hrv_ms','step_count'])) sources.push('apple_health');

    // ── Primary source label (for "⌚ From your X" display) ──────────────────
    // Highest-fidelity source that has recovery OR sleep data
    const sleepSource =
      oura    ? 'oura'           :
      whoop   ? 'whoop'          :
      hc      ? 'health_connect' :
      garmin  ? 'garmin'         :
      googleFit ? 'google_fit'   :
      fitbit  ? 'fitbit'         :
      withings ? 'withings'      :
      apple   ? 'apple_health'   : null;

    const recoverySource = whoop ? 'whoop' : oura ? 'oura' : null;

    // ── Energy suggestion from best available signal ─────────────────────────
    const readinessScore = whoop?.recovery_score ?? oura?.readiness_score ?? null;
    let energyScore = 65;
    if (readinessScore != null) {
      energyScore = readinessScore;
    } else if (restingHr != null || totalSleepMin != null) {
      if (restingHr != null) {
        if (restingHr > 72) energyScore -= 10;
        else if (restingHr < 58) energyScore += 5;
      }
      if (totalSleepMin != null) {
        if (totalSleepMin < 330) energyScore -= 15;
        else if (totalSleepMin > 450) energyScore += 5;
      }
      energyScore = Math.max(0, Math.min(100, energyScore));
    }

    return res.json({
      // Source info
      sleep_source:        sleepSource,
      recovery_source:     recoverySource,
      sources,                          // all contributing sources

      // Sleep
      sleep_score:         sleepScore,
      total_sleep_min:     totalSleepMin,
      rem_sleep_min:       remSleepMin,
      deep_sleep_min:      deepSleepMin,

      // Recovery / readiness
      recovery_score:      recoveryScore,

      // Cardiovascular
      hrv_balance:         hrvBalance,
      hrv_rmssd_ms:        hrvRmssd,
      resting_hr:          restingHr,
      spo2_percentage:     spo2,

      // Activity
      steps,

      // WHOOP-specific
      respiratory_rate:    respiratoryRate,
      strain_score:        strainScore,

      // Garmin-specific
      avg_stress:          avgStress,
      body_battery:        bodyBattery,

      // Oura-specific
      body_temp_deviation: bodyTempDeviation,
      temp_flag:           tempFlag,

      // Energy
      energy_suggestion:   energySuggestionFromReadiness(energyScore),

      // Biometric-only readiness estimate — shown before check-in for any wearable source
      biometric_readiness: estimateBiometricReadiness({
        sleep_score:    sleepScore,
        total_sleep_min: totalSleepMin,
        hrv_rmssd_ms:   hrvRmssd,
        hrv_balance:    hrvBalance,
        resting_hr:     restingHr,
      }),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getToday };
