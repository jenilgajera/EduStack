const express = require("express");
const router = express.Router();
const CourseController = require("../controllers/CourseController");
const { createMeeting } = require('../controllers/meetController');
const { instructorAuth, studentAuth ,chatAuth } = require("../middleware/auth");
const Course = require("../models/Course");

router.get("/public", CourseController.getPublicCourses);

// Test endpoint to create sample public courses
router.get("/test/create-sample-courses", async (req, res) => {
  try {
    // Get first available instructor
    const Instructor = require("../models/Instructor");
    const instructor = await Instructor.findOne();
    
    if (!instructor) {
      return res.status(400).json({ 
        message: "No instructor found in database. Please create an instructor account first.",
        hint: "Register as an instructor or seed instructor data"
      });
    }
    
    const instructorId = instructor._id;
    console.log("Using instructor ID:", instructorId);
    
    const sampleCourses = [
      {
        name: "Introduction to Web Development",
        description: "Learn the basics of HTML, CSS, and JavaScript. Build your first website from scratch.",
        category: "Web Dev",
        isFree: true,
        isPublic: true,
        duration: "8 weeks",
        lessons: 24,
        highlight: "Build your first website",
        instructor: instructorId,
        sessions: [
          { name: "HTML Basics", url: "/uploads/sample/html-basics.mp4", category: "HTML" },
          { name: "CSS Fundamentals", url: "/uploads/sample/css-fundamentals.mp4", category: "CSS" },
        ],
        liveSessions: [
          { title: "Week 1 Q&A", date: "2026-02-20", time: "10:00 AM", sessionId: `SESSION-TEST-${Date.now().toString().slice(-6)}`, isLive: false }
        ]
      },
      {
        name: "React for Beginners",
        description: "Master React.js from scratch. Build 3 real projects.",
        category: "Web Dev",
        isFree: false,
        price: 49,
        isPublic: true,
        duration: "6 weeks",
        lessons: 18,
        highlight: "Build 3 real projects",
        instructor: instructorId,
        sessions: [
          { name: "React Setup", url: "/uploads/sample/react-setup.mp4", category: "React" },
        ]
      },
      {
        name: "Data Science Fundamentals",
        description: "Introduction to data analysis with Python. Analyze real datasets.",
        category: "Data Science",
        isFree: true,
        isPublic: true,
        duration: "10 weeks",
        lessons: 30,
        highlight: "Analyze real datasets",
        instructor: instructorId,
        sessions: []
      }
    ];
    
    const createdCourses = await Course.insertMany(sampleCourses);
    console.log("Sample courses created:", createdCourses.length);
    res.json({ message: "Sample courses created successfully", courses: createdCourses });
  } catch (error) {
    console.error("Error creating sample courses:", error);
    res.status(500).json({ message: "Error creating sample courses", error: error.message });
  }
});

// Get all instructors for testing
router.get("/test/instructors", async (req, res) => {
  try {
    const Instructor = require("../models/Instructor");
    const instructors = await Instructor.find().select("username email firstName lastName _id");
    res.json(instructors);
  } catch (error) {
    console.error("Error fetching instructors:", error);
    res.status(500).json({ message: "Error fetching instructors", error: error.message });
  }
});

