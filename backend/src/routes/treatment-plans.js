const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Log = require('../models/log');

// GET /api/treatment-plans - list treatment plans
router.get('/', auth, async (req, res) => {
  const { patientId, status } = req.query;
  let query = `SELECT tp.*, pa.first_name AS patient_first_name, pa.last_name AS patient_last_name,
                      u.name AS doctor_name, u.surname AS doctor_surname
               FROM mds_treatment_plans tp
               JOIN mds_patients pa ON pa.id = tp.patient_id
               JOIN mds_users u ON u.id = tp.doctor_id
               WHERE 1=1`;
  const params = [];

  if (patientId && patientId !== 'null') { query += ' AND tp.patient_id = ?'; params.push(patientId); }
  if (status) { query += ' AND tp.status = ?'; params.push(status); }

  query += ' ORDER BY tp.created_at DESC';

  try {
    const [rows] = await db.query(query, params);
    
    // For each plan, get its items
    for (const plan of rows) {
      const [items] = await db.query(
        `SELECT tpi.*, t.name AS treatment_name, t.price AS treatment_price
         FROM mds_treatment_plan_items tpi
         JOIN mds_treatments t ON t.id = tpi.treatment_id
         WHERE tpi.plan_id = ?
         ORDER BY tpi.phase_number, tpi.id`, [plan.id]
      );
      plan.items = items;
    }

    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/treatment-plans/:id - single treatment plan
router.get('/:id', auth, async (req, res) => {
  try {
    const [[plan]] = await db.query(
      `SELECT tp.*, pa.first_name AS patient_first_name, pa.last_name AS patient_last_name,
               u.name AS doctor_name, u.surname AS doctor_surname
       FROM mds_treatment_plans tp
       JOIN mds_patients pa ON pa.id = tp.patient_id
       JOIN mds_users u ON u.id = tp.doctor_id
       WHERE tp.id = ?`, [req.params.id]
    );
    if (!plan) return res.status(404).json({ error: 'Treatment plan not found' });

    const [items] = await db.query(
      `SELECT tpi.*, t.name AS treatment_name, t.price AS treatment_price
       FROM mds_treatment_plan_items tpi
       JOIN mds_treatments t ON t.id = tpi.treatment_id
       WHERE tpi.plan_id = ?
       ORDER BY tpi.phase_number, tpi.id`, [plan.id]
    );
    plan.items = items;

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/treatment-plans - create treatment plan
router.post('/', auth, roles('admin', 'doctor'), async (req, res) => {
  const { patient_id, title, description, items } = req.body;

  if (!patient_id || !title || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Patient ID, title and items are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [tpResult] = await conn.query(
      `INSERT INTO mds_treatment_plans (patient_id, doctor_id, title, description, status)
       VALUES (?, ?, ?, ?, 'draft')`,
      [patient_id, req.user.id, title, description || null]
    );
    const plan_id = tpResult.insertId;

    let totalEstimated = 0;
    for (const item of items) {
      const [treatment] = await conn.query('SELECT price FROM mds_treatments WHERE id = ?', [item.treatment_id]);
      if (treatment.length > 0) {
        totalEstimated += parseFloat(treatment[0].price);
      }

      await conn.query(
        `INSERT INTO mds_treatment_plan_items (plan_id, treatment_id, phase_number, tooth_number, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [plan_id, item.treatment_id, item.phase_number || 1, item.tooth_number || null, item.notes || null]
      );
    }

    await conn.query('UPDATE mds_treatment_plans SET total_estimated_cost = ? WHERE id = ?', [totalEstimated, plan_id]);

    await conn.commit();
    await Log.create(req.user.id, 'CREATE', 'treatment_plan', plan_id, { patient_id }, req.ip);
    
    const [[created]] = await db.query('SELECT * FROM mds_treatment_plans WHERE id = ?', [plan_id]);
    res.status(201).json(created);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

// PATCH /api/treatment-plans/:id/status - update status
router.patch('/:id/status', auth, roles('admin', 'doctor'), async (req, res) => {
  const { status } = req.body;
  if (!['draft', 'active', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.query('UPDATE mds_treatment_plans SET status = ? WHERE id = ?', [status, req.params.id]);
    await Log.create(req.user.id, 'UPDATE_STATUS', 'treatment_plan', req.params.id, { status }, req.ip);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/treatment-plans/:id/items/:itemId/status - update item status with payment flow
router.patch('/:id/items/:itemId/status', auth, roles('admin', 'doctor'), async (req, res) => {
  const { status, payment_action } = req.body;
  
  if (!['pending', 'completed', 'skipped'].includes(status)) {
    return res.status(400).json({ error: 'Invalid item status' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Update the item status
    await conn.query(
      'UPDATE mds_treatment_plan_items SET status = ?, payment_status = ? WHERE id = ? AND plan_id = ?',
      [status, status === 'skipped' ? 'waived' : 'unpaid', req.params.itemId, req.params.id]
    );

    // 2. Handle Payment Flow (Pay Now)
    if (status === 'completed' && payment_action === 'pay_now') {
      // Get item and plan info
      const [[item]] = await conn.query(
        `SELECT tpi.*, t.name AS treatment_name, t.price AS treatment_price, tp.patient_id, tp.doctor_id
         FROM mds_treatment_plan_items tpi
         JOIN mds_treatments t ON t.id = tpi.treatment_id
         JOIN mds_treatment_plans tp ON tp.id = tpi.plan_id
         WHERE tpi.id = ?`, [req.params.itemId]
      );

      // A. Create/Get Medical Record for today
      let [[record]] = await conn.query(
        'SELECT id FROM mds_medical_records WHERE patient_id = ? AND visit_date = CURDATE() LIMIT 1',
        [item.patient_id]
      );
      
      let record_id;
      if (!record) {
        const [rResult] = await conn.query(
          `INSERT INTO mds_medical_records (patient_id, doctor_id, visit_date, chief_complaint, clinical_findings)
           VALUES (?, ?, CURDATE(), 'Treatment from plan', 'Scheduled treatment performed')`,
          [item.patient_id, item.doctor_id]
        );
        record_id = rResult.insertId;
      } else {
        record_id = record.id;
      }

      // B. Add Treatment to Record
      const [ptResult] = await conn.query(
        `INSERT INTO mds_patient_treatments (record_id, patient_id, treatment_id, tooth_number, unit_price, total_price, performed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [record_id, item.patient_id, item.treatment_id, item.tooth_number, item.treatment_price, item.treatment_price, item.doctor_id]
      );
      const treatment_row_id = ptResult.insertId;

      // C. Generate Invoice
      const invNum = `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;
      const [iResult] = await conn.query(
        `INSERT INTO mds_invoices (invoice_number, patient_id, record_id, subtotal, total, status, issue_date, created_by)
         VALUES (?, ?, ?, ?, ?, 'issued', CURDATE(), ?)`,
        [invNum, item.patient_id, record_id, item.treatment_price, item.treatment_price, item.doctor_id]
      );
      const invoice_id = iResult.insertId;

      // D. Link Treatment Item to Invoice
      await conn.query('UPDATE mds_patient_treatments SET invoice_id = ? WHERE id = ?', [invoice_id, treatment_row_id]);

      // E. Link Plan Item to Invoice
      await conn.query(
        'UPDATE mds_treatment_plan_items SET invoice_id = ?, payment_status = "unpaid" WHERE id = ?',
        [invoice_id, req.params.itemId]
      );
    }

    await conn.commit();
    res.json({ message: 'Item status and payment flow updated' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
