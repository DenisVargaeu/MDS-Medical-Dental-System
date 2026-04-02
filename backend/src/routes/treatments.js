const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/treatments
router.get('/', auth, async (req, res) => {
  const { category, active = 1, search = '' } = req.query;
  const conditions = ['active = ?'];
  const params = [active];
  if (category) { conditions.push('category = ?'); params.push(category); }
  if (search) { conditions.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  try {
    const [rows] = await db.query(
      `SELECT * FROM mds_treatments WHERE ${conditions.join(' AND ')} ORDER BY category, name`,
      params
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/treatments/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM mds_treatments WHERE active = 1 ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/treatments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM mds_treatments WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Treatment not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/treatments
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { name, description, category, price, duration_minutes } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: 'Name and price required' });
  try {
    const [r] = await db.query(
      'INSERT INTO mds_treatments (name, description, category, price, duration_minutes) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, category || null, price, duration_minutes || 30]
    );
    const [[created]] = await db.query('SELECT * FROM mds_treatments WHERE id = ?', [r.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/treatments/:id
router.put('/:id', auth, roles('admin', 'doctor'), async (req, res) => {
  const allowed = ['name', 'description', 'category', 'price', 'duration_minutes', 'active'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });
  try {
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await db.query(`UPDATE mds_treatments SET ${sets} WHERE id = ?`, [...fields.map(f => req.body[f]), req.params.id]);
    const [[updated]] = await db.query('SELECT * FROM mds_treatments WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/treatments/:id (soft)
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  await db.query('UPDATE mds_treatments SET active = 0 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Treatment deactivated' });
});

module.exports = router;
