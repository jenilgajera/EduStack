import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, ArrowLeft, Monitor, Camera, Mic, MicOff, CameraOff, Trash2 } from "lucide-react";
import { LiveSessionService } from "../services/liveSessionService";
import { toast, Toaster } from "react-hot-toast";
import api from "../../Utility/api";

function InstructorLiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [courseId, setCourseId] = useState(null);
  const pcRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    console.log("[InstructorLiveSession] Component mounted with sessionId:", sessionId);
    mounted.current = true;

    const fetchCourseId = async () => {
      try {
        console.log("[InstructorLiveSession] Fetching course ID for sessionId:", sessionId);
        const response = await api.get(`/courses/live-session/${sessionId}`);
        console.log("[InstructorLiveSession] API response:", response.data);
        if (!response.data.courseId) {
          throw new Error("No courseId returned from API");
        }
        setCourseId(response.data.courseId);
        initializeSocket();
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Unknown error";
        console.error("[InstructorLiveSession] Error fetching course ID:", errorMsg);
        setError(`Failed to fetch course details: ${errorMsg}`);
        toast.error(`Failed to fetch course details: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    const initializeSocket = () => {
      console.log("[InstructorLiveSession] Initializing socket...");
      if (!LiveSessionService.initializeSocket("instructor", sessionId, navigate, handleConnect)) {
        console.error("[InstructorLiveSession] Socket initialization failed");
        setError("Failed to initialize socket connection");
      }
    };

    const waitForVideoRef = () => {
      return new Promise((resolve) => {
        const checkRef = () => {
          if (videoRef.current) {
            console.log("[InstructorLiveSession] Video ref ready:", videoRef.current);
            resolve();
          } else if (!mounted.current) {
            console.warn("[InstructorLiveSession] Component unmounted before video ref ready");
            resolve();
          } else {
            console.log("[InstructorLiveSession] Waiting for video ref...");
            setTimeout(checkRef, 100);
          }
        };
        checkRef();
      });
    };

    const handleConnect = async () => {
      console.log("[InstructorLiveSession] Socket connected, starting stream...");
      setSocketConnected(true);

      // Wait for the video element to be ready
      await waitForVideoRef();

      if (mounted.current && videoRef.current) {
        try {
          const pc = await LiveSessionService.startInstructorStream(videoRef, setStream, setError, sessionId);
          if (pc) {
            pcRef.current = pc; // Store the RTCPeerConnection for later use
            console.log("[InstructorLiveSession] Peer connection established:", pc);
          } else {
            throw new Error("Failed to start instructor stream");
          }
        } catch (err) {
          console.error("[InstructorLiveSession] Stream setup error:", err.message);
          setError(`Stream setup failed: ${err.message}`);
        }
      } else {
        console.warn("[InstructorLiveSession] Video element not ready or component unmounted");
        setError("Video element not ready or component unmounted");
      }
    };

    fetchCourseId();

    return () => {
      console.log("[InstructorLiveSession] Cleaning up...");
      mounted.current = false;
      LiveSessionService.cleanup(sessionId);
    };
  }, [sessionId, navigate]);

  const handleShareScreen = async () => {
    try {
      console.log("[InstructorLiveSession] Starting screen share...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (stream) {
        const oldVideoTrack = stream.getVideoTracks()[0];
        stream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        stream.addTrack(screenTrack);
        videoRef.current.srcObject = stream; // Update local video
        const pc = pcRef.current;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenTrack);
            console.log("[InstructorLiveSession] Screen track replaced successfully");
          } else {
            console.warn("[InstructorLiveSession] No video sender found for screen share");
          }
        }
      }
      screenTrack.onended = handleCameraOn;
    } catch (err) {
      console.error("[InstructorLiveSession] Screen share error:", err.message);
      setError("Screen share failed: " + err.message);
      toast.error("Screen share failed: " + err.message);
    }
  };

  const handleCameraToggle = () => {
    if (!stream) {
      console.warn("[InstructorLiveSession] No stream available for camera toggle");
      return;
    }
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !isCameraOn;
    setIsCameraOn(!isCameraOn);
    console.log("[InstructorLiveSession] Camera toggled to:", !isCameraOn);
  };

  const handleCameraOn = async () => {
    try {
      console.log("[InstructorLiveSession] Turning camera on...");
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = cameraStream.getVideoTracks()[0];
      if (stream) {
        const oldVideoTrack = stream.getVideoTracks()[0];
        stream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        stream.addTrack(newVideoTrack);
        videoRef.current.srcObject = stream;
        const pc = pcRef.current;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
            console.log("[InstructorLiveSession] Camera track replaced successfully");
          } else {
            console.warn("[InstructorLiveSession] No video sender found for camera");
          }
        }
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error("[InstructorLiveSession] Camera error:", err.message);
      setError("Camera failed: " + err.message);
      toast.error("Camera failed: " + err.message);
    }
  };

  const handleMicToggle = () => {
    if (!stream) {
      console.warn("[InstructorLiveSession] No stream available for mic toggle");
      return;
    }
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !isMicOn;
    setIsMicOn(!isMicOn);
    console.log("[InstructorLiveSession] Mic toggled to:", !isMicOn);
  };

  const handleEndSession = async () => {
    if (!courseId) {
      console.warn("[InstructorLiveSession] Course ID not available");
      toast.error("Course ID not available to end session");
      return;
    }
    try {
      console.log("[InstructorLiveSession] Ending session:", { courseId, sessionId });
      await api.put(`/courses/${courseId}/live-sessions/${sessionId}/end`);
      toast.success("Live session ended!");
      navigate(`/instructor/manage-course/${courseId}`);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error("[InstructorLiveSession] Error ending session:", errorMsg);
      setError(`Failed to end session: ${errorMsg}`);
      toast.error("Failed to end session!");
    }
  };

  console.log("[InstructorLiveSession] Render state:", { loading, error, socketConnected, courseId });

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
        <button onClick={() => navigate("/instructor-dashboard")} className="text-cyan-400 hover:underline">
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
       <div> <Toaster position="top-center"  reverseOrder={false}/> </div>
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(courseId ? `/instructor/manage-course/${courseId}` : "/instructor-dashboard")}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400"
          >
            <ArrowLeft className="h-5 w-5" /> Back to {courseId ? "Course Management" : "Dashboard"}
          </button>
          <p className="text-gray-200">Session ID: {sessionId}</p>
        </div>
      </nav>
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-100 mb-8">Live Session</h1>
        <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3 mb-4">
            <Video className="h-6 w-6 text-cyan-400" /> Your Stream
          </h2>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" muted />
          <div className="mt-4 flex gap-4 flex-wrap">
            <button
              onClick={handleShareScreen}
              className="bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 flex items-center gap-2"
            >
              <Monitor className="h-5 w-5" /> Share Screen
            </button>
            <button
              onClick={handleCameraToggle}
              className={`${isCameraOn ? "bg-red-600" : "bg-green-600"} text-white py-2 px-4 rounded-md flex items-center gap-2`}
            >
              {isCameraOn ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              {isCameraOn ? "Camera Off" : "Camera On"}
            </button>
            <button
              onClick={handleMicToggle}
              className={`${isMicOn ? "bg-red-600" : "bg-green-600"} text-white py-2 px-4 rounded-md flex items-center gap-2`}
            >
              {isMicOn ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isMicOn ? "Mic Off" : "Mic On"}
            </button>
            <button
              onClick={handleEndSession}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" /> End Session
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InstructorLiveSession;