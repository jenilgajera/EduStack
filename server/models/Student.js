const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
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
  isBlocked: { type: Boolean, default: false },
  status: { type: String, default: "offline" },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);