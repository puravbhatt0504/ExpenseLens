/**
 * cleanup_test_data.js — Cleans up the dummy data injected by seed_test_data.js
 */
require('dotenv').config();
const { query } = require('../src/db.js');

async function cleanup() {
  try {
    console.log('Cleaning up dummy data...');

    // We can identify the dummy data by specific markers or just delete everything for the current month if it's purely a test environment.
    // However, to be safer, we can delete the exact values we inserted, or just delete where amount = 55000 / 12000 etc.
    // Actually, let's delete based on the exact note/merchant names we used in the seed script.

    // 1. Delete Incomes
    await query(`
      DELETE FROM incomes
      WHERE note IN ('August Salary', 'Web Project', 'Birthday')
    `);
    console.log('Dummy Incomes deleted.');

    // 2. Delete Transactions
    await query(`
      DELETE FROM transactions
      WHERE merchant IN ('Grocery Store', 'Coffee Shop', 'Electricity Bill', 'Movies', 'Rent')
      AND amount IN (12000, 3000, 8000, 1500, 15000)
    `);
    console.log('Dummy Transactions deleted.');

    console.log('Cleanup complete!');
    process.exit(0);

  } catch (err) {
    console.error('Error cleaning up data:', err);
    process.exit(1);
  }
}

cleanup();
