const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/suppliers - list suppliers
router.get('/', auth, async (req, res) => {
  const { q } = req.query;
  let query = 'SELECT * FROM mds_suppliers WHERE 1=1';
  const params = [];

  if (q) {
    query += ' AND (name LIKE ? OR category LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  query += ' ORDER BY name ASC';

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/suppliers/:id - single supplier
router.get('/:id', auth, async (req, res) => {
  try {
    const [[row]] = await db.query('SELECT * FROM mds_suppliers WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Supplier not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/suppliers
router.post('/', auth, roles('admin'), async (req, res) => {
  const { name, contact_person, phone, email, address, website, category, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier name required' });

  try {
    const [result] = await db.query(
      `INSERT INTO mds_suppliers (name, contact_person, phone, email, address, website, category, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, contact_person || null, phone || null, email || null, address || null, website || null, category || null, notes || null]
    );
    const [[created]] = await db.query('SELECT * FROM mds_suppliers WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/suppliers/:id
router.patch('/:id', auth, roles('admin'), async (req, res) => {
  const fields = req.body;
  const updates = [];
  const params = [];

  for (const [key, val] of Object.entries(fields)) {
    if (['name', 'contact_person', 'phone', 'email', 'address', 'website', 'category', 'notes'].includes(key)) {
      updates.push(`${key} = ?`);
      params.push(val);
    }
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);

  try {
    await db.query(`UPDATE mds_suppliers SET ${updates.join(', ')} WHERE id = ?`, params);
    const [[updated]] = await db.query('SELECT * FROM mds_suppliers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM mds_suppliers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
