// import { Link, useNavigate } from "react-router-dom";
// import { BookOpen, Users, GraduationCap, Award, Brain, Menu, X, Search, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
// import { useState, useEffect } from "react";
// import axios from "axios";
// import Cookies from "js-cookie";
// import { jwtDecode } from "jwt-decode";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
// import toast, { Toaster } from "react-hot-toast";
// import jsPDF from "jspdf";

// const stripePromise = loadStripe("pk_test_51R0O56J7dVolRWt4cDa4lumJQFbL4pvpSyve6DyjA72W0ehLYyRgoyOBQ8MlJKJxwUIEbX057r75maVVy9Aq7KUO00nmLLDoy9"); // Replace with your test key

// const api = axios.create({
//   baseURL: (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api",
//   withCredentials: true,
// }); 

// const CheckoutForm = ({ course, onClose, onSuccess }) => {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [error, setError] = useState(null);
//   const [processing, setProcessing] = useState(false);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setProcessing(true);

//     if (!stripe || !elements) {
//       setProcessing(false);
//       return;
//     }

//     const cardElement = elements.getElement(CardElement);

//     try {
//       const response = await api.post("/create-payment-intent", {
//         amount: (course.price || 10) * 100,
//         currency: "usd",
//         courseId: course._id,
//       });

//       const { clientSecret } = response.data;

//       const result = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: cardElement,
//           billing_details: { name: "Test User" },
//         },
//       });

//       if (result.error) {
//         setError(result.error.message);
//         toast.error(result.error.message, { style: { background: "#EF4444", color: "#fff" } });
//       } else if (result.paymentIntent.status === "succeeded") {
//         console.log("[CheckoutForm] Payment succeeded:", result.paymentIntent);
//         onSuccess(course, result.paymentIntent);
//       }
//     } catch (err) {
//       setError("Payment failed. Please try again.");
//       toast.error("Payment failed. Please try again.", { style: { background: "#EF4444", color: "#fff" } });
//       console.error("[CheckoutForm] Payment error:", err.response?.data || err.message);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold text-gray-100">Enroll in {course.name}</h2>
//           <button onClick={onClose} className="text-gray-400 hover:text-cyan-400">
//             <X className="h-6 w-6" />
//           </button>
//         </div>
//         <p className="text-gray-400 mb-4">Price: ${course.price || 10} (Test Mode)</p>
//         <form onSubmit={handleSubmit}>
//           <CardElement className="bg-gray-700 p-3 rounded-lg text-gray-200 border border-gray-600 mb-4" />
//           {error && <p className="text-red-500 mb-4">{error}</p>}
//           <button
//             type="submit"
//             disabled={!stripe || processing}
//             className="w-full bg-cyan-600 text-white py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50"
//           >
//             {processing ? "Processing..." : "Pay Now"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// function Courses() {
//   const navigate = useNavigate();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [filter, setFilter] = useState("all");
//   const [categoryFilter, setCategoryFilter] = useState("all");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortBy, setSortBy] = useState("default");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [courses, setCourses] = useState([]);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userRole, setUserRole] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedCourse, setSelectedCourse] = useState(null);
//   const coursesPerPage = 6;

//   const categories = ["all", "Web Dev", "Data Science", "Education", "Marketing", "Cloud"];

//   useEffect(() => {
//     const token = Cookies.get("token");
//     const loggedIn = !!token;
//     setIsLoggedIn(loggedIn);

//     const fetchUserRoleAndCourses = async () => {
//       try {
//         if (loggedIn) {
//           const decoded = jwtDecode(token);
//           setUserRole(decoded.userType || "student");

//           const endpoint = decoded.userType === "instructor" ? "/courses" : "/courses/public";
//           const coursesResponse = await api.get(endpoint);
//           setCourses(coursesResponse.data);
//         } else {
//           setUserRole("student");
//           const coursesResponse = await api.get("/courses/public");
//           setCourses(coursesResponse.data);
//         }
//       } catch (error) {
//         console.error("[Courses] Error fetching data:", error.response?.data || error.message);
//         setCourses([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserRoleAndCourses();
//   }, []);

