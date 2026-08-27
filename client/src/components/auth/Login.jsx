// src/components/Login.jsx
import { useForm } from "react-hook-form";
import api from "../../Utility/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Loader2, BookOpen } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from "../../context/AuthContext";

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    const { email, password } = data;
    const payload = { email, password };

    try {
      const response = await api.post("/auth/login", payload);
      if (response.data.status === true) {
          toast.success('Login successful!', { icon: '👏' });
          setUser({ role: response.data.userType, email });
          setTimeout(() => {
            if (email === "admin@example.com") {
              window.location.replace("/admin-dashboard");
            } else {
              const dashboard = response.data.userType === "instructor"
                ? "/instructor-dashboard"
                : "/student-dashboard";
              window.location.replace(dashboard);
            }
          }, 200);
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed! Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div><Toaster position="top-center" reverseOrder={false} /> </div>
      <div className="w-full max-w-md bg-gray-900/95 rounded-lg shadow border border-gray-800 transform transition-all duration-300 hover:shadow-xl mx-auto">
        <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-cyan-800/40 rounded-full transition-transform duration-300 hover:scale-105">
              <BookOpen 
                className="h-10 w-10 sm:h-12 sm:w-12 text-cyan-400"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight tracking-tight text-gray-200 text-center">
            Welcome Back
          </h1>

          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-400">
                Your email
              </label>
              <div className="flex items-center">
                <Mail className="absolute left-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <input
                  type="email"
                  id="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && <span className="text-red-400 text-xs sm:text-sm mt-1">{errors.email.message}</span>}
            </div>

            <div className="relative">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-400">
                Password
              </label>
              <div className="flex items-center">
                <Lock className="absolute left-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <input
                  type="password"
                  id="password"
                  {...register("password", { 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <span className="text-red-400 text-xs sm:text-sm mt-1">{errors.password.message}</span>}
            </div>

            <div className="text-right">
              <a href="/forgot" className="text-xs sm:text-sm font-medium text-cyan-400 hover:underline hover:text-cyan-300 transition-colors duration-200">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-gray-100 bg-cyan-800 hover:bg-cyan-900 focus:ring-4 focus:outline-none focus:ring-cyan-700 focus:ring-opacity-50 font-medium rounded-lg text-sm px-4 py-2 sm:px-5 sm:py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>

            <div className="text-center mt-4">
              <span className="text-xs sm:text-sm text-gray-500"> Don't have an account? </span>
              <a href="/register" className="text-xs sm:text-sm font-medium text-cyan-400 hover:underline hover:text-cyan-300 transition-colors duration-200">
                Sign up
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Login;
