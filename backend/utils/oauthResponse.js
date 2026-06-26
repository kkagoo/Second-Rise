/**
 * oauthResponse.js
 * Returns self-closing HTML pages for OAuth callbacks in Capacitor apps.
 *
 * Instead of redirecting to the frontend (which causes login-page issues because
 * the web app has no token), we return HTML that tries window.close() and shows
 * a friendly message. The Capacitor Browser closes, the native app regains focus,
 * and the visibilitychange / browserFinished listeners refresh the wearable status.
 */

const BASE_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; margin: 0;
    background: #f9fafb; text-align: center; padding: 24px; box-sizing: border-box;
  }
  .icon { font-size: 52px; margin-bottom: 16px; }
  h1 { color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  p  { color: #6b7280; font-size: 15px; line-height: 1.5; margin: 0; }
`;

// On native (Capacitor Browser), window.close() shuts the in-app browser immediately.
// On web, browsers block window.close() for tabs not opened by script, so we fall back
// to redirecting to /profile after 1.5 s — giving the close attempt time to fire first.
const CLOSE_SCRIPT = `
<script>
  var closed = false;
  try { window.close(); closed = true; } catch(e) {}
  // Fallback for web browsers where window.close() is blocked
  if (!closed) {
    setTimeout(function() { window.location.href = '/profile'; }, 1500);
  }
<\/script>`;

function oauthSuccessPage(device) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${device} Connected</title>
  <style>${BASE_STYLES}
  .link { display: inline-block; margin-top: 20px; color: #4BA3E3; font-size: 14px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <div class="icon">✅</div>
    <h1>${device} connected!</h1>
    <p>You can close this tab and return to Second Rise.</p>
    <a class="link" href="/profile">Return to Second Rise →</a>
  </div>
  ${CLOSE_SCRIPT}
</body>
</html>`;
}

function oauthDeniedPage(device) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorization Cancelled</title>
  <style>${BASE_STYLES}
  .link { display: inline-block; margin-top: 20px; color: #4BA3E3; font-size: 14px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <div class="icon">↩️</div>
    <h1>Authorization cancelled</h1>
    <p>No problem — you can connect ${device} later from your Profile.</p>
    <a class="link" href="/profile">Return to Second Rise →</a>
  </div>
  ${CLOSE_SCRIPT}
</body>
</html>`;
}

function oauthErrorPage(device, detail = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connection Error</title>
  <style>${BASE_STYLES}
  .link { display: inline-block; margin-top: 20px; color: #4BA3E3; font-size: 14px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <div class="icon">⚠️</div>
    <h1>Couldn't connect ${device}</h1>
    <p>${detail || 'Please close this tab and try again from the app.'}</p>
    <a class="link" href="/profile">Return to Second Rise →</a>
  </div>
  ${CLOSE_SCRIPT}
</body>
</html>`;
}

module.exports = { oauthSuccessPage, oauthDeniedPage, oauthErrorPage };
