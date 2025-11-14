const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicineSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: String,
  dosage: String,
  schedule: [String], // times like "09:00"
  startDate: Date,
  endDate: Date,
  repeatPattern: String,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema);
