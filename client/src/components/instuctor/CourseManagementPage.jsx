import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../Utility/api";
import { toast,Toaster } from "react-hot-toast";
import {
  ArrowLeft,
  Book,
  StopCircle,
  Plus,
  Upload,
  Video,
  Calendar,
  Trash2,
  PlayCircle,
  Eye,
  Users,
  UserX,
  UserCheck,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  BarChart2,
  Search,
} from "lucide-react";



const categories = [
  "Web Dev",
  "Data Science",
  "Education",
  "Marketing",
  "Cloud",
];

function CourseManagementPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [courseDetails, setCourseDetails] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    details: false,
    students: false,
    lectureType: false,
    lectures: false,
    quizzes: false,
    assignments: false,
    reports: false,
  });
  const [expandedQuizzes, setExpandedQuizzes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [liveSessionData, setLiveSessionData] = useState({
  //   title: "",
  //   date: "",
  //   time: "",
  //   sessionId: "",
  // });
  const [newSession, setNewSession] = useState({
    title: "",
    date: "",
    time: "",
  });
  const [quizData, setQuizData] = useState({ title: "", timeLimit: 20 });
  const [course, setCourse] = useState(null);
  const [questionData, setQuestionData] = useState({
    quizId: null,
    question: "",
    options: "",
    correctAnswer: "",
  });
  const [sessionName, setSessionName] = useState("");
  const [showStudentPanel, setShowStudentPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionCategory, setSessionCategory] = useState(""); // Single state for custom category
  const [expandedCategories, setExpandedCategories] = useState({}); // Track expanded folders

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${courseId}`);
        setCourse(response.data);
        // console.log("Course details fetched:", response.data);
        const normalizedBlockedStudents = (
          response.data.blockedStudents || []
        ).map((item) => {
          if (typeof item === "string") {
            return { studentId: item, name: "Unknown" };
          }
          return item;
        });
        setCourseDetails({
          ...response.data,
          lectureType: response.data.lectureType || "recorded",
          isPublic:
            response.data.isPublic !== undefined
              ? response.data.isPublic
              : true,
          blockedStudents: normalizedBlockedStudents,
          sessions: response.data.sessions.map((session) => ({
            ...session,
            category: session.category || "Uncategorized", // Default category
          })),
        });
        console.log("Updated courseDetails after fetch:", {
          ...response.data,
          blockedStudents: normalizedBlockedStudents,
        });
      } catch (err) {
        console.error(
          "Error fetching course:",
          err.response?.data || err.message
        );
        if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
            toast.error("Unauthorized, redirecting to login...");
            navigate("/login");
          } else if (err.response.status === 404) {
            setError("Course not found or you don’t have access.");
            toast.error("Course not found!");
          } else {
            setError(err.response.data?.message || "Failed to fetch course");
            toast.error("Failed to load course!");
          }
        } else {
          setError(err.message || "Network error");
          toast.error("Network error occurred!");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleQuiz = (quizId) => {
    setExpandedQuizzes((prev) => ({ ...prev, [quizId]: !prev[quizId] }));
    setQuestionData({ quizId, question: "", options: "", correctAnswer: "" });
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      console.log("Saving course details:", courseDetails);
      const response = await api.put(`/courses/${courseId}`, {
        name: courseDetails.name,
        description: courseDetails.description,
        syllabus: courseDetails.syllabus,
        isFree: courseDetails.isFree,
        price: courseDetails.isFree ? 0 : courseDetails.price,
        duration: courseDetails.duration,
        durationHours: courseDetails.durationHours,
        lessons: courseDetails.lessons,
        highlight: courseDetails.highlight,
        category: courseDetails.category,
        isPublic: courseDetails.isPublic,
      });
      setCourseDetails(response.data);
      console.log("Course details saved:", response.data);
      toast.success("Course details saved successfully!");
    } catch (error) {
      console.error(
        "Error saving course details:",
        error.response?.data || error.message
      );
      toast.error("Failed to save course details!");
    }
  };

  // const handleUploadSession = async (e) => {
  //   e.preventDefault();
  //   const fileInput = e.target.elements.file;
  //   const file = fileInput.files[0];
  //   if (file) {
  //     try {
  //       const formData = new FormData();
  //       formData.append("file", file);
  //       if (sessionName.trim() !== "") {
  //         formData.append("name", sessionName);
  //       }
  //       const response = await api.post(
  //         `/courses/${courseId}/sessions`,
  //         formData
  //       );
  //       setCourseDetails((prev) => ({
  //         ...prev,
  //         sessions: [...prev.sessions, response.data],
  //       }));
  //       console.log("Session uploaded:", response.data);
  //       toast.success("Session uploaded successfully!");
  //       setSessionName("");
  //       e.target.reset();
  //     } catch (error) {
  //       console.error(
  //         "Error uploading session:",
  //         error.response?.data || error.message
  //       );
  //       toast.error("Failed to upload session!");
  //     }
  //   }
  // };

  const handleUploadSession = async (e) => {
    e.preventDefault();
    const fileInput = e.target.elements.file;
    const file = fileInput.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (sessionName.trim() !== "") {
          formData.append("name", sessionName);
        }
        if (sessionCategory.trim() !== "") {
          formData.append("category", sessionCategory); // Category as folder name
        }
        const response = await api.post(
          `/courses/${courseId}/sessions`,
          formData
        );
        setCourseDetails((prev) => ({
          ...prev,
          sessions: [
            ...prev.sessions,
            { ...response.data, category: sessionCategory || "Uncategorized" },
          ],
        }));
        toast.success("Session uploaded successfully!");
        setSessionName("");
        setSessionCategory("");
        e.target.reset();
      } catch (error) {
        console.error(
          "Error uploading session:",
          error.response?.data || error.message
        );
        toast.promise(
          new Promise((resolve, reject) => {
            console.error("Error uploading session:", error.response?.data || error.message);
            reject();
          }),
          {
            loading: 'Saving...',
            success: 'Settings saved!',
            error: <b>Error uploading session</b>,
          }
        );
      }
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };
  const groupedSessions =
    courseDetails?.sessions.reduce((acc, session) => {
      const category = session.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(session);
      return acc;
    }, {}) || {};

  const handleDeleteSession = async (sessionId) => {
    try {
      console.log("Deleting session:", sessionId);
      await api.delete(`/courses/${courseId}/sessions/${sessionId}`);
      setCourseDetails((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s._id !== sessionId),
      }));
      toast.success("Session deleted successfully!");
    } catch (error) {
      console.error(
        "Error deleting session:",
        error.response?.data || error.message
      );
      toast.error("Failed to delete session!");
    }
  };

  // const handleScheduleLiveSession = async () => {
  //   if (
  //     !liveSessionData.title ||
  //     !liveSessionData.date ||
  //     !liveSessionData.time
  //   ) {
  //     toast.error("Please fill in all fields for the live session!");
  //     return;
  //   }
  //   try {
  //     console.log("Scheduling live session for course:", courseId);
  //     const response = await api.post(
  //       `/courses/${courseId}/live-sessions`,
  //       liveSessionData
  //     );
  //     setCourseDetails((prev) => ({
  //       ...prev,
  //       liveSessions: [...prev.liveSessions, response.data],
  //     }));
  //     toast.success("Live session scheduled successfully!");
  //     setLiveSessionData({ title: "", date: "", time: "" });
  //     await handleStartLiveSession(response.data._id);
  //   } catch (error) {
  //     console.error(
  //       "Error scheduling live session:",
  //       error.response?.data || error.message
  //     );
  //     toast.error("Failed to schedule live session!");
  //   }
  // };

  // const handleStartLiveSession = async (sessionId) => {
  //   try {
  //     console.log("Starting live session:", sessionId);
  //     const response = await api.put(
  //       `/courses/${courseId}/live-sessions/${sessionId}/start`
  //     );
  //     setCourseDetails((prev) => ({
  //       ...prev,
  //       liveSessions: prev.liveSessions.map((s) =>
  //         s._id === sessionId ? response.data : s
  //       ),
  //     }));
  //     console.log("Live session started:", response.data);
  //     toast.success("Live session started!");
  //     navigate(`/instructor/live-session/${courseId}/${sessionId}`);
  //   } catch (error) {
  //     console.error(
  //       "Error starting live session:",
  //       error.response?.data || error.message
  //     );
  //     toast.error("Failed to start live session!");
  //   }
  // };

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // const handleScheduleLiveSession = async () => {
  //   if (!liveSessionData.title || !liveSessionData.date || !liveSessionData.time) {
  //     toast.error("Please fill in all fields for the live session!");
  //     return;
  //   }
  //   if (!courseId) {
  //     toast.error("Cannot schedule session: Course ID is missing!");
  //     return;
  //   }

  //   const sessionId = generateSessionId(); // Generate unique session ID
  //   const updatedLiveSessionData = { ...liveSessionData, sessionId };
  //   console.log("Payload being sent:", updatedLiveSessionData); // Debugging

  //   try {
  //     console.log("Scheduling live session for courseId:", courseId);
  //     const response = await api.post(`/courses/${courseId}/live-sessions`, updatedLiveSessionData);

  //     setCourseDetails((prev) => ({
  //       ...prev,
  //       liveSessions: prev.liveSessions ? [...prev.liveSessions, response.data] : [response.data],
  //     }));

  //     toast.success("Live session scheduled successfully!");

  //     // ✅ Don't reset sessionId to an empty string, keep it stored for starting session
  //     setLiveSessionData({ title: "", date: "", time: "" });

  //   } catch (error) {
  //     console.error("Error scheduling live session:", error.response?.data || error.message);
  //     if (error.response?.status === 404) {
  //       toast.error("Course not found! Please check the course ID.");
  //     } else {
  //       toast.error("Failed to schedule live session!");
  //     }
  //   }
  // };

  // src/components/instructor/CourseManagementPage.jsx (partial)

  const handleScheduleLiveSession = async (e) => {
    e.preventDefault();
    if (!newSession.title || !newSession.date || !newSession.time) {
      toast.error("Please fill in all fields for the live session!");
      return;
    }
    try {
      const response = await api.post(`/courses/${courseId}/live-sessions`, newSession);
      setCourse((prev) => ({
        ...prev,
        liveSessions: [...prev.liveSessions, response.data],
      }));
      setNewSession({ title: "", date: "", time: "" });
      toast.success("Live session scheduled successfully!");
    } catch (err) {
      console.error("Error scheduling live session:", err.response?.data || err.message);
      setError("Failed to schedule session: " + err.message);
      toast.error("Failed to schedule session!");
    }
  };

 // Start Live Session
const handleStartLiveSession = async (sessionId) => {
  try {
    const response = await api.put(`/courses/${courseId}/live-sessions/${sessionId}/start`);
    setCourse((prev) => ({
      ...prev,
      liveSessions: prev.liveSessions.map((s) =>
        s.sessionId === sessionId ? { ...s, isLive: true } : s
      ),
    }));
    toast.success("Live session started!");
    navigate(`/instructor/live-session/${sessionId}`);
  } catch (err) {
    console.error("Error starting live session:", err.response?.data || err.message);
    setError("Failed to start session: " + err.message);
    toast.error("Failed to start session!");
  }
};

// End Live Session
const handleEndLiveSession = async (sessionId) => {
  try {
    const response = await api.put(`/courses/${courseId}/live-sessions/${sessionId}/end`);
    setCourse((prev) => ({
      ...prev,
      liveSessions: prev.liveSessions.map((s) =>
        s.sessionId === sessionId ? { ...s, isLive: false } : s
      ),
    }));
    toast.success("Live session ended!");
    navigate(`/instructor/manage-course/${courseId}`);
  } catch (err) {
    console.error("Error ending live session:", err.response?.data || err.message);
    setError("Failed to end session: " + err.message);
    toast.error("Failed to end session!");
  }
};

 // Delete Live Session
const handleDeleteLiveSession = async (sessionId) => {
  try {
    await api.delete(`/courses/${courseId}/live-sessions/${sessionId}`);
    setCourse((prev) => ({
      ...prev,
      liveSessions: prev.liveSessions.filter((s) => s.sessionId !== sessionId),
    }));
    toast.success("Live session deleted successfully!");
  } catch (err) {
    console.error("Error deleting live session:", err.response?.data || err.message);
    setError("Failed to delete session: " + err.message);
    toast.error("Failed to delete session!");
  }
};

  const handleViewLecture = (session) => {
    console.log("Viewing lecture:", session.name);
    window.open(session.url, "_blank");
  };

  // const handleBlockStudent = async (studentId) => {
  //   try {
  //     console.log("Blocking student:", studentId);
  //     const response = await api.put(
  //       `/courses/${courseId}/block-student/${studentId}`
  //     );
  //     setCourseDetails((prev) => ({
  //       ...prev,
  //       students: prev.students.filter(
  //         (s) => s.studentId.toString() !== studentId.toString()
  //       ),
  //       blockedStudents: [
  //         ...prev.blockedStudents,
  //         { studentId, name: response.data.student.name },
  //       ],
  //     }));
  //     console.log("Student blocked successfully");
  //     toast.success("Student blocked successfully!");
  //   } catch (error) {
  //     console.error(
  //       "Error blocking student:",
  //       error.response?.data || error.message
  //     );
  //     toast.error("Failed to block student!");
  //   }
  // };

  // const handleUnblockStudent = async (studentId) => {
  //   if (!studentId) {
  //     console.error("Cannot unblock: studentId is undefined");
  //     toast.error("Failed to unblock student: Invalid ID");
  //     return;
  //   }
  //   try {
  //     console.log("Unblocking student:", studentId);
  //     const response = await api.put(
  //       `/courses/${courseId}/unblock-student/${studentId}`
  //     );
  //     setCourseDetails((prev) => ({
  //       ...prev,
  //       blockedStudents: prev.blockedStudents.filter(
  //         (b) => b.studentId.toString() !== studentId
  //       ),
  //       students: [...prev.students, response.data.student],
  //     }));
  //     console.log("Student unblocked successfully");
  //     toast.success("Student unblocked successfully!");
  //   } catch (error) {
  //     console.error(
  //       "Error unblocking student:",
  //       error.response?.data || error.message
  //     );
  //     toast.error("Failed to unblock student!");
  //   }
  // };

  const handleBlockStudent = async (studentId) => {
    try {
      const idToBlock =
        typeof studentId === "object" ? studentId._id : studentId;
      if (!idToBlock) {
        console.error("Cannot block: studentId is undefined or invalid");
        toast.error("Failed to block student: Invalid ID");
        return;
      }
      console.log("Blocking student:", idToBlock);
      const response = await api.put(
        `/courses/${courseId}/block-student/${idToBlock}`
      );
      setCourseDetails((prev) => ({
        ...prev,
        students: prev.students.filter(
          (s) => s.studentId._id.toString() !== idToBlock.toString()
        ),
        blockedStudents: [
          ...prev.blockedStudents,
          { studentId: idToBlock, name: response.data.student.name },
        ],
      }));
      console.log("Student blocked successfully");
      toast.success("Student blocked successfully!");
    } catch (error) {
      console.error(
        "Error blocking student:",
        error.response?.data || error.message
      );
      toast.error("Failed to block student!");
    }
  };

  // const handleUnblockStudent = async (studentId) => { ok hai
  //   const idToUnblock = typeof studentId === 'object' ? studentId._id : studentId;
  //   if (!idToUnblock) {
  //     console.error("Cannot unblock: studentId is undefined or invalid");
  //     toast.error("Failed to unblock student: Invalid ID");
  //     return;
  //   }
  //   try {
  //     console.log("Unblocking student:", idToUnblock);
  //     const response = await api.put(`/courses/${courseId}/unblock-student/${idToUnblock}`);
  //     setCourseDetails((prev) => ({
  //       ...prev,
  //       blockedStudents: prev.blockedStudents.filter((b) => b.studentId.toString() !== idToUnblock.toString()),
  //       students: [...prev.students, response.data.student],
  //     }));
  //     console.log("Student unblocked successfully");
  //     toast.success("Student unblocked successfully!");
  //   } catch (error) {
  //     console.error("Error unblocking student:", error.response?.data || error.message);
  //     toast.error("Failed to unblock student!");
  //   }
  // };

  const handleUnblockStudent = async (studentId) => {
    const idToUnblock =
      typeof studentId === "object" ? studentId._id : studentId;
    if (!idToUnblock) {
      console.error("Cannot unblock: studentId is undefined or invalid");
      toast.error("Failed to unblock student: Invalid ID");
      return;
    }
    try {
      console.log("Unblocking student:", idToUnblock);
      const response = await api.put(
        `/courses/${courseId}/unblock-student/${idToUnblock}`
      );
      setCourseDetails((prev) => {
        const updatedBlocked = prev.blockedStudents.filter((b) => {
          const blockedId = b.studentId._id
            ? b.studentId._id.toString()
            : b.studentId.toString();
          return blockedId !== idToUnblock.toString();
        });
        return {
          ...prev,
          blockedStudents: updatedBlocked,
          students: [...prev.students, response.data.student],
        };
      });
      console.log("Student unblocked successfully");
      toast.success("Student unblocked successfully!");
    } catch (error) {
      console.error(
        "Error unblocking student:",
        error.response?.data || error.message
      );
      toast.error("Failed to unblock student!");
    }
  };
  const handleEnrollStudent = async (studentId) => {
    try {
      console.log("Enrolling student:", studentId);
      const response = await api.post(`/courses/${courseId}/enroll`, {
        studentId,
      });
      setCourseDetails((prev) => ({
        ...prev,
        students: [...prev.students, response.data.student],
      }));
      console.log("Student enrolled successfully");
      toast.success("Student enrolled successfully!");
    } catch (error) {
      console.error(
        "Error enrolling student:",
        error.response?.data || error.message
      );
      toast.error("Failed to enroll student!");
    }
  };

  const handleAddQuiz = async () => {
    if (!quizData.title) {
      toast.error("Please enter a quiz title!");
      return;
    }
    try {
      console.log("Adding quiz to course:", courseId);
      const response = await api.post(`/courses/${courseId}/quizzes`, {
        title: quizData.title,
        timeLimit: quizData.timeLimit,
        questions: [],
      });
      setCourseDetails((prev) => ({
        ...prev,
        quizzes: [...prev.quizzes, response.data],
      }));
      toast.success("Quiz added successfully!");
      setQuizData({ title: "", timeLimit: 20 });
      window.location.reload(); 
    } catch (error) {
      console.error(
        "Error adding quiz:",
        error.response?.data || error.message
      );
      toast.error("Failed to add quiz!");
    }
  };

  const handleAddQuestion = async (quizId) => {
    if (!quizId) {
      console.error("Cannot add question: quizId is undefined");
      toast.error("Failed to add question: No quiz selected");
      return;
    }
    if (
      !questionData.question ||
      !questionData.options ||
      !questionData.correctAnswer
    ) {
      toast.error("Please fill in all question fields!");
      return;
    }
    try {
      const options = questionData.options.split(",").map((opt) => opt.trim());
      const newQuestion = {
        question: questionData.question,
        options,
        correctAnswer: questionData.correctAnswer,
      };
      console.log("Adding question to quiz:", quizId, newQuestion);
      const response = await api.put(
        `/courses/${courseId}/quizzes/${quizId}/questions`,
        newQuestion
      );
      setCourseDetails((prev) => ({
        ...prev,
        quizzes: prev.quizzes.map((quiz) =>
          quiz._id === quizId
            ? { ...quiz, questions: [...quiz.questions, response.data] }
            : quiz
        ),
      }));
      console.log("Question added:", response.data);
      toast.success("Question added successfully!");
      setQuestionData({ quizId, question: "", options: "", correctAnswer: "" });
    } catch (error) {
      console.error(
        "Error adding question:",
        error.response?.data || error.message
      );
      toast.error("Failed to add question!");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      console.log("Deleting quiz:", quizId);
      await api.delete(`/courses/${courseId}/quizzes/${quizId}`);
      setCourseDetails((prev) => ({
        ...prev,
        quizzes: prev.quizzes.filter((q) => q._id !== quizId),
      }));
      toast.success("Quiz deleted successfully!");
    } catch (error) {
      console.error(
        "Error deleting quiz:",
        error.response?.data || error.message
      );
      toast.error("Failed to delete quiz!");
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    const { title, description, dueDate } = e.target.elements;
    const assignment = {
      title: title.value,
      description: description.value,
      dueDate: dueDate.value,
    };
    try {
      console.log("Adding assignment to course:", courseId);
      const response = await api.post(
        `/courses/${courseId}/assignments`,
        assignment
      );
      setCourseDetails((prev) => ({
        ...prev,
        assignments: [...prev.assignments, response.data],
      }));
      console.log("Assignment added:", response.data);
      toast.success("Assignment added successfully!");
      e.target.reset();
    } catch (error) {
      console.error(
        "Error adding assignment:",
        error.response?.data || error.message
      );
      toast.error("Failed to add assignment!");
    }
  };

  const handleViewSubmission = (submission) => {
    console.log("Viewing submission:", submission);
    window.open(submission.fileUrl, "_blank");
  };

  const openQuizReport = async (quizId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      const students = response.data.students || [];
      const quiz = response.data.quizzes.find((q) => q._id === quizId);
      if (!quiz) throw new Error("Quiz not found");
      const quizScores = response.data.quizScores || [];

      const attemptedStudents = quizScores
        .filter((score) => score.quizId.toString() === quizId)
        .map((score) => {
          const student = students.find(
            (s) => s.studentId._id.toString() === score.studentId.toString()
          );
          return {
            studentId: score.studentId,
            name: student ? student.name || "Unknown" : "Unknown",
            score: score.score,
          };
        });

      const remainingStudents = students
        .filter(
          (s) =>
            !quizScores.some(
              (q) =>
                q.studentId.toString() === s.studentId._id.toString() &&
                q.quizId.toString() === quizId
            )
        )
        .map((s) => ({
          studentId: s.studentId,
          name: s.name || "Unknown",
        }));

      const reportWindow = window.open("", "_blank", "width=600,height=600");
      reportWindow.document.write(`
        <html>
          <head><title>Quiz Report - ${quiz.title}</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Quiz Report</h2>
            <h3>Course: ${courseDetails?.name || courseId}</h3>
            <h3>Quiz: ${quiz.title}</h3>
            <h4>Students Attempted (${attemptedStudents.length}):</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">Student ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Score (%)</th>
              </tr>
              ${
                attemptedStudents.length > 0
                  ? attemptedStudents
                      .map(
                        (student) => `
                          <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${
                              student.studentId
                            }</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${
                              student.name
                            }</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${student.score.toFixed(
                              2
                            )}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : '<tr><td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: center;">None</td></tr>'
              }
            </table>
            <h4>Students Remaining (${remainingStudents.length}):</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">Student ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
              </tr>
              ${
                remainingStudents.length > 0
                  ? remainingStudents
                      .map(
                        (student) => `
                          <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">${student.studentId._id}</td>
                            <td style="border: 1px solid #ddd; padding: 8px;">${student.name}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : '<tr><td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: center;">None</td></tr>'
              }
            </table>
          </body>
        </html>
      `);
      reportWindow.document.close();
      console.log("Quiz report opened for quiz:", quizId);
    } catch (err) {
      console.error("Error fetching quiz report:", err.message);
      toast.error("Failed to generate quiz report");
    }
  };

  // const openAttendanceReport = async (sessionId) => {

  const openAttendanceReport = async (sessionId) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      const students = response.data.students || [];
      const session =
        response.data.sessions.find((s) => s._id === sessionId) ||
        response.data.liveSessions.find((s) => s._id === sessionId);

      const attendanceResponse = await api.get(
        `/courses/${courseId}/attendance/${sessionId}`
      );
      const attendanceData = attendanceResponse.data || {};
      const presentStudents = (attendanceData.presentStudents || []).map(
        (name) => {
          const student = students.find((s) => s.name === name);
          return {
            studentId:
              student && student.studentId
                ? student.studentId._id
                : "Unknown ID",
            name: name,
          };
        }
      );
      const absentStudents = (attendanceData.absentStudents || []).map(
        (name) => {
          const student = students.find((s) => s.name === name);
          return {
            studentId:
              student && student.studentId
                ? student.studentId._id
                : "Unknown ID",
            name: name,
          };
        }
      );

      const reportWindow = window.open("", "_blank", "width=600,height=600");
      reportWindow.document.write(`
          <html>
            <head><title>Attendance Report</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Attendance Report</h2>
              <h3>Course: ${courseDetails?.name || courseId}</h3>
              <h3>Session: ${session?.name || sessionId}</h3>
              <h4>Students Present (${presentStudents.length}):</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                  <th style="border: 1px solid #ddd; padding: 8px;">Student ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
                </tr>
                ${
                  presentStudents.length > 0
                    ? presentStudents
                        .map(
                          (student) => `
                            <tr>
                              <td style="border: 1px solid #ddd; padding: 8px;">${student.studentId}</td>
                              <td style="border: 1px solid #ddd; padding: 8px;">${student.name}</td>
                            </tr>
                          `
                        )
                        .join("")
                    : '<tr><td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: center;">None</td></tr>'
                }
              </table>
              <h4>Students Absent (${absentStudents.length}):</h4>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f0f0f0;">
                  <th style="border: 1px solid #ddd; padding: 8px;">Student ID</th>
                  <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
                </tr>
                ${
                  absentStudents.length > 0
                    ? absentStudents
                        .map(
                          (student) => `
                            <tr>
                              <td style="border: 1px solid #ddd; padding: 8px;">${student.studentId}</td>
                              <td style="border: 1px solid #ddd; padding: 8px;">${student.name}</td>
                            </tr>
                          `
                        )
                        .join("")
                    : '<tr><td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: center;">None</td></tr>'
                }
              </table>
            </body>
          </html>
        `);
      reportWindow.document.close();
      console.log("Attendance report opened for session:", sessionId);
    } catch (err) {
      console.error("Error fetching attendance report:", err.message);
      toast.error("Failed to generate attendance report");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4">Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">{error}</p>
        <Link
          to="/instructor-dashboard"
          className="text-cyan-400 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">No course data available</p>
        <Link
          to="/instructor-dashboard"
          className="text-cyan-400 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const activeStudents = courseDetails.students.filter(
    (student) =>
      !courseDetails.blockedStudents.some(
        (b) =>
          b.studentId &&
          b.studentId.toString() ===
            (student.studentId._id || student.studentId).toString()
      )
  );

  const searchedStudent =
    courseDetails.students.find(
      (student) =>
        student.studentId &&
        student.studentId._id &&
        student.studentId._id.toString() === searchQuery
    ) ||
    courseDetails.blockedStudents.find(
      (blocked) =>
        blocked.studentId && blocked.studentId.toString() === searchQuery
    );
  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
       <div> <Toaster position="top-center"  reverseOrder={false}/> </div>
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/instructor-dashboard")}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">
          Manage Course: {courseDetails.name}
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("details")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Book className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Course Details</h2>
                  </div>
                  {collapsedSections.details ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.details && (
                  <form
                    onSubmit={handleSaveDetails}
                    className="p-6 pt-0 space-y-4"
                  >
                    <input
                      type="text"
                      value={courseDetails.name}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          name: e.target.value,
                        })
                      }
                      placeholder="Course Name"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      required
                    />
                    <textarea
                      value={courseDetails.description || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          description: e.target.value,
                        })
                      }
                      placeholder="Course Description"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400 min-h-[100px]"
                      required
                      minLength={10}
                      maxLength={500}
                    />
                    <textarea
                      value={courseDetails.syllabus || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          syllabus: e.target.value,
                        })
                      }
                      placeholder="Course Syllabus"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400 min-h-[150px]"
                      required
                    />
                    <input
                      type="text"
                      value={courseDetails.duration || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          duration: e.target.value,
                        })
                      }
                      placeholder="Duration (e.g., '12 weeks')"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="number"
                      value={courseDetails.durationHours || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          durationHours: e.target.value,
                        })
                      }
                      placeholder="Duration Hours (e.g., 48)"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      min="0"
                    />
                    <input
                      type="number"
                      value={courseDetails.lessons || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          lessons: e.target.value,
                        })
                      }
                      placeholder="Number of Lessons (e.g., 36)"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      min="0"
                    />
                    <input
                      type="text"
                      value={courseDetails.highlight || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          highlight: e.target.value,
                        })
                      }
                      placeholder="Highlight (e.g., 'Intermediate')"
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                    />
                    <select
                      value={courseDetails.category || ""}
                      onChange={(e) =>
                        setCourseDetails({
                          ...courseDetails,
                          category: e.target.value,
                        })
                      }
                      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={courseDetails.isFree}
                          onChange={(e) =>
                            setCourseDetails({
                              ...courseDetails,
                              isFree: e.target.checked,
                              price: e.target.checked
                                ? ""
                                : courseDetails.price,
                            })
                          }
                          className="bg-gray-800 border-gray-700 text-cyan-400 focus:ring-cyan-400"
                        />
                        Free Course
                      </label>
                      {!courseDetails.isFree && (
                        <input
                          type="number"
                          value={courseDetails.price || ""}
                          onChange={(e) =>
                            setCourseDetails({
                              ...courseDetails,
                              price: e.target.value,
                            })
                          }
                          placeholder="Price (e.g., 8200)"
                          className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                          min="0"
                          step="1"
                          required={!courseDetails.isFree}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={courseDetails.isPublic}
                          onChange={(e) =>
                            setCourseDetails({
                              ...courseDetails,
                              isPublic: e.target.checked,
                            })
                          }
                          className="bg-gray-800 border-gray-700 text-cyan-400 focus:ring-cyan-400"
                        />
                        Public Course
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-cyan-600 px-6 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("students")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Manage Students</h2>
                  </div>
                  {collapsedSections.students ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.students && (
                  <div className="p-6 pt-0 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-100">
                        Enrolled Students
                      </h3>
                      <button
                        onClick={() => setShowStudentPanel(!showStudentPanel)}
                        className="bg-cyan-600 px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" /> Search Students
                      </button>
                    </div>
                    {showStudentPanel && (
                      <div className="bg-gray-800 p-4 rounded-md space-y-4">
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter Student ID"
                            className="w-full bg-gray-700 rounded-md p-2 pl-10 text-gray-200 border border-gray-600 focus:outline-none focus:border-cyan-400"
                          />
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          {searchQuery && searchedStudent ? (
                            <div className="flex items-center justify-between p-2 bg-gray-900 rounded-md">
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {searchedStudent.name || "Unknown"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ID:{" "}
                                  {searchedStudent.studentId._id ||
                                    searchedStudent.studentId}{" "}
                                  {/* Handle both cases */}
                                </span>
                              </div>
                              {courseDetails.blockedStudents.some(
                                (b) =>
                                  b.studentId.toString() ===
                                  (
                                    searchedStudent.studentId._id ||
                                    searchedStudent.studentId
                                  ).toString()
                              ) ? (
                                <button
                                  onClick={() =>
                                    handleUnblockStudent(
                                      searchedStudent.studentId._id ||
                                        searchedStudent.studentId
                                    )
                                  }
                                  className="text-green-400 hover:text-green-300"
                                  title={`Unblock ${
                                    searchedStudent.name || "Student"
                                  }`}
                                >
                                  <UserCheck className="h-4 w-4" />
                                </button>
                              ) : activeStudents.some(
                                  (s) =>
                                    s.studentId._id.toString() ===
                                    (
                                      searchedStudent.studentId._id ||
                                      searchedStudent.studentId
                                    ).toString()
                                ) ? (
                                <button
                                  onClick={() =>
                                    handleBlockStudent(
                                      searchedStudent.studentId._id ||
                                        searchedStudent.studentId
                                    )
                                  }
                                  className="text-red-400 hover:text-red-300"
                                  title={`Block ${
                                    searchedStudent.name || "Student"
                                  }`}
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleEnrollStudent(
                                      searchedStudent.studentId._id ||
                                        searchedStudent.studentId
                                    )
                                  }
                                  className="text-green-400 hover:text-green-300"
                                  title={`Enroll ${
                                    searchedStudent.name || "Student"
                                  }`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ) : searchQuery ? (
                            <p className="text-gray-400 text-sm">
                              No student found with ID: {searchQuery}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-sm">
                              Enter a Student ID to search
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      <h3 className="text-lg font-semibold text-gray-100">
                        Enrolled Students
                      </h3>
                      {activeStudents.length > 0 ? (
                        activeStudents.map((student) => {
                          const studentId =
                            student.studentId._id || student.studentId; // Handle object or string
                          return (
                            <div
                              key={studentId} // Use the resolved ID
                              className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {student.name || "Unknown"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ID: {studentId} | Grade:{" "}
                                  {student.grade || "N/A"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Email: {student.studentId.email || "N/A"}
                                </span>
                              </div>
                              <button
                                onClick={() => handleBlockStudent(studentId)}
                                className="text-red-400 hover:text-red-300"
                                title={`Block ${student.name || "Student"}`}
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No students enrolled yet.
                        </p>
                      )}

                      <h3 className="text-lg font-semibold text-gray-100 mt-4">
                        Blocked Students
                      </h3>
                      {courseDetails.blockedStudents.length > 0 ? (
                        courseDetails.blockedStudents.map((blocked) => {
                          const blockedId =
                            blocked.studentId._id || blocked.studentId; // Handle object or string
                          return (
                            <div
                              key={blockedId} // Use the resolved ID
                              className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {blocked.name || "Unknown"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  ID: {blockedId}
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnblockStudent(blockedId)}
                                className="text-green-400 hover:text-green-300"
                                title={`Unblock ${blocked.name || "Student"}`}
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No students blocked yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("lectureType")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Lecture Type</h2>
                  </div>
                  {collapsedSections.lectureType ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.lectureType && (
                  <div className="p-6 pt-0">
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setCourseDetails({
                            ...courseDetails,
                            lectureType: "recorded",
                          })
                        }
                        className={`flex-1 p-3 rounded-md ${
                          courseDetails.lectureType === "recorded"
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        } transition-all duration-300`}
                      >
                        Recorded Lectures
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseDetails({
                            ...courseDetails,
                            lectureType: "live",
                          })
                        }
                        className={`flex-1 p-3 rounded-md ${
                          courseDetails.lectureType === "live"
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        } transition-all duration-300`}
                      >
                        Live Lectures
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("lectures")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    {courseDetails.lectureType === "recorded" ? (
                      <Video className="h-6 w-6 text-cyan-400" />
                    ) : (
                      <Calendar className="h-6 w-6 text-cyan-400" />
                    )}
                    <h2 className="text-2xl font-bold">
                      {courseDetails.lectureType === "recorded"
                        ? "Manage Recorded Lectures"
                        : "Manage Live Lectures"}
                    </h2>
                  </div>
                  {collapsedSections.lectures ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.lectures && (
                  <div className="p-6 pt-0">
                    {courseDetails.lectureType === "recorded" ? (
                      // <>
                      //   <form
                      //     onSubmit={handleUploadSession}
                      //     className="space-y-4 mb-4"
                      //   >
                      //     <input
                      //       type="text"
                      //       value={sessionName}
                      //       onChange={(e) => setSessionName(e.target.value)}
                      //       placeholder="Session Name (optional)"
                      //       className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      //     />
                      //     <input
                      //       type="file"
                      //       name="file"
                      //       accept="video/*"
                      //       className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      //       required
                      //     />
                      //     <button
                      //       type="submit"
                      //       className="w-full bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium flex items-center justify-center gap-2"
                      //     >
                      //       <Upload className="h-4 w-4" /> Upload Session
                      //     </button>
                      //   </form>
                      //   <div className="space-y-2 max-h-60 overflow-y-auto">
                      //     {courseDetails.sessions.length > 0 ? (
                      //       courseDetails.sessions.map((session) => (
                      //         <div
                      //           key={session._id}
                      //           className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
                      //         >
                      //           <span className="text-sm truncate">
                      //             {session.name}
                      //           </span>
                      //           <div className="flex gap-2">
                      //             <button
                      //               onClick={() => handleViewLecture(session)}
                      //               className="text-cyan-400 hover:text-cyan-300"
                      //               title="View Lecture"
                      //             >
                      //               <Eye className="h-4 w-4" />
                      //             </button>
                      //             <button
                      //               onClick={() =>
                      //                 openAttendanceReport(session._id)
                      //               }
                      //               className="text-cyan-400 hover:text-cyan-300"
                      //               title="Attendance Report"
                      //             >
                      //               <Users className="h-4 w-4" />
                      //             </button>
                      //             <button
                      //               onClick={() =>
                      //                 handleDeleteSession(session._id)
                      //               }
                      //               className="text-red-400 hover:text-red-300"
                      //               title="Delete Lecture"
                      //             >
                      //               <Trash2 className="h-4 w-4" />
                      //             </button>
                      //           </div>
                      //         </div>
                      //       ))
                      //     ) : (
                      //       <p className="text-gray-400 text-sm">
                      //         No recorded lectures uploaded yet.
                      //       </p>
                      //     )}
                      //   </div>
                      // </>
                      <>
                        <form
                          onSubmit={handleUploadSession}
                          className="space-y-4 mb-4"
                        >
                          <input
                            type="text"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Session Name "
                            className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                          />
                          <input
                            type="text"
                            value={sessionCategory}
                            onChange={(e) => setSessionCategory(e.target.value)}
                            placeholder="Category/Folder"
                            className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                          />
                          <input
                            type="file"
                            name="file"
                            accept="video/*"
                            className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                            required
                          />
                          <button
                            type="submit"
                            className="w-full bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" /> Upload Session
                          </button>
                        </form>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {Object.keys(groupedSessions).length > 0 ? (
                            Object.entries(groupedSessions).map(
                              ([category, sessions]) => (
                                <div
                                  key={category}
                                  className="bg-gray-800 rounded-md"
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-2 text-gray-100 hover:bg-gray-700 transition-all duration-300"
                                  >
                                    <span className="text-sm font-semibold truncate">
                                      {category}
                                    </span>
                                    {expandedCategories[category] ? (
                                      <ChevronUp className="h-4 w-4 text-cyan-400" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-cyan-400" />
                                    )}
                                  </button>
                                  {expandedCategories[category] && (
                                    <div className="space-y-1 pl-4">
                                      {sessions.map((session) => (
                                        <div
                                          key={session._id}
                                          className="flex items-center justify-between p-2 bg-gray-700 rounded-md"
                                        >
                                          <span className="text-sm truncate">
                                            {session.name}
                                          </span>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() =>
                                                handleViewLecture(session)
                                              }
                                              className="text-cyan-400 hover:text-cyan-300"
                                              title="View Lecture"
                                            >
                                              <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                openAttendanceReport(
                                                  session._id
                                                )
                                              }
                                              className="text-cyan-400 hover:text-cyan-300"
                                              title="Attendance Report"
                                            >
                                              <Users className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDeleteSession(session._id)
                                              }
                                              className="text-red-400 hover:text-red-300"
                                              title="Delete Lecture"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-gray-400 text-sm">
                              No recorded lectures uploaded yet.
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      // <>
                      //   <div className="space-y-4 mb-4">
                      //     <input
                      //       type="text"
                      //       value={liveSessionData.title}
                      //       onChange={(e) =>
                      //         setLiveSessionData({
                      //           ...liveSessionData,
                      //           title: e.target.value,
                      //         })
                      //       }
                      //       placeholder="Session Title"
                      //       className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      //       required
                      //     />
                      //     <div className="grid grid-cols-2 gap-4">
                      //       <input
                      //         type="date"
                      //         value={liveSessionData.date}
                      //         onChange={(e) =>
                      //           setLiveSessionData({
                      //             ...liveSessionData,
                      //             date: e.target.value,
                      //           })
                      //         }
                      //         className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      //         required
                      //       />
                      //       <input
                      //         type="time"
                      //         value={liveSessionData.time}
                      //         onChange={(e) =>
                      //           setLiveSessionData({
                      //             ...liveSessionData,
                      //             time: e.target.value,
                      //           })
                      //         }
                      //         className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                      //         required
                      //       />
                      //     </div>
                      //     <button
                      //       type="button"
                      //       onClick={handleScheduleLiveSession}
                      //       className="w-full bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium"
                      //     >
                      //       Schedule Live Session
                      //     </button>
                      //   </div>
                      //   <div className="space-y-2 max-h-60 overflow-y-auto">
                      //     {courseDetails.liveSessions.length > 0 ? (
                      //       courseDetails.liveSessions.map((session) => (
                      //         <div
                      //           key={session._id}
                      //           className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
                      //         >
                      //           <div className="flex flex-col">
                      //             <span className="text-sm truncate">
                      //               {session.title}
                      //             </span>
                      //             <span className="text-xs text-gray-400">
                      //               {session.date} {session.time} -{" "}
                      //               {session.isLive ? "Live Now" : "Scheduled"}{" "}
                      //               -{" "}
                      //               <a
                      //                 href={session.link}
                      //                 target="_blank"
                      //                 rel="noopener noreferrer"
                      //                 className="text-cyan-400 hover:underline"
                      //               >
                      //                 Join
                      //               </a>
                      //             </span>
                      //           </div>
                      //           <div className="flex gap-2">
                      //             {session.isLive ? (
                      //               <button
                      //                 onClick={() =>
                      //                   handleEndLiveSession(session._id)
                      //                 }
                      //                 className="text-red-400 hover:text-red-300"
                      //                 title="End Live Session"
                      //               >
                      //                 <Trash2 className="h-4 w-4" />
                      //               </button>
                      //             ) : (
                      //               <button
                      //                 onClick={() =>
                      //                   handleStartLiveSession(session._id)
                      //                 }
                      //                 className="text-green-400 hover:text-green-300"
                      //                 title="Start Live Session"
                      //               >
                      //                 <PlayCircle className="h-4 w-4" />
                      //               </button>
                      //             )}
                      //             <button
                      //               onClick={() =>
                      //                 openAttendanceReport(session._id)
                      //               }
                      //               className="text-cyan-400 hover:text-cyan-300"
                      //               title="Attendance Report"
                      //             >
                      //               <Users className="h-4 w-4" />
                      //             </button>
                      //             <button
                      //               onClick={() =>
                      //                 handleDeleteLiveSession(session._id)
                      //               }
                      //               className="text-red-400 hover:text-red-300"
                      //               title="Delete Live Session"
                      //             >
                      //               <Trash2 className="h-4 w-4" />
                      //             </button>
                      //           </div>
                      //         </div>
                      //       ))
                      //     ) : (
                      //       <p className="text-gray-400 text-sm">
                      //         No live lectures scheduled yet.
                      //       </p>
                      //     )}
                      //   </div>
                      // </>
                      <>
                       <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3 mb-4">
    <Calendar className="h-6 w-6 text-cyan-400" /> Live Sessions
  </h2>
  <form onSubmit={handleScheduleLiveSession} className="space-y-4 mb-4">
    <input
      type="text"
      value={newSession.title}
      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
      placeholder="Session Title"
      className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
      required
    />
    <div className="grid grid-cols-2 gap-4">
      <input
        type="date"
        value={newSession.date}
        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
        className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
        required
      />
      <input
        type="time"
        value={newSession.time}
        onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
        className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
        required
      />
    </div>
    <button
      type="submit"
      className="w-full bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium"
    >
      Schedule Live Session
    </button>
  </form>
  <div className="space-y-2 max-h-60 overflow-y-auto">
    {course?.liveSessions?.length > 0 ? (
      course.liveSessions.map((session) => (
        <div key={session.sessionId} className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
          <div className="flex flex-col">
            <span className="text-sm truncate">{session.title}</span>
            <span className="text-xs text-gray-400">
              {session.date} {session.time} - {session.isLive ? "Live Now" : "Scheduled"} - Session ID:{" "}
              <span className="text-cyan-400">{session.sessionId}</span>
            </span>
          </div>
          <div className="flex gap-2">
            {session.isLive ? (
              <button
                onClick={() => handleEndLiveSession(session.sessionId)}
                className="text-red-400 hover:text-red-300"
                title="End Live Session"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleStartLiveSession(session.sessionId)}
                className="text-green-400 hover:text-green-300"
                title="Start Live Session"
              >
                <PlayCircle className="h-4 w-4" />
              </button>
            )}
            {/* Assuming openAttendanceReport is defined elsewhere */}
            <button
              onClick={() => openAttendanceReport(session.sessionId)}
              className="text-cyan-400 hover:text-cyan-300"
              title="Attendance Report"
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteLiveSession(session.sessionId)}
              className="text-red-400 hover:text-red-300"
              title="Delete Live Session"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-sm">No live lectures scheduled yet.</p>
    )}
  </div>
</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("reports")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Quiz Reports</h2>
                  </div>
                  {collapsedSections.reports ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.reports && (
                  <div className="p-6 pt-0 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-100">
                      Quiz Reports
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {courseDetails.quizzes.length > 0 ? (
                        courseDetails.quizzes.map((quiz) => (
                          <div
                            key={quiz._id}
                            className="flex items-center justify-between p-2 bg-gray-800 rounded-md"
                          >
                            <span className="text-sm truncate">
                              {quiz.title}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openQuizReport(quiz._id)}
                                className="text-cyan-400 hover:text-cyan-300"
                                title="Quiz Report"
                              >
                                <HelpCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No quizzes available for reporting.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 lg:col-span-1">
              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("quizzes")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Manage Quizzes</h2>
                  </div>
                  {collapsedSections.quizzes ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.quizzes && (
                  <div className="p-6 pt-0 space-y-4">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={quizData.title}
                          onChange={(e) =>
                            setQuizData({ ...quizData, title: e.target.value })
                          }
                          placeholder="Quiz Title (e.g., 'Week 1 Quiz')"
                          className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                        />
                        <input
                          type="number"
                          value={quizData.timeLimit}
                          onChange={(e) =>
                            setQuizData({
                              ...quizData,
                              timeLimit: Number(e.target.value),
                            })
                          }
                          placeholder="Time Limit (minutes)"
                          className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                          min="1"
                        />
                        <button
                          onClick={handleAddQuiz}
                          className="bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium flex items-center gap-2"
                          title="Add a new quiz"
                        >
                          <Plus className="h-4 w-4" /> Add Quiz
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Enter a title and time limit to create a quiz. Questions
                        can be added below.
                      </p>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {courseDetails.quizzes.length > 0 ? (
                        courseDetails.quizzes.map((quiz) => (
                          <div
                            key={quiz._id}
                            className="bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center justify-between p-2">
                              <span className="text-sm truncate">
                                {quiz.title} ({quiz.timeLimit} min)
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleQuiz(quiz._id)}
                                  className="text-cyan-400 hover:text-cyan-300"
                                  title="Edit Quiz Questions"
                                >
                                  {expandedQuizzes[quiz._id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteQuiz(quiz._id)}
                                  className="text-red-400 hover:text-red-300"
                                  title="Delete Quiz"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            {expandedQuizzes[quiz._id] && (
                              <div className="p-2 space-y-2">
                                {quiz.questions.length > 0 ? (
                                  quiz.questions.map((q, index) => (
                                    <div
                                      key={index}
                                      className="text-xs text-gray-400"
                                    >
                                      <p>{q.question}</p>
                                      <p>Options: {q.options.join(", ")}</p>
                                      <p>Correct: {q.correctAnswer}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-400 text-xs">
                                    No questions yet.
                                  </p>
                                )}
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={questionData.question}
                                    onChange={(e) =>
                                      setQuestionData({
                                        ...questionData,
                                        question: e.target.value,
                                      })
                                    }
                                    placeholder="Question"
                                    className="w-full bg-gray-900 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                                  />
                                  <input
                                    type="text"
                                    value={questionData.options}
                                    onChange={(e) =>
                                      setQuestionData({
                                        ...questionData,
                                        options: e.target.value,
                                      })
                                    }
                                    placeholder="Options (comma-separated)"
                                    className="w-full bg-gray-900 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                                  />
                                  <input
                                    type="text"
                                    value={questionData.correctAnswer}
                                    onChange={(e) =>
                                      setQuestionData({
                                        ...questionData,
                                        correctAnswer: e.target.value,
                                      })
                                    }
                                    placeholder="Correct Answer"
                                    className="w-full bg-gray-900 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                                  />
                                  <button
                                    onClick={() => handleAddQuestion(quiz._id)}
                                    className="w-full bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium flex items-center justify-center gap-2"
                                  >
                                    <Plus className="h-4 w-4" /> Add Question
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No quizzes created yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800">
                <button
                  type="button"
                  onClick={() => toggleSection("assignments")}
                  className="w-full flex items-center justify-between p-6 text-gray-100 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Manage Assignments</h2>
                  </div>
                  {collapsedSections.assignments ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {!collapsedSections.assignments && (
                  <div className="p-6 pt-0 space-y-4">
                    <form onSubmit={handleAddAssignment} className="space-y-4">
                      <input
                        type="text"
                        name="title"
                        placeholder="Assignment Title"
                        className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                        required
                      />
                      <textarea
                        name="description"
                        placeholder="Assignment Description"
                        className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400 min-h-[100px]"
                        required
                      />
                      <input
                        type="date"
                        name="dueDate"
                        className="w-full bg-gray-800 rounded-md p-2 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-400"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-cyan-600 p-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium"
                      >
                        Add Assignment
                      </button>
                    </form>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {courseDetails.assignments.length > 0 ? (
                        courseDetails.assignments.map((assignment) => (
                          <div
                            key={assignment._id}
                            className="p-2 bg-gray-800 rounded-md"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm truncate">
                                {assignment.title}
                              </span>
                              <button
                                onClick={() =>
                                  setCourseDetails((prev) => ({
                                    ...prev,
                                    assignments: prev.assignments.filter(
                                      (a) => a._id !== assignment._id
                                    ),
                                  }))
                                }
                                className="text-red-400 hover:text-red-300"
                                title="Delete Assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Due: {assignment.dueDate}
                            </div>
                            {assignment.submissions.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                {assignment.submissions.map(
                                  (submission, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center text-xs"
                                    >
                                      <span>
                                        Student {submission.studentId}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleViewSubmission(submission)
                                        }
                                        className="text-cyan-400 hover:text-cyan-300"
                                        title="View Submission"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-xs mt-1">
                                No submissions yet.
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No assignments created yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourseManagementPage;
