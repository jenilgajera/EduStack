// server/models/Course.js
const mongoose = require("mongoose");

const liveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  sessionId: { 
    type: String, 
    required: true,
    default: () => `SESSION-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  isLive: { type: Boolean, default: false },
  meetingUri: { type: String, default: null }, // Optional Zoom-like link
})

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    courseId: { 
      type: String, 
      unique: true, 
      required: true,
      default: () => `Course${Math.floor(100 + Math.random() * 900)}`
    },
    isFree: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    students: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        name: String,
        grade: String,
        completedSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "sessions" }],
        attendance: [
          {
            sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "sessions" },
            present: { type: Boolean, default: false },
          },
        ],
      },
    ],
    liveSessions: [liveSessionSchema],
    sessions: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: String,
        url: String,
        category: { type: String, default: "Uncategorized" },
      },
    ],
    quizzes: [
      {
        title: { type: String, required: true },
        timeLimit: { type: Number, default: 20 },
        questions: [
          { question: String, options: [String], correctAnswer: String },
        ],
      },
    ],
    assignments: [
      {
        title: String,
        description: String,
        dueDate: String,
        submissions: [{ studentId: String, fileUrl: String }],
      },
    ],
    blockedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    description: String,
    duration: String,
    durationHours: Number,
    lessons: Number,
    highlight: String,
    category: String,
    price: Number,
    syllabus: String,
    quizScores: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        quizId: { type: mongoose.Schema.Types.ObjectId },
        score: Number,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);