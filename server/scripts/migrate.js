/**
 * migrate.js — Run SQL migration files against the Neon database.
 * Tracks applied files in `schema_migrations` so re-running this script
 * is a no-op for anything already applied. Usage: node scripts/migrate.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map(r => r.filename));

  const migrationsDir = path.resolve(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const pending = files.filter(f => !applied.has(f));

  if (pending.length === 0) {
    console.log(`All ${files.length} migrations already applied. Nothing to do.`);
    await pool.end();
    return;
  }

  console.log(`${files.length - pending.length} already applied, ${pending.length} pending.\n`);

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      console.log(`Running migration: ${file}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [file]
      );
      await client.query('COMMIT');
      console.log(`  ✓ ${file} applied`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('\nAll migrations complete.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
