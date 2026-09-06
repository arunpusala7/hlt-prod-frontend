import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import toast from "react-hot-toast";

function AdminDashboard() {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Live KPI & Dashboard State
  const [kpis, setKpis] = useState({
    doctorCount: 0,
    appointmentCount: 0,
    userCount: 0,
    totalRevenue: 0,
    recentAppointments: [],
    loading: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Primary: Use optimized single-call admin stats endpoint
      const statsRes = await api.get("/api/admin/stats");
      const s = statsRes.data;
      setKpis({
        doctorCount: s.totalDoctors || 0,
        appointmentCount: s.totalAppointments || 0,
        userCount: s.totalPatients || 0,
        totalRevenue: s.totalRevenue || 0,
        todayAppointments: s.todayAppointments || 0,
        completedAppointments: s.completedAppointments || 0,
        cancelledAppointments: s.cancelledAppointments || 0,
        bookedAppointments: s.bookedAppointments || 0,
        rescheduledAppointments: s.rescheduledAppointments || 0,
        recentAppointments: s.recentAppointments || [],
        loading: false,
      });
    } catch (statsErr) {
      // Fallback: Use individual API calls if /api/admin/stats is unavailable
      try {
        const [docsRes, apptsRes, usersRes, paymentsRes] = await Promise.allSettled([
          api.get("/api/doctors"),
          api.get("/api/admin/appointments"),
          api.get("/api/admin/users"),
          api.get("/api/admin/payments"),
        ]);

        const doctors = docsRes.status === "fulfilled" ? docsRes.value.data || [] : [];
        const appointments = apptsRes.status === "fulfilled" ? apptsRes.value.data || [] : [];
        const users = usersRes.status === "fulfilled" ? usersRes.value.data || [] : [];
        const payments = paymentsRes.status === "fulfilled" ? paymentsRes.value.data || [] : [];

        const revenue = payments
          .filter((p) => p.status === "SUCCESS")
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const recent = [...appointments].slice(0, 5);

        setKpis({
          doctorCount: doctors.length,
          appointmentCount: appointments.length,
          userCount: users.length,
          totalRevenue: revenue,
          recentAppointments: recent,
          loading: false,
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
        setKpis((prev) => ({ ...prev, loading: false }));
      }
    }
  };

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

  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  const formattedCurrentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div style={styles.pageContainer}>
      {/* ================= 1. CLEAN TOP NAVBAR ================= */}
      <nav style={styles.navbar}>
        {/* Left: Brand + Subtle Admin Tag */}
        <div style={styles.navLeft}>
          <div style={styles.logo} onClick={() => navigate("/admin")}>
            <div style={styles.logoIconWrap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span style={styles.logoText}>
              Health<span style={{ color: "#2563EB" }}>Connect</span>
            </span>
          </div>
          <span style={styles.adminBadge}>Admin</span>
        </div>

        {/* Center: Clean Desktop Navigation Tabs (Uncluttered) */}
        <div className="desktop-admin-nav-pills" style={styles.navTabs}>
          <button onClick={() => navigate("/admin")} style={styles.navTabActive}>
            Overview
          </button>
          <button onClick={() => navigate("/admin/appointments")} style={styles.navTab}>
            Appointments
          </button>
          <button onClick={() => navigate("/admin/doctors")} style={styles.navTab}>
            Doctors
          </button>
          <button onClick={() => navigate("/admin/users")} style={styles.navTab}>
            Patients
          </button>
          <button onClick={() => navigate("/admin/payments")} style={styles.navTab}>
            Payments
          </button>
        </div>

        {/* Right: Date Indicator & Clean Avatar Button */}
        <div style={styles.navRight}>
          <span className="admin-date-pill" style={styles.dateText}>
            {formattedCurrentDate}
          </span>

          <div style={{ position: "relative" }} ref={profileMenuRef}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              style={styles.avatarBtn}
              title="Administrator Profile"
            >
              <div style={styles.avatarCircle}>A</div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={styles.profileDropdown}
                >
                  <div style={styles.dropdownHeader}>
                    <p style={styles.dropdownUser}>System Administrator</p>
                    <p style={styles.dropdownEmail}>admin@healthconnect.com</p>
                  </div>

                  <div style={styles.menuDivider}></div>

                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/admin/appointments");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Manage Appointments</span>
                  </div>

                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/admin/doctors");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Active Doctor Directory</span>
                  </div>

                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/admin/users");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    <span>Registered Patients</span>
                  </div>

                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/admin/payments");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    <span>Payment Transactions</span>
                  </div>

                  <div
                    style={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/admin/add-doctor");
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>Onboard New Doctor</span>
                  </div>

                  <div style={styles.menuDivider}></div>

                  <button style={styles.dropdownLogoutBtn} onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ================= 2. MAIN CONTENT AREA ================= */}
      <div style={styles.contentWrapper}>
        {/* Clean Page Title Header Row */}
        <div style={styles.pageHeaderRow}>
          <div>
            <h1 style={styles.pageTitle}>{greetingTime}, Administrator</h1>
            <p style={styles.pageSub}>Hospital operations, specialist management, and system overview.</p>
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={() => navigate("/admin/add-doctor")}
              style={styles.onboardBtn}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Onboard Doctor</span>
            </button>
          </div>
        </div>

        {/* 3. Live KPI Metrics Row (4 Cards) */}
        <div className="admin-kpi-grid" style={styles.kpiGrid}>
          {/* KPI 1: Active Specialists */}
          <div style={styles.kpiCard} onClick={() => navigate("/admin/doctors")}>
            <div style={styles.kpiTopRow}>
              <span style={styles.kpiLabel}>Active Specialists</span>
              <div style={{ ...styles.kpiIconWrap, backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div style={styles.kpiValue}>
              {kpis.loading ? "..." : kpis.doctorCount}
            </div>
            <div style={styles.kpiFooter}>
              <span style={styles.kpiSub}>Registered Doctors</span>
              <span style={styles.kpiLink}>Manage &rarr;</span>
            </div>
          </div>

          {/* KPI 2: Total Consultations */}
          <div style={styles.kpiCard} onClick={() => navigate("/admin/appointments")}>
            <div style={styles.kpiTopRow}>
              <span style={styles.kpiLabel}>Total Consultations</span>
              <div style={{ ...styles.kpiIconWrap, backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
            <div style={{ ...styles.kpiValue, color: "#16A34A" }}>
              {kpis.loading ? "..." : kpis.appointmentCount}
            </div>
            <div style={styles.kpiFooter}>
              <span style={styles.kpiSub}>Patient Bookings</span>
              <span style={{ ...styles.kpiLink, color: "#16A34A" }}>View All &rarr;</span>
            </div>
          </div>

          {/* KPI 3: Registered Patients */}
          <div style={styles.kpiCard} onClick={() => navigate("/admin/users")}>
            <div style={styles.kpiTopRow}>
              <span style={styles.kpiLabel}>Registered Patients</span>
              <div style={{ ...styles.kpiIconWrap, backgroundColor: "#FDF2F8", color: "#DB2777" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>
            <div style={{ ...styles.kpiValue, color: "#DB2777" }}>
              {kpis.loading ? "..." : kpis.userCount}
            </div>
            <div style={styles.kpiFooter}>
              <span style={styles.kpiSub}>User Accounts</span>
              <span style={{ ...styles.kpiLink, color: "#DB2777" }}>Audit &rarr;</span>
            </div>
          </div>

          {/* KPI 4: Verified Revenue */}
          <div style={styles.kpiCard} onClick={() => navigate("/admin/payments")}>
            <div style={styles.kpiTopRow}>
              <span style={styles.kpiLabel}>Verified Revenue</span>
              <div style={{ ...styles.kpiIconWrap, backgroundColor: "#FEF3C7", color: "#D97706" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
            </div>
            <div style={{ ...styles.kpiValue, color: "#D97706" }}>
              {kpis.loading ? "..." : `₹${kpis.totalRevenue.toLocaleString()}`}
            </div>
            <div style={styles.kpiFooter}>
              <span style={styles.kpiSub}>Razorpay Settlements</span>
              <span style={{ ...styles.kpiLink, color: "#D97706" }}>Audit Logs &rarr;</span>
            </div>
          </div>
        </div>

        {/* 4. System Security & Protocol Strip */}
        <div style={styles.metricsRow}>
          <div style={styles.metricItem}>
            <div style={styles.metricDotGreen}></div>
            <div>
              <span style={styles.metricLabel}>Core API Gateway</span>
              <p style={styles.metricVal}>100% Operational (Port 8080)</p>
            </div>
          </div>

          <div style={styles.metricItem}>
            <div style={styles.metricDotBlue}></div>
            <div>
              <span style={styles.metricLabel}>Financial Engine</span>
              <p style={styles.metricVal}>Razorpay HMAC SHA-256 Verified</p>
            </div>
          </div>

          <div style={styles.metricItem}>
            <div style={styles.metricDotPurple}></div>
            <div>
              <span style={styles.metricLabel}>Security Protocol</span>
              <p style={styles.metricVal}>JWT RBAC (Admin Role Guard)</p>
            </div>
          </div>
        </div>

        {/* 5. Executive Action Grid (5 Cards) */}
        <div style={{ marginBottom: "28px" }}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Hospital Management Consoles</h2>
              <p style={styles.sectionSub}>Select a module to manage specialist schedules, patient accounts, or audit settlements.</p>
            </div>
          </div>

          <div className="admin-actions-grid" style={styles.gridContainer}>
            {/* CARD 1: ADD DOCTOR */}
            <div
              style={styles.actionCard}
              onClick={() => navigate("/admin/add-doctor")}
            >
              <div style={styles.cardHeaderRow}>
                <div style={{ ...styles.iconContainer, backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                </div>
                <span style={styles.cardBadgeBlue}>Onboarding</span>
              </div>
              <h3 style={styles.cardTitle}>Add New Doctor</h3>
              <p style={styles.cardDesc}>Create specialist credentials, assign hospital department, and configure consultation fees.</p>
              <div style={styles.cardFooter}>
                <span style={styles.linkArrow}>Open Doctor Setup &rarr;</span>
              </div>
            </div>

            {/* CARD 2: MANAGE APPOINTMENTS */}
            <div
              style={styles.actionCard}
              onClick={() => navigate("/admin/appointments")}
            >
              <div style={styles.cardHeaderRow}>
                <div style={{ ...styles.iconContainer, backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <span style={styles.cardBadgeGreen}>{kpis.appointmentCount} Bookings</span>
              </div>
              <h3 style={styles.cardTitle}>Manage Appointments</h3>
              <p style={styles.cardDesc}>Filter live appointment bookings, view patient ticket details, or perform emergency cancellations.</p>
              <div style={styles.cardFooter}>
                <span style={{ ...styles.linkArrow, color: "#16A34A" }}>Manage Schedule &rarr;</span>
              </div>
            </div>

            {/* CARD 3: DOCTOR LIST */}
            <div
              style={styles.actionCard}
              onClick={() => navigate("/admin/doctors")}
            >
              <div style={styles.cardHeaderRow}>
                <div style={{ ...styles.iconContainer, backgroundColor: "#FEF3C7", color: "#D97706" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 21h18"></path>
                    <path d="M5 21V7l8-4v18"></path>
                    <path d="M19 21V11l-6-4"></path>
                    <path d="M9 9h1"></path>
                    <path d="M9 13h1"></path>
                    <path d="M9 17h1"></path>
                  </svg>
                </div>
                <span style={styles.cardBadgeAmber}>{kpis.doctorCount} Specialists</span>
              </div>
              <h3 style={styles.cardTitle}>Active Doctor List</h3>
              <p style={styles.cardDesc}>Browse registered hospital specialists, view active consultation fees, and audit statuses.</p>
              <div style={styles.cardFooter}>
                <span style={{ ...styles.linkArrow, color: "#D97706" }}>View Directory &rarr;</span>
              </div>
            </div>

            {/* CARD 4: PAYMENTS TRANSACTIONS */}
            <div
              style={styles.actionCard}
              onClick={() => navigate("/admin/payments")}
            >
              <div style={styles.cardHeaderRow}>
                <div style={{ ...styles.iconContainer, backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>
                <span style={styles.cardBadgePurple}>Revenue & Audit</span>
              </div>
              <h3 style={styles.cardTitle}>Payment Transactions</h3>
              <p style={styles.cardDesc}>Inspect gross consultation revenue, Razorpay order IDs, and cryptographic verification logs.</p>
              <div style={styles.cardFooter}>
                <span style={{ ...styles.linkArrow, color: "#7C3AED" }}>View Audit Logs &rarr;</span>
              </div>
            </div>

            {/* CARD 5: REGISTERED PATIENTS */}
            <div
              style={styles.actionCard}
              onClick={() => navigate("/admin/users")}
            >
              <div style={styles.cardHeaderRow}>
                <div style={{ ...styles.iconContainer, backgroundColor: "#FDF2F8", color: "#DB2777" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span style={styles.cardBadgePink}>{kpis.userCount} Accounts</span>
              </div>
              <h3 style={styles.cardTitle}>Registered Patients</h3>
              <p style={styles.cardDesc}>Browse registered patient accounts, audit user emails, and perform account lifecycle controls.</p>
              <div style={styles.cardFooter}>
                <span style={{ ...styles.linkArrow, color: "#DB2777" }}>Manage Patients &rarr;</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Recent Consultations Quick Preview Table */}
        <div style={styles.recentCard}>
          <div style={styles.recentHeaderRow}>
            <div>
              <h3 style={styles.recentTitle}>Live Hospital Consultations Feed</h3>
              <p style={styles.recentSub}>Latest appointment bookings and consult status updates across all departments.</p>
            </div>
            <button
              onClick={() => navigate("/admin/appointments")}
              style={styles.viewAllBtn}
            >
              <span>View Full Registry ({kpis.appointmentCount})</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {kpis.loading ? (
            <p style={{ textAlign: "center", color: "#64748B", padding: "30px 0", fontSize: "13px" }}>
              Syncing live consultation feed...
            </p>
          ) : kpis.recentAppointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#64748B", fontSize: "13px" }}>
              No consultation records registered yet.
            </div>
          ) : (
            <div className="admin-preview-table-wrap">
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Ticket Pass</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.recentAppointments.map((a, idx) => (
                    <tr key={a.appointmentId || idx} style={styles.tr}>
                      <td style={styles.td}>
                        <strong style={{ color: "#0F172A" }}>{a.doctorName || "Specialist"}</strong>
                      </td>
                      <td style={styles.td}>{a.userName || "Patient"}</td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                          </svg>
                          <span>{a.date}</span>
                          <span style={{ color: "#CBD5E1" }}>•</span>
                          <span>{a.startTime?.substring(0, 5) || "09:00"}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.ticketPill}>{a.ticketId || "HC-PASS"}</span>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={
                            a.status === "COMPLETED"
                              ? styles.statusCompleted
                              : a.status === "CANCELLED"
                              ? styles.statusCancelled
                              : styles.statusBooked
                          }
                        >
                          ● {a.status || "BOOKED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= 7. FOOTER ================= */}
      <footer style={styles.footer}>
        HealthConnect Healthcare Administration Portal &bull; Razorpay Payment Verified
      </footer>

      {/* ================= 8. MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="mobile-bottom-nav">
        <div
          className="mobile-nav-item active"
          onClick={() => navigate("/admin")}
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
          className="mobile-nav-item"
          onClick={() => navigate("/admin/appointments")}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <span>Queue</span>
        </div>

        <div
          className="mobile-nav-item"
          onClick={() => navigate("/admin/doctors")}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <span>Doctors</span>
        </div>

        <div
          className="mobile-nav-item"
          onClick={() => navigate("/admin/users")}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          </div>
          <span>Patients</span>
        </div>

        <div
          className="mobile-nav-item"
          onClick={() => navigate("/admin/payments")}
        >
          <div className="mobile-nav-icon-wrapper">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <span>Payments</span>
        </div>
      </nav>
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
    padding: "0 28px",
    height: "60px",
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logo: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoIconWrap: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "-0.3px",
  },
  adminBadge: {
    fontSize: "10px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    border: "1px solid #DBEAFE",
    letterSpacing: "0.5px",
  },

  navTabs: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  navTab: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  navTabActive: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  dateText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748B",
  },
  avatarBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 8px 3px 3px",
    borderRadius: "20px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    cursor: "pointer",
    transition: "border-color 0.15s ease",
  },
  avatarCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "800",
  },

  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "42px",
    width: "230px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
    padding: "6px 0",
    zIndex: 1200,
  },
  dropdownHeader: {
    padding: "10px 16px",
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  dropdownUser: {
    margin: "0 0 2px 0",
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
  },
  dropdownEmail: {
    margin: 0,
    fontSize: "11px",
    color: "#64748B",
  },
  menuDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "4px 0",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
    transition: "background-color 0.1s",
  },
  dropdownLogoutBtn: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#DC2626",
    fontWeight: "600",
    background: "none",
    border: "none",
    textAlign: "left",
    transition: "background-color 0.1s",
  },

  contentWrapper: {
    maxWidth: "1140px",
    width: "100%",
    margin: "0 auto",
    padding: "24px 20px 80px",
    boxSizing: "border-box",
  },

  pageHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  pageTitle: {
    margin: "0 0 4px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.5px",
  },
  pageSub: {
    margin: 0,
    fontSize: "13px",
    color: "#64748B",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  onboardBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 16px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "10px",
    border: "none",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
    transition: "background-color 0.15s ease",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },
  kpiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "18px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  kpiTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  kpiLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748B",
  },
  kpiIconWrap: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "4px 0",
    letterSpacing: "-0.5px",
  },
  kpiFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },
  kpiSub: {
    fontSize: "11px",
    color: "#64748B",
  },
  kpiLink: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
  },

  metricsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
    marginBottom: "28px",
  },
  metricItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.02)",
  },
  metricDotGreen: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#16A34A",
    boxShadow: "0 0 0 3px #DCFCE7",
  },
  metricDotBlue: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
    boxShadow: "0 0 0 3px #EFF6FF",
  },
  metricDotPurple: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#7C3AED",
    boxShadow: "0 0 0 3px #F5F3FF",
  },
  metricLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    display: "block",
  },
  metricVal: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "14px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSub: {
    margin: "3px 0 0 0",
    fontSize: "12px",
    color: "#64748B",
  },

  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  iconContainer: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBadgeBlue: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    padding: "3px 8px",
    borderRadius: "10px",
  },
  cardBadgeGreen: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    padding: "3px 8px",
    borderRadius: "10px",
  },
  cardBadgeAmber: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#D97706",
    backgroundColor: "#FEF3C7",
    padding: "3px 8px",
    borderRadius: "10px",
  },
  cardBadgePurple: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#7C3AED",
    backgroundColor: "#F5F3FF",
    padding: "3px 8px",
    borderRadius: "10px",
  },
  cardBadgePink: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#DB2777",
    backgroundColor: "#FDF2F8",
    padding: "3px 8px",
    borderRadius: "10px",
  },
  cardTitle: {
    margin: "0 0 6px 0",
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  cardDesc: {
    margin: "0 0 16px 0",
    fontSize: "12px",
    color: "#64748B",
    lineHeight: "1.5",
    flex: 1,
  },
  cardFooter: {
    borderTop: "1px solid #F1F5F9",
    paddingTop: "12px",
  },
  linkArrow: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#2563EB",
  },

  recentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
  },
  recentHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  recentTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  recentSub: {
    margin: "3px 0 0 0",
    fontSize: "12px",
    color: "#64748B",
  },
  viewAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #DBEAFE",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "10px 14px",
    backgroundColor: "#F8FAFC",
    color: "#64748B",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    borderBottom: "1px solid #E2E8F0",
  },
  tr: {
    borderBottom: "1px solid #F1F5F9",
  },
  td: {
    padding: "12px 14px",
    color: "#334155",
  },
  ticketPill: {
    backgroundColor: "#F1F5F9",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    fontFamily: "monospace",
    color: "#0F172A",
  },
  statusBooked: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    padding: "3px 8px",
    borderRadius: "12px",
  },
  statusCompleted: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    padding: "3px 8px",
    borderRadius: "12px",
  },
  statusCancelled: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#DC2626",
    backgroundColor: "#FEE2E2",
    padding: "3px 8px",
    borderRadius: "12px",
  },

  footer: {
    textAlign: "center",
    padding: "24px 20px",
    color: "#94A3B8",
    fontSize: "12px",
    fontWeight: "500",
    borderTop: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    marginTop: "auto",
  },
};

export default AdminDashboard;