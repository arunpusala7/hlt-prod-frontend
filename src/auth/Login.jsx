import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, role, userId, name, email: userEmail } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      if (name) localStorage.setItem("userName", name);
      if (userEmail || email) localStorage.setItem("userEmail", userEmail || email);

      if (userId) {
        localStorage.setItem("userId", userId);
        localStorage.setItem("user", JSON.stringify({ id: userId, name: name, email: userEmail || email })); 
      }

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
      console.error("LOGIN FAILED:", err);
      setError("Invalid email or password. Please try again.");
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Log in to manage appointments & consultations</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={styles.submitBtn}
            >
              {loading ? "Signing in..." : "Sign In & Continue"}
            </button>
          </form>

          <p style={styles.footerText}>
            Don't have an account?{" "}
            <Link to="/register" style={styles.activeLink}>Create Account</Link>
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
    marginBottom: "24px",
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
    gap: "16px",
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
    marginBottom: "16px",
    textAlign: "center",
  },
};

export default Login;