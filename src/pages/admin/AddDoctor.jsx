import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";

function AddDoctor() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await api.post("/api/admin/create-doctor-account", formData);
      setMessage({ type: "success", text: "Doctor account created successfully!" });
      toast.success("Doctor account onboarded!");
      
      setFormData({ name: "", email: "", password: "", specialization: "" });

      setTimeout(() => navigate("/admin/doctors"), 1500);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to create account. Email address might already exist." });
      toast.error("Failed to onboard doctor account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* ================= HEADER ================= */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <button onClick={() => navigate("/admin")} style={styles.backBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Dashboard</span>
          </button>
          <div style={styles.titleGroup}>
            <h2 style={styles.topTitle}>Onboard Specialist Doctor</h2>
            <span style={styles.badge}>Account Provisioning</span>
          </div>
        </div>

        <div style={styles.navRight}>
          <button onClick={() => navigate("/admin/doctors")} style={styles.viewDirectoryBtn}>
            <span>View Doctor Directory</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </nav>

      {/* ================= FORM CONTENT ================= */}
      <div style={styles.contentWrapper}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
            </div>
            <h2 style={styles.title}>Register Specialist Doctor</h2>
            <p style={styles.subtitle}>Enter the specialist physician details to provision credentials and initialize schedule.</p>
          </div>

          {message.text && (
            <div style={message.type === "success" ? styles.successAlert : styles.errorAlert}>
              {message.type === "success" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Doctor Full Name</label>
            <div style={styles.inputWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ marginRight: "8px" }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                type="text"
                name="name"
                placeholder="Dr. Emily Roberts"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Hospital Login Email</label>
            <div style={styles.inputWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ marginRight: "8px" }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="doctor@healthconnect.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Medical Specialization</label>
            <div style={styles.inputWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ marginRight: "8px" }}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <input
                type="text"
                name="specialization"
                placeholder="e.g. Cardiology, Pediatrics, Neurology"
                value={formData.specialization}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Temporary Account Password</label>
            <div style={styles.inputWrapper}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" style={{ marginRight: "8px" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type="password"
                name="password"
                placeholder="Set secure password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={loading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
          >
            {loading ? "Provisioning Account..." : "Onboard Doctor Account"}
          </button>
        </form>
      </div>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        HealthConnect Admin Workspace &bull; Doctor Onboarding Console
      </footer>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 24px",
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    position: "sticky",
    top: 0,
    zIndex: 100,
    flexWrap: "wrap",
    gap: "12px",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    backgroundColor: "#F8FAFC",
    color: "#2563EB",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  topTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.3px",
  },
  badge: {
    fontSize: "10px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    padding: "3px 8px",
    borderRadius: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    border: "1px solid #DBEAFE",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
  },
  viewDirectoryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    backgroundColor: "#FFFFFF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  contentWrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px 80px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    padding: "32px 28px",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(15, 23, 42, 0.05)",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #E2E8F0",
    boxSizing: "border-box",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "24px",
  },
  iconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  title: {
    margin: "0 0 6px 0",
    color: "#0F172A",
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    margin: 0,
    color: "#64748B",
    fontSize: "13px",
    lineHeight: "1.4",
  },

  fieldGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "6px",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "0 12px",
    transition: "border-color 0.15s ease",
  },
  input: {
    width: "100%",
    padding: "11px 0",
    border: "none",
    fontSize: "13px",
    outline: "none",
    background: "transparent",
    color: "#0F172A",
    fontWeight: "500",
  },

  submitBtn: {
    padding: "12px",
    marginTop: "8px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
    transition: "background-color 0.15s ease",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
  },

  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    padding: "10px 14px",
    borderRadius: "10px",
    marginBottom: "18px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #FECACA",
  },
  successAlert: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#16A34A",
    backgroundColor: "#F0FDF4",
    padding: "10px 14px",
    borderRadius: "10px",
    marginBottom: "18px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #BBF7D0",
  },

  footer: {
    textAlign: "center",
    padding: "20px",
    color: "#94A3B8",
    fontSize: "12px",
    borderTop: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    marginTop: "auto",
  },
};

export default AddDoctor;