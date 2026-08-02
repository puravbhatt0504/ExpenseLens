-- 002_icon_mappings.sql — Icon keyword mapping table

CREATE TABLE IF NOT EXISTS category_icons (
  keyword TEXT PRIMARY KEY,
  icon TEXT NOT NULL
);
