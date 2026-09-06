import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function RegisterSheet({ isOpen, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();

  // Multi-step state: 'form' | 'otp'
  const [step, setStep] = useState("form");

  // Registration Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // OTP Verification State
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpInputRef = useRef(null);

  // Focus OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp" && isOpen) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [step, isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Lock background body scroll completely when RegisterSheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalOverscroll = document.body.style.overscrollBehavior;
      const originalTouchAction = document.body.style.touchAction;

      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      document.body.style.touchAction = "none";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.overscrollBehavior = originalOverscroll;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Validate Form & Send OTP
  const handleContinue = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Client-side Validation
    if (!trimmedName || trimmedName.length < 2) {
      const msg = "Please enter your full name (at least 2 characters).";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      const msg = "Please enter a valid email address.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (!password || password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match. Please re-enter.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/send-otp", { email: trimmedEmail });
      
      // Advance to OTP Step inside the sheet
      setStep("otp");
      setOtp("");
      setOtpError("");
      setResendCooldown(30);
      toast.success(`Verification code sent to ${trimmedEmail}`, { icon: "✉️" });
    } catch (err) {
      console.error("FAILED TO SEND OTP:", err);
      let errorMsg = "Failed to send verification code. Please try again.";

      if (err.response) {
        if (err.response.data && typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.status === 409 || err.response.status === 400) {
          errorMsg = "An account with this email already exists. Please sign in instead.";
        } else if (err.response.status >= 500) {
          errorMsg = "Email service temporarily unavailable. Please try again in a moment.";
        }
      } else if (err.request) {
        errorMsg = "Network error. Unable to reach server. Please check your internet connection.";
      }

      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    const toastId = toast.loading("Resending code...");

    try {
      await api.post("/api/auth/send-otp", { email: email.trim().toLowerCase() });
      toast.success("New 6-digit code sent!", { id: toastId, icon: "📩" });
      setResendCooldown(30);
      setOtp("");
      otpInputRef.current?.focus();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || "Could not resend code. Please try again.";
      toast.error(typeof errorMsg === 'string' ? errorMsg : "Could not resend code.", { id: toastId });
      setOtpError(typeof errorMsg === 'string' ? errorMsg : "Could not resend code.");
    }
  };

  // Step 2: Verify OTP and Complete Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      const msg = "Please enter the complete 6-digit numeric verification code.";
      setOtpError(msg);
      toast.error(msg);
      return;
    }

    setOtpLoading(true);

    try {
      const res = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: "USER",
        otp: cleanOtp,
      });

      toast.success("Account verified & created successfully! 🎉", { duration: 3000 });
      onClose();

      if (res.data?.token) {
        const { token, role, userId, name: userName, email: userEmail } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", role || "USER");
        if (userName) localStorage.setItem("userName", userName);
        if (userEmail) localStorage.setItem("userEmail", userEmail);
        if (userId) localStorage.setItem("userId", userId);

        navigate("/user", { replace: true });
      } else {
        if (onSwitchToLogin) {
          onSwitchToLogin(email.trim().toLowerCase());
        } else {
          navigate("/login", {
            replace: true,
            state: {
              email: email.trim().toLowerCase(),
              successMessage: "Account created successfully! Please sign in with your password.",
            },
          });
        }
      }

    } catch (err) {
      console.error("REGISTRATION FAILED:", err);
      let errorMsg = "Invalid or expired verification code. Please check and retry.";

      if (err.response) {
        if (err.response.data && typeof err.response.data === "string") {
          errorMsg = err.response.data;
        } else if (err.response.data?.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.status === 400) {
          errorMsg = "Incorrect verification code. Please try again.";
        }
      } else if (err.request) {
        errorMsg = "Network connection failed. Please check your internet.";
      }

      setOtpError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setOtpLoading(false);
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

        {/* Scrollable Sheet Content */}
        <div style={styles.sheetBody}>
          <AnimatePresence mode="wait">
            {step === "form" ? (
              /* ================= STEP 1: REGISTRATION FORM ================= */
              <motion.div
                key="form-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header Row */}
                <div style={styles.headerRow}>
                  <div style={styles.headerTitleGroup}>
                    <div style={styles.iconCircle}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 style={styles.sheetTitle}>Create Account</h3>
                      <p style={styles.sheetSubtitle}>Join HealthConnect for instant doctor bookings</p>
                    </div>
                  </div>

                  <button onClick={onClose} style={styles.closeBtn} title="Close">
                    ✕
                  </button>
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.errorBox}
                  >
                    <span style={styles.errorIcon}>⚠️</span>
                    <span style={styles.errorText}>{formError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleContinue} style={styles.form}>
                  {/* Full Name */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <div style={styles.inputWrapper}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={styles.inputIcon}>
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        type="text"
                        placeholder="e.g. Alex Johnson"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (formError) setFormError("");
                        }}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <div style={styles.inputWrapper}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={styles.inputIcon}>
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formError) setFormError("");
                        }}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Create Password</label>
                    <div style={styles.inputWrapper}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={styles.inputIcon}>
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (formError) setFormError("");
                        }}
                        required
                        style={{ ...styles.input, paddingRight: "44px" }}
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

                  {/* Confirm Password */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm Password</label>
                    <div style={styles.inputWrapper}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={styles.inputIcon}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                      </svg>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (formError) setFormError("");
                        }}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={loading ? styles.submitBtnDisabled : styles.submitBtn}
                  >
                    {loading ? (
                      <span style={styles.spinnerRow}>
                        <span style={styles.spinner}></span>
                        Sending Verification Code...
                      </span>
                    ) : (
                      "Continue to Verification ↗"
                    )}
                  </button>
                </form>

                {/* Switcher */}
                <div style={styles.footerRow}>
                  <span style={styles.footerText}>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchToLogin) {
                        onSwitchToLogin();
                      } else {
                        navigate("/login");
                      }
                    }}
                    style={styles.switchBtn}
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ================= STEP 2: OTP VERIFICATION ================= */
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Back to Edit Details + Close */}
                <div style={styles.otpHeaderRow}>
                  <button 
                    onClick={() => setStep("form")} 
                    style={styles.backToFormBtn}
                  >
                    &larr; Edit Details
                  </button>
                  <button onClick={onClose} style={styles.closeBtn} title="Close">
                    ✕
                  </button>
                </div>

                {/* OTP Header Icon & Info */}
                <div style={styles.otpInfoBlock}>
                  <div style={styles.otpIconBadge}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </div>
                  <h3 style={styles.otpTitle}>Enter Verification Code</h3>
                  <p style={styles.otpSub}>
                    We've sent a 6-digit verification code to <br />
                    <strong style={{ color: "#0F172A" }}>{email}</strong>
                  </p>
                </div>

                {/* OTP Error Banner */}
                {otpError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.errorBox}
                  >
                    <span style={styles.errorIcon}>⚠️</span>
                    <span style={styles.errorText}>{otpError}</span>
                  </motion.div>
                )}

                <form onSubmit={handleVerifyOtp} style={styles.form}>
                  {/* OTP Code Input */}
                  <div style={styles.otpInputGroup}>
                    <label style={styles.otpInputLabel}>6-Digit OTP Code</label>
                    <input
                      ref={otpInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setOtp(val);
                        if (otpError) setOtpError("");
                      }}
                      required
                      style={{
                        ...styles.otpInput,
                        ...(otpError ? styles.inputError : {})
                      }}
                    />
                  </div>

                  {/* Resend Cooldown */}
                  <div style={styles.resendRow}>
                    {resendCooldown > 0 ? (
                      <span style={styles.cooldownText}>
                        Resend code in <strong>{resendCooldown}s</strong>
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        style={styles.resendBtn}
                      >
                        📩 Resend OTP Code
                      </button>
                    )}
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={otpLoading || otp.length !== 6}
                    style={
                      otpLoading || otp.length !== 6
                        ? styles.submitBtnDisabled
                        : styles.submitBtn
                    }
                  >
                    {otpLoading ? (
                      <span style={styles.spinnerRow}>
                        <span style={styles.spinner}></span>
                        Verifying Code...
                      </span>
                    ) : (
                      "Verify & Complete Registration ↗"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
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
    touchAction: "none",
    userSelect: "none",
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
    padding: "10px 22px 28px 22px",
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
    marginBottom: "16px",
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
    marginBottom: "14px",
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
    gap: "12px",
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
    padding: "13px",
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
    marginTop: "16px",
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

  // OTP Step Specific
  otpHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  backToFormBtn: {
    background: "transparent",
    border: "none",
    color: "#2563EB",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: 0,
  },
  otpInfoBlock: {
    textAlign: "center",
    marginBottom: "16px",
  },
  otpIconBadge: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
  },
  otpTitle: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  otpSub: {
    fontSize: "13px",
    color: "#64748B",
    margin: 0,
    lineHeight: "1.45",
  },
  otpInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  otpInputLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "center",
  },
  otpInput: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "16px",
    border: "1.5px solid #CBD5E1",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontSize: "24px",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: "10px",
    outline: "none",
    transition: "all 0.15s ease",
  },
  resendRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2px 0",
  },
  resendBtn: {
    background: "transparent",
    border: "none",
    color: "#2563EB",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  cooldownText: {
    fontSize: "12.5px",
    color: "#64748B",
  },
};

export default RegisterSheet;
