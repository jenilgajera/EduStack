// import { useEffect, useRef, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import io from "socket.io-client";
// import { Mic, MicOff, Video as VideoIcon, VideoOff, Monitor, X, Users } from "lucide-react";
// import axios from "axios";

// const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000", { withCredentials: true });
// const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api", withCredentials: true });

// function LiveSession({ isInstructor = false }) {
//   const { courseId, sessionId } = useParams();
//   const navigate = useNavigate();
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const [peerConnection, setPeerConnection] = useState(null);
//   const [stream, setStream] = useState(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoOn, setIsVideoOn] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [participantCount, setParticipantCount] = useState(1);

//   // Cleanup function with forced track stopping and extra checks
//   const cleanup = async () => {
//     console.log("Starting cleanup...");
//     if (peerConnection) {
//       console.log("Closing peer connection...");
//       peerConnection.close();
//       setPeerConnection(null);
//     }
//     if (stream) {
//       console.log("Stopping media tracks...");
//       const tracks = stream.getTracks();
//       tracks.forEach(track => {
//         console.log(`Stopping track: ${track.kind}, enabled: ${track.enabled}`);
//         track.enabled = false; // Disable first
//         track.stop(); // Explicitly stop
//       });
//       // Wait for browser to process stoppage
//       await new Promise(resolve => setTimeout(resolve, 100));
//       setStream(null);
//       if (localVideoRef.current) {
//         console.log("Clearing and pausing local video...");
//         localVideoRef.current.srcObject = null;
//         localVideoRef.current.pause();
//         localVideoRef.current.currentTime = 0; // Reset video
//       }
//       if (remoteVideoRef.current) {
//         console.log("Clearing and pausing remote video...");
//         remoteVideoRef.current.srcObject = null;
//         remoteVideoRef.current.pause();
//         remoteVideoRef.current.currentTime = 0;
//       }
//     }
//     console.log("Emitting leave-session and removing listeners...");
//     socket.emit("leave-session", sessionId);
//     socket.off("offer");
//     socket.off("answer");
//     socket.off("ice-candidate");
//     socket.off("participant-update");
//     console.log("Cleanup completed.");
//   };

//   useEffect(() => {
//     const initWebRTC = async () => {
//       const pc = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//       });
//       setPeerConnection(pc);

//       if (isInstructor) {
//         const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         setStream(localStream);
//         localVideoRef.current.srcObject = localStream;
//         localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

//         pc.onicecandidate = (event) => {
//           if (event.candidate) socket.emit("ice-candidate", sessionId, event.candidate);
//         };

//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socket.emit("offer", sessionId, offer);
//       } else {
//         pc.ontrack = (event) => {
//           const remoteStream = event.streams[0];
//           remoteVideoRef.current.srcObject = remoteStream;
//         };

//         pc.onicecandidate = (event) => {
//           if (event.candidate) socket.emit("ice-candidate", sessionId, event.candidate);
//         };
//       }

//       socket.on("offer", async (offer) => {
//         if (!isInstructor) {
//           await pc.setRemoteDescription(new RTCSessionDescription(offer));
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit("answer", sessionId, answer);
//         }
//       });

//       socket.on("answer", async (answer) => {
//         if (isInstructor) await pc.setRemoteDescription(new RTCSessionDescription(answer));
//       });

//       socket.on("ice-candidate", async (candidate) => {
//         await pc.addIceCandidate(new RTCIceCandidate(candidate));
//       });

//       socket.on("participant-update", (count) => setParticipantCount(count));

//       socket.emit("join-session", sessionId);
//     };

//     initWebRTC().catch(error => console.error("Error initializing WebRTC:", error));

//     // Log unmount for debugging
//     return () => {
//       console.log("LiveSession component unmounting...");
//     };
//   }, [courseId, sessionId, isInstructor]);

//   const toggleMute = () => {
//     if (stream) {
//       const audioTrack = stream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setIsMuted(!audioTrack.enabled);
//       }
//     }
//   };

//   const toggleVideo = () => {
//     if (stream) {
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setIsVideoOn(videoTrack.enabled);
//       }
//     }
//   };

