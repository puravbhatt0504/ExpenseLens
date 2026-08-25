-- 016_migration_ledger.sql — Track which migration files have been applied
-- so migrate.js stops re-running every file on every deploy.

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now()
);

-- Backfill: mark every migration up to and including this one as already
-- applied, since they have already run against this database by definition.
INSERT INTO schema_migrations (filename) VALUES
  ('001_init.sql'),
  ('002_icon_mappings.sql'),
  ('003_add_users.sql'),
  ('004_indexes.sql'),
  ('005_budgets.sql'),
  ('006_income_savings.sql'),
  ('006_new_categories.sql'),
  ('007_add_payment_method.sql'),
  ('008_auto_split_savings.sql'),
  ('009_category_groups.sql'),
  ('010_migrate_old_categories.sql'),
  ('011_fix_food_mapping.sql'),
  ('012_circum_icons.sql'),
  ('013_restore_travel.sql'),
  ('014_restore_shopping.sql'),
  ('015_migrate_remaining_icons.sql'),
  ('016_migration_ledger.sql')
ON CONFLICT (filename) DO NOTHING;
