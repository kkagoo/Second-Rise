// Eval set for the video-filtering (safety) layer of Second Rise's recommendation pipeline.
// Targets getFilteredVideos() in ../services/videoLibrary.js.
//
// This is the deterministic, pre-Claude retrieval step: given a profile + check-in,
// which videos are even allowed to be candidates. These evals never call the Claude API,
// so they're free to run and fast enough to run on every change to the filter logic.
//
// Built 2026-07-15. First eval set for this pipeline; none existed before.

module.exports = [
  {
    id: 'knee_pain_excludes_hard_lower_body',
    description: 'Moderate knee pain should exclude lower_body videos at difficulty >= 4',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'knees', pain_type: 'Dull', severity: 'moderate' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter(
        (v) => v.focus_tags.includes('lower_body') && v.difficulty >= 4
      ).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked unsafe videos for knee pain: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} videos (${shouldBeExcluded.join(', ')})`,
      };
    },
  },
  {
    id: 'low_back_pain_excludes_hard_strength',
    description: 'Low back pain should exclude strength videos at difficulty >= 4, regardless of severity',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'low back', pain_type: 'Dull', severity: 'mild' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter(
        (v) => v.session_type === 'strength' && v.difficulty >= 4
      ).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked unsafe videos for low back pain: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} videos (${shouldBeExcluded.join(', ')})`,
      };
    },
  },
  {
    id: 'shoulder_pain_excludes_high_intensity_upper_body',
    description: 'Shoulder pain should exclude upper_body videos at high intensity',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'shoulders', pain_type: 'Sharp', severity: 'severe' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter(
        (v) => v.focus_tags.includes('upper_body') && v.intensity === 'high'
      ).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked unsafe videos for shoulder pain: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} videos (${shouldBeExcluded.join(', ')})`,
      };
    },
  },
  {
    id: 'wrist_pain_excludes_contra_tagged',
    description: 'Wrist/hand pain should exclude any video tagged contra_tags: wrist_light',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'wrists/hands', pain_type: 'Dull', severity: 'moderate' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.contra_tags.includes('wrist_light')).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked unsafe videos for wrist pain: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} videos (${shouldBeExcluded.join(', ')})`,
      };
    },
  },
  {
    id: 'hot_flashes_exclude_high_intensity',
    description: 'Hot flashes flag should exclude all high-intensity videos',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [],
      secondary_flags: { hot_flashes: true },
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.intensity === 'high').map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked high-intensity videos despite hot flashes: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} high-intensity videos`,
      };
    },
  },
  {
    id: 'osteoporosis_excludes_high_intensity',
    description: 'Osteoporosis (bone_health) should exclude all high-intensity videos',
    profile: { bone_health: 'osteoporosis' },
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.intensity === 'high').map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked high-intensity videos despite osteoporosis: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} high-intensity videos`,
      };
    },
  },
  {
    id: 'very_low_readiness_excludes_high_intensity',
    description: 'Readiness <= 25 should exclude high-intensity videos even with no pain flags',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 20,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.intensity === 'high').map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked high-intensity videos at readiness=20: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} high-intensity videos`,
      };
    },
  },
  {
    id: 'low_moderate_readiness_excludes_max_difficulty',
    description: 'Readiness <= 40 should exclude difficulty-5 videos',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 35,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.difficulty >= 5).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked difficulty-5 videos at readiness=35: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} difficulty-5 videos`,
      };
    },
  },
  {
    id: 'time_limit_respected',
    description: 'A 15-minute time budget should exclude every video longer than 15 minutes',
    profile: {},
    checkin: { layer1_time_avail: '15', body_map_flags: [], secondary_flags: {} },
    readiness: 70,
    assert: (filtered) => {
      const over = filtered.filter((v) => v.duration_min > 15);
      return {
        pass: over.length === 0,
        detail: over.length
          ? `Videos over the 15-minute budget leaked through: ${over.map((v) => v.id).join(', ')}`
          : 'All returned videos fit the 15-minute budget',
      };
    },
  },
  {
    id: 'healthy_baseline_returns_reasonable_pool',
    description: 'Sanity check: a healthy profile with no flags should not be over-filtered to near-zero options',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 75,
    assert: (filtered, allVideos) => {
      const pass = filtered.length >= Math.floor(allVideos.length * 0.5);
      return {
        pass,
        detail: `${filtered.length}/${allVideos.length} videos available for a healthy, unconstrained user`,
      };
    },
  },
  {
    id: 'sharp_severe_pain_excludes_high_intensity_and_difficulty',
    description:
      'FIXED 2026-07-15: hasSharpPain was computed but never referenced in the filter logic. ' +
      'A user reporting Sharp/severe pain in a region with no dedicated rule (e.g. hips) got no ' +
      'protection at all. Now sharp/severe pain anywhere excludes high-intensity and difficulty >= 4 videos.',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'hips', pain_type: 'Sharp', severity: 'severe' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.intensity === 'high' || v.difficulty >= 4).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked videos despite sharp/severe pain: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} high-intensity/high-difficulty videos for a region (hips) with no dedicated rule`,
      };
    },
  },
  // Cases 12-21 added 2026-07-15 to move the suite past Anthropic's cited 20-task starting
  // point. These aren't padding: each targets a boundary, a negative case (a rule that should
  // NOT fire), or an interaction between two rules that the first 11 cases didn't cover.
  {
    id: 'readiness_boundary_25_excludes_high_intensity',
    description: 'Readiness exactly at the <= 25 threshold should still exclude high-intensity videos (inclusive boundary)',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 25,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.intensity === 'high').map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked high-intensity videos at readiness=25: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} high-intensity videos at the inclusive boundary (readiness=25)`,
      };
    },
  },
  {
    id: 'readiness_boundary_26_allows_high_intensity',
    description: 'Negative case: readiness just above the threshold (26) should NOT trigger the <=25 high-intensity exclusion',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 26,
    assert: (filtered, allVideos) => {
      // Isolate the readiness<=25 rule from the separate readiness<=40/difficulty>=5 rule,
      // which also applies at readiness=26 and would otherwise confound this assertion.
      const highIntensity = allVideos
        .filter((v) => v.intensity === 'high' && v.difficulty < 5)
        .map((v) => v.id);
      const present = filtered.filter((v) => highIntensity.includes(v.id));
      return {
        pass: present.length === highIntensity.length,
        detail:
          present.length === highIntensity.length
            ? `All ${highIntensity.length} high-intensity, sub-difficulty-5 videos correctly remained eligible at readiness=26`
            : `Rule over-fired: excluded ${highIntensity.length - present.length} high-intensity videos above the readiness<=25 threshold`,
      };
    },
  },
  {
    id: 'readiness_boundary_40_excludes_difficulty5',
    description: 'Readiness exactly at the <= 40 threshold should still exclude difficulty-5 videos (inclusive boundary)',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 40,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.difficulty >= 5).map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked difficulty-5 videos at readiness=40: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} difficulty-5 videos at the inclusive boundary (readiness=40)`,
      };
    },
  },
  {
    id: 'readiness_boundary_41_allows_difficulty5',
    description: 'Negative case: readiness just above the threshold (41) should NOT trigger the <=40 difficulty-5 exclusion',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 41,
    assert: (filtered, allVideos) => {
      const difficulty5 = allVideos.filter((v) => v.difficulty >= 5).map((v) => v.id);
      const present = filtered.filter((v) => difficulty5.includes(v.id));
      return {
        pass: present.length === difficulty5.length,
        detail:
          present.length === difficulty5.length
            ? `All ${difficulty5.length} difficulty-5 videos correctly remained eligible at readiness=41`
            : `Rule over-fired: excluded ${difficulty5.length - present.length} difficulty-5 videos above the readiness<=40 threshold`,
      };
    },
  },
  {
    id: 'knee_pain_allows_lower_body_below_difficulty_4',
    description: 'Negative case: knee pain should NOT exclude lower_body videos below difficulty 4',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'knees', pain_type: 'Dull', severity: 'moderate' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldRemain = allVideos.filter(
        (v) => v.focus_tags.includes('lower_body') && v.difficulty < 4
      ).map((v) => v.id);
      const present = filtered.filter((v) => shouldRemain.includes(v.id));
      return {
        pass: present.length === shouldRemain.length,
        detail:
          present.length === shouldRemain.length
            ? `All ${shouldRemain.length} easier lower_body videos correctly stayed eligible for knee pain`
            : `Rule over-fired: excluded ${shouldRemain.length - present.length} lower_body videos below the difficulty>=4 threshold`,
      };
    },
  },
  {
    id: 'osteopenia_excludes_high_intensity',
    description: 'Osteopenia, not just osteoporosis, should exclude all high-intensity videos (boneIssue covers both)',
    profile: { bone_health: 'osteopenia' },
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcluded = allVideos.filter((v) => v.intensity === 'high').map((v) => v.id);
      const leaked = filtered.filter((v) => shouldBeExcluded.includes(v.id));
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked high-intensity videos despite osteopenia: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcluded.length} high-intensity videos for osteopenia`,
      };
    },
  },
  {
    id: 'mild_sharp_pain_does_not_trigger_broad_exclusion',
    description: 'Negative case: Sharp pain at mild severity should NOT trigger the sharp/severe-pain exclusion rule',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'hips', pain_type: 'Sharp', severity: 'mild' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const wouldBeExcludedIfRuleFired = allVideos.filter(
        (v) => v.intensity === 'high' || v.difficulty >= 4
      ).map((v) => v.id);
      const present = filtered.filter((v) => wouldBeExcludedIfRuleFired.includes(v.id));
      return {
        pass: present.length === wouldBeExcludedIfRuleFired.length,
        detail:
          present.length === wouldBeExcludedIfRuleFired.length
            ? `Mild Sharp pain correctly did not trigger the moderate/severe exclusion rule`
            : `Rule over-fired on mild severity: excluded ${wouldBeExcludedIfRuleFired.length - present.length} videos that should have stayed eligible`,
      };
    },
  },
  {
    id: 'dull_pain_in_undedicated_region_not_excluded',
    description: 'Negative case: Dull pain (not Sharp), even at severe severity, in a region with no dedicated rule should not trigger the sharp-pain exclusion',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [{ region: 'hips', pain_type: 'Dull', severity: 'severe' }],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const wouldBeExcludedIfRuleFired = allVideos.filter(
        (v) => v.intensity === 'high' || v.difficulty >= 4
      ).map((v) => v.id);
      const present = filtered.filter((v) => wouldBeExcludedIfRuleFired.includes(v.id));
      return {
        pass: present.length === wouldBeExcludedIfRuleFired.length,
        detail:
          present.length === wouldBeExcludedIfRuleFired.length
            ? `Severe Dull pain in an undedicated region correctly did not trigger the Sharp-pain-specific rule`
            : `Rule over-fired on pain_type: excluded ${wouldBeExcludedIfRuleFired.length - present.length} videos despite pain_type not being Sharp`,
      };
    },
  },
  {
    id: 'combined_knee_and_wrist_pain_applies_both_rules',
    description: 'Interaction case: knee pain and wrist pain flagged together should apply both exclusion rules independently',
    profile: {},
    checkin: {
      layer1_time_avail: '35+',
      body_map_flags: [
        { region: 'knees', pain_type: 'Dull', severity: 'moderate' },
        { region: 'wrists/hands', pain_type: 'Dull', severity: 'moderate' },
      ],
      secondary_flags: {},
    },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const shouldBeExcludedKnee = allVideos.filter(
        (v) => v.focus_tags.includes('lower_body') && v.difficulty >= 4
      ).map((v) => v.id);
      const shouldBeExcludedWrist = allVideos.filter((v) => v.contra_tags.includes('wrist_light')).map((v) => v.id);
      const leaked = filtered.filter(
        (v) => shouldBeExcludedKnee.includes(v.id) || shouldBeExcludedWrist.includes(v.id)
      );
      return {
        pass: leaked.length === 0,
        detail: leaked.length
          ? `Leaked videos with combined knee/wrist pain: ${leaked.map((v) => v.id).join(', ')}`
          : `Correctly excluded ${shouldBeExcludedKnee.length} knee-unsafe and ${shouldBeExcludedWrist.length} wrist-unsafe videos simultaneously`,
      };
    },
  },
  {
    id: 'wrist_light_video_allowed_without_wrist_pain_flag',
    description: 'Negative case: videos tagged contra_tags wrist_light should remain eligible when there is no wrist/hand pain flag',
    profile: {},
    checkin: { layer1_time_avail: '35+', body_map_flags: [], secondary_flags: {} },
    readiness: 70,
    assert: (filtered, allVideos) => {
      const wristLight = allVideos.filter((v) => v.contra_tags.includes('wrist_light')).map((v) => v.id);
      const present = filtered.filter((v) => wristLight.includes(v.id));
      return {
        pass: present.length === wristLight.length,
        detail:
          present.length === wristLight.length
            ? `All ${wristLight.length} wrist_light-tagged videos correctly stayed eligible with no wrist pain flag`
            : `Rule over-fired: excluded ${wristLight.length - present.length} wrist_light videos despite no wrist pain flag`,
      };
    },
  },
];
