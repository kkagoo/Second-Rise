const videos = require('../data/videos.json');

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

module.exports = { videos, getFilteredVideos, getVideoById };
