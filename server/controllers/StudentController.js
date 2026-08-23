require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Course = require("../models/Course");
const Student = require("../models/Student");

// Helper function for AI response
async function getAIResponse(prompt, apiKey) {
  const axios = require('axios');
  
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "meta-llama/llama-3.2-1b-instruct",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
    },
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    }
  );

  if (response.data?.choices?.[0]?.message?.content) {
    return response.data.choices[0].message.content;
  }
  return null;
}

async function getGeminiResponse(prompt) {
  const genKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!genKey) return null;
  const genAI = new GoogleGenerativeAI(genKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response?.text?.();
  return text ? text.trim() : null;
}

class StudentController {
  static async handleChatbot(req, res) {
    const { message } = req.body;
    const studentId = req.user.id;

    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Hello! Please enter a message." });
    }

    console.log("Processing chatbot for student:", studentId);

    let courseNames = [];
    let context = "";

    try {
      const enrolledCourses = await Course.find({ "students.studentId": studentId });
      if (enrolledCourses.length > 0) {
        courseNames = enrolledCourses.map((c) => c.name);
        context = enrolledCourses
          .map((course) => {
            return `${course.name}: ${course.sessions?.length || 0} sessions, ${course.quizzes?.length || 0} quizzes, ${course.assignments?.length || 0} assignments`;
          })
          .join(" | ");
      }
    } catch (error) {
      console.log("Error fetching courses:", error.message);
    }

    const enrollmentNote =
      courseNames.length === 0
        ? "The student is not enrolled in any courses yet. Answer helpfully; gently suggest browsing courses to enroll when relevant."
        : `Student is enrolled in: ${courseNames.join(", ")}\nCourse details: ${context}`;

    const prompt = `You are a helpful learning assistant for Edustack (e-learning).

${enrollmentNote}

User question: ${message}

Answer clearly. If the question relates to their courses, use the course details above. Otherwise give a concise, accurate general answer.`;

    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey) {
        const reply = await getAIResponse(prompt, openRouterKey);
        if (reply) {
          console.log("OpenRouter response successful (student chatbot)");
          return res.json({ reply });
        }
      }
    } catch (apiError) {
      console.log("OpenRouter error:", apiError.message);
    }

    try {
      const geminiReply = await getGeminiResponse(prompt);
      if (geminiReply) {
        console.log("Gemini response successful (student chatbot)");
        return res.json({ reply: geminiReply });
      }
    } catch (geminiError) {
      console.log("Gemini error:", geminiError.message);
    }

    return res.json({
      reply:
        "I could not reach the AI service. Add OPENROUTER_API_KEY or GOOGLE_GENAI_API_KEY to the server .env and try again.",
    });
  }

  static async getProfile(req, res) {
    try {
      const student = await Student.findById(req.user.id);
      if (!student) {
        return res.status(404).json({ status: false, message: "Student not found" });
      }
      res.json({
        username: student.username,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        dob: student.dob,
      });
    } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ status: false, message: "Error fetching profile", error: error.message });
    }
  }
}

module.exports = StudentController;
