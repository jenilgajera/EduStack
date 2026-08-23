// routes/instructorRoutes.js
const express = require("express");
const router = express.Router();
const RAGService = require("../services/RAGService");
const FreeAIService = require("../services/FreeAIService");
const { authMiddleware, instructorAuth } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Course = require("../models/Course");

// Chatbot endpoint for instructors
router.post("/chatbot", instructorAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const instructorId = req.user.id;

    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Please enter a message to chat with me!" });
    }

    // Get all courses created by this instructor from database
    let createdCourses = [];
    let context = "No course content available";
    let courseNames = [];
    
    try {
      createdCourses = await Course.find({ instructor: instructorId });
      
      if (createdCourses.length > 0) {
        courseNames = createdCourses.map(c => c.name);
        
        // Build detailed context from ALL created courses
        context = createdCourses.map(course => {
          const sessions = course.sessions?.length || 0;
          const quizzes = course.quizzes?.length || 0;
          const assignments = course.assignments?.length || 0;
          const studentsCount = course.students?.length || 0;
          const description = course.description || "";
          const syllabus = course.syllabus || "";
          const category = course.category || "";
          
          return `${course.name} (${category}): ${sessions} sessions, ${quizzes} quizzes, ${assignments} assignments, ${studentsCount} students. ${description} Syllabus: ${syllabus}`;
        }).join(" | ");
      }
    } catch (error) {
      console.log("Error fetching instructor courses:", error.message);
    }

    console.log("Processing instructor chatbot for instructor:", instructorId);
    console.log("Created courses:", courseNames);

    // Try Google Gemini first (if quota available)
    let usedGoogle = false;
    let googleReply = null;
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Include course context in the prompt
      const promptWithContext = `You are a helpful course management assistant for Edustack e-learning platform.
      
The instructor has created these courses:
${courseNames.join(", ")}

Course details:
${context}

Instructor question: ${message}

Please answer based on the instructor's created courses. If the question is about one of their courses, provide helpful information about sessions, quizzes, assignments, students, or course details.`;
      
      const result = await model.generateContent(promptWithContext);
      googleReply = result.response.text().trim();
      usedGoogle = true;
      console.log("Google Gemini response successful");
    } catch (googleError) {
      console.log("Google Gemini not available:", googleError.message);
    }

    // If Google worked, return that response
    if (usedGoogle && googleReply) {
      return res.json({ reply: googleReply });
    }

    // Fallback to free service - use flexible method with course context
    try {
      console.log("Using free AI service fallback...");
      const reply = await FreeAIService.chatFlexible(message, context, courseNames, true);
      return res.json({ reply });
    } catch (hfError) {
      console.error("Free AI Error:", hfError.message);
      return res.json({ 
        reply: `Hello! You're the instructor for ${courseNames.join(", ") || "courses"}. Ask me about your sessions, quizzes, assignments, or students!` 
      });
    }
  } catch (error) {
    console.error("Error with Instructor Chatbot:", error.message);
    
    // Fallback to free service
    try {
      const reply = await FreeAIService.chat(req.body.message);
      return res.json({ reply });
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError.message);
      return res.status(500).json({ reply: "Sorry, I couldn't process that right now! Please try again later." });
    }
  }
});

module.exports = router;