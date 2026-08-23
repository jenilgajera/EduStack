// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Forgot from "./components/auth/Forgot";
import Otppage from "./components/auth/Otppage";
import ProtectedRoute from "./components/protectedRoute";
import StudentDashboard from "./components/student/StudentDashboard";
import NotFound from "./components/NotFound";
import Home from "./components/Home";
import Courses from "./components/Courses";
import Chatbot from "./components/student/Chatbot";
import InstructorDashboard from "./components/instuctor/InstructorDashboard";
import InstructorStudents from "./components/instuctor/InstructorStudents";
import CourseManagementPage from "./components/instuctor/CourseManagementPage";
import StudentQuizPage from "./components/student/StudentQuizPage";
import Enroll from "./components/student/Enroll";
import CourseView from "./components/student/CourseView";
import InstructorLiveSession from "./components/instuctor/InstructorLiveSession";
import StudentLiveSession from "./components/student/StudentLiveSession";
import RecordedSessionView from "./components/student/RecordedSessionView";
import StudentProfile from "./components/student/StudentProfile";
import About from "./components/About";
import Contact from "./components/Contact";
import AdminDashboard from "./components/admin/AdminDashboard";
import Instructors from "./components/webrtc/Instructor";
import Students from "./components/webrtc/Student";
import JoinLiveSession from "./components/services/JoinLiveSession";
import Chatpage from "./components/student/ChatPage";
import InstructorChatbot from "./components/instuctor/InstructorChatbot";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/otppage" element={<Otppage />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/join-session" element={<JoinLiveSession />} />
          <Route path="/ai-chat" element={<Chatbot />} />
          <Route path="/chat/:courseId" element={<Chatpage />} />
          <Route path="/chat" element={<Navigate to="/student-chat" replace />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student-chat" element={<Chatbot />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/quiz/:courseId/:quizId" element={<StudentQuizPage />} />
          <Route path="/enroll/:courseId" element={<Enroll />} />
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/students" element={<InstructorStudents />} />
          <Route path="/instructor/manage-course/:courseId" element={<CourseManagementPage />} />
          <Route path="/instructor-chat" element={<InstructorChatbot />} />
          <Route path="/course/:courseId" element={<CourseView />} />
          <Route path="/live-session/student/:sessionId" element={<StudentLiveSession />} /> 
          <Route path="/instructor/live-session/:sessionId" element={<InstructorLiveSession />} /> {/* Updated */}
          <Route path="/student/recorded-session/:courseId/:sessionId" element={<RecordedSessionView />} />
        </Route>

        <Route path="/instructors" element={<Instructors />} />
        <Route path="/students" element={<Students />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;