import React, { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Scanner } from "@yudiel/react-qr-scanner";
import { motion } from "framer-motion";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  QrCode,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  LogOut,
  Search,
  Building2,
  Calendar,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { extractTicketId } from "../doctor/DoctorScanner";

export default function AssistantPortal() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // Navigation tab: 'scanner' | 'queue' | 'stats'
  const [activeTab, setActiveTab] = useState("scanner");

  // Scanner states
  const [isScanning, setIsScanning] = useState(true);
  const [manualTicket, setManualTicket] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // { status, data, message, rawTicket }

  // Queue state
  const [queueData, setQueueData] = useState({
    todayDate: "",
    clinicName: "",
    totalToday: 0,
    checkedInToday: 0,
    waitingCount: 0,
    completedToday: 0,
    appointments: [],
  });
  const [queueLoading, setQueueLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | WAITING | CHECKED_IN | COMPLETED

  // Stats state
  const [stats, setStats] = useState({
    todayAppointments: 0,
    checkedInCount: 0,
    waitingCount: 0,
    completedCount: 0,
    totalClinicAppointments: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Assistant Info
  const assistantName = localStorage.getItem("userName") || "Front-Desk Assistant";

  useEffect(() => {
    fetchQueueData();
    fetchStats();
    const interval = setInterval(() => {
      fetchQueueData(true);
      fetchStats(true);
    }, 20000); // 20s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async (silent = false) => {
    if (!silent) setQueueLoading(true);
    try {
      const res = await api.get("/api/assistant/today-queue");
      if (res.data) {
        startTransition(() => {
          setQueueData(res.data);
        });
      }
    } catch (err) {
      console.warn("Queue fetch error:", err);
    } finally {
      if (!silent) setQueueLoading(false);
    }
  };

  const fetchStats = async (silent = false) => {
    if (!silent) setStatsLoading(true);
    try {
      const res = await api.get("/api/assistant/stats");
      if (res.data) {
        startTransition(() => {
          setStats(res.data);
        });
      }
    } catch (err) {
      console.warn("Stats fetch error:", err);
    } finally {
      if (!silent) setStatsLoading(false);
    }
  };

  // Perform Patient Check-In
  const handleCheckIn = async (rawTicket) => {
    const ticketId = extractTicketId(rawTicket);
    if (!ticketId) {
      toast.error("Invalid QR Code: No valid ticket ID found");
      setIsScanning(true);
      return;
    }

    setIsScanning(false);
    setScanLoading(true);
    setVerificationResult(null);

    const toastId = toast.loading(`Verifying ${ticketId}...`);

    try {
      // Primary: POST /api/assistant/check-in with { ticketId }
      const res = await api.post("/api/assistant/check-in", { ticketId });
      toast.success("Patient Check-in Successful!", { id: toastId });
      setVerificationResult({
        status: "SUCCESS",
        data: res.data,
      });
      // Refresh queue and stats
      fetchQueueData(true);
      fetchStats(true);
    } catch (err) {
      console.error("Check-in error:", err);
      const resData = err.response?.data;
      const status = err.response?.status;
      const rawMessage = typeof resData === "string" ? resData : resData?.message || "";

      if (status === 400 && rawMessage.includes("WRONG_CLINIC")) {
        toast.error("Wrong Clinic Branch!", { id: toastId });
        setVerificationResult({
          status: "WRONG_CLINIC",
          message: rawMessage.replace("WRONG_CLINIC:", "").trim(),
          rawTicket: ticketId,
        });
      } else if (status === 400 && rawMessage.includes("ALREADY_CHECKED_IN")) {
        toast("Patient Already Checked In", { id: toastId, icon: "ℹ️" });
        setVerificationResult({
          status: "ALREADY_CHECKED_IN",
          message: rawMessage.replace("ALREADY_CHECKED_IN:", "").trim(),
          rawTicket: ticketId,
        });
      } else if (status === 400 && rawMessage.includes("INVALID_STATUS")) {
        toast.error("Cannot check in: Appointment is not confirmed", { id: toastId });
        setVerificationResult({
          status: "INVALID_STATUS",
          message: "Only CONFIRMED appointments can be checked in. This booking is either cancelled or pending payment.",
          rawTicket: ticketId,
        });
      } else if (status === 404) {
        toast.error("Invalid QR ticket code", { id: toastId });
        setVerificationResult({
          status: "NOT_FOUND",
          message: `No appointment found matching ticket '${ticketId}'.`,
          rawTicket: ticketId,
        });
      } else {
        // Fallback: Try /api/validate/{ticketId}
        try {
          const fallbackRes = await api.get(`/api/validate/${encodeURIComponent(ticketId)}`);
          if (fallbackRes.data?.status === "VALID") {
            toast.success("Patient Checked In!", { id: toastId });
            setVerificationResult({
              status: "SUCCESS",
              data: {
                ticketId,
                patientName: fallbackRes.data.patientName,
                doctorName: fallbackRes.data.doctorName,
                appointmentDate: fallbackRes.data.date,
                appointmentTime: fallbackRes.data.time,
                clinicName: queueData.clinicName || "Clinic Reception",
                checkedInByAssistantName: assistantName,
              },
            });
            fetchQueueData(true);
            fetchStats(true);
            return;
          }
        } catch {}

        const fallbackMsg = rawMessage || "Error connecting to check-in service. Please verify ticket manually.";
        toast.error(fallbackMsg, { id: toastId });
        setVerificationResult({
          status: "ERROR",
          message: fallbackMsg,
          rawTicket: ticketId,
        });
      }
    } finally {
      setScanLoading(false);
    }
  };

  const resetScanner = () => {
    setVerificationResult(null);
    setManualTicket("");
    setIsScanning(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const filteredQueue = (queueData.appointments || []).filter((apt) => {
    const matchesSearch =
      !searchQuery.trim() ||
      apt.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctorName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "WAITING") return !apt.isCheckedIn && apt.status !== "CANCELLED";
    if (filterStatus === "CHECKED_IN") return apt.isCheckedIn;
    if (filterStatus === "COMPLETED") return apt.status === "COMPLETED";
    return true;
  });

  return (
    <div style={styles.pageWrap}>
      {/* Top Header */}
      <header style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>
            <Building2 size={20} color="#2563EB" />
          </div>
          <div>
            <div style={styles.headerClinic}>
              {queueData.clinicName || "Front-Desk Reception"}
            </div>
            <div style={styles.headerRoleBadge}>
              <span style={styles.onlineDot}></span>
              <span>Front-Desk Station &bull; {assistantName}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={styles.tabGroup}>
          <button
            onClick={() => setActiveTab("scanner")}
            style={activeTab === "scanner" ? styles.tabActive : styles.tabInactive}
          >
            <QrCode size={16} />
            <span>QR Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            style={activeTab === "queue" ? styles.tabActive : styles.tabInactive}
          >
            <Users size={16} />
            <span>Live Queue ({queueData.waitingCount || queueData.appointments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            style={activeTab === "stats" ? styles.tabActive : styles.tabInactive}
          >
            <Clock size={16} />
            <span>Daily Stats</span>
          </button>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContainer}>
        {/* ================= TAB 1: QR SCANNER & CHECK-IN ================= */}
        {activeTab === "scanner" && (
          <div style={styles.scannerWrapper}>
            <div style={styles.scannerHeroHeader}>
              <h1 style={styles.heroTitle}>Patient QR Check-In</h1>
              <p style={styles.heroSub}>
                Position the patient's digital ticket or appointment pass in front of the camera, or type the ticket code below.
              </p>
            </div>

            {isScanning ? (
              <div style={styles.scannerBoxCard}>
                <div style={styles.cameraFrame}>
                  <Scanner
                    onScan={(codes) => {
                      if (codes && codes.length > 0 && codes[0]?.rawValue && isScanning) {
                        handleCheckIn(codes[0].rawValue);
                      }
                    }}
                    components={{ audio: false, finder: true }}
                    styles={{
                      container: { borderRadius: "16px", overflow: "hidden", width: "100%", height: "100%" },
                      video: { objectFit: "cover" },
                    }}
                  />
                </div>

                <div style={styles.scannerPrompt}>
                  <Sparkles size={16} color="#2563EB" />
                  <span>Aim camera at patient's QR code on phone or physical pass</span>
                </div>

                {/* Manual Ticket Entry */}
                <div style={styles.manualEntryContainer}>
                  <div style={styles.dividerRow}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>OR MANUAL TICKET LOOKUP</span>
                    <div style={styles.dividerLine}></div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (manualTicket.trim()) {
                        handleCheckIn(manualTicket.trim());
                      }
                    }}
                    style={styles.manualForm}
                  >
                    <input
                      type="text"
                      placeholder="e.g. HC-8F7E6D5C"
                      value={manualTicket}
                      onChange={(e) => setManualTicket(e.target.value)}
                      style={styles.manualInput}
                    />
                    <button
                      type="submit"
                      disabled={!manualTicket.trim() || scanLoading}
                      style={
                        manualTicket.trim() && !scanLoading
                          ? styles.manualSubmitBtn
                          : styles.manualSubmitBtnDisabled
                      }
                    >
                      {scanLoading ? "Verifying..." : "Check In ↗"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* ================= VERIFICATION RESULTS ================= */
              <div style={styles.resultContainer}>
                {/* 1. SUCCESS */}
                {verificationResult?.status === "SUCCESS" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.resultCardSuccess}
                  >
                    <div style={styles.iconCircleSuccess}>
                      <CheckCircle2 size={44} color="#16A34A" />
                    </div>

                    <div style={styles.badgeSuccess}>
                      <ShieldCheck size={14} />
                      <span>Verified Check-in</span>
                    </div>

                    <h2 style={styles.resultTitle}>Check-In Confirmed!</h2>
                    <p style={styles.resultSubtitle}>
                      The patient has been added to the doctor's live queue.
                    </p>

                    <div style={styles.detailsCard}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Ticket ID</span>
                        <span style={styles.detailValueBold}>
                          {verificationResult.data?.ticketId || "HC-PASS"}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Patient Name</span>
                        <span style={styles.detailValue}>
                          {verificationResult.data?.patientName || "Walk-in Patient"}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Assigned Doctor</span>
                        <span style={styles.detailValue}>
                          {verificationResult.data?.doctorName || "General Practitioner"}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Scheduled Time</span>
                        <span style={styles.detailValue}>
                          {verificationResult.data?.appointmentTime || "Immediate"}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Clinic Branch</span>
                        <span style={styles.detailValue}>
                          {verificationResult.data?.clinicName || queueData.clinicName || "Main Branch"}
                        </span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Front-Desk PA</span>
                        <span style={styles.detailValue}>
                          {verificationResult.data?.checkedInByAssistantName || assistantName}
                        </span>
                      </div>
                    </div>

                    <button onClick={resetScanner} style={styles.btnPrimary}>
                      <QrCode size={18} />
                      <span>Scan Next Patient</span>
                    </button>
                  </motion.div>
                )}

                {/* 2. WRONG CLINIC ERROR */}
                {verificationResult?.status === "WRONG_CLINIC" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.resultCardWarning}
                  >
                    <div style={styles.iconCircleWarning}>
                      <AlertTriangle size={44} color="#D97706" />
                    </div>

                    <div style={styles.badgeWarning}>
                      <AlertTriangle size={14} />
                      <span>Invalid Clinic Branch</span>
                    </div>

                    <h2 style={styles.resultTitleWarning}>Wrong Clinic Branch</h2>
                    
                    <div style={styles.warningBannerBox}>
                      <p style={styles.warningBannerText}>
                        {verificationResult.message || "This appointment is scheduled for another clinic branch in the network."}
                      </p>
                    </div>

                    <p style={styles.errorSubtext}>
                      Please direct the patient to their scheduled clinic branch. Ticket:{" "}
                      <strong>{verificationResult.rawTicket}</strong>
                    </p>

                    <button onClick={resetScanner} style={styles.btnWarning}>
                      <span>Back to Scanner</span>
                    </button>
                  </motion.div>
                )}

                {/* 3. ALREADY CHECKED IN */}
                {verificationResult?.status === "ALREADY_CHECKED_IN" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.resultCardInfo}
                  >
                    <div style={styles.iconCircleInfo}>
                      <UserCheck size={44} color="#2563EB" />
                    </div>

                    <div style={styles.badgeInfo}>
                      <span>Already Registered</span>
                    </div>

                    <h2 style={styles.resultTitle}>Already Checked In</h2>
                    
                    <div style={styles.infoBannerBox}>
                      <p style={styles.infoBannerText}>
                        {verificationResult.message || "This patient has already checked in and is waiting in the queue."}
                      </p>
                    </div>

                    <div style={styles.actionRow}>
                      <button
                        onClick={() => {
                          resetScanner();
                          setActiveTab("queue");
                        }}
                        style={styles.btnSecondary}
                      >
                        <Users size={16} />
                        <span>View Live Queue</span>
                      </button>
                      <button onClick={resetScanner} style={styles.btnPrimary}>
                        <QrCode size={16} />
                        <span>Scan Next</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 4. INVALID STATUS OR NOT FOUND */}
                {(verificationResult?.status === "INVALID_STATUS" ||
                  verificationResult?.status === "NOT_FOUND" ||
                  verificationResult?.status === "ERROR") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.resultCardDanger}
                  >
                    <div style={styles.iconCircleDanger}>
                      <XCircle size={44} color="#DC2626" />
                    </div>

                    <div style={styles.badgeDanger}>
                      <span>Validation Failed</span>
                    </div>

                    <h2 style={styles.resultTitleDanger}>
                      {verificationResult.status === "NOT_FOUND"
                        ? "Ticket Not Found"
                        : "Cannot Check In Patient"}
                    </h2>

                    <div style={styles.dangerBannerBox}>
                      <p style={styles.dangerBannerText}>
                        {verificationResult.message}
                      </p>
                    </div>

                    <button onClick={resetScanner} style={styles.btnDanger}>
                      <span>Try Another Ticket</span>
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: LIVE WAITING ROOM QUEUE ================= */}
        {activeTab === "queue" && (
          <div style={styles.queueWrapper}>
            <div style={styles.queueHeaderRow}>
              <div>
                <h1 style={styles.heroTitle}>Live Waiting Room Queue</h1>
                <p style={styles.heroSub}>
                  {queueData.clinicName ? `${queueData.clinicName} • ` : ""}
                  {queueData.todayDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div style={styles.queueActionHeader}>
                <button
                  onClick={() => fetchQueueData()}
                  style={styles.refreshBtn}
                  disabled={queueLoading}
                >
                  <RefreshCw size={15} className={queueLoading ? "animate-spin" : ""} />
                  <span>{queueLoading ? "Refreshing..." : "Refresh Queue"}</span>
                </button>
              </div>
            </div>

            {/* Queue Summary Strip */}
            <div style={styles.summaryStrip}>
              <div style={styles.stripCard}>
                <span style={styles.stripLabel}>Total Today</span>
                <span style={styles.stripNum}>{queueData.totalToday || queueData.appointments?.length || 0}</span>
              </div>
              <div style={styles.stripCard}>
                <span style={styles.stripLabel}>Waiting</span>
                <span style={{ ...styles.stripNum, color: "#D97706" }}>
                  {queueData.waitingCount || 0}
                </span>
              </div>
              <div style={styles.stripCard}>
                <span style={styles.stripLabel}>Checked In</span>
                <span style={{ ...styles.stripNum, color: "#16A34A" }}>
                  {queueData.checkedInToday || 0}
                </span>
              </div>
              <div style={styles.stripCard}>
                <span style={styles.stripLabel}>Completed</span>
                <span style={{ ...styles.stripNum, color: "#2563EB" }}>
                  {queueData.completedToday || 0}
                </span>
              </div>
            </div>

            {/* Filters and Search */}
            <div style={styles.filterBar}>
              <div style={styles.searchBox}>
                <Search size={16} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search patient, ticket ID, or doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <div style={styles.filterPills}>
                {["ALL", "WAITING", "CHECKED_IN", "COMPLETED"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    style={filterStatus === f ? styles.filterPillActive : styles.filterPillInactive}
                  >
                    {f === "ALL" ? "All" : f.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue Table */}
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Ticket / ID</th>
                    <th style={styles.th}>Patient Name</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Check-In Status</th>
                    <th style={styles.th}>Assistant</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.emptyTd}>
                        <Users size={32} color="#94A3B8" style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>
                          No appointments found in current queue.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((apt, idx) => {
                      const isChecked = apt.isCheckedIn;
                      return (
                        <tr key={apt.appointmentId || idx} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={styles.ticketPill}>{apt.ticketId || `HC-${apt.appointmentId}`}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.patientCell}>
                              <div style={styles.avatarMini}>
                                {apt.patientName ? apt.patientName.charAt(0).toUpperCase() : "P"}
                              </div>
                              <span style={styles.patientNameText}>{apt.patientName || "Patient"}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.doctorNameText}>{apt.doctorName || "Doctor"}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.timeBadge}>
                              <Clock size={12} />
                              <span>{apt.appointmentTime || "Today"}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            {isChecked ? (
                              <span style={styles.statusCheckedIn}>
                                <CheckCircle2 size={12} />
                                <span>Checked In</span>
                              </span>
                            ) : (
                              <span style={styles.statusWaiting}>
                                <Clock size={12} />
                                <span>Waiting</span>
                              </span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <span style={styles.assistantText}>
                              {apt.checkedInByAssistant || (isChecked ? "Front Desk" : "-")}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {!isChecked && (
                              <button
                                onClick={() => handleCheckIn(apt.ticketId || String(apt.appointmentId))}
                                style={styles.quickCheckInBtn}
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DAILY STATS ================= */}
        {activeTab === "stats" && (
          <div style={styles.statsWrapper}>
            <div style={styles.queueHeaderRow}>
              <div>
                <h1 style={styles.heroTitle}>Front-Desk Daily Metrics</h1>
                <p style={styles.heroSub}>Operational throughput and check-in performance</p>
              </div>
              <button
                onClick={() => fetchStats()}
                style={styles.refreshBtn}
                disabled={statsLoading}
              >
                <RefreshCw size={15} className={statsLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapBlue}>
                  <Calendar size={24} color="#2563EB" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Today's Scheduled Appointments</p>
                  <h3 style={styles.kpiValue}>{stats.todayAppointments || queueData.totalToday || 0}</h3>
                  <p style={styles.kpiNote}>Total booked visits for today</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapGreen}>
                  <CheckCircle2 size={24} color="#16A34A" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Checked-In Patients</p>
                  <h3 style={{ ...styles.kpiValue, color: "#16A34A" }}>
                    {stats.checkedInCount || queueData.checkedInToday || 0}
                  </h3>
                  <p style={styles.kpiNote}>Verified via QR or receptionist</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapAmber}>
                  <Clock size={24} color="#D97706" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Waiting Room Queue</p>
                  <h3 style={{ ...styles.kpiValue, color: "#D97706" }}>
                    {stats.waitingCount || queueData.waitingCount || 0}
                  </h3>
                  <p style={styles.kpiNote}>Awaiting consultation</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapPurple}>
                  <UserCheck size={24} color="#7C3AED" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Consultations Completed</p>
                  <h3 style={{ ...styles.kpiValue, color: "#7C3AED" }}>
                    {stats.completedCount || queueData.completedToday || 0}
                  </h3>
                  <p style={styles.kpiNote}>Prescriptions issued</p>
                </div>
              </div>
            </div>

            {/* Total Historical Clinic Appointments */}
            <div style={styles.historicalCard}>
              <div>
                <h4 style={styles.histTitle}>Total Clinic Lifetime Consultations</h4>
                <p style={styles.histSub}>Aggregated appointments verified at this clinic branch</p>
              </div>
              <div style={styles.histNumBadge}>
                {stats.totalClinicAppointments || 0}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  topHeader: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    padding: "12px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #DBEAFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerClinic: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.01em",
  },
  headerRoleBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "500",
  },
  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
  },
  tabGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: "4px",
    borderRadius: "12px",
    gap: "4px",
  },
  tabActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#FFFFFF",
    color: "#2563EB",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    border: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  tabInactive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "#64748B",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  mainContainer: {
    flex: 1,
    padding: "28px",
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  scannerWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  scannerHeroHeader: {
    textAlign: "center",
    marginBottom: "20px",
  },
  heroTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 6px 0",
    letterSpacing: "-0.02em",
  },
  heroSub: {
    fontSize: "14px",
    color: "#64748B",
    margin: 0,
  },
  scannerBoxCard: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  cameraFrame: {
    borderRadius: "16px",
    overflow: "hidden",
    width: "100%",
    height: "min(340px, 48vh)",
    backgroundColor: "#0F172A",
    border: "2px solid #E2E8F0",
  },
  scannerPrompt: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#3B82F6",
    backgroundColor: "#EFF6FF",
    padding: "8px 14px",
    borderRadius: "20px",
    textAlign: "center",
  },
  manualEntryContainer: {
    width: "100%",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "12px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: "0.04em",
  },
  manualForm: {
    display: "flex",
    gap: "8px",
  },
  manualInput: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    fontSize: "14px",
    outline: "none",
    fontWeight: "600",
    color: "#0F172A",
  },
  manualSubmitBtn: {
    padding: "11px 20px",
    borderRadius: "12px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  manualSubmitBtnDisabled: {
    padding: "11px 20px",
    borderRadius: "12px",
    backgroundColor: "#E2E8F0",
    color: "#94A3B8",
    fontSize: "14px",
    fontWeight: "700",
    border: "none",
    cursor: "not-allowed",
    whiteSpace: "nowrap",
  },
  resultContainer: {
    width: "100%",
    maxWidth: "480px",
  },
  resultCardSuccess: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "32px 24px",
    border: "1px solid #BBF7D0",
    boxShadow: "0 10px 30px rgba(22, 163, 74, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconCircleSuccess: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#DCFCE7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  badgeSuccess: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    backgroundColor: "#ECFDF5",
    color: "#16A34A",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  resultCardWarning: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "32px 24px",
    border: "1px solid #FDE68A",
    boxShadow: "0 10px 30px rgba(217, 119, 6, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconCircleWarning: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  badgeWarning: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    backgroundColor: "#FFFBEB",
    color: "#B45309",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  warningBannerBox: {
    backgroundColor: "#FEF3C7",
    border: "1px solid #FDE68A",
    borderRadius: "12px",
    padding: "14px 18px",
    margin: "14px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  warningBannerText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#92400E",
    margin: 0,
    lineHeight: 1.5,
  },
  resultCardInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "32px 24px",
    border: "1px solid #BFDBFE",
    boxShadow: "0 10px 30px rgba(37, 99, 235, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconCircleInfo: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  badgeInfo: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  infoBannerBox: {
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "12px",
    padding: "14px 18px",
    margin: "14px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  infoBannerText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1E40AF",
    margin: 0,
  },
  resultCardDanger: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "32px 24px",
    border: "1px solid #FECACA",
    boxShadow: "0 10px 30px rgba(220, 38, 38, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconCircleDanger: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "#FEE2E2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  badgeDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  dangerBannerBox: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "12px",
    padding: "14px 18px",
    margin: "14px 0",
    width: "100%",
    boxSizing: "border-box",
  },
  dangerBannerText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#991B1B",
    margin: 0,
  },
  resultTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  resultTitleWarning: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#92400E",
    margin: "0 0 4px 0",
  },
  resultTitleDanger: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#991B1B",
    margin: "0 0 4px 0",
  },
  resultSubtitle: {
    fontSize: "14px",
    color: "#64748B",
    margin: "0 0 20px 0",
  },
  errorSubtext: {
    fontSize: "13px",
    color: "#64748B",
    margin: "0 0 20px 0",
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "24px",
    textAlign: "left",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
  },
  detailLabel: {
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: {
    color: "#0F172A",
    fontWeight: "700",
  },
  detailValueBold: {
    color: "#2563EB",
    fontWeight: "800",
    fontFamily: "monospace",
    fontSize: "14px",
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 24px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "12px",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnWarning: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 24px",
    backgroundColor: "#D97706",
    color: "#FFFFFF",
    borderRadius: "12px",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnDanger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 24px",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    borderRadius: "12px",
    border: "none",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnSecondary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: 1,
    padding: "12px 18px",
    backgroundColor: "#F1F5F9",
    color: "#334155",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    width: "100%",
  },
  queueWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  queueHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  queueActionHeader: {
    display: "flex",
    gap: "10px",
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 16px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  summaryStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  stripCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  stripLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  stripNum: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
  },
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "8px 14px",
    flex: 1,
    minWidth: "260px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: "13px",
    width: "100%",
    backgroundColor: "transparent",
  },
  filterPills: {
    display: "flex",
    gap: "6px",
  },
  filterPillActive: {
    padding: "7px 14px",
    borderRadius: "20px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
  },
  filterPillInactive: {
    padding: "7px 14px",
    borderRadius: "20px",
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    border: "1px solid #E2E8F0",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeaderRow: {
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  th: {
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  tr: {
    borderBottom: "1px solid #F1F5F9",
    transition: "background-color 0.15s",
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#334155",
  },
  emptyTd: {
    padding: "48px 16px",
    textAlign: "center",
  },
  ticketPill: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "6px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontFamily: "monospace",
    fontWeight: "700",
    fontSize: "12px",
  },
  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatarMini: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#E2E8F0",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },
  patientNameText: {
    fontWeight: "700",
    color: "#0F172A",
  },
  doctorNameText: {
    fontWeight: "600",
    color: "#475569",
  },
  timeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "600",
  },
  statusCheckedIn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
    fontSize: "12px",
    fontWeight: "700",
  },
  statusWaiting: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "20px",
    backgroundColor: "#FEF3C7",
    color: "#B45309",
    fontSize: "12px",
    fontWeight: "700",
  },
  assistantText: {
    fontSize: "12px",
    color: "#64748B",
  },
  quickCheckInBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
  },
  statsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },
  kpiCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  kpiIconWrapBlue: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconWrapGreen: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#DCFCE7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconWrapAmber: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconWrapPurple: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#F3E8FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748B",
    margin: "0 0 6px 0",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  kpiValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
    letterSpacing: "-0.02em",
  },
  kpiNote: {
    fontSize: "12px",
    color: "#94A3B8",
    margin: 0,
  },
  historicalCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  histTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  histSub: {
    fontSize: "13px",
    color: "#64748B",
    margin: 0,
  },
  histNumBadge: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#2563EB",
    fontFamily: "monospace",
  },
};
