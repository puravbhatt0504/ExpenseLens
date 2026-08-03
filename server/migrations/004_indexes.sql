-- 004_indexes.sql — Performance Optimization
-- Adding indexes to speed up dashboard queries

-- The dashboard and transaction list always query by month (e.g., date >= '2026-08-01' AND date < '2026-09-01').
-- Indexing txn_date significantly speeds up these range queries.
CREATE INDEX IF NOT EXISTS idx_transactions_txn_date ON transactions(txn_date);

-- We group by category_id for the pie chart. Adding an index helps with aggregation speed.
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
