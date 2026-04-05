const express = require('express');
const router = express.Router();
const Inventory = require('../models/inventory');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

router.get('/', auth, async (req, res) => {
  try {
    const items = await Inventory.list();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, roles('admin'), async (req, res) => {
  try {
    const id = await Inventory.create(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await Inventory.update(req.params.id, req.body);
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/stock', auth, async (req, res) => {
  try {
    await Inventory.updateStock(req.params.id, req.body.delta);
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    await Inventory.delete(req.params.id);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
