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
import { getLocalDateString } from "../../utils/dateUtils"; 

function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [doctor, setDoctor] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [todayQueueCount, setTodayQueueCount] = useState(0);
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

  const fetchQueueCount = async () => {
    try {
      const today = getLocalDateString();
      const res = await api.get(`/api/doctor/appointments?date=${today}`);
      const list = res.data || [];
      const pending = list.filter(a => a.status === "BOOKED" || a.status === "RESCHEDULED").length;
      setTodayQueueCount(pending);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchQueueCount();
  }, [activeTab]);

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

  const formattedCurrentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!doctor) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p style={{ color: "#0F172A", fontSize: "14px", fontWeight: "700", margin: "12px 0 0 0" }}>Loading Doctor Workspace...</p>
        </div>
      </div>
    );
  }

  const docInitial = doctor.name ? doctor.name.charAt(0).toUpperCase() : "D";

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navbar */}
      <nav style={styles.navbar}>
        {/* Left: Brand + Role Badge */}
        <div style={styles.navLeft}>
          <div style={styles.logo} onClick={() => setActiveTab("overview")}>
            <div style={styles.logoIconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span style={styles.logoText}>
              Health<span style={{ color: "#2563EB" }}>Connect</span>
            </span>
          </div>

          <div style={styles.roleBadgeGroup}>
            <span style={styles.badge}>Doctor</span>
            <div className="clinic-status-tag" style={styles.clinicActiveTag}>
              <span style={styles.activeDot}></span>
              <span>In Clinic</span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Quick Nav Pills */}
        <div className="desktop-top-nav-pills" style={styles.desktopNavGroup}>
          <button
            onClick={() => setActiveTab("overview")}
            style={activeTab === "overview" ? styles.navPillActive : styles.navPill}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            style={activeTab === "appointments" ? styles.navPillActive : styles.navPill}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Queue</span>
            {todayQueueCount > 0 && (
              <span style={activeTab === "appointments" ? styles.pillBadgeActive : styles.pillBadge}>
                {todayQueueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            style={activeTab === "schedule" ? styles.navPillActive : styles.navPill}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Slots</span>
          </button>

          <button
            onClick={() => setActiveTab("scan")}
            style={activeTab === "scan" ? styles.navPillActive : styles.navPill}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <rect x="7" y="7" width="10" height="10" rx="1"></rect>
            </svg>
            <span>Scan Ticket</span>
          </button>
        </div>

        {/* Right: Date Pill & Profile Dropdown */}
        <div style={styles.headerRight}>
          <div className="desktop-date-pill" style={styles.datePill}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
            </svg>
            <span>{formattedCurrentDate}</span>
          </div>

          <div style={styles.profileSection} ref={profileMenuRef}>
            <div 
              style={styles.profileBtn}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title={`Dr. ${doctor.name}`}
            >
              <div style={styles.avatarCircle}>
                {docInitial}
              </div>
              <div className="desktop-doctor-names" style={styles.docHeaderText}>
                <span style={styles.docHeaderName}>Dr. {doctor.name}</span>
                <span style={styles.docHeaderSpec}>{doctor.specialization || "Specialist"}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            {showProfileMenu && (
              <div style={styles.dropdownMenu}>
                <div style={styles.menuHeader}>
                  <p style={styles.docNameTitle}>Dr. {doctor.name}</p>
                  <p style={styles.docSubTitle}>{doctor.specialization || "Hospital Specialist"}</p>
                </div>
                <div style={styles.menuDivider}></div>
                <div style={styles.menuItem} onClick={() => { setActiveTab("overview"); setShowProfileMenu(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                  </svg>
                  <span>Overview Dashboard</span>
                </div>
                <div style={styles.menuItem} onClick={() => { setActiveTab("appointments"); setShowProfileMenu(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Today's Queue ({todayQueueCount})</span>
                </div>
                <div style={styles.menuItem} onClick={() => { setActiveTab("schedule"); setShowProfileMenu(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Set Availability</span>
                </div>
                <div style={styles.menuItem} onClick={() => { setActiveTab("scan"); setShowProfileMenu(false); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                    <rect x="7" y="7" width="10" height="10" rx="1"></rect>
                  </svg>
                  <span>Scan Ticket QR</span>
                </div>
                <div style={styles.menuDivider}></div>
                <div style={styles.menuItemDanger} onClick={handleLogout}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign Out</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="mobile-main-layout" style={styles.mainLayout}>
        <div className="desktop-sidebar">
          <DoctorSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            doctor={doctor} 
            queueCount={todayQueueCount}
          />
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                  <rect x="7" y="7" width="10" height="10" rx="1"></rect>
                </svg>
                <h2 style={{ margin: 0, color: "#0F172A", fontSize: "18px", fontWeight: "800" }}>
                  Patient Ticket Verification
                </h2>
              </div>
              <p style={{ margin: "0 0 20px 0", color: "#64748B", fontSize: "13px" }}>
                Align patient QR code pass inside camera frame to verify check-in instantly.
              </p>
              <DoctorScanner />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div 
          className={`mobile-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
          </div>
          <span>Overview</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span>Today {todayQueueCount > 0 ? `(${todayQueueCount})` : ""}</span>
        </div>
        <div 
          className={`mobile-nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <rect x="7" y="7" width="10" height="10" rx="1"></rect>
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
    height: "64px",
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    position: "sticky",
    top: 0,
    zIndex: 1100,
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  logoIconWrap: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #DBEAFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.02em",
  },
  roleBadgeGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  badge: {
    fontSize: "10px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    padding: "3px 8px",
    borderRadius: "9999px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    border: "1px solid #DBEAFE",
  },
  clinicActiveTag: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#F0FDF4",
    border: "1px solid #DCFCE7",
    color: "#166534",
    padding: "3px 8px",
    borderRadius: "9999px",
    fontSize: "10px",
    fontWeight: "700",
  },
  activeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#16A34A",
  },
  desktopNavGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F1F5F9",
    padding: "4px",
    borderRadius: "9999px",
  },
  navPill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "9999px",
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#475569",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  navPillActive: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "9999px",
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#FFFFFF",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
  },
  pillBadge: {
    fontSize: "10px",
    fontWeight: "800",
    backgroundColor: "#E2E8F0",
    color: "#475569",
    padding: "1px 6px",
    borderRadius: "9999px",
  },
  pillBadgeActive: {
    fontSize: "10px",
    fontWeight: "800",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "1px 6px",
    borderRadius: "9999px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  datePill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    padding: "6px 12px",
    borderRadius: "9999px",
    fontSize: "11.5px",
    fontWeight: "600",
    color: "#475569",
  },
  profileSection: {
    position: "relative",
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    padding: "4px 10px 4px 4px",
    borderRadius: "9999px",
    cursor: "pointer",
  },
  avatarCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "13px",
  },
  docHeaderText: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  docHeaderName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: "1.2",
  },
  docHeaderSpec: {
    fontSize: "10px",
    color: "#64748B",
    lineHeight: "1.2",
  },
  dropdownMenu: {
    position: "absolute",
    top: "44px",
    right: 0,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
    width: "220px",
    overflow: "hidden",
    zIndex: 1200,
    padding: "6px 0",
  },
  menuHeader: {
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  docNameTitle: {
    margin: "0 0 2px 0",
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
  },
  docSubTitle: {
    margin: 0,
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "600",
  },
  menuDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "4px 0",
  },
  menuItem: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
    transition: "background-color 0.1s",
  },
  menuItemDanger: {
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#DC2626",
    fontWeight: "600",
    transition: "background-color 0.1s",
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
    padding: "28px",
    maxWidth: "520px",
    margin: "0 auto",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    padding: "32px",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #EFF6FF",
    borderTop: "3px solid #2563EB",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
};

export default DoctorDashboard;