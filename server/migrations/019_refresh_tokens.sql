-- 019_refresh_tokens.sql — Server-issued sessions.
--
-- Until now the raw Google ID token WAS the API credential: stored forever
-- in the client, expiring silently after ~1 hour with nothing watching for
-- it, and re-verified against Google on every single request. This table
-- backs a real session: a short-lived access JWT (verified locally, no
-- network call) plus a rotating refresh token the client exchanges for a
-- new pair. See server/src/lib/tokens.js and routes/auth.js.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  family_id    UUID NOT NULL,
  device       TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
  ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family
  ON refresh_tokens (family_id);
