import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TenantProvider } from "./context/TenantContext";

import LandingPage from "./components/LandingPage";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ProtectedRoute from "./auth/ProtectedRoute";

import UserDashboard from "./pages/user/UserDashboard";
import DoctorProfile from "./pages/user/DoctorProfile";

// Purge legacy doctor/upcoming localStorage cache entries on app init
try {
  if (typeof window !== "undefined" && window.localStorage) {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("hc_cached_") || key.startsWith("hc_tenant_")) {
        localStorage.removeItem(key);
      }
    });
  }
} catch {}

function App() {
  return (
    <TenantProvider>
      <BrowserRouter>
        {/* GLOBAL TOAST NOTIFICATIONS */}
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ================= USER / PATIENT WORKSPACE ================= */}
          <Route
            path="/user"
            element={
              <ProtectedRoute role="USER">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctor-profile/:id"
            element={
              <ProtectedRoute role="USER">
                <DoctorProfile />
              </ProtectedRoute>
            }
          />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
}

export default App;