//   const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

//   const sortCourses = (courses) => {
//     switch (sortBy) {
//       case "costAsc":
//         return [...courses].sort((a, b) => (a.isFree ? -1 : b.isFree ? 1 : (a.price || 0) - (b.price || 0)));
//       case "costDesc":
//         return [...courses].sort((a, b) => (b.isFree ? -1 : a.isFree ? 1 : (b.price || 0) - (a.price || 0)));
//       case "durationAsc":
//         return [...courses].sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
//       case "durationDesc":
//         return [...courses].sort((a, b) => (b.durationHours || 0) - (a.durationHours || 0));
//       default:
//         return courses;
//     }
//   };

//   const filteredCourses = sortCourses(
//     courses.filter(course =>
//       course.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
//       (filter === "all" || (course.isFree ? filter === "free" : filter === "paid")) &&
//       (categoryFilter === "all" || course.category === categoryFilter)
//     )
//   );

//   const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
//   const paginatedCourses = filteredCourses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage);

//   const getCategoryIcon = (category) => {
//     switch (category) {
//       case "Web Dev": return <BookOpen />;
//       case "Data Science": return <Brain />;
//       case "Education": return <GraduationCap />;
//       case "Marketing": return <Users />;
//       case "Cloud": return <Award />;
//       default: return <BookOpen />;
//     }
//   };

//   const getDashboardPath = () => userRole === "student" ? "/student-dashboard" : "/instructor-dashboard";

//   const handleEnroll = (course) => {
//     if (!isLoggedIn) {
//       navigate("/register");
//     } else if (userRole === "instructor") {
//       navigate(`/course/${course._id}`);
//     } else if (course.isFree) {
//       navigate(`/enroll/${course._id}`);
//     } else {
//       setSelectedCourse(course);
//     }
//   };

//   const generateInvoice = (course, paymentIntent) => {
//     const doc = new jsPDF();
//     const date = new Date().toLocaleDateString();
//     const userName = jwtDecode(Cookies.get("token")).fullName || "Test User";

//     doc.setFontSize(20);
//     doc.text("Invoice", 20, 20);
//     doc.setFontSize(12);
//     doc.text(`Date: ${date}`, 20, 30);
//     doc.text(`Invoice ID: ${paymentIntent.id}`, 20, 40);
//     doc.text(`Student: ${userName}`, 20, 50);
//     doc.text(`Course: ${course.name}`, 20, 60);
//     doc.text(`Amount: $${(course.price || 10).toFixed(2)}`, 20, 70);
//     doc.text(`Payment Status: Succeeded`, 20, 80);
//     doc.text("Thank you for your purchase!", 20, 100);

//     doc.save(`invoice_${course._id}_${date}.pdf`);
//   };

//   // const handlePaymentSuccess = async (course, paymentIntent) => {
//   //   try {
//   //     console.log("[Courses] Attempting enrollment for course:", course._id);
//   //     const enrollResponse = await api.post(`/enroll/${course._id}`);
//   //     console.log("[Courses] Enrollment response:", enrollResponse.data);

//   //     if (enrollResponse.data.message === "Enrollment successful") {
//   //       toast.success(`Successfully enrolled in ${course.name}!`, {
//   //         style: { background: "#10B981", color: "#fff" },
//   //       });
//   //       generateInvoice(course, paymentIntent);
//   //       navigate("/student-dashboard");
//   //     } else {
//   //       throw new Error("Unexpected enrollment response");
//   //     }
//   //   } catch (error) {
//   //     console.error("[Courses] Enrollment failed:", error.response?.data || error.message);
//   //     toast.error("Payment succeeded, but enrollment failed. Contact support.", {
//   //       style: { background: "#EF4444", color: "#fff" },
//   //     });
//   //     generateInvoice(course, paymentIntent); // Generate invoice even if enrollment fails
//   //     navigate("/student-dashboard"); // Still navigate, but inform user of issue
//   //   } finally {
//   //     setSelectedCourse(null);
//   //   }
//   // };

