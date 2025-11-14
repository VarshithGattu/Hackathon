const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const Reminder = require('../models/Reminder');

router.get('/today', auth, async (req, res) => {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  const reminders = await Reminder.find({ userId: req.userId, scheduledTime: { $gte: start, $lte: end } }).populate('medicineId');
  res.json(reminders);
});

router.put('/:id/mark', auth, async (req, res) => {
  const { status } = req.body;
  await Reminder.updateOne({ _id: req.params.id, userId: req.userId }, { status, actionTime: new Date() });
  res.json({ message: 'Marked' });
});

router.put('/:id/snooze', auth, async (req, res) => {
  const minutes = parseInt(req.body.minutes || 10);
  const rem = await Reminder.findOne({ _id: req.params.id, userId: req.userId });
  if (!rem) return res.status(404).json({ error: 'Not found' });
  rem.status = 'Snoozed';
  rem.scheduledTime = new Date(Date.now() + minutes*60000);
  rem.actionTime = new Date();
  await rem.save();
  res.json(rem);
});

router.get('/history', auth, async (req, res) => {
  const from = new Date(req.query.from || 0);
  const to = new Date(req.query.to || Date.now());
  const logs = await Reminder.find({ userId: req.userId, scheduledTime: { $gte: from, $lte: to } }).populate('medicineId');
  res.json(logs);
});

module.exports = router;
