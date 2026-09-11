import axios from "axios";

// Smart environment API resolution: uses localhost for local dev, production railway URL for cloud deployments
const isLocalhost = typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_URL = isLocalhost 
  ? (import.meta.env.VITE_LOCAL_API_URL || "http://localhost:8080")
  : (import.meta.env.VITE_API_BASE_URL || "https://hlt.zuuuz.in");

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
