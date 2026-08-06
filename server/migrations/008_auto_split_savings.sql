-- 008_auto_split_savings.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_split_savings BOOLEAN DEFAULT false;
