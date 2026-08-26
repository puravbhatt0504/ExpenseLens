/**
 * budgets.js — PUT /budgets
 */
const { Router } = require('express');
const db = require('../db');

const router = Router();

// GET /budgets
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Independent reads — issue concurrently.
    const [userResult, budgetResult] = await Promise.all([
      db.query('SELECT monthly_budget FROM users WHERE id = $1', [userId]),
      db.query(
        `SELECT cb.category_id, cb.budget_amount, c.name, c.icon, c.color
         FROM user_category_budgets cb
         JOIN categories c ON cb.category_id = c.id
         WHERE cb.user_id = $1`,
        [userId]
      ),
    ]);
    const totalBudget = userResult.rows[0]?.monthly_budget ? parseFloat(userResult.rows[0].monthly_budget) : null;

    const categoryBudgets = budgetResult.rows.map(row => ({
      categoryId: row.category_id,
      categoryName: row.name,
      categoryIcon: row.icon,
      categoryColor: row.color,
      amount: parseFloat(row.budget_amount)
    }));

    res.json({ totalBudget, categoryBudgets });
  } catch (err) {
    console.error('GET /budgets error:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// PUT /budgets
// Body: { totalBudget: 50000, categoryBudgets: { "1": 5000, "2": 2000 } }
router.put('/', async (req, res) => {
  const { totalBudget, categoryBudgets } = req.body;
  const userId = req.user.id;

  // BEGIN/COMMIT/ROLLBACK must run on the SAME connection as the statements
  // they wrap. db.query() delegates to pool.query(), which checks out and
  // releases a connection on every call — so issuing BEGIN/COMMIT through it
  // gives no transactional guarantee at all: each statement can land on a
  // different pooled connection and auto-commits independently. A dedicated
  // client held for the whole request is required for a real transaction.
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update total budget in users table
    if (totalBudget !== undefined) {
      await client.query(
        'UPDATE users SET monthly_budget = $1 WHERE id = $2',
        [totalBudget, userId]
      );
    }

    // 2. Update category budgets
    if (categoryBudgets && typeof categoryBudgets === 'object') {
      for (const [categoryIdStr, amount] of Object.entries(categoryBudgets)) {
        const categoryId = parseInt(categoryIdStr, 10);

        if (amount === null) {
          // If amount is null, delete the budget for this category
          await client.query(
            'DELETE FROM user_category_budgets WHERE user_id = $1 AND category_id = $2',
            [userId, categoryId]
          );
        } else {
          // Upsert the category budget
          await client.query(
            `INSERT INTO user_category_budgets (user_id, category_id, budget_amount)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, category_id)
             DO UPDATE SET budget_amount = EXCLUDED.budget_amount, updated_at = now()`,
            [userId, categoryId, amount]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Budgets updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /budgets error:', err);
    res.status(500).json({ error: 'Failed to update budgets' });
  } finally {
    client.release();
  }
});

module.exports = router;
