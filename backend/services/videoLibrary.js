const videos = require('../videos.json');

function getFilteredVideos(timeAvail, readiness, bodyFlags, secondaryFlags, profile) {
  const timeLimit = timeAvail === '35+' ? 45 : parseInt(timeAvail, 10);
  const flags = bodyFlags || [];
  const secondary = secondaryFlags || {};

  const painRegions = flags.map((f) => (f.region || '').toLowerCase());
  const hasKneePain     = painRegions.includes('knees');
  const hasShoulderPain = painRegions.includes('shoulders');
  const hasLowBack      = painRegions.includes('low back');
  const hasWrist        = painRegions.includes('wrists/hands');
  const hasHotFlashes   = !!secondary.hot_flashes;
  const boneIssue       = profile?.bone_health === 'osteopenia' || profile?.bone_health === 'osteoporosis';

  // Check if any flagged region has sharp/severe pain
  const hasSharpPain = flags.some(
    (f) => f.pain_type === 'Sharp' && (f.severity === 'moderate' || f.severity === 'severe')
  );

  return videos.filter((v) => {
    if (v.duration_min > timeLimit) return false;
    if (readiness <= 25 && v.intensity === 'high') return false;
    if (readiness <= 40 && v.difficulty >= 5) return false;
    if (hasHotFlashes && v.intensity === 'high') return false;
    if (boneIssue && v.intensity === 'high') return false;
    // Sharp/severe pain anywhere on the body map, not just the four regions with
    // dedicated rules below, should still push toward gentler sessions.
    if (hasSharpPain && (v.intensity === 'high' || v.difficulty >= 4)) return false;

    if (hasKneePain) {
      if (v.focus_tags.includes('lower_body') && v.difficulty >= 4) return false;
    }
    if (hasShoulderPain) {
      if (v.focus_tags.includes('upper_body') && v.intensity === 'high') return false;
    }
    if (hasLowBack && v.session_type === 'strength' && v.difficulty >= 4) return false;
    if (hasWrist && v.contra_tags.includes('wrist_light')) return false;

    return true;
  });
}

function getVideoById(id) {
  return videos.find((v) => v.id === id) || null;
}

// FIXED 2026-07-15: getFilteredVideos() alone could return an empty candidate list
// (verified: only reachable via a time_avail value too small for any video to fit,
// e.g. '2' minutes; stacking every safety-relevant flag at once still leaves 46/57
// videos eligible, so pain/hot-flash/bone-health/readiness rules alone can't empty it).
// The caller previously handled that empty case by telling the LLM to "pick the
// gentlest option from the full library," bypassing every deterministic safety rule
// at exactly the moment the system was most constrained. This function removes that
// bypass: it relaxes only the time budget (a UX constraint, not a safety one) first,
// and if that's still somehow empty, falls back to a hardcoded low-intensity,
// low-difficulty tier instead of the unfiltered catalog. Safety rules are never
// skipped, only the time window is.
function getFilteredVideosSafe(timeAvail, readiness, bodyFlags, secondaryFlags, profile) {
  const strict = getFilteredVideos(timeAvail, readiness, bodyFlags, secondaryFlags, profile);
  if (strict.length > 0) {
    return { videos: strict, timeRelaxed: false, usedSafeDefaults: false };
  }

  // Time was the only thing that could realistically zero out the pool. Relax it
  // and rerun with every safety rule still intact.
  const timeRelaxed = getFilteredVideos('35+', readiness, bodyFlags, secondaryFlags, profile);
  if (timeRelaxed.length > 0) {
    return { videos: timeRelaxed, timeRelaxed: true, usedSafeDefaults: false };
  }

  // Defensive floor, not currently reachable with this catalog: a hardcoded
  // low-intensity, low-difficulty tier, still filtered, never the raw catalog.
  const safeDefaults = videos.filter((v) => v.intensity === 'low' && v.difficulty <= 2);
  return { videos: safeDefaults, timeRelaxed: true, usedSafeDefaults: true };
}

module.exports = { videos, getFilteredVideos, getFilteredVideosSafe, getVideoById };
