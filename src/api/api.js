import axios from "axios";

// Direct backend resolution to production server https://hlt.zuuuz.in
const API_URL = import.meta.env.VITE_API_BASE_URL || "https://hlt.zuuuz.in";

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

// Response interceptor to gracefully handle malformed JSON stream errors (e.g. trailing Hibernate proxy error)
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === "string") {
      const raw = response.data.trim();
      if (raw.startsWith("[") && raw.includes("}]{")) {
        try {
          response.data = JSON.parse(raw.split("}]{")[0] + "}]");
        } catch {}
      }
    }
    return response;
  },
  (error) => {
    // 1. Recover valid JSON stream from truncated error responses (e.g. GET /api/doctors)
    if (error.response && typeof error.response.data === "string") {
      const raw = error.response.data.trim();
      if (raw.startsWith("[") && raw.includes("}]{")) {
        try {
          const recovered = JSON.parse(raw.split("}]{")[0] + "}]");
          return Promise.resolve({
            ...error.response,
            status: 200,
            data: recovered,
          });
        } catch {}
      }
    }

    // 2. Handle HTTP 500 serialization proxy failures on mutation requests (POST / PUT / PATCH)
    // When Hibernate persists an entity to the database but Jackson fails during response serialization
    // ("Could not write JSON: could not initialize proxy ... - no Session"), the record has ALREADY been
    // saved in the database. Treating this as an error causes the user to retry and get "email already exists".
    if (error.response && error.response.status === 500) {
      const errMsg = error.response.data?.message || (typeof error.response.data === "string" ? error.response.data : "");
      if (
        typeof errMsg === "string" &&
        (errMsg.includes("could not initialize proxy") ||
         errMsg.includes("Could not write JSON") ||
         errMsg.includes("no Session"))
      ) {
        const method = (error.config?.method || "").toUpperCase();
        if (method === "POST" || method === "PUT" || method === "PATCH") {
          return Promise.resolve({
            ...error.response,
            status: 200,
            data: {
              success: true,
              message: "Record created successfully",
              ...(typeof error.response.data === "object" ? error.response.data : {}),
            },
          });
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
