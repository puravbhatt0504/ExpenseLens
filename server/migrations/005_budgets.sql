-- 005_budgets.sql - Add budgeting features

-- Add total monthly budget to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(10,2);

-- Create table for category-specific budgets
CREATE TABLE IF NOT EXISTS user_category_budgets (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  budget_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, category_id)
);
