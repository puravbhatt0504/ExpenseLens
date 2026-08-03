-- 006_new_categories.sql - Add new categories

INSERT INTO categories (name, icon, color) VALUES
  ('Fruits', '🍎', '#FF6B6B'),
  ('Vegetables', '🥕', '#FFA07A')
ON CONFLICT DO NOTHING;
