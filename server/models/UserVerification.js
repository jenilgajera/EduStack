const mongoose = require('mongoose');

const userVerificationSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  userType: { type: String, enum: ['student', 'instructor'], required: true },
  otp: { type: String, required: true },
  otpAttempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 minutes
});

module.exports = mongoose.model('UserVerification', userVerificationSchema);