// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const CourseController = require("../controllers/CourseController");
const UserController = require("../controllers/UserController");
const RAGService = require("../services/RAGService");
const {authMiddleware} = require("../middleware/auth");
const { instructorAuth } = require("../middleware/auth");

const adminMiddleware = async (req, res, next) => {
  if (req.user.userType !== "admin" && req.user.email !== "admin@example.com") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  next();
};
router.get("/courses", authMiddleware, adminMiddleware, CourseController.getAllCoursesforadmin);
router.put("/courses/:id", authMiddleware, adminMiddleware, CourseController.updateCourseforadmin);
router.delete("/courses/:id", authMiddleware, adminMiddleware, CourseController.deleteCourseAdmin);
router.get("/students", authMiddleware, adminMiddleware, CourseController.getAllStudents);
router.get("/instructors", authMiddleware, adminMiddleware, CourseController.getAllInstructors);
router.put("/users/block/:userId", authMiddleware, adminMiddleware, UserController.blockUser);
router.put("/users/unblock/:userId", authMiddleware, adminMiddleware, UserController.unblockUser);

// RAG System Routes for Admin
router.post("/rag/embed-course/:courseId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await RAGService.embedCourse(courseId);
    res.json({ status: true, message: "Course embedded successfully", result });
  } catch (error) {
    console.error("Error embedding course:", error);
    res.status(500).json({ status: false, message: "Failed to embed course", error: error.message });
  }
});

router.post("/rag/embed-all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await RAGService.embedAllCourses();
    res.json({ status: true, message: "All courses embedded successfully", result });
  } catch (error) {
    console.error("Error embedding all courses:", error);
    res.status(500).json({ status: false, message: "Failed to embed courses", error: error.message });
  }
});

module.exports = router;