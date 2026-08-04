/**
 * savings.js — CRUD endpoints for savings goals
 */
const { Router } = require('express');
const db = require('../db');

const router = Router();

// POST /savings
router.post('/', async (req, res) => {
  try {
    const { name, target_amount, current_amount, target_date, icon, color } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({
        error: 'Missing required fields: name, target_amount',
      });
    }

    const { rows } = await db.query(
      `INSERT INTO savings_goals (name, target_amount, current_amount, target_date, icon, color, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, target_amount, current_amount || 0, target_date || null, icon || '🎯', color || '#10b981', req.user.id]
    );

    const goal = rows[0];
    goal.target_amount = parseFloat(goal.target_amount);
    goal.current_amount = parseFloat(goal.current_amount);

    res.status(201).json(goal);
  } catch (err) {
    console.error('POST /savings error:', err);
    res.status(500).json({ error: 'Failed to create savings goal' });
  }
});

// GET /savings
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM savings_goals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const mappedRows = rows.map(r => ({
      ...r,
      target_amount: parseFloat(r.target_amount),
      current_amount: parseFloat(r.current_amount)
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error('GET /savings error:', err);
    res.status(500).json({ error: 'Failed to fetch savings goals' });
  }
});

// PATCH /savings/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const allowedFields = ['name', 'target_amount', 'current_amount', 'target_date', 'icon', 'color'];
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
      `UPDATE savings_goals SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Savings goal not found or unauthorized' });
    }
    
    const goal = rows[0];
    goal.target_amount = parseFloat(goal.target_amount);
    goal.current_amount = parseFloat(goal.current_amount);

    res.json(goal);
  } catch (err) {
    console.error('PATCH /savings/:id error:', err);
    res.status(500).json({ error: 'Failed to update savings goal' });
  }
});

// DELETE /savings/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Savings goal not found or unauthorized' });
    }

    res.json({ message: 'Savings goal deleted', id: rows[0].id });
  } catch (err) {
    console.error('DELETE /savings/:id error:', err);
    res.status(500).json({ error: 'Failed to delete savings goal' });
  }
});

module.exports = router;
