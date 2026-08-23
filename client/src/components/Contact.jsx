import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, X, Mail, Phone, MapPin, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

function Contact() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const token = Cookies.get("token");
    console.log("Contact.jsx - Cookie 'token':", token);
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      try {
        const decoded = jwtDecode(token);
        console.log("Contact.jsx - Decoded token:", decoded);
        setUserRole(decoded.userType || "student");
      } catch (error) {
        console.error("Contact.jsx - Error decoding token:", error);
        setUserRole("student");
      }
    } else {
      setUserRole("student");
    }
    setLoading(false);
  }, []);

  const getDashboardPath = () => {
    console.log("Contact.jsx - getDashboardPath called, userRole:", userRole);
    switch (userRole) {
      case "student": return "/student-dashboard";
      case "instructor": return "/instructor-dashboard";
      case "admin": return "/admin-dashboard";
      default:
        console.warn("Contact.jsx - Unknown userRole, defaulting to /dashboard:", userRole);
        return "/dashboard";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    // Here you’d typically send the form data to an API (e.g., /api/contact)
    setFormSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
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
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-6 animate-fade-in">Contact Us</h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
            Have questions or need support? Reach out to us—we’re here to help you succeed!
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-3xl font-semibold text-gray-100">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-cyan-400" />
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="text-gray-200">support@brightbyte.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-cyan-400" />
                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="text-gray-200">+91 9044887565</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin className="h-6 w-6 text-cyan-400" />
                <div>
                  <p className="text-gray-400">Address</p>
                  <p className="text-gray-200">123 Learning Lane, EdTech City, INDIA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-lg shadow-md border border-gray-800">
            {formSubmitted ? (
              <div className="text-center space-y-4 animate-fade-in">
                <h2 className="text-2xl font-semibold text-gray-100">Thank You!</h2>
                <p className="text-gray-400">Your message has been sent. We’ll get back to you soon.</p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full px-6 py-2 transition-all duration-300 hover:scale-105"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 p-3 bg-gray-700 border border-gray-700 text-gray-200 rounded-md hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full mt-1 p-3 bg-gray-700 border border-gray-700 text-gray-200 rounded-md hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Your Email"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-400">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full mt-1 p-3 bg-gray-700 border border-gray-700 text-gray-200 rounded-md hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Your Message"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-full transition-all duration-300 hover:scale-105"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
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

export default Contact;