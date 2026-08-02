-- 002_icons.sql — Seed common icons for categories

INSERT INTO category_icons (keyword, icon) VALUES
  ('food', '🍔'), ('dining', '🍽️'), ('restaurant', '🍝'), ('coffee', '☕'), ('groceries', '🛒'),
  ('travel', '✈️'), ('transport', '🚌'), ('flight', '🛫'), ('fuel', '⛽'), ('cab', '🚕'), ('uber', '🚕'), ('ola', '🚕'),
  ('bills', '📄'), ('utilities', '💡'), ('electricity', '⚡'), ('water', '💧'), ('internet', '🌐'), ('wifi', '📶'), ('phone', '📱'),
  ('shopping', '🛍️'), ('clothes', '👗'), ('shoes', '👟'), ('electronics', '💻'), ('amazon', '📦'),
  ('rent', '🏠'), ('home', '🏡'), ('mortgage', '🏦'),
  ('entertainment', '🎬'), ('movies', '🍿'), ('games', '🎮'), ('music', '🎵'), ('subscription', '📺'),
  ('health', '💊'), ('doctor', '👨‍⚕️'), ('pharmacy', '⚕️'), ('gym', '💪'), ('fitness', '🏋️'),
  ('transfers', '💸'), ('investment', '📈'), ('savings', '💰'),
  ('education', '📚'), ('school', '🏫'), ('college', '🎓'), ('books', '📖'),
  ('gift', '🎁'), ('charity', '🤝'), ('pet', '🐾'), ('dog', '🐶'), ('cat', '🐱'),
  ('insurance', '🛡️'), ('tax', '🏛️')
ON CONFLICT (keyword) DO UPDATE SET icon = EXCLUDED.icon;
