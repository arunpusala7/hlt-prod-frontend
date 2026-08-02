import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

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

      // ✅ MODIFIED: Extract userId along with token and role
      // Note: Make sure your Backend AuthController actually returns 'userId' in the JSON response!
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
      setError("❌ Invalid email or password. Please try again.");
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
        <form style={styles.card} onSubmit={handleLogin}>
          <h2 style={styles.title}>Welcome Back</h2>

          {error && <p style={styles.error}>{error}</p>}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button 
            type="submit" 
            disabled={loading} 
            style={loading ? { ...styles.button, opacity: 0.7 } : styles.button}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p style={styles.linkText}>
            Don't have an account? <Link to="/register" style={styles.activeLink}>Register</Link>
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

export default Login;

/* =======================
   SHARED STYLES (Warm Professional Theme)
   ======================= */
const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fdfbf7", // Warm cream background
    fontFamily: "'Roboto', sans-serif",
  },
  
  // NAVBAR
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
    transition: "color 0.2s",
  },

  // CONTENT
  contentWrapper: {
    flex: 1, // Pushes footer down
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
    background: "#1a73e8", // Google Blue
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "background 0.3s ease",
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

  // FOOTER
  footer: {
    backgroundColor: "#222",
    color: "#888",
    textAlign: "center",
    padding: "15px",
    fontSize: "12px",
    marginTop: "auto",
  },
};