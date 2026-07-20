// Regression tests: manual activity log wired into recommendation pipeline.
// Verifies the full chain: recommendController → claudeService → promptBuilder.
//
// Usage: node backend/evals/runManualActivityEvals.js

const fs   = require('fs');
const path = require('path');
const { buildVideoPrompt } = require('../services/promptBuilder');

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseProfile  = { age_range: '50-54', menopause_stage: 'perimenopause', goal: 'build_strength' };
const baseCheckin  = { layer1_energy: 65, layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {}, workout_preference: null };
const baseReadiness = 60;
const baseVideos   = [];

const sampleActivities = [
  { activity_date: '2026-07-19', category: 'cardio', activity: 'Hike', duration_min: 120, intensity: 'hard', notes: 'Steep trail, felt strong' },
  { activity_date: '2026-07-18', category: 'strength', activity: 'Gym session', duration_min: 60, intensity: 'moderate', notes: null },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

run('recommend_controller_has_getRecentManualActivities', 'recommendController.js defines getRecentManualActivities function', () => {
  const src = fs.readFileSync(path.join(__dirname, '../controllers/recommendController.js'), 'utf8');
  const hasFn = src.includes('function getRecentManualActivities');
  const queriesActivityLog = src.includes('activity_log') && src.includes("source = 'manual'");
  return {
    pass: hasFn && queriesActivityLog,
    detail: hasFn && queriesActivityLog
      ? '✓ getRecentManualActivities defined and queries activity_log with source=manual'
      : `Missing: ${!hasFn ? 'function definition' : ''} ${!queriesActivityLog ? 'activity_log query' : ''}`.trim(),
  };
});

run('recommend_controller_passes_manual_activities_to_generate', 'recommendController.js passes recentManualActivities to generateRecommendation', () => {
  const src = fs.readFileSync(path.join(__dirname, '../controllers/recommendController.js'), 'utf8');
  const passes = src.includes('recentManualActivities') && src.includes('generateRecommendation');
  const callIncludesArg = src.match(/generateRecommendation\([^)]*recentManualActivities[^)]*\)/);
  return {
    pass: !!(passes && callIncludesArg),
    detail: passes && callIncludesArg
      ? '✓ recentManualActivities fetched and passed to generateRecommendation'
      : 'recentManualActivities not passed in generateRecommendation call',
  };
});

run('claude_service_accepts_manual_activities', 'claudeService.js generateRecommendation signature accepts recentManualActivities', () => {
  const src = fs.readFileSync(path.join(__dirname, '../services/claudeService.js'), 'utf8');
  const hasParam = src.includes('recentManualActivities');
  const passesToPrompt = src.match(/buildVideoPrompt\([^)]*recentManualActivities[^)]*\)/);
  return {
    pass: !!(hasParam && passesToPrompt),
    detail: hasParam && passesToPrompt
      ? '✓ claudeService accepts and forwards recentManualActivities to buildVideoPrompt'
      : `Missing: ${!hasParam ? 'param in signature' : ''} ${!passesToPrompt ? 'arg in buildVideoPrompt call' : ''}`.trim(),
  };
});

run('promptbuilder_accepts_manual_activities_param', 'buildVideoPrompt signature includes recentManualActivities parameter', () => {
  const src = fs.readFileSync(path.join(__dirname, '../services/promptBuilder.js'), 'utf8');
  const hasParam = src.includes('recentManualActivities');
  const hasSection = src.includes('MANUAL ACTIVITIES LOGGED THIS WEEK');
  return {
    pass: hasParam && hasSection,
    detail: hasParam && hasSection
      ? '✓ recentManualActivities param present and MANUAL ACTIVITIES section defined'
      : `Missing: ${!hasParam ? 'parameter' : ''} ${!hasSection ? 'prompt section' : ''}`.trim(),
  };
});

run('prompt_includes_manual_activities_when_present', 'buildVideoPrompt injects manual activity data into prompt when activities exist', () => {
  const prompt = buildVideoPrompt(
    baseProfile, baseCheckin, baseReadiness, null, baseVideos,
    null, [], null, [], [], null, sampleActivities
  );
  const hasHike    = prompt.includes('Hike');
  const hasGym     = prompt.includes('Gym session');
  const hasWarning = prompt.includes('Factor these into your recommendation');
  return {
    pass: hasHike && hasGym && hasWarning,
    detail: hasHike && hasGym && hasWarning
      ? '✓ Hike and Gym session appear in prompt with factoring instruction'
      : `Missing from prompt: ${!hasHike ? 'Hike' : ''} ${!hasGym ? 'Gym session' : ''} ${!hasWarning ? 'factoring instruction' : ''}`.trim(),
  };
});

run('prompt_omits_manual_section_when_no_activities', 'buildVideoPrompt omits manual activities section when list is empty', () => {
  const prompt = buildVideoPrompt(
    baseProfile, baseCheckin, baseReadiness, null, baseVideos,
    null, [], null, [], [], null, []
  );
  const hasSection = prompt.includes('MANUAL ACTIVITIES LOGGED THIS WEEK');
  return {
    pass: !hasSection,
    detail: !hasSection
      ? '✓ Manual activities section correctly absent when no activities logged'
      : 'Manual activities section unexpectedly present with empty list',
  };
});

run('prompt_includes_intensity_and_duration', 'Manual activity entries include intensity and duration in the prompt', () => {
  const prompt = buildVideoPrompt(
    baseProfile, baseCheckin, baseReadiness, null, baseVideos,
    null, [], null, [], [], null, sampleActivities
  );
  const hasIntensity = prompt.includes('hard intensity') || prompt.includes('moderate intensity');
  const hasDuration  = prompt.includes('120 min') || prompt.includes('60 min');
  return {
    pass: hasIntensity && hasDuration,
    detail: hasIntensity && hasDuration
      ? '✓ Intensity and duration both present in manual activity lines'
      : `Missing: ${!hasIntensity ? 'intensity' : ''} ${!hasDuration ? 'duration' : ''}`.trim(),
  };
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('─'.repeat(60));
console.log(`${passed} passed, ${failed} failed out of ${passed + failed} total manual-activity evals.`);
if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => !r.pass).forEach(r => console.log(`  • ${r.id}: ${r.detail}`));
  process.exit(1);
}
