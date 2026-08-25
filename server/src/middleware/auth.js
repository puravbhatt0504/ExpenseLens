const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { verifyAccessToken } = require('../lib/tokens');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a legacy raw Google ID token, the credential every client used
 * before this app issued its own sessions. Kept behind a flag so an
 * already-installed client isn't hard-locked out the moment this ships —
 * turn ALLOW_LEGACY_GOOGLE_TOKENS off a couple of weeks after rollout.
 */
async function verifyLegacyGoogleToken(token) {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const googleId = ticket.getPayload()['sub'];
  const { rows } = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0] || null;
}

/**
 * Verifies the server-issued access token, entirely locally — no network
 * call to Google, unlike the old middleware this replaces.
 */
async function verifyAppAccessToken(token) {
  const payload = verifyAccessToken(token); // throws on bad signature/expiry
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
  return rows[0] || null;
}

/**
 * Middleware to authenticate a request and attach `req.user`.
 *
 * Responds with a typed `code` on 401 so clients know whether to attempt a
 * refresh (TOKEN_EXPIRED) or give up and send the user back to login
 * (TOKEN_INVALID / USER_NOT_FOUND).
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header', code: 'TOKEN_INVALID' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = await verifyAppAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please log in again.', code: 'USER_NOT_FOUND' });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    // Not a valid app token — fall through to the legacy path below rather
    // than failing outright, so pre-rollout clients keep working.
  }

  if (process.env.ALLOW_LEGACY_GOOGLE_TOKENS === 'true') {
    try {
      const user = await verifyLegacyGoogleToken(token);
      if (user) {
        req.user = user;
        return next();
      }
      return res.status(401).json({ error: 'User not found. Please log in again.', code: 'USER_NOT_FOUND' });
    } catch (error) {
      console.error('Legacy Google token verification failed:', error.message || error);
      return res.status(401).json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
    }
  }

  return res.status(401).json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
}

module.exports = { requireAuth };
