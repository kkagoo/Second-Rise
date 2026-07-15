const express = require('express');
const db = require('../db/database');
const { sendWaitlistConfirmationEmail } = require('../services/emailService');

const router = express.Router();

// POST /api/waitlist — no auth required, public endpoint
router.post('/', async (req, res) => {
  const { name, email, challenge } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const normalizedName = (name || '').trim();
    const normalizedEmail = email.toLowerCase().trim();

    db.prepare(`
      INSERT INTO waitlist (name, email, challenge)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name       = excluded.name,
        challenge  = excluded.challenge,
        updated_at = datetime('now')
    `).run(normalizedName, normalizedEmail, challenge || null);

    const emailSent = await sendWaitlistConfirmationEmail(normalizedEmail, normalizedName);
    if (!emailSent) {
      console.warn('[waitlist] Signup saved, but confirmation email was not sent to', normalizedEmail);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[waitlist] error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// GET /api/waitlist — admin only, returns all signups
router.get('/', (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const requestEmail = req.headers['x-admin-email'];
  if (!adminEmail || requestEmail !== adminEmail) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const rows = db.prepare(`SELECT * FROM waitlist ORDER BY created_at DESC`).all();
  res.json(rows);
});

module.exports = router;
