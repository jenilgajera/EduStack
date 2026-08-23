import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Utility/api";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Toaster, toast } from "react-hot-toast"

import { ArrowLeft } from "lucide-react";

function StudentQuizPage() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [participants, setParticipants] = useState([]); // Store participants' data

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
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

        const response = await api.get(`/courses/${courseId}/quizzes/${quizId}`);
        console.log("StudentQuizPage.jsx - Quiz fetched:", response.data);

        const courseResponse = await api.get(`/courses/${courseId}`);
        const existingScore = courseResponse.data.quizScores.find(
          (s) => s.studentId.toString() === decoded.id && s.quizId.toString() === quizId
        );
        if (existingScore) {
          setHasSubmitted(true);
          setScore({ quizTitle: response.data.title, score: existingScore.score });
          localStorage.removeItem(`quizTimer_${quizId}_${decoded.id}`);

          // Fetch participants' data after submission
          const participantsData = courseResponse.data.quizScores
            .filter((s) => s.quizId.toString() === quizId)
            .map((s) => ({
              studentId: s.studentId.toString(),
              name: courseResponse.data.students.find(st => st.studentId.toString() === s.studentId.toString())?.name || "Unknown",
              score: s.score,
            }));
          setParticipants(participantsData);
        } else {
          setQuiz(response.data);
          setAnswers(new Array(response.data.questions.length).fill(""));

          const timerKey = `quizTimer_${quizId}_${decoded.id}`;
          const storedTimer = localStorage.getItem(timerKey);
          if (storedTimer) {
            const { startTime, duration } = JSON.parse(storedTimer);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);
          } else {
            const initialTime = response.data.timeLimit * 60;
            setTimeLeft(initialTime);
            localStorage.setItem(
              timerKey,
              JSON.stringify({ startTime: Date.now(), duration: initialTime })
            );
          }
        }
      } catch (err) {
        console.error("StudentQuizPage.jsx - Error fetching quiz:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, quizId, navigate]);

  useEffect(() => {
    if (timeLeft === null || score || hasSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, hasSubmitted]);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    try {
      const submission = answers.map((answer, index) => ({
        questionIndex: index,
        selectedOption: answer,
      }));
      const response = await api.post(`/courses/${courseId}/quizzes/${quizId}/submit`, { answers: submission });
      setScore(response.data);
      setHasSubmitted(true);
      localStorage.removeItem(`quizTimer_${quizId}_${jwtDecode(Cookies.get("token")).id}`);

      // Fetch updated course data to get participants
      const courseResponse = await api.get(`/courses/${courseId}`);
      const participantsData = courseResponse.data.quizScores
        .filter((s) => s.quizId.toString() === quizId)
        .map((s) => ({
          studentId: s.studentId.toString(),
          name: courseResponse.data.students.find(st => st.studentId.toString() === s.studentId.toString())?.name || "Unknown",
          score: s.score,
        }));
      setParticipants(participantsData);

      toast.success("Quiz submitted successfully!");
    } catch (error) {
      console.error("StudentQuizPage.jsx - Error submitting quiz:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to submit quiz!");
    }
  };

  const handleAutoSubmit = async () => {
    if (!score && !hasSubmitted) {
      await handleSubmitQuiz();
      toast.info("Time’s up! Quiz submitted automatically.");
    }
  };

  const handleClearAllAnswers = () => {
    setAnswers(new Array(quiz.questions.length).fill(""));
    toast.info("All answers cleared!");
  };

  const handleClearQuestionAnswer = (index) => {
    const newAnswers = [...answers];
    newAnswers[index] = "";
    setAnswers(newAnswers);
    toast.info(`Answer for question ${index + 1} cleared!`);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
        <p className="ml-4 text-lg">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">{error}</p>
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-cyan-400 hover:underline">
          Back to Course
        </button>
      </div>
    );
  }

  if (!quiz && !score) {
    return (
      <div className="min-h-screen text-gray-200 bg-gradient-to-br from-gray-950 to-gray-900 flex flex-col items-center justify-center">
        <p className="text-xl mb-4">Quiz not found</p>
        <button onClick={() => navigate(`/course/${courseId}`)} className="text-cyan-400 hover:underline">
          Back to Course
        </button>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200 p-6">
       <Toaster position="top-center" reverseOrder={false}/>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Course
        </button>

        <h1 className="text-3xl font-bold text-gray-100 mb-6">Quiz: {quiz?.title || score?.quizTitle}</h1>

        {score ? (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Quiz Results</h2>
            <p className="text-lg mb-2">Quiz Title: {score.quizTitle}</p>
            <p className="text-lg mb-4">Your Score: {score.score}%</p>
            <p className="text-gray-400 mb-6">You’ve already completed this quiz. You cannot reattempt it.</p>

            {/* Participants Section */}
            {/* <h3 className="text-xl font-semibold text-cyan-400 mb-4">
              Participants ({participants.length})
            </h3>
            {participants.length > 0 ? (
              <ul className="space-y-2 mb-6">
                {participants.map((participant) => (
                  <li key={participant.studentId} className="flex justify-between text-sm">
                    <span>{participant.name}</span>
                    <span className="text-cyan-400">{participant.score}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 mb-6">No other students have attempted this quiz yet.</p>
            )} */}

            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-all duration-300"
            >
              Back to Course
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <p className="text-lg font-semibold">Time Left: {formatTime(timeLeft)}</p>
              <p className="text-sm text-gray-400">
                {quiz.questions.length} Question{quiz.questions.length !== 1 ? "s" : ""}
              </p>
            </div>
            {quiz.questions.map((q, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-900 rounded-md">
                <p className="text-lg font-medium mb-3">{index + 1}. {q.question}</p>
                <div className="space-y-2 mb-3">
                  {q.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center">
                      <input
                        type="radio"
                        id={`q${index}-opt${optIndex}`}
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={() => handleAnswerChange(index, option)}
                        className="mr-2 text-cyan-400 focus:ring-cyan-400"
                        disabled={timeLeft <= 0}
                      />
                      <label htmlFor={`q${index}-opt${optIndex}`} className="text-sm">{option}</label>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleClearQuestionAnswer(index)}
                  className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                  disabled={timeLeft <= 0}
                >
                  Clear Choice
                </button>
              </div>
            ))}
            <div className="flex gap-4">
              <button
                onClick={handleSubmitQuiz}
                className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={timeLeft <= 0}
              >
                Submit Quiz
              </button>
              <button
                onClick={handleClearAllAnswers}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={timeLeft <= 0}
              >
                Clear All Answers
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default StudentQuizPage;