-- 013_restore_travel.sql

-- 1. Restore Travel category with proper group and circum icon
UPDATE categories 
SET category_group = 'Miscellaneous', 
    icon = 'circum:plane', 
    color = '#4ECDC4'
WHERE name = 'Travel';

-- 2. Map Uber, Ola, Rapido rules back to Travel
UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Travel' LIMIT 1)
WHERE pattern IN ('uber', 'ola', 'rapido')
  AND category_id = (SELECT id FROM categories WHERE name = 'Petrol' LIMIT 1);