//   const handlePaymentSuccess = async (course, paymentIntent) => {
//     try {
//       console.log("[Courses] Attempting enrollment for course:", course._id);
//       console.log("[Courses] Enrollment payload:", { paymentId: paymentIntent.id });
//       const enrollResponse = await api.post(`/enroll/${course._id}`, {
//         paymentId: paymentIntent.id, // Include paymentId
//       });
//       console.log("[Courses] Enrollment response:", enrollResponse.data);
  
//       if (enrollResponse.data.message === "Enrollment successful") {
//         toast.success(`Successfully enrolled in ${course.name}!`, {
//           style: { background: "#10B981", color: "#fff" },
//         });
//         generateInvoice(course, paymentIntent);
//         navigate("/student-dashboard");
//       } else {
//         throw new Error("Unexpected enrollment response");
//       }
//     } catch (error) {
//       console.error("[Courses] Enrollment failed:", error.response?.data || error.message);
//       toast.error("Payment succeeded, but enrollment failed. Contact support.", {
//         style: { background: "#EF4444", color: "#fff" },
//       });
//       generateInvoice(course, paymentIntent); // Generate invoice even if enrollment fails
//       navigate("/student-dashboard"); // Still navigate, but inform user of issue
//     } finally {
//       setSelectedCourse(null);
//     }
//   };

//   if (loading) return <div>Loading courses...</div>;

//   return (
//     <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
//       <Toaster position="top-right" />
//       <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//           <Link to="/" className="flex items-center gap-2 group">
//             <GraduationCap className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300" />
//             <span className="text-xl font-bold text-gray-100 group-hover:text-cyan-300">Edustack</span>
//           </Link>
//           <div className="hidden md:flex items-center gap-6">
//             <Link to="/" className="text-gray-200 font-medium hover:text-cyan-400">Home</Link>
//             <Link to="/courses" className="text-gray-200 font-medium hover:text-cyan-400">Courses</Link>
//             <Link to="/ai-chat" className="text-gray-200 font-medium hover:text-cyan-400">AI Chat</Link>
//             {isLoggedIn ? (
//               <Link to={getDashboardPath()} className="text-gray-200 font-medium hover:text-cyan-400">Dashboard</Link>
//             ) : (
//               <>
//                 <Link to="/register" className="text-gray-200 font-medium hover:text-cyan-400">Register</Link>
//                 <Link to="/login" className="text-gray-200 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-full">Login</Link>
//               </>
//             )}
//           </div>
//           <button onClick={toggleMenu} className="md:hidden text-gray-200 hover:text-cyan-400">
//             {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//           </button>
//         </div>
//         {isMenuOpen && (
//           <div className="md:hidden bg-gray-900 px-4 py-4 space-y-2 border-t border-gray-700">
//             <Link to="/" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Home</Link>
//             <Link to="/courses" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Courses</Link>
//             <Link to="/ai-chat" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>AI Chat</Link>
//             {isLoggedIn ? (
//               <Link to={getDashboardPath()} className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Dashboard</Link>
//             ) : (
//               <>
//                 <Link to="/register" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Register</Link>
//                 <Link to="/login" className="block py-2 px-4 text-gray-200 bg-cyan-600 hover:bg-cyan-700" onClick={toggleMenu}>Login</Link>
//               </>
//             )}
//           </div>
//         )}
//       </nav>

//       <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
//         <div className="max-w-7xl mx-auto">
//           <div className="py-12 mb-12 border-b border-gray-800">
//             <h1 className="text-4xl font-bold text-gray-100 text-center mb-4">All Courses</h1>
//             <p className="text-lg text-gray-400 text-center max-w-3xl mx-auto">Explore our comprehensive course catalog designed to meet your learning needs.</p>
//           </div>

