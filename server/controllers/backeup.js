const Course = require('../models/Course');
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PDFDocument = require('pdfkit');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
    if (!course) return cb(new Error("Course not found or not authorized"));
    const uploadDir = path.join("uploads", req.user.id, course.courseId);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "video/mp4") cb(null, true);
    else cb(new Error("Only MP4 files are allowed!"), false);
  },
  limits: { fileSize: 100 * 1024 * 1024 },
}).single("file");

class CourseController {
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

  static async getPublicCourses(req, res) {
    try {
      console.log("Fetching public courses with query: { isPublic: true }");
      const courses = await Course.find({ isPublic: true }).populate('instructor', 'firstName lastName');
      console.log("Public courses fetched:", courses);
      if (courses.length === 0) {
        console.log("No public courses found. Check database for documents with isPublic: true");
      }
      res.json(courses);
    } catch (error) {
      console.error("Error fetching public courses:", error);
      res.status(500).json({ message: 'Error fetching public courses', error: error.message });
    }
  }

  static async getEnrolledCourses(req, res) {
    try {
      const studentId = req.user.id;
      const courses = await Course.find({ 'students.studentId': studentId })
        .populate('instructor', 'firstName lastName')
      //  .populate('students', 'firstName lastName');
      // console.log("Enrolled courses fetched for student:", studentId, courses);
      res.json(courses);
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
  // static async getCourse(req, res) { a
  //   try {
  //     const course = await Course.findById(req.params.id)
  //     .populate('instructor', 'firstName lastName')
  //     if (!course) return res.status(404).json({ message: 'Course not found' });
  //     res.json(course);
  //   } catch (error) {
  //     console.error("Error fetching course:", error);
  //     res.status(500).json({ message: 'Error fetching course', error: error.message });
  //   }
  // }
 
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
  static async generateCertificate(req, res) {
    try {
      const { studentId, courseId } = req.params;

      // Ensure the request comes from the student
      if (req.user.id !== studentId) {
        return res.status(403).json({ message: 'You can only generate your own certificate' });
      }

      const course = await Course.findById(courseId).populate('instructor', 'firstName lastName');
      if (!course) return res.status(404).json({ message: "Course not found" });

      const student = course.students.find(s => s.studentId.toString() === studentId);
      if (!student) return res.status(404).json({ message: "Student not enrolled in this course" });

      // Check if all sessions are completed
      const totalSessions = course.sessions.length;
      const completedSessions = student.completedSessions.length;
      if (totalSessions === 0 || completedSessions < totalSessions) {
        return res.status(400).json({ 
          message: `Course not fully completed (${completedSessions}/${totalSessions} sessions)` 
        });
      }
      
    // Certificate file path
    const certificateDir = path.join(__dirname, '..', 'certificates');
    await fs.mkdir(certificateDir, { recursive: true });
    const certificateFile = `${studentId}_${courseId}.pdf`;
    const certificatePath = path.join(certificateDir, certificateFile);
    const certificateUrl = `http://localhost:4000/certificates/${certificateFile}`;

    // Check if certificate already exists
    try {
      await fs.access(certificatePath);
      console.log(`Certificate already exists for student ${studentId} in course ${courseId}`);
      return res.json({ certificateUrl });
    } catch (err) {
      // File doesn’t exist, proceed to generate
    }

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const stream = require('fs').createWriteStream(certificatePath);
    doc.pipe(stream);

    // Certificate design
    doc.fontSize(30).text('Certificate of Completion', 100, 50, { align: 'center' });
    doc.fontSize(20).text(`Course: ${course.name}`, 100, 100, { align: 'center' });
    doc.fontSize(18).text(`Awarded to: ${student.name}`, 100, 150, { align: 'center' });
    doc.fontSize(14).text(`Instructor: ${course.instructor.firstName} ${course.instructor.lastName}`, 100, 200, { align: 'center' });
    doc.fontSize(12).text(`Completed on: ${new Date().toLocaleDateString()}`, 100, 250, { align: 'center' });

    // Add a border
    doc.lineWidth(2).rect(50, 30, 700, 500).stroke();

    doc.end();
    await new Promise((resolve) => stream.on('finish', resolve));

    console.log(`Certificate generated for student ${studentId} in course ${courseId}`);
    res.json({ certificateUrl });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ message: 'Error generating certificate', error: error.message });
  }
}
  static async addSession(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: "Course not found or not authorized" });

      const sessionName = req.body.name && req.body.name.trim() !== "" ? req.body.name : req.file.originalname;
      const session = { name: sessionName, url: `/uploads/${req.user.id}/${course.courseId}/${req.file.filename}` };
      course.sessions.push(session);
      await course.save();
      console.log("Session added:", session);
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

      const filePath = path.join(__dirname, '..', sessionToDelete.url);
      try {
        await fs.unlink(filePath);
        console.log(`Deleted file from uploads: ${filePath}`);
      } catch (fileError) {
        console.error(`Failed to delete file ${filePath}:`, fileError);
      }

      console.log("Session deleted from DB:", req.params.sessionId);
      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: 'Error deleting session', error: error.message });
    }
  }

  static async scheduleLiveSession(req, res) {
    try {
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const { title, date, time } = req.body;
      if (!title || !date || !time) {
        return res.status(400).json({ message: 'Title, date, and time are required' });
      }

      const newLiveSession = {
        title,
        date,
        time,
        link: `https://zoom.us/j/${Math.random().toString(36).substr(2, 9)}`,
        isLive: false,
      };
      course.liveSessions.push(newLiveSession);
      await course.save();

      const createdSession = course.liveSessions[course.liveSessions.length - 1];
      console.log("Live session scheduled:", createdSession);
      res.status(201).json(createdSession);
    } catch (error) {
      console.error("Error scheduling live session:", error);
      res.status(500).json({ message: 'Error scheduling live session', error: error.message });
    }
  }

  static async startLiveSession(req, res) {
    try {
      console.log("Starting live session route hit");
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const session = course.liveSessions.id(req.params.sessionId);
      if (!session) return res.status(404).json({ message: 'Live session not found' });

      session.isLive = true;
      await course.save();
      console.log("Live session started:", session);
      res.json(session);
    } catch (error) {
      console.error("Error starting live session:", error);
      res.status(500).json({ message: 'Error starting live session', error: error.message });
    }
  }

  static async endLiveSession(req, res) {
    try {
      console.log("Ending live session route hit");
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      const session = course.liveSessions.id(req.params.sessionId);
      if (!session) return res.status(404).json({ message: 'Live session not found' });

      session.isLive = false;
      await course.save();
      console.log("Live session ended:", session);
      res.json(session);
    } catch (error) {
      console.error("Error ending live session:", error);
      res.status(500).json({ message: 'Error ending live session', error: error.message });
    }
  }

  static async deleteLiveSession(req, res) {
    try {
      console.log("Deleting live session route hit");
      const course = await Course.findOne({ _id: req.params.id, instructor: req.user.id });
      if (!course) return res.status(404).json({ message: 'Course not found or not authorized' });

      course.liveSessions = course.liveSessions.filter(s => s._id.toString() !== req.params.sessionId);
      await course.save();
      console.log("Live session deleted:", req.params.sessionId);
      res.json({ message: 'Live session deleted successfully' });
    } catch (error) {
      console.error("Error deleting live session:", error);
      res.status(500).json({ message: 'Error deleting live session', error: error.message });
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
        timeLimit: timeLimit || 20, // Default to 20 minutes if not provided
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

  // static async getRecordedSession(req, res) {  aa 
  //   try {
  //     const { id: courseId, sessionId } = req.params;
  //     const studentId = req.user.id;

  //     const course = await Course.findById(courseId);
  //     if (!course) {
  //       return res.status(404).json({ message: "Course not found" });
  //     }

  //     const isEnrolled = course.students.some(s => s.studentId.toString() === studentId);
  //     if (!isEnrolled) {
  //       return res.status(403).json({ message: "You are not enrolled in this course" });
  //     }

  //     const session = course.sessions.find(s => s._id.toString() === sessionId);
  //     if (!session) {
  //       return res.status(404).json({ message: "Session not found" });
  //     }

  //     console.log(`Fetched recorded session ${sessionId} for course ${courseId}:`, session);
  //     res.json(session);
  //   } catch (error) {
  //     console.error("Error fetching recorded session:", error);
  //     res.status(500).json({ message: "Error fetching recorded session", error: error.message });
  //   }
  // }

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
    const { courseId, sessionId } = req.params;
    const studentId = req.user.id;
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

    if (completed) {
      if (!student.completedSessions.includes(sessionId)) {
        student.completedSessions.push(sessionId);
      }
    } else {
      student.completedSessions = student.completedSessions.filter(id => id.toString() !== sessionId);
    }

    await course.save();
    console.log(`Student ${studentId} session ${sessionId} completion updated to ${completed}`);
    res.json({ message: 'Session completion updated' });
  } catch (error) {
    console.error("Error updating session completion:", error);
    res.status(500).json({ message: 'Error updating session completion', error: error.message });
  }
}
  // static async markAttendance(req, res) {
  //   try {
  //     const { courseId, sessionId } = req.params;
  //     const { present } = req.body;
  //     const studentId = req.user.id; // Assumes student context; adjust for instructor if needed
  
  //     const course = await Course.findById(courseId);
  //     if (!course) return res.status(404).json({ message: "Course not found" });
  
  //     const session = course.sessions.find(s => s._id.toString() === sessionId) || 
  //                     course.liveSessions.find(s => s._id.toString() === sessionId);
  //     if (!session) return res.status(404).json({ message: "Session not found" });
  
  //     const student = course.students.find(s => s.studentId.toString() === studentId);
  //     if (!student) return res.status(404).json({ message: "Student not enrolled in this course" });
  
  //     if (!student.attendance) student.attendance = [];
  //     const existingAttendance = student.attendance.find(a => a.sessionId.toString() === sessionId);
  //     if (existingAttendance) {
  //       existingAttendance.present = present;
  //     } else {
  //       student.attendance.push({ sessionId, present });
  //     }
  
  //     await course.save();
  //     console.log(`Attendance marked for student ${studentId} in session ${sessionId}: ${present}`);
  //     res.json({ message: "Attendance updated successfully" });
  //   } catch (error) {
  //     console.error("Error marking attendance:", error);
  //     res.status(500).json({ message: "Error marking attendance", error: error.message });
  //   }
  // }

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

 
  // static async updateSessionCompletion(req, res) {

  // static async updateSessionCompletion(req, res) {
  //   try {
  //     const { courseId, sessionId, studentId } = req.params;
  //     const { completed } = req.body;
  
  //     if (req.user.id !== studentId) {
  //       return res.status(403).json({ message: 'You can only update your own completion status' });
  //     }
  
  //     const course = await Course.findById(courseId);
  //     if (!course) return res.status(404).json({ message: 'Course not found' });
  
  //     const student = course.students.find(s => s.studentId.toString() === studentId);
  //     if (!student) return res.status(404).json({ message: 'Student not enrolled in this course' });
  
  //     const session = course.sessions.find(s => s._id.toString() === sessionId);
  //     if (!session) return res.status(404).json({ message: 'Session not found' });
  
  //     if (!student.completedSessions) student.completedSessions = [];
  
  //     if (completed) {
  //       if (!student.completedSessions.some(id => id.toString() === sessionId)) {
  //         student.completedSessions.push(sessionId);
  //         console.log(`Added session ${sessionId} to completedSessions for student ${studentId}`);
  //       }
  //     } else {
  //       student.completedSessions = student.completedSessions.filter(id => id.toString() !== sessionId);
  //       console.log(`Removed session ${sessionId} from completedSessions for student ${studentId}`);
  //     }
  
  //     await course.save();
  //     console.log(`Updated completedSessions for student ${studentId}:`, student.completedSessions);
  //     res.json({ message: 'Session completion updated' });
  //   } catch (error) {
  //     console.error("Error updating session completion:", error);
  //     res.status(500).json({ message: 'Error updating session completion', error: error.message });
  //   }
  // }
