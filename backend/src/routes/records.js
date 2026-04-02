const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/records?patient_id=x
router.get('/', auth, async (req, res) => {
  const { patient_id, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];
  if (patient_id) { conditions.push('r.patient_id = ?'); params.push(patient_id); }
  if (req.user.role === 'doctor') { conditions.push('r.doctor_id = ?'); params.push(req.user.id); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await db.query(
      `SELECT r.*, p.first_name, p.last_name,
              u.name AS doctor_name, u.surname AS doctor_surname,
              a.date AS appointment_date, a.time AS appointment_time
       FROM mds_medical_records r
       JOIN mds_patients p ON p.id = r.patient_id
       JOIN mds_users u ON u.id = r.doctor_id
       LEFT JOIN mds_appointments a ON a.id = r.appointment_id
       ${where}
       ORDER BY r.visit_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/records/:id - full record with treatments
router.get('/:id', auth, async (req, res) => {
  try {
    const [[record]] = await db.query(
      `SELECT r.*, p.first_name, p.last_name, u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_medical_records r
       JOIN mds_patients p ON p.id = r.patient_id
       JOIN mds_users u ON u.id = r.doctor_id
       WHERE r.id = ?`, [req.params.id]
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const [treatments] = await db.query(
      `SELECT pt.*, t.name AS treatment_name, t.category,
              u.name AS performed_by_name
       FROM mds_patient_treatments pt
       JOIN mds_treatments t ON t.id = pt.treatment_id
       LEFT JOIN mds_users u ON u.id = pt.performed_by
       WHERE pt.record_id = ?`, [req.params.id]
    );
    res.json({ record, treatments });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/records
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { patient_id, appointment_id, visit_date, chief_complaint, clinical_findings, treatment_performed, doctor_notes, follow_up_date, follow_up_notes } = req.body;
  if (!patient_id || !visit_date) return res.status(400).json({ error: 'patient_id and visit_date required' });
  try {
    const [result] = await db.query(
      `INSERT INTO mds_medical_records (patient_id, doctor_id, appointment_id, visit_date, chief_complaint, clinical_findings, treatment_performed, doctor_notes, follow_up_date, follow_up_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, req.user.id, appointment_id || null, visit_date, chief_complaint || null, clinical_findings || null, treatment_performed || null, doctor_notes || null, follow_up_date || null, follow_up_notes || null]
    );
    // Mark appointment as completed if linked
    if (appointment_id) {
      await db.query(`UPDATE mds_appointments SET status = 'completed' WHERE id = ?`, [appointment_id]);
    }
    const [[created]] = await db.query('SELECT * FROM mds_medical_records WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/records/:id
router.put('/:id', auth, roles('admin', 'doctor'), async (req, res) => {
  const allowed = ['chief_complaint','clinical_findings','treatment_performed','doctor_notes','follow_up_date','follow_up_notes'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });
  try {
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await db.query(`UPDATE mds_medical_records SET ${sets} WHERE id = ?`, [...fields.map(f => req.body[f]), req.params.id]);
    const [[updated]] = await db.query('SELECT * FROM mds_medical_records WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/records/:id/treatments - add treatment to record
router.post('/:id/treatments', auth, roles('admin', 'doctor'), async (req, res) => {
  const { treatment_id, tooth_number, quantity, unit_price, notes } = req.body;
  if (!treatment_id || !unit_price) return res.status(400).json({ error: 'treatment_id and unit_price required' });
  const qty = parseInt(quantity) || 1;
  const total = parseFloat(unit_price) * qty;
  try {
    const [[record]] = await db.query('SELECT patient_id FROM mds_medical_records WHERE id = ?', [req.params.id]);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const [r] = await db.query(
      `INSERT INTO mds_patient_treatments (record_id, patient_id, treatment_id, tooth_number, quantity, unit_price, total_price, notes, performed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, record.patient_id, treatment_id, tooth_number || null, qty, unit_price, total, notes || null, req.user.id]
    );
    const [[created]] = await db.query(
      `SELECT pt.*, t.name AS treatment_name FROM mds_patient_treatments pt
       JOIN mds_treatments t ON t.id = pt.treatment_id WHERE pt.id = ?`, [r.insertId]
    );
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/records/:id/treatments/:tid
router.delete('/:id/treatments/:tid', auth, roles('admin', 'doctor'), async (req, res) => {
  await db.query('DELETE FROM mds_patient_treatments WHERE id = ? AND record_id = ?', [req.params.tid, req.params.id]);
  res.json({ message: 'Removed' });
});

module.exports = router;
