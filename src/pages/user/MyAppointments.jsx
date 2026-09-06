import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import api from "../../api/api";
import toast from "react-hot-toast"; 
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CustomDatePicker from "../../components/CustomDatePicker";
import { formatDoctorName } from "../../utils/formatDoctorName";
import { getDoctorPortrait } from "../../utils/doctorAvatars";
import AppointmentReceipt from "./AppointmentReceipt";
import CancelReasonDropdown from "../../components/CancelReasonDropdown";

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingReceiptAppt, setViewingReceiptAppt] = useState(null);
  const [filterTab, setFilterTab] = useState("ALL");

  // --- Reschedule State ---
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlot, setNewSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- Prescription State ---
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [selectedPrescriptionAppt, setSelectedPrescriptionAppt] = useState(null);
  const prescriptionRef = useRef();

  // --- Cancel Modal State ---
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [apptToCancel, setApptToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const cancellationReasons = [
    "I am busy on that date",
    "I will go to a nearby hospital",
    "Health issue resolved",
    "Doctor unavailable",
    "Found a better slot",
    "Other"
  ];

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/appointments/my");
      setAppointments(res.data || []);
    } catch (err) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Lock background body scroll cleanly whenever any sheet or modal is active
  const isAnySheetOpen = Boolean(cancelModalOpen || rescheduleModalOpen || prescriptionModalOpen || viewingReceiptAppt);
  useEffect(() => {
    if (isAnySheetOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnySheetOpen]);

  // --- 1. Cancellation Logic ---
  const initiateCancel = (appt) => {
    setApptToCancel(appt);
    setCancelReason(""); 
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason) {
      toast.error("Please select a reason");
      return;
    }
    try {
      await api.put(`/api/appointments/${apptToCancel.appointmentId}/cancel`, cancelReason, {
        headers: { 'Content-Type': 'text/plain' }
      });
      toast.success("Appointment Cancelled");
      setCancelModalOpen(false);
      loadAppointments();
    } catch (err) {
      toast.error("Failed to cancel appointment");
    }
  };

  // --- 2. Reschedule Logic ---
  const openRescheduleModal = (appt) => {
    setSelectedAppt(appt);
    setNewDate("");
    setAvailableSlots([]);
    setNewSlot(null);
    setRescheduleModalOpen(true);
  };

  const handleDateChange = async (selectedIso) => {
    const date = typeof selectedIso === 'string' ? selectedIso : selectedIso.target.value;
    setNewDate(date);
    setNewSlot(null);
    
    if (!date || !selectedAppt?.doctorId) return;

    setLoadingSlots(true);
    try {
      const res = await api.get("/api/reschedule/slots", {
        params: {
          appointmentId: selectedAppt.appointmentId,
          doctorId: selectedAppt.doctorId,
          date: date
        }
      });
      setAvailableSlots(res.data.slots || []);
    } catch (err) {
      toast.error("Could not fetch slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!newDate || !newSlot) return;
    const toastId = toast.loading("Rescheduling & generating new pass...");
    try {
      const res = await api.put(`/api/reschedule/${selectedAppt.appointmentId}`, {
        newDate,
        startTime: newSlot.startTime.substring(0, 5),
        endTime: newSlot.endTime.substring(0, 5)
      });
      const newTicketId = res.data?.ticketId;
      const shortId = newTicketId && newTicketId.length >= 8 ? newTicketId.substring(0, 8) : (newTicketId || "");
      toast.success(shortId ? `Rescheduled! New Ticket #${shortId} & QR sent to email 📧` : "Rescheduled Successfully!", { id: toastId });
      setRescheduleModalOpen(false);
      loadAppointments();
    } catch {
      toast.error("Reschedule Failed", { id: toastId });
    }
  };

  // --- 3. Prescription Logic ---
  const openPrescriptionModal = (appt) => {
    setSelectedPrescriptionAppt(appt);
    setPrescriptionModalOpen(true);
  };

  const downloadPDF = async () => {
    const element = prescriptionRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const data = canvas.toDataURL("image/png");
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Prescription-${selectedPrescriptionAppt.ticketId || 'record'}.pdf`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "BOOKED":
        return <span style={{ ...styles.statusBadge, background: "#EFF6FF", color: "#2563EB" }}>● Confirmed</span>;
      case "COMPLETED":
        return <span style={{ ...styles.statusBadge, background: "#DCFCE7", color: "#166534" }}>✓ Completed</span>;
      case "CANCELLED":
        return <span style={{ ...styles.statusBadge, background: "#FEE2E2", color: "#DC2626" }}>✕ Cancelled</span>;
      case "RESCHEDULED":
        return <span style={{ ...styles.statusBadge, background: "#FEF3C7", color: "#D97706" }}>↻ Rescheduled</span>;
      default:
        return <span style={{ ...styles.statusBadge, background: "#F1F5F9", color: "#64748B" }}>{status}</span>;
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterTab === "ALL") return true;
    if (filterTab === "UPCOMING") return a.status === "BOOKED" || a.status === "RESCHEDULED";
    if (filterTab === "COMPLETED") return a.status === "COMPLETED";
    if (filterTab === "CANCELLED") return a.status === "CANCELLED";
    return true;
  });

  const counts = {
    ALL: appointments.length,
    UPCOMING: appointments.filter(a => a.status === "BOOKED" || a.status === "RESCHEDULED").length,
    COMPLETED: appointments.filter(a => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter(a => a.status === "CANCELLED").length,
  };

  return (
    <div className="schedule-page-container" style={styles.container}>
      {/* Fixed Sticky Header with Top Breathing Spacing */}
      <div className="schedule-sticky-header">
        <div style={styles.headerTopRow}>
          <div>
            <h2 style={styles.title}>Consultation Schedule</h2>
            <p style={styles.subtitle}>Track your upcoming visits, passes, and prescriptions</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.94 }}
            style={styles.refreshBtn} 
            onClick={loadAppointments} 
            title="Refresh Appointments"
          >
            ↻ Sync
          </motion.button>
        </div>

        {/* Filter Pills Strip */}
        <div style={styles.filterStrip}>
          {[
            { id: "ALL", label: "All" },
            { id: "UPCOMING", label: "Upcoming" },
            { id: "COMPLETED", label: "Completed" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                style={isActive ? styles.filterTabActive : styles.filterTabInactive}
              >
                <span>{tab.label}</span>
                <span style={isActive ? styles.filterCountActive : styles.filterCountInactive}>
                  {counts[tab.id] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748B", fontSize: "14px" }}>
          Loading your appointments...
        </div>
      )}

      {!loading && filteredAppointments.length === 0 && (
        <div className="glass-card" style={styles.emptyCard}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0F172A" }}>
            {filterTab === "ALL" ? "No Consultations Found" : `No ${filterTab.toLowerCase()} consultations`}
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
            {filterTab === "ALL" 
              ? "You haven't booked any doctor visits yet." 
              : `You have no consultations marked as ${filterTab.toLowerCase()}.`}
          </p>
        </div>
      )}

      {/* Appointment Cards List / Grid */}
      <div className="schedule-cards-grid">
        {filteredAppointments.map((a) => (
          <motion.div 
            key={a.appointmentId} 
            whileHover={{ y: -2 }}
            className="glass-card schedule-card-desktop" 
            style={styles.card}
          >
            <div>
              <div style={styles.cardTopRow}>
                <div style={styles.docRow}>
                  <div style={styles.docAvatar}>
                    <img 
                      src={getDoctorPortrait(a.doctorId, a.doctorName)} 
                      alt={a.doctorName} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h4 style={styles.docName}>{formatDoctorName(a.doctorName)}</h4>
                    <span 
                      style={{ ...styles.ticketTag, cursor: "pointer" }} 
                      onClick={() => setViewingReceiptAppt(a)}
                      title="Click to view full pass"
                    >
                      Ticket #{a.ticketId ? a.ticketId.substring(0, 8) : 'TCK'} ↗
                    </span>
                  </div>
                </div>

                {getStatusBadge(a.status)}
              </div>

              <div style={styles.detailsBox}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Date</span>
                  <span style={styles.detailVal}>{a.date}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Time</span>
                  <span style={styles.detailVal}>{(a.startTime || "").substring(0, 5)} - {(a.endTime || "---").substring(0, 5)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actionsRow}>
              {(a.status === "BOOKED" || a.status === "RESCHEDULED") && (
                <>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    style={styles.btnPass} 
                    onClick={() => setViewingReceiptAppt(a)}
                  >
                    View Pass 🎟️
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    style={styles.btnCancel} 
                    onClick={() => initiateCancel(a)}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    style={styles.btnReschedule} 
                    onClick={() => openRescheduleModal(a)}
                  >
                    Reschedule ↻
                  </motion.button>
                </>
              )}
              {(a.status === "COMPLETED" || a.prescription) && (
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  style={styles.btnPrescription} 
                  onClick={() => openPrescriptionModal(a)}
                >
                  📄 View Digital Prescription
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- CANCEL BOTTOM SHEET (SLIDE UP 75%) --- */}
      {createPortal(
        <AnimatePresence>
          {cancelModalOpen && (
            <div 
              style={styles.sheetOverlay} 
              onClick={() => setCancelModalOpen(false)}
            >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={styles.bottomSheetCancel} 
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div style={styles.sheetHandleRow} onClick={() => setCancelModalOpen(false)}>
                <div style={styles.sheetDragPill}></div>
              </div>

              <div style={styles.sheetBody}>
                <div style={{ textAlign: "center", margin: "4px 0 16px 0" }}>
                  <div style={{ fontSize: "34px", marginBottom: "6px" }}>⚠️</div>
                  <h3 style={styles.modalTitle}>Cancel Appointment?</h3>
                  <p style={styles.modalSub}>
                    Please confirm why you are cancelling with <strong>{formatDoctorName(apptToCancel?.doctorName)}</strong>.
                  </p>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={styles.fieldLabel}>Reason for Cancellation:</label>
                  <CancelReasonDropdown 
                    value={cancelReason} 
                    onChange={(val) => setCancelReason(val)}
                  />
                </div>

                {/* Consultation Details Summary */}
                {apptToCancel && (
                  <div style={{ backgroundColor: "#F8FAFC", borderRadius: "14px", padding: "14px", border: "1px solid #E2E8F0", fontSize: "13px", color: "#475569" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Doctor:</span>
                      <strong style={{ color: "#0F172A" }}>{formatDoctorName(apptToCancel.doctorName)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span>Date & Time:</span>
                      <strong style={{ color: "#0F172A" }}>{apptToCancel.date} &bull; {apptToCancel.startTime ? apptToCancel.startTime.substring(0, 5) : "--:--"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Ticket ID:</span>
                      <span style={{ fontFamily: "monospace", color: "#2563EB", fontWeight: "700" }}>#{apptToCancel.ticketId ? apptToCancel.ticketId.substring(0, 8) : "HC"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.sheetStickyBottom}>
                <button onClick={() => setCancelModalOpen(false)} style={styles.modalCancelPill}>
                  Keep Appointment
                </button>
                <button onClick={handleConfirmCancel} style={styles.modalDangerPill}>
                  Confirm Cancellation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* --- RESCHEDULE BOTTOM SHEET (SLIDE UP 75% HEIGHT) --- */}
      {createPortal(
        <AnimatePresence>
          {rescheduleModalOpen && (
            <div 
              style={styles.sheetOverlay} 
              onClick={() => setRescheduleModalOpen(false)}
            >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={styles.bottomSheet75} 
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div style={styles.sheetHandleRow} onClick={() => setRescheduleModalOpen(false)}>
                <div style={styles.sheetDragPill}></div>
              </div>

              <div style={styles.sheetTopNav}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>↻</span>
                  <h3 style={styles.sheetTitle}>Reschedule Consultation</h3>
                </div>
                <button 
                  onClick={() => setRescheduleModalOpen(false)} 
                  style={styles.sheetCloseBtn}
                  title="Close sheet"
                >
                  ✕
                </button>
              </div>

              <div style={styles.sheetBody}>
                <p style={styles.modalSub}>Pick a new date and available slot. A new QR code & pass will be issued.</p>

                <CustomDatePicker
                  selectedDate={newDate}
                  onChange={handleDateChange}
                />

                {newDate && (
                  <div style={{ margin: "18px 0" }}>
                    <label style={styles.fieldLabel}>Available Slots for {newDate}:</label>
                    {loadingSlots ? (
                      <p style={{ fontSize: '12px', color: '#64748B', textAlign: "center", padding: "14px 0" }}>
                        Checking doctor schedule...
                      </p>
                    ) : (
                      <div style={styles.slotsGrid}>
                        {availableSlots.length > 0 ? availableSlots.map((slot, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setNewSlot(slot)} 
                            style={newSlot === slot ? styles.slotActive : styles.slotNormal}
                          >
                            {slot.startTime.substring(0, 5)}
                          </button>
                        )) : (
                          <p style={{ fontSize: '12px', color: '#DC2626', gridColumn: "1 / -1", textAlign: "center", padding: "12px 0" }}>
                            No slots available on this date. Please pick another date.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={styles.sheetStickyBottom}>
                <button onClick={() => setRescheduleModalOpen(false)} style={styles.modalCancelPill}>
                  Dismiss
                </button>
                <button 
                  onClick={handleConfirmReschedule} 
                  disabled={!newSlot} 
                  style={newSlot ? styles.modalConfirmPill : styles.modalDisabledPill}
                >
                  Confirm Reschedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* --- PRESCRIPTION BOTTOM SHEET (SLIDE UP 75% HEIGHT) --- */}
      {createPortal(
        <AnimatePresence>
          {prescriptionModalOpen && selectedPrescriptionAppt && (
            <div 
              style={styles.sheetOverlay} 
              onClick={() => setPrescriptionModalOpen(false)}
            >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={styles.bottomSheetRx} 
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div style={styles.sheetHandleRow} onClick={() => setPrescriptionModalOpen(false)}>
                <div style={styles.sheetDragPill}></div>
              </div>

              {/* Sheet Top Nav */}
              <div style={styles.sheetTopNav}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>📄</span>
                  <h3 style={styles.sheetTitle}>Digital Medical Prescription</h3>
                </div>
                <button 
                  onClick={() => setPrescriptionModalOpen(false)} 
                  style={styles.sheetCloseBtn}
                  title="Close sheet"
                >
                  ✕
                </button>
              </div>

              <div style={styles.sheetBody}>
                <div ref={prescriptionRef} style={styles.rxContainer}>
                  <div style={styles.rxHeader}>
                    <div>
                      <h3 style={{ margin: 0, color: '#2563EB', fontSize: '18px', fontWeight: '800' }}>HealthConnect Rx</h3>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>Verified Digital Medical Prescription</span>
                    </div>
                    <span style={{ padding: "4px 10px", backgroundColor: "#EFF6FF", color: "#2563EB", borderRadius: "9999px", fontSize: "11px", fontWeight: "700" }}>
                      AUTHENTICATED
                    </span>
                  </div>
                  <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: '14px 0' }} />
                  
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#64748B" }}>Doctor:</span>
                      <strong style={{ color: "#0F172A" }}>{formatDoctorName(selectedPrescriptionAppt.doctorName)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#64748B" }}>Consultation for:</span>
                      <strong style={{ color: "#0F172A" }}>{selectedPrescriptionAppt.userName || localStorage.getItem("userName") || "Alex"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ color: "#64748B" }}>Date:</span>
                      <strong style={{ color: "#0F172A" }}>{selectedPrescriptionAppt.date}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ color: "#64748B" }}>Ticket ID:</span>
                      <span style={{ fontFamily: "monospace", color: "#2563EB", fontWeight: "700" }}>{selectedPrescriptionAppt.ticketId}</span>
                    </div>

                    <div style={{ marginTop: '14px', padding: '14px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                      <p style={{ fontWeight: '700', marginBottom: '6px', color: '#0F172A', fontSize: "12.5px" }}>Clinical Advice & Prescribed Medicines:</p>
                      <p style={{ color: '#334155', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                        "{selectedPrescriptionAppt.prescription || "Standard recovery instructions provided during consultation."}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.sheetStickyBottom}>
                <button onClick={() => setPrescriptionModalOpen(false)} style={styles.modalCancelPill}>
                  Close
                </button>
                <button onClick={downloadPDF} style={styles.modalConfirmPill}>
                  📥 Download PDF Rx
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* --- CONSULTATION PASS MODAL --- */}
      <AnimatePresence>
        {viewingReceiptAppt && (
          <AppointmentReceipt
            appointment={viewingReceiptAppt}
            onClose={() => setViewingReceiptAppt(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    margin: "0 auto",
  },
  headerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  filterStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none",
  },
  filterTabActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    padding: "6px 14px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(59, 130, 246, 0.35)",
    whiteSpace: "nowrap",
  },
  filterTabInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--input-bg, #FFFFFF)",
    color: "#64748B",
    padding: "6px 14px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #E2E8F0",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "#FFFFFF",
    padding: "1px 6px",
    borderRadius: "9999px",
    fontSize: "10px",
    fontWeight: "800",
  },
  filterCountInactive: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    padding: "1px 6px",
    borderRadius: "9999px",
    fontSize: "10px",
    fontWeight: "700",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748B",
    margin: "4px 0 0 0",
  },
  refreshBtn: {
    backgroundColor: "var(--card-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(10px))",
    WebkitBackdropFilter: "var(--card-blur, blur(10px))",
    color: "#3B82F6",
    border: "var(--card-border, 1px solid #E2E8F0)",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "var(--card-shadow, 0 2px 6px rgba(15, 23, 42, 0.03))",
  },
  emptyCard: {
    padding: "40px 20px",
    textAlign: "center",
    margin: "20px 0",
  },
  listGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  card: {
    padding: "18px",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  docRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  docAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
    border: "2px solid #FFFFFF",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
  },
  docName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  ticketTag: {
    fontSize: "11px",
    color: "#64748B",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "9999px",
  },
  detailsBox: {
    display: "flex",
    gap: "16px",
    backgroundColor: "var(--input-bg, #F8FAFC)",
    border: "var(--card-border, 1px solid #E2E8F0)",
    padding: "12px 16px",
    borderRadius: "14px",
    marginBottom: "14px",
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    display: "block",
  },
  detailVal: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "6px",
    flexWrap: "wrap",
  },
  btnCancel: {
    flex: 1,
    minWidth: "75px",
    padding: "7px 12px",
    borderRadius: "9999px",
    backgroundColor: "var(--card-bg, #FFFFFF)",
    color: "#DC2626",
    border: "1px solid #FECACA",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.15s ease",
  },
  btnReschedule: {
    flex: 1,
    minWidth: "100px",
    padding: "7px 14px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 2px 6px rgba(59, 130, 246, 0.25)",
    textAlign: "center",
    transition: "all 0.15s ease",
  },
  btnPass: {
    padding: "7px 14px",
    borderRadius: "9999px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    color: "#2563EB",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.15s ease",
  },
  btnPrescription: {
    width: "100%",
    padding: "10px",
    borderRadius: "9999px",
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(22, 163, 74, 0.3)",
  },

  // Modals & 75% Bottom Sheets
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "16px",
  },
  sheetOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    zIndex: 999999,
  },
  bottomSheet75: {
    backgroundColor: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    width: "100%",
    maxWidth: "100%",
    height: "75vh",
    maxHeight: "75vh",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.22)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  bottomSheetCancel: {
    backgroundColor: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    width: "100%",
    maxWidth: "100%",
    maxHeight: "75vh",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.22)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  bottomSheetRx: {
    backgroundColor: "#FFFFFF",
    borderRadius: "28px 28px 0 0",
    width: "100%",
    maxWidth: "100%",
    height: "75vh",
    maxHeight: "75vh",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.22)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  sheetTopNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 20px 12px",
    borderBottom: "1px solid #F1F5F9",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  sheetTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  sheetCloseBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "700",
  },
  sheetHandleRow: {
    width: "100%",
    padding: "14px 0 8px 0",
    display: "flex",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  sheetDragPill: {
    width: "44px",
    height: "5px",
    borderRadius: "9999px",
    backgroundColor: "#CBD5E1",
  },
  sheetBody: {
    padding: "10px 24px 20px 24px",
    overflowY: "auto",
    overscrollBehavior: "contain",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
    touchAction: "pan-y",
    flex: 1,
  },
  sheetStickyBottom: {
    padding: "16px 24px",
    borderTop: "1px solid #F1F5F9",
    backgroundColor: "#FFFFFF",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexShrink: 0,
  },
  modal: {
    backgroundColor: "var(--card-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(24px))",
    WebkitBackdropFilter: "var(--card-blur, blur(24px))",
    borderRadius: "24px",
    padding: "24px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "var(--card-shadow, 0 25px 50px rgba(15, 23, 42, 0.15))",
    border: "var(--card-border, 1px solid rgba(226, 232, 240, 0.9))",
  },
  modalTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 6px 0",
  },
  modalSub: {
    fontSize: "13px",
    color: "#64748B",
    margin: "0 0 16px 0",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#0F172A",
    display: "block",
    marginBottom: "6px",
  },
  selectInput: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "var(--card-border, 1px solid #CBD5E1)",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "var(--input-bg, #F8FAFC)",
    color: "var(--text-primary, #0F172A)",
  },
  modalBtns: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },
  modalCancelPill: {
    flex: 1,
    padding: "11px",
    borderRadius: "9999px",
    backgroundColor: "var(--input-bg, #FFFFFF)",
    color: "#64748B",
    border: "var(--card-border, 1px solid #CBD5E1)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalDangerPill: {
    flex: 1,
    padding: "11px",
    borderRadius: "9999px",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
  },
  modalConfirmPill: {
    flex: 1,
    padding: "11px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
  },
  modalDisabledPill: {
    flex: 1,
    padding: "11px",
    borderRadius: "9999px",
    backgroundColor: "#CBD5E1",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "not-allowed",
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  slotNormal: {
    padding: "9px 6px",
    borderRadius: "9999px",
    backgroundColor: "var(--input-bg, #F8FAFC)",
    border: "var(--card-border, 1px solid #E2E8F0)",
    backdropFilter: "var(--card-blur, blur(8px))",
    WebkitBackdropFilter: "var(--card-blur, blur(8px))",
    color: "#334155",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
  },
  slotActive: {
    padding: "9px 6px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center",
  },
  rxContainer: {
    backgroundColor: "var(--card-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(16px))",
    WebkitBackdropFilter: "var(--card-blur, blur(16px))",
    borderRadius: "16px",
    border: "var(--card-border, 1px solid #E2E8F0)",
    padding: "16px",
  },
  rxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default MyAppointments;