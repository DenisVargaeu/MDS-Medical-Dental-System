const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/vitals/:patientId - list vitals for a patient
router.get('/:patientId', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_patient_vitals v
       JOIN mds_users u ON u.id = v.doctor_id
       WHERE v.patient_id = ?
       ORDER BY v.recorded_at DESC`,
      [req.params.patientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/vitals - record new vitals
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { 
    patient_id, blood_pressure, pulse, temperature, weight_kg, height_cm, bmi, oxygen_saturation, notes 
  } = req.body;
  
  if (!patient_id) return res.status(400).json({ error: 'Patient ID required' });

  try {
    const [result] = await db.query(
      `INSERT INTO mds_patient_vitals 
       (patient_id, doctor_id, recorded_at, blood_pressure, pulse, temperature, weight_kg, height_cm, bmi, oxygen_saturation, notes)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, req.user.id, blood_pressure || null, pulse || null, temperature || null, weight_kg || null, height_cm || null, bmi || null, oxygen_saturation || null, notes || null]
    );
    const [[created]] = await db.query('SELECT * FROM mds_patient_vitals WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/vitals/:id
router.delete('/:id', auth, roles('admin', 'doctor'), async (req, res) => {
  try {
    await db.query('DELETE FROM mds_patient_vitals WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vitals record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
