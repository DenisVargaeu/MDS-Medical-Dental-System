const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM mds_notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const [[{ unread }]] = await db.query(
      `SELECT COUNT(*) AS unread FROM mds_notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
      [req.user.id]
    );
    res.json({ data: rows, unread });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  await db.query('UPDATE mds_notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Marked as read' });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, async (req, res) => {
  await db.query('UPDATE mds_notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL', [req.user.id]);
  res.json({ message: 'All marked as read' });
});

module.exports = router;
