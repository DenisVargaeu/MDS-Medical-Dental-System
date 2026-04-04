const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/lab-work - list lab orders
router.get('/', auth, async (req, res) => {
  const { patient_id, status } = req.query;
  let query = `
    SELECT lw.*, p.first_name, p.last_name, u.name AS doctor_name, u.surname AS doctor_surname
    FROM mds_lab_work lw
    JOIN mds_patients p ON p.id = lw.patient_id
    JOIN mds_users u ON u.id = lw.doctor_id
    WHERE 1=1
  `;
  const params = [];

  if (patient_id) { query += ' AND lw.patient_id = ?'; params.push(patient_id); }
  if (status) { query += ' AND lw.status = ?'; params.push(status); }

  query += ' ORDER BY lw.order_date DESC';

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/lab-work/:id - single lab order
router.get('/:id', auth, async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT lw.*, p.first_name, p.last_name, u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_lab_work lw
       JOIN mds_patients p ON p.id = lw.patient_id
       JOIN mds_users u ON u.id = lw.doctor_id
       WHERE lw.id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Lab order not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lab-work - create lab order
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { patient_id, lab_name, work_type, tooth_number, shade, due_date, cost, notes } = req.body;
  if (!patient_id || !lab_name || !work_type) {
    return res.status(400).json({ error: 'Patient ID, Lab name and Work type are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO mds_lab_work (patient_id, doctor_id, lab_name, work_type, tooth_number, shade, order_date, due_date, cost, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, 'ordered')`,
      [patient_id, req.user.id, lab_name, work_type, tooth_number || null, shade || null, due_date || null, cost || 0, notes || null]
    );
    const [[created]] = await db.query('SELECT * FROM mds_lab_work WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/lab-work/:id - update lab order
router.patch('/:id', auth, roles('admin', 'doctor'), async (req, res) => {
  const { status, received_date, notes, cost } = req.body;
  const updates = [];
  const params = [];

  if (status) { updates.push('status = ?'); params.push(status); }
  if (received_date) { updates.push('received_date = ?'); params.push(received_date); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (cost !== undefined) { updates.push('cost = ?'); params.push(cost); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.params.id);

  try {
    await db.query(`UPDATE mds_lab_work SET ${updates.join(', ')} WHERE id = ?`, params);
    const [[updated]] = await db.query('SELECT * FROM mds_lab_work WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lab-work/:id
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM mds_lab_work WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lab order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
