const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/appointments - list with filters
router.get('/', auth, async (req, res) => {
  const { doctor_id, patient_id, date, from, to, status, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];

  if (doctor_id) { conditions.push('a.doctor_id = ?'); params.push(doctor_id); }
  if (patient_id) { conditions.push('a.patient_id = ?'); params.push(patient_id); }
  if (status) { conditions.push('a.status = ?'); params.push(status); }
  if (date) { conditions.push('a.date = ?'); params.push(date); }
  if (from && to) { conditions.push('a.date BETWEEN ? AND ?'); params.push(from, to); }
  else if (from) { conditions.push('a.date >= ?'); params.push(from); }
  else if (to) { conditions.push('a.date <= ?'); params.push(to); }

  // Role restriction: doctors only see their appointments
  if (req.user.role === 'doctor') {
    conditions.push('a.doctor_id = ?');
    params.push(req.user.id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await db.query(
      `SELECT a.*, 
              p.first_name, p.last_name, p.phone AS patient_phone, p.warning_flags,
              u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_appointments a
       JOIN mds_patients p ON p.id = a.patient_id
       JOIN mds_users u ON u.id = a.doctor_id
       ${where}
       ORDER BY a.date, a.time
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/appointments/today
router.get('/today', auth, async (req, res) => {
  const conditions = ['DATE(a.date) = CURDATE()'];
  const params = [];
  if (req.user.role === 'doctor') { conditions.push('a.doctor_id = ?'); params.push(req.user.id); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  try {
    const [rows] = await db.query(
      `SELECT a.*, p.first_name, p.last_name, p.phone AS patient_phone, p.warning_flags, p.blood_type,
              u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_appointments a
       JOIN mds_patients p ON p.id = a.patient_id
       JOIN mds_users u ON u.id = a.doctor_id
       ${where}
       ORDER BY a.time`, params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/appointments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT a.*, p.first_name, p.last_name, p.phone AS patient_phone, p.warning_flags,
              u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_appointments a
       JOIN mds_patients p ON p.id = a.patient_id
       JOIN mds_users u ON u.id = a.doctor_id
       WHERE a.id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Appointment not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/appointments
router.post('/', auth, roles('admin', 'receptionist', 'doctor'), async (req, res) => {
  const { patient_id, doctor_id, date, time, duration_minutes, type, notes, status } = req.body;
  if (!patient_id || !doctor_id || !date || !time) {
    return res.status(400).json({ error: 'patient_id, doctor_id, date, and time are required' });
  }
  try {
    // Check for time slot conflicts
    const [conflict] = await db.query(
      `SELECT id FROM mds_appointments 
       WHERE doctor_id = ? AND date = ? AND status NOT IN ('cancelled','no_show')
         AND TIME(time) < ADDTIME(?, SEC_TO_TIME(? * 60))
         AND ADDTIME(TIME(time), SEC_TO_TIME(duration_minutes * 60)) > ?`,
      [doctor_id, date, time, duration_minutes || 30, time]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ error: 'Time slot conflict with existing appointment' });
    }

    const [result] = await db.query(
      `INSERT INTO mds_appointments (patient_id, doctor_id, date, time, duration_minutes, type, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, date, time, duration_minutes || 30, type || null, notes || null, status || 'scheduled', req.user.id]
    );

    // Create notification
    await db.query(
      `INSERT INTO mds_notifications (user_id, type, title, message, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [doctor_id, 'appointment', 'New Appointment', `New appointment scheduled for ${date} at ${time}`, 'appointment', result.insertId]
    );

    const [[created]] = await db.query(
      `SELECT a.*, p.first_name, p.last_name FROM mds_appointments a
       JOIN mds_patients p ON p.id = a.patient_id WHERE a.id = ?`, [result.insertId]
    );
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', auth, roles('admin', 'receptionist', 'doctor'), async (req, res) => {
  const allowed = ['patient_id', 'doctor_id', 'date', 'time', 'duration_minutes', 'status', 'type', 'notes', 'cancellation_reason'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });
  try {
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await db.query(`UPDATE mds_appointments SET ${sets} WHERE id = ?`, [...fields.map(f => req.body[f]), req.params.id]);
    const [[updated]] = await db.query(
      `SELECT a.*, p.first_name, p.last_name FROM mds_appointments a
       JOIN mds_patients p ON p.id = a.patient_id WHERE a.id = ?`, [req.params.id]
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', auth, roles('admin', 'receptionist'), async (req, res) => {
  try {
    await db.query('UPDATE mds_appointments SET status = "cancelled" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
