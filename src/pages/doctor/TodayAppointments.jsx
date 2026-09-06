import React, { useEffect, useState, useMemo, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalDateString } from "../../utils/dateUtils";

const TodayAppointments = ({ onViewHistory, isLoadingHistory }) => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppts, setFilteredAppts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState("");
  const dateInputRef = useRef(null);

  const [completeModal, setCompleteModal] = useState({ show: false, id: null });
  const [cancelModal, setCancelModal] = useState({ show: false, id: null });
  const [inputText, setInputText] = useState("");

  // Generate next 10 days for minimal date strip (Timezone-safe: local date and ISO match 100%)
  const quickDates = useMemo(() => {
    const dates = [];
    const base = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = getLocalDateString(d);
      const dayName = i === 0 ? "TODAY" : d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      const dayNum = d.getDate();
      dates.push({ iso, dayName, monthName, dayNum });
    }
    return dates;
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredAppts(appointments);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredAppts(
        appointments.filter(
          (a) =>
            a.userName?.toLowerCase().includes(lower) ||
            (a.ticketId && a.ticketId.toLowerCase().includes(lower))
        )
      );
    }
  }, [searchTerm, appointments]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/doctor/appointments`, {
        params: { date: selectedDate }
      });
      setAppointments(res.data || []);
      setFilteredAppts(res.data || []);
    } catch (error) {
      toast.error("Failed to sync appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completeModal.id) return;
    try {
      await api.put(`/api/doctor/appointments/${completeModal.id}/complete`, inputText, {
        headers: { "Content-Type": "text/plain" }
      });
      toast.success("Prescription Sent & Visit Completed!");
      setCompleteModal({ show: false, id: null });
      fetchAppointments();
    } catch (error) {
      toast.error("Failed to complete appointment");
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelModal.id) return;
    if (!inputText.trim()) return toast.error("Cancellation reason is required");

    try {
      await api.put(`/api/doctor/appointments/${cancelModal.id}/cancel`, inputText, {
        headers: { "Content-Type": "text/plain" }
      });
      toast.success("Appointment Cancelled");
      setCancelModal({ show: false, id: null });
      fetchAppointments();
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  };

  const openNativeDatePicker = () => {
    if (dateInputRef.current) {
      if (dateInputRef.current.showPicker) {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.headerBar}>
        <div style={styles.headerTitleRow}>
          <div style={styles.titleGroup}>
            <h2 style={styles.headerTitle}>Consultation Queue</h2>
            <span style={styles.countBadge}>{filteredAppts.length} Patients</span>
          </div>
          <span style={styles.headerSubInline}>Manage today's consultations, digital prescriptions, and patient history.</span>
        </div>

        {/* Minimal Modern Search Bar with SVG Icon */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" style={styles.searchIcon}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by patient name or Ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.minimalSearchInput}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                style={styles.clearSearchBtn}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Date Strip with 1st Box = Custom Date Button */}
        <div style={styles.minimalDateStrip}>
          {/* Box 1: Custom Date Selector Button */}
          <div style={styles.customDateBox} onClick={openNativeDatePicker} title="Select Custom Date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginBottom: "2px" }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
            </svg>
            <span style={styles.customDateText}>Date</span>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.hiddenNativeInput}
            />
          </div>

          {/* Quick Date Pills */}
          {quickDates.map((item) => {
            const isSelected = selectedDate === item.iso;
            return (
              <button
                key={item.iso}
                onClick={() => setSelectedDate(item.iso)}
                style={isSelected ? styles.miniDatePillActive : styles.miniDatePill}
              >
                <span style={isSelected ? styles.miniDayActive : styles.miniDay}>{item.dayName}</span>
                <span style={isSelected ? styles.miniNumActive : styles.miniNum}>{item.dayNum}</span>
                <span style={isSelected ? styles.miniMonthActive : styles.miniMonth}>{item.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient Queue Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: "#64748B", fontSize: "14px", fontWeight: "600" }}>Loading schedule...</p>
        </div>
      ) : filteredAppts.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIconBox}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>No Appointments Scheduled</h3>
          <p style={styles.emptySub}>No patient bookings found for {selectedDate}. Choose another date above.</p>
        </div>
      ) : (
        <div style={styles.cardList}>
          {filteredAppts.map((appt) => (
            <div key={appt.appointmentId} className="doctor-appointment-card" style={styles.apptCard}>
              {/* Column 1: Time Pill */}
              <div className="appt-time-col" style={styles.timePill}>
                <span style={styles.timeVal}>
                  {appt.startTime ? appt.startTime.substring(0, 5) : "--:--"}
                </span>
                <span style={styles.timeEndVal}>
                  {appt.endTime ? appt.endTime.substring(0, 5) : ""}
                </span>
              </div>

              {/* Column 2: Patient Info */}
              <div className="appt-info-col" style={styles.patientInfoCol}>
                <div style={styles.patientNameRow}>
                  <h3 style={styles.patientName}>{appt.userName || "Patient"}</h3>
                  <span style={styles.ticketPill}>
                    #{appt.ticketId ? appt.ticketId.substring(0, 8) : "N/A"}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>

                {appt.prescription ? (
                  <p style={styles.prescriptionText}>
                    <strong style={{ color: "#2563EB" }}>Prescription:</strong> {appt.prescription}
                  </p>
                ) : (
                  <p style={styles.waitingText}>
                    <span style={styles.waitingDot}></span>
                    Waiting for consultation
                  </p>
                )}
              </div>

              {/* Column 3: Action Buttons */}
              <div className="appt-actions-col" style={styles.actionGroup}>
                <button
                  onClick={() => {
                    if (appt.userId) {
                      onViewHistory(appt.userId, appt.userName);
                    } else {
                      toast.error("Patient ID missing");
                    }
                  }}
                  style={styles.historyBtn}
                  title="View Medical History"
                  disabled={isLoadingHistory}
                >
                  📜 History
                </button>

                {(appt.status === "BOOKED" || appt.status === "RESCHEDULED") && (
                  <>
                    <button
                      style={styles.completeBtn}
                      onClick={() => {
                        setInputText("");
                        setCompleteModal({ show: true, id: appt.appointmentId });
                      }}
                    >
                      ✓ Complete
                    </button>

                    <button
                      style={styles.cancelBtn}
                      onClick={() => {
                        setInputText("");
                        setCancelModal({ show: true, id: appt.appointmentId });
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription / Cancellation Modals */}
      <AnimatePresence>
        {(completeModal.show || cancelModal.show) && (
          <div
            style={styles.modalOverlay}
            onClick={() => {
              setCompleteModal({ show: false, id: null });
              setCancelModal({ show: false, id: null });
            }}
          >
            <motion.div
              style={styles.modalCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {completeModal.show ? (
                <>
                  <h3 style={styles.modalTitle}>Write Prescription & Notes</h3>
                  <textarea
                    style={styles.modalTextarea}
                    placeholder="Enter diagnosis notes and prescription details..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div style={styles.modalActionRow}>
                    <button style={styles.modalCloseBtn} onClick={() => setCompleteModal({ show: false, id: null })}>
                      Close
                    </button>
                    <button style={styles.modalSubmitBtn} onClick={handleCompleteSubmit}>
                      Save & Complete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ ...styles.modalTitle, color: "#dc2626" }}>Cancel Appointment</h3>
                  <textarea
                    style={{ ...styles.modalTextarea, borderColor: "#fca5a5" }}
                    placeholder="Reason for cancellation..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div style={styles.modalActionRow}>
                    <button style={styles.modalCloseBtn} onClick={() => setCompleteModal({ show: false, id: null })}>
                      Keep Appointment
                    </button>
                    <button style={styles.modalDangerBtn} onClick={handleCancelSubmit}>
                      Confirm Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let style = styles.badgeBooked;
  if (status === "COMPLETED") style = styles.badgeCompleted;
  else if (status === "CANCELLED") style = styles.badgeCancelled;
  else if (status === "RESCHEDULED") style = styles.badgeRescheduled;

  return <span style={style}>{status}</span>;
};

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  headerBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "20px 24px",
    border: "1px solid #E2E8F0",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
    whiteSpace: "nowrap",
  },
  countBadge: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontSize: "11px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "9999px",
    border: "1px solid #DBEAFE",
    whiteSpace: "nowrap",
  },
  headerSubInline: {
    fontSize: "12.5px",
    color: "#64748B",
  },

  // Minimal Modern Search Input with Icon
  searchContainer: {
    marginBottom: "16px",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    pointerEvents: "none",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#64748B",
    cursor: "pointer",
    fontSize: "12px",
    padding: "4px 8px",
  },
  minimalSearchInput: {
    width: "100%",
    padding: "11px 36px 11px 40px",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#F8FAFC",
    fontSize: "13.5px",
    outline: "none",
    color: "#0F172A",
    boxSizing: "border-box",
    transition: "border-color 0.15s, background-color 0.15s",
  },

  // Minimal Horizontal Date Strip
  minimalDateStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none",
  },

  // Box 1: Custom Date Selector Pill
  customDateBox: {
    flex: "0 0 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 4px",
    borderRadius: "12px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #2563EB",
    cursor: "pointer",
    position: "relative",
  },
  customDateIcon: {
    fontSize: "13px",
    marginBottom: "1px",
  },
  customDateText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#2563eb",
  },
  hiddenNativeInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    cursor: "pointer",
  },

  // Quick Date Pills
  miniDatePill: {
    flex: "0 0 50px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 2px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
  },
  miniDatePillActive: {
    flex: "0 0 50px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 2px",
    borderRadius: "10px",
    backgroundColor: "#2563eb",
    border: "1px solid #2563eb",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)",
  },
  miniDay: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#64748b",
  },
  miniDayActive: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#ffffff",
  },
  miniNum: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  miniNumActive: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#ffffff",
  },
  miniMonth: {
    fontSize: "9px",
    fontWeight: "600",
    color: "#94a3b8",
  },
  miniMonthActive: {
    fontSize: "9px",
    fontWeight: "600",
    color: "#ffffff",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: "48px 24px",
    borderRadius: "20px",
    border: "1px dashed #CBD5E1",
    textAlign: "center",
  },
  emptyIconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    backgroundColor: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px auto",
  },
  emptyTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySub: {
    margin: 0,
    fontSize: "13px",
    color: "#64748B",
  },

  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  apptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "16px 20px",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
    transition: "all 0.15s ease",
  },

  timePill: {
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    borderRadius: "12px",
    padding: "8px 14px",
    textAlign: "center",
    minWidth: "75px",
    flexShrink: 0,
  },
  timeVal: {
    display: "block",
    fontSize: "15px",
    fontWeight: "800",
    color: "#2563EB",
  },
  timeEndVal: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
  },

  patientInfoCol: {
    flex: "1 1 220px",
  },
  patientNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "4px",
  },
  patientName: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
  },
  ticketPill: {
    fontSize: "11px",
    color: "#475569",
    backgroundColor: "#F1F5F9",
    padding: "2px 6px",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontWeight: "600",
  },
  prescriptionText: {
    margin: 0,
    fontSize: "13px",
    color: "#334155",
    lineHeight: "1.4",
  },
  waitingText: {
    margin: 0,
    fontSize: "12.5px",
    color: "#64748B",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
  },
  waitingDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#D97706",
    marginRight: "6px",
  },

  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  historyBtn: {
    padding: "8px 14px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  completeBtn: {
    padding: "8px 16px",
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
    transition: "all 0.15s ease",
  },
  cancelBtn: {
    padding: "8px 14px",
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  // BADGES
  badgeBooked: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeCompleted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeCancelled: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeRescheduled: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },

  // MODAL
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1500,
    padding: "16px",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    width: "90%",
    maxWidth: "450px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  modalTextarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "16px",
    fontFamily: "inherit",
  },
  modalActionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  modalCloseBtn: {
    padding: "8px 14px",
    backgroundColor: "transparent",
    color: "#64748b",
    border: "none",
    fontSize: "13px",
    cursor: "pointer",
  },
  modalSubmitBtn: {
    padding: "9px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalDangerBtn: {
    padding: "9px 16px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default TodayAppointments;