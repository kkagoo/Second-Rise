/**
 * whatsappService.js
 * Sends WhatsApp messages via Meta Cloud API.
 * Set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in Railway env vars.
 */

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';

async function sendMessage(to, text) {
  const token   = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.warn('[whatsapp] WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not set — skipping send to', to);
    return false;
  }

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneId}/messages`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[whatsapp] API error:', res.status, body);
      return false;
    }
    console.log('[whatsapp] Message sent to', to);
    return true;
  } catch (err) {
    console.error('[whatsapp] Send failed:', err.message);
    return false;
  }
}

module.exports = { sendMessage };
