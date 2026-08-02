import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import UserSidebar from "./UserSidebar";
import BookAppointment from "./BookAppointment";
import MyAppointments from "./MyAppointments";
import UserOverview from "./UserOverview";
import UserProfile from "./UserProfile"; 

function UserDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "overview");
  const preSelectedDoctorId = location.state?.selectedDoctorId || null;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/user/me")
      .then(res => {
        if (res.data?.name) {
          localStorage.setItem("userName", res.data.name);
        }
        if (res.data?.email) {
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

  return (
    <div style={styles.dashboardContainer}>
      {/* HEADER */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => setActiveTab("overview")}>
          Health<span style={{color: '#2563eb'}}>Connect</span> <span style={styles.badge}>Patient</span>
        </div>
        
        <div style={styles.profileSection} ref={profileMenuRef}>
          <div style={styles.avatarCircle} onClick={() => setShowProfileMenu(!showProfileMenu)}>U</div>
          {showProfileMenu && (
            <div style={styles.dropdownMenu}>
              <div style={styles.menuItem} onClick={() => {setActiveTab("profile"); setShowProfileMenu(false);}}>My Profile</div>
              <div style={styles.menuItem} onClick={() => {setActiveTab("my-appointments"); setShowProfileMenu(false);}}>Appointments</div>
              <div style={styles.menuDivider}></div>
              <div style={styles.menuItemDanger} onClick={handleLogout}>Sign Out</div>
            </div>
          )}
        </div>
      </nav>

      <div className="mobile-main-layout" style={styles.mainLayout}>
        <div className="desktop-sidebar">
          <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* CONTENT AREA */}
        <main className="mobile-content-area" style={styles.contentArea}>
          
          {activeTab === "overview" && (
            <div style={styles.fadeIn}><UserOverview setActiveTab={setActiveTab} /></div>
          )}

          {activeTab === "profile" && (
            <div style={styles.fadeIn}><UserProfile /></div>
          )}

          {activeTab === "book" && (
            <div style={styles.fadeIn}>
              <BookAppointment
                preSelectedDoctorId={preSelectedDoctorId}
                onBookingComplete={() => setActiveTab("my-appointments")}
              />
            </div>
          )}

          {activeTab === "my-appointments" && (
            <div style={styles.fadeIn}><MyAppointments /></div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="mobile-bottom-nav">
        <div 
          className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="mobile-nav-icon">🏠</span>
          <span>Home</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'book' ? 'active' : ''}`}
          onClick={() => setActiveTab('book')}
        >
          <span className="mobile-nav-icon">➕</span>
          <span>Book</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'my-appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-appointments')}
        >
          <span className="mobile-nav-icon">📅</span>
          <span>History</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="mobile-nav-icon">👤</span>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
}

const styles = {
  dashboardContainer: { minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: "60px", backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontSize: "18px", fontWeight: "700", color: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" },
  badge: { fontSize: "10px", background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "6px", textTransform: "uppercase", fontWeight: "700" },
  
  profileSection: { position: "relative" },
  avatarCircle: { width: "34px", height: "34px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", cursor: "pointer", fontSize: "14px" },
  dropdownMenu: { position: "absolute", top: "42px", right: "0", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", width: "160px", overflow: "hidden", zIndex: 200 },
  menuItem: { padding: "10px 14px", cursor: "pointer", fontSize: "13px", color: "#334155", fontWeight: "500", transition: "background 0.2s" },
  menuDivider: { height: "1px", background: "#f1f5f9", margin: "0" },
  menuItemDanger: { padding: "10px 14px", cursor: "pointer", fontSize: "13px", color: "#dc2626", fontWeight: "600" },

  mainLayout: { display: "flex", flex: 1, height: "calc(100vh - 60px)" },
  
  contentArea: { 
    flex: 1, 
    padding: "24px 20px", 
    overflowY: "auto", 
    backgroundColor: "#f8fafc" 
  },
  fadeIn: { animation: "fadeIn 0.3s ease-in-out" },
};

export default UserDashboard;