/**
 * whatsappController.js
 * Handles incoming WhatsApp messages and drives the check-in conversation state machine.
 *
 * States:
 *   idle       → sends energy question, moves to awaiting_energy
 *   awaiting_energy  → records energy, sends time question, moves to awaiting_time
 *   awaiting_time    → records time, fetches recommendation, sends video, moves to awaiting_done
 *   awaiting_done    → records DONE, logs challenge check-in, resets to idle
 */

const db               = require('../db/database');
const { sendMessage }  = require('../services/whatsappService');
const videos           = require('../videos.json');

// ── Webhook verification (Meta requires GET with hub.challenge) ────────────────
function verifyWebhook(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[whatsapp] Webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
}

// ── Incoming message handler ──────────────────────────────────────────────────
async function handleIncoming(req, res) {
  // Acknowledge immediately — Meta requires 200 within 5 seconds
  res.sendStatus(200);

  try {
    const entry   = req.body?.entry?.[0];
    const change  = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) return;

    const from = message.from;                       // E.164 phone number
    const text = (message.text?.body || '').trim().toLowerCase();

    // Look up or create session
    let session = db.prepare(`SELECT * FROM whatsapp_sessions WHERE phone = ?`).get(from);
    if (!session) {
      // Try to match phone to an existing user
      const user = db.prepare(`SELECT user_id FROM user_profiles WHERE phone_number = ?`).get(from);
      db.prepare(`
        INSERT INTO whatsapp_sessions (phone, user_id, state) VALUES (?, ?, 'idle')
      `).run(from, user?.user_id ?? null);
      session = db.prepare(`SELECT * FROM whatsapp_sessions WHERE phone = ?`).get(from);
    }

    await handleState(session, text, from);
  } catch (err) {
    console.error('[whatsapp] handleIncoming error:', err);
  }
}

async function handleState(session, text, from) {
  const { state } = session;

  // Any message when idle → start check-in
  if (state === 'idle' || text === 'checkin' || text === 'check in') {
    await sendMessage(from,
      `🌅 Quick check-in!\n\nHow's your energy today?\nReply *1* = Low\nReply *2* = Medium\nReply *3* = High`
    );
    updateSession(from, { state: 'awaiting_energy' });
    return;
  }

  if (state === 'awaiting_energy') {
    const energy = parseInt(text);
    if (![1, 2, 3].includes(energy)) {
      await sendMessage(from, `Just reply 1, 2, or 3 for your energy level 😊`);
      return;
    }
    updateSession(from, { state: 'awaiting_time', energy });
    await sendMessage(from,
      `Got it! How much time do you have?\nReply *1* = 10 min\nReply *2* = 20 min\nReply *3* = 30+ min`
    );
    return;
  }

  if (state === 'awaiting_time') {
    const timeChoice = parseInt(text);
    if (![1, 2, 3].includes(timeChoice)) {
      await sendMessage(from, `Just reply 1, 2, or 3 for your available time 😊`);
      return;
    }
    updateSession(from, { state: 'awaiting_done', time_avail: timeChoice });

    const video = pickVideo(session.energy, timeChoice);
    await sendMessage(from,
      `▶️ *${video.title}* (${video.duration_min} min)\n${video.url}\n\nReply *DONE* when you finish — your group is counting on you 💪`
    );
    return;
  }

  if (state === 'awaiting_done') {
    if (!['done', 'finished', 'complete', 'completed', '✓', '✅'].includes(text)) {
      await sendMessage(from, `Reply *DONE* when you've finished your workout 💪`);
      return;
    }

    // Log challenge check-in if user is in an active challenge
    if (session.user_id && session.challenge_id) {
      const today = new Date().toISOString().slice(0, 10);
      try {
        db.prepare(`
          INSERT OR IGNORE INTO challenge_checkins (challenge_id, user_id, checkin_date)
          VALUES (?, ?, ?)
        `).run(session.challenge_id, session.user_id, today);

        const count = db.prepare(`
          SELECT COUNT(*) AS cnt FROM challenge_checkins
          WHERE challenge_id = ? AND checkin_date = ?
        `).get(session.challenge_id, today).cnt;

        await sendMessage(from,
          `✅ Logged! You moved today.\n\n${count} people in your group have moved today 🌅\nSee you tomorrow!`
        );
      } catch (_) {
        await sendMessage(from, `✅ Nice work! See you tomorrow 🌅`);
      }
    } else {
      await sendMessage(from, `✅ Nice work! See you tomorrow 🌅`);
    }

    updateSession(from, { state: 'idle', energy: null, time_avail: null });
    return;
  }

  // Fallback
  await sendMessage(from,
    `Reply *checkin* to get today's workout recommendation 🌅`
  );
}

