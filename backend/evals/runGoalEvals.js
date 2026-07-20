// Goal-aware regression tests for Second Rise.
// Tests two layers:
//   1. Prompt layer — buildVideoPrompt injects the correct goal section for each goal
//   2. Library layer — enough candidate videos exist per goal type to avoid repetition
//
// Usage: node backend/evals/runGoalEvals.js

const { buildVideoPrompt } = require('../services/promptBuilder');
const { getFilteredVideosSafe, videos } = require('../services/videoLibrary');

let passed = 0;
let failed = 0;
const results = [];

function run(id, description, fn) {
  try {
    const result = fn();
    const marker = result.pass ? 'PASS' : 'FAIL';
    if (result.pass) passed++; else failed++;
    results.push({ id, description, ...result, marker });
    console.log(`[${marker}] ${id}`);
    console.log(`       ${description}`);
    console.log(`       ${result.detail}\n`);
  } catch (err) {
    failed++;
    results.push({ id, description, pass: false, detail: `Threw: ${err.message}`, marker: 'FAIL' });
    console.log(`[FAIL] ${id}`);
    console.log(`       ${description}`);
    console.log(`       Error: ${err.message}\n`);
  }
}

// ── Shared test fixtures ─────────────────────────────────────────────────────

const baseCheckin = {
  layer1_energy: 65,
  layer1_time_avail: '35+',
  body_map_flags: [],
  secondary_flags: {},
  workout_preference: null,
};

const baseProfile = {
  age_range: '45-49',
  menopause_stage: 'perimenopause',
  bone_health: 'normal',
  pelvic_floor_history: 0,
  chronic_joints: [],
  equipment_available: ['dumbbells'],
  activity_baseline: 'moderate',
};

function promptForGoal(goal, goalDetails = null, goalTargetDate = null, goalSetAt = null) {
  const profile = {
    ...baseProfile,
    goal,
    goal_details: goalDetails,
    goal_target_date: goalTargetDate,
    goal_set_at: goalSetAt || new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
  };
  const { videos: available } = getFilteredVideosSafe('35+', 65, [], {}, profile);
  return buildVideoPrompt(profile, baseCheckin, 65, null, available);
}

// ── LAYER 1: Prompt injection tests ─────────────────────────────────────────

run('prompt_build_strength_goal_included', 'buildVideoPrompt includes strength bias for build_strength goal', () => {
  const prompt = promptForGoal('build_strength');
  const hasGoal = prompt.includes('Build Strength') && prompt.includes('strength sessions');
  return {
    pass: hasGoal,
    detail: hasGoal ? 'Prompt contains Build Strength goal section with session bias' : 'Missing Build Strength goal text in prompt',
  };
});

run('prompt_boost_energy_goal_included', 'buildVideoPrompt includes cardio+strength mix for boost_energy goal', () => {
  const prompt = promptForGoal('boost_energy');
  const hasGoal = prompt.includes('Boost Energy') && prompt.includes('cardio');
  return {
    pass: hasGoal,
    detail: hasGoal ? 'Prompt contains Boost Energy goal section with cardio mention' : 'Missing Boost Energy goal text in prompt',
  };
});

run('prompt_sleep_stress_goal_included', 'buildVideoPrompt includes yoga/low-intensity bias for sleep_stress goal', () => {
  const prompt = promptForGoal('sleep_stress');
  const hasGoal = prompt.includes('Sleep Better') && prompt.includes('yoga');
  return {
    pass: hasGoal,
    detail: hasGoal ? 'Prompt contains Sleep/Stress goal section with yoga bias' : 'Missing Sleep/Stress goal text in prompt',
  };
});

run('prompt_mobility_goal_included', 'buildVideoPrompt includes mobility bias for mobility goal', () => {
  const prompt = promptForGoal('mobility');
  const hasGoal = prompt.includes('Mobility') && prompt.includes('yoga');
  return {
    pass: hasGoal,
    detail: hasGoal ? 'Prompt contains Mobility goal section' : 'Missing Mobility goal text in prompt',
  };
});

