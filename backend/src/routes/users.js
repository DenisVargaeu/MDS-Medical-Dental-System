const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/users - Admin only
router.get('/', auth, roles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, surname, email, role, phone, active, last_login, created_at FROM mds_users ORDER BY role, name'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/doctors - all doctors for appointment creation
router.get('/doctors', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, surname, email, phone FROM mds_users WHERE role IN ('doctor','admin') AND active = 1 ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users - Admin creates user
router.post('/', auth, roles('admin'), async (req, res) => {
  const { name, surname, email, password, role, phone } = req.body;
  if (!name || !surname || !email || !password || !role) {
    return res.status(400).json({ error: 'name, surname, email, password, role required' });
  }
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const [result] = await db.query(
      'INSERT INTO mds_users (name, surname, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, surname, email, hash, role, phone || null]
    );
    const [[created]] = await db.query(
      'SELECT id, name, surname, email, role, phone, active, created_at FROM mds_users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id - Admin can edit users
router.put('/:id', auth, roles('admin'), async (req, res) => {
  const allowed = ['name', 'surname', 'email', 'role', 'phone', 'active'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });
  try {
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await db.query(`UPDATE mds_users SET ${sets} WHERE id = ?`, [...fields.map(f => req.body[f]), req.params.id]);
    const [[updated]] = await db.query(
      'SELECT id, name, surname, email, role, phone, active FROM mds_users WHERE id = ?', [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/reset-password
router.put('/:id/reset-password', auth, roles('admin'), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    await db.query('UPDATE mds_users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
