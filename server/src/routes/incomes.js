/**
 * incomes.js — CRUD endpoints for incomes
 *
 *   POST   /incomes           — create an income entry
 *   GET    /incomes?month=YYYY-MM  — list incomes for a month
 *   PATCH  /incomes/:id       — update an income
 *   DELETE /incomes/:id       — delete an income
 */
const { Router } = require('express');
const db = require('../db');

const router = Router();

// POST /incomes
router.post('/', async (req, res) => {
  try {
    const { amount, date, source, note, payment_method } = req.body;

    if (!amount || !date) {
      return res.status(400).json({
        error: 'Missing required fields: amount, date',
      });
    }

    const { rows } = await db.query(
      `INSERT INTO incomes (amount, date, source, note, payment_method, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [amount, date, source || null, note || null, payment_method || 'cash', req.user.id]
    );

    const income = rows[0];
    income.amount = parseFloat(income.amount);

    res.status(201).json(income);
  } catch (err) {
    console.error('POST /incomes error:', err);
    res.status(500).json({ error: 'Failed to add income' });
  }
});

// GET /incomes?month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        error: 'month query param required in YYYY-MM format',
      });
    }

    const { rows } = await db.query(
      `SELECT * FROM incomes
       WHERE to_char(date, 'YYYY-MM') = $1 AND user_id = $2
       ORDER BY date DESC, created_at DESC`,
      [month, req.user.id]
    );

    const mappedRows = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error('GET /incomes error:', err);
    res.status(500).json({ error: 'Failed to fetch incomes' });
  }
});

// PATCH /incomes/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const allowedFields = ['amount', 'date', 'source', 'note', 'payment_method'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id, req.user.id);
    const { rows } = await db.query(
      `UPDATE incomes SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Income not found or unauthorized' });
    }
    
    const income = rows[0];
    income.amount = parseFloat(income.amount);

    res.json(income);
  } catch (err) {
    console.error('PATCH /incomes/:id error:', err);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE /incomes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      'DELETE FROM incomes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Income not found or unauthorized' });
    }

    res.json({ message: 'Income deleted', id: rows[0].id });
  } catch (err) {
    console.error('DELETE /incomes/:id error:', err);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

module.exports = router;
