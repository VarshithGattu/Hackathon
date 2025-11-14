const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  phone: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
