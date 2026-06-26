/**
 * emailService.js
 * Sends transactional emails via Gmail SMTP using nodemailer.
 *
 * Required Railway env vars:
 *   GMAIL_USER  — your Gmail address (e.g. secondrise.app@gmail.com)
 *   GMAIL_PASS  — a Gmail App Password (NOT your regular password)
 *
 * How to create an App Password:
 *   1. Go to myaccount.google.com → Security
 *   2. Enable 2-Step Verification if not already on
 *   3. Search "App Passwords" in the search bar
 *   4. Create one named "Second Rise Railway"
 *   5. Copy the 16-character code → use as GMAIL_PASS
 */

const nodemailer = require('nodemailer');

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransport();
  if (!transporter) {
    console.warn('[email] GMAIL_USER / GMAIL_PASS not set — skipping email to', to);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Second Rise" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[email] Failed to send email:', err.message);
  }
}

async function sendWelcomeEmail(email) {
  await sendEmail({
    to: email,
    subject: 'Welcome to Second Rise 🌅',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
        <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #111827;">
          Welcome to Second Rise 🌅
        </h1>
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
          We're so glad you're here. Second Rise is built for women navigating perimenopause
          and beyond — every workout recommendation is shaped around your energy, your body,
          and your stage.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
          Here's what to do next:
        </p>
        <ol style="font-size: 15px; line-height: 1.8; color: #374151; padding-left: 20px; margin-bottom: 24px;">
          <li>Complete your profile so we can personalise your recommendations</li>
          <li>Connect a wearable if you have one — it makes a big difference</li>
          <li>Do your first check-in and get your workout for today</li>
        </ol>
        <p style="font-size: 14px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
          You're receiving this because you created a Second Rise account with this email address.<br>
          Questions? Reply to this email and we'll get back to you.
        </p>
      </div>
    `,
  });
}

module.exports = { sendWelcomeEmail };
