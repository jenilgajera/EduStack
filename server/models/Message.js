const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sender: { type: String, required: true }, // "username (fullName)"
    targetUserId: { type: mongoose.Schema.Types.ObjectId, default: null }, // For personal messages
    text: { type: String, required: true },
    type: { type: String, enum: ["community", "personal"], required: true },
    userType: { type: String, enum: ["student", "instructor", "admin"], required: true },
    timestamp: { type: Date, default: Date.now, index: { expires: "24h" } }, // TTL: 24 hours
  },
  { timestamps: true }
);

// TTL index is set via the `timestamp` field with `expires: "24h"`
module.exports = mongoose.model("Message", messageSchema);