run('prompt_consistency_goal_included', 'buildVideoPrompt includes habit-building bias for consistency goal', () => {
  const prompt = promptForGoal('consistency');
  const hasGoal = prompt.includes('Consistently') && (prompt.includes('habit') || prompt.includes('session'));
  return {
    pass: hasGoal,
    detail: hasGoal ? 'Prompt contains Consistency goal section' : 'Missing Consistency goal text in prompt',
  };
});

run('prompt_midlife_goal_included', 'buildVideoPrompt includes bone health / pelvic floor bias for midlife goal', () => {
  const prompt = promptForGoal('midlife');
  const hasGoal = prompt.includes('Midlife') && (prompt.includes('bone') || prompt.includes('pelvic'));
  return {
    pass: hasGoal,
    detail: hasGoal ? 'Prompt contains Midlife goal section with bone/pelvic mention' : 'Missing Midlife goal text in prompt',
  };
});

run('prompt_train_for_goal_included', 'buildVideoPrompt includes event details for train_for goal', () => {
  const details = { what: 'Machu Picchu hike', success: 'Complete without stopping', needs: ['Endurance', 'Strength'] };
  const prompt = promptForGoal('train_for', JSON.stringify(details), '2026-10-15');
  const hasWhat    = prompt.includes('Machu Picchu');
  const hasDate    = prompt.includes('2026-10-15') || prompt.includes('days remaining');
  const hasNeeds   = prompt.includes('Endurance');
  return {
    pass: hasWhat && hasDate && hasNeeds,
    detail: [
      hasWhat  ? '✓ event name'        : '✗ missing event name',
      hasDate  ? '✓ target date'       : '✗ missing target date',
      hasNeeds ? '✓ training needs'    : '✗ missing training needs',
    ].join(' | '),
  };
});

run('prompt_no_goal_omits_goal_section', 'buildVideoPrompt omits goal section when no goal is set', () => {
  const profile = { ...baseProfile, goal: null };
  const { videos: available } = getFilteredVideosSafe('35+', 65, [], {}, profile);
  const prompt = buildVideoPrompt(profile, baseCheckin, 65, null, available);
  const hasGoalSection = prompt.includes('MOVEMENT GOAL');
  return {
    pass: !hasGoalSection,
    detail: !hasGoalSection ? 'No MOVEMENT GOAL section when goal is null' : 'Incorrectly included MOVEMENT GOAL section with null goal',
  };
});

run('prompt_goal_includes_day_counter', 'Prompt includes day counter for goal progress', () => {
  const prompt = promptForGoal('build_strength');
  const hasDay = /Day \d+/.test(prompt);
  return {
    pass: hasDay,
    detail: hasDay ? 'Day counter present in prompt' : 'Missing Day counter in goal section',
  };
});

// ── LAYER 2: Video library coverage per goal ─────────────────────────────────

const MIN_COVERAGE = {
  build_strength: { label: 'Strength videos', min: 10 },
  boost_energy:   { label: 'Low-impact cardio videos', min: 8 },
  sleep_stress:   { label: 'Low-intensity yoga + mobility', min: 10 },
  mobility:       { label: 'Mobility videos', min: 6 },
  consistency:    { label: 'Sessions ≤ 15 min', min: 10 },
  midlife:        { label: 'Midlife-appropriate (osteoporosis/pelvic-floor tagged)', min: 8 },
  train_for:      { label: 'Hike-prep tagged videos', min: 5 },
};

const LIBRARY_COUNTS = {
  build_strength: videos.filter(v => v.session_type === 'strength').length,
  boost_energy:   videos.filter(v => v.session_type === 'low_impact_cardio').length,
  sleep_stress:   videos.filter(v => ['yoga','mobility'].includes(v.session_type) && v.intensity === 'low').length,
  mobility:       videos.filter(v => v.session_type === 'mobility').length,
  consistency:    videos.filter(v => v.duration_min <= 15).length,
  midlife:        videos.filter(v => v.focus_tags?.some(t => ['osteoporosis_safe','pelvic_floor','pelvic_floor_safe','pelvic_floor_aware','bone_health','bone_density_support'].includes(t))).length,
  train_for:      videos.filter(v => v.focus_tags?.includes('hike_prep')).length,
};

