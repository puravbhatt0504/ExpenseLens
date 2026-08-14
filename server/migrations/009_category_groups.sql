-- 009_category_groups.sql - Add category_group and insert handwritten categories

ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_group TEXT;

INSERT INTO categories (name, category_group, icon, color) VALUES
  ('Grocery', 'Fixed expenses', '🛒', '#FFB347'),
  ('Veg - Fruits', 'Fixed expenses', '🍎', '#FF6B6B'),
  ('Dairy', 'Fixed expenses', '🥛', '#FFFDD0'),
  ('Electricity Bill', 'Fixed expenses', '⚡', '#FDFD96'),
  ('Phone Bill', 'Fixed expenses', '📱', '#AEC6CF'),
  ('T.V Bill', 'Fixed expenses', '📺', '#77DD77'),
  ('Gas Bill', 'Fixed expenses', '🔥', '#FF6961'),
  ('House Rent', 'Fixed expenses', '🏠', '#CFCFC4'),
  ('Petrol', 'Fixed expenses', '⛽', '#FFB347'),
  ('Children School Fees', 'Fixed expenses', '🎓', '#B19CD9'),

  ('Medical / Crust', 'Miscellaneous', '⚕️', '#FF6961'),
  ('Child Requirement', 'Miscellaneous', '🧸', '#FDFD96'),
  ('Weekend', 'Miscellaneous', '🎉', '#FFB347'),
  ('House Shopping', 'Miscellaneous', '🛍️', '#FF6B6B'),
  ('Personal', 'Miscellaneous', '👤', '#CFCFC4');
