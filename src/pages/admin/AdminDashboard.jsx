import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function AdminDashboard() {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Click-outside listener to close profile menu when clicking elsewhere
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
      {/* Navbar Header */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => navigate("/")}>
          <span style={{ color: '#2563eb', fontWeight: "900" }}>Health</span>
          <span style={{ color: '#0f172a', fontWeight: "900" }}>Connect</span>
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
                  <p style={styles.dropdownEmail}>admin@gmail.com</p>
                  <span style={styles.onlineBadge}>● System Master Admin</span>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

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

                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

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
        {/* Banner Card */}
        <div style={styles.welcomeBanner}>
          <div>
            <span style={styles.bannerTag}>Management Portal</span>
            <h1 style={styles.bannerTitle}>Hospital Administration Console</h1>
            <p style={styles.bannerSub}>
              Manage specialist staff accounts, monitor patient consultation queues, and review live payment revenue logs.
            </p>
          </div>
        </div>

        {/* Quick System Metrics Row */}
        <div style={styles.metricsRow}>
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>System Status</span>
            <span style={{ ...styles.metricVal, color: "#16a34a" }}>● Operational</span>
          </div>

          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Payment Gateway</span>
            <span style={{ ...styles.metricVal, color: "#2563eb" }}>Razorpay HMAC SHA-256</span>
          </div>

          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Security Level</span>
            <span style={{ ...styles.metricVal, color: "#0f172a" }}>Encrypted & Verified</span>
          </div>
        </div>

        {/* Action Grid */}
        <div style={styles.gridContainer}>
          
          {/* CARD 1: ADD DOCTOR */}
          <motion.div
            style={styles.card}
            whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}
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
            style={styles.card}
            whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}
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
            style={styles.card}
            whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}
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
            style={styles.card}
            whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}
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
            style={styles.card}
            whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.06)" }}
            onClick={() => navigate("/admin/users")}
          >
            <div style={styles.cardHeaderRow}>
              <div style={styles.iconContainer}>👥</div>
              <span style={styles.cardBadge}>User Accounts</span>
            </div>
            <h3 style={styles.cardTitle}>Registered Patients</h3>
            <p style={styles.cardDesc}>Browse registered patient accounts, audit user emails, or perform account deletions.</p>
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
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 28px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    flexWrap: "nowrap",
  },
  logo: {
    fontSize: "19px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  badge: {
    fontSize: "11px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "3px 8px",
    borderRadius: "6px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Profile Avatar & Dropdown
  avatarOnlyBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    borderRadius: "50%",
  },
  avatarCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
  },
  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "120%",
    width: "220px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "10px",
    zIndex: 1000,
  },
  dropdownHeader: {
    padding: "4px 8px 8px 8px",
  },
  dropdownUser: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  dropdownEmail: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    color: "#64748b",
  },
  onlineBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16a34a",
  },
  dropdownItem: {
    padding: "8px 10px",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "500",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  dropdownLogoutBtn: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
  },

  contentWrapper: {
    flex: 1,
    padding: "24px 20px",
    maxWidth: "1100px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  welcomeBanner: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px 28px",
    border: "1px solid #e2e8f0",
    marginBottom: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  bannerTag: {
    display: "inline-block",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  bannerTitle: {
    margin: "0 0 6px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  bannerSub: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.5",
  },

  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  metricItem: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "14px 18px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  metricLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  metricVal: {
    fontSize: "13px",
    fontWeight: "700",
  },

  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    border: "1px solid #e2e8f0",
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
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    border: "1px solid #bfdbfe",
  },
  cardBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569",
    backgroundColor: "#f1f5f9",
    padding: "3px 8px",
    borderRadius: "6px",
  },
  cardTitle: {
    margin: "0 0 6px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  cardDesc: {
    margin: "0 0 16px 0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.5",
  },
  linkArrow: {
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "700",
  },

  footer: {
    backgroundColor: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    color: "#64748b",
    textAlign: "center",
    padding: "16px",
    fontSize: "12px",
    marginTop: "auto",
  },
};

export default AdminDashboard;