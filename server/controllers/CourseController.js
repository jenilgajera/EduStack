const mongoose = require("mongoose");
const Course = require('../models/Course');
const Student = require('../models/Student');
const Instructor = require("../models/Instructor");
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const imagekit = require('../config/imageKit');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") cb(null, true);
    else cb(new Error("Only MP4 files are allowed!"), false);
  },
  limits: { fileSize: 500 * 1024 * 1024 },
}).single("file");

class CourseController {
  static resolveStudentId(studentEntry) {
    return (
      studentEntry?.studentId?._id ||
      studentEntry?.studentId ||
      studentEntry?._id ||
      studentEntry
    );
  }

  static async getAllCourses(req, res) {
    try {
      const courses = await Course.find({ instructor: req.user.id }).populate('instructor', 'firstName lastName');
      console.log("Instructor courses fetched:", courses);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
  }

  // controllers/CourseController.js
static async getAllCoursesforadmin(req, res) {
  try {
    const courses = await Course.find().populate('instructor', 'firstName lastName _id email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
}
 
  static async getAllStudents(req, res) {
    try {
      const students = await Student.find().select("firstName lastName email isBlocked");
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Error fetching students", error: error.message });
    }
  }

  static async getAllInstructors(req, res) {
    try {
      const instructors = await Instructor.find().select("firstName lastName email isBlocked");
      res.json(instructors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching instructors", error: error.message });
    }
  }
  static async updateCourseforadmin(req, res) {
    try {
      const courseId = req.params.id;
      const updates = req.body;
  
      // Log incoming data
      console.log('Course ID:', courseId);
      console.log('Updates:', updates);
  
      // Validate courseId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
  
      const course = await Course.findByIdAndUpdate(courseId, updates, { 
        new: true, 
        runValidators: true // Enforce schema validation
      });
      if (!course) return res.status(404).json({ error: 'Course not found' });
  
      console.log('Updated Course:', course);
      res.json(course);
    } catch (error) {
      console.error('Update Error:', error.name, error.message);
      res.status(500).json({ 
        error: 'Failed to update course', 
        details: error.message 
      });
    }
  }
  static async deleteCourseAdmin(req, res) {
    try {
      // Assuming req.user.role or email check for admin
      if (!req.user || req.user.email !== 'admin@example.com') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
      }
      const course = await Course.findByIdAndDelete(req.params.id);
      if (!course) return res.status(404).json({ message: 'Course not found' });
      console.log("Admin deleted course:", course._id);
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error("Error deleting course (admin):", error);
      res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
  }
  static async getPublicCourses(req, res) {
    try {
      console.log("Fetching public courses with query: { isPublic: true }");
      
      // First try to find courses with isPublic: true
      let courses = await Course.find({ isPublic: true }).populate('instructor', 'firstName lastName email');
      
      // If no public courses found, try to find courses where isPublic is not explicitly false
      if (courses.length === 0) {
        console.log("No courses with isPublic: true found, checking for courses without explicit isPublic setting...");
        courses = await Course.find({ isPublic: { $ne: false } }).populate('instructor', 'firstName lastName email');
      }
      
      // If still no courses, return all courses (for demo purposes)
      if (courses.length === 0) {
        console.log("No courses found with isPublic filter, fetching all courses...");
        courses = await Course.find().populate('instructor', 'firstName lastName email');
      }
      
      console.log("Public courses fetched:", courses.length, "courses");
      
      // Transform instructor data if populate failed
      const transformedCourses = courses.map(course => {
        const courseObj = course.toObject();
        if (!courseObj.instructor && course.instructor) {
          courseObj.instructor = {
            firstName: "Instructor",
            lastName: "Name",
            email: "instructor@example.com"
          };
        }
        return courseObj;
      });
      
      res.json(transformedCourses);
    } catch (error) {
      console.error("Error fetching public courses:", error);
      res.status(500).json({ message: 'Error fetching public courses', error: error.message });
    }
  }

  static async getEnrolledCourses(req, res) {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId).select("firstName lastName");
      const allCourses = await Course.find().populate('instructor', 'firstName lastName');

      const courses = allCourses.filter((course) =>
        (course.students || []).some((entry) => {
          const enrolledStudentId = CourseController.resolveStudentId(entry);
          return enrolledStudentId?.toString() === studentId;
        })
      );

      // Normalize any legacy paid enrollments stored as plain student IDs
      let hasLegacyEnrollments = false;
      const normalizedCourses = courses.map((course) => {
        let courseChanged = false;
        const normalizedStudents = (course.students || []).map((entry) => {
          if (entry && typeof entry === "object" && entry.studentId) {
            return entry;
          }

          if (
            entry &&
            typeof entry === "object" &&
            entry._id &&
            !entry.studentId &&
            entry._id.toString() === studentId
          ) {
            hasLegacyEnrollments = true;
            courseChanged = true;
            return {
              studentId: entry._id,
              name: student ? `${student.firstName} ${student.lastName}`.trim() : "Student",
              grade: "N/A",
              completedSessions: entry.completedSessions || [],
              attendance: entry.attendance || [],
            };
          }

          if (entry?.toString?.() === studentId) {
            hasLegacyEnrollments = true;
            courseChanged = true;
            return {
              studentId: entry,
              name: student ? `${student.firstName} ${student.lastName}`.trim() : "Student",
              grade: "N/A",
              completedSessions: [],
              attendance: [],
            };
          }

          return entry;
        });

        if (courseChanged) {
          course.students = normalizedStudents;
        }

        return course;
      });

      if (hasLegacyEnrollments) {
        await Promise.all(
          normalizedCourses
            .filter((course) =>
              course.students.some(
                (entry) =>
                  entry &&
                  typeof entry === "object" &&
                  entry.studentId &&
                  entry.studentId.toString() === studentId
              )
            )
            .map((course) => course.save())
        );
      }

      console.log("Enrolled courses fetched for student:", studentId, courses);
      res.json(normalizedCourses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ message: 'Error fetching enrolled courses', error: error.message });
    }
  }

  static async getCourse(req, res) {
    try {
      const course = await Course.findById(req.params.id)
        .populate('instructor', 'firstName lastName')
        .populate('students.studentId', 'email');
      if (!course) return res.status(404).json({ message: 'Course not found' });
      console.log("Populated course students:", JSON.stringify(course.students, null, 2));
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
  }

  static async createCourse(req, res) {
    try {
      const newCourse = new Course({
        name: req.body.name || `New Course ${Date.now()}`,
        isFree: req.body.isFree !== undefined ? req.body.isFree : true,
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true,
        instructor: req.user.id,
        students: [],
        liveSessions: [],
        sessions: [],
        quizzes: [],
        assignments: [],
        duration: req.body.duration,
        durationHours: req.body.durationHours,
        lessons: req.body.lessons,
        highlight: req.body.highlight,
        category: req.body.category,
      });
      const savedCourse = await newCourse.save();
      console.log("Course created:", savedCourse);
      res.status(201).json(savedCourse);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: 'Error creating course', error: error.message });
    }
  }

