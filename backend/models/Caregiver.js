const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CaregiverSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' }, // patient
  caregiverUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  linkedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Caregiver', CaregiverSchema);
