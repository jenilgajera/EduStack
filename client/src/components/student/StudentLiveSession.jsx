import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, ArrowLeft } from "lucide-react";
import { LiveSessionService } from "../services/liveSessionService";
import { toast, Toaster } from "react-hot-toast";
import api from "../../Utility/api";

function StudentLiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const pcRef = useRef(null);
  const mounted = useRef(true);

  useEffect(() => {
    console.log("[StudentLiveSession] Component mounted with sessionId:", sessionId);
    mounted.current = true;

    const fetchCourseId = async () => {
      try {
        console.log("[StudentLiveSession] Fetching course ID for sessionId:", sessionId);
        const response = await api.get(`/courses/live-session/${sessionId}`);
        console.log("[StudentLiveSession] API response:", response.data);
        if (!response.data.courseId) {
          throw new Error("No courseId returned from API");
        }
        setCourseId(response.data.courseId);
        initializeSocket();
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Unknown error";
        console.error("[StudentLiveSession] Error fetching course ID:", errorMsg);
        setError(`Failed to fetch session details: ${errorMsg}`);
        toast.error(`Failed to fetch session details: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    const initializeSocket = () => {
      console.log("[StudentLiveSession] Initializing socket...");
      if (!LiveSessionService.initializeSocket("student", sessionId, navigate, handleConnect)) {
        console.error("[StudentLiveSession] Socket initialization failed");
        setError("Failed to initialize socket connection");
      }
    };

    const handleConnect = async () => {
      console.log("[StudentLiveSession] Socket connected, setting up stream...");
      setSocketConnected(true);

      const waitForVideoRef = () => {
        return new Promise((resolve) => {
          const checkRef = () => {
            if (videoRef.current) {
              console.log("[StudentLiveSession] Video ref is ready:", videoRef.current);
              resolve();
            } else if (!mounted.current) {
              console.warn("[StudentLiveSession] Component unmounted while waiting for video ref");
              resolve();
            } else {
              console.log("[StudentLiveSession] Waiting for video ref...");
              setTimeout(checkRef, 100);
            }
          };
          checkRef();
        });
      };

      await waitForVideoRef();

      if (mounted.current && videoRef.current) {
        try {
          const pc = await LiveSessionService.startStudentStream(videoRef, setStream, setError, sessionId);
          if (pc) {
            pcRef.current = pc;
            console.log("[StudentLiveSession] Peer connection established:", pc);
          } else {
            throw new Error("Failed to start student stream");
          }
        } catch (err) {
          console.error("[StudentLiveSession] Stream setup error:", err.message);
          setError(`Stream setup failed: ${err.message}`);
        }
      } else {
        console.warn("[StudentLiveSession] Video ref or mounted state invalid after wait");
        setError("Video element not ready or component unmounted");
      }
    };

    fetchCourseId();

    return () => {
      console.log("[StudentLiveSession] Cleaning up...");
      mounted.current = false;
      if (pcRef.current) LiveSessionService.cleanup(pcRef.current, sessionId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId, navigate]);

  console.log("[StudentLiveSession] Render state:", { loading, error, socketConnected, courseId });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
        <p className="text-xl mb-4">Loading session data...</p>
      </div>
    );
  }

 
if (error) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <p className="text-xl mb-4">{error}</p>
      <button onClick={() => navigate("/student-dashboard")} className="text-cyan-400 hover:underline">
        Back to Dashboard
      </button>
    </div>
  );
}

  if (!socketConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
        <p className="text-xl mb-4">Connecting to session...</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <Toaster position="top-center" reverseOrder={false}/>
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Course
          </button>
          <p className="text-gray-200">Session ID: {sessionId}</p>
        </div>
      </nav>
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Live Session</h1>
        <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3 mb-4">
            <Video className="h-6 w-6 text-cyan-400" /> Instructor Stream
          </h2>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
        </div>
      </div>
    </section>
  );
}

export default StudentLiveSession;


