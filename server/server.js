const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;
const connectDB = require("./config/dbConnection");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoute = require("./routes/adminRoutes");
const { socketAuth } = require("./middleware/auth");
const jwt = require("jsonwebtoken");

const Course = require("./models/Course");
const Student = require("./models/Student");
const Message = require("./models/Message"); // Add this

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://edustack.vercel.app", "https://edu-stack-5o751oxdz-jenilgajeras-projects.vercel.app", "http://localhost:5173", "http://localhost:4000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

app.use(express.json());
// Enable CORS with credentials for cross-origin requests
app.use(cors({
  origin: ["https://edustack.vercel.app", "https://edu-stack-5o751oxdz-jenilgajeras-projects.vercel.app", "http://localhost:5173", "http://localhost:4000"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoute);

// Instructor routes
const instructorRoutes = require("./routes/instructorRoutes");
app.use("/api/instructor", instructorRoutes);
app.get("/", (req, res) => res.send("Live Session Server Running"));


const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  console.log("[Server] Token received:", token); // Log the token
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[Server] Decoded token:", decoded); // Log the decoded payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[Server] Token validation failed:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
// Create Payment Intent
app.post("/api/create-payment-intent", authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: "Payment service not configured" });
  const { amount, currency, courseId } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const expectedAmount = course.isFree ? 0 : course.price * 100; // Convert to paise
    if (!course.isFree && (!amount || amount !== expectedAmount)) {
      console.log("[Server] Amount mismatch:", { sent: amount, expected: expectedAmount });
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    if (course.isFree) {
      return res.status(400).json({ message: "This is a free course, no payment required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // In paise
      currency: currency || "INR",
      metadata: { courseId, studentId: req.user.id },
    });
    console.log("[Server] PaymentIntent created:", paymentIntent.id);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[Server] Error creating PaymentIntent:", error.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
});






// Enroll in Paid Course (New endpoint)
app.post("/api/enroll/paid/:courseId", authMiddleware, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: "Payment service not configured" });
  const { courseId } = req.params;
  const { paymentId } = req.body; // Expect paymentId for paid courses
  const studentId = req.user.id;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already enrolled
    if (
      course.students.some((s) => {
        const enrolledStudentId = s?.studentId || s;
        return enrolledStudentId?.toString() === studentId;
      })
    ) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // Paid course only
    if (course.isFree) {
      return res.status(400).json({ message: "This is a free course, use free enrollment endpoint" });
    }

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID required for paid course" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }
    if (paymentIntent.metadata.courseId !== courseId || paymentIntent.metadata.studentId !== studentId) {
      return res.status(400).json({ message: "Payment metadata mismatch" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Enroll student after payment verification using the same structure as free enrollments
    course.students.push({
      studentId,
      name: `${student.firstName} ${student.lastName}`.trim(),
      grade: "N/A",
    });
    await course.save();
    console.log("[Server] Paid course enrollment successful:", courseId, studentId);
    return res.json({ message: "Enrollment successful" });
  } catch (error) {
    console.error("[Server] Error enrolling student in paid course:", error.message);
    res.status(500).json({ message: "Enrollment failed" });
  }
});

// Assuming GET /courses/:courseId exists elsewhere, add GET /courses/paid/:courseId
app.get("/api/courses/paid/:courseId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate("instructor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course.isFree) {
      return res.status(400).json({ message: "This is a free course, use /courses/:courseId" });
    }

    // Return course details without enrollment check
    res.json({
      _id: course._id,
      name: course.name,
      description: course.description,
      instructor: course.instructor,
      isFree: course.isFree,
      price: course.price,
      students: course.students, // Include for frontend check
    });
  } catch (error) {
    console.error("[Server] Error fetching paid course:", error.message);
    res.status(500).json({ message: "Failed to fetch course details" });
  }
});

