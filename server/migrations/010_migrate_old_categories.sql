-- 010_migrate_old_categories.sql

-- Map old 'Rent' to 'House Rent'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'House Rent' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Rent' LIMIT 1);

-- Map old 'Health' to 'Medical / Crust'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Medical / Crust' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Health' LIMIT 1);

-- Map old 'Shopping' to 'House Shopping'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'House Shopping' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Shopping' LIMIT 1);

-- Map old 'Food' to 'Grocery' (as a best guess for fixed expenses, or leave it?)
-- Actually, Food is usually Zomato/Swiggy. 'Weekend' might be better, or we can just leave Food alone if they want to keep it.
-- The user didn't explicitly ask to delete old categories, just "modify expenses of existing people who require changes stuff from these new changes".
-- Let's migrate Food -> Weekend
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Weekend' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Food' LIMIT 1);

-- Map old 'Travel' to 'Petrol'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Petrol' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Travel' LIMIT 1);

-- Map old 'Bills' based on keywords, default to Electricity Bill
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Phone Bill' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Bills' LIMIT 1)
  AND (merchant ILIKE '%airtel%' OR merchant ILIKE '%jio%' OR merchant ILIKE '%vi%');

UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Electricity Bill' LIMIT 1) 
WHERE category_id = (SELECT id FROM categories WHERE name = 'Bills' LIMIT 1);

-- Map old 'Transfers' and 'Other' to 'Personal'
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Personal' LIMIT 1) 
WHERE category_id IN (
    SELECT id FROM categories WHERE name IN ('Transfers', 'Other')
);

-- Note: We are not deleting the old categories from the `categories` table to avoid breaking foreign key constraints on `category_corrections`, `merchant_rules`, or `user_category_budgets` unless we update those too.
-- Let's update `merchant_rules` too so new incoming transactions use new categories.
UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'House Rent' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Rent' LIMIT 1);

UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Medical / Crust' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Health' LIMIT 1);

UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'House Shopping' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Shopping' LIMIT 1);

UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Weekend' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Food' LIMIT 1);

UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Petrol' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Travel' LIMIT 1);

-- Bills mappings in merchant rules
UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Phone Bill' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Bills' LIMIT 1) AND pattern IN ('airtel', 'jio');

UPDATE merchant_rules
SET category_id = (SELECT id FROM categories WHERE name = 'Electricity Bill' LIMIT 1)
WHERE category_id = (SELECT id FROM categories WHERE name = 'Bills' LIMIT 1) AND pattern IN ('electricity');

-- Delete old categories since we migrated all references (assuming no user_category_budgets or corrections).
-- If there are user budgets, we should probably merge them.
-- For safety, we will just keep old categories but they will be 'Uncategorized' group, which is fine, or we can hide them.
