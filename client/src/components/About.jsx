import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, X, Users, BookOpen, Bot, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

function About() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const token = Cookies.get("token");
    console.log("About.jsx - Cookie 'token':", token);
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      try {
        const decoded = jwtDecode(token);
        console.log("About.jsx - Decoded token:", decoded);
        setUserRole(decoded.userType || "student");
      } catch (error) {
        console.error("About.jsx - Error decoding token:", error);
        setUserRole("student");
      }
    } else {
      setUserRole("student");
    }
    setLoading(false);
  }, []);

  const getDashboardPath = () => {
    console.log("About.jsx - getDashboardPath called, userRole:", userRole);
    switch (userRole) {
      case "student": return "/student-dashboard";
      case "instructor": return "/instructor-dashboard";
      case "admin": return "/admin-dashboard";
      default:
        console.warn("About.jsx - Unknown userRole, defaulting to /dashboard:", userRole);
        return "/dashboard";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">Loading...</div>;

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <GraduationCap className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
            <span className="text-xl font-bold text-gray-100 group-hover:text-cyan-300 transition-colors duration-300">Edustack</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-200 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 active:text-cyan-500">Home</Link>
            <Link to="/courses" className="text-gray-200 hover:text-cyan-400 font-medium transition-all duration-300 hover:scale-105 active:text-cyan-500">Courses</Link>
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

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-6 animate-fade-in">About Edustack</h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            Edustack is an innovative e-learning platform dedicated to empowering learners and educators worldwide with accessible, high-quality education and cutting-edge AI tools.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-gray-100">Our Mission</h2>
              <p className="text-gray-400">
                At Edustack, we believe education should be accessible to everyone. Our mission is to bridge the gap between learners and knowledge with free and premium courses, AI-powered support, and a community-driven approach.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="bg-cyan-800/20 rounded-full p-6 animate-pulse-slow">
                <BookOpen className="h-16 w-16 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-last md:order-first flex justify-center">
              <div className="bg-cyan-800/20 rounded-full p-6 animate-pulse-slow">
                <Users className="h-16 w-16 text-cyan-400" />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-gray-100">Our Team</h2>
              <p className="text-gray-400">
                We’re a passionate group of educators, developers, and innovators committed to transforming education. Our team blends expertise in technology and pedagogy to create a seamless learning experience.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-gray-100">Our Vision</h2>
              <p className="text-gray-400">
                We envision a world where learning knows no boundaries. By leveraging AI and community collaboration, we aim to provide personalized education that adapts to every learner’s needs.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="bg-cyan-800/20 rounded-full p-6 animate-pulse-slow">
                <Bot className="h-16 w-16 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-100 mb-6">Join Our Journey</h2>
          <Link
            to={isLoggedIn ? "/courses" : "/register"}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full px-8 py-3 text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <ChevronRight className="h-6 w-6" />
            {isLoggedIn ? "Explore Courses" : "Get Started"}
          </Link>
        </div>
      </div>

      <footer className="py-8 text-center text-sm text-gray-500 bg-gray-900/50 border-t border-gray-800">
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

export default About;