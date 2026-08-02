import { useEffect, useState } from "react";
import api from "../../api/api";
import { jwtDecode } from "jwt-decode"; // Import the library

function UserProfile() {
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  
  // Default state
  const [user, setUser] = useState({
    name: "User",
    email: "user@example.com",
    role: "PATIENT",
    sub: ""
  });

  useEffect(() => {
    // ------------------------------------------------------
    // 1️⃣ FETCH PROFILE FROM BACKEND API
    // ------------------------------------------------------
    api.get("/api/user/me")
      .then(res => {
        if (res.data) {
          setUser({
            name: res.data.name || "Valued User",
            email: res.data.email || "",
            role: res.data.role || "USER",
            sub: res.data.email || ""
          });
        }
      })
      .catch(err => {
        console.error("Failed to fetch user profile from API, fallback to JWT", err);
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            setUser({
              name: decoded.name || decoded.sub?.split('@')[0] || "Valued User",
              email: decoded.sub || decoded.email || "No Email",
              role: decoded.role || localStorage.getItem("role") || "USER",
              sub: decoded.sub || ""
            });
          } catch (e) {
            console.error("Invalid Token", e);
          }
        }
      });

    // ------------------------------------------------------
    // 2️⃣ GET REAL STATS FROM API
    // ------------------------------------------------------
    api.get("/api/appointments/my").then(res => {
      const all = res.data;
      const upcoming = all.filter(a => a.status === 'BOOKED').length;
      const completed = all.filter(a => a.status === 'COMPLETED').length;
      setStats({ total: all.length, upcoming, completed });
    }).catch(err => console.error(err));
    
  }, []);

  return (
    <div style={styles.container}>
      {/* Profile Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.avatarSection}>
          <div style={styles.avatarLarge}>{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={styles.name}>{user.name}</h2>
            <p style={styles.role}>{user.role}</p>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Personal Details */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Personal Information</h3>
          <div style={styles.infoRow}>
            <span style={styles.label}>Email Address</span>
            <span style={styles.value}>{user.email}</span>
          </div>
          <div style={styles.divider}></div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Username / Sub</span>
            <span style={styles.value}>{user.sub}</span>
          </div>
          <div style={styles.divider}></div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Account Status</span>
            <span style={styles.value}><span style={{color: '#4caf50'}}>●</span> Active</span>
          </div>
        </div>

        {/* Health Stats */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Activity Overview</h3>
          <div style={styles.statsContainer}>
            
            <div style={styles.statBox}>
              <span style={styles.statNumber}>{stats.total}</span>
              <span style={styles.statLabel}>Total Visits</span>
            </div>

            <div style={styles.statBox}>
              <span style={{...styles.statNumber, color: '#1a73e8'}}>{stats.upcoming}</span>
              <span style={styles.statLabel}>Upcoming</span>
            </div>

            <div style={styles.statBox}>
              <span style={{...styles.statNumber, color: '#137333'}}>{stats.completed}</span>
              <span style={styles.statLabel}>Completed</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "900px", margin: "0 auto" },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
  },
  avatarSection: { display: "flex", alignItems: "center", gap: "16px" },
  avatarLarge: {
    width: "60px",
    height: "60px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "800",
    border: "1px solid #bfdbfe",
    textTransform: "uppercase"
  },
  name: { margin: "0 0 2px 0", fontSize: "20px", fontWeight: "700", color: "#0f172a", textTransform: "capitalize" },
  role: { margin: 0, color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" },
  card: { background: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" },
  cardTitle: { marginTop: 0, color: "#0f172a", fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "16px" },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "8px 0" },
  label: { color: "#64748b", fontSize: "13px" },
  value: { color: "#0f172a", fontWeight: "600", fontSize: "13px" },
  divider: { height: "1px", background: "#f1f5f9", margin: "4px 0" },
  statsContainer: { display: "flex", justifyContent: "space-between", textAlign: "center", paddingTop: "10px" },
  statBox: { flex: 1 },
  statNumber: { display: "block", fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "2px" },
  statLabel: { fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" },
};

export default UserProfile;