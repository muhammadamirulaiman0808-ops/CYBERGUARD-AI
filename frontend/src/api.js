import axios from "axios";
import { UNAUTHORIZED_EVENT, clearSession, getToken } from "./utils/auth";

// Set VITE_API_URL in .env (local) or in Vercel's project settings (production).
const baseURL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const API = axios.create({
  baseURL,
  // Free hosting can take up to a minute to wake the server on the first request.
  timeout: 60000,
});

API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/login") || url.includes("/register");

    // An expired or invalid token: drop the session and tell the app (AuthContext listens).
    if (error.response?.status === 401 && !isAuthCall && getToken()) {
      clearSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

// Turns any failed request into one sentence that is safe to show to a person.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (error?.code === "ECONNABORTED") return "The server took too long to answer. Please try again.";
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return fallback;
}

export default API;
