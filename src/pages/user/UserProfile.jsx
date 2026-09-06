import { useEffect, useState } from "react";
import api from "../../api/api";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";

import toast from "react-hot-toast";

function UserProfile() {
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [isEditing, setIsEditing] = useState(false);
  
  const [user, setUser] = useState({
    name: localStorage.getItem("userName") || "Alex",
    email: localStorage.getItem("userEmail") || "alex@example.com",
    role: "Member",
    phone: localStorage.getItem("userPhone") || "+91 98765 43210",
    emergencyContact: localStorage.getItem("userEmergency") || "Sarah Rivera (Sister) - +91 98765 43211",
    bloodGroup: "O+",
    smsAlerts: true,
    emailAlerts: true,
  });

  const [editForm, setEditForm] = useState({ ...user });

  useEffect(() => {
    api.get("/api/user/me")
      .then(res => {
        if (res.data) {
          const loadedName = res.data.name || localStorage.getItem("userName") || "Alex";
          const loadedEmail = res.data.email || localStorage.getItem("userEmail") || "alex@example.com";
          setUser(prev => ({
            ...prev,
            name: loadedName,
            email: loadedEmail,
            role: "Member",
          }));
          setEditForm(prev => ({
            ...prev,
            name: loadedName,
            email: loadedEmail,
          }));
          localStorage.setItem("userName", loadedName);
          localStorage.setItem("userEmail", loadedEmail);
        }
      })
      .catch(err => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            const fallbackName = decoded.name || decoded.sub?.split('@')[0] || "Alex";
            const fallbackEmail = decoded.sub || decoded.email || "alex@example.com";
            setUser(prev => ({
              ...prev,
              name: fallbackName,
              email: fallbackEmail,
              role: "Member",
            }));
            setEditForm(prev => ({
              ...prev,
              name: fallbackName,
              email: fallbackEmail,
            }));
          } catch (e) {
            console.error("Invalid Token", e);
          }
        }
      });

    api.get("/api/appointments/my").then(res => {
      const all = res.data || [];
      const upcoming = all.filter(a => a.status === 'BOOKED' || a.status === 'RESCHEDULED').length;
      const completed = all.filter(a => a.status === 'COMPLETED').length;
      setStats({ total: all.length, upcoming, completed });
    }).catch(() => {});
    
  }, []);

  const handleSaveProfile = () => {
    setUser({ ...editForm });
    localStorage.setItem("userName", editForm.name);
    localStorage.setItem("userPhone", editForm.phone);
    localStorage.setItem("userEmergency", editForm.emergencyContact);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={styles.headerCard}
      >
        <div style={styles.headerCoverBanner}></div>
        
        <div style={styles.headerMain}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatarLarge}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.onlineBadge} title="Active Account"></div>
          </div>

          <div style={styles.headerInfo}>
            <div style={styles.nameRow}>
              <h2 style={styles.name}>{user.name}</h2>
              <span style={styles.verifiedCheck} title="Verified Account">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#3B82F6">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </span>
            </div>
            <div style={styles.badgeRow}>
              <span style={styles.roleBadge}>Personal Account</span>
              <span style={styles.memberIdBadge}>ID: HC-MEM-84920</span>
            </div>
          </div>

          <button 
            style={isEditing ? styles.saveBtn : styles.editBtn}
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setEditForm({ ...user });
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
        </div>
      </motion.div>

      {/* Stats Counter Row */}
      <div style={styles.statsRow}>
        <motion.div whileHover={{ y: -2 }} className="glass-card" style={styles.statCard}>
          <span style={styles.statNum}>{stats.total}</span>
          <span style={styles.statLabel}>Total Consultations</span>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="glass-card" style={styles.statCard}>
          <span style={{ ...styles.statNum, color: "#3B82F6" }}>{stats.upcoming}</span>
          <span style={styles.statLabel}>Upcoming Visits</span>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="glass-card" style={styles.statCard}>
          <span style={{ ...styles.statNum, color: "#16A34A" }}>{stats.completed}</span>
          <span style={styles.statLabel}>Completed Care</span>
        </motion.div>
      </div>

      {/* Personal Info Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card" 
        style={styles.card}
      >
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Personal Information</h3>
          <span style={styles.cardHint}>Basic member contact & emergency details</span>
        </div>
        
        <div style={styles.infoGrid}>
          <div style={styles.infoField}>
            <span style={styles.infoLabel}>Full Name</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editForm.name} 
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={styles.inputField}
              />
            ) : (
              <span style={styles.infoValue}>{user.name}</span>
            )}
          </div>

          <div style={styles.infoField}>
            <span style={styles.infoLabel}>Email Address</span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={styles.infoValue}>{user.email}</span>
              <span style={styles.verifiedTag}>Verified</span>
            </div>
          </div>

          <div style={styles.infoField}>
            <span style={styles.infoLabel}>Mobile Number</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                style={styles.inputField}
              />
            ) : (
              <span style={styles.infoValue}>{user.phone}</span>
            )}
          </div>

          <div style={styles.infoField}>
            <span style={styles.infoLabel}>Blood Group</span>
            <span style={styles.infoValue}>{user.bloodGroup}</span>
          </div>

          <div style={{ ...styles.infoField, gridColumn: "1 / -1" }}>
            <span style={styles.infoLabel}>Emergency Contact</span>
            {isEditing ? (
              <input 
                type="text" 
                value={editForm.emergencyContact} 
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                style={styles.inputField}
              />
            ) : (
              <span style={styles.infoValue}>{user.emergencyContact}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Care Preferences Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card" 
        style={styles.card}
      >
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Care Preferences & Alerts</h3>
          <span style={styles.cardHint}>Customize how you receive care and appointment alerts</span>
        </div>

        <div style={styles.preferenceRow}>
          <div>
            <h4 style={styles.prefTitle}>SMS Appointment Reminders</h4>
            <p style={styles.prefDesc}>Receive automated SMS reminders 1 hour before scheduled consultation.</p>
          </div>
          <button 
            style={user.smsAlerts ? styles.toggleOn : styles.toggleOff}
            onClick={() => setUser(p => ({ ...p, smsAlerts: !p.smsAlerts }))}
          >
            <div style={user.smsAlerts ? styles.toggleKnobOn : styles.toggleKnobOff}></div>
          </button>
        </div>

        <div style={styles.prefDivider}></div>

        <div style={styles.preferenceRow}>
          <div>
            <h4 style={styles.prefTitle}>Email Prescription & Receipts</h4>
            <p style={styles.prefDesc}>Receive PDF clinical advice and Razorpay receipts directly in your inbox.</p>
          </div>
          <button 
            style={user.emailAlerts ? styles.toggleOn : styles.toggleOff}
            onClick={() => setUser(p => ({ ...p, emailAlerts: !p.emailAlerts }))}
          >
            <div style={user.emailAlerts ? styles.toggleKnobOn : styles.toggleKnobOff}></div>
          </button>
        </div>
      </motion.div>

      {/* Account Security Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card" 
        style={styles.card}
      >
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>Account Security</h3>
          <span style={styles.cardHint}>Manage your active session and sign out</span>
        </div>

        <div style={styles.securityRow}>
          <div>
            <span style={styles.securityLabel}>Current Session</span>
            <p style={styles.securityValue}>Active on this device &bull; Encrypted Session</p>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    paddingBottom: "40px",
  },
  headerCard: {
    position: "relative",
    overflow: "hidden",
    padding: "0",
    marginBottom: "16px",
    borderRadius: "24px",
  },
  headerCoverBanner: {
    height: "72px",
    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  },
  headerMain: {
    padding: "0 24px 20px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "-36px",
    flexWrap: "wrap",
    gap: "16px",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarLarge: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "800",
    border: "4px solid #FFFFFF",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
  },
  onlineBadge: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    border: "2px solid #FFFFFF",
  },
  headerInfo: {
    flex: 1,
    paddingTop: "38px",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
  },
  name: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  verifiedCheck: {
    display: "inline-flex",
    alignItems: "center",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  roleBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#3B82F6",
    backgroundColor: "#EFF6FF",
    padding: "3px 10px",
    borderRadius: "9999px",
  },
  memberIdBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    padding: "3px 10px",
    borderRadius: "9999px",
  },
  editBtn: {
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    border: "none",
    padding: "9px 18px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  saveBtn: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    padding: "9px 18px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  },
  statCard: {
    padding: "16px 12px",
    textAlign: "center",
    borderRadius: "20px",
  },
  statNum: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    display: "block",
    marginBottom: "2px",
    letterSpacing: "-0.02em",
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
  },
  card: {
    padding: "22px",
    borderRadius: "24px",
    marginBottom: "16px",
  },
  cardHeader: {
    marginBottom: "18px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
    letterSpacing: "-0.01em",
  },
  cardHint: {
    fontSize: "12px",
    color: "#94A3B8",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 20px",
  },
  infoField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  infoLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
  },
  inputField: {
    padding: "8px 12px",
    borderRadius: "12px",
    border: "1.5px solid #CBD5E1",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    outline: "none",
    backgroundColor: "#F8FAFC",
  },
  verifiedTag: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    padding: "2px 8px",
    borderRadius: "9999px",
  },
  preferenceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "8px 0",
  },
  prefTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  prefDesc: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
    lineHeight: "1.4",
  },
  prefDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "12px 0",
  },
  toggleOn: {
    width: "44px",
    height: "24px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    transition: "all 0.2s ease",
  },
  toggleOff: {
    width: "44px",
    height: "24px",
    borderRadius: "9999px",
    backgroundColor: "#CBD5E1",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    transition: "all 0.2s ease",
  },
  toggleKnobOn: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
  },
  toggleKnobOff: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
  },
  securityRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  securityLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  securityValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0F172A",
    margin: "2px 0 0 0",
  },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    border: "none",
    padding: "8px 18px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
};

export default UserProfile;