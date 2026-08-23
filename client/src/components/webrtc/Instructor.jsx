import { useEffect, useRef } from "react";
import io from "socket.io-client";
import Cookies from "js-cookie";

function Instructor() {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const sessionId = "67c8041e554297d6e0e60322"; // Example session ID

  useEffect(() => {
    const startStream = async () => {
      try {
        socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
          withCredentials: true,
          transports: ["websocket", "polling"],
          auth: { token: Cookies.get("token") || "" },
        });
        const socket = socketRef.current;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));

        pcRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { sessionId, candidate: event.candidate });
          }
        };

        socket.emit("join-session", { sessionId, userType: "instructor" });

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("offer", { sessionId, offer });

        socket.on("answer", ({ answer }) => {
          if (pcRef.current.signalingState === "have-local-offer") {
            pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on("ice-candidate", ({ candidate }) => {
          if (pcRef.current.remoteDescription) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

      } catch (err) {
        console.error("Instructor error:", err);
      }
    };

    startStream();

    return () => {
      socket.emit("leave-session", sessionId);
      if (pcRef.current) pcRef.current.close();
      socket.off("answer");
      socket.off("ice-candidate");
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Instructor Stream</h1>
      <video ref={videoRef} autoPlay  style={{ width: "100%", maxWidth: "600px" }} />
    </div>
  );
}

export default Instructor;