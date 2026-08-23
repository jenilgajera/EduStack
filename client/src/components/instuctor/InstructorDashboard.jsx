import { Link, useNavigate } from "react-router-dom";
import { Book, LogOut, Plus, Calendar, Trash2, MessageSquare, Users, Home, X, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../Utility/api";
import { useAuth } from "../../context/AuthContext";

function InstructorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatPicker, setShowChatPicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((o) => !o);

  useEffect(() => {
    api.get("/courses")
      .then((res) => setCourses(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleChatClick = () => {
    if (loading) return;
    if (courses.length === 0) { setError("Create a course first to access chat."); return; }
    if (courses.length === 1) { navigate(`/chat/${courses[0]._id}`); return; }
    setShowChatPicker(true);
  };

  const handleCreateCourse = async () => {
    try {
      const res = await api.post("/courses", { name: `New Course ${Date.now()}`, isFree: true, isPublic: true });
      setCourses((prev) => [...prev, res.data]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course.");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      setError(null);
    } catch (err) {
      setError("Failed to delete course.");
    }
  };

  const allLiveSessions = courses.flatMap((course) =>
    (course.liveSessions || []).map((session) => ({ ...session, courseName: course.name }))
  );

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Chat Course Picker Modal */}
      {showChatPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-xl sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-100">Select a Course to Chat</h3>
              <button onClick={() => setShowChatPicker(false)}><X className="h-5 w-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course._id}
                  onClick={() => { setShowChatPicker(false); navigate(`/chat/${course._id}`); }}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 hover:bg-cyan-700/30 text-gray-200 hover:text-cyan-300 transition-all duration-200"
                >
                  {course.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-cyan-500/20 bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg pt-safe">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-safe py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link to="/" className="min-w-0 shrink truncate text-lg font-bold text-cyan-400 sm:text-xl">
            Edustack
          </Link>
          <div className="hidden items-center gap-4 lg:gap-6 md:flex">
            <Link to="/" className="flex items-center gap-1 text-gray-200 transition-all duration-300 hover:text-cyan-400">
              <Home className="h-4 w-4 shrink-0" /> <span className="hidden lg:inline">Home</span>
            </Link>
            <Link to="/instructor-dashboard" className="flex items-center gap-1 text-gray-200 transition-all duration-300 hover:text-cyan-400">
              <Book className="h-4 w-4 shrink-0" /> <span className="hidden lg:inline">Courses</span>
            </Link>
            <Link to="/instructor/students" className="flex items-center gap-1 text-gray-200 transition-all duration-300 hover:text-cyan-400">
              <Users className="h-4 w-4 shrink-0" /> <span className="hidden lg:inline">Students</span>
            </Link>
            <Link to="/instructor-chat" className="flex items-center gap-1 text-gray-200 transition-all duration-300 hover:text-cyan-400">
              <MessageSquare className="h-4 w-4 shrink-0" /> <span className="hidden lg:inline">AI</span>
            </Link>
            <button
              type="button"
              onClick={handleChatClick}
              className="flex items-center gap-1 text-gray-200 transition-all duration-300 hover:text-cyan-400"
            >
              <MessageSquare className="h-4 w-4 shrink-0" /> <span className="hidden lg:inline">Chat</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 text-gray-200 transition-all duration-300 hover:text-cyan-400 sm:min-w-0"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
              aria-label="Logout"
            >
              <LogOut className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={toggleMenu}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="border-t border-gray-700/50 bg-gray-900/98 px-safe py-3 backdrop-blur-sm md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <Link
                to="/"
                className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
                onClick={toggleMenu}
              >
                <Home className="h-5 w-5" /> Home
              </Link>
              <Link
                to="/instructor-dashboard"
                className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
                onClick={toggleMenu}
              >
                <Book className="h-5 w-5" /> My courses
              </Link>
              <Link
                to="/instructor/students"
                className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
                onClick={toggleMenu}
              >
                <Users className="h-5 w-5" /> Students
              </Link>
              <Link
                to="/instructor-chat"
                className="flex min-h-[48px] items-center gap-3 rounded-lg px-4 py-3 text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
                onClick={toggleMenu}
              >
                <MessageSquare className="h-5 w-5" /> AI Chat
              </Link>
              <button
                type="button"
                className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-200 hover:bg-gray-800 hover:text-cyan-400"
                onClick={() => {
                  toggleMenu();
                  handleChatClick();
                }}
              >
                <MessageSquare className="h-5 w-5" /> Course chat
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="mx-auto max-w-7xl px-3 pb-safe pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-100 sm:mb-8 sm:text-3xl md:text-4xl">
          Instructor Dashboard
        </h1>

        {loading && <p className="text-gray-400">Loading courses...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Courses Panel */}
            <div className="bg-gray-900 rounded-lg shadow-md border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Book className="h-6 w-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-gray-100">Manage Courses</h2>
                </div>
                <button onClick={handleCreateCourse} className="p-1 rounded-full hover:bg-cyan-600/20 transition-all duration-200" title="Create New Course">
                  <Plus className="h-5 w-5 text-cyan-400" />
                </button>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {courses.length === 0 && <p className="text-gray-400 text-sm">No courses yet. Click + to create one.</p>}
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className="flex flex-col gap-3 rounded-md p-3 transition-all duration-200 hover:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link to={`/instructor/manage-course/${course._id}`} className="min-w-0 flex-1 break-words">
                      <span>{course.name} {course.isFree && <span className="text-xs text-green-400">(Free)</span>}</span>
                    </Link>
                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <span className="text-sm text-gray-400">{course.students?.length || 0} students</span>
                      <button onClick={() => navigate(`/chat/${course._id}`)} className="p-1 rounded-full hover:bg-cyan-600/20" title="Chat">
                        <MessageSquare className="h-5 w-5 text-cyan-400" />
                      </button>
                      <button onClick={() => handleDeleteCourse(course._id)} className="p-1 rounded-full hover:bg-red-600/20" title="Delete">
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Sessions Panel */}
            <div className="bg-gray-900 rounded-lg shadow-md border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-6 w-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-gray-100">Scheduled Sessions</h2>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {allLiveSessions.length === 0 && <p className="text-gray-400 text-sm">No sessions scheduled yet.</p>}
                {allLiveSessions.map((session) => (
                  <div key={session.sessionId || session._id} className="p-3 bg-gray-800 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm truncate">{session.title}</span>
                      <span className="text-xs text-gray-400">{session.courseName}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {session.date} {session.time} — {session.isLive ? "Live Now" : "Scheduled"} —{" "}
                      <Link to={`/instructor/live-session/${session.sessionId}`} className="text-cyan-400 hover:underline">Join</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="mt-8 bg-gray-900 rounded-lg shadow-md border border-gray-800 p-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={handleCreateCourse} className="bg-cyan-600/20 p-4 rounded-md hover:bg-cyan-600/30 transition-all duration-300 text-cyan-400 text-center">
                <Plus className="h-5 w-5 mx-auto mb-2" /> Create New Course
              </button>
              <Link to="/instructor/students" className="bg-cyan-600/20 p-4 rounded-md hover:bg-cyan-600/30 transition-all duration-300 text-cyan-400 text-center">
                <Users className="h-5 w-5 mx-auto mb-2" /> View Students
              </Link>
              <button onClick={handleChatClick}
                className="bg-cyan-600/20 p-4 rounded-md hover:bg-cyan-600/30 transition-all duration-300 text-cyan-400 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-2" /> Open Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default InstructorDashboard;
