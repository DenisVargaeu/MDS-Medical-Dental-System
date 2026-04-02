const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Generate invoice number
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `INV-${year}${month}-${rand}`;
}

// GET /api/finance/invoices
router.get('/invoices', auth, async (req, res) => {
  const { patient_id, status, from, to, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];
  if (patient_id) { conditions.push('i.patient_id = ?'); params.push(patient_id); }
  if (status) { conditions.push('i.status = ?'); params.push(status); }
  if (from) { conditions.push('i.issue_date >= ?'); params.push(from); }
  if (to) { conditions.push('i.issue_date <= ?'); params.push(to); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const [rows] = await db.query(
      `SELECT i.*, p.first_name, p.last_name, p.phone AS patient_phone
       FROM mds_invoices i
       JOIN mds_patients p ON p.id = i.patient_id
       ${where}
       ORDER BY i.issue_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM mds_invoices i ${where}`, params
    );
    const [[stats]] = await db.query(
      `SELECT 
         SUM(total) AS total_revenue,
         SUM(paid_amount) AS total_paid,
         SUM(total - paid_amount) AS total_outstanding,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
         COUNT(CASE WHEN status IN ('issued','partial') THEN 1 END) AS pending_count
       FROM mds_invoices i ${where}`, params
    );
    res.json({ data: rows, total, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/finance/invoices/:id
router.get('/invoices/:id', auth, async (req, res) => {
  try {
    const [[invoice]] = await db.query(
      `SELECT i.*, p.first_name, p.last_name, p.phone, p.email, p.address
       FROM mds_invoices i JOIN mds_patients p ON p.id = i.patient_id
       WHERE i.id = ?`, [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const [items] = await db.query(
      `SELECT pt.*, t.name AS treatment_name, t.category
       FROM mds_patient_treatments pt JOIN mds_treatments t ON t.id = pt.treatment_id
       WHERE pt.record_id = ?`, [invoice.record_id]
    );
    res.json({ invoice, items });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/finance/invoices
router.post('/invoices', auth, roles('admin', 'receptionist', 'doctor'), async (req, res) => {
  const { patient_id, record_id, discount_percent, due_date, notes, payment_method } = req.body;
  if (!patient_id) return res.status(400).json({ error: 'patient_id required' });

  try {
    // Calculate total from treatments on the record
    let total = 0;
    if (record_id) {
      const [[sum]] = await db.query(
        'SELECT COALESCE(SUM(total_price), 0) AS total FROM mds_patient_treatments WHERE record_id = ?',
        [record_id]
      );
      total = parseFloat(sum.total);
    }
    const discountPct = parseFloat(discount_percent) || 0;
    const discountAmt = total * (discountPct / 100);
    const finalTotal = total - discountAmt;
    const invoiceNumber = generateInvoiceNumber();

    const [result] = await db.query(
      `INSERT INTO mds_invoices (invoice_number, patient_id, record_id, subtotal, discount_percent, discount_amount, total, status, issue_date, due_date, notes, payment_method, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', CURDATE(), ?, ?, ?, ?)`,
      [invoiceNumber, patient_id, record_id || null, total, discountPct, discountAmt, finalTotal, due_date || null, notes || null, payment_method || null, req.user.id]
    );
    const [[created]] = await db.query('SELECT * FROM mds_invoices WHERE id = ?', [result.insertId]);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/finance/invoices/:id/pay - record payment
router.patch('/invoices/:id/pay', auth, roles('admin', 'receptionist'), async (req, res) => {
  const { amount, payment_method } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount required' });
  try {
    const [[inv]] = await db.query('SELECT * FROM mds_invoices WHERE id = ?', [req.params.id]);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const newPaid = parseFloat(inv.paid_amount) + parseFloat(amount);
    const newStatus = newPaid >= parseFloat(inv.total) ? 'paid' : 'partial';
    await db.query(
      `UPDATE mds_invoices SET paid_amount = ?, status = ?, payment_method = ?, paid_date = IF(? = 'paid', CURDATE(), paid_date) WHERE id = ?`,
      [newPaid, newStatus, payment_method || inv.payment_method, newStatus, req.params.id]
    );
    const [[updated]] = await db.query('SELECT * FROM mds_invoices WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/finance/stats - summary stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [monthlyRevenue] = await db.query(
      `SELECT DATE_FORMAT(issue_date, '%Y-%m') AS month, SUM(paid_amount) AS revenue, COUNT(*) AS invoice_count
       FROM mds_invoices WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );
    const [[totals]] = await db.query(
      `SELECT SUM(total) AS total_billed, SUM(paid_amount) AS total_collected,
              SUM(total - paid_amount) AS total_outstanding
       FROM mds_invoices WHERE status != 'cancelled'`
    );
    res.json({ monthlyRevenue, totals });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
