/**
 * seed_test_data.js — Creates robust dummy data (Incomes, Expenses) for testing the new Dashboard.
 */
require('dotenv').config();
const { query } = require('../src/db.js');

async function seed() {
  try {
    console.log('Seeding dummy data for the dashboard...');

    // 1. Get the first user
    const userRes = await query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found. Please create a user first.');
      process.exit(1);
    }
    const userId = userRes.rows[0].id;
    console.log(`Using User ID: ${userId}`);

    // 2. Get some categories
    const catRes = await query('SELECT id FROM categories LIMIT 3');
    if (catRes.rows.length === 0) {
      console.log('No categories found. Cannot insert dummy expenses.');
      process.exit(1);
    }
    const categories = catRes.rows.map(r => r.id);

    // Get current month
    const d = new Date();
    const currentMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // 3. Insert Incomes
    await query(`
      INSERT INTO incomes (user_id, amount, date, source, note, payment_method)
      VALUES 
      ($1, 55000, $2, 'Salary', 'August Salary', 'Bank Transfer'),
      ($1, 15000, $3, 'Freelance', 'Web Project', 'UPI'),
      ($1, 5000, $4, 'Gift', 'Birthday', 'Cash')
    `, [
      userId,
      `${currentMonthPrefix}-01`,
      `${currentMonthPrefix}-10`,
      `${currentMonthPrefix}-15`
    ]);
    console.log('Dummy Incomes inserted.');

    // 4. Insert Expenses (Transactions)
    await query(`
      INSERT INTO transactions (user_id, amount, txn_date, merchant, category_id, source, payment_method)
      VALUES 
      ($1, 12000, $2, 'Grocery Store', $5, 'manual', 'UPI'),
      ($1, 3000, $3, 'Coffee Shop', $6, 'manual', 'UPI'),
      ($1, 8000, $4, 'Electricity Bill', $7, 'manual', 'Net Banking'),
      ($1, 1500, $2, 'Movies', $6, 'manual', 'Cash'),
      ($1, 15000, $3, 'Rent', $7, 'manual', 'Bank Transfer')
    `, [
      userId,
      `${currentMonthPrefix}-02`,
      `${currentMonthPrefix}-05`,
      `${currentMonthPrefix}-10`,
      categories[0], // map to first 3 categories
      categories[1] || categories[0],
      categories[2] || categories[0]
    ]);
    console.log('Dummy Transactions inserted.');

    console.log('Seeding complete! You can now test the dashboard.');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
