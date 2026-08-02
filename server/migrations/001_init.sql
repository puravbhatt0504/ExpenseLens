-- 001_init.sql — ExpenseLens database schema

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(10,2) NOT NULL,
  txn_date DATE NOT NULL,
  merchant TEXT,
  note TEXT,
  category_id INT REFERENCES categories(id),
  source TEXT CHECK (source IN ('manual','upi_screenshot')) NOT NULL,
  raw_extracted JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merchant_rules (
  id SERIAL PRIMARY KEY,
  pattern TEXT NOT NULL,
  category_id INT REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS category_corrections (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  suggested_category_id INT REFERENCES categories(id),
  corrected_category_id INT REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT now()
);
