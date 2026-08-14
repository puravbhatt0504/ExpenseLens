-- 011_fix_food_mapping.sql

-- 1. Insert 'Eating Out' into Miscellaneous
INSERT INTO categories (name, category_group, icon, color) 
VALUES ('Eating Out', 'Miscellaneous', '🍽️', '#FFB347')
ON CONFLICT DO NOTHING;

-- 2. Move 'Vegetable' transaction to 'Veg - Fruits'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Veg - Fruits' LIMIT 1)
WHERE merchant ILIKE '%vegetable%';

-- 3. Move other transactions that were mistakenly put into 'Weekend' (from the old 'Food' category) to 'Eating Out'
-- Since we know 'Oven Story' and 'Chaafo' are currently in 'Weekend', let's map them to 'Eating Out'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Eating Out' LIMIT 1)
WHERE merchant IN ('Oven Story', 'Chaafo') 
  AND category_id = (SELECT id FROM categories WHERE name = 'Weekend' LIMIT 1);

-- 4. Update merchant rules for zomato and swiggy to point to 'Eating Out' instead of 'Weekend'
UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Eating Out' LIMIT 1)
WHERE pattern IN ('zomato', 'swiggy') 
  AND category_id = (SELECT id FROM categories WHERE name = 'Weekend' LIMIT 1);
