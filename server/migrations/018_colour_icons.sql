-- 018_colour_icons.sql — Point every canonical category at its bundled
-- flat-colour icon key (see server/icons/manifest.json), and give each a
-- chip background colour that matches the artwork instead of the old
-- ad-hoc palette from migration 017.
--
-- Ship this migration in the same deploy as the app/web builds that know
-- how to render `el:*` keys — see app/lib/widgets/category_icon.dart and
-- web/src/components/CategoryIcon.js. An older client still falls back to
-- its `circum:*` map, so this is safe to run slightly ahead of rollout,
-- but not safe to leave stale for long (icons will show as a pin/blank
-- until the client update lands).

UPDATE categories SET icon = 'el:groceries',     color = '#FFE8CC' WHERE name = 'Groceries';
UPDATE categories SET icon = 'el:produce',        color = '#E3F5D4' WHERE name = 'Fruits & Vegetables';
UPDATE categories SET icon = 'el:dairy',          color = '#DCEBFA' WHERE name = 'Dairy';
UPDATE categories SET icon = 'el:rent',           color = '#EFE6DA' WHERE name = 'House Rent';
UPDATE categories SET icon = 'el:electricity',    color = '#FFF3C4' WHERE name = 'Electricity';
UPDATE categories SET icon = 'el:mobile',         color = '#DCEAFB' WHERE name = 'Mobile & Internet';
UPDATE categories SET icon = 'el:tv',             color = '#E9E1F7' WHERE name = 'TV & Subscriptions';
UPDATE categories SET icon = 'el:gas',            color = '#FBE0DF' WHERE name = 'Cooking Gas';
UPDATE categories SET icon = 'el:water',          color = '#D9F1FA' WHERE name = 'Water';
UPDATE categories SET icon = 'el:fuel',           color = '#FDE3F5' WHERE name = 'Fuel';
UPDATE categories SET icon = 'el:school',         color = '#D6F5F5' WHERE name = 'School Fees';
UPDATE categories SET icon = 'el:eating-out',     color = '#FFE6D1' WHERE name = 'Eating Out';
UPDATE categories SET icon = 'el:shopping',       color = '#DFF6E3' WHERE name = 'Shopping';
UPDATE categories SET icon = 'el:entertainment',  color = '#EBE0FA' WHERE name = 'Entertainment';
UPDATE categories SET icon = 'el:travel',         color = '#D6F2EF' WHERE name = 'Travel';
UPDATE categories SET icon = 'el:health',         color = '#FDE1E1' WHERE name = 'Health & Medical';
UPDATE categories SET icon = 'el:kids',           color = '#FEE7EF' WHERE name = 'Kids';
UPDATE categories SET icon = 'el:pets',           color = '#F5E9D8' WHERE name = 'Pets';
UPDATE categories SET icon = 'el:personal',       color = '#E0F3F8' WHERE name = 'Personal Care';
UPDATE categories SET icon = 'el:transfers',      color = '#D7F0EC' WHERE name = 'Transfers';
UPDATE categories SET icon = 'el:misc',           color = '#E7E7E7' WHERE name = 'Miscellaneous';

-- Keep the auto-assignment keyword table (used by POST /categories when no
-- icon is supplied) in sync with the same el:* keys.
TRUNCATE category_icons;
INSERT INTO category_icons (keyword, icon) VALUES
  ('grocery', 'el:groceries'), ('groceries', 'el:groceries'), ('supermarket', 'el:groceries'),
  ('fruit', 'el:produce'), ('vegetable', 'el:produce'), ('produce', 'el:produce'),
  ('dairy', 'el:dairy'), ('milk', 'el:dairy'),
  ('rent', 'el:rent'), ('housing', 'el:rent'),
  ('electricity', 'el:electricity'), ('power', 'el:electricity'),
  ('mobile', 'el:mobile'), ('phone', 'el:mobile'), ('internet', 'el:mobile'), ('broadband', 'el:mobile'), ('wifi', 'el:mobile'),
  ('tv', 'el:tv'), ('television', 'el:tv'), ('subscription', 'el:tv'),
  ('gas', 'el:gas'), ('lpg', 'el:gas'), ('cylinder', 'el:gas'),
  ('water', 'el:water'),
  ('fuel', 'el:fuel'), ('petrol', 'el:fuel'), ('diesel', 'el:fuel'),
  ('school', 'el:school'), ('tuition', 'el:school'), ('education', 'el:school'),
  ('eating', 'el:eating-out'), ('restaurant', 'el:eating-out'), ('dining', 'el:eating-out'), ('food', 'el:eating-out'),
  ('shopping', 'el:shopping'), ('clothes', 'el:shopping'), ('electronics', 'el:shopping'),
  ('entertainment', 'el:entertainment'), ('movie', 'el:entertainment'), ('music', 'el:entertainment'), ('games', 'el:entertainment'),
  ('travel', 'el:travel'), ('flight', 'el:travel'), ('trip', 'el:travel'),
  ('health', 'el:health'), ('medical', 'el:health'), ('doctor', 'el:health'), ('pharmacy', 'el:health'),
  ('kids', 'el:kids'), ('child', 'el:kids'), ('children', 'el:kids'),
  ('pet', 'el:pets'), ('dog', 'el:pets'), ('cat', 'el:pets'),
  ('personal', 'el:personal'), ('salon', 'el:personal'), ('grooming', 'el:personal'),
  ('transfer', 'el:transfers'), ('savings', 'el:transfers'), ('investment', 'el:transfers')
ON CONFLICT (keyword) DO UPDATE SET icon = EXCLUDED.icon;
