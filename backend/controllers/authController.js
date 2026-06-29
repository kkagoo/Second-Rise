const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

function signup(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)'
    ).run(email.toLowerCase().trim(), hash);

    // Create empty profile row
    db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

    const token = jwt.sign({ userId: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Fire-and-forget — don't let email failure block signup
    sendWelcomeEmail(email.toLowerCase().trim()).catch((e) => console.error('[signup] welcome email failed:', e));

    res.status(201).json({ token, userId: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
}

function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: user.id });
  } catch (err) {
    next(err);
  }
}

function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    // Always return 200 — don't reveal whether email exists
    if (!user) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    // Generate token, store hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Invalidate any existing tokens for this user
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, tokenHash, expiresAt);

    const appUrl = process.env.APP_URL || 'https://second-rise-production.up.railway.app';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail(email.toLowerCase().trim(), resetUrl)
      .catch(e => console.error('[forgotPassword] email failed:', e));

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const row = db.prepare(
      'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0'
    ).get(tokenHash);

    if (!row) return res.status(400).json({ error: 'Invalid or expired reset link.' });
    if (new Date(row.expires_at) < new Date()) {
      db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(row.id);
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, forgotPassword, resetPassword };
