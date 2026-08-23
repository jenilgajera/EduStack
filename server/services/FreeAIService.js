// services/FreeAIService.js
// Free AI service with strict course rules

const axios = require('axios');

class FreeAIService {
  // Check if question is related to any of the courses
  // Modified to allow ALL questions to use generative AI
  static isQuestionRelatedToCourse(question, courseNames) {
    // Allow ALL questions to use generative AI - no filtering
    return true;
  }

  // Check if answer exists in context
  static isAnswerInContext(question, context) {
    if (!context || context === "No course content available") return false;

    const q = question.toLowerCase();
    const c = context.toLowerCase();

    // Extract key terms from question (remove common words)
    const stopWords = ["what", "is", "are", "the", "a", "an", "how", "when", "where", "why", "who", "which", "can", "do", "does", "i", "my", "me", "tell", "explain", "describe", "you", "your"];
    const questionWords = q.split(" ").filter(word => !stopWords.includes(word) && word.length > 2);

    // Check if any key terms from question exist in context
    return questionWords.some(word => c.includes(word));
  }

  // Get current time-based greeting
  static getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  // Flexible chat - now handles ALL questions with generative AI
  static async chatFlexible(message, context = "", courseNames = [], isLoggedIn = true) {
    try {
      const greeting = this.getGreeting();

      // If NOT logged in - still try AI but inform
      if (!isLoggedIn) {
        // Try generative AI anyway
        const aiResponse = await this.callGenerativeAI(message, courseNames, context, "");
        if (aiResponse) return aiResponse;
        return `${greeting}! Please log in to chat with me. But feel free to ask any question!`;
      }

      // Build course info for prompt
      const courseInfo = courseNames.length > 0
        ? `Student is enrolled in: ${courseNames.join(", ")}\nCourse details: ${context}`
        : "Student is not enrolled in any courses yet.";

      // Try generative AI for ALL questions
      const aiResponse = await this.callGenerativeAI(message, courseNames, context, greeting);
      if (aiResponse) return aiResponse;

      // Fallback: still answer generically with AI
      const fallbackResponse = await this.callGenerativeAI(message, courseNames, "General questions are welcome!", greeting);
      if (fallbackResponse) return fallbackResponse;

      // Last resort - basic helpful response
      return `${greeting}! I'd be happy to help. Please try asking your question again!`;

    } catch (error) {
      console.error("AI Service Error:", error.message);
      const greeting = this.getGreeting();
      return `${greeting}! I'm here to help. What would you like to know?`;
    }
  }

  // Call generative AI (OpenRouter)
  static async callGenerativeAI(message, courseNames, context, greeting) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (apiKey) {
      try {
        const courseInfo = courseNames.length > 0
          ? `Student is enrolled in: ${courseNames.join(", ")}`
          : "Student is not enrolled in any courses yet.";

        const prompt = `You are a helpful AI assistant for Edustack e-learning platform.

${courseInfo}
${context ? `Course content: ${context}` : ""}

User question: ${message}

Please answer the question helpfully. If it's about courses, use the course info. If not, answer generally.`;

        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "anthropic/claude-3-haiku",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 250,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 20000,
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          const prefix = greeting ? `${greeting}! ` : "";
          return `${prefix}${response.data.choices[0].message.content}`;
        }
      } catch (apiError) {
        console.log("OpenRouter API error:", apiError.message);
      }
    }
    return null;
  }

  // Get general response based on context
  static getGeneralCourseResponse(question, context, courseNames, greeting) {
    const q = question.toLowerCase();
    const ctx = context.toLowerCase();
    const courses = courseNames.join(", ");

    // Quiz related
    if (q.includes("quiz")) {
      const quizMatch = ctx.match(/(\d+)\s*quizzes?/i);
      if (quizMatch) {
        return `You have ${quizMatch[1]} quiz(es) in your course(s). Access them through your course dashboard!`;
      }
      return `Check your dashboard to find quizzes in your ${courses} course(s).`;
    }

    // Session/Video related
    if (q.includes("session") || q.includes("video") || q.includes("lecture")) {
      const sessionMatch = ctx.match(/(\d+)\s*sessions?/i);
      if (sessionMatch) {
        return `Your course(s) have ${sessionMatch[1]} video session(s). Watch them in the course content section!`;
      }
      return `Video sessions are available in your course content. Check your dashboard to access them!`;
    }

    // Assignment related
    if (q.includes("assignment") || q.includes("homework")) {
      const assignmentMatch = ctx.match(/(\d+)\s*assignments?/i);
      if (assignmentMatch) {
        return `You have ${assignmentMatch[1]} assignment(s). Check your assignments section for deadlines!`;
      }
      return `Check the assignments section in your courses for homework and tasks.`;
    }

    // About course content
    if (q.includes("what") && (q.includes("course") || q.includes("learn") || q.includes("content"))) {
      return `You're enrolled in ${courses}. Each course includes video sessions, quizzes, and assignments. Check your dashboard for details!`;
    }

    // Certificate
    if (q.includes("certificate") || q.includes("completion")) {
      return `To earn your certificate, complete all sessions, quizzes, and assignments in your courses!`;
    }

    // Live sessions
    if (q.includes("live") || q.includes("schedule")) {
      return `Check your course schedule for upcoming live sessions with your instructor!`;
    }

    // Help
    if (q.includes("help") || q.includes("what can")) {
      return `I can help with questions about your ${courses} courses! Ask about sessions, quizzes, assignments, or course content.`;
    }

    // Default - provide some useful info
    return `Your courses (${courses}) include video sessions, quizzes, and assignments. What would you like to know more about?`;
  }

  // Keep original chat method for backward compatibility
  static async chat(message, context = "", courseName = "", isLoggedIn = true) {
    return this.chatFlexible(message, context, courseName ? [courseName] : [], isLoggedIn);
  }
}

module.exports = FreeAIService;