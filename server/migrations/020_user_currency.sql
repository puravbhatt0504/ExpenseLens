-- 020_user_currency.sql — Per-user display currency.
-- Amounts are stored as plain numbers; this only picks the symbol/locale
-- used to render them. No FX conversion.

ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';
