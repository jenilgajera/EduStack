const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date },
  isBlocked: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Instructor', instructorSchema);


