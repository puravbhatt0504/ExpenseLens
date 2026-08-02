/**
 * seed.js — Run SQL seed files against the Neon database.
 * Usage: node scripts/seed.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const seedsDir = path.resolve(__dirname, '..', 'seeds');
  const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
    console.log(`Running seed: ${file}`);
    await pool.query(sql);
    console.log(`  ✓ ${file} seeded`);
  }

  await pool.end();
  console.log('\nAll seeds complete.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
