const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const [[patients]] = await db.query('SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS new_this_month FROM mds_patients WHERE active = 1');
    const [[todayAppts]] = await db.query(`SELECT COUNT(*) AS total, COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed, COUNT(CASE WHEN status = 'scheduled' OR status = 'confirmed' THEN 1 END) AS upcoming, COUNT(CASE WHEN status = 'cancelled' OR status = 'no_show' THEN 1 END) AS missed FROM mds_appointments WHERE date = CURDATE()`);
    const [[revenue]] = await db.query(`SELECT COALESCE(SUM(paid_amount), 0) AS today FROM mds_invoices WHERE DATE(paid_date) = CURDATE()`);
    const [[monthRevenue]] = await db.query(`SELECT COALESCE(SUM(paid_amount), 0) AS this_month FROM mds_invoices WHERE MONTH(paid_date) = MONTH(CURDATE()) AND YEAR(paid_date) = YEAR(CURDATE())`);
    const [todayList] = await db.query(`SELECT a.id, a.time, a.duration_minutes, a.status, a.type, a.notes, p.first_name, p.last_name, p.phone AS patient_phone, p.warning_flags, u.name AS doctor_name FROM mds_appointments a JOIN mds_patients p ON p.id = a.patient_id JOIN mds_users u ON u.id = a.doctor_id WHERE a.date = CURDATE() ORDER BY a.time`);
    const [recentPatients] = await db.query(`SELECT id, first_name, last_name, phone, created_at FROM mds_patients WHERE active = 1 ORDER BY created_at DESC LIMIT 5`);
    const [unreadNotifs] = await db.query(`SELECT * FROM mds_notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0 ORDER BY created_at DESC LIMIT 10`, [req.user.id]);
    const [outstanding] = await db.query(`SELECT i.id, i.invoice_number, i.total, i.paid_amount, i.balance, i.status, i.due_date, p.first_name, p.last_name FROM mds_invoices i JOIN mds_patients p ON p.id = i.patient_id WHERE i.status IN ('issued','partial','overdue') ORDER BY i.due_date ASC LIMIT 5`);
    const [weeklyAppts] = await db.query(`SELECT DATE(date) AS day, COUNT(*) AS count FROM mds_appointments WHERE date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY) GROUP BY day ORDER BY day`);
    const [monthlyRevChart] = await db.query(`SELECT DATE_FORMAT(paid_date, '%Y-%m') AS month, SUM(paid_amount) AS revenue FROM mds_invoices WHERE paid_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY month ORDER BY month`);

    res.json({
      patients,
      appointments: todayAppts,
      revenue: { today: revenue.today, this_month: monthRevenue.this_month },
      todayList,
      recentPatients,
      notifications: unreadNotifs,
      outstanding,
      weeklyAppts,
      monthlyRevChart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = router;
