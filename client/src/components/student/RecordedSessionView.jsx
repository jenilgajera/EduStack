import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Video, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronRight, ChevronLeft, Rewind, FastForward, Award, ChevronDown, ChevronUp } from "lucide-react";
import { fetchCourse, fetchRecordedSession } from "../services/courseService";
import api from "../../Utility/api";
import toast, { Toaster } from "react-hot-toast";

function RecordedSessionView() {
  const { courseId, sessionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [course, setCourse] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studentId, setStudentId] = useState(null);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({}); // New state for folder expansion

  const fetchAttendance = async () => {
    try {
      const courseResponse = await api.get(`/courses/${courseId}?t=${Date.now()}`);
      console.log("Full course response:", JSON.stringify(courseResponse.data, null, 2));
      console.log("Student ID being searched:", studentId);
      const student = courseResponse.data.students.find(
        (s) => s.studentId && s.studentId._id && s.studentId._id.toString() === studentId
      );
      console.log("Found student:", student);

      const completedSessions = student?.completedSessions || [];
      console.log("Completed sessions:", completedSessions.map(s => s.toString()));
      setCompletedSessions(completedSessions.map(s => s.toString()));

      const allSessions = courseResponse.data.sessions.map(s => s._id.toString());
      console.log("All sessions:", allSessions);
      const allSessionsCompleted = allSessions.every((s) =>
        completedSessions.some((cs) => cs.toString() === s)
      );
      console.log("All sessions completed:", allSessionsCompleted);
      if (!allSessionsCompleted) {
        const missingSessions = allSessions.filter(s => !completedSessions.includes(s));
        console.log("Missing sessions (not completed):", missingSessions);
      }
      setIsCourseCompleted(allSessionsCompleted);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  useEffect(() => {
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
    setStudentId(decoded.id);
    console.log("Student ID from JWT:", decoded.id);

    const loadInitialData = async () => {
      try {
        const courseData = await fetchCourse(courseId);
        console.log("Course data loaded:", courseData);
        setCourse(courseData);

        const sessionData = await fetchRecordedSession(courseId, sessionId);
        console.log("Initial session data loaded:", sessionData);
        if (!sessionData.url) throw new Error("Session URL is missing");
        console.log("Video URL from server:", sessionData.url);
        setSession(sessionData);

        await fetchAttendance();
      } catch (err) {
        console.error("Error loading initial data:", err.message);
        setError(err.message || "Failed to load course or session");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [courseId, sessionId, navigate, studentId]);

  useEffect(() => {
    if (session && videoRef.current) {
      console.log("Attempting to set video source:", session.url);
      videoRef.current.src = session.url;
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play()
          .then(() => console.log("Video playback started"))
          .catch((err) => console.error("Autoplay failed after load:", err));
      }
    }
  }, [session]);

  useEffect(() => {
    if (!videoRef.current) return;

    const handleLoadedData = () => {
      console.log("Video data loaded, duration:", videoRef.current.duration);
      setDuration(videoRef.current.duration || 0);
    };

    const handleError = (e) => {
      console.error("Video error details:", e.target.error);
      const errorMsg = e.target.error.message || "Unknown media error";
      const errorCode = e.target.error.code;
      setError(`Failed to load video: ${errorMsg} (Code: ${errorCode})`);
      toast.error(`Video failed to load: ${errorMsg}`, {
        duration: 4000,
        position: "top-right",
      });
    };

    const handleCanPlay = () => {
      console.log("Video can play");
      if (!isPlaying) {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            console.log("Video playback started successfully");
          })
          .catch((err) => {
            console.error("Autoplay failed in canplay:", err);
            setError(`Autoplay failed: ${err.message}`);
          });
      }
    };

    videoRef.current.addEventListener("loadeddata", handleLoadedData);
    videoRef.current.addEventListener("error", handleError);
    videoRef.current.addEventListener("canplay", handleCanPlay);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener("loadeddata", handleLoadedData);
        videoRef.current.removeEventListener("error", handleError);
        videoRef.current.removeEventListener("canplay", handleCanPlay);
      }
    };
  }, [session]);

  const handleVideoEnd = async (targetSessionId = sessionId) => {
    try {
      console.log("Attempting to mark session as completed:", { courseId, sessionId: targetSessionId, studentId });
      const response = await api.put(`/courses/courses/${courseId}/sessions/${targetSessionId}/${studentId}`, { completed: true });
      console.log("Session completion response:", response.data);
      setCompletedSessions(prev => [...new Set([...prev, targetSessionId])]);
      await fetchAttendance();
      console.log(`Session ${targetSessionId} marked as completed for student ${studentId}`);
    } catch (error) {
      console.error("Error marking session completion:", error.response?.data || error.message);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const response = await api.get(`/courses/courses/${courseId}/certificate/${studentId}`);
      console.log("Certificate generated:", response.data);
      toast.success("Certificate generated successfully!", {
        duration: 4000,
        position: "top-right",
      });
      window.open(response.data.certificateUrl, "_blank");
    } catch (error) {
      console.error("Error generating certificate:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Failed to generate certificate";
      if (error.response?.status === 400 && errorMessage.includes("Course not fully completed")) {
        toast.error("Please complete all sessions to generate your certificate.", {
          duration: 4000,
          position: "top-right",
        });
      } else {
        toast.error(errorMessage, {
          duration: 4000,
          position: "top-right",
        });
      }
      setError(errorMessage);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        console.log("Video paused");
      } else {
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
            console.log("Video playing");
          })
          .catch((err) => {
            console.error("Play failed:", err);
            setError(`Play failed: ${err.message}`);
          });
      }
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.duration) {
      const value = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(value || 0);
      setCurrentTime(videoRef.current.currentTime || 0);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current && videoRef.current.duration) {
      const seekTime = (e.target.value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(e.target.value || 0);
      setCurrentTime(seekTime || 0);
      console.log("Seeked to:", seekTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      console.log("Mute toggled:", !isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    if (videoRef.current) {
      const newVolume = e.target.value / 100;
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      console.log("Volume changed to:", newVolume);
    }
  };

  const handleQualityChange = (newQuality) => {
    console.log("Quality change requested, but using base URL:", session.url);
  };

  const handlePlaybackSpeedChange = (newSpeed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
      console.log("Playback speed changed to:", newSpeed);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress((newTime / videoRef.current.duration) * 100);
      console.log("Skipped backward 10s to:", newTime);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress((newTime / videoRef.current.duration) * 100);
      console.log("Skipped forward 10s to:", newTime);
    }
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      } else if (playerRef.current.webkitRequestFullscreen) {
        playerRef.current.webkitRequestFullscreen();
      } else if (playerRef.current.msRequestFullscreen) {
        playerRef.current.msRequestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
    console.log("Fullscreen toggled:", !isFullScreen);
  };

  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 4000);
    };

    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement || !!document.webkitFullscreenElement || !!document.msFullscreenElement);
    };

    const player = playerRef.current;
    if (player) {
      player.addEventListener("mousemove", handleMouseMove);
      player.addEventListener("mouseleave", () => setShowControls(false));
      player.addEventListener("touchstart", () => setShowControls(true));
    }
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("msfullscreenchange", handleFullScreenChange);

    return () => {
      if (player) {
        player.removeEventListener("mousemove", handleMouseMove);
        player.removeEventListener("mouseleave", () => setShowControls(false));
        player.removeEventListener("touchstart", () => setShowControls(true));
      }
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
      document.removeEventListener("msfullscreenchange", handleFullScreenChange);
      clearTimeout(timeout);
    };
  }, []);

  const handleSessionSelect = async (selectedSessionId) => {
    if (selectedSessionId === session?._id) {
      console.log("Same session selected, no change needed");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const sessionData = await fetchRecordedSession(courseId, selectedSessionId);
      console.log("Selected session data loaded:", sessionData);
      if (!sessionData.url) throw new Error("Session URL is missing");
      console.log("Switching to video URL:", sessionData.url);
      setSession(sessionData);
      navigate(`/student/recorded-session/${courseId}/${selectedSessionId}`, { replace: true });
      await fetchAttendance();
    } catch (err) {
      console.error("Error switching session:", err.message);
      setError(err.message || "Failed to load selected session");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group sessions by category
  const groupedSessions = course?.sessions.reduce((acc, session) => {
    const category = session.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(session);
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4 text-base sm:text-lg md:text-xl">Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 px-4">
        <p className="text-lg sm:text-xl md:text-2xl mb-4 text-center">{error}</p>
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="text-cyan-400 hover:underline text-base sm:text-lg"
        >
          Back to Course
        </button>
      </div>
    );
  }

  if (!course || !session || !session.url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 px-4">
        <p className="text-lg sm:text-xl md:text-2xl mb-4 text-center">Course or session not found</p>
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="text-cyan-400 hover:underline text-base sm:text-lg"
        >
          Back to Course
        </button>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex">
      <Toaster />
      <div
        className={`fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-sm transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {sidebarOpen && <h2 className="text-lg font-bold">Sessions</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-400"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        {sidebarOpen && (
          <div className="p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {Object.entries(groupedSessions).map(([category, sessions]) => (
              <div key={category} className="bg-gray-800 rounded-md">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-2 text-gray-100 hover:bg-gray-700 transition-all duration-300"
                >
                  <span className="text-sm font-semibold truncate">{category}</span>
                  {expandedCategories[category] ? (
                    <ChevronUp className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-cyan-400" />
                  )}
                </button>
                {expandedCategories[category] && (
                  <div className="space-y-1 pl-4">
                    {sessions.map((sess) => (
                      <div
                        key={sess._id}
                        className={`p-2 rounded-md cursor-pointer transition-colors duration-200 flex items-center justify-between ${
                          sess._id === session._id ? "bg-cyan-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        }`}
                      >
                        <span
                          onClick={() => handleSessionSelect(sess._id)}
                          className="text-sm truncate flex-1"
                        >
                          {sess.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={completedSessions.includes(sess._id)}
                          onChange={() => handleVideoEnd(sess._id)}
                          className="h-4 w-4 text-cyan-400 border-gray-600 rounded focus:ring-cyan-400"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Back to Course
            </button>
            <button
              onClick={handleGenerateCertificate}
              className="flex items-center gap-2 bg-cyan-600 px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300 text-white font-medium text-sm sm:text-base"
            >
              <Award className="h-4 w-4" /> Generate Certificate
            </button>
          </div>
        </nav>
        <div className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col gap-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-100 mb-4 sm:mb-8">
            {session.name || "Recorded Session"}
          </h1>
          <div className="bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md p-4 sm:p-6 w-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Video className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Recorded Lecture</h2>
            </div>
            <div ref={playerRef} className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <video
                ref={videoRef}
                playsInline
                onTimeUpdate={handleProgress}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                onEnded={() => handleVideoEnd(sessionId)}
                className="absolute top-0 left-0 w-full h-full rounded-md bg-black object-contain"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
              />
              <div
                className={`absolute bottom-0 left-0 w-full bg-gray-900/80 backdrop-blur-sm p-2 sm:p-3 transition-opacity duration-300 ${
                  showControls || !isPlaying ? "opacity-100" : "opacity-0 hover:opacity-100"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={skipBackward}
                        className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-400"
                      >
                        <Rewind className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-400"
                      >
                        {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                      <button
                        onClick={skipForward}
                        className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-400"
                      >
                        <FastForward className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-400"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume * 100}
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <span className="text-xs sm:text-sm text-gray-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={playbackSpeed}
                        onChange={(e) => handlePlaybackSpeedChange(parseFloat(e.target.value))}
                        className="bg-gray-800 text-gray-200 rounded-md p-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                      </select>
                      <button
                        onClick={toggleFullScreen}
                        className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-cyan-400"
                      >
                        {isFullScreen ? (
                          <Minimize className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => handleVideoEnd(sessionId)}
                className="bg-blue-600 px-4 py-2 rounded-md text-white"
              >
                Mark Complete (Test)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RecordedSessionView;