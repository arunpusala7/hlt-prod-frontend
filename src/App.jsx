import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast'; 

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

// ✅ ADD IMPORT HERE (Optional, if you want a standalone page route)
import DoctorSchedule from "./pages/doctor/DoctorSchedule"; // Adjust path if needed

function App() {
  return (
    <BrowserRouter>
      {/* GLOBAL TOAST NOTIFICATIONS */}
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= ADMIN ROUTES ================= */}
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

        {/* ✅ ADD NEW ROUTE HERE (Standalone Calendar Page) */}
        <Route path="/doctor/schedule" element={
            <ProtectedRoute role="DOCTOR"><DoctorSchedule /></ProtectedRoute>
        } />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;