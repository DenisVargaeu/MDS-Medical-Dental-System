const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// GET /api/settings/:key - Fetch a system setting
router.get('/:key', auth, async (req, res) => {
  try {
    const [[setting]] = await db.query('SELECT setting_value FROM mds_settings WHERE setting_key = ?', [req.params.key]);
    if (!setting) return res.json({ value: null });
    
    // Attempt to parse JSON if it's a template, otherwise return as string
    let val = setting.setting_value;
    try { val = JSON.parse(val); } catch (e) {}
    
    res.json({ value: val });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings/:key - Update a system setting (Admin only)
router.put('/:key', auth, roles('admin'), async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Value required' });

  try {
    const valStr = typeof value === 'string' ? value : JSON.stringify(value);
    await db.query(
      'INSERT INTO mds_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [req.params.key, valStr, valStr]
    );
    res.json({ message: 'Setting updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
