const express = require("express");
const router = express.Router();
const StudentController = require("../controllers/StudentController");
const { studentAuth } = require("../middleware/auth");

router.post("/chatbot", studentAuth, StudentController.handleChatbot);
router.get("/profile", studentAuth, StudentController.getProfile);

module.exports = router;