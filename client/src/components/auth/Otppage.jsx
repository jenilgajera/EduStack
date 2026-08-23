import { useState } from "react";
import api from "../../Utility/api";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Key, Loader2 } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

function Otppage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const emailSent = location.state?.emailSent !== false;

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !otp) {
      toast.error("Please enter the OTP");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/otp-verify", {
        email,
        otp,
      });

      if (response.data.status === true) {
        toast.success("OTP verified successfully!");
        navigate("/login");
      } else {
        toast.error(response.data.message);
        setOtp("");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "OTP verification failed";
      toast.error(errorMessage);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await api.post("/auth/resend-otp", {
        email,
      });

      if (response.data.status) {
        if (response.data.emailSent) {
          toast.success("OTP resent successfully!");
        } else {
          toast.warning(
            response.data.message ||
              "Email not sent — check the server terminal for the new OTP."
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

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Allow only digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <section className="bg-gradient-to-br from-gray-950 to-gray-900 min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-xs sm:max-w-sm bg-gray-900/95 rounded-xl shadow-lg border border-gray-800 transform transition-all duration-300 hover:shadow-xl mx-auto">
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="p-2 sm:p-3 bg-cyan-700/50 rounded-full transition-transform duration-300 hover:scale-110 shadow-md">
              <Key
                className="h-8 w-8 sm:h-9 sm:w-9 text-cyan-300"
                strokeWidth={1.8}
              />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight text-gray-100 text-center drop-shadow-md">
            Verify OTP
          </h1>

          {!emailSent && (
            <p className="text-xs sm:text-sm text-amber-200/90 bg-amber-950/40 border border-amber-600/40 rounded-lg px-3 py-2 text-center">
              Email was not delivered. Open the terminal where you run <code className="text-cyan-300">npm start</code>{" "}
              (server) and copy the OTP printed there. Then add{" "}
              <code className="text-cyan-300">EMAIL_USER</code> and{" "}
              <code className="text-cyan-300">EMAIL_PASS</code> (Gmail App Password) in{" "}
              <code className="text-cyan-300">server/.env</code>.
            </p>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleVerifyOtp}>
            <div className="relative flex justify-center">
              <div className="w-full">
                <div className="flex items-center">
                  <Key className="absolute left-3 h-5 sm:h-6 w-5 sm:w-6 text-gray-400 z-10" />
                  <input
                    type="tel"
                    id="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                    autoFocus
                    className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 ${otp.length === 6 ? "border-gray-600" : "border-red-500"} text-gray-100 text-lg sm:text-xl rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:shadow-inner block w-full pl-14 sm:pl-16 p-3 sm:p-3.5 placeholder-gray-500 transition-all duration-300 shadow-md hover:shadow-lg`}
                    placeholder="••••••"
                    required
                  />
                </div>
                {otp.length > 0 && otp.length < 6 && (
                  <span className="text-red-400 text-xs mt-1 block text-center">
                    OTP must be 6 digits
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full text-gray-100 bg-cyan-700 hover:bg-cyan-800 focus:ring-4 focus:outline-none focus:ring-cyan-600 focus:ring-opacity-50 font-semibold rounded-lg text-sm px-3 sm:px-4 py-2 sm:py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-1" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>

            <div className="text-center mt-3 sm:mt-4">
              <span className="text-sm text-gray-400">
                Didn’t receive OTP?{" "}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline transition-colors duration-200 disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Otppage;