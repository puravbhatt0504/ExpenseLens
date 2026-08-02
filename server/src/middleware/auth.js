const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

// The client ID should be provided in the environment variables once the user sets up Google Cloud
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Middleware to verify Google ID token and attach user to request.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const googleId = payload['sub'];

    // Find the user in our DB
    const { rows } = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found in database. Please log in again.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
