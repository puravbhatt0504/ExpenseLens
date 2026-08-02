-- 003_add_users.sql — Add users table and link transactions

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Add user_id to transactions. 
-- For existing records (if any), we allow NULL temporarily, but we should make it NOT NULL in production if all rows have a user.
ALTER TABLE transactions 
  ADD COLUMN user_id INT REFERENCES users(id) ON DELETE CASCADE;

-- Note: Since this is likely a dev environment, we can leave user_id as nullable 
-- to not break existing rows, or you can delete all transactions if you want a clean slate.
