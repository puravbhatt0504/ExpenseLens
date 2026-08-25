-- 017_merge_categories.sql — Collapse duplicate categories to one canonical
-- set of 21, repointing every foreign key before deleting the losers.
--
-- Production data audit (2026-08-25) showed 138 category rows falling into
-- 28 distinct names (the migration-ledger bug in 016 let 009_category_groups
-- and 006_new_categories insert their rows on every deploy). This maps all
-- 28 old names onto 21 canonical categories, keeps the lowest surviving id
-- per canonical name (so real transaction/merchant_rule/budget references
-- follow it automatically), then deletes everything else.

BEGIN;

CREATE TEMP TABLE name_to_canonical (
  old_name        TEXT PRIMARY KEY,
  canonical_name  TEXT NOT NULL,
  canonical_group TEXT NOT NULL,
  canonical_icon  TEXT,
  canonical_color TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO name_to_canonical (old_name, canonical_name, canonical_group, canonical_icon, canonical_color) VALUES
  ('Food',                  'Eating Out',          'Lifestyle',  'circum:fork-knife',   '#FFB347'),
  ('Eating Out',            'Eating Out',          'Lifestyle',  'circum:fork-knife',   '#FFB347'),
  ('Travel',                'Travel',              'Lifestyle',  'circum:plane',        '#4ECDC4'),
  ('Bills',                 'Electricity',         'Essentials', 'circum:power',        '#FDFD96'),
  ('Electricity Bill',      'Electricity',         'Essentials', 'circum:power',        '#FDFD96'),
  ('Shopping',              'Shopping',            'Lifestyle',  'circum:shopping-tag', '#A8E6CF'),
  ('House Shopping',        'Shopping',            'Lifestyle',  'circum:shopping-tag', '#A8E6CF'),
  ('Rent',                  'House Rent',          'Essentials', 'circum:home',         '#CFCFC4'),
  ('House Rent',            'House Rent',          'Essentials', 'circum:home',         '#CFCFC4'),
  ('Entertainment',         'Entertainment',       'Lifestyle',  'circum:play-1',       '#DDA0DD'),
  ('Weekend',               'Entertainment',       'Lifestyle',  'circum:play-1',       '#DDA0DD'),
  ('Health',                'Health & Medical',    'Lifestyle',  'circum:hospital-1',   '#98D8C8'),
  ('Medical / Crust',       'Health & Medical',    'Lifestyle',  'circum:hospital-1',   '#98D8C8'),
  ('Transfers',             'Transfers',           'Money',      'circum:credit-card-1','#87CEEB'),
  ('Other',                 'Miscellaneous',       'Money',      'circum:circle-more',  '#C0C0C0'),
  ('Pet Food',              'Pets',                'Lifestyle',  'circum:heart',        '#FEC5BB'),
  ('Fruits',                'Fruits & Vegetables', 'Essentials', 'circum:apple',        '#FF6B6B'),
  ('Vegetables',            'Fruits & Vegetables', 'Essentials', 'circum:apple',        '#FF6B6B'),
  ('Veg - Fruits',          'Fruits & Vegetables', 'Essentials', 'circum:apple',        '#FF6B6B'),
  ('Grocery',               'Groceries',           'Essentials', 'circum:shopping-cart','#FFB347'),
  ('Dairy',                 'Dairy',               'Essentials', 'circum:glass',        '#FFFDD0'),
  ('Phone Bill',            'Mobile & Internet',   'Essentials', 'circum:mobile-1',     '#AEC6CF'),
  ('T.V Bill',              'TV & Subscriptions',  'Essentials', 'circum:monitor',      '#77DD77'),
  ('Gas Bill',              'Cooking Gas',         'Essentials', 'circum:temp-high',    '#FF6961'),
  ('Petrol',                'Fuel',                'Essentials', 'circum:delivery-truck','#FFB347'),
  ('Children School Fees',  'School Fees',         'Essentials', 'circum:read',         '#B19CD9'),
  ('Child Requirement',     'Kids',                'Lifestyle',  'circum:face-smile',   '#FDFD96'),
  ('Personal',              'Personal Care',       'Lifestyle',  'circum:user',         '#CFCFC4');

-- One survivor per canonical name: the lowest id among every row whose name
-- maps to it. This is deliberate, not arbitrary — the lowest id is always
-- the first-ever inserted row for that name, so it is also the row every
-- pre-existing transaction/merchant_rule/budget reference already points at.
CREATE TEMP TABLE survivors AS
SELECT DISTINCT ON (m.canonical_name)
  c.id AS keep_id, m.canonical_name, m.canonical_group, m.canonical_icon, m.canonical_color
FROM categories c
JOIN name_to_canonical m ON m.old_name = c.name
ORDER BY m.canonical_name, c.id;

CREATE TEMP TABLE id_map AS
SELECT c.id AS old_id, s.keep_id
FROM categories c
JOIN name_to_canonical m ON m.old_name = c.name
JOIN survivors s ON s.canonical_name = m.canonical_name;

-- 1. Collapse per-user category budgets onto the survivor BEFORE repointing,
--    since (user_id, category_id) is a primary key and a naive UPDATE would
--    collide if a user had budgeted both a duplicate and its survivor.
INSERT INTO user_category_budgets (user_id, category_id, budget_amount)
SELECT b.user_id, im.keep_id, SUM(b.budget_amount)
FROM user_category_budgets b
JOIN id_map im ON im.old_id = b.category_id
WHERE im.old_id <> im.keep_id
GROUP BY b.user_id, im.keep_id
ON CONFLICT (user_id, category_id)
DO UPDATE SET budget_amount = user_category_budgets.budget_amount + EXCLUDED.budget_amount,
              updated_at    = now();

DELETE FROM user_category_budgets
WHERE category_id IN (SELECT old_id FROM id_map WHERE old_id <> keep_id);

-- 2. Repoint every other foreign key.
UPDATE transactions t SET category_id = im.keep_id
FROM id_map im WHERE t.category_id = im.old_id AND im.old_id <> im.keep_id;

UPDATE merchant_rules mr SET category_id = im.keep_id
FROM id_map im WHERE mr.category_id = im.old_id AND im.old_id <> im.keep_id;

UPDATE category_corrections cc SET suggested_category_id = im.keep_id
FROM id_map im WHERE cc.suggested_category_id = im.old_id AND im.old_id <> im.keep_id;

UPDATE category_corrections cc SET corrected_category_id = im.keep_id
FROM id_map im WHERE cc.corrected_category_id = im.old_id AND im.old_id <> im.keep_id;

-- 2b. uber/ola/rapido are ride-hailing, not fuel purchases — migration 013
--     already tried to route them to Travel, but the broken migration runner
--     kept undoing it on every redeploy. Fix it for good now.
UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Travel')
WHERE pattern IN ('uber', 'ola', 'rapido');

-- 3. Drop any merchant_rules that now collide on pattern (none currently,
--    kept for safety since merchant_rules.pattern has no unique constraint).
DELETE FROM merchant_rules a USING merchant_rules b
WHERE a.id > b.id AND a.pattern = b.pattern;

-- 4. Rename and regroup every survivor to its canonical identity.
UPDATE categories c SET
  name = s.canonical_name,
  category_group = s.canonical_group,
  icon = s.canonical_icon,
  color = s.canonical_color
FROM survivors s WHERE c.id = s.keep_id;

-- 5. Delete every non-survivor row. Safe: every FK that pointed at one was
--    repointed in step 2.
DELETE FROM categories WHERE id IN (SELECT old_id FROM id_map WHERE old_id <> keep_id);

-- 6. Water has no predecessor category — insert it fresh.
INSERT INTO categories (name, category_group, icon, color)
SELECT 'Water', 'Essentials', NULL, '#90E0EF'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Water');

-- 7. Now that names are unique, lock it shut so this can never happen again.
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique ON categories (lower(name));

COMMIT;
