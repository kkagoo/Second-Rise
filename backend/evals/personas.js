// Realistic personas for the LLM-layer evals. Each exercises a different combination
// of the context stuffed into buildVideoPrompt: pain flags, biometrics, weekly balance
// history, explicit preference vs. safety conflict, and "surprise me" defaults.

const { getFilteredVideosSafe } = require('../services/videoLibrary');

// Mirrors what recommendController.js actually calls in production (getFilteredVideosSafe,
// not the raw filter), so these evals exercise real behavior, including the fallback
// path fixed 2026-07-15.
function withFiltered(p) {
  const { videos: availableVideos, timeRelaxed, usedSafeDefaults } = getFilteredVideosSafe(
    p.checkin.layer1_time_avail,
    p.readiness,
    p.checkin.body_map_flags,
    p.checkin.secondary_flags,
    p.profile
  );
  return { ...p, availableVideos, timeRelaxed, usedSafeDefaults };
}

const personas = [
  {
    id: 'healthy_surprise_me',
    profile: { age_range: '45-50', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: ['dumbbells'] },
    checkin: {
      layer1_energy: 65, layer1_time_avail: '35+',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    readiness: 72,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      return { pass: inCandidates, detail: inCandidates ? `Picked ${result.primary.id}, in candidate set` : `Picked ${result.primary.id}, NOT in the filtered candidate set sent to Claude` };
    },
  },
  {
    id: 'knee_pain_requests_lower_body_strength',
    profile: { age_range: '50-55', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: [] },
    checkin: {
      layer1_energy: 70, layer1_time_avail: '35+',
      body_map_flags: [{ region: 'knees', pain_type: 'Dull', severity: 'moderate' }],
      secondary_flags: {}, workout_preference: 'strength',
    },
    readiness: 70,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const unsafe = result.primary.focus_tags?.includes('lower_body') && result.primary.difficulty >= 4;
      return {
        pass: inCandidates && !unsafe,
        detail: `Picked ${result.primary.id} (difficulty ${result.primary.difficulty}). In candidates: ${inCandidates}. Unsafe for knee pain: ${unsafe}`,
      };
    },
  },
  {
    id: 'low_readiness_low_recovery',
    profile: { age_range: '48-53', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: ['mat'] },
    checkin: {
      layer1_energy: 20, layer1_time_avail: '20',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    readiness: 22,
    priorFeedback: null,
    biometrics: {
      sleep_source: 'oura', recovery_source: 'oura', energy_label: 'Rest day — very low recovery',
      recovery_score: 24, sleep_score: 41, total_sleep_min: 320, hrv_balance: 30, resting_hr: 68,
    },
    history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const tooIntense = result.primary.intensity === 'high';
      return { pass: inCandidates && !tooIntense, detail: `Picked ${result.primary.id}, intensity ${result.primary.intensity}. In candidates: ${inCandidates}` };
    },
  },
  {
    id: 'weekly_balance_avoid_repeat_upper_body',
    profile: { age_range: '46-51', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: ['dumbbells', 'resistance_bands'] },
    checkin: {
      layer1_energy: 68, layer1_time_avail: '35+',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    readiness: 68,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null,
    weeklySchedule: [
      { workout_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), body_focus: 'strength_upper' },
      { workout_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), body_focus: 'strength_upper' },
    ],
    checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const repeatsUpper = result.primary.focus_tags?.includes('upper_body') && result.primary.session_type === 'strength';
      return { pass: inCandidates && !repeatsUpper, detail: `Picked ${result.primary.id} (${result.primary.session_type}, tags: ${result.primary.focus_tags?.join(',')}). Repeats upper-body strength after 2 days of it: ${repeatsUpper}` };
    },
  },
  {
    id: 'hot_flashes_wants_high_intensity',
    profile: { age_range: '49-54', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: [] },
    checkin: {
      layer1_energy: 60, layer1_time_avail: '35+',
      body_map_flags: [], secondary_flags: { hot_flashes: true }, workout_preference: 'strength',
    },
    readiness: 65,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const tooIntense = result.primary.intensity === 'high';
      return { pass: inCandidates && !tooIntense, detail: `Picked ${result.primary.id}, intensity ${result.primary.intensity} despite hot-flash flag and a request for strength. In candidates: ${inCandidates}` };
    },
  },
  {
    id: 'short_time_budget',
    profile: { age_range: '44-49', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: [] },
    checkin: {
      layer1_energy: 55, layer1_time_avail: '15',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    readiness: 60,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const tooLong = result.primary.duration_min > 15;
      return { pass: inCandidates && !tooLong, detail: `Picked ${result.primary.id}, ${result.primary.duration_min} min against a 15-min budget. In candidates: ${inCandidates}` };
    },
  },
  // Personas 7-10 added 2026-07-15: adversarial and negative cases for the LLM layer,
  // plus a regression test for the empty-candidate-list fallback fix in videoLibrary.js.
  {
    id: 'multi_region_pain_interaction',
    profile: { age_range: '48-53', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: ['dumbbells'] },
    checkin: {
      layer1_energy: 60, layer1_time_avail: '35+',
      body_map_flags: [
        { region: 'knees', pain_type: 'Dull', severity: 'moderate' },
        { region: 'wrists/hands', pain_type: 'Dull', severity: 'moderate' },
      ],
      secondary_flags: {}, workout_preference: 'strength',
    },
    readiness: 70,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const unsafeKnee = result.primary.focus_tags?.includes('lower_body') && result.primary.difficulty >= 4;
      const unsafeWrist = result.primary.contra_tags?.includes('wrist_light');
      return {
        pass: inCandidates && !unsafeKnee && !unsafeWrist,
        detail: `Picked ${result.primary.id}. In candidates: ${inCandidates}. Violates knee rule: ${unsafeKnee}. Violates wrist rule: ${unsafeWrist}`,
      };
    },
  },
  {
    id: 'strong_repeat_avoidance_signal',
    profile: { age_range: '46-51', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: ['dumbbells', 'resistance_bands'] },
    checkin: {
      layer1_energy: 68, layer1_time_avail: '35+',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    readiness: 68,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null,
    // Five straight days of upper-body strength, not just two, a much stronger repeat
    // signal than the existing weekly_balance persona. Does the soft guidance hold,
    // or does a longer streak make the model treat it as "this is just her pattern"?
    weeklySchedule: Array.from({ length: 5 }, (_, i) => ({
      workout_date: new Date(Date.now() - (i + 1) * 86400000).toISOString().slice(0, 10),
      body_focus: 'strength_upper',
    })),
    checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const repeatsUpper = result.primary.focus_tags?.includes('upper_body') && result.primary.session_type === 'strength';
      return { pass: inCandidates && !repeatsUpper, detail: `Picked ${result.primary.id} (${result.primary.session_type}, tags: ${result.primary.focus_tags?.join(',')}). Repeats upper-body strength after a 5-day streak: ${repeatsUpper}` };
    },
  },
  {
    id: 'todays_readiness_below_personal_baseline',
    profile: { age_range: '47-52', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: [] },
    checkin: {
      layer1_energy: 55, layer1_time_avail: '35+',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    // 68 looks like a reasonably good day in isolation, but her 30-day average is 85,
    // well above today. Tests whether the model uses the personal-baseline comparison
    // correctly (below her own normal) rather than just reading today's number at face value.
    readiness: 68,
    priorFeedback: null,
    biometrics: { sleep_source: 'oura', recovery_source: 'oura', energy_label: 'Moderate', recovery_score: 68, sleep_score: 70, total_sleep_min: 400, hrv_balance: 60, resting_hr: 62 },
    history: [], baseline: { days_of_data: 30, avg_readiness: 85, avg_hrv: 78, avg_rhr: 58, avg_sleep_min: 430 },
    weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      const tooIntense = result.primary.intensity === 'high';
      return {
        pass: inCandidates && !tooIntense,
        detail: `Picked ${result.primary.id}, intensity ${result.primary.intensity}. Today's readiness (68) is well below her 30-day baseline (85). In candidates: ${inCandidates}`,
      };
    },
  },
  {
    id: 'empty_candidate_fallback_regression_test',
    profile: { age_range: '45-50', menopause_stage: 'perimenopause', bone_health: 'normal', equipment_available: [] },
    checkin: {
      // Synthetic, out-of-range value: no video is this short, so the strict filter
      // returns zero candidates and getFilteredVideosSafe() has to relax time.
      // This is NOT a value the app UI is known to offer; it's here specifically to
      // regression-test the 2026-07-15 fix so the fallback never again bypasses
      // safety rules by reaching into the unfiltered catalog.
      layer1_energy: 65, layer1_time_avail: '2',
      body_map_flags: [], secondary_flags: {}, workout_preference: 'surprise',
    },
    readiness: 70,
    priorFeedback: null,
    biometrics: null, history: [], baseline: null, weeklySchedule: [], checkinTrend: [], biometricTrend: null,
    check: (result, ctx) => {
      const inCandidates = ctx.availableVideos.some((v) => v.id === result.primary.id);
      return {
        pass: inCandidates && ctx.timeRelaxed,
        detail: `Picked ${result.primary.id}. timeRelaxed=${ctx.timeRelaxed}, usedSafeDefaults=${ctx.usedSafeDefaults}, candidate pool size=${ctx.availableVideos.length}. In candidates: ${inCandidates}`,
      };
    },
  },
];

module.exports = personas.map(withFiltered);