//   const toggleScreenShare = async () => {
//     if (!isInstructor) return;

//     try {
//       if (isScreenSharing) {
//         const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         const videoTrack = cameraStream.getVideoTracks()[0];
//         const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
//         sender.replaceTrack(videoTrack);
//         stream.getTracks().forEach(track => track.stop());
//         setStream(cameraStream);
//         localVideoRef.current.srcObject = cameraStream;
//         setIsScreenSharing(false);
//       } else {
//         const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//         const screenTrack = screenStream.getVideoTracks()[0];
//         const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
//         sender.replaceTrack(screenTrack);
//         stream.getTracks().forEach(track => track.stop());
//         setStream(screenStream);
//         localVideoRef.current.srcObject = screenStream;

//         screenTrack.onended = () => toggleScreenShare();
//         setIsScreenSharing(true);
//       }
//     } catch (error) {
//       console.error("Error toggling screen share:", error);
//     }
//   };

//   const endSession = async () => {
//     console.log("End Session clicked");
//     if (isInstructor) {
//       try {
//         await api.put(`/courses/${courseId}/live-sessions/${sessionId}/end`);
//         console.log("Session ended via API");
//       } catch (error) {
//         console.error("Error ending session via API:", error);
//       }
//     }
//     await cleanup(); // Ensure cleanup completes
//     // Force page reload to ensure browser releases resources
//     window.location.href = isInstructor ? "/instructor-dashboard" : "/student-dashboard";
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
//       {/* Header */}
//       <header className="w-full bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
//         <h1 className="text-xl font-bold">
//           {isInstructor ? "Instructor Live Session" : "Student Live Session"}
//         </h1>
//         <div className="flex items-center gap-4">
//           <span className="flex items-center gap-1 text-sm">
//             <Users className="h-4 w-4" /> {participantCount}
//           </span>
//           <button
//             onClick={endSession}
//             className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-all flex items-center gap-2"
//           >
//             <X className="h-4 w-4" /> End Session
//           </button>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="flex-grow flex flex-col md:flex-row gap-4 p-4">
//         {/* Video Section */}
//         <div className="flex flex-col items-center flex-grow">
//           <div className="w-full max-w-4xl bg-gray-800 rounded-lg p-4 shadow-lg">
//             <div className="relative">
//               <video
//                 ref={remoteVideoRef}
//                 autoPlay
//                 className="w-full h-auto rounded-md border border-cyan-400"
//               />
//               {isInstructor && (
//                 <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded-md overflow-hidden border border-cyan-400">
//                   <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Controls Section */}
//         <div className="flex flex-col items-center gap-4 p-4 md:w-1/4">
//           <div className="bg-gray-800 rounded-lg p-4 w-full shadow-lg">
//             <h2 className="text-lg font-semibold mb-4 text-center">Controls</h2>
//             <div className="flex flex-col gap-4 items-center">
//               <button
//                 onClick={toggleMute}
//                 className={`p-3 rounded-full ${isMuted ? "bg-red-600" : "bg-cyan-600"} hover:bg-opacity-80 transition-all`}
//                 title={isMuted ? "Unmute" : "Mute"}
//               >
//                 {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
//               </button>
//               <button
//                 onClick={toggleVideo}
//                 className={`p-3 rounded-full ${!isVideoOn ? "bg-red-600" : "bg-cyan-600"} hover:bg-opacity-80 transition-all`}
//                 title={isVideoOn ? "Turn Video Off" : "Turn Video On"}
//               >
//                 {isVideoOn ? <VideoIcon className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
//               </button>
//               {isInstructor && (
//                 <button
//                   onClick={toggleScreenShare}
//                   className={`p-3 rounded-full ${isScreenSharing ? "bg-green-600" : "bg-cyan-600"} hover:bg-opacity-80 transition-all`}
//                   title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
//                 >
//                   <Monitor className="h-6 w-6" />
//                 </button>
//               )}
//             </div>
//           </div>
//           <div className="text-sm text-gray-400 flex items-center gap-1">
//             <Users className="h-4 w-4" /> Participants: {participantCount}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default LiveSession;