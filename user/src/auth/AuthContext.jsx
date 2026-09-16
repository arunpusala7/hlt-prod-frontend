import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    organizationId: localStorage.getItem("organizationId"),
    organizationName: localStorage.getItem("organizationName"),
  });

  const logout = () => {
    localStorage.clear();
    setAuth({
      token: null,
      role: null,
      organizationId: null,
      organizationName: null,
    });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ ...auth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
