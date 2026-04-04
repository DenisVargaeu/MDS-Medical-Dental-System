const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/sterilization - list sterilization logs
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.name AS doctor_name, u.surname AS doctor_surname
      FROM mds_sterilization s
      JOIN mds_users u ON u.id = s.doctor_id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sterilization - log a cycle
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { cycle_number, equipment_id, temperature, pressure, duration_minutes, status, notes } = req.body;
  if (!cycle_number) return res.status(400).json({ error: 'Cycle number required' });

  try {
    const [result] = await db.query(
      `INSERT INTO mds_sterilization (doctor_id, cycle_number, equipment_id, temperature, pressure, duration_minutes, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, cycle_number, equipment_id || 'Autoclave-01', temperature || 134, pressure || 2.1, duration_minutes || 15, status || 'passed', notes || null]
    );
    const [[created]] = await db.query('SELECT * FROM mds_sterilization WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/sterilization/:id
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM mds_sterilization WHERE id = ?', [req.params.id]);
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
