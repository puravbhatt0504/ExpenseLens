/**
 * summary.js — GET /summary
 */
const { Router } = require('express');
const db = require('../db');

const router = Router();

// GET /summary?month=YYYY-MM — monthly aggregation
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Missing query parameter: month (YYYY-MM)' });
    }

    // 1. Get total spend and transaction count
    const totalQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE to_char(txn_date, 'YYYY-MM') = $1 AND user_id = $2
    `;
    const totalResult = await db.query(totalQuery, [month, req.user.id]);
    const { count, total } = totalResult.rows[0];

    // 2. Get category breakdown
    const categoryQuery = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(SUM(t.amount), 0) as amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE to_char(t.txn_date, 'YYYY-MM') = $1 AND t.user_id = $2
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY amount DESC
    `;
    const categoryResult = await db.query(categoryQuery, [month, req.user.id]);

    res.json({
      month,
      count: parseInt(count, 10),
      total: parseFloat(total),
      byCategory: categoryResult.rows.map(row => ({
        categoryId: row.category_id,
        categoryName: row.category_name || 'Uncategorized',
        categoryIcon: row.category_icon || '📌',
        categoryColor: row.category_color || '#C0C0C0',
        amount: parseFloat(row.amount)
      }))
    });
  } catch (err) {
    console.error('GET /summary error:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
