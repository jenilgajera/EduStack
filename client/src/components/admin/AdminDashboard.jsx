import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  LogOut,
  Menu,
  X,
  UserX,
  UserCheck,
  Search,
  Edit,
  Trash2,
  Users,
  Book,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminController from "../../controllers/AdminController";
import CourseModal from "../../model/CourseModal";

function AdminDashboard() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("courses"); // Tabs: courses, students, instructors
  const [courseFilter, setCourseFilter] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null); // For editing

  const controller = new AdminController(setCourses, setStudents, setInstructors, setError, setLoading, navigate, toast);

  useEffect(() => {
    controller.loadData();
  }, [navigate]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Filter functions
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStudents = controller.filterStudentsByCourse(
    students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    courses,
    courseFilter
  );
  const filteredInstructors = controller.filterInstructorsByCourse(
    instructors.filter(instructor =>
      `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    courses,
    courseFilter
  );

  const handleEditCourse = (course) => setSelectedCourse(course);
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await controller.deleteCourse(courseId);
      toast.success("Course deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete course!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">{error}</p>
        <Link to="/login" className="text-cyan-400 hover:underline">Back to Login</Link>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-100 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex">
      <ToastContainer position="top-right" autoClose={4000} />
      {/* Sidebar */}
      <div className="fixed top-0 left-0 w-64 h-full bg-gray-900 shadow-lg border-r border-gray-700/50 p-6 hidden lg:block">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <BookOpen className="h-9 w-9 text-cyan-400" />
          <span className="text-2xl font-bold text-gray-100">Edustack</span>
        </Link>
        <nav className="space-y-4">
          <button
            onClick={() => setActiveTab("courses")}
            className={`w-full flex items-center gap-3 p-3 rounded-md ${activeTab === "courses" ? "bg-cyan-600 text-white" : "text-gray-200 hover:bg-gray-800"}`}
          >
            <Book className="h-5 w-5" /> Courses
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`w-full flex items-center gap-3 p-3 rounded-md ${activeTab === "students" ? "bg-cyan-600 text-white" : "text-gray-200 hover:bg-gray-800"}`}
          >
            <Users className="h-5 w-5" /> Students
          </button>
          <button
            onClick={() => setActiveTab("instructors")}
            className={`w-full flex items-center gap-3 p-3 rounded-md ${activeTab === "instructors" ? "bg-cyan-600 text-white" : "text-gray-200 hover:bg-gray-800"}`}
          >
            <Users className="h-5 w-5" /> Instructors
          </button>
          <button
            onClick={controller.handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-md text-gray-200 hover:bg-gray-800 mt-auto"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </nav>
      </div>

      {/* Mobile Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-850 shadow-lg border-b border-cyan-500/30 z-50 lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BookOpen className="h-9 w-9 text-cyan-400 group-hover:text-cyan-300 transition-all duration-300" />
            <span className="text-2xl font-bold text-gray-100 group-hover:text-cyan-300 transition-all duration-300">Edustack</span>
          </Link>
          <button onClick={toggleMenu} className="text-gray-200 hover:text-cyan-400 focus:outline-none">
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="bg-gray-900/95 px-4 py-4 space-y-3 border-t border-gray-700/50 backdrop-blur-sm">
            <button onClick={() => { setActiveTab("courses"); toggleMenu(); }} className="w-full text-left py-2 px-4 text-gray-200 hover:bg-gray-800">Courses</button>
            <button onClick={() => { setActiveTab("students"); toggleMenu(); }} className="w-full text-left py-2 px-4 text-gray-200 hover:bg-gray-800">Students</button>
            <button onClick={() => { setActiveTab("instructors"); toggleMenu(); }} className="w-full text-left py-2 px-4 text-gray-200 hover:bg-gray-800">Instructors</button>
            <button onClick={() => { controller.handleLogout(); toggleMenu(); }} className="w-full text-left py-2 px-4 text-gray-200 hover:bg-gray-800">Logout</button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1 pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 p-6 rounded-xl shadow-lg border border-gray-700/50">
              <p className="text-gray-400 text-sm">Total Courses</p>
              <p className="text-3xl font-bold text-cyan-400">{courses.length}</p>
            </div>
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 p-6 rounded-xl shadow-lg border border-gray-700/50">
              <p className="text-gray-400 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-cyan-400">{students.length}</p>
            </div>
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 p-6 rounded-xl shadow-lg border border-gray-700/50">
              <p className="text-gray-400 text-sm">Total Instructors</p>
              <p className="text-3xl font-bold text-cyan-400">{instructors.length}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gradient-to-b from-gray-900/90 to-gray-850/90 p-4 rounded-xl shadow-lg border border-gray-700/50">
            <div className="relative w-full sm:w-1/2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-10 p-2.5 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              />
            </div>
            {activeTab === "students" || activeTab === "instructors" ? (
              <div className="flex items-center gap-2">
                <label className="text-gray-200 text-sm">Filter by Course:</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-gray-800 text-gray-200 rounded-md p-2 text-sm focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* Tab Content */}
          {activeTab === "courses" && (
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 rounded-xl shadow-lg border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-semibold text-gray-100">Courses ({filteredCourses.length})</h2>
                <button
                  onClick={() => controller.generateCourseReport(filteredCourses)}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300"
                >
                  Generate Report
                </button>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredCourses.map(course => (
                  <div key={course._id} className="bg-gray-800 p-4 rounded-md flex justify-between items-center hover:bg-gray-700 transition-all duration-200">
                    <div>
                      <p><strong>ID:</strong> {course._id}</p>
                      <p><strong>Name:</strong> {course.name}</p>
                      <p><strong>Instructor:</strong> {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : "Unknown"}</p>
                      <p><strong>Students:</strong> {course.students.length}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 rounded-xl shadow-lg border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-semibold text-gray-100">Students ({filteredStudents.length})</h2>
                <button
                  onClick={() => controller.generateStudentReport(filteredStudents, courses)}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300"
                >
                  Generate Report
                </button>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredStudents.map(student => (
                  <div key={student._id} className="bg-gray-800 p-4 rounded-md flex justify-between items-center hover:bg-gray-700 transition-all duration-200">
                    <div>
                      <p><strong>ID:</strong> {student._id}</p>
                      <p><strong>Name:</strong> {`${student.firstName} ${student.lastName}`}</p>
                      <p><strong>Email:</strong> {student.email}</p>
                      <p><strong>Courses:</strong> {" "}
  {courses
    .filter(c =>
      c.students.some(s => s && s.studentId && s.studentId.toString() === student._id)
    )
    .map(c => c.name)
    .join(", ") || "None"}</p>
                    </div>
                    <button
                      onClick={() => controller.handleBlockUser(student._id, "student", student.isBlocked)}
                      className={`px-3 py-1 rounded-md flex items-center gap-1 ${student.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
                    >
                      {student.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      {student.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "instructors" && (
            <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 rounded-xl shadow-lg border border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-semibold text-gray-100">Instructors ({filteredInstructors.length})</h2>
                <button
                  onClick={() => controller.generateInstructorReport(filteredInstructors, courses)}
                  className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300"
                >
                  Generate Report
                </button>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {filteredInstructors.map(instructor => (
                  <div key={instructor._id} className="bg-gray-800 p-4 rounded-md flex justify-between items-center hover:bg-gray-700 transition-all duration-200">
                    <div>
                      <p><strong>ID:</strong> {instructor._id}</p>
                      <p><strong>Name:</strong> {`${instructor.firstName} ${instructor.lastName}`}</p>
                      <p><strong>Email:</strong> {instructor.email}</p>
                      <p><strong>Courses:</strong> {courses.filter(c => c.instructor && c.instructor._id.toString() === instructor._id).map(c => c.name).join(", ") || "None"}</p>
                    </div>
                    <button
                      onClick={() => controller.handleBlockUser(instructor._id, "instructor", instructor.isBlocked)}
                      className={`px-3 py-1 rounded-md flex items-center gap-1 ${instructor.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
                    >
                      {instructor.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      {instructor.isBlocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Edit Modal */}
      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onSave={controller.updateCourse}
        />
      )}
    </section>
  );
}

export default AdminDashboard;