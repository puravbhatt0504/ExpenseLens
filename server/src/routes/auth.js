const { Router } = require('express');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { issueSession, refreshSession, revokeRefreshToken, revokeAllForUser } = require('../lib/tokens');

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Display currency only — amounts are stored as plain numbers and never
// converted. Whitelisted because this value reaches a SQL column and the
// clients' formatters.
const SUPPORTED_CURRENCIES = ['INR', 'PHP'];

// POST /api/auth/login
// Receives a Google ID token, verifies it (once), upserts the user, and
// issues our own access + refresh token pair. The Google token itself is
// never stored or reused after this point.
router.post('/login', async (req, res) => {
  try {
    const { idToken, device } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const name = payload['name'];
    const picture = payload['picture'];

    // Check if user exists
    let { rows } = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    let user;
    if (rows.length === 0) {
      // Create new user
      const insertResult = await db.query(
        `INSERT INTO users (google_id, email, name, picture)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [googleId, email, name, picture]
      );
      user = insertResult.rows[0];
    } else {
      user = rows[0];
      // Update name/picture if changed
      if (user.name !== name || user.picture !== picture) {
        const updateResult = await db.query(
          `UPDATE users SET name = $1, picture = $2 WHERE id = $3 RETURNING *`,
          [name, picture, user.id]
        );
        user = updateResult.rows[0];
      }
    }

    const session = await issueSession(user.id, device);
    res.json({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
    });
  } catch (error) {
    console.error('Login error:', error.message || error);
    res.status(401).json({ error: 'Authentication failed', details: error.message || String(error) });
  }
});

// POST /api/auth/refresh
// Exchanges a refresh token for a new access + refresh pair, rotating the
// refresh token. Reuse of an already-rotated token revokes the session.
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken, device } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }

    const session = await refreshSession(refreshToken, device);
    res.json({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
    });
  } catch (error) {
    const code = error.code || 'TOKEN_INVALID';
    res.status(401).json({ error: error.message || 'Failed to refresh session', code });
  }
});

// POST /api/auth/logout
// Revokes the refresh token presented. The current access token stays
// valid until it naturally expires (it's short-lived by design).
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  res.status(204).end();
});

// POST /api/auth/logout-all
// Revokes every refresh token for the signed-in user — "sign out
// everywhere".
router.post('/logout-all', requireAuth, async (req, res) => {
  await revokeAllForUser(req.user.id);
  res.status(204).end();
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { auto_split_savings, currency } = req.body;
    const sets = [];
    const params = [];

    if (auto_split_savings !== undefined) {
      sets.push(`auto_split_savings = $${params.length + 1}`);
      params.push(auto_split_savings);
    }

    if (currency !== undefined) {
      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return res.status(400).json({
          error: `Unsupported currency. Expected one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
        });
      }
      sets.push(`currency = $${params.length + 1}`);
      params.push(currency);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    // Joined, not concatenated — the previous version appended each
    // assignment with a trailing space and no comma, so any second field
    // would have produced `SET a = $1 b = $2` and thrown a syntax error.
    const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length + 1} RETURNING *`;
    params.push(req.user.id);

    const { rows } = await db.query(query, params);
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

module.exports = router;
