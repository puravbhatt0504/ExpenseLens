/**
 * summary.js — GET /summary
 */
const { Router } = require('express');
const db = require('../db');
const { MONTH_FORMAT, monthStart } = require('../lib/dateRange');

const router = Router();

// GET /summary?month=YYYY-MM — monthly aggregation
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !MONTH_FORMAT.test(month)) {
      return res.status(400).json({ error: 'Missing or invalid query parameter: month (YYYY-MM)' });
    }
    const start = monthStart(month);

    // These five queries are all independent reads — issue them concurrently
    // instead of awaiting one at a time.
    const totalQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $2
        AND txn_date >= $1::date
        AND txn_date < ($1::date + INTERVAL '1 month')
    `;
    const incomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_income
      FROM incomes
      WHERE user_id = $2
        AND date >= $1::date
        AND date < ($1::date + INTERVAL '1 month')
    `;
    const categoryQuery = `
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(SUM(t.amount), 0) as amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $2
        AND t.txn_date >= $1::date
        AND t.txn_date < ($1::date + INTERVAL '1 month')
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY amount DESC
    `;
    const budgetQuery = `
      SELECT category_id, budget_amount
      FROM user_category_budgets
      WHERE user_id = $1
    `;

    const [totalResult, incomeResult, categoryResult, userResult, budgetResult] = await Promise.all([
      db.query(totalQuery, [start, req.user.id]),
      db.query(incomeQuery, [start, req.user.id]),
      db.query(categoryQuery, [start, req.user.id]),
      db.query('SELECT monthly_budget FROM users WHERE id = $1', [req.user.id]),
      db.query(budgetQuery, [req.user.id]),
    ]);

    const { count, total } = totalResult.rows[0];
    const totalIncome = incomeResult.rows[0].total_income;
    const totalBudget = userResult.rows[0]?.monthly_budget ? parseFloat(userResult.rows[0].monthly_budget) : null;
    const budgetMap = {};
    for (const row of budgetResult.rows) {
      budgetMap[row.category_id] = parseFloat(row.budget_amount);
    }

    res.json({
      month,
      count: parseInt(count, 10),
      total: parseFloat(total),
      totalIncome: parseFloat(totalIncome),
      totalBudget,
      byCategory: categoryResult.rows.map(row => ({
        categoryId: row.category_id,
        categoryName: row.category_name || 'Uncategorized',
        categoryIcon: row.category_icon || '📌',
        categoryColor: row.category_color || '#C0C0C0',
        amount: parseFloat(row.amount),
        budget: budgetMap[row.category_id] || null
      }))
    });
  } catch (err) {
    console.error('GET /summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
