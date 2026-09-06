import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import UserOverview from "./UserOverview";
import BookAppointment from "./BookAppointment";
import MyAppointments from "./MyAppointments";
import UserProfile from "./UserProfile";

function UserDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const [selectedDoctorId, setSelectedDoctorId] = useState(location.state?.selectedDoctorId || null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Alex");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "alex@example.com");
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/user/me")
      .then(res => {
        if (res.data?.name) {
          setUserName(res.data.name);
          localStorage.setItem("userName", res.data.name);
        }
        if (res.data?.email) {
          setUserEmail(res.data.email);
          localStorage.setItem("userEmail", res.data.email);
        }
      })
      .catch(err => console.error("Error loading user profile:", err));
  }, []);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
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

  const navItems = [
    { id: "overview", label: "Home", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    )},
    { id: "book", label: "Find Doctors", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    )},
    { id: "my-appointments", label: "My Consultations", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    )},
    { id: "profile", label: "Profile", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )},
  ];

  return (
    <div style={styles.dashboardContainer}>
      {/* Google-Style Top Navigation Bar */}
      <header className="desktop-navbar" style={styles.navbar}>
        <div style={styles.navInner}>
          {/* Logo Brand */}
          <div style={styles.logo} onClick={() => setActiveTab("overview")}>
            <div style={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span style={styles.logoText}>
              Health<span style={{ color: '#3B82F6' }}>Connect</span>
            </span>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="desktop-nav-links" style={styles.desktopNavGroup}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={isActive ? styles.navPillActive : styles.navPillInactive}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Right Action Icons: Notification Bell & Profile Avatar */}
          <div style={styles.headerRight}>
            <button 
              style={styles.bellBtn} 
              onClick={() => setActiveTab("my-appointments")} 
              title="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span style={styles.bellDot}></span>
            </button>

            {/* Profile Dropdown */}
            <div style={styles.profileSection} ref={profileMenuRef}>
              <div 
                style={styles.avatarCircle} 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </div>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={styles.dropdownMenu}
                  >
                    <div style={styles.dropdownHeader}>
                      <p style={{ margin: 0, fontWeight: "800", fontSize: "14px", color: "#0F172A" }}>{userName}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748B" }}>{userEmail}</p>
                    </div>
                    <div style={styles.menuDivider}></div>
                    <div style={styles.menuItem} onClick={() => { setActiveTab("overview"); setShowProfileMenu(false); }}>
                      🏠 Home
                    </div>
                    <div style={styles.menuItem} onClick={() => { setActiveTab("book"); setShowProfileMenu(false); }}>
                      🔍 Find Doctors
                    </div>
                    <div style={styles.menuItem} onClick={() => { setActiveTab("my-appointments"); setShowProfileMenu(false); }}>
                      📅 My Consultations
                    </div>
                    <div style={styles.menuItem} onClick={() => { setActiveTab("profile"); setShowProfileMenu(false); }}>
                      👤 Profile & Settings
                    </div>
                    <div style={styles.menuDivider}></div>
                    <div style={styles.menuItemDanger} onClick={handleLogout}>
                      🚪 Sign Out
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout Container */}
      <main style={styles.mainContainer}>
        <AnimatePresence mode="wait">
          {(activeTab === "overview" || activeTab === "book") && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <UserOverview 
                setActiveTab={setActiveTab} 
                isFindDoctorsActive={activeTab === "book"}
                preSelectedDoctorId={selectedDoctorId}
                onClearPreSelectedDoctor={() => setSelectedDoctorId(null)}
              />
            </motion.div>
          )}

          {activeTab === "my-appointments" && (
            <motion.div 
              key="appointments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MyAppointments />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <UserProfile />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Floating Glassmorphism Bottom Navigation Pill */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div 
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="mobile-nav-icon-wrapper">
                {item.icon}
              </div>
              <span>{item.label === "My Consultations" ? "Schedule" : item.label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
  },
  navbar: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    padding: "0 20px",
  },
  navInner: {
    maxWidth: "1120px",
    margin: "0 auto",
    height: "64px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  logoIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.03em",
  },
  desktopNavGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F1F5F9",
    padding: "4px",
    borderRadius: "9999px",
  },
  navPillActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#FFFFFF",
    color: "#3B82F6",
    padding: "8px 18px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "700",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  navPillInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    color: "#64748B",
    padding: "8px 18px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  bellBtn: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
  },
  bellDot: {
    position: "absolute",
    top: "9px",
    right: "9px",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#EF4444",
    border: "1.5px solid #FFFFFF",
  },
  profileSection: {
    position: "relative",
  },
  avatarCircle: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
  },
  dropdownMenu: {
    position: "absolute",
    top: "48px",
    right: 0,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "20px",
    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.12)",
    width: "220px",
    overflow: "hidden",
    zIndex: 200,
    padding: "8px 0",
  },
  dropdownHeader: {
    padding: "10px 16px 8px",
  },
  menuItem: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
    transition: "background-color 0.15s",
  },
  menuDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "6px 0",
  },
  menuItemDanger: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#DC2626",
    fontWeight: "700",
  },
  mainContainer: {
    flex: 1,
    maxWidth: "1120px",
    width: "100%",
    margin: "0 auto",
    padding: "24px 20px 80px",
  },
};

export default UserDashboard;