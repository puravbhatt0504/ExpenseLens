-- seed.sql — Canonical categories and starter merchant rules
-- Kept in sync with migration 017_merge_categories.sql — this is what a
-- brand-new database bootstraps directly to, without ever passing through
-- the old duplicate-prone taxonomy.

INSERT INTO categories (name, category_group, icon, color)
SELECT * FROM (VALUES
  ('Groceries',           'Essentials', 'circum:shopping-cart', '#FFB347'),
  ('Fruits & Vegetables', 'Essentials', 'circum:apple',          '#FF6B6B'),
  ('Dairy',               'Essentials', 'circum:glass',          '#FFFDD0'),
  ('House Rent',          'Essentials', 'circum:home',           '#CFCFC4'),
  ('Electricity',         'Essentials', 'circum:power',          '#FDFD96'),
  ('Mobile & Internet',   'Essentials', 'circum:mobile-1',       '#AEC6CF'),
  ('TV & Subscriptions',  'Essentials', 'circum:monitor',        '#77DD77'),
  ('Cooking Gas',         'Essentials', 'circum:temp-high',      '#FF6961'),
  ('Water',               'Essentials', NULL,                    '#90E0EF'),
  ('Fuel',                'Essentials', 'circum:delivery-truck', '#FFB347'),
  ('School Fees',         'Essentials', 'circum:read',           '#B19CD9'),

  ('Eating Out',          'Lifestyle',  'circum:fork-knife',     '#FFB347'),
  ('Shopping',            'Lifestyle',  'circum:shopping-tag',   '#A8E6CF'),
  ('Entertainment',       'Lifestyle',  'circum:play-1',         '#DDA0DD'),
  ('Travel',              'Lifestyle',  'circum:plane',          '#4ECDC4'),
  ('Health & Medical',    'Lifestyle',  'circum:hospital-1',     '#98D8C8'),
  ('Kids',                'Lifestyle',  'circum:face-smile',     '#FDFD96'),
  ('Pets',                'Lifestyle',  'circum:heart',          '#FEC5BB'),
  ('Personal Care',       'Lifestyle',  'circum:user',           '#CFCFC4'),

  ('Transfers',           'Money',      'circum:credit-card-1',  '#87CEEB'),
  ('Miscellaneous',       'Money',      'circum:circle-more',    '#C0C0C0')
) AS t(name, category_group, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE lower(c.name) = lower(t.name));

-- Starter merchant rules
INSERT INTO merchant_rules (pattern, category_id)
SELECT * FROM (VALUES
  ('zomato',    (SELECT id FROM categories WHERE name = 'Eating Out')),
  ('swiggy',    (SELECT id FROM categories WHERE name = 'Eating Out')),
  ('blinkit',   (SELECT id FROM categories WHERE name = 'Groceries')),
  ('zepto',     (SELECT id FROM categories WHERE name = 'Groceries')),
  ('instamart', (SELECT id FROM categories WHERE name = 'Groceries')),
  ('bigbasket', (SELECT id FROM categories WHERE name = 'Groceries')),
  ('dmart',     (SELECT id FROM categories WHERE name = 'Groceries')),
  ('uber',      (SELECT id FROM categories WHERE name = 'Travel')),
  ('ola',       (SELECT id FROM categories WHERE name = 'Travel')),
  ('rapido',    (SELECT id FROM categories WHERE name = 'Travel')),
  ('indian oil',(SELECT id FROM categories WHERE name = 'Fuel')),
  ('iocl',      (SELECT id FROM categories WHERE name = 'Fuel')),
  ('hpcl',      (SELECT id FROM categories WHERE name = 'Fuel')),
  ('bpcl',      (SELECT id FROM categories WHERE name = 'Fuel')),
  ('netflix',   (SELECT id FROM categories WHERE name = 'Entertainment')),
  ('spotify',   (SELECT id FROM categories WHERE name = 'Entertainment')),
  ('hotstar',   (SELECT id FROM categories WHERE name = 'Entertainment')),
  ('amazon',    (SELECT id FROM categories WHERE name = 'Shopping')),
  ('flipkart',  (SELECT id FROM categories WHERE name = 'Shopping')),
  ('myntra',    (SELECT id FROM categories WHERE name = 'Shopping')),
  ('airtel',    (SELECT id FROM categories WHERE name = 'Mobile & Internet')),
  ('jio',       (SELECT id FROM categories WHERE name = 'Mobile & Internet')),
  ('tata power',(SELECT id FROM categories WHERE name = 'Electricity')),
  ('adani',     (SELECT id FROM categories WHERE name = 'Electricity')),
  ('apollo',    (SELECT id FROM categories WHERE name = 'Health & Medical')),
  ('pharmeasy', (SELECT id FROM categories WHERE name = 'Health & Medical'))
) AS t(pattern, category_id)
WHERE NOT EXISTS (SELECT 1 FROM merchant_rules m WHERE m.pattern = t.pattern);
