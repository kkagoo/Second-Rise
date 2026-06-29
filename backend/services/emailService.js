/**
 * emailService.js
 * Sends transactional emails via SendGrid HTTP API (port 443 — works on Railway).
 *
 * Setup (one-time):
 *   1. Sign up free at https://sendgrid.com
 *   2. Go to Settings → Sender Authentication → Single Sender Verification
 *   3. Add and verify your Gmail address as a sender
 *   4. Go to Settings → API Keys → Create API Key (Full Access)
 *   5. In Railway → backend service → Variables, add:
 *        SENDGRID_API_KEY = SG.xxxxxxxxxxxx
 *        SENDGRID_FROM    = your-verified@gmail.com
 */

async function sendEmail({ to, subject, html }) {
  const apiKey  = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM;

  if (!apiKey || !fromEmail) {
    console.warn('[email] SENDGRID_API_KEY / SENDGRID_FROM not set — skipping email to', to);
    return;
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: 'Second Rise' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[email] SendGrid error:', res.status, body);
    } else {
      console.log('[email] Welcome email sent to', to);
    }
  } catch (err) {
    console.error('[email] Failed to send email:', err.message);
  }
}

async function sendWelcomeEmail(email) {
  await sendEmail({
    to: email,
    subject: 'Your Second Rise account is ready',
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

async function sendPasswordResetEmail(email, resetUrl) {
  await sendEmail({
    to: email,
    subject: 'Reset your Second Rise password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #111827;">Reset your password</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          We received a request to reset the password for your Second Rise account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block; background:#4BA3E3; color:#fff; font-weight:700; font-size:16px; text-decoration:none; padding:14px 28px; border-radius:12px; margin-bottom:24px;">
          Reset my password →
        </a>
        <p style="font-size: 14px; color: #9ca3af; margin-top: 16px;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <p style="font-size: 12px; color: #d1d5db; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          If the button doesn't work, copy and paste this link:<br>
          <span style="color:#4BA3E3;">${resetUrl}</span>
        </p>
      </div>
    `,
  });
}

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
