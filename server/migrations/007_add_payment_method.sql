-- 007_add_payment_method.sql — Add payment_method to transactions and incomes

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';
