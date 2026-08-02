import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

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
      setMessage(`📩 Verification code sent to ${email}. Please check your inbox.`);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Failed to send OTP code. Email may already exist.";
      setError(`❌ ${typeof errMsg === 'string' ? errMsg : "Failed to send verification code."}`);
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

      setMessage("✅ Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Registration failed. Invalid or expired OTP code.";
      setError(`❌ ${typeof errMsg === 'string' ? errMsg : "Registration failed. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* ================= HEADER ================= */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          Health<span style={{color: '#1a73e8'}}>Connect</span>
        </div>
        <div style={styles.navLinks}>
          <span style={styles.link} onClick={() => navigate("/")}>Home</span>
        </div>
      </nav>

      {/* ================= MAIN CONTENT ================= */}
      <div style={styles.contentWrapper}>
        <form style={styles.card} onSubmit={otpSent ? handleRegister : handleSendOtp}>
          <h2 style={styles.title}>Create Account</h2>

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            required
            disabled={otpSent}
            onChange={(e) => setName(e.target.value)}
            style={otpSent ? { ...styles.input, backgroundColor: '#f0f0f0' } : styles.input}
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            required
            disabled={otpSent}
            onChange={(e) => setEmail(e.target.value)}
            style={otpSent ? { ...styles.input, backgroundColor: '#f0f0f0' } : styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            disabled={otpSent}
            onChange={(e) => setPassword(e.target.value)}
            style={otpSent ? { ...styles.input, backgroundColor: '#f0f0f0' } : styles.input}
          />

          {/* OTP Verification Field (Shown after OTP is sent) */}
          {otpSent && (
            <div style={{ marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Enter 6-Digit OTP Code"
                value={otp}
                maxLength={6}
                required
                onChange={(e) => setOtp(e.target.value)}
                style={{ ...styles.input, letterSpacing: '4px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
              />
              <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', margin: '5px 0 0 0' }}>
                Didn't receive code?{" "}
                <span 
                  onClick={handleSendOtp} 
                  style={{ color: '#1a73e8', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  Resend OTP
                </span>
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
          >
            {loading 
              ? (otpSent ? "Verifying OTP..." : "Sending OTP...") 
              : (otpSent ? "Verify & Create Account" : "Send Verification Code")
            }
          </button>

          <p style={styles.linkText}>
            Already have an account? <Link to="/login" style={styles.activeLink}>Login</Link>
          </p>
        </form>
      </div>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        &copy; 2026 HealthConnect.
      </footer>
    </div>
  );
}

export default Register;

/* =======================
   SHARED STYLES (Copy exact styles from Login.jsx or use a shared file)
   ======================= */
const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fdfbf7",
    fontFamily: "'Roboto', sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    backgroundColor: "#fdfbf7",
    borderBottom: "1px solid #e0ddd5",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2c3e50",
    cursor: "pointer",
  },
  navLinks: {
    display: "flex",
    gap: "24px",
  },
  link: {
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#5f6368",
  },
  contentWrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "25px",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #eaeaea",
  },
  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: "#2c3e50",
    fontSize: "24px",
    fontWeight: "600",
  },
  input: {
    padding: "14px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    outline: "none",
    backgroundColor: "#fcfcfc",
  },
  button: {
    padding: "14px",
    marginTop: "10px",
    background: "#1a73e8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#666",
  },
  activeLink: {
    color: '#1a73e8', 
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  error: {
    color: "#d32f2f",
    background: "#ffebee",
    padding: "10px",
    borderRadius: "6px",
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "14px",
  },
  success: {
    color: "#1b5e20",
    background: "#e8f5e9",
    padding: "10px",
    borderRadius: "6px",
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "14px",
  },
  footer: {
    backgroundColor: "#222",
    color: "#888",
    textAlign: "center",
    padding: "15px",
    fontSize: "12px",
    marginTop: "auto",
  },
};