  static async updateCourse(req, res) {
    try {
      const course = await Course.findOneAndUpdate(
        { _id: req.params.id, instructor: req.user.id },
        req.body,
        { new: true }
      );
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });
      console.log("Course updated:", course);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: 'Error updating course', error: error.message });
    }
  }

  static async deleteCourse(req, res) {
    try {
      const course = await Course.findOneAndDelete({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });
      console.log("Course deleted:", course._id);
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
  }

  // static async addSession(req, res) {
  //   try {
  //     const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
  //     if (!course) return res.status(404).json({ message: "Course not found or not authorized" });

  //     const sessionName = req.body.name && req.body.name.trim() !== "" ? req.body.name : req.file.originalname;
  //     const session = { name: sessionName, url: `/uploads/${req.user.id}/${course.courseId}/${req.file.filename}` };
  //     course.sessions.push(session);
  //     await course.save();
  //     console.log("Session added:", session);
  //     res.status(201).json(session);
  //   } catch (error) {
  //     console.error("Error adding session:", error);
  //     res.status(500).json({ message: "Error adding session", error: error.message });
  //   }
  // }

  static async addSession(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: "Course not found or not authorized" });

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Read the file from memory buffer and upload directly to ImageKit
      const fileBuffer = req.file.buffer;
      const fileName = `${course.courseId}/${Date.now()}${path.extname(req.file.originalname)}`;

      // Upload to ImageKit
      const imagekitResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: fileName,
        folder: `courses/${course.courseId}`,
      });

      const sessionName = req.body.name && req.body.name.trim() !== "" ? req.body.name : req.file.originalname;
      const session = { 
        name: sessionName, 
        url: imagekitResponse.url,
        category: req.body.category || "Uncategorized"
      };
      course.sessions.push(session);
      await course.save();
      console.log("Session added with ImageKit URL:", session);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error adding session:", error);
      res.status(500).json({ message: "Error adding session", error: error.message });
    }
  }
  static async deleteSession(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const sessionToDelete = course.sessions.find(s => s._id.toString() === req.params.sessionId);
      if (!sessionToDelete) return res.status(404).json({ message: 'Session not found' });

      course.sessions = course.sessions.filter(s => s._id.toString() !== req.params.sessionId);
      await course.save();

      // If URL is from ImageKit, try to delete it
      if (sessionToDelete.url && sessionToDelete.url.includes('ik.imagekit.io')) {
        try {
          // Extract fileId from URL if stored, otherwise skip deletion
          console.log(`Would delete from ImageKit: ${sessionToDelete.url}`);
        } catch (fileError) {
          console.error(`Failed to delete file from ImageKit:`, fileError);
        }
      } else {
        // Legacy local file deletion
        const filePath = path.join(__dirname, '..', sessionToDelete.url);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted file from uploads: ${filePath}`);
        } catch (fileError) {
          console.error(`Failed to delete file ${filePath}:`, fileError);
        }
      }

      console.log("Session deleted from DB:", req.params.sessionId);
      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: 'Error deleting session', error: error.message });
    }
  }

  static async scheduleLiveSession(req, res) {
    const { courseId } = req.params;
    const { title, date, time } = req.body;

    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ status: false, message: "Authentication required" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ status: false, message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user.id.toString()) {
        return res.status(403).json({ status: false, message: "Unauthorized" });
      }

      const sessionId = `SESSION-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const newSession = { title, date, time, sessionId, isLive: false };
      course.liveSessions.push(newSession);

      await course.save();
      res.status(201).json(newSession);
    } catch (error) {
      console.error("Error scheduling live session:", error);
      res.status(500).json({ status: false, message: "Server error" });
    }
  }

  // Start a live session
  static async startLiveSession(req, res) {
    const { courseId, sessionId } = req.params;

    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ status: false, message: "Authentication required" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ status: false, message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user.id.toString()) {
        return res.status(403).json({ status: false, message: "Unauthorized" });
      }

      const session = course.liveSessions.find(s => s.sessionId === sessionId);
      if (!session) {
        return res.status(404).json({ status: false, message: "Session not found" });
      }

      if (session.isLive) {
        return res.status(400).json({ status: false, message: "Session is already live" });
      }

      session.isLive = true;
      await course.save();
      res.status(200).json(session);
    } catch (error) {
      console.error("Error starting live session:", error);
      res.status(500).json({ status: false, message: "Server error" });
    }
  }

  // End a live session
  static async endLiveSession(req, res) {
    const { courseId, sessionId } = req.params;

    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ status: false, message: "Authentication required" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ status: false, message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user.id.toString()) {
        return res.status(403).json({ status: false, message: "Unauthorized" });
      }

      const session = course.liveSessions.find(s => s.sessionId === sessionId);
      if (!session) {
        return res.status(404).json({ status: false, message: "Session not found" });
      }

      if (!session.isLive) {
        return res.status(400).json({ status: false, message: "Session is not live" });
      }

      session.isLive = false;
      await course.save();
      res.status(200).json(session);
    } catch (error) {
      console.error("Error ending live session:", error);
      res.status(500).json({ status: false, message: "Server error" });
    }
  }

  // Delete a live session
  static async deleteLiveSession(req, res) {
    const { courseId, sessionId } = req.params;

    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ status: false, message: "Authentication required" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ status: false, message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user.id.toString()) {
        return res.status(403).json({ status: false, message: "Unauthorized" });
      }

      course.liveSessions = course.liveSessions.filter(s => s.sessionId !== sessionId);
      await course.save();
      res.status(200).json({ status: true, message: "Live session deleted" });
    } catch (error) {
      console.error("Error deleting live session:", error);
      res.status(500).json({ status: false, message: "Server error" });
    }
  }

  // Get course by session ID
  // static async getCourseBySessionId(req, res) {
  //   const { sessionId } = req.params;

  //   try {
  //     const course = await Course.findOne({ "liveSessions.sessionId": sessionId }).select("_id liveSessions");
  //     if (!course) {
  //       return res.status(404).json({ status: false, message: "Session not found" });
  //     }

  //     const session = course.liveSessions.find(s => s.sessionId === sessionId);
  //     res.json({ courseId: course._id, session });
  //   } catch (error) {
  //     console.error("Error fetching course by session ID:", error);
  //     res.status(500).json({ status: false, message: "Server error" });
  //   }
  // }
  // static async getCourseBySessionId(req, res) {
  //   const { sessionId } = req.params;
  //   try {
  //     const course = await Course.findOne({ "liveSessions.sessionId": sessionId }).select("_id liveSessions");
  //     if (!course) {
  //       console.log(`[getCourseBySessionId] Session ${sessionId} not found`);
  //       return res.status(404).json({ status: false, message: "Session not found" });
  //     }
  //     const session = course.liveSessions.find(s => s.sessionId === sessionId);
  //     console.log(`[getCourseBySessionId] Found course: ${course._id}, session:`, session);
  //     res.json({ courseId: course._id, session });
  //   } catch (error) {
  //     console.error("[getCourseBySessionId] Error:", error);
  //     res.status(500).json({ status: false, message: "Server error" });
  //   }
  // }

  static async getCourseBySessionId(req, res) {
    const { sessionId } = req.params;
    try {
     console.log("hello run...");
      console.log(`[getCourseBySessionId] Querying for sessionId: ${sessionId}`);
      const course = await Course.findOne({ "liveSessions.sessionId": sessionId }).select("_id liveSessions");
      console.log(`[getCourseBySessionId] Query result:`, course);
      if (!course) {
        console.log(`[getCourseBySessionId] Session ${sessionId} not found`);
        return res.status(404).json({ status: false, message: "Session not found" });
      }
      const session = course.liveSessions.find(s => s.sessionId === sessionId);
      console.log(`[getCourseBySessionId] Found course: ${course._id}, session:`, session);
      res.json({ courseId: course._id, session });
    } catch (error) {
      console.error("[getCourseBySessionId] Error:", error);
      res.status(500).json({ status: false, message: "Server error" });
    }
  }

  static async addQuiz(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const { title, timeLimit } = req.body;
      if (!title) return res.status(400).json({ message: 'Quiz title is required' });

      const quiz = { 
        title, 
        timeLimit: timeLimit || 20,
        questions: [] 
      };
      course.quizzes.push(quiz);
      await course.save();
      console.log("Quiz added:", quiz);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error adding quiz:", error);
      res.status(500).json({ message: 'Error adding quiz', error: error.message });
    }
  }

  static async addQuestionToQuiz(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const quiz = course.quizzes.id(req.params.quizId);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

      quiz.questions.push(req.body);
      await course.save();
      console.log("Question added to quiz:", req.body);
      res.status(201).json(req.body);
    } catch (error) {
      console.error("Error adding question to quiz:", error);
      res.status(500).json({ message: 'Error adding question to quiz', error: error.message });
    }
  }

  static async deleteQuiz(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      course.quizzes = course.quizzes.filter(q => q._id.toString() !== req.params.quizId);
      await course.save();
      console.log("Quiz deleted:", req.params.quizId);
      res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
  }

  static async addAssignment(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const assignment = { title: req.body.title, description: req.body.description, dueDate: req.body.dueDate, submissions: [] };
      course.assignments.push(assignment);
      await course.save();
      console.log("Assignment added:", assignment);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error adding assignment:", error);
      res.status(500).json({ message: 'Error adding assignment', error: error.message });
    }
  }

  static async deleteAssignment(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      course.assignments = course.assignments.filter(a => a._id.toString() !== req.params.assignmentId);
      await course.save();
      console.log("Assignment deleted:", req.params.assignmentId);
      res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ message: 'Error deleting assignment', error: error.message });
    }
  }

  static async blockStudent(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const studentId = req.params.studentId;
      const student = course.students.find(s => s.studentId.toString() === studentId);
      if (!student) return res.status(404).json({ message: 'Student not enrolled in this course' });

      course.blockedStudents.push(studentId);
      course.students = course.students.filter(s => s.studentId.toString() !== studentId);
      await course.save();
      console.log("Student blocked:", studentId);
      res.json({ message: 'Student blocked successfully', student: { studentId, name: student.name, grade: student.grade } });
    } catch (error) {
      console.error("Error blocking student:", error);
      res.status(500).json({ message: 'Error blocking student', error: error.message });
    }
  }

  static async unblockStudent(req, res) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user authenticated' });
      }

      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const studentId = req.params.studentId;
      course.blockedStudents = course.blockedStudents || [];
      console.log("Current blockedStudents:", course.blockedStudents.map(id => id.toString()));

      if (!Array.isArray(course.blockedStudents)) {
        console.warn("blockedStudents was not an array, resetting:", course.blockedStudents);
        course.blockedStudents = [];
      }

      const isBlocked = course.blockedStudents.some((item) => {
        const id = typeof item === 'string' ? item : item?.studentId || item;
        console.log(`Checking ID: ${id} against ${studentId}`);
        return id && id.toString() === studentId;
      });
      if (!isBlocked) {
        console.log(`Student ${studentId} not found in blockedStudents`);
        return res.status(404).json({ message: 'Student not blocked in this course' });
      }

      course.blockedStudents = course.blockedStudents.filter((item) => {
        const id = typeof item === 'string' ? item : item?.studentId || item;
        return id && id.toString() !== studentId;
      });

      const student = await Student.findById(studentId);
      if (!student) {
        await course.save();
        console.log("Student unblocked (not re-enrolled, student not found):", studentId);
        return res.json({ message: 'Student unblocked but not re-enrolled (student not found)' });
      }

      const studentData = { studentId, name: `${student.firstName} ${student.lastName}`, grade: "N/A" };
      course.students.push(studentData);
      await course.save();

      console.log("Student unblocked and re-enrolled:", studentId);
      res.json({ message: 'Student unblocked successfully', student: studentData });
    } catch (error) {
      console.error("Error unblocking student:", error);
      res.status(500).json({ message: 'Error unblocking student', error: error.message });
    }
  }

  static async getRecordedSession(req, res) {
    try {
      const { id: courseId, sessionId } = req.params;
      const studentId = req.user.id;

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      console.log("Student ID from token:", studentId);
      console.log("Course students:", JSON.stringify(course.students, null, 2));
      const isEnrolled = course.students.some(s => {
        const match = s.studentId.toString() === studentId;
        console.log(`Comparing ${s.studentId.toString()} with ${studentId}: ${match}`);
        return match;
      });
      if (!isEnrolled) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }

      const session = course.sessions.find(s => s._id.toString() === sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      console.log(`Fetched recorded session ${sessionId} for course ${courseId}:`, session);
      res.json(session);
    } catch (error) {
      console.error("Error fetching recorded session:", error);
      res.status(500).json({ message: "Error fetching recorded session", error: error.message });
    }
  }

  static async updateSessionCompletion(req, res) {
    try {
      const { courseId, sessionId, studentId } = req.params;
      const { completed } = req.body;

      if (req.user.id !== studentId) {
        return res.status(403).json({ message: 'You can only update your own completion status' });
      }

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const student = course.students.find(s => s.studentId.toString() === studentId);
      if (!student) return res.status(404).json({ message: 'Student not enrolled in this course' });

      const session = course.sessions.find(s => s._id.toString() === sessionId);
      if (!session) return res.status(404).json({ message: 'Session not found' });

      if (!student.completedSessions) student.completedSessions = [];

      if (completed) {
        if (!student.completedSessions.some(id => id.toString() === sessionId)) {
          student.completedSessions.push(sessionId);
          console.log(`Added session ${sessionId} to completedSessions for student ${studentId}`);
        }
      } else {
        student.completedSessions = student.completedSessions.filter(id => id.toString() !== sessionId);
        console.log(`Removed session ${sessionId} from completedSessions for student ${studentId}`);
      }

      await course.save();
      console.log(`Updated completedSessions for student ${studentId}:`, student.completedSessions);
      res.json({ message: 'Session completion updated' });
    } catch (error) {
      console.error("Error updating session completion:", error);
      res.status(500).json({ message: 'Error updating session completion', error: error.message });
    }
  }

  static async markAttendance(req, res) {
    try {
      const { courseId, sessionId } = req.params;
      const { present } = req.body;
      const studentId = req.user.id;
      console.log("Marking attendance:", { courseId, sessionId, studentId, present });

      const course = await Course.findById(courseId);
      console.log("Course found:", course);
      if (!course) return res.status(404).json({ message: "Course not found" });

      const session = course.sessions.find(s => s._id.toString() === sessionId) || 
                      course.liveSessions.find(s => s._id.toString() === sessionId);
      console.log("Session found:", session);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const student = course.students.find(s => s.studentId.toString() === studentId);
      console.log("Student found:", student);
      if (!student) return res.status(404).json({ message: "Student not enrolled in this course" });

      if (!student.attendance) student.attendance = [];
      const existingAttendance = student.attendance.find(a => a.sessionId.toString() === sessionId);
      console.log("Existing attendance:", existingAttendance);
      if (existingAttendance) {
        existingAttendance.present = present;
      } else {
        student.attendance.push({ sessionId, present });
      }

      await course.save();
      console.log("Attendance updated successfully for student:", studentId);
      res.json({ message: "Attendance updated successfully" });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Error marking attendance", error: error.message });
    }
  }

  static async getAttendance(req, res) {   
    try {
      const { courseId, sessionId } = req.params;
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: "Course not found" });

      const session = course.sessions.find(s => s._id.toString() === sessionId) || 
                      course.liveSessions.find(s => s._id.toString() === sessionId);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const presentStudents = course.students
        .filter(s => s.attendance?.some(a => a.sessionId.toString() === sessionId && a.present))
        .map(s => s.name || "Unknown");
      const absentStudents = course.students
        .filter(s => !s.attendance?.some(a => a.sessionId.toString() === sessionId && a.present))
        .map(s => s.name || "Unknown");

      res.json({
        presentStudents,
        absentStudents,
        present: presentStudents.length,
        absent: absentStudents.length,
      });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Error fetching attendance", error: error.message });
    }
  }

  static async generateCertificate(req, res) {
    try {
      const { courseId, studentId } = req.params;

      if (req.user.id !== studentId) {
        return res.status(403).json({ message: 'You can only generate your own certificate' });
      }

      const course = await Course.findById(courseId).populate('instructor', 'firstName lastName');
      if (!course) return res.status(404).json({ message: "Course not found" });

      const student = course.students.find(s => s.studentId.toString() === studentId);
      if (!student) return res.status(404).json({ message: "Student not enrolled in this course" });

      const allSessionsCompleted = course.sessions.every(s => 
        student.completedSessions && student.completedSessions.some(cs => cs.toString() === s._id.toString())
      );
      if (!allSessionsCompleted) {
        console.log(`Student ${studentId} has not completed all sessions for course ${courseId}`);
        return res.status(400).json({ message: "Course not fully completed" });
      }

      // Check for existing certificate for this student and course
      const existingCertificate = await Certificate.findOne({ courseId, studentId });
      if (existingCertificate) {
        const certificateUrl = existingCertificate.filePath; // Now stored as ImageKit URL
        console.log(`Returning existing certificate for student ${studentId} in course ${courseId}: ${existingCertificate.certificateId}`);
        return res.json({ certificateUrl, certificateId: existingCertificate.certificateId });
      }

      // Generate new certificate if none exists
      const certificateId = `BB-${uuidv4().substring(0, 8).toUpperCase()}`;
      const verifyUrl = `${process.env.SERVER_URL || 'http://localhost:4000'}/api/courses/courses/verify/${certificateId}`;

      // Generate QR Code first
      const qrCodeData = await QRCode.toDataURL(verifyUrl, { width: 100 });

      // Generate PDF to buffer
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      
      await new Promise((resolve) => {
        doc.on('end', resolve);

        // Background
        doc.rect(0, 0, doc.page.width, doc.page.height)
          .fill('#f8fafc'); // Very light gray

        // Define Content Width (600pt, centered)
        const contentWidth = 600;
        const contentXStart = (doc.page.width - contentWidth) / 2;
        const contentXEnd = contentXStart + contentWidth;

        // Header
        doc.fillColor('#1e40af')
          .fontSize(32)
          .font('Helvetica-Bold')
          .text('Edustack', contentXStart, 50, { align: 'center', width: contentWidth })
          .fontSize(18)
          .fillColor('#374151')
          .text('Certificate of Completion', contentXStart, 90, { align: 'center', width: contentWidth });

        // Horizontal Divider
        doc.lineWidth(2)
          .strokeColor('#f59e0b')
          .moveTo(contentXStart + 50, 120)
          .lineTo(contentXEnd - 50, 120)
          .stroke();

        // Certificate Body
        doc.fillColor('#111827')
          .fontSize(14)
          .font('Helvetica')
          .text('This certifies that', contentXStart, 150, { align: 'center', width: contentWidth })
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text(student.name, contentXStart, 180, { align: 'center', width: contentWidth })
          .fontSize(14)
          .font('Helvetica')
          .fillColor('#111827')
          .text('has successfully completed', contentXStart, 230, { align: 'center', width: contentWidth })
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(course.name, contentXStart, 250, { align: 'center', width: contentWidth })
          .fontSize(12)
          .font('Helvetica')
          .text(`Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`, contentXStart, 290, { align: 'center', width: contentWidth })
          .text(`Date: ${new Date().toLocaleDateString()}`, contentXStart, 310, { align: 'center', width: contentWidth });

        // Certificate ID
        doc.fillColor('#6b7280')
          .fontSize(10)
          .text(`Certificate ID: ${certificateId}`, contentXStart, 340, { align: 'center', width: contentWidth });

        // Footer
        doc.fillColor('#9ca3af')
          .fontSize(10)
          .text('Edustack - Building Skills for the Future', contentXStart, doc.page.height - 70, { align: 'center', width: contentWidth });

        // QR Code
        doc.image(qrCodeData, contentXEnd + 20, doc.page.height / 2 - 50, { width: 100, height: 100 })
          .fillColor('#6b7280')
          .fontSize(8)
          .text('Scan to Verify', contentXEnd + 20, doc.page.height / 2 + 60, { align: 'center', width: 100 });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);

      // Upload to ImageKit
      const imagekitResponse = await imagekit.upload({
        file: pdfBuffer,
        fileName: `${certificateId}.pdf`,
        folder: 'certificates',
      });

      const certificateUrl = imagekitResponse.url;

      // Save certificate metadata
      const newCertificate = new Certificate({
        certificateId,
        courseId,
        studentId,
        studentName: student.name,
        courseName: course.name,
        instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`,
        filePath: certificateUrl, // Now storing ImageKit URL
      });
      await newCertificate.save();

      console.log(`Certificate generated for student ${studentId} in course ${courseId}: ${certificateId}`);
      res.json({ certificateUrl, certificateId });
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: 'Error generating certificate', error: error.message });
    }
  }

  static async verifyCertificate(req, res) {
    try {
      const { certificateId } = req.params;

      const certificate = await Certificate.findOne({ certificateId });
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      res.json({
        certificateId: certificate.certificateId,
        courseName: certificate.courseName,
        studentName: certificate.studentName,
        instructorName: certificate.instructorName,
        issueDate: certificate.issueDate,
        status: 'Valid',
      });
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ message: 'Error verifying certificate', error: error.message });
    }
  }




  static async enrollStudent(req, res) {
    try {
      const courseId = req.params.id;
      const studentId = req.user.id;

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      if (!course.isFree) {
        return res.status(403).json({ message: 'Payment required for this course' });
      }

      if (course.students.some(s => s.studentId.toString() === studentId)) {
        return res.status(400).json({ message: 'Student already enrolled' });
      }

      if (course.blockedStudents.includes(studentId)) {
        return res.status(403).json({ message: 'You are blocked from enrolling in this course' });
      }

      course.students.push({
        studentId,
        name: `${student.firstName} ${student.lastName}`,
        grade: "N/A"
      });
      await course.save();

      console.log(`Student ${studentId} enrolled in course ${courseId}`);
      res.json({ message: 'Successfully enrolled in the course', course });
    } catch (error) {
      console.error("Error enrolling student:", error);
      res.status(500).json({ message: 'Error enrolling student', error: error.message });
    }
  }

  // static async getClassmates(req, res) {
  //   // try {
  //   //   const courseId = req.params.id;
  //   //   const studentId = req.user.id; // From JWT via studentAuth

  //   //   const course = await Course.findById(courseId)
  //   //     .select('students blockedStudents instructor')
  //   //     .populate('students.studentId', 'firstName lastName email status')
  //   //     .populate('instructor', 'firstName lastName email status');

  //   //   if (!course) {
  //   //     return res.status(404).json({ status: false, message: 'Course not found' });
  //   //   }

  //   //   const isStudent = course.students.some(s => s.studentId._id.toString() === studentId);
  //   //   const isInstructor = course.instructor._id.toString() === studentId;
  //   //   if (!isStudent && !isInstructor) {
  //   //     return res.status(403).json({ status: false, message: 'Not authorized for this course' });
  //   //   }

  //   //   const classmates = [
  //   //     {
  //   //       id: course.instructor._id,
  //   //       name: `${course.instructor.firstName} ${course.instructor.lastName}`,
  //   //       status: course.instructor.status || 'offline',
  //   //       userType: 'instructor'
  //   //     },
  //   //     ...course.students
  //   //       .filter(student => !course.blockedStudents.includes(student.studentId._id))
  //   //       .map(student => ({
  //   //         id: student.studentId._id,
  //   //         name: student.name,
  //   //         status: student.studentId.status || 'offline',
  //   //         userType: 'student'
  //   //       }))
  //   //   ];

  //   //   res.json({ status: true, classmates });
  //   // } catch (error) {
  //   //   console.error('Error fetching classmates:', error);
  //   //   res.status(500).json({ status: false, message: 'Error fetching classmates', error: error.message });
  //   // }


  //   try {
  //     const course = await Course.findById(req.params.courseId).populate("students.studentId", "username firstName lastName status");
  //     if (!course) {
  //       return res.status(404).json({ message: "Course not found" });
  //     }
  //     const classmates = course.students.map((s) => ({
  //       id: s.studentId._id.toString(),
  //       name: `${s.studentId.username} (${s.studentId.firstName} ${s.studentId.lastName})`,
  //       status: s.studentId.status || "offline",
  //     }));
  //     res.json({ classmates });
  //   } catch (error) {
  //     console.error("Error fetching classmates:", error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // }

  // static async getClassmates(req, res) {
  //   try {
  //     const courseId = req.params.courseId;
  //     const studentId = req.user.id;

  //     const course = await Course.findById(courseId)
  //       .populate("students.studentId", "username firstName lastName status")
  //       .populate("instructor", "username firstName lastName status");

  //     if (!course) {
  //       return res.status(404).json({ message: "Course not found" });
  //     }

  //     const isStudent = course.students.some((s) => s.studentId._id.toString() === studentId);
  //     const isInstructor = course.instructor._id.toString() === studentId;
  //     if (!isStudent && !isInstructor) {
  //       return res.status(403).json({ message: "Not authorized for this course" });
  //     }

  //     const classmates = [
  //       {
  //         id: course.instructor._id.toString(),
  //         name: `${course.instructor.username} (${course.instructor.firstName} ${course.instructor.lastName})`,
  //         status: course.instructor.status || "offline",
  //         userType: "instructor",
  //       },
  //       ...course.students.map((s) => ({
  //         id: s.studentId._id.toString(),
  //         name: `${s.studentId.username} (${s.studentId.firstName} ${s.studentId.lastName})`,
  //         status: s.studentId.status || "offline",
  //         userType: "student",
  //       })),
  //     ];

  //     res.json({ classmates });
  //   } catch (error) {
  //     console.error("Error fetching classmates:", error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // }


  static async getClassmates(req, res) {
    try {
      const courseId = req.params.courseId;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!courseId) return res.status(400).json({ message: "Course ID is required" });

      const course = await Course.findById(courseId)
        .populate("students.studentId", "username firstName lastName status")
        .populate("instructor", "username firstName lastName status");
  
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      const isStudent = course.students.some((s) => s.studentId?._id?.toString() === userId);
      const isInstructor = course.instructor?._id?.toString() === userId;
      if (!isStudent && !isInstructor) {
        return res.status(403).json({ message: "Not authorized for this course" });
      }
  
      const classmates = [
        {
          id: course.instructor._id.toString(),
          name: `${course.instructor.username} (${course.instructor.firstName} ${course.instructor.lastName})`,
          status: course.instructor.status || "offline",
          userType: "instructor",
        },
        ...course.students
          .filter(s => {
            if (!s.studentId || !s.studentId._id) {
              console.log("Invalid student entry:", s); // Log problematic entries
              return false;
            }
            return true;
          })
          .map((s) => ({
            id: s.studentId._id.toString(),
            name: `${s.studentId.username} (${s.studentId.firstName} ${s.studentId.lastName})`,
            status: s.studentId.status || "offline",
            userType: "student",
          })),
      ];
  
      res.json({ classmates });
    } catch (error) {
      console.error("Error fetching classmates:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getMessages(req, res) {
    try {
      const courseId = req.params.courseId;
      const userId = req.user?.id;
  
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: No user ID provided" });
      }
  
      const course = await Course.findById(courseId);
      if (!course) {
        console.error("Course not found for ID:", courseId);
        return res.status(404).json({ message: "Course not found" });
      }
  
      const isStudent = course.students.some((s) => s.studentId && s.studentId.toString() === userId);
      const isInstructor = course.instructor && course.instructor.toString() === userId;
  
      if (!isStudent && !isInstructor) {
        return res.status(403).json({ message: "Not authorized for this course" });
      }
  
      const messages = await Message.find({
        courseId,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }).sort({ timestamp: 1 });
  
      console.log("Messages fetched:", messages.length);
      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error.stack);
      res.status(500).json({ message: "Server error", details: error.message });
    }
  }

  static async getQuizForStudent(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.courseId });
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const studentId = req.user.id;
      const isEnrolled = course.students.some(s => s.studentId.toString() === studentId);
      if (!isEnrolled) return res.status(403).json({ message: 'You are not enrolled in this course' });

      const quiz = course.quizzes.find(q => q._id.toString() === req.params.quizId);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

      res.json({
        title: quiz.title,
        timeLimit: quiz.timeLimit,
        questions: quiz.questions.map(q => ({
          question: q.question,
          options: q.options,
        })),
      });
    } catch (error) {
      console.error("Error fetching quiz for student:", error);
      res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
  }

  static async submitQuiz(req, res) {
    try {
      const { answers } = req.body;
      const studentId = req.user.id;
      const course = await Course.findOne({ _id: req.params.courseId });
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const isEnrolled = course.students.some(s => s.studentId.toString() === studentId);
      if (!isEnrolled) return res.status(403).json({ message: 'You are not enrolled in this course' });

      const quiz = course.quizzes.find(q => q._id.toString() === req.params.quizId);
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

      const existingScore = course.quizScores.find(s => 
        s.studentId.toString() === studentId && s.quizId.toString() === req.params.quizId
      );
      if (existingScore) return res.status(400).json({ message: 'Quiz already submitted' });

      let score = 0;
      const totalQuestions = quiz.questions.length;
      answers.forEach((answer) => {
        const question = quiz.questions[answer.questionIndex];
        if (question.correctAnswer === answer.selectedOption) {
          score += 1;
        }
      });
      const finalScore = (score / totalQuestions) * 100;

      course.quizScores.push({
        studentId,
        quizId: quiz._id,
        score: finalScore,
      });
      await course.save();

      console.log(`Student ${studentId} submitted quiz ${quiz._id} with score: ${finalScore}`);
      res.json({
        message: 'Quiz submitted successfully',
        quizTitle: quiz.title,
        score: finalScore,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
  }
}

module.exports = CourseController;
module.exports.upload = upload;
