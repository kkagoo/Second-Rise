const db = require('../db/database');
const { generateRecommendation } = require('../services/claudeService');
const { getFilteredVideos, getVideoById } = require('../services/videoLibrary');

async function getRecommendation(req, res, next) {
  try {
    const checkin = db.prepare(`
      SELECT * FROM daily_checkins
      WHERE user_id = ? AND date(timestamp) = date('now')
      ORDER BY timestamp DESC LIMIT 1
    `).get(req.userId);

    if (!checkin) return res.status(400).json({ error: "Complete today's check-in first" });

    // Return cached recommendation if it exists
    const existing = db.prepare('SELECT * FROM recommendations WHERE checkin_id = ?').get(checkin.checkin_id);
    if (existing) {
      const rec = { ...existing };
      if (rec.primary_workout) rec.primary_workout = JSON.parse(rec.primary_workout);
      return res.json(rec);
    }

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.userId);

    const priorFeedback = db.prepare(`
      SELECT psf.effort_rating, psf.flare_up_regions
      FROM post_session_feedback psf
      JOIN recommendations r ON psf.rec_id = r.rec_id
      JOIN daily_checkins dc ON r.checkin_id = dc.checkin_id
      WHERE dc.user_id = ?
      ORDER BY psf.timestamp DESC LIMIT 1
    `).get(req.userId);

    const parsedCheckin = {
      ...checkin,
      body_map_flags: checkin.body_map_flags ? JSON.parse(checkin.body_map_flags) : [],
      secondary_flags: checkin.secondary_flags ? JSON.parse(checkin.secondary_flags) : {},
    };

    const availableVideos = getFilteredVideos(
      checkin.layer1_time_avail,
      checkin.computed_readiness,
      parsedCheckin.body_map_flags,
      parsedCheckin.secondary_flags,
      profile
    );

    const { primary, alternatives } = await generateRecommendation(
      profile, parsedCheckin, checkin.computed_readiness, priorFeedback, availableVideos
    );

    // Store video selection in primary_workout as JSON
    const primaryWorkout = {
      type:        'video',
      id:          primary.id,
      youtube_id:  primary.youtube_id,
      title:       primary.title,
      creator:     primary.creator,
      duration_min: primary.duration_min,
      weight_note: primary.weight_note,
      session_type: primary.session_type,
    };

    const result = db.prepare(`
      INSERT INTO recommendations
        (checkin_id, user_id, primary_session_type, primary_reasoning, primary_workout,
         alt_1_type, alt_1_reasoning, alt_2_type, alt_2_reasoning, alt_3_type, alt_3_reasoning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      checkin.checkin_id,
      req.userId,
      primary.session_type,
      primary.reasoning,
      JSON.stringify(primaryWorkout),
      alternatives[0]?.id ?? null,
      alternatives[0]?.reasoning ?? null,
      alternatives[1]?.id ?? null,
      alternatives[1]?.reasoning ?? null,
      alternatives[2]?.id ?? null,
      alternatives[2]?.reasoning ?? null,
    );

    res.json({
      rec_id:               result.lastInsertRowid,
      primary_session_type: primary.session_type,
      primary_reasoning:    primary.reasoning,
      primary_workout:      primaryWorkout,
      alt_1_type:           alternatives[0]?.id,
      alt_1_title:          alternatives[0]?.title,
      alt_1_creator:        alternatives[0]?.creator,
      alt_1_youtube_id:     alternatives[0]?.youtube_id,
      alt_1_duration_min:   alternatives[0]?.duration_min,
      alt_1_reasoning:      alternatives[0]?.reasoning,
      alt_2_type:           alternatives[1]?.id,
      alt_2_title:          alternatives[1]?.title,
      alt_2_creator:        alternatives[1]?.creator,
      alt_2_youtube_id:     alternatives[1]?.youtube_id,
      alt_2_duration_min:   alternatives[1]?.duration_min,
      alt_2_reasoning:      alternatives[1]?.reasoning,
      alt_3_type:           alternatives[2]?.id,
      alt_3_title:          alternatives[2]?.title,
      alt_3_creator:        alternatives[2]?.creator,
      alt_3_youtube_id:     alternatives[2]?.youtube_id,
      alt_3_duration_min:   alternatives[2]?.duration_min,
      alt_3_reasoning:      alternatives[2]?.reasoning,
    });
  } catch (err) {
    next(err);
  }
}

function selectSession(req, res, next) {
  try {
    const { rec_id, session_type } = req.body;
    db.prepare(
      'UPDATE recommendations SET selected_session_type = ? WHERE rec_id = ? AND user_id = ?'
    ).run(session_type, rec_id, req.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRecommendation, selectSession };
