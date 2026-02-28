const { SESSION_TYPES, ENERGY_SCORES, PAIN_MATRIX } = require('../utils/constants');

const SESSION_MIN_MINUTES = {
  'Strength Training':   25,
  'Mobility & Balance':  15,
  'Low-Impact Cardio':   20,
  'Yoga':                20,
  'Pelvic Floor & Core': 15,
  'Stretch & Release':   15,
  'Walk & Breathe':      15,
};

function buildPrompt(profile, checkin, readiness, priorFeedback) {
  const energyInfo = ENERGY_SCORES[checkin.layer1_energy] || { label: 'Unknown', emoji: '' };
  const bodyFlags  = Array.isArray(checkin.body_map_flags)
    ? checkin.body_map_flags
    : (checkin.body_map_flags ? JSON.parse(checkin.body_map_flags) : []);
  const secondary    = checkin.secondary_flags
    ? (typeof checkin.secondary_flags === 'string' ? JSON.parse(checkin.secondary_flags) : checkin.secondary_flags)
    : {};
  const chronicJoints = profile.chronic_joints
    ? (typeof profile.chronic_joints === 'string' ? JSON.parse(profile.chronic_joints) : profile.chronic_joints)
    : [];
  const equipment = profile.equipment_available
    ? (typeof profile.equipment_available === 'string' ? JSON.parse(profile.equipment_available) : profile.equipment_available)
    : [];

  const painMatrixText = Object.entries(PAIN_MATRIX)
    .map(([type, data]) => {
      const regionLines = Object.entries(data.regions)
        .map(([r, advice]) => `    ${r}: ${advice}`)
        .join('\n');
      return `  ${type} (rule: ${data.rule}):\n${regionLines}`;
    })
    .join('\n');

  const timeGateMinutes = checkin.layer1_time_avail === '35+' ? 35 : parseInt(checkin.layer1_time_avail, 10);
  const availableSessions = SESSION_TYPES.filter((s) => SESSION_MIN_MINUTES[s] <= timeGateMinutes);

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

  const specialRules = [];
  if (secondary.hot_flashes) {
    specialRules.push('- User has hot flashes today: avoid high-intensity sessions; prefer cooler, breathable movements.');
  }
  if (profile.bone_health === 'osteopenia' || profile.bone_health === 'osteoporosis') {
    specialRules.push('- Bone health concern: NO jumping, NO high-impact movements, NO spinal flexion under load.');
  }
  if (profile.pelvic_floor_history) {
    specialRules.push('- Pelvic floor history: include pelvic floor cues; avoid high-impact and heavy intra-abdominal pressure.');
  }
  if (chronicJoints.length > 0) {
    specialRules.push(`- Chronic joint concerns: ${chronicJoints.join(', ')} — always modify to reduce load on these joints.`);
  }

  return `USER PROFILE:
- Age range: ${profile.age_range || 'not specified'}
- Menopause stage: ${profile.menopause_stage || 'not specified'}
- HRT status: ${profile.hrt_status || 'not specified'}
- Bone health: ${profile.bone_health || 'unknown'}
- Pelvic floor history: ${profile.pelvic_floor_history ? 'yes' : 'no'}
- Chronic joints: ${chronicJoints.length > 0 ? chronicJoints.join(', ') : 'none'}
- Activity baseline: ${profile.activity_baseline || 'not specified'}
- Equipment available: ${equipment.length > 0 ? equipment.join(', ') : 'none / bodyweight only'}

TODAY'S CHECK-IN:
- Energy: ${energyInfo.emoji} ${energyInfo.label} (score: ${checkin.layer1_energy})
- Time available: ${checkin.layer1_time_avail} minutes
- Pain flagged: ${checkin.pain_flagged ? 'yes' : 'no'}
- Body flags:
${bodyFlagsText}
- Secondary symptoms:
${secondaryText}

COMPUTED READINESS SCORE: ${readiness} (out of 85)

PRIOR SESSION FEEDBACK:
${priorText}

PAIN ROUTING MATRIX:
${painMatrixText}

SPECIAL ROUTING RULES:
${specialRules.length > 0 ? specialRules.join('\n') : '- None today'}

TIME GATE: Only recommend sessions that fit within ${timeGateMinutes} minutes.
AVAILABLE SESSION TYPES (given time): ${availableSessions.join(', ')}

ALL SESSION TYPES FOR REFERENCE: ${SESSION_TYPES.join(', ')}

TASK: Choose the single best session type for today based on all the above. Write a complete workout plan for the primary session. Provide 3 alternatives with brief reasoning only (no full workout for alternatives).

WORKOUT STRUCTURE REQUIREMENTS:
- warmup: 2–4 movements, each with duration_sec and instruction
- main: 3–6 exercises with sets, reps, rest_sec, and form_cue
- cooldown: 2–3 stretches, each with duration_sec and instruction
- Total duration should fit within ${timeGateMinutes} minutes
- Reasoning should be 2–3 warm sentences spoken directly to the user, no jargon

Respond with ONLY valid JSON matching this schema exactly:
{
  "primary": {
    "session_type": string,
    "duration_min": number,
    "reasoning": string,
    "workout": {
      "warmup": [{ "name": string, "duration_sec": number, "instruction": string }],
      "main": [{ "name": string, "sets": number, "reps": number, "rest_sec": number, "form_cue": string }],
      "cooldown": [{ "name": string, "duration_sec": number, "instruction": string }]
    }
  },
  "alternatives": [
    { "session_type": string, "reasoning": string },
    { "session_type": string, "reasoning": string },
    { "session_type": string, "reasoning": string }
  ]
}`;
}

module.exports = { buildPrompt };
