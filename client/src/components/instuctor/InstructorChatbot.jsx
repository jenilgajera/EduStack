import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Send, X, MessageSquare } from "lucide-react";
import api from "../../Utility/api";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

function InstructorChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const chatContainerRef = useRef(null);
  
  // Check if this is standalone page (not embedded)
  const isStandalonePage = location.pathname === "/instructor-chat";

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage = { sender: "user", text: input, timestamp };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Use instructor API endpoint
      const response = await api.post("/instructor/chatbot", { message: input });
      const botMessage = { 
        sender: "bot", 
        text: response.data.reply, 
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        courses: response.data.courses || []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message to instructor chatbot:", error);
      if (error.response?.data?.message === "Token is not valid") {
        navigate("/login");
      }
      const errorMessage = { 
        sender: "bot", 
        text: "Sorry, I couldn't process that. Try again!", 
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isSending) {
      handleSendMessage();
    }
  };

  const toggleChatbot = () => setIsOpen(!isOpen);

  // Full Page Chat Component with toggle
  if (isStandalonePage) {
    return (
      <div className="relative flex h-[100dvh] flex-col bg-gradient-to-br from-gray-950 to-gray-900 fixed inset-0 z-50">
        {/* Chat Closed - Show Toggle Button */}
        {!isOpen && (
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <button
              type="button"
              onClick={() => navigate("/instructor-dashboard")}
              className="mb-8 self-end rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-cyan-300 hover:border-cyan-500/50 sm:absolute sm:right-4 sm:top-4 sm:mb-0 sm:self-auto"
            >
              ← Dashboard
            </button>
            <button
              type="button"
              onClick={toggleChatbot}
              className="group relative rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 p-6 text-white shadow-2xl transition-all duration-300 animate-pulse hover:shadow-cyan-500/30 sm:p-8"
            >
              <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16" />
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 transform whitespace-nowrap text-sm font-semibold text-gray-200 sm:-bottom-12 sm:text-lg">
                Open Chat
              </span>
            </button>
          </div>
        )}

        {/* Chat Open */}
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-cyan-500/20 bg-gradient-to-r from-gray-900 to-gray-800 px-safe py-3 shadow-lg sm:px-4">
              <button
                type="button"
                onClick={() => navigate("/instructor-dashboard")}
                className="shrink-0 rounded-lg border border-gray-600 bg-gray-800/90 px-2 py-2 text-xs font-medium text-cyan-300 hover:border-cyan-500/50 sm:text-sm"
              >
                Back
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <MessageSquare className="h-6 w-6 shrink-0 text-cyan-400 sm:h-8 sm:w-8" />
                <h1 className="truncate text-base font-bold text-gray-100 sm:text-2xl">Instructor AI Chat</h1>
              </div>
              <button
                type="button"
                onClick={toggleChatbot}
                aria-label="Close chat panel"
                className="flex shrink-0 items-center gap-1 rounded-full border-2 border-cyan-500/60 bg-gray-800 p-2 text-white shadow-md hover:bg-cyan-900/40 sm:gap-2 sm:px-3 sm:py-2"
              >
                <X className="h-6 w-6 sm:h-5 sm:w-5" strokeWidth={2.5} />
                <span className="hidden text-sm font-semibold sm:inline">Close</span>
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-2 sm:p-4 flex flex-col">
              <div ref={chatContainerRef} className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-5 bg-gray-900/50 rounded-xl border border-gray-700/50 mb-3 sm:mb-4" style={{ maxHeight: "calc(100vh - 180px)" }}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-200 mt-8 sm:mt-14">
                    <p className="text-base sm:text-xl font-semibold animate-pulse-slow">Welcome to Edustack Instructor AI</p>
                    <p className="text-xs sm:text-sm mt-2 text-gray-300 opacity-80">Ask anything about your courses!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end gap-3 animate-slideUp`}
                    >
                      {msg.sender === "bot" && (
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-800 to-teal-600 flex items-center justify-center text-white text-xs sm:text-base font-bold shadow-lg">
                          ES
                        </div>
                      )}
                      <div
                        className={`group max-w-[75%] sm:max-w-[70%] p-2 sm:p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white"
                            : "bg-gradient-to-r from-gray-700 to-gray-600 text-gray-50"
                        }`}
                      >
                        <p className="text-xs sm:text-sm font-semibold text-gray-200 mb-1">
                          {msg.sender === "user" ? "You" : "Edustack AI"}
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed break-words text-white">{msg.text}</p>
                        {msg.courses && msg.courses.length > 0 && (
                          <p className="text-[10px] sm:text-xs text-cyan-300 mt-2">
                            Related courses: {msg.courses.join(", ")}
                          </p>
                        )}
                        <p className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-2 text-right opacity-80">{msg.timestamp}</p>
                      </div>
                      {msg.sender === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-700 to-teal-400 flex items-center justify-center text-white text-xs sm:text-base font-bold shadow-lg">
                          U
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-2 sm:p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-2 sm:gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isSending ? "Sending..." : "Ask about your courses..."}
                    disabled={isSending}
                    className={`flex-1 bg-gray-700/50 text-white rounded-full py-2 sm:py-3 px-4 sm:px-6 border border-gray-600/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 text-sm sm:text-base ${
                      isSending ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending}
                    className={`p-2 sm:p-3 rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 text-white hover:from-cyan-700 hover:to-teal-600 transition-all duration-300 shadow-md ${
                      isSending ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSending ? (
                      <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-white rounded-full"></div>
                    ) : (
                      <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-0 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:left-auto sm:px-0 sm:pb-0">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleChatbot}
          className="pointer-events-auto group relative mb-3 ml-auto mr-1 min-h-[52px] min-w-[52px] rounded-full bg-gradient-to-r from-cyan-600 to-teal-500 p-3.5 text-white shadow-lg transition-all duration-300 animate-glow hover:from-cyan-700 hover:to-teal-600 hover:shadow-xl sm:mb-0 sm:mr-0 sm:min-h-0 sm:min-w-0 sm:p-4"
        >
          <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 animate-spin-slow group-hover:animate-spin" />
          <span className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 sm:mr-3 px-2 sm:px-3 py-1 bg-gray-900/90 text-cyan-300 text-xs sm:text-sm rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm whitespace-nowrap">
            Instructor Chat
          </span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="pointer-events-auto relative mx-auto flex h-[min(78dvh,calc(100dvh-7rem))] w-full max-w-[100%] flex-col overflow-hidden rounded-2xl border border-gray-600/50 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-800/95 shadow-2xl backdrop-blur-md sm:fixed sm:bottom-8 sm:right-8 sm:mx-0 sm:mb-0 sm:h-[min(600px,85dvh)] sm:w-[min(100vw-2rem,420px)] sm:max-w-[420px] sm:rounded-3xl">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-gray-600/50 bg-gray-900/90 p-2 sm:p-4 backdrop-blur-md">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-lg sm:text-2xl">✨</span>
              <h3 className="truncate text-sm font-bold text-cyan-100 sm:text-xl">
                <span className="hidden sm:inline">Instructor AI</span>
                <span className="sm:hidden">Instructor</span>
              </h3>
            </div>
            <button
              type="button"
              onClick={toggleChatbot}
              aria-label="Close chat"
              className="shrink-0 rounded-full border-2 border-cyan-500/50 bg-gray-800 p-2.5 text-white hover:bg-cyan-900/50"
            >
              <X className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>

          {/* Chat Area */}
          <div ref={chatContainerRef} className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-5 bg-gray-900/80 backdrop-blur-sm">
            {messages.length === 0 ? (
              <div className="text-center text-gray-200 mt-14">
                <p className="text-base font-semibold animate-pulse-slow">Welcome to Edustack Instructor AI</p>
                <p className="text-sm mt-2 text-gray-300 opacity-80">Ask anything about your courses!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end gap-3 animate-slideUp`}
                >
                  {msg.sender === "bot" && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-800 to-teal-600 flex items-center justify-center text-white text-xs sm:text-base font-bold shadow-lg">
                          ES
                    </div>
                  )}
                  <div
                    className={`group max-w-[85%] sm:max-w-[80%] p-2 sm:p-4 rounded-2xl shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-gray-600/90  to-gray-600/90 text-white border border-gray-500/50 backdrop-blur-sm"
                        : "bg-gradient-to-r from-gray-700/90 to-gray-600/90 text-gray-50 border border-gray-500/50 backdrop-blur-sm"
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-semibold text-gray-200 mb-1">
                      {msg.sender === "user" ? "You" : "Edustack AI"}
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed break-words text-white">{msg.text}</p>
                    {msg.courses && msg.courses.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-cyan-300 mt-2">
                        Related: {msg.courses.join(", ")}
                      </p>
                    )}
                    <p className="text-[10px] sm:text-xs text-gray-300 mt-1 sm:mt-2 text-right opacity-80">{msg.timestamp}</p>
                  </div>
                  {msg.sender === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-700 to-teal-400 flex items-center justify-center text-white text-xs sm:text-base font-bold shadow-lg">
                      U
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-5 bg-gray-850/70 border-t border-gray-600/50 flex items-center gap-2 sm:gap-4 backdrop-blur-md">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isSending ? "Sending..." : "Ask about your courses..."}
              disabled={isSending}
              className={`flex-1 bg-gray-800/80 text-white rounded-full py-2 sm:py-3 px-4 sm:px-6 border border-gray-600/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base ${
                isSending ? "opacity-60 cursor-not-allowed bg-gray-700/80 text-orange-200 placeholder-orange-200" : "hover:border-cyan-500/50"
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending}
              className={`p-2 sm:p-3 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-700 hover:to-amber-600 transition-all duration-300 shadow-md hover:shadow-lg ${
                isSending ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSending ? (
                <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-white rounded-full"></div>
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorChatbot;