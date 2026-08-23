const { ChromaClient } = require("chromadb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Course = require("../models/Course");
const Student = require("../models/Student");
const FreeAIService = require("./FreeAIService");

// Initialize Gemini for generating responses
const getGenAI = () => new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

const COLLECTION_NAME = "edustack_content";

// ChromaDB client - lazily initialized
let chromaClient = null;
let collection = null;

const getChromaClient = () => {
  if (!chromaClient) {
    chromaClient = new ChromaClient({
      host: "localhost",
      port: 8000,
      ssl: false,
    });
  }
  return chromaClient;
};

const getCollection = async () => {
  if (!collection) {
    try {
      const client = getChromaClient();
      try {
        collection = await client.getCollection({ name: COLLECTION_NAME });
      } catch (e) {
        collection = await client.createCollection({
          name: COLLECTION_NAME,
          getOrCreate: true,
        });
      }
    } catch (error) {
      console.log("ChromaDB not available, will use fallback mode");
      return null;
    }
  }
  return collection;
};

class RAGService {
  // Extract text content from course for embedding
  static extractCourseContent(course) {
    const contentParts = [];

    // Basic course info
    contentParts.push(`Course Name: ${course.name}`);
    if (course.description) contentParts.push(`Description: ${course.description}`);
    if (course.syllabus) contentParts.push(`Syllabus: ${course.syllabus}`);
    if (course.category) contentParts.push(`Category: ${course.category}`);
    if (course.duration) contentParts.push(`Duration: ${course.duration}`);
    if (course.highlight) contentParts.push(`Highlights: ${course.highlight}`);

    // Sessions/Videos content
    if (course.sessions && course.sessions.length > 0) {
      contentParts.push("\n--- Course Sessions ---");
      course.sessions.forEach((session, index) => {
        contentParts.push(`Session ${index + 1}: ${session.name || "Untitled Session"}`);
        if (session.category) contentParts.push(`  Category: ${session.category}`);
      });
    }

    // Quizzes content
    if (course.quizzes && course.quizzes.length > 0) {
      contentParts.push("\n--- Course Quizzes ---");
      course.quizzes.forEach((quiz, index) => {
        contentParts.push(`Quiz ${index + 1}: ${quiz.title}`);
        if (quiz.timeLimit) contentParts.push(`  Time Limit: ${quiz.timeLimit} minutes`);
        if (quiz.questions) {
          quiz.questions.forEach((q, qIndex) => {
            contentParts.push(`  Question ${qIndex + 1}: ${q.question}`);
            if (q.options) {
              q.options.forEach((opt, oIndex) => {
                contentParts.push(`    Option ${oIndex + 1}: ${opt}`);
              });
            }
          });
        }
      });
    }

    // Assignments content
    if (course.assignments && course.assignments.length > 0) {
      contentParts.push("\n--- Course Assignments ---");
      course.assignments.forEach((assignment, index) => {
        contentParts.push(`Assignment ${index + 1}: ${assignment.title}`);
        if (assignment.description) contentParts.push(`  Description: ${assignment.description}`);
        if (assignment.dueDate) contentParts.push(`  Due Date: ${assignment.dueDate}`);
      });
    }

    // Live sessions content
    if (course.liveSessions && course.liveSessions.length > 0) {
      contentParts.push("\n--- Live Sessions ---");
      course.liveSessions.forEach((session, index) => {
        contentParts.push(`Session ${index + 1}: ${session.title}`);
        if (session.date) contentParts.push(`  Date: ${session.date}`);
        if (session.time) contentParts.push(`  Time: ${session.time}`);
      });
    }

    return contentParts.join("\n");
  }

  // Generate embedding for text using Gemini
  static async generateEmbedding(text) {
    try {
      const genAI = getGenAI();
      // Use text-embedding-004 model - specifically designed for embeddings
      const model = genAI.getGenerativeModel({ 
        model: "text-embedding-004",
      });
      
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.log("Embedding generation failed, will use fallback:", error.message);
      // Return null to indicate embedding failed - fallback will handle it
      return null;
    }
  }

  // Simple keyword-based search fallback (when embeddings don't work)
  static simpleSearch(enrolledCourses, query) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (const course of enrolledCourses) {
      let score = 0;
      const matches = [];

      // Check course name
      if (course.name && course.name.toLowerCase().includes(queryLower)) {
        score += 10;
        matches.push(`Course name: ${course.name}`);
      }

      // Check category
      if (course.category && course.category.toLowerCase().includes(queryLower)) {
        score += 5;
        matches.push(`Category: ${course.category}`);
      }

      // Check description
      if (course.description && course.description.toLowerCase().includes(queryLower)) {
        score += 8;
        matches.push(`Description: ${course.description}`);
      }

      // Check syllabus
      if (course.syllabus && course.syllabus.toLowerCase().includes(queryLower)) {
        score += 6;
        matches.push(`Syllabus: ${course.syllabus}`);
      }

      // Check session names
      if (course.sessions) {
        course.sessions.forEach((session, idx) => {
          if (session.name && session.name.toLowerCase().includes(queryLower)) {
            score += 3;
            matches.push(`Session ${idx + 1}: ${session.name}`);
          }
        });
      }

      // Check quiz titles
      if (course.quizzes) {
        course.quizzes.forEach((quiz, idx) => {
          if (quiz.title && quiz.title.toLowerCase().includes(queryLower)) {
            score += 4;
            matches.push(`Quiz ${idx + 1}: ${quiz.title}`);
          }
        });
      }

      // Check assignment titles
      if (course.assignments) {
        course.assignments.forEach((assignment, idx) => {
          if (assignment.title && assignment.title.toLowerCase().includes(queryLower)) {
            score += 4;
            matches.push(`Assignment ${idx + 1}: ${assignment.title}`);
          }
        });
      }

      if (score > 0) {
        results.push({ course, score, matches });
      }
    }

    // Sort by score and return top results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 3);
  }

  // Embed and store course content in ChromaDB
  static async embedCourse(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      const coll = await getCollection();
      if (!coll) {
        throw new Error("ChromaDB not available");
      }

      const content = this.extractCourseContent(course);
      const embedding = await this.generateEmbedding(content);
      
      if (!embedding) {
        throw new Error("Failed to generate embedding");
      }

      // Add to ChromaDB with course ID as metadata
      await coll.add({
        ids: [courseId.toString()],
        embeddings: [embedding],
        documents: [content],
        metadatas: [
          {
            courseId: courseId.toString(),
            courseName: course.name,
            category: course.category || "General",
          },
        ],
      });

      console.log(`Course ${courseId} embedded successfully`);
      return { success: true, courseId };
    } catch (error) {
      console.error("Error embedding course:", error);
      throw error;
    }
  }

  // Embed all courses (for initial setup)
  static async embedAllCourses() {
    try {
      const courses = await Course.find({});
      console.log(`Found ${courses.length} courses to embed`);

      for (const course of courses) {
        try {
          await this.embedCourse(course._id);
        } catch (e) {
          console.log(`Failed to embed course ${course._id}:`, e.message);
        }
      }

      return { success: true, count: courses.length };
    } catch (error) {
      console.error("Error embedding all courses:", error);
      throw error;
    }
  }

  // Query relevant course content based on student enrolled courses
  static async queryRelevantContent(studentId, query) {
    try {
      // Get student's enrolled courses
      const enrolledCourses = await Course.find({
        "students.studentId": studentId,
      });

      if (enrolledCourses.length === 0) {
        return {
          context: "No courses enrolled yet. Please enroll in courses to get personalized help.",
          courses: [],
        };
      }

      // Try ChromaDB first, then fallback to simple search
      let relevantContent = [];
      let usedFallback = false;
      
      try {
        const coll = await getCollection();
        if (coll) {
          const queryEmbedding = await this.generateEmbedding(query);
          
          // Skip ChromaDB if embedding generation failed
          if (!queryEmbedding) {
            console.log("Embedding generation failed, using simple search fallback");
            usedFallback = true;
          } else {
            const courseIds = enrolledCourses.map((c) => c._id.toString());
            
            const results = await coll.query({
              queryEmbeddings: [queryEmbedding],
              nResults: 3,
              where: {
                courseId: { $in: courseIds },
              },
            });

            if (results.documents && results.documents[0]) {
              relevantContent = results.documents[0];
            }
          }
        }
      } catch (chromaError) {
        console.log("ChromaDB query failed, using fallback:", chromaError.message);
        usedFallback = true;
      }

      // Use simple search fallback if ChromaDB didn't work
      if (relevantContent.length === 0 && (usedFallback || !collection)) {
        const searchResults = this.simpleSearch(enrolledCourses, query);
        if (searchResults.length > 0) {
          relevantContent = searchResults.map(r => {
            let text = `Course: ${r.course.name}`;
            if (r.course.description) text += `\nDescription: ${r.course.description}`;
            if (r.course.syllabus) text += `\nSyllabus: ${r.course.syllabus}`;
            if (r.course.sessions?.length) text += `\nSessions: ${r.course.sessions.length} videos`;
            if (r.course.quizzes?.length) text += `\nQuizzes: ${r.course.quizzes.length}`;
            if (r.course.assignments?.length) text += `\nAssignments: ${r.course.assignments.length}`;
            return text;
          });
        }
      }

      // Build context from enrolled courses
      let context = "";
      if (relevantContent.length > 0) {
        context = relevantContent.join("\n\n");
      } else {
        // Fallback: provide info about enrolled courses
        context = "Student is enrolled in the following courses:\n";
        enrolledCourses.forEach((course, index) => {
          context += `${index + 1}. ${course.name} - ${course.category || "General"}\n`;
          if (course.description) {
            context += `   Description: ${course.description}\n`;
          }
          if (course.syllabus) {
            context += `   Syllabus: ${course.syllabus}\n`;
          }
          if (course.sessions?.length) {
            context += `   Sessions: ${course.sessions.length} video sessions available\n`;
          }
          if (course.quizzes?.length) {
            context += `   Quizzes: ${course.quizzes.length} quizzes available\n`;
          }
          if (course.assignments?.length) {
            context += `   Assignments: ${course.assignments.length} assignments\n`;
          }
          if (course.liveSessions?.length) {
            context += `   Live Sessions: ${course.liveSessions.length} scheduled sessions\n`;
          }
        });
      }

      return {
        context,
        courses: enrolledCourses.map((c) => ({
          id: c._id,
          name: c.name,
          category: c.category,
        })),
      };
    } catch (error) {
      console.error("Error querying relevant content:", error);
      throw error;
    }
  }

  // Generate response using RAG
  static async generateRAGResponse(studentId, userQuery) {
    // Get relevant context from enrolled courses
    const { context, courses } = await this.queryRelevantContent(studentId, userQuery);

    // Try Google Gemini first
    try {
      // Create prompt with context
      const prompt = `You are a helpful course assistant for Edustack learning platform. 
      
You are helping a student who is enrolled in the following courses:
${courses.map((c) => `- ${c.name} (${c.category})`).join("\n")}

Relevant course content from their enrolled courses:
${context}

Student's question: ${userQuery}

Instructions:
1. Use the course content provided above to answer the question
2. If the question is related to their courses, provide specific information from the course content
3. If the question is not related to courses, you can answer generally but still be helpful
4. Be friendly, concise, and educational
5. If you cannot find relevant information in the course content, provide a general helpful response

Answer:`;

      // Generate response using Gemini
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.9,
          topP: 1,
          topK: 1,
        }
      });
      const result = await model.generateContent(prompt);
      const reply = result.response.text().trim();

      return {
        reply,
        courses: courses.map((c) => c.name),
      };
    } catch (error) {
      console.error("Gemini API failed, using free fallback:", error.message);
      
      // Use free AI service as fallback
      const reply = await FreeAIService.chat(userQuery, context);
      
      return {
        reply,
        courses: courses.map((c) => c.name),
      };
    }
  }

  // ===================== INSTRUCTOR METHODS =====================

  // Get instructor's created courses
  static async getInstructorCourses(instructorId) {
    try {
      const courses = await Course.find({ instructor: instructorId });
      return courses;
    } catch (error) {
      console.error("Error getting instructor courses:", error);
      throw error;
    }
  }

  // Query relevant content for instructor (their created courses)
  static async queryInstructorContent(instructorId, query) {
    try {
      const instructorCourses = await this.getInstructorCourses(instructorId);

      if (instructorCourses.length === 0) {
        return {
          context: "You haven't created any courses yet. Create courses to get AI assistance for managing them.",
          courses: [],
        };
      }

      // Try ChromaDB first, then fallback to simple search
      let relevantContent = [];
      let usedFallback = false;

      try {
        const coll = await getCollection();
        if (coll) {
          const queryEmbedding = await this.generateEmbedding(query);

          if (!queryEmbedding) {
            console.log("Embedding generation failed for instructor, using simple search");
            usedFallback = true;
          } else {
            const courseIds = instructorCourses.map((c) => c._id.toString());

            const results = await coll.query({
              queryEmbeddings: [queryEmbedding],
              nResults: 3,
              where: {
                courseId: { $in: courseIds },
              },
            });

            if (results.documents && results.documents[0]) {
              relevantContent = results.documents[0];
            }
          }
        }
      } catch (chromaError) {
        console.log("ChromaDB query failed for instructor:", chromaError.message);
        usedFallback = true;
      }

      // Use simple search fallback
      if (relevantContent.length === 0) {
        const searchResults = this.simpleSearch(instructorCourses, query);
        if (searchResults.length > 0) {
          relevantContent = searchResults.map((r) => {
            let text = `Course: ${r.course.name}`;
            if (r.course.description) text += `\nDescription: ${r.course.description}`;
            if (r.course.syllabus) text += `\nSyllabus: ${r.course.syllabus}`;
            if (r.course.sessions?.length) text += `\nSessions: ${r.course.sessions.length} videos`;
            if (r.course.quizzes?.length) text += `\nQuizzes: ${r.course.quizzes.length}`;
            if (r.course.students?.length) text += `\nEnrolled Students: ${r.course.students.length}`;
            if (r.course.assignments?.length) text += `\nAssignments: ${r.course.assignments.length}`;
            if (r.course.liveSessions?.length) text += `\nLive Sessions: ${r.course.liveSessions.length}`;
            return text;
          });
        }
      }

      // Build context
      let context = "";
      if (relevantContent.length > 0) {
        context = relevantContent.join("\n\n");
      } else {
        context = "You are an instructor with the following courses:\n";
        instructorCourses.forEach((course, index) => {
          context += `${index + 1}. ${course.name} - ${course.category || "General"}\n`;
          if (course.description) {
            context += `   Description: ${course.description}\n`;
          }
          if (course.students?.length) {
            context += `   Students enrolled: ${course.students.length}\n`;
          }
          if (course.sessions?.length) {
            context += `   Sessions: ${course.sessions.length} videos\n`;
          }
          if (course.quizzes?.length) {
            context += `   Quizzes: ${course.quizzes.length}\n`;
          }
          if (course.assignments?.length) {
            context += `   Assignments: ${course.assignments.length}\n`;
          }
        });
      }

      return {
        context,
        courses: instructorCourses.map((c) => ({
          id: c._id,
          name: c.name,
          category: c.category,
          studentCount: c.students?.length || 0,
        })),
      };
    } catch (error) {
      console.error("Error querying instructor content:", error);
      throw error;
    }
  }

  // Generate response for instructor
  static async generateInstructorRAGResponse(instructorId, userQuery) {
    const { context, courses } = await this.queryInstructorContent(instructorId, userQuery);

    // Try Google Gemini first
    try {
      const prompt = `You are a helpful course management assistant for Edustack learning platform.

You are helping an instructor who has created the following courses:
${courses.map((c) => `- ${c.name} (${c.category || "General"}) - ${c.studentCount} students`).join("\n")}

Relevant course content from their created courses:
${context}

Instructor's question: ${userQuery}

Instructions:
1. Use the course content provided above to answer questions about their courses
2. Help with course management topics like adding sessions, quizzes, assignments, managing students
3. If the question is about a specific course, provide relevant details
4. If the question is not related to course management, you can answer generally but still be helpful
5. Be friendly, concise, and helpful
6. If you cannot find relevant information, provide a general helpful response

Answer:`;

      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.9,
          topP: 1,
          topK: 1,
        }
      });
      const result = await model.generateContent(prompt);
      const reply = result.response.text().trim();

      return {
        reply,
        courses: courses.map((c) => c.name),
      };
    } catch (error) {
      console.error("Gemini API failed for instructor, using free fallback:", error.message);
      
      // Use free AI service as fallback
      const reply = await FreeAIService.chat(userQuery, context);
      
      return {
        reply,
        courses: courses.map((c) => c.name),
      };
    }
  }
}

module.exports = RAGService;