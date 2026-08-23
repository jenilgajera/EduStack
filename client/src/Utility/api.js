import axios from "axios";
import Cookies from "js-cookie";

/**
 * ─── GLOBAL API INSTANCE ────────────────────────────────────────────────────
 *  This is the ONE place that controls the backend URL for the entire app.
 *
 *  Development  → leave VITE_API_URL empty in client/.env
 *                 Vite's proxy will forward every /api/* request to localhost:4000
 *
 *  Production   → set  VITE_API_URL=https://your-backend.vercel.app  in client/.env
 *                 Every API call will go to that URL automatically.
 * ────────────────────────────────────────────────────────────────────────────
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api",
  withCredentials: true,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
