-- 015_migrate_remaining_icons.sql

UPDATE categories SET icon = 'circum:receipt' WHERE name = 'Bills';
UPDATE categories SET icon = 'circum:home' WHERE name = 'Rent';
UPDATE categories SET icon = 'circum:play-1' WHERE name = 'Entertainment';
UPDATE categories SET icon = 'circum:hospital-1' WHERE name = 'Health';
UPDATE categories SET icon = 'circum:credit-card-1' WHERE name = 'Transfers';
UPDATE categories SET icon = 'circum:circle-more' WHERE name = 'Other';
UPDATE categories SET icon = 'circum:avocado' WHERE name = 'Food';
UPDATE categories SET icon = 'circum:apple' WHERE name IN ('Fruits', 'Vegetables');
UPDATE categories SET icon = 'circum:heart' WHERE name = 'Pet Food';