// ── Morning scheduler — call this daily at 7am ─────────────────────────────────
async function sendMorningMessages(challengeId) {
  const challenge = db.prepare(`SELECT * FROM challenges WHERE id = ?`).get(challengeId);
  if (!challenge) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const doneYesterday = db.prepare(`
    SELECT COUNT(*) AS cnt FROM challenge_checkins
    WHERE challenge_id = ? AND checkin_date = ?
  `).get(challengeId, yesterdayStr).cnt;

  const total = db.prepare(`
    SELECT COUNT(*) AS cnt FROM challenge_participants WHERE challenge_id = ?
  `).get(challengeId).cnt;

  const dayNum = Math.floor((new Date() - new Date(challenge.start_date)) / 86400000) + 1;

  const participants = db.prepare(`
    SELECT up.phone_number, cp.user_id
    FROM challenge_participants cp
    JOIN user_profiles up ON up.user_id = cp.user_id
    WHERE cp.challenge_id = ? AND up.phone_number IS NOT NULL AND up.whatsapp_opted_in = 1
  `).all(challengeId);

  for (const p of participants) {
    // Update their session with the current challenge
    db.prepare(`
      INSERT INTO whatsapp_sessions (phone, user_id, state, challenge_id)
      VALUES (?, ?, 'idle', ?)
      ON CONFLICT(phone) DO UPDATE SET state='idle', challenge_id=excluded.challenge_id, updated_at=datetime('now')
    `).run(p.phone_number, p.user_id, challengeId);

    await sendMessage(p.phone_number,
      `🌅 Day ${dayNum}/${challenge.duration_days} — ${challenge.name}\n${doneYesterday} of ${total} moved yesterday 💪\n\nHow's your energy today?\nReply *1* = Low · *2* = Medium · *3* = High`
    );

    updateSession(p.phone_number, { state: 'awaiting_energy' });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function updateSession(phone, fields) {
  const sets = Object.entries(fields)
    .map(([k]) => `${k} = ?`)
    .join(', ');
  const vals = Object.values(fields);
  db.prepare(`UPDATE whatsapp_sessions SET ${sets}, updated_at = datetime('now') WHERE phone = ?`)
    .run(...vals, phone);
}

const VIDEO_MAP = {
  '1-1': { title: '10-Min Morning Yoga',                youtube_id: 'X3-gKPNyrTA', duration_min: 10 },
  '1-2': { title: 'Gentle Daily Mobility',               youtube_id: 'b3nPJYGCglk', duration_min: 15 },
  '1-3': { title: 'Restorative Yoga for Bone Health',    youtube_id: '1DuBs7x45WQ', duration_min: 15 },
  '2-1': { title: '10-Min Pilates — Menopause Strength', youtube_id: 'snwQ5cZt5Xk', duration_min: 10 },
  '2-2': { title: '20-Min Full Body Dumbbell',           youtube_id: 'rRugP_hkkE0', duration_min: 20 },
  '2-3': { title: 'Full Body Strength for Women 50+',    youtube_id: 'ZcWJZ_iUMyE', duration_min: 30 },
  '3-1': { title: '10-Min Bone Strength — Low Impact',   youtube_id: 'FGrSEVc3Idw', duration_min: 10 },
  '3-2': { title: '20-Min Upper Body Dumbbells',         youtube_id: 'SZaggsg2zUY', duration_min: 20 },
  '3-3': { title: '30-Min Full Body — No Repeat',        youtube_id: 'l9_SoClAO5g', duration_min: 20 },
};

function pickVideo(energy, time) {
  const key = `${energy}-${time}`;
  const v   = VIDEO_MAP[key] || VIDEO_MAP['2-1'];
  return { ...v, url: `https://youtu.be/${v.youtube_id}` };
}

module.exports = { verifyWebhook, handleIncoming, sendMorningMessages };