static async generateCertificate(req, res) {
try {
  const { courseId, studentId } = req.params;
  
  // Ensure only the student can request their own certificate
  if (req.user.id !== studentId) {
    return res.status(403).json({ message: 'You can only generate your own certificate' });
  }

  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const student = course.students.find(s => s.studentId.toString() === studentId);
  if (!student) return res.status(404).json({ message: "Student not enrolled in this course" });

  // Check if all sessions are completed
  const allSessionsCompleted = course.sessions.every(s => 
    student.completedSessions && student.completedSessions.some(cs => cs.toString() === s._id.toString())
  );
  if (!allSessionsCompleted) {
    console.log(`Student ${studentId} has not completed all sessions for course ${courseId}`);
    return res.status(400).json({ message: "Course not fully completed" });
  }

  // Placeholder for certificate generation (e.g., using pdfkit in a real implementation)
  const certificateUrl = `http://localhost:4000/certificates/${studentId}_${courseId}.pdf`;
  console.log(`Certificate generated for student ${studentId} in course ${courseId}:`, certificateUrl);
  res.json({ certificateUrl });
} catch (error) {
  console.error("Error generating certificate:", error);
  res.status(500).json({ message: "Error generating certificate", error: error.message });
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


      course.students.push(
        { studentId, name: `${student.firstName} ${student.lastName}`,
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

  // New methods for student quiz attempts
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
  
      // Check if student already submitted this quiz
      const existingScore = course.quizScores.find(s => 
        s.studentId.toString() === studentId && s.quizId.toString() === req.params.quizId
      );
      if (existingScore) return res.status(400).json({ message: 'Quiz already submitted' });
  
      // Calculate score
      let score = 0;
      const totalQuestions = quiz.questions.length;
      answers.forEach((answer) => {
        const question = quiz.questions[answer.questionIndex];
        if (question.correctAnswer === answer.selectedOption) {
          score += 1;
        }
      });
      const finalScore = (score / totalQuestions) * 100;
  
      // Store score
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




io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-session", ({ sessionId, userType }) => {
    socket.join(sessionId);
    console.log(`${userType} joined session ${sessionId} with socket ID: ${socket.id}`);
    if (userType === "student") {
      // Notify instructor that a student has joined
      socket.to(sessionId).emit("student-joined", { sessionId });
    }
  });

  socket.on("offer", ({ sessionId, offer }) => {
    console.log(`Relaying offer from ${socket.id} to session: ${sessionId}`);
    socket.to(sessionId).emit("offer", { offer });
  });

  socket.on("answer", ({ sessionId, answer }) => {
    console.log(`Relaying answer from ${socket.id} to session: ${sessionId}`);
    socket.to(sessionId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ sessionId, candidate }) => {
    console.log(`❄️ ICE Candidate from ${socket.id} in session ${sessionId}`);
    socket.to(sessionId).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client ${socket.id} disconnected: ${reason}`);
  });
});



const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/dbConnection");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoute = require("./routes/adminRoutes");
const { socketAuth } = require('./middleware/auth');

// Connect to database
connectDB();

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"], 
    credentials: true 
  },
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));
// Use the socketAuth middleware
io.use(socketAuth);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoute);
app.get("/", (req, res) => res.send("Live Session Server Running"));



// Socket.IO WebRTC Signaling
// io.on("connection", (socket) => {
//   console.log(`✅ User connected: ${socket.id}`);

//   socket.on("join-session", ({ sessionId, userType }) => {
//     if (!sessionId) {
//       socket.emit("error", { message: "Session ID required" });
//       return;
//     }
//     socket.join(sessionId);
//     if (!sessions[sessionId]) sessions[sessionId] = { instructor: null, students: new Set() };
//     if (userType === "instructor") {
//       sessions[sessionId].instructor = socket.id;
//       console.log(`🎤 Instructor ${socket.id} joined session ${sessionId}`);
//     } else {
//       sessions[sessionId].students.add(socket.id);
//       console.log(`🎓 Student ${socket.id} joined session ${sessionId}`);
//     }
//     io.to(sessionId).emit("participant-update", {
//       instructor: sessions[sessionId].instructor,
//       students: Array.from(sessions[sessionId].students),
//     });
//   });

//   socket.on("offer", ({ sessionId, offer }) => {
//     if (!sessions[sessionId] || sessions[sessionId].instructor !== socket.id) {
//       socket.emit("error", { message: "Not authorized to send offer" });
//       return;
//     }
//     console.log(`📡 Offer from ${socket.id} in session ${sessionId}`);
//     socket.to(sessionId).emit("offer", { from: socket.id, offer });
//   });

//   socket.on("answer", ({ sessionId, answer, to }) => {
//     if (!sessionId || !to) return;
//     console.log(`📩 Answer from ${socket.id} to ${to} in session ${sessionId}`);
//     io.to(to).emit("answer", { answer, from: socket.id });
//   });

//   socket.on("ice-candidate", ({ sessionId, candidate }) => {
//     if (!sessionId || !candidate) return;
//     console.log(`❄️ ICE Candidate from ${socket.id} in session ${sessionId}`);
//     socket.to(sessionId).emit("ice-candidate", { candidate, from: socket.id });
//   });

//   socket.on("leave-session", (sessionId) => {
//     if (!sessionId || !sessions[sessionId]) return;
//     socket.leave(sessionId);
//     if (sessions[sessionId].instructor === socket.id) {
//       sessions[sessionId].instructor = null;
//       console.log(`🚪 Instructor ${socket.id} left session ${sessionId}`);
//     } else {
//       sessions[sessionId].students.delete(socket.id);
//       console.log(`🚪 Student ${socket.id} left session ${sessionId}`);
//     }
//     if (!sessions[sessionId].instructor && sessions[sessionId].students.size === 0) {
//       console.log(`🗑️ Deleting empty session ${sessionId}`);
//       delete sessions[sessionId];
//       return;
//     }
//     io.to(sessionId).emit("participant-update", {
//       instructor: sessions[sessionId].instructor,
//       students: Array.from(sessions[sessionId].students),
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log(`❌ User disconnected: ${socket.id}`);
//     for (const sessionId in sessions) {
//       if (!sessions[sessionId]) continue;
//       if (sessions[sessionId].instructor === socket.id) {
//         sessions[sessionId].instructor = null;
//         console.log(`🎤 Instructor ${socket.id} disconnected from session ${sessionId}`);
//       } else if (sessions[sessionId].students.has(socket.id)) {
//         sessions[sessionId].students.delete(socket.id);
//         console.log(`🎓 Student ${socket.id} disconnected from session ${sessionId}`);
//       }
//       if (!sessions[sessionId].instructor && sessions[sessionId].students.size === 0) {
//         console.log(`🗑️ Deleting empty session ${sessionId}`);
//         delete sessions[sessionId];
//         continue;
//       }
//       io.to(sessionId).emit("participant-update", {
//         instructor: sessions[sessionId].instructor,
//         students: Array.from(sessions[sessionId].students),
//       });
//     }
//   });
// });

// Store user information
const users = new Map(); // socket.id -> { userType, username, sessionId }
// Middleware to verify user type
const verifyInstructor = (socket) => {
  const user = users.get(socket.id);
  return user && user.userType === 'instructor';
};
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-session", ({ sessionId, userType }) => {
    socket.join(sessionId);
    console.log(`${userType} joined session ${sessionId} with socket ID: ${socket.id}`);
    if (userType === "student") {
      // Notify instructor that a student has joined
      socket.to(sessionId).emit("student-joined", { sessionId });
    }
  });
  socket.on("join-chat", async ({ courseId }) => {
    try {
      console.log("Join-chat received:", { courseId, user: socket.user });

      if (!courseId) {
        socket.emit("error", { message: "Course ID is required" });
        return;
      }

      const course = await Course.findById(courseId);
      if (!course) {
        socket.emit("error", { message: "Course not found" });
        return;
      }

      console.log("Course found:", course._id);

      const isStudent = course.students.some(s => s.studentId.toString() === socket.user.id);
      const isInstructor = course.instructor.toString() === socket.user.id;
      console.log("Authorization check:", { isStudent, isInstructor, userId: socket.user.id });

      if (!isStudent && !isInstructor) {
        socket.emit("error", { message: "Not authorized for this course chat" });
        return;
      }

      const userData = {
        username: socket.user.username || socket.user.id,
        userType: socket.user.userType,
        courseId
      };
      users.set(socket.id, userData);
      socket.join(courseId);

      console.log(`${userData.userType} ${userData.username} joined course ${courseId}`);
      socket.to(courseId).emit("user-joined", {
        username: userData.username,
        userType: userData.userType,
        timestamp: new Date().toISOString()
      });

      if (userData.userType === "student") {
        await Student.findByIdAndUpdate(socket.user.id, { status: "online" });
      }
    } catch (error) {
      console.error("Detailed error in join-chat:", error.stack || error.message);
      socket.emit("error", { message: "Error joining chat", details: error.message });
    }
  });

  socket.on("send-message", ({ courseId, message, chatType }) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit("error", { message: "User not found" });
      return;
    }

    console.log("Send-message received:", { courseId, message, chatType, user });

    const messageData = {
      sender: user.username,
      text: message,
      timestamp: new Date().toISOString(),
      type: chatType,
      userType: user.userType
    };

    if (chatType === "community" && user.userType !== "instructor") {
      socket.emit("error", { message: "Only instructors can send messages in community chat" });
      return;
    }

    io.to(courseId).emit("new-message", messageData);
    console.log("Emitted new-message:", messageData);
  });

  socket.on("disconnect", async () => {
    const user = users.get(socket.id);
    if (user) {
      io.to(user.courseId).emit("user-left", {
        username: user.username,
        userType: user.userType,
        timestamp: new Date().toISOString()
      });
      if (user.userType === "student") {
        await Student.findByIdAndUpdate(socket.user.id, { status: "offline" });
      }
      users.delete(socket.id);
    }
    console.log(`Client ${socket.id} disconnected`);
  });
  // Handle chat messages
  socket.on("send-message", ({ courseId, message, chatType }) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit("error", { message: "User not found" });
      return;
    }

    console.log("Send-message received:", { courseId, message, chatType, user });

    const messageData = {
      sender: user.username,
      text: message,
      timestamp: new Date().toISOString(),
      type: chatType,
      userType: user.userType
    };

    if (chatType === "community" && user.userType !== "instructor") {
      socket.emit("error", { message: "Only instructors can send messages in community chat" });
      return;
    }

    io.to(courseId).emit("new-message", messageData);
    console.log("Emitted new-message:", messageData);
  });

  // Handle blocking users
  socket.on("block-user", ({ courseId, targetUserId }) => {
    const user = users.get(socket.id);
    if (user) {
      io.to(courseId).emit("user-blocked", {
        blockedBy: user.username,
        blockedUserId: targetUserId,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on("offer", ({ sessionId, offer }) => {
    console.log(`Relaying offer from ${socket.id} to session: ${sessionId}`);
    socket.to(sessionId).emit("offer", { offer });
  });

  socket.on("answer", ({ sessionId, answer }) => {
    console.log(`Relaying answer from ${socket.id} to session: ${sessionId}`);
    socket.to(sessionId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ sessionId, candidate }) => {
    console.log(`❄️ ICE Candidate from ${socket.id} in session ${sessionId}`);
    socket.to(sessionId).emit("ice-candidate", { candidate });
  });

  // socket.on("disconnect", (reason) => {
  //   console.log(`Client ${socket.id} disconnected: ${reason}`);
  // });
  socket.on("disconnect", async () => {
    const user = users.get(socket.id);
    if (user) {
      io.to(user.courseId).emit("user-left", {
        username: user.username,
        userType: user.userType,
        timestamp: new Date().toISOString()
      });
      if (user.userType === "student") {
        await Student.findByIdAndUpdate(socket.user.id, { status: "offline" });
      }
      users.delete(socket.id);
    }
    console.log(`Client ${socket.id} disconnected`);
  });
}); 

// Basic API endpoint for health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', users: users.size });
});

// Start server on port 4000
server.listen(4000, () => console.log(`🚀 WebRTC Server running on port 4000`));




// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const authenticateToken = (token) => {
  if (!token) throw new Error("No token, authorization denied");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isBlocked) throw new Error("Your account is blocked. Contact support.");
    return decoded;
  } catch (error) {
    throw new Error("Token is not valid");
  }
};
const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  console.log("Checking token in cookies:", token); // Debug log
  if (!token) {
    console.log("No token found in cookies");
    return res.status(401).json({ status: false, message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, userType, isBlocked }
    console.log("Token decoded:", decoded);

    // Check if user is blocked
    if (decoded.isBlocked) {
      console.log(`Blocked user attempted access: ${decoded.id}`);
      return res.status(403).json({ status: false, message: "Your account is blocked. Contact support." });
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ status: false, message: "Token is not valid" });
  }
};

const instructorAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    console.log("Checking user type:", req.user?.userType); 
    if (req.user.userType !== "instructor") {
      return res.status(403).json({ status: false, message: "Access denied, instructors only" });
    }
    next();
  });
};

const studentAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.userType !== "student") {
      return res.status(403).json({ status: false, message: "Access denied, students only" });
    }
    next();
  });
};

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token || socket.request.cookies?.token;
  console.log("Checking token in Socket.IO:", token);
  try {
    const decoded = authenticateToken(token);
    const student = await Student.findById(decoded.id).select("username firstName lastName");
    socket.user = {
      ...decoded,
      username: student?.username || decoded.id,
      fullName: student ? `${student.firstName} ${student.lastName}` : decoded.id,
    };
    console.log("Socket user set:", socket.user);
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error(error.message));
  }
};

module.exports = { authMiddleware, instructorAuth, studentAuth ,socketAuth};