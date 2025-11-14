const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const Medicine = require('../models/Medicine');

router.post('/', auth, async (req, res) => {
  const med = new Medicine({ userId: req.userId, ...req.body });
  await med.save();
  res.json(med);
});

router.get('/', auth, async (req, res) => {
  const meds = await Medicine.find({ userId: req.userId });
  res.json(meds);
});

router.put('/:id', auth, async (req, res) => {
  await Medicine.updateOne({ _id: req.params.id, userId: req.userId }, req.body);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, async (req, res) => {
  await Medicine.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ message: 'Deleted' });
});

module.exports = router;
