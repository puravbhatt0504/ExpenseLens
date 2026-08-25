/**
 * tokens.js — Issues and verifies the server's own session tokens.
 *
 * A Google ID token is only ever used once, at /auth/login, to prove who
 * the user is. From then on the client holds:
 *   - an access token: a short-lived JWT, verified locally (no network
 *     call to Google), carrying just the user id.
 *   - a refresh token: a long-lived opaque random string. Only its SHA-256
 *     hash is stored in `refresh_tokens`; the raw value is shown to the
 *     client exactly once, at issue time.
 *
 * Refresh tokens rotate on every use and belong to a `family_id`. If a
 * token that has already been rotated away is presented again, that can
 * only mean it leaked — the whole family is revoked and the client is
 * forced back through Google sign-in.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 30;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, typ: 'access' },
    getSecret(),
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, getSecret());
  if (payload.typ !== 'access') {
    throw new Error('Not an access token');
  }
  return payload;
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Issues a fresh access + refresh pair, starting a new rotation family.
 * Used at login.
 */
async function issueSession(userId, device) {
  const familyId = crypto.randomUUID();
  return rotateOrCreate({ userId, familyId, device });
}

/**
 * Rotates a refresh token: validates it, revokes it, and issues a new pair
 * in the same family. Reuse of an already-rotated token revokes the whole
 * family and throws, since that can only happen if the token leaked.
 */
async function refreshSession(rawRefreshToken, device) {
  const tokenHash = hashToken(rawRefreshToken);
  const { rows } = await db.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  const existing = rows[0];

  if (!existing) {
    const err = new Error('Refresh token not recognized');
    err.code = 'TOKEN_INVALID';
    throw err;
  }

  if (existing.revoked_at) {
    // This token was already rotated away (or explicitly revoked) once —
    // presenting it again means it leaked. Nuke the whole family.
    await db.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL',
      [existing.family_id]
    );
    const err = new Error('Refresh token reuse detected');
    err.code = 'TOKEN_REUSED';
    throw err;
  }

  if (new Date(existing.expires_at) < new Date()) {
    const err = new Error('Refresh token expired');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  await db.query(
    'UPDATE refresh_tokens SET revoked_at = now(), last_used_at = now() WHERE id = $1',
    [existing.id]
  );

  return rotateOrCreate({
    userId: existing.user_id,
    familyId: existing.family_id,
    device: device || existing.device,
  });
}

async function rotateOrCreate({ userId, familyId, device }) {
  const { rows: userRows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userRows[0];
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const rawRefreshToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, device, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, hashToken(rawRefreshToken), familyId, device || null, expiresAt]
  );

  return {
    user,
    accessToken: signAccessToken(user),
    refreshToken: rawRefreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

async function revokeRefreshToken(rawRefreshToken) {
  await db.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
    [hashToken(rawRefreshToken)]
  );
}

async function revokeAllForUser(userId) {
  await db.query(
    'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}

module.exports = {
  ACCESS_TOKEN_TTL_SECONDS,
  signAccessToken,
  verifyAccessToken,
  issueSession,
  refreshSession,
  revokeRefreshToken,
  revokeAllForUser,
};
