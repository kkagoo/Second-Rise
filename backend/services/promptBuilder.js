const { ENERGY_SCORES } = require('../utils/constants');

function buildVideoPrompt(profile, checkin, readiness, priorFeedback, availableVideos, biometrics = null) {
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

  let biometricsSection = '';
  if (biometrics && biometrics.source) {
    const source  = biometrics.source === 'oura' ? 'Oura Ring' : 'Apple Health';
    const sleepH  = biometrics.total_sleep_min != null ? Math.floor(biometrics.total_sleep_min / 60) : null;
    const sleepM  = biometrics.total_sleep_min != null ? biometrics.total_sleep_min % 60 : null;
    const sleepStr = sleepH != null ? `${sleepH}h ${sleepM}m` : 'n/a';
    biometricsSection = `
BIOMETRIC DATA (${source}):
- Readiness: ${biometrics.readiness_score ?? 'n/a'}/100 | Sleep: ${biometrics.sleep_score ?? 'n/a'}/100
- Total sleep: ${sleepStr} | REM: ${biometrics.rem_sleep_min ?? 'n/a'}m | Deep: ${biometrics.deep_sleep_min ?? 'n/a'}m
- HRV balance: ${biometrics.hrv_balance ?? 'n/a'}/100 | Resting HR: ${biometrics.resting_hr ?? 'n/a'} bpm
- Body temp deviation: ${biometrics.body_temp_deviation ?? 'n/a'}°C${biometrics.temp_flag ? ' ⚠️ elevated — possible hot flash signal' : ''}

Factor this recovery data into your recommendation alongside the check-in inputs.
`;
  }

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

COMPUTED READINESS: ${readiness} / 85
${biometricsSection}
PRIOR SESSION: ${priorText}

AVAILABLE VIDEOS FOR TODAY (already filtered for time and condition):
${videoListText || '  No videos matched filters — pick the gentlest option from the full library.'}

TASK:
1. Pick the single best video ID for today from the list above.
2. Write a weight_note: tell the user exactly what equipment to grab before pressing play (e.g. "Grab a pair of 8–12 lb dumbbells. If it's your first Caroline Girvan session, go lighter than you think."). If no equipment needed, say so warmly.
3. Write reasoning: 2–3 warm sentences directly to the user explaining why this video fits today. No jargon.
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
