import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role, roles }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Handle single role or array of allowed roles
  if (roles && Array.isArray(roles)) {
    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  } else if (role && userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