const users = new Map();

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-session", ({ sessionId, userType }) => {
    socket.join(sessionId);
    console.log(`${userType} joined session ${sessionId} with socket ID: ${socket.id}`);
    if (userType === "student") {
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


  socket.on("join-chat", async ({ courseId }) => {
    try {
      console.log("Join-chat received:", { courseId, user: socket.user });

      if (!courseId) {
        socket.emit("error", { message: "Course ID is required" });
        return;
      }

      if (!socket.user?.id || !socket.user?.isAuthenticated) {
        socket.emit("error", { message: "Authentication required for chat" });
        return;
      }

      const course = await Course.findById(courseId);
      if (!course) {
        socket.emit("error", { message: "Course not found" });
        return;
      }

      const isStudent = course.students.some((s) => s.studentId && s.studentId.toString() === socket.user.id);
      const isInstructor = course.instructor && course.instructor.toString() === socket.user.id;

      if (!isStudent && !isInstructor) {
        socket.emit("error", { message: "Not authorized for this course chat" });
        return;
      }

      const userData = {
        username: socket.user.username,
        fullName: socket.user.fullName,
        userId: socket.user.id,
        userType: socket.user.userType,
        courseId,
      };
      users.set(socket.id, userData);
      socket.join(courseId);

      console.log(`${userData.userType} ${userData.username} (${userData.fullName}) joined course ${courseId}`);
      socket.to(courseId).emit("user-joined", {
        username: userData.username,
        fullName: userData.fullName,
        userType: userData.userType,
        timestamp: new Date().toISOString(),
      });

      if (userData.userType === "student") {
        await Student.findByIdAndUpdate(socket.user.id, { status: "online" });
      }

      const messages = await Message.find({
        courseId,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }).sort({ timestamp: 1 });

      socket.emit("load-messages", messages);
    } catch (error) {
      console.error("Error in join-chat:", error.message);
      socket.emit("error", { message: "Error joining chat", details: error.message });
    }
  });

  socket.on("send-message", async ({ courseId, message, chatType, targetUserId }) => {
    const user = users.get(socket.id);
    if (!user) {
      console.error("User not found for socket:", socket.id);
      socket.emit("error", { message: "User not found" });
      return;
    }
  
    if (chatType === "community" && user.userType !== "instructor") {
      console.warn(`User ${user.username} (${user.userType}) attempted to send a community message but is not an instructor`);
      socket.emit("error", { message: "Only instructors can send messages in the community chat" });
      return;
    }
    console.log("Send-message received:", { courseId, message, chatType, targetUserId, user });
  
    const messageData = {
      courseId,
      senderId: user.userId,
      sender: `${user.username} (${user.fullName})`,
      targetUserId: chatType === "personal" ? targetUserId : null,
      text: message, // Encrypted by client
      type: chatType,
      userType: user.userType,
      timestamp: new Date(),
    };
  
    try {
      const savedMessage = await new Message(messageData).save();
      console.log("Message saved successfully:", savedMessage);
  
      if (chatType === "personal") {
        if (!targetUserId) {
          console.error("Missing targetUserId for personal chat");
          socket.emit("error", { message: "Target user ID is required for personal chat" });
          return;
        }
  
        let targetSocketId = null;
        for (const [sid, u] of users) {
          if (u.courseId === courseId && u.userId === targetUserId) {
            targetSocketId = sid;
            break;
          }
        }
  
        if (targetSocketId) {
          socket.emit("new-message", messageData); // Echo to sender
          io.to(targetSocketId).emit("new-message", messageData); // Send to target
          console.log("Personal message emitted to:", { sender: user.userId, target: targetUserId });
        } else {
          console.warn("Target user not online:", targetUserId);
          socket.emit("error", { message: "Target user is not online or not in this course" });
        }
      } else if (chatType === "community") {
        // No restriction on userType; both students and instructors can send
        io.to(courseId).emit("new-message", messageData);
        console.log("Community message emitted to room:", courseId, "Message:", messageData);
      } else {
        console.error("Invalid chatType:", chatType);
        socket.emit("error", { message: "Invalid chat type" });
      }
    } catch (error) {
      console.error("Error saving or emitting message:", error.stack);
      socket.emit("error", { message: "Failed to save or send message", details: error.message });
    }
  });

  socket.on("disconnect", async () => {
    const user = users.get(socket.id);
    if (user) {
      io.to(user.courseId).emit("user-left", {
        username: user.username,
        fullName: user.fullName,
        userType: user.userType,
        timestamp: new Date().toISOString(),
      });
      if (user.userType === "student") {
        await Student.findByIdAndUpdate(user.userId, { status: "offline" });
      }
      users.delete(socket.id);
      console.log(`${user.username} (${user.fullName}) disconnected`);
    }
    console.log(`Client ${socket.id} disconnected`);
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", users: users.size });
});

server.listen(4000, () => {
  console.log(`🚀 Edustack Server running on port 4000`);
  const { getEmailTransporter } = require("./config/emailConfig");
  const mailTransport = getEmailTransporter();
  if (mailTransport) {
    mailTransport
      .verify()
      .then(() => console.log("[email] SMTP connection verified — OTP emails can be sent."))
      .catch((err) =>
        console.error("[email] SMTP verify failed (fix EMAIL_USER / EMAIL_PASS):", err.message)
      );
  }
});
