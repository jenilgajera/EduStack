import { useForm } from "react-hook-form";
import api from "../../Utility/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Mail, Lock, Loader2, UserPlus, User, Calendar } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const password = watch("password");

  const onSubmit = (data) => {
    setLoading(true);
    const { username, email, firstName, lastName, password, dob, userType } = data;
    const payload = {
      username,
      email,
      firstName,
      lastName,
      password,
      dob,
      userType,
    };

    api
      .post("/auth/register", payload)
      .then((response) => {
        setLoading(false);
        if (response.data.status === true) {
          if (response.data.emailSent) {
            toast.success("Registration successful! Please check your email for OTP.");
          } else {
            toast.warning(
              response.data.message ||
                "Email not sent — open the terminal where the server runs to copy the OTP."
            );
          }
          navigate("/otppage", {
            state: {
              email: payload.email,
              userType: payload.userType,
              emailSent: response.data.emailSent !== false,
            },
          });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage = error.response?.data?.message || "Registration failed! Please try again.";
        toast.error(errorMessage);
      });
  };

  return (
    <section className="bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-md sm:max-w-lg bg-gray-900/95 rounded-lg shadow border border-gray-800 transform transition-all duration-300 hover:shadow-xl mx-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="p-2 sm:p-3 bg-cyan-800/40 rounded-full transition-transform duration-300 hover:scale-105">
              <UserPlus
                className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-400"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-bold leading-tight tracking-tight text-gray-200 text-center">
            Create Your Account
          </h1>

          <form
            className="space-y-4 sm:space-y-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="username"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  Username
                </label>
                <div className="flex items-center">
                  <User className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="text"
                    id="username"
                    {...register("username", {
                      required: "Username is required",
                      minLength: {
                        value: 3,
                        message: "Username must be at least 3 characters",
                      },
                      maxLength: {
                        value: 30,
                        message: "Username must be less than 30 characters",
                      },
                    })}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="Username"
                  />
                </div>
                {errors.username && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div className="relative">
                <label
                  htmlFor="firstName"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  First Name
                </label>
                <div className="flex items-center">
                  <User className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="text"
                    id="firstName"
                    {...register("firstName", {
                      required: "First name is required",
                      maxLength: {
                        value: 50,
                        message: "First name must be less than 50 characters",
                      },
                    })}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="First Name"
                  />
                </div>
                {errors.firstName && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="lastName"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  Last Name
                </label>
                <div className="flex items-center">
                  <User className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="text"
                    id="lastName"
                    {...register("lastName", {
                      required: "Last name is required",
                      maxLength: {
                        value: 50,
                        message: "Last name must be less than 50 characters",
                      },
                    })}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="Last Name"
                  />
                </div>
                {errors.lastName && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              <div className="relative">
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  Your Email
                </label>
                <div className="flex items-center">
                  <Mail className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                        message: "Invalid email format",
                      },
                    })}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="dob"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  Date of Birth
                </label>
                <div className="flex items-center">
                  <Calendar className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="date"
                    id="dob"
                    {...register("dob", {
                      required: "Date of Birth is required",
                    })}
                    max="2015-12-31"
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                  />
                </div>
                {errors.dob && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.dob.message}
                  </span>
                )}
              </div>
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  Password
                </label>
                <div className="flex items-center">
                  <Lock className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="password"
                    id="password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters long",
                      },
                    })}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.password.message}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <label
                  htmlFor="userType"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  User Type
                </label>
                <select
                  id="userType"
                  {...register("userType", {
                    required: "User type is required",
                  })}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                >
                  <option value="">Select User Type</option>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option> 
                </select>
                {errors.userType && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.userType.message}
                  </span>
                )}
              </div>
              <div className="relative">
                <label
                  htmlFor="confirm-password"
                  className="block mb-1 text-sm font-medium text-gray-400"
                >
                  Confirm Password
                </label>
                <div className="flex items-center">
                  <Lock className="absolute left-3 h-4 sm:h-5 w-4 sm:w-5 text-gray-500" />
                  <input
                    type="password"
                    id="confirm-password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === password || "Passwords do not match",
                    })}
                    className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-9 sm:pl-10 p-2 sm:p-2.5 placeholder-gray-500 focus:ring-opacity-50 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <span className="text-red-400 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-gray-100 bg-cyan-800 hover:bg-cyan-900 focus:ring-4 focus:outline-none focus:ring-cyan-700 focus:ring-opacity-50 font-medium rounded-lg text-sm px-4 sm:px-5 py-2 sm:py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                  Registering...
                </>
              ) : (
                "Create an account"
              )}
            </button>

            <div className="text-center mt-3 sm:mt-4">
              <span className="text-sm text-gray-500">
                Already have an account?{" "}
              </span>
              <a
                href="/login"
                className="text-sm font-medium text-cyan-400 hover:underline hover:text-cyan-300 transition-colors duration-200"
              >
                Login here
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Register;
