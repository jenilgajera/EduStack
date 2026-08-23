// src/components/student/JoinLiveSession.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ArrowLeft } from "lucide-react";

function JoinLiveSession() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();
    if (sessionId.trim()) {
      navigate(`/live-session/student/${sessionId.trim()}`);
    }
  };
  return (
    <section className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900">
      <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg border-b border-cyan-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-200 hover:text-cyan-400"
          >
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
        </div>
      </nav>

      <div className="pt-24 px-4 max-w-7xl mx-auto">
        <div className="max-w-md mx-auto bg-gradient-to-b from-gray-900 to-gray-850 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-3">
            <Video className="h-6 w-6 text-cyan-400" /> Join Live Session
          </h1>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full bg-gray-800 rounded-md border border-gray-700 px-3 py-2 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                placeholder="Enter session ID"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors"
            >
              Join Session
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default JoinLiveSession;