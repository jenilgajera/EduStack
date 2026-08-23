import { useForm } from "react-hook-form";
import { useState } from "react";
import api from "../../Utility/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Key, Loader2 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const FORGOT_STEPS = {
  REQUEST_OTP: 1,
  VERIFY_OTP: 2,
};

function Forgot() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(FORGOT_STEPS.REQUEST_OTP);
  const [email, setEmail] = useState("");
  const password = watch("password");

  const handleRequestOTP = async (data) => {
    try {
      setLoading(true);
      const response = await api.post("/auth/forgot", {
        email: data.email,
      });

      if (response.data.status) {
        setEmail(data.email);
        setStep(FORGOT_STEPS.VERIFY_OTP);
        if (response.data.emailSent !== false) {
          toast.success(response.data.message || "OTP sent to your email!");
        } else {
          toast.warning(
            response.data.message ||
              "Check the server terminal for OTP — configure EMAIL_USER / EMAIL_PASS in server/.env."
          );
        }
      } else {
        toast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      const response = await api.post("/auth/verify-forgot-otp", {
        email: email,
        otp: data.otp,
        password: data.password,
      });

      if (response.data.status) {
        toast.success("Password reset successfully!");
        navigate("/login");
      } else {
        toast.error(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const response = await api.post("/auth/resend-forgot-otp", {
        email,
      });

      if (response.data.status) {
        if (response.data.emailSent !== false) {
          toast.success(response.data.message || "New OTP sent to your email");
        } else {
          toast.warning(
            response.data.message || "New OTP is in the server terminal (email not sent)."
          );
        }
      } else {
        toast.error(response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message : "Failed to resend OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data) => {
    if (step === FORGOT_STEPS.REQUEST_OTP) {
      handleRequestOTP(data);
    } else if (step === FORGOT_STEPS.VERIFY_OTP) {
      handleResetPassword(data);
    }
  };

  return (
    <section className="bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-xs sm:max-w-sm bg-gray-900/95 rounded-xl shadow-lg border border-gray-800 transform transition-all duration-300 hover:shadow-xl mx-auto">
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="p-2 sm:p-3 bg-cyan-700/50 rounded-full transition-transform duration-300 hover:scale-110 shadow-md">
              <Lock className="h-8 w-8 sm:h-9 sm:w-9 text-cyan-300" strokeWidth={1.8} />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight text-gray-100 text-center drop-shadow-md">
            Reset Your Password
          </h1>

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {step === FORGOT_STEPS.REQUEST_OTP && (
              <div className="relative">
                <div className="flex items-center">
                  <Mail className="absolute left-3 h-5 sm:h-6 w-5 sm:w-6 text-gray-400 z-10" />
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
                    className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 ${errors.email ? "border-red-500" : "border-gray-600"} text-gray-100 text-base sm:text-lg rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:shadow-inner block w-full pl-14 sm:pl-16 p-2 sm:p-2.5 placeholder-gray-500 transition-all duration-300 shadow-md hover:shadow-lg`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
                )}
              </div>
            )}

            {step === FORGOT_STEPS.VERIFY_OTP && (
              <>
                <div className="relative">
                  <div className="flex items-center">
                    <Key className="absolute left-3 h-5 sm:h-6 w-5 sm:w-6 text-gray-400 z-10" />
                    <input
                      type="tel"
                      id="otp"
                      {...register("otp", { 
                        required: "OTP is required",
                        pattern: {
                          value: /^\d{6}$/,
                          message: "OTP must be 6 digits",
                        },
                      })}
                      className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 ${errors.otp ? "border-red-500" : "border-gray-600"} text-gray-100 text-base sm:text-lg rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:shadow-inner block w-full pl-14 sm:pl-16 p-2 sm:p-2.5 placeholder-gray-500 transition-all duration-300 shadow-md hover:shadow-lg`}
                      placeholder="••••••"
                    />
                  </div>
                  {errors.otp && (
                    <span className="text-red-400 text-xs mt-1 block">{errors.otp.message}</span>
                  )}
                </div>

                <div className="relative">
                  <div className="flex items-center">
                    <Lock className="absolute left-3 h-5 sm:h-6 w-5 sm:w-6 text-gray-400 z-10" />
                    <input
                      type="password"
                      id="password"
                      {...register("password", { 
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                      className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 ${errors.password ? "border-red-500" : "border-gray-600"} text-gray-100 text-base sm:text-lg rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:shadow-inner block w-full pl-14 sm:pl-16 p-2 sm:p-2.5 placeholder-gray-500 transition-all duration-300 shadow-md hover:shadow-lg`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
                  )}
                </div>

                <div className="relative">
                  <div className="flex items-center">
                    <Lock className="absolute left-3 h-5 sm:h-6 w-5 sm:w-6 text-gray-400 z-10" />
                    <input
                      type="password"
                      id="confirm-password"
                      {...register("confirmPassword", {
                        required: "Please confirm your password",
                        validate: (value) => value === password || "Passwords do not match",
                      })}
                      className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 ${errors.confirmPassword ? "border-red-500" : "border-gray-600"} text-gray-100 text-base sm:text-lg rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:shadow-inner block w-full pl-14 sm:pl-16 p-2 sm:p-2.5 placeholder-gray-500 transition-all duration-300 shadow-md hover:shadow-lg`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-400 text-xs mt-1 block">{errors.confirmPassword.message}</span>
                  )}
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors duration-200 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-gray-100 bg-cyan-700 hover:bg-cyan-800 focus:ring-4 focus:outline-none focus:ring-cyan-600 focus:ring-opacity-50 font-semibold rounded-lg text-sm px-3 sm:px-4 py-2 sm:py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-1" />
                  Processing...
                </>
              ) : step === FORGOT_STEPS.REQUEST_OTP ? "Send OTP" : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Forgot;