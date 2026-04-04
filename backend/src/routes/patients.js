const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Log = require('../models/log');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/patients - list with search & pagination
router.get('/', auth, async (req, res) => {
  const { search = '', page = 1, limit = 20, active = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchTerm = `%${search}%`;
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.first_name, p.last_name, p.birth_date, p.gender, p.phone, p.email,
              p.city, p.insurance_number, p.blood_type, p.warning_flags, p.active, p.created_at,
              TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
              (SELECT COUNT(*) FROM mds_appointments a WHERE a.patient_id = p.id) AS appointment_count,
              (SELECT MAX(a2.date) FROM mds_appointments a2 WHERE a2.patient_id = p.id AND a2.status = 'completed') AS last_visit
       FROM mds_patients p
       WHERE p.active = ?
         AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ? OR p.insurance_number LIKE ?)
       ORDER BY p.last_name, p.first_name
       LIMIT ? OFFSET ?`,
      [active, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM mds_patients WHERE active = ?
       AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ? OR insurance_number LIKE ?)`,
      [active, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/patients/:id - full patient detail
router.get('/:id', auth, async (req, res) => {
  try {
    const [[patient]] = await db.query(
      `SELECT p.*, TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
              u.name AS created_by_name
       FROM mds_patients p
       LEFT JOIN mds_users u ON u.id = p.created_by
       WHERE p.id = ?`, [req.params.id]
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const [allergies] = await db.query('SELECT * FROM mds_allergies WHERE patient_id = ? ORDER BY severity DESC', [req.params.id]);
    const [medications] = await db.query('SELECT * FROM mds_medications WHERE patient_id = ? ORDER BY active DESC, name', [req.params.id]);
    const [diagnoses] = await db.query(`SELECT d.*, u.name AS doctor_name FROM mds_diagnoses d LEFT JOIN mds_users u ON u.id = d.diagnosed_by WHERE d.patient_id = ? ORDER BY d.diagnosed_at DESC`, [req.params.id]);
    const [appointments] = await db.query(
      `SELECT a.*, u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_appointments a JOIN mds_users u ON u.id = a.doctor_id
       WHERE a.patient_id = ? ORDER BY a.date DESC, a.time DESC LIMIT 10`, [req.params.id]
    );
    const [records] = await db.query(
      `SELECT r.*, u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_medical_records r JOIN mds_users u ON u.id = r.doctor_id
       WHERE r.patient_id = ? ORDER BY r.visit_date DESC LIMIT 10`, [req.params.id]
    );
    const [files] = await db.query(
      `SELECT f.*, u.name AS uploader FROM mds_files f LEFT JOIN mds_users u ON u.id = f.uploaded_by
       WHERE f.patient_id = ? ORDER BY f.uploaded_at DESC`, [req.params.id]
    );
    const [invoices] = await db.query(
      `SELECT * FROM mds_invoices WHERE patient_id = ? ORDER BY issue_date DESC LIMIT 10`, [req.params.id]
    );
    const [treatmentPlans] = await db.query(
      `SELECT * FROM mds_treatment_plans WHERE patient_id = ? ORDER BY created_at DESC LIMIT 10`, [req.params.id]
    );
    res.json({ patient, allergies, medications, diagnoses, appointments, records, files, invoices, treatmentPlans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/patients - create patient
router.post('/', auth, roles('admin', 'receptionist', 'doctor'), async (req, res) => {
  const {
    first_name, last_name, birth_date, gender, phone, phone2, email,
    address, city, postal_code, country, insurance_number, insurance_company,
    emergency_contact_name, emergency_contact_phone, blood_type, notes, warning_flags
  } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO mds_patients (first_name, last_name, birth_date, gender, phone, phone2, email,
         address, city, postal_code, country, insurance_number, insurance_company,
         emergency_contact_name, emergency_contact_phone, blood_type, notes, warning_flags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, birth_date || null, gender || null, phone || null, phone2 || null,
       email || null, address || null, city || null, postal_code || null, country || 'Slovakia',
       insurance_number || null, insurance_company || null, emergency_contact_name || null,
       emergency_contact_phone || null, blood_type || 'unknown', notes || null,
       warning_flags || null, req.user.id]
    );
    await Log.create(req.user.id, 'CREATE', 'patient', result.insertId, { name: `${first_name} ${last_name}` }, req.ip);
    const [[created]] = await db.query('SELECT * FROM mds_patients WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/patients/:id - update patient
router.put('/:id', auth, roles('admin', 'receptionist', 'doctor'), async (req, res) => {
  const allowed = [
    'first_name', 'last_name', 'birth_date', 'gender', 'phone', 'phone2', 'email',
    'address', 'city', 'postal_code', 'country', 'insurance_number', 'insurance_company',
    'emergency_contact_name', 'emergency_contact_phone', 'blood_type', 'notes', 'warning_flags', 'active'
  ];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields to update' });
  try {
    const sets = fields.map(f => `${f} = ?`).join(', ');
    const values = [...fields.map(f => req.body[f]), req.params.id];
    await db.query(`UPDATE mds_patients SET ${sets} WHERE id = ?`, values);
    await Log.create(req.user.id, 'UPDATE', 'patient', req.params.id, fields, req.ip);
    const [[updated]] = await db.query('SELECT * FROM mds_patients WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/patients/:id (soft delete)
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await db.query('UPDATE mds_patients SET active = 0 WHERE id = ?', [req.params.id]);
    await Log.create(req.user.id, 'DELETE', 'patient', req.params.id, null, req.ip);
    res.json({ message: 'Patient deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Allergies ---
router.get('/:id/allergies', auth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM mds_allergies WHERE patient_id = ? ORDER BY severity DESC', [req.params.id]);
  res.json(rows);
});
router.post('/:id/allergies', auth, roles('admin', 'doctor'), async (req, res) => {
  const { name, severity, reaction, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Allergy name required' });
  const [r] = await db.query('INSERT INTO mds_allergies (patient_id, name, severity, reaction, notes) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, name, severity || 'unknown', reaction || null, notes || null]);
  const [[row]] = await db.query('SELECT * FROM mds_allergies WHERE id = ?', [r.insertId]);
  res.status(201).json(row);
});
router.delete('/:id/allergies/:aid', auth, roles('admin', 'doctor'), async (req, res) => {
  await db.query('DELETE FROM mds_allergies WHERE id = ? AND patient_id = ?', [req.params.aid, req.params.id]);
  res.json({ message: 'Deleted' });
});

// --- Medications ---
router.get('/:id/medications', auth, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM mds_medications WHERE patient_id = ? ORDER BY active DESC, name', [req.params.id]);
  res.json(rows);
});
router.post('/:id/medications', auth, roles('admin', 'doctor'), async (req, res) => {
  const { name, dosage, frequency, prescribed_by, start_date, end_date, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Medication name required' });
  const [r] = await db.query(
    'INSERT INTO mds_medications (patient_id, name, dosage, frequency, prescribed_by, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.params.id, name, dosage || null, frequency || null, prescribed_by || null, start_date || null, end_date || null, notes || null]
  );
  const [[row]] = await db.query('SELECT * FROM mds_medications WHERE id = ?', [r.insertId]);
  res.status(201).json(row);
});
router.delete('/:id/medications/:mid', auth, roles('admin', 'doctor'), async (req, res) => {
  await db.query('DELETE FROM mds_medications WHERE id = ? AND patient_id = ?', [req.params.mid, req.params.id]);
  res.json({ message: 'Deleted' });
});

// --- Diagnoses ---
router.get('/:id/diagnoses', auth, async (req, res) => {
  const [rows] = await db.query(`SELECT d.*, u.name AS doctor_name FROM mds_diagnoses d
    LEFT JOIN mds_users u ON u.id = d.diagnosed_by WHERE d.patient_id = ? ORDER BY d.diagnosed_at DESC`, [req.params.id]);
  res.json(rows);
});
router.post('/:id/diagnoses', auth, roles('admin', 'doctor'), async (req, res) => {
  const { icd_code, description, diagnosed_at, notes } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });
  const [r] = await db.query(
    'INSERT INTO mds_diagnoses (patient_id, icd_code, description, diagnosed_by, diagnosed_at, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [req.params.id, icd_code || null, description, req.user.id, diagnosed_at || null, notes || null]
  );
  const [[row]] = await db.query('SELECT * FROM mds_diagnoses WHERE id = ?', [r.insertId]);
  res.status(201).json(row);
});

module.exports = router;
