-- 006_new_categories.sql - Add new categories

INSERT INTO categories (name, icon, color)
SELECT * FROM (VALUES
  ('Fruits', '🍎', '#FF6B6B'),
  ('Vegetables', '🥕', '#FFA07A')
) AS t(name, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = t.name);
