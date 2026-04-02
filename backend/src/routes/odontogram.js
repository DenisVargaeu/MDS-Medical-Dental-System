const express = require('express');
const router = express.Router();
const Odontogram = require('../models/odontogram');
const auth = require('../middleware/auth');

router.get('/:patientId', auth, async (req, res) => {
  try {
    const data = await Odontogram.getByPatient(req.params.patientId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:patientId', auth, async (req, res) => {
  try {
    const { toothNumber, state, notes } = req.body;
    await Odontogram.saveTooth(req.params.patientId, toothNumber, state, notes);
    res.json({ message: 'Tooth saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
