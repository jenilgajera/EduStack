// import { Link, useNavigate } from "react-router-dom";
// import { BookOpen, LogOut, Menu, X, User, MessageSquare } from "lucide-react";
// import { useState, useEffect } from "react";
// import Cookies from "js-cookie";
// import { jwtDecode } from "jwt-decode";
// import Chatbot from "../student/Chatbot"; // Adjust path if needed

// function ChatPage() {
//   const navigate = useNavigate();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   useEffect(() => {
//     const token = Cookies.get("token");
//     if (!token) {
//       navigate("/login");
//       return;
//     }
//     const decoded = jwtDecode(token);
//     if (decoded.userType !== "student") {
//       navigate("/instructor-dashboard");
//     }
//   }, [navigate]);

//   const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

//   const handleLogout = () => {
//     Cookies.remove("token");
//     navigate("/login");
//     setIsMenuOpen(false);
//   };

//   return (
//     <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
//       <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//           <Link to="/" className="flex items-center gap-2 group">
//             <BookOpen className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-all duration-300" />
//             <span className="text-xl font-bold text-gray-100 group-hover:text-cyan-300 transition-all duration-300">Edustack</span>
//           </Link>
//           <div className="hidden md:flex items-center gap-6">
//             <Link to="/" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300">Home</Link>
//             <Link to="/courses" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300">Courses</Link>
//             <Link to="/student/profile" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300">Profile</Link>
//             <Link to="/student-chat" className="text-gray-200 font-medium hover:text-cyan-400 transition-all duration-300">Chat</Link>
//             <button
//               onClick={handleLogout}
//               className="text-gray-200 font-medium hover:text-cyan-400 flex items-center gap-2 transition-all duration-300"
//             >
//               <LogOut className="h-5 w-5" />
//               Logout
//             </button>
//           </div>
//           <button onClick={toggleMenu} className="md:hidden text-gray-200 hover:text-cyan-400 focus:outline-none">
//             {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//           </button>
//         </div>
//         {isMenuOpen && (
//           <div className="md:hidden bg-gray-900 px-4 py-4 space-y-2 border-t border-gray-700">
//             <Link to="/" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300" onClick={toggleMenu}>Home</Link>
//             <Link to="/courses" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300" onClick={toggleMenu}>Courses</Link>
//             <Link to="/student/profile" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300" onClick={toggleMenu}>Profile</Link>
//             <Link to="/student-chat" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md transition-all duration-300" onClick={toggleMenu}>Chat</Link>
//             <button
//               onClick={handleLogout}
//               className="w-full text-left py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400 rounded-md flex items-center gap-2 transition-all duration-300"
//             >
//               <LogOut className="h-4 w-4" />
//               Logout
//             </button>
//           </div>
//         )}
//       </nav>

//       <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
//         <div className="lg:w-1/4 flex flex-col gap-8">
//           <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-6 hover:border-cyan-400 hover:shadow-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300 group">
//             <h2 className="text-2xl font-bold text-gray-100 mb-3 group-hover:text-cyan-300">Chat with Gemini AI</h2>
//             <p className="text-sm text-gray-400 group-hover:text-cyan-400">Ask me anything!</p>
//           </div>
//           <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-6 hover:border-cyan-400 hover:shadow-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-300 group">
//             <h3 className="text-xl font-bold text-gray-100 mb-4 group-hover:text-cyan-400">Navigation</h3>
//             <div className="space-y-4">
//               <Link to="/student-dashboard" className="flex items-center gap-3 text-gray-200 hover:text-cyan-400 transition-all duration-300">
//                 <BookOpen className="h-5 w-5" />
//                 <span>Dashboard</span>
//               </Link>
//               <Link to="/student/profile" className="flex items-center gap-3 text-gray-200 hover:text-cyan-400 transition-all duration-300">
//                 <User className="h-5 w-5" />
//                 <span>Profile</span>
//               </Link>
//             </div>
//           </div>
//         </div>

//         <div className="lg:w-3/4 flex flex-col items-center justify-center">
//           <Chatbot />
//         </div>
//       </div>
//     </section>
//   );
// }

// export default ChatPage;