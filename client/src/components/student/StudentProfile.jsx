import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Menu, X, User, Calendar, MessageSquare } from "lucide-react";
import api from "../../Utility/api";
import Cookies from "js-cookie";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function StudentProfile() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser === undefined) return;

    const fetchProfile = async () => {
      try {
        if (!authUser) {
          navigate("/login");
          return;
        }
        if (authUser.role !== "student") {
          navigate("/instructor-dashboard");
          return;
        }

        const response = await api.get("/student/profile");
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
          return;
        }
        toast.error(error.response?.data?.message || "Could not load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser, navigate]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    Cookies.remove("token");
    navigate("/login");
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <p className="text-lg text-gray-300">Unable to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-100 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-850 shadow-lg border-b border-cyan-500/30 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BookOpen className="h-9 w-9 text-cyan-400 group-hover:text-cyan-300 transition-all duration-300" />
            <span className="text-2xl font-bold text-gray-100 group-hover:text-cyan-300 transition-all duration-300">Edustack</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300 flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Home
            </Link>
            <Link to="/courses" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300 flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Courses
            </Link>
            <Link to="/student/profile" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300 flex items-center gap-2">
              <User className="h-5 w-5" /> Profile
            </Link>
            <Link to="/student-chat" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Chat
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-200 font-medium hover:text-cyan-400 flex items-center gap-2 transition-all duration-300"
            >
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
          <button onClick={toggleMenu} className="md:hidden text-gray-200 hover:text-cyan-400 focus:outline-none">
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900/95 px-4 py-4 space-y-3 border-t border-gray-700/50 backdrop-blur-sm">
            <Link to="/" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300 flex items-center gap-2" onClick={toggleMenu}>
              <BookOpen className="h-5 w-5" /> Home
            </Link>
            <Link to="/courses" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300 flex items-center gap-2" onClick={toggleMenu}>
              <BookOpen className="h-5 w-5" /> Courses
            </Link>
            <Link to="/student/profile" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300 flex items-center gap-2" onClick={toggleMenu}>
              <User className="h-5 w-5" /> Profile
            </Link>
            <Link to="/student-chat" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300 flex items-center gap-2" onClick={toggleMenu}>
              <MessageSquare className="h-5 w-5" /> Chat
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md flex items-center gap-2 transition-all duration-300"
            >
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
        )}
      </nav>

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center gap-10">
        <div className="bg-gradient-to-b from-gray-900/90 to-gray-850/90 rounded-2xl shadow-xl border border-gray-700/50 p-8 w-full max-w-2xl hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
          <h1 className="text-4xl font-bold text-gray-100 mb-8 text-center tracking-tight group-hover:text-cyan-300">Your Profile</h1>
          <div className="space-y-6">
            {/* Username */}
            <div className="flex items-center gap-4">
              <User className="h-6 w-6 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">Username</p>
                <p className="text-lg text-gray-100">{profile.username}</p>
              </div>
            </div>
            {/* Email */}
            <div className="flex items-center gap-4">
              <User className="h-6 w-6 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">Email</p>
                <p className="text-lg text-gray-100">{profile.email}</p>
              </div>
            </div>
            {/* First Name */}
            <div className="flex items-center gap-4">
              <User className="h-6 w-6 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">First Name</p>
                <p className="text-lg text-gray-100">{profile.firstName}</p>
              </div>
            </div>
            {/* Last Name */}
            <div className="flex items-center gap-4">
              <User className="h-6 w-6 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">Last Name</p>
                <p className="text-lg text-gray-100">{profile.lastName}</p>
              </div>
            </div>
            {/* Date of Birth */}
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-cyan-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">Date of Birth</p>
                <p className="text-lg text-gray-100">{new Date(profile.dob).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <Link
            to="/student-dashboard"
            className="mt-8 inline-block w-full text-center bg-gradient-to-r from-cyan-600 to-teal-500 text-white font-semibold py-3 px-6 rounded-full hover:from-cyan-700 hover:to-teal-600 hover:scale-105 hover:shadow-[0_0_12px_rgba(34,211,238,0.7)] transition-all duration-300 shadow-md"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

export default StudentProfile;