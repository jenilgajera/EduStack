import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Cookies from "js-cookie";

function Student() {
    const videoRef = useRef(null);
    const pcRef = useRef(null);
    const socketRef = useRef(null);
    const [stream, setStream] = useState(null);
    const sessionId = "67c8041e554297d6e0e60322";
  
    useEffect(() => {
      const setupStream = async () => {
        try {
          socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:4000", {
            withCredentials: true,
            transports: ["websocket", "polling"],
            auth: { token: Cookies.get("token") || "" },
          });
          const socket = socketRef.current;

          pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  
          pcRef.current.ontrack = (event) => {
            console.log("Student received track:", event.track.kind);
            setStream(event.streams[0]); // Trigger re-render
          };
  
          pcRef.current.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("ice-candidate", { sessionId, candidate: event.candidate });
            }
          };
  
          socket.emit("join-session", { sessionId, userType: "student" });
  
          socket.on("offer", async ({ offer, from }) => {
            if (pcRef.current.signalingState === "stable") {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);
              socket.emit("answer", { sessionId, answer, to: from });
            }
          });
  
          socket.on("ice-candidate", ({ candidate }) => {
            if (pcRef.current.remoteDescription) {
              pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          });
  
        } catch (err) {
          console.error("Student error:", err);
        }
      };
  
      setupStream();
  
      return () => {
        socket.emit("leave-session", sessionId);
        if (pcRef.current) pcRef.current.close();
        socket.off("offer");
        socket.off("ice-candidate");
        socketRef.current?.disconnect();
      };
    }, []);
  
    useEffect(() => {
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
      }
    }, [stream]);
  
    return (
      <div>
        <h1>Student View</h1>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", maxWidth: "600px", background: "black" }}
        />
        {!stream && <p>Waiting for video...</p>}
      </div>
    );
  }

export default Student;