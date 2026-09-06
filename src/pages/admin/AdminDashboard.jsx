import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function AdminDashboard() {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={styles.pageContainer}>
      {/* Top Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span style={{ color: '#0F172A', fontWeight: "800" }}>Health</span>
          <span style={{ color: '#3B82F6', fontWeight: "800" }}>Connect</span>
          <span style={styles.badge}>Admin</span>
        </div>

        {/* Top-Right Profile Dropdown */}
        <div style={{ position: "relative" }} ref={profileMenuRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            style={styles.avatarOnlyBtn}
            title="Admin Account & Menu"
          >
            <div style={styles.avatarCircle}>A</div>
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={styles.profileDropdown}
              >
                <div style={styles.dropdownHeader}>
                  <p style={styles.dropdownUser}>Administrator</p>
                  <p style={styles.dropdownEmail}>admin@healthconnect.com</p>
                  <span style={styles.onlineBadge}>● Master Console</span>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #F1F5F9", margin: "6px 0" }} />

                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate("/admin/appointments");
                  }}
                >
                  📅 Manage Appointments
                </div>

                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate("/admin/doctors");
                  }}
                >
                  🏥 Active Doctor List
                </div>

                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    navigate("/admin/payments");
                  }}
                >
                  💳 Payment Transactions
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #F1F5F9", margin: "6px 0" }} />

                <button style={styles.dropdownLogoutBtn} onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={styles.contentWrapper}>
        {/* Welcome Banner Card */}
        <div className="glass-card" style={styles.welcomeBanner}>
          <div>
            <span style={styles.bannerTag}>Administration Console</span>
            <h1 style={styles.bannerTitle}>Hospital Overview & Management</h1>
            <p style={styles.bannerSub}>
              Manage specialist doctor profiles, monitor live patient consultation queues, and inspect Razorpay revenue audit logs.
            </p>
          </div>
        </div>

        {/* Quick System Metrics Row */}
        <div style={styles.metricsRow}>
          <div className="glass-card" style={styles.metricItem}>
            <span style={styles.metricLabel}>System Status</span>
            <span style={{ ...styles.metricVal, color: "#16A34A" }}>● 100% Operational</span>
          </div>

          <div className="glass-card" style={styles.metricItem}>
            <span style={styles.metricLabel}>Payment Gateway</span>
            <span style={{ ...styles.metricVal, color: "#3B82F6" }}>Razorpay HMAC SHA-256</span>
          </div>

          <div className="glass-card" style={styles.metricItem}>
            <span style={styles.metricLabel}>Security Protocol</span>
            <span style={{ ...styles.metricVal, color: "#0F172A" }}>JWT Encrypted & Verified</span>
          </div>
        </div>

        {/* Action Grid */}
        <div style={styles.gridContainer}>
          {/* CARD 1: ADD DOCTOR */}
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card"
            style={styles.card}
            onClick={() => navigate("/admin/add-doctor")}
          >
            <div style={styles.cardHeaderRow}>
              <div style={styles.iconContainer}>👨‍⚕️</div>
              <span style={styles.cardBadge}>Onboarding</span>
            </div>
            <h3 style={styles.cardTitle}>Add New Doctor</h3>
            <p style={styles.cardDesc}>Create credentials, assign medical specialization, and set initial consultation fees.</p>
            <span style={styles.linkArrow}>Open Doctor Setup &rarr;</span>
          </motion.div>

          {/* CARD 2: MANAGE APPOINTMENTS */}
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card"
            style={styles.card}
            onClick={() => navigate("/admin/appointments")}
          >
            <div style={styles.cardHeaderRow}>
              <div style={styles.iconContainer}>📅</div>
              <span style={styles.cardBadge}>Schedule Control</span>
            </div>
            <h3 style={styles.cardTitle}>Manage Appointments</h3>
            <p style={styles.cardDesc}>Filter live appointment bookings, view patient ticket details, or perform emergency cancellations.</p>
            <span style={styles.linkArrow}>View All Appointments &rarr;</span>
          </motion.div>

          {/* CARD 3: DOCTOR LIST */}
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card"
            style={styles.card}
            onClick={() => navigate("/admin/doctors")}
          >
            <div style={styles.cardHeaderRow}>
              <div style={styles.iconContainer}>🏥</div>
              <span style={styles.cardBadge}>Directory</span>
            </div>
            <h3 style={styles.cardTitle}>Active Doctor List</h3>
            <p style={styles.cardDesc}>Browse registered hospital specialists, view active consultation schedules, and verify status.</p>
            <span style={styles.linkArrow}>View Doctor Directory &rarr;</span>
          </motion.div>

          {/* CARD 4: PAYMENTS TRANSACTIONS */}
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card"
            style={styles.card}
            onClick={() => navigate("/admin/payments")}
          >
            <div style={styles.cardHeaderRow}>
              <div style={styles.iconContainer}>💳</div>
              <span style={styles.cardBadge}>Revenue & Audit</span>
            </div>
            <h3 style={styles.cardTitle}>Payment Transactions</h3>
            <p style={styles.cardDesc}>Inspect gross consultation revenue, Razorpay order IDs, and cryptographic verification logs.</p>
            <span style={styles.linkArrow}>View Transaction Logs &rarr;</span>
          </motion.div>

          {/* CARD 5: REGISTERED PATIENTS */}
          <motion.div
            whileHover={{ y: -4 }}
            className="glass-card"
            style={styles.card}
            onClick={() => navigate("/admin/users")}
          >
            <div style={styles.cardHeaderRow}>
              <div style={styles.iconContainer}>👥</div>
              <span style={styles.cardBadge}>User Accounts</span>
            </div>
            <h3 style={styles.cardTitle}>Registered Patients</h3>
            <p style={styles.cardDesc}>Browse registered patient accounts, audit user emails, or perform account management.</p>
            <span style={styles.linkArrow}>Manage Patient Accounts &rarr;</span>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        HealthConnect Healthcare Administration Portal &bull; Razorpay Payment Verified
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
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    height: "64px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(16px)",
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
  badge: {
    fontSize: "10px",
    backgroundColor: "#EFF6FF",
    color: "#3B82F6",
    padding: "3px 8px",
    borderRadius: "9999px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  avatarOnlyBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
  },
  avatarCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
  },
  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "120%",
    width: "220px",
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.12)",
    padding: "10px",
    zIndex: 1000,
  },
  dropdownHeader: {
    padding: "6px 8px 8px",
  },
  dropdownUser: {
    margin: "0 0 2px 0",
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
  },
  dropdownEmail: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    color: "#64748B",
  },
  onlineBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16A34A",
  },
  dropdownItem: {
    padding: "8px 10px",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  dropdownLogoutBtn: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
  },
  contentWrapper: {
    flex: 1,
    padding: "24px",
    maxWidth: "1120px",
    margin: "0 auto",
    width: "100%",
  },
  welcomeBanner: {
    padding: "24px 28px",
    marginBottom: "20px",
  },
  bannerTag: {
    display: "inline-block",
    backgroundColor: "#EFF6FF",
    color: "#3B82F6",
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 10px",
    borderRadius: "9999px",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  bannerTitle: {
    margin: "0 0 6px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
  },
  bannerSub: {
    margin: 0,
    fontSize: "13px",
    color: "#64748B",
    lineHeight: "1.5",
  },
  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  metricItem: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  metricLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  metricVal: {
    fontSize: "14px",
    fontWeight: "700",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    padding: "22px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  iconContainer: {
    fontSize: "20px",
    backgroundColor: "#EFF6FF",
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
  },
  cardBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    padding: "3px 8px",
    borderRadius: "9999px",
  },
  cardTitle: {
    margin: "0 0 6px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0F172A",
  },
  cardDesc: {
    margin: "0 0 16px 0",
    fontSize: "12px",
    color: "#64748B",
    lineHeight: "1.5",
  },
  linkArrow: {
    color: "#3B82F6",
    fontSize: "13px",
    fontWeight: "700",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #E2E8F0",
    color: "#64748B",
    textAlign: "center",
    padding: "16px",
    fontSize: "12px",
    marginTop: "auto",
  },
};

export default AdminDashboard;