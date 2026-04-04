const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/prescriptions - list prescriptions for a patient
router.get('/', auth, async (req, res) => {
  const { patientId } = req.query;
  let query = `
    SELECT pr.*, u.name AS doctor_name, u.surname AS doctor_surname
    FROM mds_prescriptions pr
    JOIN mds_users u ON u.id = pr.doctor_id
    WHERE 1=1
  `;
  const params = [];

  if (patientId) { query += ' AND pr.patient_id = ?'; params.push(patientId); }

  query += ' ORDER BY pr.date DESC';

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/prescriptions - create prescription
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { patient_id, medications, instructions, valid_until } = req.body;
  if (!patient_id || !medications) {
    return res.status(400).json({ error: 'Patient ID and Medications are required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO mds_prescriptions (patient_id, doctor_id, date, medications, instructions, valid_until, status)
       VALUES (?, ?, CURDATE(), ?, ?, ?, 'active')`,
      [patient_id, req.user.id, JSON.stringify(medications), instructions || null, valid_until || null]
    );
    const [[created]] = await db.query('SELECT * FROM mds_prescriptions WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/prescriptions/:id
router.delete('/:id', auth, roles('admin', 'doctor'), async (req, res) => {
  try {
    await db.query('DELETE FROM mds_prescriptions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Prescription deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
