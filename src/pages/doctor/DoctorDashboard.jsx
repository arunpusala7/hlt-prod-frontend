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
        setDoctor({ name: localStorage.getItem("userName") || "Specialist" });
      });
  }, []);

  // Click Outside Listener
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
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Loading Doctor Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* HEADER */}
      <nav style={styles.navbar}>
        <div style={styles.logo} onClick={() => setActiveTab("overview")}>
          Health<span style={{ color: '#2563eb' }}>Connect</span> <span style={styles.badge}>Doctor</span>
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
                Sign Out
              </div>
            </div>
          )}
        </div>
      </nav>

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
            <div style={styles.scannerWrapper}>
              <h2 style={{ margin: "0 0 16px 0", color: "#0f172a", fontSize: "18px", fontWeight: "700" }}>
                Patient Ticket Verification
              </h2>
              <DoctorScanner />
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR FOR DOCTORS */}
      <nav className="mobile-bottom-nav">
        <div 
          className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="mobile-nav-icon">📊</span>
          <span>Overview</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <span className="mobile-nav-icon">📅</span>
          <span>Today</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className="mobile-nav-icon">⏰</span>
          <span>Slots</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          <span className="mobile-nav-icon">📷</span>
          <span>Scanner</span>
        </div>
      </nav>

      {/* PATIENT HISTORY DRAWER */}
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
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    height: "60px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
    position: "sticky",
    top: 0,
    zIndex: 1100,
  },
  logo: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  badge: {
    fontSize: "10px",
    background: "#eff6ff",
    color: "#2563eb",
    padding: "2px 6px",
    borderRadius: "6px",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  profileSection: {
    position: "relative",
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
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
  },
  dropdownMenu: {
    position: "absolute",
    top: "42px",
    right: "0",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    width: "190px",
    overflow: "hidden",
    zIndex: 1200,
  },
  menuHeader: {
    padding: "12px 14px",
    backgroundColor: "#f8fafc",
  },
  docNameTitle: {
    margin: "0 0 2px 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
  },
  docSubTitle: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
  },
  menuDivider: {
    height: "1px",
    background: "#f1f5f9",
    margin: "0",
  },
  menuItem: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  menuItemDanger: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#dc2626",
    fontWeight: "600",
  },
  mainLayout: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 60px)",
  },
  contentArea: {
    flex: 1,
    padding: "24px 20px",
    overflowY: "auto",
    backgroundColor: "#f8fafc",
  },
  scannerWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    maxWidth: "600px",
    margin: "0 auto",
  },
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
};

export default DoctorDashboard;