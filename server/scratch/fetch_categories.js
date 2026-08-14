require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'categories'`);
    console.log(res.rows.map(r => r.column_name));
    
    // Check if there are other Food categories for user_id
    const res2 = await pool.query(`SELECT * FROM categories WHERE name ILIKE '%food%'`);
    console.log(res2.rows);
  } catch (err) {
    console.error('Error fetching:', err);
  } finally {
    await pool.end();
  }
}
main();
