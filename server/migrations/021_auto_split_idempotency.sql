-- 021_auto_split_idempotency.sql — Make the auto-split-savings job safe to
-- retry or duplicate-deliver.
--
-- The job increments savings_goals.current_amount rather than setting it,
-- and moving it from an in-process node-cron timer (which never fires on
-- Vercel's serverless runtime) to Vercel Cron means it is now subject to
-- Vercel's documented at-least-once delivery: "Cron delivery can
-- occasionally invoke the same scheduled run more than once." An increment
-- run twice for the same user/month double-applies real money into a
-- savings goal. This table makes "have we already split this user's surplus
-- for this month" a single INSERT ... ON CONFLICT DO NOTHING check.

CREATE TABLE IF NOT EXISTS auto_split_runs (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,  -- 'YYYY-MM' — the month whose surplus was split
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, month)
);
