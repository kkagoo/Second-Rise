const { ENERGY_SCORES } = require('../utils/constants');

function buildVideoPrompt(profile, checkin, readiness, priorFeedback, availableVideos, biometrics = null, history = [], baseline = null, weeklySchedule = [], checkinTrend = [], biometricTrend = null) {
  const energyInfo  = ENERGY_SCORES[checkin.layer1_energy] || { label: 'Unknown', emoji: '' };
  const bodyFlags   = Array.isArray(checkin.body_map_flags)
    ? checkin.body_map_flags
    : (checkin.body_map_flags ? JSON.parse(checkin.body_map_flags) : []);
  const secondary   = checkin.secondary_flags
    ? (typeof checkin.secondary_flags === 'string' ? JSON.parse(checkin.secondary_flags) : checkin.secondary_flags)
    : {};
  const chronicJoints = profile.chronic_joints
    ? (typeof profile.chronic_joints === 'string' ? JSON.parse(profile.chronic_joints) : profile.chronic_joints)
    : [];
  const equipment = profile.equipment_available
    ? (typeof profile.equipment_available === 'string' ? JSON.parse(profile.equipment_available) : profile.equipment_available)
    : [];

  const bodyFlagsText = bodyFlags.length > 0
    ? bodyFlags.map((f) => `  - ${f.region}: ${f.pain_type} pain, ${f.severity} severity`).join('\n')
    : '  None';

  const activeSecondary = Object.entries(secondary)
    .filter(([, v]) => v)
    .map(([k]) => `  - ${k.replace(/_/g, ' ')}`);
  const secondaryText = activeSecondary.length > 0 ? activeSecondary.join('\n') : '  None';

  const priorText = priorFeedback
    ? `Yesterday: effort="${priorFeedback.effort_rating}", flare-ups=${JSON.stringify(priorFeedback.flare_up_regions || [])}`
    : 'No prior session data.';

  const videoListText = availableVideos.map((v) =>
    `  ${v.id} | "${v.title}" | ${v.creator} | ${v.duration_min} min | difficulty ${v.difficulty}/5 | ${v.intensity} intensity | equipment: ${v.equipment} | focus: ${v.focus_tags.join(', ')}`
  ).join('\n');

  // Build biometrics section — handles combined Oura+Whoop or single-source data
  let biometricsSection = '';
  if (biometrics && (biometrics.sleep_source || biometrics.recovery_source)) {
    const sleepH   = biometrics.total_sleep_min != null ? Math.floor(biometrics.total_sleep_min / 60) : null;
    const sleepM   = biometrics.total_sleep_min != null ? biometrics.total_sleep_min % 60 : null;
    const sleepStr = sleepH != null ? `${sleepH}h ${sleepM}m` : 'n/a';

    const sourceNote = [
      biometrics.sleep_source
        ? `Sleep data from ${
          biometrics.sleep_source === 'oura'
            ? 'Oura Ring'
            : biometrics.sleep_source === 'whoop'
              ? 'Whoop'
              : biometrics.sleep_source === 'google_fit'
                ? 'Google Fit'
              : biometrics.sleep_source === 'fitbit'
                ? 'Fitbit / Pixel Watch'
              : biometrics.sleep_source === 'withings'
                ? 'Withings'
                : 'Apple Health'
        }`
        : null,
      biometrics.recovery_source ? `Recovery data from ${biometrics.recovery_source === 'whoop' ? 'Whoop' : 'Oura Ring'}` : null,
    ].filter(Boolean).join('; ');

    biometricsSection = `
BIOMETRIC DATA (${sourceNote}):
ESTIMATED ENERGY LEVEL: ${biometrics.energy_label ?? 'Unknown'} — use this as a primary signal for today's intensity.
- Recovery score: ${biometrics.recovery_score ?? 'n/a'}${biometrics.recovery_source === 'whoop' ? '/100 (Whoop)' : biometrics.recovery_source === 'oura' ? '/100 (Oura readiness)' : ''}
- Sleep score: ${biometrics.sleep_score ?? 'n/a'}${biometrics.sleep_source === 'oura' ? '/100 (Oura)' : biometrics.sleep_source === 'whoop' ? '% (Whoop performance)' : ''}
- Total sleep: ${sleepStr} | REM: ${biometrics.rem_sleep_min ?? 'n/a'}m | Deep: ${biometrics.deep_sleep_min ?? 'n/a'}m
- Sleep efficiency: ${biometrics.sleep_efficiency != null ? `${Math.round(biometrics.sleep_efficiency)}%` : 'n/a'}
${biometrics.hrv_balance != null ? `- HRV balance: ${biometrics.hrv_balance}/100 (Oura)` : ''}${biometrics.hrv_rmssd_ms != null ? `\n- HRV rMSSD: ${biometrics.hrv_rmssd_ms.toFixed(1)} ms (Whoop) — >60ms good, <40ms suggests fatigue` : ''}
- Resting HR: ${biometrics.resting_hr ?? 'n/a'} bpm
${biometrics.respiratory_rate != null ? `- Respiratory rate: ${biometrics.respiratory_rate} breaths/min` : ''}
${biometrics.strain_score != null ? `- Yesterday's strain: ${biometrics.strain_score.toFixed(1)}/21${biometrics.strain_score > 16 ? ' ⚠️ high — prioritise recovery' : ''}` : ''}
${biometrics.spo2_percentage != null ? `- SpO2: ${biometrics.spo2_percentage.toFixed(1)}%` : ''}
${biometrics.body_temp_deviation != null ? `- Body temp deviation: ${biometrics.body_temp_deviation}°C${biometrics.temp_flag ? ' ⚠️ elevated — possible hot flash signal' : ''}` : ''}
${biometrics.activity_score != null ? `- Activity score: ${biometrics.activity_score}/100 | Steps: ${biometrics.steps ?? 'n/a'}` : biometrics.steps != null ? `- Steps: ${biometrics.steps}` : ''}

Factor ALL available recovery and sleep signals into your recommendation. The ESTIMATED ENERGY LEVEL above is derived from the best available recovery data — honour it when choosing intensity.
`;
  } else if (biometrics && biometrics.sleep_source === 'apple_health') {
    const sleepH   = biometrics.total_sleep_min != null ? Math.floor(biometrics.total_sleep_min / 60) : null;
    const sleepM   = biometrics.total_sleep_min != null ? biometrics.total_sleep_min % 60 : null;
    const sleepStr = sleepH != null ? `${sleepH}h ${sleepM}m` : 'n/a';
    biometricsSection = `
BIOMETRIC DATA (Apple Health):
- Total sleep: ${sleepStr} | Resting HR: ${biometrics.resting_hr ?? 'n/a'} bpm

Factor this into your recommendation.
`;
  }

  // 7-day trend section
  let trendsSection = '';
  if (history.length >= 2) {
    const dayLines = history.map((d) => {
      const sleepStr = d.total_sleep_min != null
        ? `${Math.floor(d.total_sleep_min / 60)}h${d.total_sleep_min % 60}m`
        : 'n/a';
      return `  ${d.date}: readiness=${d.readiness_score ?? 'n/a'}, HRV=${d.hrv_balance_score ?? 'n/a'}, sleep=${sleepStr}, RHR=${d.resting_hr ?? 'n/a'}, activity=${d.activity_score ?? 'n/a'}`;
    }).join('\n');
    trendsSection = `\nRECENT ${history.length}-DAY TREND (Oura):\n${dayLines}\n`;

    if (baseline && baseline.days_of_data >= 7) {
      const bSleepStr = baseline.avg_sleep_min != null
        ? `${Math.floor(baseline.avg_sleep_min / 60)}h${Math.round(baseline.avg_sleep_min % 60)}m`
        : 'n/a';
      trendsSection += `
PERSONAL BASELINE (last ${baseline.days_of_data} days avg):
- Readiness: ${baseline.avg_readiness ?? 'n/a'} | HRV: ${baseline.avg_hrv ?? 'n/a'} | RHR: ${baseline.avg_rhr ?? 'n/a'} bpm | Sleep: ${bSleepStr}
`;
      if (biometrics?.readiness_score != null && baseline.avg_readiness != null) {
        const diff = Math.round(biometrics.readiness_score - baseline.avg_readiness);
        if (Math.abs(diff) >= 5) {
          trendsSection += `Today's readiness is ${diff > 0 ? '+' : ''}${diff} vs her personal baseline — ${diff > 0 ? 'above normal, she can handle more intensity today' : 'below normal, prioritise recovery and lower load today'}.\n`;
        }
      }
    }
  }

  // Weekly workout schedule section for balance tracking
  let weeklyScheduleSection = '';
  if (weeklySchedule.length > 0) {
    const scheduleLines = weeklySchedule.map((w) =>
      `  ${w.workout_date}: ${w.body_focus || w.primary_session_type || 'unknown'}`
    ).join('\n');

    // Count workout types this week
    const counts = { strength_upper: 0, strength_lower: 0, strength_full: 0, cardio: 0, yoga: 0, mobility: 0, pilates: 0 };
    for (const w of weeklySchedule) {
      const f = w.body_focus || '';
      if (counts[f] !== undefined) counts[f]++;
    }
    const strengthTotal = counts.strength_upper + counts.strength_lower + counts.strength_full;
    const cardioTotal   = counts.cardio;
    const flexTotal     = counts.yoga + counts.mobility + counts.pilates;

    weeklyScheduleSection = `
WEEKLY WORKOUT SCHEDULE (last 7 days — workouts actually started):
${scheduleLines}

This week's balance:
- Strength sessions: ${strengthTotal} (upper body: ${counts.strength_upper}, lower body: ${counts.strength_lower}, full body: ${counts.strength_full})
- Cardio sessions: ${cardioTotal}
- Yoga/Mobility/Pilates: ${flexTotal}

WEEKLY BALANCE GUIDELINES — follow these unless today's check-in or biometrics strongly suggest otherwise:
- Aim for 2–3 strength sessions per week, ALTERNATING between upper body, lower body, and full body (avoid repeating the same focus two days in a row)
- Aim for 1–2 cardio sessions per week
- Fill remaining days with yoga, mobility, or Pilates
- If strength_upper was done yesterday or today, prefer strength_lower or full_body next
- If all 3 strength slots are filled, steer toward cardio, yoga, or mobility today
`;
  } else {
    weeklyScheduleSection = `
WEEKLY WORKOUT SCHEDULE: No workout history yet this week.
Start with what feels best today — a strength session (full body or lower body is a great start) if energy allows.
`;
  }

  // Workout preference section
  const workoutPrefText = checkin.workout_preference && checkin.workout_preference !== 'surprise'
    ? `\nUSER'S WORKOUT PREFERENCE TODAY: "${checkin.workout_preference}" — honour this request if it's safe and appropriate given recovery data. If it conflicts with safety (e.g. she wants high-intensity strength but her recovery is very low), choose a gentler version of that type and explain why.\n`
    : '\nUSER\'S WORKOUT PREFERENCE TODAY: "Surprise me" — use your best judgement based on recovery data and weekly balance.\n';

  // 7-day checkin trend section (all users, not just wearable users)
  let checkinTrendSection = '';
  if (checkinTrend.length >= 2) {
    const avgEnergy = Math.round(checkinTrend.reduce((s, d) => s + (d.layer1_energy || 0), 0) / checkinTrend.length);
    const avgReadiness = Math.round(checkinTrend.reduce((s, d) => s + (d.computed_readiness || 0), 0) / checkinTrend.length);
    const painDays = checkinTrend.filter((d) => d.pain_flagged).length;
    const sleepEntries = checkinTrend.filter((d) => d.sleep_quality != null);
    const avgSleep = sleepEntries.length > 0
      ? (sleepEntries.reduce((s, d) => s + d.sleep_quality, 0) / sleepEntries.length).toFixed(1)
      : null;
    const menstruatingDays = checkinTrend.filter((d) => d.menstruating === 'yes').length;

    const dayLines = checkinTrend.map((d) => {
      const parts = [
        `energy=${d.layer1_energy}`,
        `readiness=${d.computed_readiness}`,
        d.pain_flagged ? 'pain=yes' : 'pain=no',
        d.sleep_quality != null ? `sleep_quality=${d.sleep_quality}/5` : null,
        d.menstruating ? `menstruating=${d.menstruating}` : null,
      ].filter(Boolean);
      return `  ${d.date}: ${parts.join(', ')}`;
    }).join('\n');

    checkinTrendSection = `
7-DAY CHECK-IN TREND (self-reported):
${dayLines}

Pattern summary:
- Average self-reported energy: ${avgEnergy}/85 | Average readiness: ${avgReadiness}/85
- Pain flagged: ${painDays}/${checkinTrend.length} days this week${avgSleep != null ? `\n- Average sleep quality (self-reported): ${avgSleep}/5` : ''}${menstruatingDays > 0 ? `\n- Menstruating: ${menstruatingDays} day(s) this week` : ''}

Use this trend to inform today's recommendation: if energy has been consistently low, prefer recovery-focused sessions even if today's score looks moderate.
`;
  }

  // 14-day biometric trend section (Google Health + all wearables)
  let biometricTrendSection = '';
  if (biometricTrend && biometricTrend.patterns.length > 0) {
    const avgSleepStr = biometricTrend.avgSleepMin != null
      ? `${Math.floor(biometricTrend.avgSleepMin / 60)}h${biometricTrend.avgSleepMin % 60}m`
      : null;
    const patternLines = biometricTrend.patterns.map(p => `  ⚠ ${p.message}`).join('\n');

    biometricTrendSection = `
14-DAY BIOMETRIC TREND (Google Health data — ${biometricTrend.daysOfData} days):
${patternLines}
${avgSleepStr ? `Average sleep this period: ${avgSleepStr}` : ''}${biometricTrend.avgRHR ? ` | Average resting HR: ${biometricTrend.avgRHR} bpm` : ''}${biometricTrend.avgRecovery ? ` | Average recovery: ${biometricTrend.avgRecovery}/100` : ''}

${biometricTrend.hasNegativePattern
  ? '⚠️ TREND ALERT: This user is showing signs of cumulative fatigue or sleep debt. Even if today\'s check-in looks moderate, honour these multi-day patterns: recommend lower-intensity work and prioritise recovery.'
  : 'Positive trend: activity and recovery are stable or improving over the last 2 weeks.'}
`;
  }

  // ── Goal section ────────────────────────────────────────────────────────────
  let goalSection = '';
  if (profile.goal) {
    const daysIn = profile.goal_set_at
      ? Math.max(0, Math.floor((Date.now() - new Date(profile.goal_set_at).getTime()) / 86400000))
      : 0;
    const dayLabel = `Day ${daysIn + 1}`;

    const GOAL_BIAS = {
      build_strength: `MOVEMENT GOAL — Build Strength (${dayLabel}):
Aim for 2–3 strength sessions per week with progressive load.
• Alternate upper / lower / full body — never repeat the same focus on consecutive days.
• On low-readiness or recovery days: yoga, mobility, or pilates instead.
• Do not recommend high-intensity strength when readiness < 35.`,

      boost_energy: `MOVEMENT GOAL — Boost Energy & Fitness (${dayLabel}):
Alternate cardio (1–2×/week) and strength (1–2×/week) at moderate intensity.
• Short sessions (15–20 min) count as a full win.
• When energy ≤ 2, choose low-impact cardio or mobility over rest.
• Avoid consecutive high-intensity days.`,

      sleep_stress: `MOVEMENT GOAL — Sleep Better & Reduce Stress (${dayLabel}):
Prioritise yoga, breath-led movement, mobility, and pilates.
• High-intensity sessions only when energy ≥ 4 AND readiness > 55.
• Default to nervous-system-friendly choices — yin, restorative, gentle flow.
• Avoid high-energy sessions late in the day if preferred_time is evening.`,

      mobility: `MOVEMENT GOAL — Improve Mobility & Flexibility (${dayLabel}):
Lead with yoga and mobility sessions (4–5×/week); include 1 strength session for structural support.
• Every session should include joint-friendly, range-of-motion work.
• Pilates counts as a mobility-friendly option.
• Avoid high-impact or heavy-load sessions unless explicitly requested.`,

      consistency: `MOVEMENT GOAL — Move More Consistently (${dayLabel}):
Prioritise showing up over intensity — any session, any length counts.
• Vary session types to prevent boredom.
• 10–15 min short sessions are a valid win and should not be dismissed.
• When energy is low, choose something gentle rather than recommending rest.
• Never push for intensity when the goal is building the habit.`,

      midlife: `MOVEMENT GOAL — Support My Body Through Midlife (${dayLabel}):
Prioritise weight-bearing strength (bone density), pelvic-floor-aware options, and recovery.
• Include 2 strength sessions per week with weight-bearing focus.
• Avoid high-impact if bone_health is flagged as concern.
• Add yoga or mobility for sleep, stress, and joint health 2–3×/week.
• Recovery is part of the plan — do not push through fatigue.`,
    };

    if (profile.goal === 'train_for') {
      let details = {};
      try {
        details = typeof profile.goal_details === 'string'
          ? JSON.parse(profile.goal_details)
          : (profile.goal_details || {});
      } catch (_) {}

      let eventDateLine = '';
      if (profile.goal_target_date) {
        const daysUntil = Math.ceil((new Date(profile.goal_target_date) - Date.now()) / 86400000);
        eventDateLine = `Event date: ${profile.goal_target_date}. ${daysUntil > 0 ? `${daysUntil} days remaining.` : 'Event has passed — focus on recovery and reflection.'}`;
      }

      goalSection = `
MOVEMENT GOAL — Training For: ${details.what || 'a specific event'} (${dayLabel}):
${eventDateLine}
${details.success ? `Success looks like: ${details.success}` : ''}
${details.hardest ? `What feels hardest: ${details.hardest}` : ''}
${details.workaround ? `Work around: ${details.workaround}` : ''}
${details.needs?.length ? `Training priorities: ${details.needs.join(', ')}` : ''}
Bias session selection toward the specific demands of this goal. Build progressively week over week. Factor in any workarounds when choosing intensity or video type.
`;
    } else {
      goalSection = `\n${GOAL_BIAS[profile.goal] || ''}\n`;
    }
  }

  return `USER PROFILE:
- Age range: ${profile.age_range || 'not specified'}
- Menopause stage: ${profile.menopause_stage || 'not specified'}
- Bone health: ${profile.bone_health || 'unknown'}
- Pelvic floor history: ${profile.pelvic_floor_history ? 'yes' : 'no'}
- Chronic joints: ${chronicJoints.length > 0 ? chronicJoints.join(', ') : 'none'}
- Activity baseline: ${profile.activity_baseline || 'not specified'}
- Equipment available: ${equipment.length > 0 ? equipment.join(', ') : 'none / bodyweight only'}
${goalSection}

TODAY'S CHECK-IN:
- Energy: ${energyInfo.emoji} ${energyInfo.label} (score: ${checkin.layer1_energy})
- Time available: ${checkin.layer1_time_avail} minutes
- Body flags:
${bodyFlagsText}
- Secondary symptoms:
${secondaryText}
${workoutPrefText}
COMPUTED READINESS: ${readiness} / 85
${biometricsSection}${biometricTrendSection}${checkinTrendSection}${trendsSection}${weeklyScheduleSection}
PRIOR SESSION: ${priorText}

AVAILABLE VIDEOS FOR TODAY (already filtered for time and condition):
${videoListText || '  No videos available. Do not pick a video. Return primary.video_id as null and explain why in reasoning.'}

TASK:
1. Pick the single best video ID for today from the list above. Factor in the weekly balance guidelines: avoid repeating the same body focus area two days in a row, aim for the right mix of strength/cardio/yoga across the week.
2. Write a weight_note: tell the user exactly what equipment to grab before pressing play (e.g. "Grab a pair of 8–12 lb dumbbells. If it's your first Caroline Girvan session, go lighter than you think."). If no equipment needed, say so warmly.
3. Write reasoning: 2–3 warm sentences directly to the user explaining why this video fits today. Mention if you're balancing the weekly schedule. No jargon.
4. Pick 3 alternative video IDs with 1–2 sentence reasoning each.

Respond with ONLY valid JSON:
{
  "primary": {
    "video_id": string,
    "reasoning": string,
    "weight_note": string
  },
  "alternatives": [
    { "video_id": string, "reasoning": string },
    { "video_id": string, "reasoning": string },
    { "video_id": string, "reasoning": string }
  ]
}`;
}

module.exports = { buildVideoPrompt };
