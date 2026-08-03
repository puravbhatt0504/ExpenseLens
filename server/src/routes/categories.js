/**
 * categories.js — GET /categories
 */
const { Router } = require('express');
const db = require('../db');

const router = Router();

// GET /categories — list all categories
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, icon, color FROM categories ORDER BY id'
    );
    // Cache categories aggressively (1 hour at edge, 1 hour at browser)
    // Categories are shared across all users and rarely change
    res.setHeader('Cache-Control', 'public, s-maxage=3600, max-age=3600');
    res.json(rows);
  } catch (err) {
    console.error('GET /categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /categories — create a new category
router.post('/', async (req, res) => {
  try {
    let { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }

    if (!icon) {
      // Auto-assign icon based on keywords in the name
      const { rows: iconRows } = await db.query(
        `SELECT icon FROM category_icons
         WHERE $1 ILIKE '%' || keyword || '%'
         ORDER BY length(keyword) DESC LIMIT 1`,
        [name]
      );
      if (iconRows.length > 0) {
        icon = iconRows[0].icon;
      } else {
        icon = '📌'; // Default icon
      }
    }

    if (!color) {
      color = '#C0C0C0'; // Default color
    }

    const { rows } = await db.query(
      `INSERT INTO categories (name, icon, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, icon, color]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /categories error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

module.exports = router;
