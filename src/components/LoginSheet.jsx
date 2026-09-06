import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function LoginSheet({ isOpen, onClose, onSwitchToRegister, initialEmail = "", initialSuccessMessage = "" }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(initialSuccessMessage);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (!password) {
      const msg = "Please enter your password.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/auth/login", {
        email: cleanEmail,
        password,
      });

      const { token, role, userId, name, email: userEmail } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      if (name) localStorage.setItem("userName", name);
      if (userEmail || cleanEmail) localStorage.setItem("userEmail", userEmail || cleanEmail);

      if (userId) {
        localStorage.setItem("userId", userId);
        localStorage.setItem("user", JSON.stringify({ id: userId, name: name, email: userEmail || cleanEmail })); 
      }

      toast.success(`Welcome back, ${name || "User"}! 👋`, { icon: "🩺" });
      onClose();

      switch (role) {
        case "ADMIN":
          navigate("/admin", { replace: true });
          break;
        case "USER":
          navigate("/user", { replace: true });
          break;
        case "DOCTOR":
          navigate("/doctor", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      let errorMsg = "Invalid email or password. Please try again.";

      if (err.response) {
        if (err.response.data && typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMsg = "Incorrect email or password. Please check your credentials.";
        } else if (err.response.status === 404) {
          errorMsg = "Account not found with this email. Please register first.";
        } else if (err.response.status >= 500) {
          errorMsg = "Server is currently experiencing an issue. Please retry shortly.";
        }
      } else if (err.request) {
        errorMsg = "Network error. Unable to reach server. Please check your internet connection.";
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={styles.sheetOverlay} 
      onClick={onClose}
      onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.8 }}
        style={styles.bottomSheet}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle */}
        <div style={styles.dragHandleRow} onClick={onClose} title="Slide down to close">
          <div style={styles.dragPill}></div>
        </div>

        {/* Scrollable Content */}
        <div style={styles.sheetBody}>
          {/* Header Row: Title & Close Button */}
          <div style={styles.headerRow}>
            <div style={styles.headerTitleGroup}>
              <div style={styles.iconCircle}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h3 style={styles.sheetTitle}>Welcome Back</h3>
                <p style={styles.sheetSubtitle}>Sign in to manage appointments & consultations</p>
              </div>
            </div>

            <button onClick={onClose} style={styles.closeBtn} title="Close">
              ✕
            </button>
          </div>

          {/* Success Message Box */}
          {successMessage && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.successBox}
            >
              <span style={styles.successIcon}>🎉</span>
              <span style={styles.successText}>{successMessage}</span>
            </motion.div>
          )}

          {/* Error Message Box */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.errorBox}
            >
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={styles.form}>
            {/* Email Address */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={styles.inputIcon}>
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  style={{
                    ...styles.input,
                    ...(error ? styles.inputError : {})
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={styles.inputIcon}>
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  style={{
                    ...styles.input,
                    paddingRight: "44px",
                    ...(error ? styles.inputError : {})
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.submitBtnDisabled : styles.submitBtn}
            >
              {loading ? (
                <span style={styles.spinnerRow}>
                  <span style={styles.spinner}></span>
                  Signing in...
                </span>
              ) : (
                "Sign In & Continue ↗"
              )}
            </button>
          </form>

          {/* Switcher */}
          <div style={styles.footerRow}>
            <span style={styles.footerText}>Don't have an account?</span>
            <button
              type="button"
              onClick={() => {
                if (onSwitchToRegister) {
                  onSwitchToRegister();
                } else {
                  navigate("/register");
                }
              }}
              style={styles.switchBtn}
            >
              Create Account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 99990,
  },
  bottomSheet: {
    width: "100%",
    maxWidth: "460px",
    maxHeight: "88vh",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.18)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  dragHandleRow: {
    width: "100%",
    padding: "12px 0 6px 0",
    display: "flex",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#FFFFFF",
  },
  dragPill: {
    width: "44px",
    height: "5px",
    borderRadius: "9999px",
    backgroundColor: "#CBD5E1",
  },
  sheetBody: {
    padding: "12px 22px 28px 22px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
    flex: 1,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sheetTitle: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
    letterSpacing: "-0.02em",
  },
  sheetSubtitle: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
  },
  closeBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "var(--input-bg, #F1F5F9)",
    border: "var(--card-border, 1px solid #E2E8F0)",
    color: "#64748B",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "rgba(220, 252, 231, 0.95)",
    border: "1px solid #86EFAC",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  successIcon: {
    fontSize: "15px",
    flexShrink: 0,
  },
  successText: {
    lineHeight: "1.35",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "rgba(254, 226, 226, 0.95)",
    border: "1px solid #FCA5A5",
    color: "#991B1B",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  errorIcon: {
    fontSize: "15px",
    flexShrink: 0,
  },
  errorText: {
    lineHeight: "1.35",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#0F172A",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "12px 16px 12px 42px",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    transition: "all 0.15s ease",
  },
  inputError: {
    border: "1.5px solid #EF4444 !important",
    backgroundColor: "#FEF2F2 !important",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "6px",
    borderRadius: "9999px",
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    fontSize: "14.5px",
    fontWeight: "700",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    boxShadow: "0 10px 24px -2px rgba(37, 99, 235, 0.45)",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  submitBtnDisabled: {
    width: "100%",
    padding: "14px",
    marginTop: "6px",
    borderRadius: "9999px",
    backgroundColor: "#94A3B8",
    color: "#FFFFFF",
    fontSize: "14.5px",
    fontWeight: "700",
    border: "none",
    cursor: "not-allowed",
    opacity: 0.8,
  },
  spinnerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255, 255, 255, 0.4)",
    borderTop: "2px solid #FFFFFF",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  footerRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    marginTop: "18px",
    fontSize: "13px",
  },
  footerText: {
    color: "#64748B",
  },
  switchBtn: {
    background: "transparent",
    border: "none",
    color: "#2563EB",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
  },
};

export default LoginSheet;