//           <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-12">
//             <div className="w-full sm:w-1/3">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Search courses..."
//                   className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-700 text-gray-200 rounded-md hover:border-gray-600"
//                 />
//                 {searchQuery && (
//                   <XCircle
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-cyan-400 cursor-pointer"
//                     onClick={() => setSearchQuery("")}
//                   />
//                 )}
//               </div>
//             </div>
//             <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
//               <div className="flex gap-2 bg-gray-700 p-1 rounded-md border border-gray-700 w-full sm:w-auto">
//                 {["all", "free", "paid"].map((f) => (
//                   <button
//                     key={f}
//                     onClick={() => setFilter(f)}
//                     className={`flex-1 sm:flex-none px-4 py-2 rounded-md font-medium ${filter === f ? "bg-cyan-600 text-white" : "text-gray-300 hover:bg-gray-600 hover:text-cyan-400"}`}
//                   >
//                     {f === "all" ? "All" : f === "free" ? "Free" : "Paid"}
//                   </button>
//                 ))}
//               </div>
//               <select
//                 value={categoryFilter}
//                 onChange={(e) => setCategoryFilter(e.target.value)}
//                 className="w-full sm:w-auto bg-gray-700 border border-gray-700 text-gray-200 rounded-md px-4 py-2 hover:border-gray-600"
//               >
//                 {categories.map(cat => (
//                   <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
//                 ))}
//               </select>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value)}
//                 className="w-full sm:w-auto bg-gray-700 border border-gray-700 text-gray-200 rounded-md px-4 py-2 hover:border-gray-600"
//               >
//                 <option value="default">Sort By</option>
//                 <option value="costAsc">Cost: Low to High</option>
//                 <option value="costDesc">Cost: High to Low</option>
//                 <option value="durationAsc">Duration: Short to Long</option>
//                 <option value="durationDesc">Duration: Long to Short</option>
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {paginatedCourses.length > 0 ? (
//               paginatedCourses.map(course => (
//                 <div
//                   key={course._id}
//                   className="bg-gray-900 rounded-md shadow-md border border-gray-800 hover:border-cyan-400 hover:scale-110 hover:shadow-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] flex flex-col transition-all duration-300 group"
//                 >
//                   <div className="flex justify-center pt-6 pb-4">
//                     <div className="bg-cyan-800/30 rounded-full p-4">
//                       <span className="h-12 w-12 text-cyan-400">{getCategoryIcon(course.category)}</span>
//                     </div>
//                   </div>
//                   <div className="px-5 pb-5 flex flex-col flex-grow">
//                     <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300">{course.name}</h3>
//                     <p className="text-sm text-gray-400 mb-3">{course.description || "No description available"}</p>
//                     {course.duration && <div className="text-sm text-gray-400 mb-2 group-hover:text-cyan-400">{course.duration} ({course.durationHours} hours)</div>}
//                     <div className="text-sm text-gray-400 mb-2 group-hover:text-cyan-400">
//                       Instructor: {course.instructor ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() || "Unknown" : "Unknown"}
//                     </div>
//                     <div className="flex items-center justify-between mb-4">
//                       <span className="text-lg font-bold text-gray-200 group-hover:text-cyan-300">
//                         {course.isFree ? "Free" : course.price ? `$${course.price}` : "N/A"}
//                       </span>
//                     </div>
//                     <button
//                       onClick={() => handleEnroll(course)}
//                       className="block w-full text-center bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-700 hover:scale-105 hover:shadow-[0_0_10px_rgba(34,211,238,0.7)] mt-auto transition-all duration-300"
//                     >
//                       {isLoggedIn ? (userRole === "student" ? "Enroll Now" : "View Progress") : "Enroll Now"}
//                     </button>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <div className="col-span-full text-center text-gray-400 py-12">
//                 <p>No courses found. Try adjusting your search or filter.</p>
//               </div>
//             )}
//           </div>

//           {totalPages > 1 && (
//             <div className="flex justify-center items-center gap-4 mt-12">
//               <button
//                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                 disabled={currentPage === 1}
//                 className="p-2 text-gray-200 hover:text-cyan-400 disabled:text-gray-600"
//               >
//                 <ChevronLeft className="h-6 w-6" />
//               </button>
//               <span className="text-sm text-gray-400">
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                 disabled={currentPage === totalPages}
//                 className="p-2 text-gray-200 hover:text-cyan-400 disabled:text-gray-600"
//               >
//                 <ChevronRight className="h-6 w-6" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {selectedCourse && (
//         <Elements stripe={stripePromise}>
//           <CheckoutForm
//             course={selectedCourse}
//             onClose={() => setSelectedCourse(null)}
//             onSuccess={handlePaymentSuccess}
//           />
//         </Elements>
//       )}
//     </section>
//   );
// }

// export default Courses;


import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, GraduationCap, Award, Brain, Menu, X, Search, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../Utility/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import toast, { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const CheckoutForm = ({ course, onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setError("Payment form is not ready. Check Stripe publishable key configuration.");
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const response = await api.post("/create-payment-intent", {
        amount: (course.price || 10) * 100,
        currency: "inr",
        courseId: course._id,
      });

      const { clientSecret } = response.data;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: "Test User" },
        },
      });

      if (result.error) {
        setError(result.error.message);
        toast.error(result.error.message, { style: { background: "#EF4444", color: "#fff" } });
      } else if (result.paymentIntent.status === "succeeded") {
        console.log("[CheckoutForm] Payment succeeded:", result.paymentIntent);
        onSuccess(course, result.paymentIntent);
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
      toast.error("Payment failed. Please try again.", { style: { background: "#EF4444", color: "#fff" } });
      console.error("[CheckoutForm] Payment error:", err.response?.data || err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-100">Enroll in {course.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-cyan-400">
            <X className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-400 mb-4">Price: ${course.price || 10} (Test Mode)</p>
        <form onSubmit={handleSubmit}>
          <CardElement className="bg-gray-700 p-3 rounded-lg text-gray-200 border border-gray-600 mb-4" />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-cyan-600 text-white py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50"
          >
            {processing ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>
    </div>
  );
};

function Courses() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const coursesPerPage = 6;

  const categories = ["all", "Web Dev", "Data Science", "Education", "Marketing", "Cloud"];

  useEffect(() => {
    const token = Cookies.get("token");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    const fetchUserRoleAndCourses = async () => {
      try {
        if (loggedIn) {
          const decoded = jwtDecode(token);
          setUserRole(decoded.userType || "student");

          const endpoint = decoded.userType === "instructor" ? "/courses" : "/courses/public";
          const coursesResponse = await api.get(endpoint);
          setCourses(coursesResponse.data);
        } else {
          setUserRole("student");
          const coursesResponse = await api.get("/courses/public");
          setCourses(coursesResponse.data);
        }
      } catch (error) {
        console.error("[Courses] Error fetching data:", error.response?.data || error.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndCourses();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const sortCourses = (courses) => {
    switch (sortBy) {
      case "costAsc":
        return [...courses].sort((a, b) => (a.isFree ? -1 : b.isFree ? 1 : (a.price || 0) - (b.price || 0)));
      case "costDesc":
        return [...courses].sort((a, b) => (b.isFree ? -1 : a.isFree ? 1 : (b.price || 0) - (a.price || 0)));
      case "durationAsc":
        return [...courses].sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
      case "durationDesc":
        return [...courses].sort((a, b) => (b.durationHours || 0) - (a.durationHours || 0));
      default:
        return courses;
    }
  };

  const filteredCourses = sortCourses(
    courses.filter(course =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filter === "all" || (course.isFree ? filter === "free" : filter === "paid")) &&
      (categoryFilter === "all" || course.category === categoryFilter)
    )
  );

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage);

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

  const getDashboardPath = () => userRole === "student" ? "/student-dashboard" : "/instructor-dashboard";

  const handleEnroll = (course) => {
    if (!isLoggedIn) {
      navigate("/register");
    } else if (userRole === "instructor") {
      navigate(`/course/${course._id}`);
    } else if (course.isFree) {
      navigate(`/enroll/${course._id}`);
    } else {
      if (!stripePromise) {
        toast.error("Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in client/.env.", {
          style: { background: "#EF4444", color: "#fff" },
        });
        return;
      }
      setSelectedCourse(course);
    }
  };

  const generateInvoice = (course, paymentIntent) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    const userName = jwtDecode(Cookies.get("token")).fullName || "Test User";

    doc.setFontSize(20);
    doc.text("Invoice", 20, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 20, 30);
    doc.text(`Invoice ID: ${paymentIntent.id}`, 20, 40);
    doc.text(`Student: ${userName}`, 20, 50);
    doc.text(`Course: ${course.name}`, 20, 60);
    doc.text(`Amount: $${(course.price || 10).toFixed(2)}`, 20, 70);
    doc.text(`Payment Status: Succeeded`, 20, 80);
    doc.text("Thank you for your purchase!", 20, 100);

    doc.save(`invoice_${course._id}_${date}.pdf`);
  };

  const handlePaymentSuccess = async (course, paymentIntent) => {
    try {
      console.log("[Courses] Attempting enrollment for course:", course._id);
      console.log("[Courses] Enrollment payload:", { paymentId: paymentIntent.id });

      // Use appropriate endpoint based on course type
      const enrollEndpoint = course.isFree ? `/enroll/${course._id}` : `/enroll/paid/${course._id}`;
      const enrollResponse = await api.post(enrollEndpoint, {
        paymentId: paymentIntent.id, // Only sent for paid courses; backend will ignore for free
      });
      console.log("[Courses] Enrollment response:", enrollResponse.data);

      if (
        typeof enrollResponse.data.message === "string" &&
        enrollResponse.data.message.toLowerCase().includes("enrollment successful")
      ) {
        window.dispatchEvent(new Event("enrollmentSuccess"));
        toast.success(`Successfully enrolled in ${course.name}!`, {
          style: { background: "#10B981", color: "#fff" },
        });
        generateInvoice(course, paymentIntent);
        navigate(`/course/${course._id}`); // Redirect to course page instead of dashboard
      } else {
        throw new Error("Unexpected enrollment response");
      }
    } catch (error) {
      console.error("[Courses] Enrollment failed:", error.response?.data || error.message);
      toast.error("Payment succeeded, but enrollment failed. Contact support.", {
        style: { background: "#EF4444", color: "#fff" },
      });
      generateInvoice(course, paymentIntent);
      navigate("/student-dashboard");
    } finally {
      setSelectedCourse(null);
    }
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <Toaster position="top-right" />
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <GraduationCap className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300" />
            <span className="text-xl font-bold text-gray-100 group-hover:text-cyan-300">Edustack</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-200 font-medium hover:text-cyan-400">Home</Link>
            <Link to="/courses" className="text-gray-200 font-medium hover:text-cyan-400">Courses</Link>
            <Link to="/ai-chat" className="text-gray-200 font-medium hover:text-cyan-400">AI Chat</Link>
            {isLoggedIn ? (
              <Link to={getDashboardPath()} className="text-gray-200 font-medium hover:text-cyan-400">Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="text-gray-200 font-medium hover:text-cyan-400">Register</Link>
                <Link to="/login" className="text-gray-200 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-full">Login</Link>
              </>
            )}
          </div>
          <button onClick={toggleMenu} className="md:hidden text-gray-200 hover:text-cyan-400">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 px-4 py-4 space-y-2 border-t border-gray-700">
            <Link to="/" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Home</Link>
            <Link to="/courses" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Courses</Link>
            <Link to="/ai-chat" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>AI Chat</Link>
            {isLoggedIn ? (
              <Link to={getDashboardPath()} className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="block py-2 px-4 text-gray-200 hover:bg-gray-800 hover:text-cyan-400" onClick={toggleMenu}>Register</Link>
                <Link to="/login" className="block py-2 px-4 text-gray-200 bg-cyan-600 hover:bg-cyan-700" onClick={toggleMenu}>Login</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="py-12 mb-12 border-b border-gray-800">
            <h1 className="text-4xl font-bold text-gray-100 text-center mb-4">All Courses</h1>
            <p className="text-lg text-gray-400 text-center max-w-3xl mx-auto">Explore our comprehensive course catalog designed to meet your learning needs.</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-12">
            <div className="w-full sm:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-700 text-gray-200 rounded-md hover:border-gray-600"
                />
                {searchQuery && (
                  <XCircle
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-cyan-400 cursor-pointer"
                    onClick={() => setSearchQuery("")}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex gap-2 bg-gray-700 p-1 rounded-md border border-gray-700 w-full sm:w-auto">
                {["all", "free", "paid"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-md font-medium ${filter === f ? "bg-cyan-600 text-white" : "text-gray-300 hover:bg-gray-600 hover:text-cyan-400"}`}
                  >
                    {f === "all" ? "All" : f === "free" ? "Free" : "Paid"}
                  </button>
                ))}
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto bg-gray-700 border border-gray-700 text-gray-200 rounded-md px-4 py-2 hover:border-gray-600"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-gray-700 border border-gray-700 text-gray-200 rounded-md px-4 py-2 hover:border-gray-600"
              >
                <option value="default">Sort By</option>
                <option value="costAsc">Cost: Low to High</option>
                <option value="costDesc">Cost: High to Low</option>
                <option value="durationAsc">Duration: Short to Long</option>
                <option value="durationDesc">Duration: Long to Short</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.length > 0 ? (
              paginatedCourses.map(course => (
                <div
                  key={course._id}
                  className="bg-gray-900 rounded-md shadow-md border border-gray-800 hover:border-cyan-400 hover:scale-110 hover:shadow-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] flex flex-col transition-all duration-300 group"
                >
                  <div className="flex justify-center pt-6 pb-4">
                    <div className="bg-cyan-800/30 rounded-full p-4">
                      <span className="h-12 w-12 text-cyan-400">{getCategoryIcon(course.category)}</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300">{course.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{course.description || "No description available"}</p>
                    {course.duration && <div className="text-sm text-gray-400 mb-2 group-hover:text-cyan-400">{course.duration} ({course.durationHours} hours)</div>}
                    <div className="text-sm text-gray-400 mb-2 group-hover:text-cyan-400">
                      Instructor: {course.instructor ? `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() || "Unknown" : "Unknown"}
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-gray-200 group-hover:text-cyan-300">
                        {course.isFree ? "Free" : course.price ? `$${course.price}` : "N/A"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEnroll(course)}
                      className="block w-full text-center bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-700 hover:scale-105 hover:shadow-[0_0_10px_rgba(34,211,238,0.7)] mt-auto transition-all duration-300"
                    >
                      {isLoggedIn ? (userRole === "student" ? "Enroll Now" : "View Progress") : "Enroll Now"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 py-12">
                <p>No courses found. Try adjusting your search or filter.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-200 hover:text-cyan-400 disabled:text-gray-600"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-200 hover:text-cyan-400 disabled:text-gray-600"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedCourse && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onSuccess={handlePaymentSuccess}
          />
        </Elements>
      )}
    </section>
  );
}

export default Courses;
