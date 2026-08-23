import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MessageSquare, Send, ArrowLeft, LogOut, X, Menu } from "lucide-react";
import io from "socket.io-client";
import api from "../../Utility/api";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "sdbhjbsdhjsbfjhswgrwe654f89rer4f";

function ChatPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [chatType, setChatType] = useState("community");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [classmates, setClassmates] = useState([]);
  const [targetUserId, setTargetUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/user").then((res) => {
      const u = res.data.user;
      setUser({ id: u.id, userType: u.role, username: u.username, fullName: `${u.firstName} ${u.lastName}` });
    }).catch(() => navigate("/login"));
  }, [navigate]);

  const [socket] = useState(() =>
    io("/", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      path: "/socket.io",
    })
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Wait until user is loaded before doing anything
    if (user === null) return;

    if (user.userType !== "student" && user.userType !== "instructor") {
      navigate("/login");
      return;
    }
    if (!courseId) {
      navigate(user.userType === "student" ? "/student-dashboard" : "/instructor-dashboard");
      return;
    }

    setChatMessages([]);
    setClassmates([]);

    const fetchInitialData = async () => {
      try {
        const classmatesResponse = await api.get(`/courses/${courseId}/classmates`);
        setClassmates(classmatesResponse.data.classmates);

        const messagesResponse = await api.get(`/courses/${courseId}/messages`);
        const decryptedMessages = messagesResponse.data.messages.map((msg) => ({
          ...msg,
          text: CryptoJS.AES.decrypt(msg.text, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8),
        }));
        setChatMessages(decryptedMessages);
      } catch (error) {
        console.error("Error fetching initial data:", error.response?.data || error.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
      }
    };

    fetchInitialData();

    console.log("Emitting join-chat with courseId:", courseId);
    socket.emit("join-chat", { courseId });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join-chat", { courseId });
    });
    socket.on("connect_error", (err) => console.error("Socket connect error:", err.message));
    socket.on("load-messages", (messages) => {
      console.log("Loaded messages from socket:", messages);
      const decryptedMessages = messages.map((msg) => ({
        ...msg,
        text: CryptoJS.AES.decrypt(msg.text, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8),
      }));
      setChatMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        const newMessages = decryptedMessages.filter((m) => !existingIds.has(m._id));
        return [...prev, ...newMessages];
      });
    });
    socket.on("new-message", (message) => {
      console.log("Received new-message:", message);
      const decryptedMessage = {
        ...message,
        text: CryptoJS.AES.decrypt(message.text, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8),
      };
      setChatMessages((prev) => [...prev, decryptedMessage]);
      if (message.type === "personal" && message.targetUserId === user.id && message.senderId !== user.id) {
        setChatType("personal");
        setTargetUserId(message.senderId);
      }
    });
    socket.on("user-joined", ({ username, fullName, userType }) => {
      console.log("User joined:", { username, fullName, userType });
      setClassmates((prev) =>
        prev.map((c) => (c.name === `${username} (${fullName})` ? { ...c, status: "online", userType } : c))
      );
    });
    socket.on("user-left", ({ username, fullName }) => {
      console.log("User left:", { username, fullName });
      setClassmates((prev) =>
        prev.map((c) => (c.name === `${username} (${fullName})` ? { ...c, status: "offline" } : c))
      );
    });
    socket.on("error", (error) => {
      console.error("Socket error:", error.message);
      if (error.message.includes("token") || error.message.includes("blocked")) {
        navigate("/login");
      } else {
        alert(error.message);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("load-messages");
      socket.off("new-message");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("error");
    };
  }, [user, courseId, navigate, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const encryptedText = CryptoJS.AES.encrypt(chatInput, ENCRYPTION_KEY).toString();
      const messageData = { courseId, message: encryptedText, chatType };
      if (chatType === "personal" && targetUserId) {
        messageData.targetUserId = targetUserId;
      }
      console.log("Sending encrypted message:", messageData);
      socket.emit("send-message", messageData);
      setChatInput("");
    }
  };

  const handleMessageClassmate = (classmateName, classmateId) => {
    setChatType("personal");
    setTargetUserId(classmateId);
    const encryptedText = CryptoJS.AES.encrypt(`Starting conversation with ${classmateName}`, ENCRYPTION_KEY).toString();
    setChatMessages((prev) => [
      ...prev,
      {
        sender: `${user.username} (${user.fullName})`,
        senderId: user.id,
        targetUserId: classmateId,
        text: `Starting conversation with ${classmateName}`,
        encryptedText,
        type: "personal",
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsSidebarOpen(false);
  };

  const handleBack = () => {
    if (!user) {
      console.log("[ChatPage] No user data for back navigation, redirecting to login");
      navigate("/login");
    } else if (user.userType === "student") {
      console.log("[ChatPage] Navigating back to student dashboard");
      navigate("/student-dashboard");
    } else if (user.userType === "instructor") {
      console.log("[ChatPage] Navigating back to instructor dashboard");
      navigate("/instructor-dashboard");
    } else {
      console.log("[ChatPage] Unknown user type, redirecting to login:", user.userType);
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    socket.disconnect();
    navigate("/login");
  };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const displayedMessages = user ? chatMessages.filter((msg) => {
    if (chatType === "community") return msg.type === "community";
    if (chatType === "personal" && targetUserId) {
      return (
        msg.type === "personal" &&
        ((msg.senderId === user.id && msg.targetUserId === targetUserId) ||
         (msg.senderId === targetUserId && msg.targetUserId === user.id))
      );
    }
    return false;
  }) : [];

  const isInstructorMessage = (msg) => {
    const senderClassmate = classmates.find((c) => c.id === msg.senderId);
    return senderClassmate?.userType === "instructor";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      <style>
        {`
          .chat-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .chat-scrollbar::-webkit-scrollbar-track {
            background: #2d3748;
            border-radius: 4px;
          }
          .chat-scrollbar::-webkit-scrollbar-thumb {
            background: #4a5568;
            border-radius: 4px;
          }
          .chat-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #718096;
          }
          .sidebar-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: #2d3748;
            border-radius: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #4a5568;
            border-radius: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #718096;
          }
        `}
      </style>

      <nav className="fixed top-0 left-0 w-full bg-gray-900 shadow-lg border-b border-cyan-600/30 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300">
            <ArrowLeft className="h-6 w-6" />
            <span className="text-base font-medium">Back</span>
          </button>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 text-base font-semibold">Home</Link>
            <Link to={user?.userType === "instructor" ? "/instructor-dashboard" : "/courses"} className="text-gray-300 hover:text-cyan-400 transition-all duration-300 text-base font-semibold">Courses</Link>
            <Link to={`/chat/${courseId}`} className="text-gray-300 hover:text-cyan-400 transition-all duration-300 text-base font-semibold">Chat</Link>
            <Link to="/ai-chat" className="text-gray-300 hover:text-cyan-400 transition-all duration-300 text-base font-semibold">AI Chat</Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden text-gray-200 hover:text-cyan-400 transition-all duration-300">
              <Menu className="h-8 w-8" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-200 hover:text-cyan-400 transition-all duration-300 text-base font-medium">
              <LogOut className="h-6 w-6" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 h-screen flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-gray-800 p-3 rounded-xl shadow-md border border-gray-700/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setChatType("community");
                    setTargetUserId(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    chatType === "community" ? "bg-cyan-600 text-white shadow-md" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Community
                </button>
                <button
                  onClick={() => setChatType("personal")}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    chatType === "personal" ? "bg-cyan-600 text-white shadow-md" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Personal
                </button>
              </div>
            </div>

            <div className="bg-gray-850 rounded-xl shadow-lg border border-gray-700/50 p-6 flex flex-col flex-1 overflow-hidden">
              <h2 className="text-2xl font-semibold text-gray-100 mb-4">
                {chatType === "community" ? "Community Chat" : "Personal Chat"}
              </h2>
              <div className="flex-1 overflow-y-auto chat-scrollbar pr-2">
                {displayedMessages.map((msg, index) => (
                  <div
                    key={`${msg.timestamp}-${index}`}
                    className={`p-4 rounded-lg shadow-sm transition-all duration-200 max-w-[80%] hover:shadow-md mb-2 ${
                      msg.senderId === user.id
                        ? isInstructorMessage(msg)
                          ? "bg-teal-600/70 text-gray-100 ml-auto border border-teal-500/50"
                          : "bg-cyan-700/70 text-gray-100 ml-auto border border-cyan-600/50"
                        : isInstructorMessage(msg)
                        ? "bg-teal-700/70 text-gray-200 border border-teal-600/50"
                        : "bg-gray-700/70 text-gray-200 border border-gray-600/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-100">
                      {msg.sender}
                      {isInstructorMessage(msg) && (
                        <span className="ml-2 text-xs bg-teal-500 text-white px-1 rounded">Instructor</span>
                      )}
                    </p>
                    <p className="text-sm mt-1">{msg.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    chatType === "community" && user.userType === "student"
                      ? "Only instructors can send messages here"
                      : `Type a message for ${chatType} chat${chatType === "personal" && !targetUserId ? " (select a classmate first)" : ""}...`
                  }
                  className="flex-grow bg-gray-800 rounded-lg p-3 text-gray-200 border border-gray-700 focus:outline-none focus:border-cyan-500 transition-all duration-300 text-sm"
                  disabled={(chatType === "community" && user.userType === "student") || (chatType === "personal" && !targetUserId)}
                />
                <button
                  type="submit"
                  className="bg-cyan-600 p-3 rounded-lg hover:bg-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(chatType === "community" && user.userType === "student") || (chatType === "personal" && !targetUserId)}
                >
                  <Send className="h-5 w-5 text-gray-100" />
                </button>
              </form>
            </div>
          </div>

          <div className="w-80 bg-gray-850 rounded-xl shadow-lg border border-gray-700/50 p-5 hidden lg:block overflow-y-auto sidebar-scrollbar">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Classmates</h3>
            <div className="space-y-3">
              {classmates.map((classmate) => (
                <div
                  key={classmate.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/70 transition-all duration-200 cursor-pointer"
                  onClick={() => handleMessageClassmate(classmate.name, classmate.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        classmate.status === "online" ? "bg-green-400" : classmate.status === "away" ? "bg-yellow-400" : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-gray-200 text-sm font-medium">
                      {classmate.name}
                      {classmate.userType === "instructor" && (
                        <span className="ml-2 text-xs bg-teal-500 text-white px-1 rounded">Instructor</span>
                      )}
                    </span>
                  </div>
                  <button className="p-1 rounded-full hover:bg-cyan-600/30 transition-all duration-200">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-50">
          <div className="absolute right-0 top-0 w-72 h-full bg-gray-850 p-5 shadow-xl border-l border-gray-700/50 overflow-y-auto sidebar-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-100">Classmates</h3>
              <button onClick={toggleSidebar} className="text-gray-200 hover:text-cyan-400 transition-all duration-300">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              {classmates.map((classmate) => (
                <div
                  key={classmate.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/70 transition-all duration-200 cursor-pointer"
                  onClick={() => handleMessageClassmate(classmate.name, classmate.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        classmate.status === "online" ? "bg-green-400" : classmate.status === "away" ? "bg-yellow-400" : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-gray-200 text-sm font-medium">
                      {classmate.name}
                      {classmate.userType === "instructor" && (
                        <span className="ml-2 text-xs bg-teal-500 text-white px-1 rounded">Instructor</span>
                      )}
                    </span>
                  </div>
                  <button className="p-1 rounded-full hover:bg-cyan-600/30 transition-all duration-200">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ChatPage;