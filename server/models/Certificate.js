const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true }, // e.g., "BB-A1B2C3D4"
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  instructorName: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  filePath: { type: String, required: true }, // Path to PDF
});

module.exports = mongoose.model("Certificate", certificateSchema);
