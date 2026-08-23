import api from "../../Utility/api";

export const fetchCourse = async (courseId) => {
  const response = await api.get(`/courses/${courseId}`);
  console.log("Course fetched:", response.data);
  return response.data;
};

export const fetchRecordedSession = async (courseId, sessionId) => {
  const response = await api.get(`/courses/${courseId}/sessions/${sessionId}`);
  console.log("Fetched recorded session:", response.data);
  // Prepend base URL for disk storage
  const base = import.meta.env.VITE_API_URL || "";
  let url = response.data.url;
  if (url && !/^https?:\/\//i.test(String(url))) {
    url = `${base}${String(url).startsWith("/") ? "" : "/"}${url}`;
  }
  const sessionData = { ...response.data, url };
  return sessionData;
};