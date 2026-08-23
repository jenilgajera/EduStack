import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../Utility/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import {
  BookOpen,
  Video,
  Calendar,
  HelpCircle,
  FileText,
  Eye,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare, // For the Chat button
} from "lucide-react";

function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const decoded = jwtDecode(token);
        if (decoded.userType !== "student") {
          navigate("/instructor-dashboard");
          return;
        }
        setStudentId(decoded.id);

        const response = await api.get(`/courses/${courseId}`);
        console.log("CourseView.jsx - Course fetched:", response.data);

        const enrolledStudents = Array.isArray(response.data.students)
          ? response.data.students
          : [];

        const isEnrolled = enrolledStudents.some((studentEntry) => {
          const resolvedStudentId =
            studentEntry?.studentId?._id ||
            studentEntry?.studentId ||
            studentEntry?._id ||
            studentEntry;

          const match = resolvedStudentId?.toString() === decoded.id;
          console.log(
            `Comparing ${resolvedStudentId?.toString?.() || "unknown"} with ${decoded.id}: ${match}`
          );
          return match;
        });
        if (!isEnrolled) {
          setError("You are not enrolled in this course.");
          return;
        }

        setCourse(response.data);
      } catch (err) {
        console.error("CourseView.jsx - Error fetching course:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  const handleViewSession = (sessionId) => {
    navigate(`/student/recorded-session/${courseId}/${sessionId}`);
  };

  const handleJoinLiveSession = (sessionId) => {
    navigate(`/live-session/student/${sessionId}`);
  };

  const handleAttemptQuiz = (quizId) => {
    navigate(`/student/quiz/${courseId}/${quizId}`);
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const groupedSessions =
    (Array.isArray(course?.sessions) ? course.sessions : []).reduce((acc, session) => {
      const category = session.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(session);
      return acc;
    }, {}) || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4 text-lg">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">{error}</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="text-cyan-400 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Course not found</p>
        <button
          onClick={() => navigate("/student-dashboard")}
          className="text-cyan-400 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          {/* Added Chat Button in Navbar */}
          <Link
            to={`/chat/${courseId}`}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Chat</span>
          </Link>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">{course.name}</h1>
        <p className="text-gray-400 mb-4">{course.description || "No description available"}</p>
        <p className="text-gray-400 mb-6">
          <strong>Instructor:</strong>{" "}
          {course.instructor
            ? `${course.instructor.firstName} ${course.instructor.lastName}`
            : "Unknown"}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recorded Sessions */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Video className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-gray-100">Recorded Sessions</h2>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {Object.keys(groupedSessions).length > 0 ? (
                Object.entries(groupedSessions).map(([category, sessions]) => (
                  <div key={category} className="bg-gray-800 rounded-md">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 text-gray-100 hover:bg-gray-700 transition-all duration-300"
                    >
                      <span className="text-sm font-semibold truncate">{category}</span>
                      {expandedCategories[category] ? (
                        <ChevronUp className="h-4 w-4 text-cyan-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-cyan-400" />
                      )}
                    </button>
                    {expandedCategories[category] && (
                      <div className="space-y-2 pl-4">
                        {sessions.map((session) => (
                          <div
                            key={session._id}
                            className="flex items-center justify-between p-2 bg-gray-700 rounded-md"
                          >
                            <span className="text-sm truncate">{session.name}</span>
                            <button
                              onClick={() => handleViewSession(session._id)}
                              className="text-cyan-400 hover:text-cyan-300"
                              title="View Session"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No recorded sessions available.</p>
              )}
            </div>
          </div>

          {/* Live Sessions */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-gray-100">Live Sessions</h2>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {(Array.isArray(course.liveSessions) ? course.liveSessions : []).length > 0 ? (
                (Array.isArray(course.liveSessions) ? course.liveSessions : []).map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm truncate">{session.title}</span>
                      <span className="text-xs text-gray-400">
                        {session.date} {session.time} - Session ID: {session.sessionId}
                      </span>
                    </div>
                    <button
                      onClick={() => handleJoinLiveSession(session.sessionId)}
                      className={`text-white px-3 py-1 rounded-md ${
                        session.isLive ? "bg-cyan-600 hover:bg-cyan-700" : "bg-gray-600 cursor-not-allowed"
                      }`}
                      disabled={!session.isLive}
                    >
                      Join
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No live sessions scheduled.</p>
              )}
            </div>
          </div>

          {/* Quizzes */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-gray-100">Quizzes</h2>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {(Array.isArray(course.quizzes) ? course.quizzes : []).length > 0 ? (
                (Array.isArray(course.quizzes) ? course.quizzes : []).map((quiz) => {
                  const studentScore = (Array.isArray(course.quizScores) ? course.quizScores : []).find(
                    (s) => s.studentId.toString() === studentId && s.quizId.toString() === quiz._id.toString()
                  );
                  return (
                    <div
                      key={quiz._id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">{quiz.title}</span>
                        <p className="text-xs text-gray-400">
                          {quiz.questions.length} questions • {quiz.timeLimit} minutes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {studentScore ? (
                          <span className="text-sm text-cyan-400">{studentScore.score}%</span>
                        ) : (
                          <button
                            onClick={() => handleAttemptQuiz(quiz._id)}
                            className="bg-cyan-600 text-white px-3 py-1 rounded-md hover:bg-cyan-700 transition-all duration-300"
                          >
                            Attempt
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-sm">No quizzes available.</p>
              )}
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-gray-100">Assignments</h2>
            </div>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {(Array.isArray(course.assignments) ? course.assignments : []).length > 0 ? (
                (Array.isArray(course.assignments) ? course.assignments : []).map((assignment) => (
                  <div key={assignment._id} className="p-3 bg-gray-800 rounded-md">
                    <span className="text-sm">{assignment.title}</span>
                    <p className="text-xs text-gray-400">Due: {assignment.dueDate}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No assignments available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourseView;
