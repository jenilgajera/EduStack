import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user } = useAuth();

  // Still loading
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) return <Navigate to="/login" replace />;

  // Role-based redirect
  const path = window.location.pathname;
  if (user.role === "instructor" && path === "/student-dashboard")
    return <Navigate to="/instructor-dashboard" replace />;
  if (user.role === "student" && path === "/instructor-dashboard")
    return <Navigate to="/student-dashboard" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
