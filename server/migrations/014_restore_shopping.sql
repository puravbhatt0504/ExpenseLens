-- 014_restore_shopping.sql

-- 1. Restore generic Shopping category
UPDATE categories 
SET category_group = 'Miscellaneous', 
    icon = 'circum:shopping-tag', 
    color = '#A8E6CF'
WHERE name = 'Shopping';

-- 2. Map Amazon, Flipkart, Myntra back to generic Shopping
UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Shopping' LIMIT 1)
WHERE pattern IN ('amazon', 'flipkart', 'myntra')
  AND category_id = (SELECT id FROM categories WHERE name = 'House Shopping' LIMIT 1);
