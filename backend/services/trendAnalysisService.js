/**
 * trendAnalysisService.js
 *
 * Detects meaningful patterns in a user's recent biometric history.
 * Works across all data sources: google_health_trends, oura_daily_data,
 * whoop_daily_data, fitbit_daily_data, health_connect_daily_data.
 *
 * Returns a trendContext object consumed by promptBuilder for richer AI recommendations.
 */

const db = require('../db/database');

// ─── Data loaders ─────────────────────────────────────────────────────────────

function loadRows(userId, days = 14) {
  const since = `date('now', '-${days} days')`;

  // Merge all sources into a unified array, preferring richer sources
  const oura = db.prepare(`
    SELECT date, readiness_score AS recovery, hrv_balance_score AS hrv,
           resting_hr, total_sleep_min AS sleep_min
    FROM oura_daily_data WHERE user_id = ? AND date >= ${since} ORDER BY date ASC
  `).all(userId);

  const whoop = db.prepare(`
    SELECT date, recovery_score AS recovery, hrv_rmssd_ms AS hrv,
           resting_hr, total_sleep_min AS sleep_min
    FROM whoop_daily_data WHERE user_id = ? AND date >= ${since} ORDER BY date ASC
  `).all(userId);

  const fit = db.prepare(`
    SELECT date, NULL AS recovery, NULL AS hrv,
           resting_hr, total_sleep_min AS sleep_min
    FROM google_health_trends WHERE user_id = ? AND date >= ${since} ORDER BY date ASC
  `).all(userId);

  const fitbit = db.prepare(`
    SELECT date, NULL AS recovery, NULL AS hrv,
           resting_hr, total_sleep_min AS sleep_min
    FROM fitbit_daily_data WHERE user_id = ? AND date >= ${since} ORDER BY date ASC
  `).all(userId);

  const hc = db.prepare(`
    SELECT date, NULL AS recovery, hrv_rmssd AS hrv,
           resting_hr, total_sleep_min AS sleep_min
    FROM health_connect_daily_data WHERE user_id = ? AND date >= ${since} ORDER BY date ASC
  `).all(userId);

  // Merge by date, priority: oura > whoop > hc > fitbit > google_fit
  const byDate = {};
  for (const row of [...fit, ...fitbit, ...hc, ...whoop, ...oura]) {
    if (!byDate[row.date]) byDate[row.date] = {};
    const existing = byDate[row.date];
    existing.date = row.date;
    if (row.recovery != null) existing.recovery = row.recovery;
    if (row.hrv != null)      existing.hrv = row.hrv;
    if (row.resting_hr != null) existing.resting_hr = row.resting_hr;
    if (row.sleep_min != null)  existing.sleep_min = row.sleep_min;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Pattern detectors ────────────────────────────────────────────────────────

function detectSleepDecline(rows) {
  const recent = rows.filter(r => r.sleep_min != null).slice(-7);
  if (recent.length < 3) return null;

  let declineStreak = 0;
  for (let i = recent.length - 1; i > 0; i--) {
    if (recent[i].sleep_min < recent[i - 1].sleep_min - 15) {
      declineStreak++;
    } else break;
  }

  if (declineStreak >= 2) {
    const oldest = recent[recent.length - 1 - declineStreak];
    const newest = recent[recent.length - 1];
    const dropMin = oldest.sleep_min - newest.sleep_min;
    return {
      type: 'sleep_decline',
      streak: declineStreak,
      dropMin,
      message: `Sleep declining ${declineStreak} nights in a row (down ~${Math.round(dropMin / 60)}h${dropMin % 60}m total)`,
    };
  }
  return null;
}

function detectElevatedRHR(rows) {
  const withHR = rows.filter(r => r.resting_hr != null);
  if (withHR.length < 5) return null;

  const baseline = withHR.slice(0, -3);
  const recent   = withHR.slice(-3);
  if (baseline.length < 2) return null;

  const baselineAvg = Math.round(baseline.reduce((s, r) => s + r.resting_hr, 0) / baseline.length);
  const recentAvg   = Math.round(recent.reduce((s, r) => s + r.resting_hr, 0) / recent.length);
  const delta = recentAvg - baselineAvg;

  if (delta >= 4) {
    return {
      type: 'elevated_rhr',
      baselineAvg,
      recentAvg,
      delta,
      message: `Resting HR elevated +${delta} bpm vs your 2-week average (${baselineAvg} → ${recentAvg} bpm)`,
    };
  }
  return null;
}

function detectLowRecovery(rows) {
  const withRec = rows.filter(r => r.recovery != null).slice(-5);
  if (withRec.length < 3) return null;

  const lowDays = withRec.filter(r => r.recovery < 50).length;
  if (lowDays >= 3) {
    const avg = Math.round(withRec.reduce((s, r) => s + r.recovery, 0) / withRec.length);
    return {
      type: 'low_recovery_streak',
      lowDays,
      avgRecovery: avg,
      message: `Recovery has been low ${lowDays} of the last ${withRec.length} days (avg ${avg}/100)`,
    };
  }
  return null;
}

function detectStepTrend(rows) {
  const withSteps = rows.filter(r => r.step_count != null);
  if (withSteps.length < 6) return null;

  const firstHalf  = withSteps.slice(0, Math.floor(withSteps.length / 2));
  const secondHalf = withSteps.slice(Math.floor(withSteps.length / 2));
  const firstAvg   = Math.round(firstHalf.reduce((s, r) => s + (r.step_count ?? 0), 0) / firstHalf.length);
  const secondAvg  = Math.round(secondHalf.reduce((s, r) => s + (r.step_count ?? 0), 0) / secondHalf.length);
  const pct = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;

  if (Math.abs(pct) >= 20) {
    return {
      type: pct > 0 ? 'steps_increasing' : 'steps_decreasing',
      firstAvg,
      secondAvg,
      pct,
      message: pct > 0
        ? `Daily steps trending up ${pct}% over 2 weeks (${firstAvg.toLocaleString()} → ${secondAvg.toLocaleString()})`
        : `Daily steps trending down ${Math.abs(pct)}% over 2 weeks (${firstAvg.toLocaleString()} → ${secondAvg.toLocaleString()})`,
    };
  }
  return null;
}

function detectSleepShortfall(rows) {
  const recent = rows.filter(r => r.sleep_min != null).slice(-7);
  if (recent.length < 3) return null;

  const shortNights = recent.filter(r => r.sleep_min < 360).length; // < 6h
  if (shortNights >= 3) {
    const avg = Math.round(recent.reduce((s, r) => s + r.sleep_min, 0) / recent.length);
    return {
      type: 'chronic_short_sleep',
      shortNights,
      avgSleepMin: avg,
      message: `Averaging only ${Math.floor(avg / 60)}h${avg % 60}m sleep — ${shortNights} nights under 6h this week`,
    };
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

function analyzeTrends(userId, days = 14) {
  try {
    const rows = loadRows(userId, days);
    if (rows.length < 2) return null;

    const patterns = [
      detectSleepDecline(rows),
      detectSleepShortfall(rows),
      detectElevatedRHR(rows),
      detectLowRecovery(rows),
      detectStepTrend(rows),
    ].filter(Boolean);

    if (patterns.length === 0) return null;

    // Compute simple averages for the prompt
    const withSleep  = rows.filter(r => r.sleep_min != null);
    const withHR     = rows.filter(r => r.resting_hr != null);
    const withRec    = rows.filter(r => r.recovery != null);

    return {
      patterns,
      summary: patterns.map(p => p.message).join('. '),
      daysOfData: rows.length,
      avgSleepMin: withSleep.length > 0
        ? Math.round(withSleep.reduce((s, r) => s + r.sleep_min, 0) / withSleep.length)
        : null,
      avgRHR: withHR.length > 0
        ? Math.round(withHR.reduce((s, r) => s + r.resting_hr, 0) / withHR.length)
        : null,
      avgRecovery: withRec.length > 0
        ? Math.round(withRec.reduce((s, r) => s + r.recovery, 0) / withRec.length)
        : null,
      hasNegativePattern: patterns.some(p =>
        ['sleep_decline', 'chronic_short_sleep', 'elevated_rhr', 'low_recovery_streak'].includes(p.type)
      ),
    };
  } catch (err) {
    console.error('trendAnalysis error:', err.message);
    return null;
  }
}

module.exports = { analyzeTrends };
