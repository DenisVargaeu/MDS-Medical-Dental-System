const express = require('express');
const router = express.Router();
const Log = require('../models/log');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

router.get('/', auth, roles('admin'), async (req, res) => {
  try {
    const logs = await Log.list(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
