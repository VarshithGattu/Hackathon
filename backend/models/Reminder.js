const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReminderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine' },
  scheduledTime: Date,
  status: { type: String, enum: ['Pending','Taken','Missed','Snoozed'], default: 'Pending' },
  actionTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Reminder', ReminderSchema);
