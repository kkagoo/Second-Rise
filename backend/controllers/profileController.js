const db = require('../db/database');

function getProfile(req, res, next) {
  try {
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const parsed = { ...profile };
    if (parsed.chronic_joints) parsed.chronic_joints = JSON.parse(parsed.chronic_joints);
    if (parsed.equipment_available) parsed.equipment_available = JSON.parse(parsed.equipment_available);
    if (parsed.goal_details) {
      try { parsed.goal_details = JSON.parse(parsed.goal_details); } catch (_) {}
    }

    res.json(parsed);
  } catch (err) {
    next(err);
  }
}

function updateProfile(req, res, next) {
  try {
    const {
      age_range, menopause_stage, hrt_status, bone_health,
      pelvic_floor_history, chronic_joints, activity_baseline,
      equipment_available, preferred_time, dinner_cooks_interest,
      onboarding_complete, oura_access_token, cycle_tracking_consent,
      goal, goal_details, goal_target_date,
    } = req.body;

    db.prepare(`
      UPDATE user_profiles SET
        age_range               = COALESCE(?, age_range),
        menopause_stage         = COALESCE(?, menopause_stage),
        hrt_status              = COALESCE(?, hrt_status),
        bone_health             = COALESCE(?, bone_health),
        pelvic_floor_history    = COALESCE(?, pelvic_floor_history),
        chronic_joints          = COALESCE(?, chronic_joints),
        activity_baseline       = COALESCE(?, activity_baseline),
        equipment_available     = COALESCE(?, equipment_available),
        preferred_time          = COALESCE(?, preferred_time),
        dinner_cooks_interest   = COALESCE(?, dinner_cooks_interest),
        onboarding_complete     = COALESCE(?, onboarding_complete),
        oura_access_token       = COALESCE(?, oura_access_token),
        cycle_tracking_consent  = COALESCE(?, cycle_tracking_consent),
        goal                    = CASE WHEN ? IS NOT NULL THEN ? ELSE goal END,
        goal_details            = COALESCE(?, goal_details),
        goal_set_at             = CASE WHEN ? IS NOT NULL THEN datetime('now') ELSE goal_set_at END,
        goal_target_date        = COALESCE(?, goal_target_date),
        updated_at              = datetime('now')
      WHERE user_id = ?
    `).run(
      age_range ?? null,
      menopause_stage ?? null,
      hrt_status ?? null,
      bone_health ?? null,
      pelvic_floor_history !== undefined ? (pelvic_floor_history ? 1 : 0) : null,
      chronic_joints !== undefined ? JSON.stringify(chronic_joints) : null,
      activity_baseline ?? null,
      equipment_available !== undefined ? JSON.stringify(equipment_available) : null,
      preferred_time ?? null,
      dinner_cooks_interest !== undefined ? (dinner_cooks_interest ? 1 : 0) : null,
      onboarding_complete !== undefined ? (onboarding_complete ? 1 : 0) : null,
      oura_access_token ?? null,
      cycle_tracking_consent !== undefined ? (cycle_tracking_consent ? 1 : 0) : null,
      // goal: pass twice for CASE WHEN ? IS NOT NULL THEN ? ELSE goal END
      goal !== undefined ? (goal ?? null) : null,
      goal !== undefined ? (goal ?? null) : null,
      goal_details !== undefined ? JSON.stringify(goal_details) : null,
      // goal_set_at: reset to now whenever goal is explicitly set
      goal !== undefined ? (goal ?? null) : null,
      goal_target_date !== undefined ? (goal_target_date ?? null) : null,
      req.userId,
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