router.get("/enrolled", studentAuth, CourseController.getEnrolledCourses);
router.get("/", instructorAuth, CourseController.getAllCourses);
router.get("/:id", CourseController.getCourse);
router.post("/", instructorAuth, CourseController.createCourse);
router.put("/:id", instructorAuth, CourseController.updateCourse);
router.delete("/:id", instructorAuth, CourseController.deleteCourse);
router.post("/:id/sessions", instructorAuth, CourseController.upload, CourseController.addSession);
router.put('/:id/block-student/:studentId', instructorAuth, CourseController.blockStudent);
router.put('/:id/unblock-student/:studentId', instructorAuth, CourseController.unblockStudent);
router.get('/:courseId/quizzes/:quizId', studentAuth, CourseController.getQuizForStudent);
router.post('/:courseId/quizzes/:quizId/submit', studentAuth, CourseController.submitQuiz);
router.delete("/:id", instructorAuth, CourseController.deleteCourse);
// Move this route up to avoid overlap with less specific routes
router.put('/courses/:courseId/sessions/:sessionId/:studentId', studentAuth, CourseController.updateSessionCompletion);
router.get('/courses/:courseId/certificate/:studentId', studentAuth, CourseController.generateCertificate);
router.get('/courses/verify/:certificateId', CourseController.verifyCertificate); // New verification route
router.post('/courses/:courseId/live-sessions', createMeeting);
router.put('/:courseId/sessions/:sessionId/students/:studentId/complete', studentAuth, CourseController.updateSessionCompletion); // Remove or adjust if duplicate
router.get('/:courseId/attendance/:sessionId', instructorAuth, CourseController.getAttendance);
router.put('/:courseId/attendance/:sessionId', studentAuth, CourseController.markAttendance);
router.post('/markAttendance/:courseId/:sessionId', studentAuth, CourseController.markAttendance); // Consider removing if redundant
router.delete("/:id/sessions/:sessionId", instructorAuth, CourseController.deleteSession);
router.post("/:courseId/live-sessions", instructorAuth, CourseController.scheduleLiveSession);
router.put("/:courseId/live-sessions/:sessionId/start", instructorAuth, CourseController.startLiveSession);
router.put("/:courseId/live-sessions/:sessionId/end", instructorAuth, CourseController.endLiveSession);
router.delete("/:courseId/live-sessions/:sessionId", instructorAuth, CourseController.deleteLiveSession);
router.get("/live-session/:sessionId", CourseController.getCourseBySessionId); // No auth required for joining

// Chat-related endpoint
router.get("/:courseId/classmates", chatAuth, CourseController.getClassmates);

router.get("/:courseId/messages", chatAuth, CourseController.getMessages);


router.post("/:id/quizzes", instructorAuth, CourseController.addQuiz);
router.put("/:id/quizzes/:quizId/questions", instructorAuth, CourseController.addQuestionToQuiz);
router.delete("/:id/quizzes/:quizId", instructorAuth, CourseController.deleteQuiz);
router.post("/:id/assignments", instructorAuth, CourseController.addAssignment);
router.delete("/:id/assignments/:assignmentId", instructorAuth, CourseController.deleteAssignment);
router.post("/:id/enroll", studentAuth, CourseController.enrollStudent);
router.get("/:id/sessions/:sessionId", studentAuth, CourseController.getRecordedSession);



router.get("/courses/paid/:courseId", async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId).populate("instructor");
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (course.isFree) return res.status(400).json({ message: "This is not a paid course" });
  
      // Return course details without enrollment check
      res.json({
        _id: course._id,
        name: course.name,
        description: course.description,
        instructor: course.instructor,
        isFree: course.isFree,
        price: course.price,
        students: course.students, // Include for frontend enrollment check
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  router.post("/courses/paid/:courseId/enroll", studentAuth, async (req, res) => {
    try {
      const { paymentId } = req.body;
      if (!paymentId) return res.status(400).json({ message: "Payment ID required" });
  
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (course.isFree) return res.status(400).json({ message: "This is not a paid course" });
  
      const studentId = req.user.id; // Assuming auth middleware
      if (course.students.some((s) => (s?.studentId || s)?.toString() === studentId)) {
        return res.status(400).json({ message: "Already enrolled" });
      }

      const Student = require("../models/Student");
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      // Simulate payment verification (replace with real payment gateway check)
      const paymentVerified = paymentId.startsWith("PAY-"); // Placeholder
      if (!paymentVerified) return res.status(400).json({ message: "Invalid payment" });
  
      course.students.push({
        studentId,
        name: `${student.firstName} ${student.lastName}`.trim(),
        grade: "N/A",
      });
      await course.save();
      res.json({ message: "Enrolled successfully after payment" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });



module.exports = router;
