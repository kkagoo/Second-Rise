const { ENERGY_SCORES } = require('../utils/constants');

function buildVideoPrompt(profile, checkin, readiness, priorFeedback, availableVideos, biometrics = null, history = [], baseline = null, weeklySchedule = []) {
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
      biometrics.sleep_source    ? `Sleep data from ${biometrics.sleep_source === 'oura' ? 'Oura Ring' : biometrics.sleep_source === 'whoop' ? 'Whoop' : 'Apple Health'}` : null,
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
${biometrics.activity_score != null ? `- Activity score: ${biometrics.activity_score}/100 | Steps: ${biometrics.steps ?? 'n/a'}` : ''}

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

  return `USER PROFILE:
- Age range: ${profile.age_range || 'not specified'}
- Menopause stage: ${profile.menopause_stage || 'not specified'}
- Bone health: ${profile.bone_health || 'unknown'}
- Pelvic floor history: ${profile.pelvic_floor_history ? 'yes' : 'no'}
- Chronic joints: ${chronicJoints.length > 0 ? chronicJoints.join(', ') : 'none'}
- Activity baseline: ${profile.activity_baseline || 'not specified'}
- Equipment available: ${equipment.length > 0 ? equipment.join(', ') : 'none / bodyweight only'}

TODAY'S CHECK-IN:
- Energy: ${energyInfo.emoji} ${energyInfo.label} (score: ${checkin.layer1_energy})
- Time available: ${checkin.layer1_time_avail} minutes
- Body flags:
${bodyFlagsText}
- Secondary symptoms:
${secondaryText}
${workoutPrefText}
COMPUTED READINESS: ${readiness} / 85
${biometricsSection}${trendsSection}${weeklyScheduleSection}
PRIOR SESSION: ${priorText}

AVAILABLE VIDEOS FOR TODAY (already filtered for time and condition):
${videoListText || '  No videos matched filters — pick the gentlest option from the full library.'}

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