for (const [goalId, spec] of Object.entries(MIN_COVERAGE)) {
  const count = LIBRARY_COUNTS[goalId];
  run(
    `library_coverage_${goalId}`,
    `Library has ≥${spec.min} videos for ${goalId} goal (${spec.label})`,
    () => ({
      pass: count >= spec.min,
      detail: `${count} / ${spec.min} minimum — ${count >= spec.min ? 'adequate' : '⚠ BELOW MINIMUM'}`,
    })
  );
}

// ── Onboarding regression: goal step exists in STEPS ────────────────────────
// (Pure JS check — no React needed)

run('onboarding_goal_step_defined', 'GoalSelector is importable and GOALS array has 7 entries', () => {
  // Dynamic require so this test file still runs even if GoalSelector is a .jsx (node won't parse JSX)
  // We'll just verify the GoalSelector file exists and has the right exports
  const fs = require('fs');
  const path = require('path');
  const goalFile = path.join(__dirname, '../../frontend/src/components/GoalSelector.jsx');
  const exists = fs.existsSync(goalFile);
  if (!exists) return { pass: false, detail: 'GoalSelector.jsx not found at expected path' };

  const src = fs.readFileSync(goalFile, 'utf8');
  const goalIds = ['build_strength','boost_energy','sleep_stress','mobility','consistency','midlife','train_for'];
  const missing = goalIds.filter(id => !src.includes(id));
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `All 7 goal IDs present in GoalSelector.jsx`
      : `Missing goal IDs: ${missing.join(', ')}`,
  };
});

run('onboarding_wizard_has_goal_step', 'OnboardingWizard.jsx contains goal custom step and GoalSelector import', () => {
  const fs = require('fs');
  const path = require('path');
  const wizardFile = path.join(__dirname, '../../frontend/src/components/onboarding/OnboardingWizard.jsx');
  const src = fs.readFileSync(wizardFile, 'utf8');
  const hasImport   = src.includes("import GoalSelector");
  const hasCustom   = src.includes("custom: 'goal'");
  const hasRequired = src.includes("isStepComplete") && src.includes("answers.goal");
  return {
    pass: hasImport && hasCustom && hasRequired,
    detail: [
      hasImport   ? '✓ GoalSelector imported'       : '✗ GoalSelector not imported',
      hasCustom   ? '✓ goal custom step in STEPS'   : '✗ goal step missing from STEPS',
      hasRequired ? '✓ goal required in isStepComplete' : '✗ goal not required',
    ].join(' | '),
  };
});

run('profile_controller_accepts_goal_fields', 'profileController.js handles goal, goal_details, goal_set_at, goal_target_date', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../controllers/profileController.js'), 'utf8');
  const checks = ['goal', 'goal_details', 'goal_set_at', 'goal_target_date'];
  const missing = checks.filter(f => !src.includes(f));
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? 'All 4 goal fields present in profileController'
      : `Missing fields: ${missing.join(', ')}`,
  };
});

run('promptbuilder_has_goal_bias_for_all_goals', 'promptBuilder.js contains bias text for all 7 goals', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../services/promptBuilder.js'), 'utf8');
  const goals = ['build_strength','boost_energy','sleep_stress','mobility','consistency','midlife','train_for'];
  const missing = goals.filter(g => !src.includes(g));
  return {
    pass: missing.length === 0,
    detail: missing.length === 0
      ? 'All 7 goal keys present in promptBuilder'
      : `Missing goal keys: ${missing.join(', ')}`,
  };
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('─'.repeat(60));
console.log(`${passed} passed, ${failed} failed out of ${passed + failed} total goal-aware evals.`);
if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => !r.pass).forEach(r => console.log(`  • ${r.id}: ${r.detail}`));
  process.exit(1);
}
