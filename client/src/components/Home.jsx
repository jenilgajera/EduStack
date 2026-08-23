import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, PlayCircle, GraduationCap, Award, Brain, Menu, X, ChevronRight, Bot, BarChart } from "lucide-react";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import api from "../Utility/api";

function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const token = Cookies.get("token");
    console.log("Home.jsx - Cookie 'token':", token);
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    const fetchData = async () => {
      try {
        if (loggedIn) {
          const decoded = jwtDecode(token);
          console.log("Home.jsx - Decoded token:", decoded);
          setUserRole(decoded.userType || "student");
        } else {
          setUserRole("student");
        }

        const coursesResponse = await api.get("/courses/public");
        console.log("Home.jsx - Public courses fetched:", coursesResponse.data);
        setCourses(coursesResponse.data);
      } catch (error) {
        console.error("Home.jsx - Error fetching data:", error.response?.data || error.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Web Dev": return <BookOpen />;
      case "Data Science": return <Brain />;
      case "Education": return <GraduationCap />;
      case "Marketing": return <Users />;
      case "Cloud": return <Award />;
      default: return <BookOpen />;
    }
  };

  const filteredCourses = filter === "all"
    ? courses.slice(0, 6)
    : courses
        .filter(course => (course.isFree ? filter === "free" : filter === "paid"))
        .slice(0, 6);

  const getRedirectPath = (courseId = null) => {
    if (!isLoggedIn) return "/register";
    if (courseId) {
      switch (userRole) {
        case "student": return `/enroll/${courseId}`;
        case "instructor": return `/course/${courseId}`;
        case "admin": return "/admin-dashboard";
        default:
          console.warn("Home.jsx - Unknown userRole:", userRole);
          return "/dashboard";
      }
    }
    // For "Join Now" and "Get Started," redirect to /courses if logged in
    return "/courses";
  };

  const getDashboardPath = () => {
    console.log("Home.jsx - getDashboardPath called, userRole:", userRole);
    switch (userRole) {
      case "student": return "/student-dashboard";
      case "instructor": return "/instructor-dashboard";
      case "admin": return "/admin-dashboard";
      default:
        console.warn("Home.jsx - Unknown userRole, defaulting to /dashboard:", userRole);
        return "/dashboard";
    }
  };

  console.log("Home.jsx Rendering - isLoggedIn:", isLoggedIn, "userRole:", userRole);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">Loading...</div>;

  return (
    <section className="bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <GraduationCap className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
            <span className="text-xl font-bold text-gray-100 group-hover:text-cyan-300 transition-colors duration-300">Edustack</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-200 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 active:text-cyan-500">Home</Link>
            <Link to="/courses" className="text-gray-200 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 active:text-cyan-500">Courses</Link>
            {/* Removed AI Chat link */}
            {isLoggedIn ? (
              <Link to={getDashboardPath()} className="text-gray-200 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 active:text-cyan-500">Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="text-gray-200 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 active:text-cyan-500">Register</Link>
                <Link to="/login" className="text-gray-200 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105">Login</Link>
              </>
            )}
          </div>
          <button onClick={toggleMenu} className="md:hidden text-gray-200 hover:text-cyan-400 focus:outline-none transition-colors duration-300">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900/95 px-4 py-4 space-y-2 border-t border-gray-700 animate-slide-in">
            <Link to="/" className="block py-2 px-4 text-gray-200 hover:text-cyan-400 hover:bg-gray-800 rounded-md transition-all duration-300" onClick={toggleMenu}>Home</Link>
            <Link to="/courses" className="block py-2 px-4 text-gray-200 hover:text-cyan-400 hover:bg-gray-800 rounded-md transition-all duration-300" onClick={toggleMenu}>Courses</Link>
            {/* Removed AI Chat link */}
            {isLoggedIn ? (
              <Link to={getDashboardPath()} className="block py-2 px-4 text-gray-200 hover:text-cyan-400 hover:bg-gray-800 rounded-md transition-all duration-300" onClick={toggleMenu}>Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="block py-2 px-4 text-gray-200 hover:text-cyan-400 hover:bg-gray-800 rounded-md transition-all duration-300" onClick={toggleMenu}>Register</Link>
                <Link to="/login" className="block py-2 px-4 text-gray-200 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-all duration-300" onClick={toggleMenu}>Login</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/20 to-transparent pt-20">
        <div className="max-w-6xl text-center space-y-8 animate-fade-in">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            Empower Your Future with Edustack
          </h1>
          <p className="text-lg sm:text-2xl text-gray-400 max-w-3xl mx-auto">
            Start Free, Learn Premium - Your Way with Edustack. Free and premium courses, AI support, and more for students and instructors.
          </p>
          <Link
            to={getRedirectPath()}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full px-8 py-3 text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 animate-bounce-slow"
          >
            <PlayCircle className="h-6 w-6" />
            Get Started
          </Link>
          <div className="flex flex-col sm:flex-row justify-center gap-8 mt-10 text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-semibold">50K+ Learners</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-semibold">100+ Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-semibold">AI-Powered Learning</span>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 animate-fade-in">Why Edustack?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-3 bg-cyan-700/20 rounded-full">
                <BookOpen className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">Diverse Courses</h3>
              <p className="text-sm text-gray-400">Free and paid options across multiple domains.</p>
            </div>
            <div className="space-y-2 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-3 bg-cyan-700/20 rounded-full">
                <Bot className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">AI Support</h3>
              <p className="text-sm text-gray-400">Instant doubt resolution with AI tools.</p>
            </div>
            <div className="space-y-2 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-3 bg-cyan-700/20 rounded-full">
                <Award className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">Certificates</h3>
              <p className="text-sm text-gray-400">Earn badges and certificates upon completion.</p>
            </div>
            <div className="space-y-2 text-center hover:scale-105 transition-all duration-300">
              <div className="inline-block p-3 bg-cyan-700/20 rounded-full">
                <BarChart className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">Progress Tracking</h3>
              <p className="text-sm text-gray-400">Monitor your growth with detailed reports.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 animate-fade-in">Explore Our Courses</h2>
          <p className="text-lg text-gray-400 text-center mb-8">Free and premium courses tailored for your success.</p>
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${filter === "all" ? "bg-cyan-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("free")}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${filter === "free" ? "bg-cyan-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Free
            </button>
            <button
              onClick={() => setFilter("paid")}
              className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${filter === "paid" ? "bg-cyan-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              Paid
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <div
                  key={course._id}
                  className="bg-gray-900 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group flex flex-col min-h-[360px] border border-gray-800"
                >
                  <div className="flex justify-center pt-6 pb-4">
                    <div className="bg-cyan-800/20 rounded-full p-4 group-hover:bg-cyan-800/30 transition-all duration-300">
                      <span className="h-12 w-12 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                        {getCategoryIcon(course.category)}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors duration-300 text-center">
                      {course.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2 text-center">
                      {course.description || "No description available"}
                    </p>
                    <div className="text-sm text-gray-400 mb-3 text-center">
                      {course.duration} {course.highlight === "Beginner-Friendly" ? "- Beginner-Friendly" : ""}
                    </div>
                    <div className="text-sm text-gray-400 mb-4 text-center">
                      by {course.instructor ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() || "Unknown" : "Unknown"}
                    </div>
                    <div className="flex justify-center mb-4">
                      <span className="text-xl font-bold text-gray-200 group-hover:text-cyan-400 transition-colors duration-300">
                        {course.isFree ? "Free" : course.price ? `$${course.price}` : "N/A"}
                      </span>
                    </div>
                    <Link
                      to={getRedirectPath(course._id)}
                      className="block w-full text-center bg-gray-700 text-gray-200 font-semibold py-3 rounded-full transition-all duration-300 hover:bg-cyan-600 hover:text-white hover:scale-105 mt-auto"
                    >
                      {isLoggedIn && userRole === "student" ? "Enroll Now" : isLoggedIn ? "View Course" : "Enroll Now"}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-400 py-12">
                <p>No courses available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto text-center space-y-6 animate-fade-in">
          <Bot className="h-12 w-12 text-cyan-400 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-bold">AI-Powered Learning Assistance</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Get instant doubt resolution with our AI chatbot—your 24/7 study companion.
          </p>
          <Link
            to={getRedirectPath()}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full px-6 py-2 transition-all duration-300 hover:scale-105"
          >
            Try It Now
          </Link>
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 animate-fade-in">What Our Community Says</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 space-y-4 hover:scale-105 transition-all duration-300">
              <p className="text-gray-300">Free courses got me started—AI support is a game-changer!</p>
              <p className="text-xs text-gray-500">- Arjun, Student</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 space-y-4 hover:scale-105 transition-all duration-300">
              <p className="text-gray-300">Paid courses are worth every penny—top quality!</p>
              <p className="text-xs text-gray-500">- Sneha, Learner</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-6 space-y-4 hover:scale-105 transition-all duration-300">
              <p className="text-gray-300">Teaching is seamless with great tools!</p>
              <p className="text-xs text-gray-500">- Vikram, Instructor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-900/20 text-center">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold">Start Your Learning Journey Today</h2>
          <p className="text-lg text-gray-400">Free courses to begin, premium subscriptions for mastery—plus certificates!</p>
          <Link
            to={getRedirectPath()}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full px-8 py-3 text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <GraduationCap className="h-6 w-6" />
            Join Now
          </Link>
        </div>
      </div>

      <footer className="py-8 text-center text-sm text-gray-500 bg-gray-900/50">
        <p>Edustack - Empowering Education © 2025</p>
        <div className="mt-2">
          <Link to="/about" className="text-gray-400 hover:text-cyan-400 mx-2">About</Link>
          <Link to="/contact" className="text-gray-400 hover:text-cyan-400 mx-2">Contact</Link>
          <Link to="/terms" className="text-gray-400 hover:text-cyan-400 mx-2">Terms</Link>
        </div>
      </footer>
    </section>
  );
}

export default Home;
