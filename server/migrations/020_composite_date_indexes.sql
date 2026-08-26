-- 020_composite_date_indexes.sql — Indexes matching the actual query shape
--
-- 004_indexes.sql added a plain index on transactions(txn_date), but every
-- route filtered with to_char(txn_date, 'YYYY-MM') = $1, which cannot use a
-- btree index on the raw column. The routes now filter with a sargable
-- half-open range (txn_date >= $1 AND txn_date < $1 + 1 month) scoped to a
-- single user, so the index that actually matches is a composite on
-- (user_id, date) — user first, since every query filters by user.
--
-- incomes had no indexes at all.

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes (user_id, date);
