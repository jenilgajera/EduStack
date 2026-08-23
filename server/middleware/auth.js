const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Instructor = require("../models/Instructor"); // Assuming you have an Instructor model

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
  // First try to get token from cookie
  let token = req.cookies?.token;
  
  // If no cookie token, try Authorization header (Bearer token)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  console.log("Checking token:", token ? "Token found" : "No token");
  if (!token) {
    console.log("No token found");
    return res.status(401).json({ status: false, message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Token decoded:", decoded);

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

// New middleware for chat routes (allows students and instructors)
const chatAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    console.log("Checking user type for chat:", req.user?.userType);
    if (req.user.userType !== "student" && req.user.userType !== "instructor") {
      return res.status(403).json({ status: false, message: "Access denied, students or instructors only" });
    }
    next();
  });
};

// Updated Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  // Parse token from cookie header in handshake
  const cookieHeader = socket.handshake.headers.cookie || "";
  const cookieToken = cookieHeader
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  const token = socket.handshake.auth.token || cookieToken || socket.handshake.query?.token;

  console.log("Checking token in Socket.IO:", token ? "token found" : "undefined");

  if (!token) {
    console.log("No token provided, allowing socket connection for public access");
    socket.user = { id: null, userType: "guest", isAuthenticated: false };
    return next();
  }

  try {
    const decoded = authenticateToken(token);
    let userData;
    if (decoded.userType === "student") {
      userData = await Student.findById(decoded.id).select("username firstName lastName");
    } else if (decoded.userType === "instructor") {
      userData = await Instructor.findById(decoded.id).select("username firstName lastName");
    }
    socket.user = {
      ...decoded,
      username: userData?.username || decoded.username || decoded.id,
      fullName: userData ? `${userData.firstName} ${userData.lastName}` : (decoded.fullName || decoded.id),
      isAuthenticated: true,
    };
    console.log("Socket user set:", socket.user.username, socket.user.userType);
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    socket.user = { id: null, userType: "guest", isAuthenticated: false };
    next();
  }
};

module.exports = { authMiddleware, instructorAuth, studentAuth, chatAuth, socketAuth };