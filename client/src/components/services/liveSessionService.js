import io from "socket.io-client";

class LiveSessionService {
  static socket = null;
  static instructorPc = null;
  static userType = null;

  static initializeSocket(userType, sessionId, navigate, onConnect) {
    // No token check needed — cookie is httpOnly, server validates via cookie
    this.userType = userType;

    if (!this.socket || !this.socket.connected) {
      this.socket = io("/", {
        withCredentials: true,
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        path: "/socket.io",
      });

      this.socket.on("connect", () => {
        console.log(`[LiveSessionService] ${userType} socket connected, ID: ${this.socket.id}`);
        this.socket.emit("join-session", { sessionId, userType });
        if (onConnect) onConnect();
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[LiveSessionService] ${userType} socket disconnected: ${reason}`);
      });

      this.socket.on("connect_error", (err) => {
        console.error("[LiveSessionService] Socket connect error:", err.message);
        navigate("/student-dashboard");
      });

      if (userType === "instructor") {
        this.socket.on("student-joined", async ({ sessionId }) => {
          console.log("[LiveSessionService] Student joined session:", sessionId);
          if (this.instructorPc) {
            await this.sendOffer(sessionId);
          } else {
            console.warn("[LiveSessionService] No instructorPc to send offer");
          }
        });
      }
    }

    if (!this.socket.connected) this.socket.connect();
    return true;
  }

  static async sendOffer(sessionId) {
    try {
      if (!this.instructorPc) {
        console.warn("[LiveSessionService] Instructor PC not initialized");
        return;
      }
      console.log("[LiveSessionService] Sending offer, state:", this.instructorPc.signalingState);
      const offer = await this.instructorPc.createOffer();
      await this.instructorPc.setLocalDescription(offer);
      console.log("[LiveSessionService] Offer created:", offer);

      // Wait for ICE gathering to complete
      await new Promise((resolve) => {
        if (this.instructorPc.iceGatheringState === "complete") {
          resolve();
        } else {
          this.instructorPc.onicegatheringstatechange = () => {
            console.log("[LiveSessionService] ICE gathering state:", this.instructorPc.iceGatheringState);
            if (this.instructorPc.iceGatheringState === "complete") {
              resolve();
            }
          };
        }
      });

      console.log("[LiveSessionService] Sending offer to student after ICE gathering:", offer);
      this.socket.emit("offer", { sessionId, offer });
    } catch (err) {
      console.error("[LiveSessionService] Error sending offer:", err.message);
    }
  }

  static async startInstructorStream(videoRef, setStream, setError, sessionId) {
    try {
      console.log("[LiveSessionService] Starting instructor stream for sessionId:", sessionId);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("[LiveSessionService] Media stream acquired, tracks:", mediaStream.getTracks());
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);

      if (!this.instructorPc || this.instructorPc.signalingState === "closed") {
        this.instructorPc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        console.log("[LiveSessionService] Created new instructor RTCPeerConnection");

        mediaStream.getTracks().forEach((track) => {
          console.log("[LiveSessionService] Adding track:", track);
          this.instructorPc.addTrack(track, mediaStream);
        });

        this.instructorPc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("[LiveSessionService] Instructor ICE candidate:", event.candidate);
            this.socket.emit("ice-candidate", { sessionId, candidate: event.candidate });
          }
        };

        this.instructorPc.onicegatheringstatechange = () => {
          console.log("[LiveSessionService] Instructor ICE gathering state:", this.instructorPc.iceGatheringState);
        };

        this.instructorPc.onsignalingstatechange = () => {
          console.log("[LiveSessionService] Instructor signaling state:", this.instructorPc.signalingState);
        };

        this.instructorPc.onconnectionstatechange = () => {
          console.log("[LiveSessionService] Instructor connection state:", this.instructorPc.connectionState);
        };

        this.instructorPc.ontrack = (event) => {
          console.log("[LiveSessionService] Instructor received track (should not happen):", event.streams[0]);
        };

        this.socket.on("answer", async ({ answer }) => {
          console.log("[LiveSessionService] Received answer from student:", answer);
          try {
            if (this.instructorPc.signalingState === "have-local-offer") {
              await this.instructorPc.setRemoteDescription(new RTCSessionDescription(answer));
              console.log("[LiveSessionService] Instructor updated with student answer");
            } else {
              console.warn("[LiveSessionService] Cannot set answer, state:", this.instructorPc.signalingState);
            }
          } catch (err) {
            console.error("[LiveSessionService] Error setting answer:", err.message);
            setError(`Failed to set student answer: ${err.message}`);
          }
        });

        this.socket.on("ice-candidate", async ({ candidate }) => {
          console.log("[LiveSessionService] Received ICE candidate from student:", candidate);
          try {
            await this.instructorPc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("[LiveSessionService] Error adding ICE candidate:", err.message);
          }
        });
      } else {
        console.log("[LiveSessionService] Reusing RTCPeerConnection, state:", this.instructorPc.signalingState);
        mediaStream.getTracks().forEach((track) => {
          if (!this.instructorPc.getSenders().find((sender) => sender.track === track)) {
            console.log("[LiveSessionService] Re-adding track:", track);
            this.instructorPc.addTrack(track, mediaStream);
          }
        });
      }

      await this.sendOffer(sessionId);
      return this.instructorPc;
    } catch (err) {
      console.error("[LiveSessionService] Error starting stream:", err.message);
      setError(`Failed to start stream: ${err.message}`);
      return null;
    }
  }

  static async startStudentStream(videoRef, setStream, setError, sessionId) {
    try {
      console.log("[LiveSessionService] Starting student stream for sessionId:", sessionId);
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

      pc.ontrack = (event) => {
        console.log("[LiveSessionService] Student received instructor stream track:", event.streams[0]);
        videoRef.current.srcObject = event.streams[0];
        setStream(event.streams[0]);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[LiveSessionService] Student ICE candidate:", event.candidate);
          this.socket.emit("ice-candidate", { sessionId, candidate: event.candidate });
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log("[LiveSessionService] Student ICE gathering state:", pc.iceGatheringState);
      };

      pc.onsignalingstatechange = () => {
        console.log("[LiveSessionService] Student signaling state:", pc.signalingState);
      };

      pc.onconnectionstatechange = () => {
        console.log("[LiveSessionService] Student connection state:", pc.connectionState);
      };

      this.socket.on("offer", async ({ offer }) => {
        console.log("[LiveSessionService] Student received offer:", offer);
        if (pc.signalingState === "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("[LiveSessionService] Student sending answer:", answer);
          this.socket.emit("answer", { sessionId, answer });
        } else {
          console.warn("[LiveSessionService] Cannot set offer, state:", pc.signalingState);
        }
      });

      this.socket.on("ice-candidate", async ({ candidate }) => {
        console.log("[LiveSessionService] Student received ICE candidate:", candidate);
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("[LiveSessionService] Error adding ICE candidate:", err.message);
        }
      });

      return pc;
    } catch (err) {
      console.error("[LiveSessionService] Error starting student stream:", err.message);
      setError(`Failed to start stream: ${err.message}`);
      return null;
    }
  }

  static cleanup(sessionId) {
    if (this.instructorPc) {
      this.instructorPc.close();
      console.log("[LiveSessionService] Instructor peer connection closed for sessionId:", sessionId);
      this.instructorPc = null;
    }
    if (this.socket) {
      this.socket.off("offer");
      this.socket.off("answer");
      this.socket.off("ice-candidate");
      this.socket.off("student-joined");
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export { LiveSessionService };