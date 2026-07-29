const db     = require('../db/database');
const crypto = require('crypto');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function endDate(startDate, durationDays) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + durationDays - 1);
  return d.toISOString().slice(0, 10);
}

function daysLeft(startDate, durationDays) {
  const today = new Date(todayStr());
  const end   = new Date(endDate(startDate, durationDays));
  const diff  = Math.ceil((end - today) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diff);
}

// ── POST /api/challenges  (auth required — creator must be logged in) ──────────
function createChallenge(req, res, next) {
  try {
    const { name, duration_days = 5 } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (![3, 5, 7].includes(Number(duration_days))) {
      return res.status(400).json({ error: 'duration_days must be 3, 5, or 7' });
    }

    const short_code = crypto.randomBytes(4).toString('hex'); // e.g. "a3f2c1d0"
    const start_date = todayStr();

    const result = db.prepare(`
      INSERT INTO challenges (creator_id, short_code, name, duration_days, start_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, short_code, name.trim(), Number(duration_days), start_date);

    // Creator auto-joins
    db.prepare(`
      INSERT OR IGNORE INTO challenge_participants (challenge_id, user_id)
      VALUES (?, ?)
    `).run(result.lastInsertRowid, req.userId);

    res.status(201).json({ short_code, id: result.lastInsertRowid });
  } catch (err) { next(err); }
}

// ── GET /api/challenges/:code  (public — no auth required) ────────────────────
function getChallenge(req, res, next) {
  try {
    const challenge = db.prepare(`
      SELECT c.*, u.email AS creator_email
      FROM challenges c
      JOIN users u ON u.id = c.creator_id
      WHERE c.short_code = ?
    `).get(req.params.code);

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const today = todayStr();
    const participantCount = db.prepare(`
      SELECT COUNT(*) AS cnt FROM challenge_participants WHERE challenge_id = ?
    `).get(challenge.id).cnt;

    const todayCheckinCount = db.prepare(`
      SELECT COUNT(*) AS cnt FROM challenge_checkins
      WHERE challenge_id = ? AND checkin_date = ?
    `).get(challenge.id, today).cnt;

    // Did the requesting user already check in today? (only if auth token present)
    let userCheckedInToday = false;
    let userIsParticipant  = false;
    if (req.userId) {
      userCheckedInToday = !!db.prepare(`
        SELECT 1 FROM challenge_checkins
        WHERE challenge_id = ? AND user_id = ? AND checkin_date = ?
      `).get(challenge.id, req.userId, today);
      userIsParticipant = !!db.prepare(`
        SELECT 1 FROM challenge_participants
        WHERE challenge_id = ? AND user_id = ?
      `).get(challenge.id, req.userId);
    }

    res.json({
      short_code:          challenge.short_code,
      name:                challenge.name,
      duration_days:       challenge.duration_days,
      start_date:          challenge.start_date,
      end_date:            endDate(challenge.start_date, challenge.duration_days),
      days_left:           daysLeft(challenge.start_date, challenge.duration_days),
      participant_count:   participantCount,
      today_checkin_count: todayCheckinCount,
      user_checked_in_today: userCheckedInToday,
      user_is_participant:   userIsParticipant,
      creator_email:       challenge.creator_email,
    });
  } catch (err) { next(err); }
}

// ── POST /api/challenges/:code/join  (auth required) ─────────────────────────
function joinChallenge(req, res, next) {
  try {
    const challenge = db.prepare(`SELECT * FROM challenges WHERE short_code = ?`).get(req.params.code);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (daysLeft(challenge.start_date, challenge.duration_days) === 0) {
      return res.status(400).json({ error: 'This challenge has ended' });
    }

    db.prepare(`
      INSERT OR IGNORE INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)
    `).run(challenge.id, req.userId);

    res.json({ joined: true });
  } catch (err) { next(err); }
}

// ── POST /api/challenges/:code/checkin  (auth required) ──────────────────────
function checkinChallenge(req, res, next) {
  try {
    const challenge = db.prepare(`SELECT * FROM challenges WHERE short_code = ?`).get(req.params.code);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    // Must be a participant
    const isParticipant = db.prepare(`
      SELECT 1 FROM challenge_participants WHERE challenge_id = ? AND user_id = ?
    `).get(challenge.id, req.userId);
    if (!isParticipant) return res.status(403).json({ error: 'Join the challenge first' });

    if (daysLeft(challenge.start_date, challenge.duration_days) === 0) {
      return res.status(400).json({ error: 'This challenge has ended' });
    }

    db.prepare(`
      INSERT OR IGNORE INTO challenge_checkins (challenge_id, user_id, checkin_date)
      VALUES (?, ?, ?)
    `).run(challenge.id, req.userId, todayStr());

    // Return updated today count
    const todayCount = db.prepare(`
      SELECT COUNT(*) AS cnt FROM challenge_checkins
      WHERE challenge_id = ? AND checkin_date = ?
    `).get(challenge.id, todayStr()).cnt;

    res.json({ checked_in: true, today_checkin_count: todayCount });
  } catch (err) { next(err); }
}

module.exports = { createChallenge, getChallenge, joinChallenge, checkinChallenge };
