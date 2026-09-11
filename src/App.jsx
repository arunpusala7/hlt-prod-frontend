import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast'; 
import { TenantProvider } from "./context/TenantContext";

import LandingPage from "./components/LandingPage";
import Login from "./auth/Login";
import Register from "./auth/Register";
import ProtectedRoute from "./auth/ProtectedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AddDoctor from "./pages/admin/AddDoctor";
import ManageAppointments from "./pages/admin/ManageAppointments";
import ManageDoctors from "./pages/admin/ManageDoctors";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminPayments from "./pages/admin/AdminPayments";

import UserDashboard from "./pages/user/UserDashboard";
import DoctorProfile from "./pages/user/DoctorProfile";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import CancelledPatients from "./pages/doctor/CancelledPatients";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";

import AssistantPortal from "./pages/assistant/AssistantPortal";
import ClinicAdminDashboard from "./pages/clinicAdmin/ClinicAdminDashboard";
import OrgAdminDashboard from "./pages/orgAdmin/OrgAdminDashboard";

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

          {/* ================= SUPER ADMIN ROUTES ================= */}
          <Route path="/admin" element={
              <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
          } />

          <Route path="/admin/add-doctor" element={
              <ProtectedRoute role="ADMIN"><AddDoctor /></ProtectedRoute>
          } />

          <Route path="/admin/appointments" element={
              <ProtectedRoute role="ADMIN"><ManageAppointments /></ProtectedRoute>
          } />

          <Route path="/admin/doctors" element={
              <ProtectedRoute role="ADMIN"><ManageDoctors /></ProtectedRoute>
          } />

          <Route path="/admin/users" element={
              <ProtectedRoute role="ADMIN"><ManageUsers /></ProtectedRoute>
          } />

          <Route path="/admin/payments" element={
              <ProtectedRoute role="ADMIN"><AdminPayments /></ProtectedRoute>
          } />

          {/* ================= ORGANIZATION ADMIN ROUTES ================= */}
          <Route path="/org-admin" element={
              <ProtectedRoute roles={["ORGANIZATION_ADMIN", "ADMIN"]}><OrgAdminDashboard /></ProtectedRoute>
          } />

          {/* ================= CLINIC ADMIN ROUTES ================= */}
          <Route path="/clinic-admin" element={
              <ProtectedRoute roles={["CLINIC_ADMIN", "ADMIN"]}><ClinicAdminDashboard /></ProtectedRoute>
          } />

          {/* ================= FRONT-DESK ASSISTANT / PA ROUTES ================= */}
          <Route path="/assistant" element={
              <ProtectedRoute roles={["ASSISTANT", "CLINIC_ADMIN", "ADMIN"]}><AssistantPortal /></ProtectedRoute>
          } />

          {/* ================= USER ROUTES ================= */}
          <Route path="/user" element={
              <ProtectedRoute role="USER"><UserDashboard /></ProtectedRoute>
          } />

          <Route path="/doctor-profile/:id" element={
              <ProtectedRoute role="USER"><DoctorProfile /></ProtectedRoute>
          } />

          {/* ================= DOCTOR ROUTES ================= */}
          <Route path="/doctor" element={
              <ProtectedRoute role="DOCTOR"><DoctorDashboard /></ProtectedRoute>
          } />
          
          <Route path="/doctor/cancelled" element={
              <ProtectedRoute role="DOCTOR"><CancelledPatients /></ProtectedRoute>
          } />

          {/* ✅ Standalone Calendar Page */}
          <Route path="/doctor/schedule" element={
              <ProtectedRoute role="DOCTOR"><DoctorSchedule /></ProtectedRoute>
          } />

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
}

export default App;