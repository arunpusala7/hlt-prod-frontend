import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { motion } from "framer-motion";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields first.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/send-otp", { email });
      setOtpSent(true);
      setMessage(`Verification code sent to ${email}. Check your inbox.`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Failed to send OTP code. Email may already exist.";
      setError(typeof errMsg === 'string' ? errMsg : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Register Account
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/register", {
        name: name,
        email: email,
        password: password,
        role: "USER",
        otp: otp.trim(),
      });

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Registration failed. Invalid or expired code.";
      setError(typeof errMsg === 'string' ? errMsg : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageCanvas}>
      {/* Top Header */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span>Health<span style={{ color: '#3B82F6' }}>Connect</span></span>
        </div>
        <div>
          <span style={styles.navLink} onClick={() => navigate("/")}>&larr; Back to Home</span>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card" 
          style={styles.card}
        >
          <div style={styles.cardHeader}>
            <div style={styles.iconCircle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h2 style={styles.title}>Create Account</h2>
            <p style={styles.subtitle}>Join HealthConnect for instant doctor bookings</p>
          </div>

          {message && <div style={styles.successBox}>{message}</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={otpSent ? handleRegister : handleSendOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Alex Johnson"
                value={name}
                required
                disabled={otpSent}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                required
                disabled={otpSent}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Create Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                required
                disabled={otpSent}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* OTP Field if sent */}
            {otpSent && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>6-Digit Verification Code</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  maxLength={6}
                  required
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
                />
                <span 
                  onClick={handleSendOtp} 
                  style={{ fontSize: '12px', color: '#3B82F6', cursor: 'pointer', textAlign: 'center', fontWeight: '600', marginTop: '4px' }}
                >
                  Didn't get code? Resend OTP
                </span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              style={styles.submitBtn}
            >
              {loading 
                ? (otpSent ? "Verifying OTP..." : "Sending OTP...") 
                : (otpSent ? "Verify & Register" : "Send Verification Code")
              }
            </button>
          </form>

          <p style={styles.footerText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.activeLink}>Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

const styles = {
  pageCanvas: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
  },
  logo: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  navLink: {
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748B",
  },
  contentWrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "30px 16px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px 28px",
    borderRadius: "24px",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "20px",
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#EFF6FF",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748B",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#0F172A",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "9999px",
    border: "1px solid #CBD5E1",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#F8FAFC",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    marginTop: "8px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 6px 20px rgba(59, 130, 246, 0.4)",
    cursor: "pointer",
  },
  footerText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "13px",
    color: "#64748B",
  },
  activeLink: {
    color: "#3B82F6",
    fontWeight: "700",
  },
  errorBox: {
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "500",
    marginBottom: "14px",
    textAlign: "center",
  },
  successBox: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "14px",
    textAlign: "center",
  },
};

export default Register;