import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Home, Book, MessageSquare, LogOut, ArrowLeft } from "lucide-react";
import api from "../../Utility/api";

function InstructorStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/courses")
      .then((res) => {
        setCourses(res.data);
        // Flatten all students across all courses
        const allStudents = res.data.flatMap((course) =>
          (course.students || []).map((s) => ({
            ...s,
            courseName: course.name,
            courseId: course._id,
          }))
        );
        setStudents(allStudents);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load students."))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    navigate("/login");
  };

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-cyan-400">Edustack</Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1 text-gray-200 hover:text-cyan-400 transition-all duration-300"><Home className="h-4 w-4" /> Home</Link>
            <Link to="/instructor-dashboard" className="flex items-center gap-1 text-gray-200 hover:text-cyan-400 transition-all duration-300"><Book className="h-4 w-4" /> Courses</Link>
            <Link to="/instructor/students" className="flex items-center gap-1 text-cyan-400 font-semibold"><Users className="h-4 w-4" /> Students</Link>
            <button onClick={() => courses[0] ? navigate(`/chat/${courses[0]._id}`) : null}
              className="flex items-center gap-1 text-gray-200 hover:text-cyan-400 transition-all duration-300">
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300">
            <LogOut className="h-5 w-5" /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <button onClick={() => navigate("/instructor-dashboard")} className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-6 transition-all duration-200">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Students</h1>

        {loading && <p className="text-gray-400">Loading students...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            {students.length === 0 ? (
              <p className="p-6 text-gray-400">No students enrolled in your courses yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Course</th>
                    <th className="px-6 py-3 text-left">Grade</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {students.map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-800 transition-colors duration-150">
                      <td className="px-6 py-4 text-gray-200">{student.name || "Unknown"}</td>
                      <td className="px-6 py-4 text-gray-400">{student.courseName}</td>
                      <td className="px-6 py-4 text-gray-400">{student.grade || "N/A"}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => navigate(`/chat/${student.courseId}`)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors duration-150">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default InstructorStudents;
