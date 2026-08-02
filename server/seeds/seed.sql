-- seed.sql — Default categories and starter merchant rules

-- Default categories (9 as specified)
INSERT INTO categories (name, icon, color)
SELECT * FROM (VALUES
  ('Food',          '🍔', '#FF6B6B'),
  ('Travel',        '✈️', '#4ECDC4'),
  ('Bills',         '📄', '#FFE66D'),
  ('Shopping',      '🛍️', '#A8E6CF'),
  ('Rent',          '🏠', '#FF8B94'),
  ('Entertainment', '🎬', '#DDA0DD'),
  ('Health',        '💊', '#98D8C8'),
  ('Transfers',     '💸', '#87CEEB'),
  ('Other',         '📌', '#C0C0C0')
) AS t(name, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = t.name);

-- Starter merchant rules
INSERT INTO merchant_rules (pattern, category_id)
SELECT * FROM (VALUES
  ('zomato',   (SELECT id FROM categories WHERE name = 'Food')),
  ('swiggy',   (SELECT id FROM categories WHERE name = 'Food')),
  ('uber',     (SELECT id FROM categories WHERE name = 'Travel')),
  ('ola',      (SELECT id FROM categories WHERE name = 'Travel')),
  ('rapido',   (SELECT id FROM categories WHERE name = 'Travel')),
  ('netflix',  (SELECT id FROM categories WHERE name = 'Entertainment')),
  ('spotify',  (SELECT id FROM categories WHERE name = 'Entertainment')),
  ('hotstar',  (SELECT id FROM categories WHERE name = 'Entertainment')),
  ('amazon',   (SELECT id FROM categories WHERE name = 'Shopping')),
  ('flipkart', (SELECT id FROM categories WHERE name = 'Shopping')),
  ('myntra',   (SELECT id FROM categories WHERE name = 'Shopping')),
  ('airtel',   (SELECT id FROM categories WHERE name = 'Bills')),
  ('jio',      (SELECT id FROM categories WHERE name = 'Bills')),
  ('electricity', (SELECT id FROM categories WHERE name = 'Bills')),
  ('apollo',   (SELECT id FROM categories WHERE name = 'Health')),
  ('pharmeasy',(SELECT id FROM categories WHERE name = 'Health'))
) AS t(pattern, category_id)
WHERE NOT EXISTS (SELECT 1 FROM merchant_rules m WHERE m.pattern = t.pattern);
