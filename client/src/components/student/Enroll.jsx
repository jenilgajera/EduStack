import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Utility/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { BookOpen, ArrowLeft,ChevronDown,ChevronUp ,X,ExternalLink } from "lucide-react";

function Enroll() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syllabusOpen, setSyllabusOpen] = useState(false); // Toggl
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal

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

        const response = await api.get(`/courses/${courseId}`);
        console.log("Enroll.jsx - Course fetched:", response.data);
        setCourse(response.data);
      } catch (err) {
        console.error("Enroll.jsx - Error fetching course:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  const handleEnroll = async () => {
    try {
      const response = await api.post(`/courses/${courseId}/enroll`);
      console.log("Enroll.jsx - Enrollment response:", response.data);
      if (course.isFree) {
        alert("Successfully enrolled in the course!");
        navigate(`/course/${courseId}`); // Updated redirect
      } else {
        alert("Payment required for this course."); // Placeholder for paid course logic
      }
    } catch (error) {
      console.error("Enroll.jsx - Error enrolling:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to enroll");
    }
  };

  const toggleSyllabus = () => setSyllabusOpen(!syllabusOpen);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">{error}</p>
        <button onClick={() => navigate("/courses")} className="text-cyan-400 hover:underline">Back to Courses</button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Course not found</p>
        <button onClick={() => navigate("/courses")} className="text-cyan-400 hover:underline">Back to Courses</button>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md border border-gray-800 p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-cyan-400" />
          <h1 className="text-3xl font-bold text-gray-100">Enroll in {course.name}</h1>
        </div>
        <p className="text-gray-400 mb-4">{course.description || "No description available"}</p>
        <p className="text-gray-400 mb-4">
          <strong>Instructor:</strong> {course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : "Unknown"}
        </p>
        <p className="text-gray-400 mb-4">
          <strong>Cost:</strong> {course.isFree ? "Free" : course.price ? `₹${course.price}` : "N/A"}
        </p>
      {/* Syllabus Section with Scrollbar */}
         {/* Syllabus Section with Scrollbar and Full View Button */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={toggleSyllabus}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 focus:outline-none"
            >
              <span className="text-lg font-semibold">View Syllabus</span>
              {syllabusOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            <button
              onClick={openModal}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 focus:outline-none"
              title="View Full Syllabus"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="text-sm">Full View</span>
            </button>
          </div>
          {syllabusOpen && (
            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
              {course.syllabus ? (
                <p className="text-gray-300 whitespace-pre-wrap">{course.syllabus}</p>
              ) : (
                <p className="text-gray-400">No syllabus available for this course.</p>
              )}
            </div>
          )}
        </div>
        {course.isFree ? (
          <p className="text-green-400 mb-6">This is a free course. Click below to enroll and start learning immediately!</p>
        ) : (
          <p className="text-yellow-400 mb-6">This course requires payment. Enrollment is not yet implemented for paid courses.</p>
        )}
        <div className="flex gap-4">
          <button
            onClick={handleEnroll}
            className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-cyan-700 transition-all duration-300"
            disabled={!course.isFree}
          >
            Enroll Now
          </button>
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Courses
          </button>
        </div>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>



{/* Modal for Full Syllabus */}
{isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-100">Full Syllabus for {course.name}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-200">
                <X className="h-6 w-6" />
              </button>
            </div>
            {course.syllabus ? (
              <p className="text-gray-300 whitespace-pre-wrap">{course.syllabus}</p>
            ) : (
              <p className="text-gray-400">No syllabus available for this course.</p>
            )}
          </div>
        </div>
      )}


      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; /* Dark gray track (gray-800) */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; /* Medium gray thumb (gray-600) */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* Lighter gray on hover (gray-500) */
        }
        /* Firefox support */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937; /* thumb track */
        }
      `}</style>

      
    </section>
  );
}

export default Enroll;



