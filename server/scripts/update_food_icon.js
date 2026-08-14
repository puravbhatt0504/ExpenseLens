require('dotenv').config();
const db = require('../src/db');
db.query("UPDATE categories SET icon = 'circum:avocado' WHERE name = 'Food'").then(() => {
  console.log('Done');
  process.exit(0);
});
