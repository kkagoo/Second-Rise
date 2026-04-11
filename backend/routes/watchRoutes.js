router.get('/snapshot', auth, (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

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

    // Use latest recommendation from existing table
    const rec = db.prepare(`
      SELECT primary_session_type, readiness_score
      FROM recommendations
      WHERE user_id = ?
      ORDER BY timestamp DESC LIMIT 1
    `).get(req.userId);

    if (!oura && !whoop && !rec) return res.json(buildSample());

    const recommendation = rec?.primary_session_type?.toUpperCase() ?? 'WALK';
    const readinessScore = rec?.readiness_score ?? 62;
    const sources = [];
    if (oura) sources.push('Oura');
    if (whoop) sources.push('WHOOP');

    res.json({
      date: today,
      sourceSummary: sources.join(' + ') || 'Sample data',
      sleepScore: oura?.sleep_score ?? null,
      recoveryScore: whoop?.recovery_score ?? null,
      hrv: whoop?.hrv_rmssd_ms ?? null,
      restingHr: whoop?.resting_hr ?? oura?.resting_hr ?? null,
      readinessScore: Math.round(readinessScore),
      recommendation,
      explanation: buildExplanation(recommendation, Math.round(readinessScore)),
      lastUpdatedEpochMs: Date.now(),
    });
  } catch (err) {
    next(err);
  }
});