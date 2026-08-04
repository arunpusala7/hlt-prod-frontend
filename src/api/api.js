import axios from "axios";

// Environment variable with fallback to live Railway production backend domain
const API_URL = import.meta.env.VITE_API_BASE_URL || "https://hlt-prod-backend-production.up.railway.app";

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
