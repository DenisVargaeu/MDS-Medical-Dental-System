const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const Log = require('../models/log');
const auth = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM mds_users WHERE email = ? AND active = 1',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last_login
    await db.query('UPDATE mds_users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Log the action
    await Log.create(user.id, 'LOGIN', 'user', user.id, { email: user.email }, req.ip);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, surname: user.surname },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, surname, email, role, phone, avatar, last_login FROM mds_users WHERE id = ? AND active = 1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const [rows] = await db.query('SELECT password_hash FROM mds_users WHERE id = ?', [req.user.id]);
    const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    if (currentHash !== rows[0].password_hash) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = crypto.createHash('sha256').update(newPassword).digest('hex');
    await db.query('UPDATE mds_users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
