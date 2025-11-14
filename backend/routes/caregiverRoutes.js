const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const Caregiver = require('../models/Caregiver');
const User = require('../models/User');

router.post('/link', auth, async (req, res) => {
  const { caregiverEmail } = req.body;
  const caregiverUser = await User.findOne({ email: caregiverEmail });
  if (!caregiverUser) return res.status(404).json({ error: 'Caregiver not found' });
  const link = await Caregiver.create({ userId: req.userId, caregiverUserId: caregiverUser._id, linkedAt: new Date() });
  res.json(link);
});

router.get('/patients', auth, async (req, res) => {
  const links = await Caregiver.find({ caregiverUserId: req.userId }).populate('userId');
  res.json(links);
});

module.exports = router;
