// Runs the deterministic filter-layer evals. No API calls, no cost, run anytime.
//
// Usage: node backend/evals/runFilterEvals.js

const { getFilteredVideos, videos } = require('../services/videoLibrary');
const testCases = require('./testCases');

function computeReadiness() {
  // Placeholder, not used directly, readiness is passed in per test case
}

let passed = 0;
let failed = 0;
let gaps = 0;

console.log(`Running ${testCases.length} filter-layer evals against ${videos.length} videos...\n`);

for (const tc of testCases) {
  const filtered = getFilteredVideos(
    tc.checkin.layer1_time_avail,
    tc.readiness,
    tc.checkin.body_map_flags,
    tc.checkin.secondary_flags,
    tc.profile
  );

  const result = tc.assert(filtered, videos);
  const marker = result.isGap ? 'GAP ' : result.pass ? 'PASS' : 'FAIL';
  if (result.isGap) gaps++;
  else if (result.pass) passed++;
  else failed++;

  console.log(`[${marker}] ${tc.id}`);
  console.log(`       ${tc.description}`);
  console.log(`       ${result.detail}\n`);
}

console.log('---');
console.log(`${passed} passed, ${failed} failed, ${gaps} known gap(s) out of ${testCases.length} total.`);
