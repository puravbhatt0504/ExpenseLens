/**
 * transactions.js — CRUD endpoints for transactions
 *
 *   POST   /transactions           — create a transaction
 *   GET    /transactions?month=YYYY-MM  — list transactions for a month
 *   PATCH  /transactions/:id       — update a transaction
 *   DELETE /transactions/:id       — delete a transaction
 */
const { Router } = require('express');
const db = require('../db');
const { MONTH_FORMAT, monthStart } = require('../lib/dateRange');

const router = Router();

// ---------------------------------------------------------------------------
// POST /transactions
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { amount, txn_date, merchant, note, category_id, source, raw_extracted, payment_method } = req.body;

    // Basic validation
    if (!amount || !txn_date || !source) {
      return res.status(400).json({
        error: 'Missing required fields: amount, txn_date, source',
      });
    }

    if (!['manual', 'upi_screenshot'].includes(source)) {
      return res.status(400).json({
        error: "source must be 'manual' or 'upi_screenshot'",
      });
    }

    const { rows } = await db.query(
      `INSERT INTO transactions (amount, txn_date, merchant, note, category_id, source, raw_extracted, payment_method, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [amount, txn_date, merchant || null, note || null, category_id || null, source, raw_extracted || null, payment_method || 'cash', req.user.id]
    );

    const transaction = rows[0];
    transaction.amount = parseFloat(transaction.amount);

    // If there was a suggested category and the user changed it, log it for
    // future learning. This is best-effort telemetry on an already-committed
    // transaction — a failure here must not turn into a 500 for the caller,
    // since the transaction was already created and a retry would duplicate it.
    const suggested_category_id = req.body.suggested_category_id;
    if (suggested_category_id && suggested_category_id !== category_id) {
      try {
        await db.query(
          `INSERT INTO category_corrections (transaction_id, suggested_category_id, corrected_category_id)
           VALUES ($1, $2, $3)`,
          [transaction.id, suggested_category_id, category_id || null]
        );
      } catch (correctionErr) {
        console.error('Failed to log category correction (non-fatal):', correctionErr);
      }
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error('POST /transactions error:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// ---------------------------------------------------------------------------
// GET /transactions?month=YYYY-MM
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;

    if (!month || !MONTH_FORMAT.test(month)) {
      return res.status(400).json({
        error: 'month query param required in YYYY-MM format',
      });
    }

    const { rows } = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $2
         AND t.txn_date >= $1::date
         AND t.txn_date < ($1::date + INTERVAL '1 month')
       ORDER BY t.txn_date DESC, t.created_at DESC`,
      [monthStart(month), req.user.id]
    );

    // Postgres numeric types are returned as strings by node-postgres.
    // Parse them to floats so Flutter's json parser doesn't crash on 'String is not a subtype of double'.
    const mappedRows = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount)
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error('GET /transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /transactions/:id
// ---------------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Build dynamic SET clause from the provided fields
    const allowedFields = ['amount', 'txn_date', 'merchant', 'note', 'category_id', 'source', 'raw_extracted', 'payment_method'];
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
      `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }
    
    const transaction = rows[0];
    transaction.amount = parseFloat(transaction.amount);

    res.json(transaction);
  } catch (err) {
    console.error('PATCH /transactions/:id error:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /transactions/:id
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    res.json({ message: 'Transaction deleted', id: rows[0].id });
  } catch (err) {
    console.error('DELETE /transactions/:id error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
