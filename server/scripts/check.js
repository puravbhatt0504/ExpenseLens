require('dotenv').config();
const db = require('./src/db');

async function test() {
  try {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='transactions'");
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
