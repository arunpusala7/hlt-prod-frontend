import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import DoctorSidebar from "./DoctorSidebar";
import DoctorScanner from "./DoctorScanner"; 
import DoctorHome from "./DoctorHome";           
import TodayAppointments from "./TodayAppointments";
import DoctorSchedule from "./DoctorSchedule"; 
import PatientHistoryDrawer from "./PatientHistoryDrawer"; 

function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [doctor, setDoctor] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  // State for Patient History
  const [history, setHistory] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    api.get("/api/doctor/me")
      .then(res => setDoctor(res.data))
      .catch(() => {
        setDoctor({ name: localStorage.getItem("userName") || "Specialist", specialization: "General Medicine" });
      });
  }, []);

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

  const handleViewHistory = async (userId, userName) => {
    if (!userId) {
      toast.error("Patient ID not found.");
      return;
    }

    setLoadingHistory(true);
    setSelectedPatientName(userName);
    
    try {
      const res = await api.get(`/api/doctor/patient-history/${userId}`);
      setHistory(res.data || []);
      setIsDrawerOpen(true);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Permission denied to view patient history.");
      } else {
        toast.error("Failed to load patient history.");
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!doctor) {
    return (
      <div style={styles.loading}>
        <p style={{ color: "#64748B", fontSize: "14px", fontWeight: "600" }}>Loading Doctor Workspace...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => setActiveTab("overview")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span>Health<span style={{ color: '#3B82F6' }}>Connect</span></span>
          <span style={styles.badge}>Doctor</span>
        </div>

        {/* Profile Dropdown Section */}
        <div style={styles.profileSection} ref={profileMenuRef}>
          <div 
            style={styles.avatarCircle} 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={`Dr. ${doctor.name}`}
          >
            {doctor.name ? doctor.name.charAt(0).toUpperCase() : "D"}
          </div>

          {showProfileMenu && (
            <div style={styles.dropdownMenu}>
              <div style={styles.menuHeader}>
                <p style={styles.docNameTitle}>Dr. {doctor.name}</p>
                <p style={styles.docSubTitle}>{doctor.specialization || "Hospital Specialist"}</p>
              </div>
              <div style={styles.menuDivider}></div>
              <div style={styles.menuItem} onClick={() => { setActiveTab("overview"); setShowProfileMenu(false); }}>
                📊 Overview
              </div>
              <div style={styles.menuItem} onClick={() => { setActiveTab("appointments"); setShowProfileMenu(false); }}>
                📅 Today's Queue
              </div>
              <div style={styles.menuItem} onClick={() => { setActiveTab("schedule"); setShowProfileMenu(false); }}>
                ⏰ Set Availability
              </div>
              <div style={styles.menuItem} onClick={() => { setActiveTab("scan"); setShowProfileMenu(false); }}>
                📷 Scan Ticket
              </div>
              <div style={styles.menuDivider}></div>
              <div style={styles.menuItemDanger} onClick={handleLogout}>
                🚪 Sign Out
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <div className="mobile-main-layout" style={styles.mainLayout}>
        <div className="desktop-sidebar">
          <DoctorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <main className="mobile-content-area" style={styles.contentArea}>
          {activeTab === "overview" && (
            <DoctorHome doctor={doctor} setActiveTab={setActiveTab} />
          )}

          {activeTab === "appointments" && (
            <TodayAppointments 
              onViewHistory={handleViewHistory} 
              isLoadingHistory={loadingHistory} 
            />
          )}

          {activeTab === "schedule" && (
            <DoctorSchedule />
          )}

          {activeTab === "scan" && (
            <div className="glass-card" style={styles.scannerWrapper}>
              <h2 style={{ margin: "0 0 16px 0", color: "#0F172A", fontSize: "18px", fontWeight: "700" }}>
                Patient Ticket Verification
              </h2>
              <DoctorScanner />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Floating Glass Navigation */}
      <nav className="mobile-bottom-nav">
        <div 
          className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <span>Overview</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span>Today</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span>Slots</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <span>Scan</span>
        </div>
      </nav>

      {/* Patient History Drawer */}
      <PatientHistoryDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        history={history} 
        patientName={selectedPatientName} 
      />
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    height: "64px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
    position: "sticky",
    top: 0,
    zIndex: 1100,
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
    background: "#EFF6FF",
    color: "#3B82F6",
    padding: "3px 8px",
    borderRadius: "9999px",
    textTransform: "uppercase",
    fontWeight: "700",
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
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
  },
  dropdownMenu: {
    position: "absolute",
    top: "48px",
    right: 0,
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "18px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.12)",
    width: "210px",
    overflow: "hidden",
    zIndex: 1200,
    padding: "6px 0",
  },
  menuHeader: {
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
  },
  docNameTitle: {
    margin: "0 0 2px 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
  },
  docSubTitle: {
    margin: 0,
    fontSize: "11px",
    color: "#64748B",
  },
  menuDivider: {
    height: "1px",
    background: "#F1F5F9",
    margin: "4px 0",
  },
  menuItem: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
  },
  menuItemDanger: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#DC2626",
    fontWeight: "600",
  },
  mainLayout: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
  },
  contentArea: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    backgroundColor: "#F8FAFC",
  },
  scannerWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px",
    maxWidth: "520px",
    margin: "0 auto",
  },
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
};

export default DoctorDashboard;