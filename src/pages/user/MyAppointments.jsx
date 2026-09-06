import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast"; 
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CustomDatePicker from "../../components/CustomDatePicker";
import { formatDoctorName } from "../../utils/formatDoctorName";
import { getDoctorPortrait } from "../../utils/doctorAvatars";
import AppointmentReceipt from "./AppointmentReceipt";

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingReceiptAppt, setViewingReceiptAppt] = useState(null);

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
    const toastId = toast.loading("Rescheduling...");
    try {
      await api.put(`/api/reschedule/${selectedAppt.appointmentId}`, {
        newDate,
        startTime: newSlot.startTime.substring(0, 5),
        endTime: newSlot.endTime.substring(0, 5)
      });
      toast.success("Rescheduled Successfully!", { id: toastId });
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Consultation Schedule</h2>
          <p style={styles.subtitle}>Track your upcoming visits and past prescriptions</p>
        </div>
        <button style={styles.refreshBtn} onClick={loadAppointments} title="Refresh Appointments">
          ↻ Sync
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748B", fontSize: "14px" }}>
          Loading your appointments...
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <div className="glass-card" style={styles.emptyCard}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
          <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0F172A" }}>No Consultations Found</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>You haven't booked any doctor visits yet.</p>
        </div>
      )}

      {/* Appointment Cards List */}
      <div style={styles.listGrid}>
        {appointments.map((a) => (
          <motion.div 
            key={a.appointmentId} 
            whileHover={{ y: -2 }}
            className="glass-card" 
            style={styles.card}
          >
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
                <span style={styles.detailVal}>{a.startTime} - {a.endTime || '---'}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={styles.actionsRow}>
              {(a.status === "BOOKED" || a.status === "RESCHEDULED") && (
                <>
                  <button style={styles.btnPass} onClick={() => setViewingReceiptAppt(a)}>
                    View Pass 🎟️
                  </button>
                  <button style={styles.btnCancel} onClick={() => initiateCancel(a)}>
                    Cancel
                  </button>
                  <button style={styles.btnReschedule} onClick={() => openRescheduleModal(a)}>
                    Reschedule
                  </button>
                </>
              )}
              {a.status === "COMPLETED" && (
                <button style={styles.btnPrescription} onClick={() => openPrescriptionModal(a)}>
                  📄 View Digital Prescription
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- CANCEL MODAL --- */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div style={styles.overlay} onClick={() => setCancelModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              style={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>Cancel Appointment 🚫</h3>
              <p style={styles.modalSub}>
                Please confirm why you are cancelling with {formatDoctorName(apptToCancel?.doctorName)}.
              </p>

              <div style={{ marginBottom: "20px" }}>
                <label style={styles.fieldLabel}>Reason for Cancellation:</label>
                <select 
                  style={styles.selectInput} 
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">-- Select a Reason --</option>
                  {cancellationReasons.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={styles.modalBtns}>
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
      </AnimatePresence>

      {/* --- RESCHEDULE MODAL --- */}
      <AnimatePresence>
        {rescheduleModalOpen && (
          <div style={styles.overlay} onClick={() => setRescheduleModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              style={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>Reschedule Consultation</h3>
              <p style={styles.modalSub}>Pick a new date and available slot.</p>

              <CustomDatePicker
                selectedDate={newDate}
                onChange={handleDateChange}
              />

              {newDate && (
                <div style={{ margin: "18px 0" }}>
                  <label style={styles.fieldLabel}>Available Slots for {newDate}:</label>
                  {loadingSlots ? (
                    <p style={{ fontSize: '12px', color: '#64748B' }}>Loading slots...</p>
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
                        <p style={{ fontSize: '12px', color: '#DC2626' }}>No slots available on this date.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={styles.modalBtns}>
                <button onClick={() => setRescheduleModalOpen(false)} style={styles.modalCancelPill}>
                  Cancel
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
      </AnimatePresence>

      {/* --- PRESCRIPTION MODAL --- */}
      <AnimatePresence>
        {prescriptionModalOpen && selectedPrescriptionAppt && (
          <div style={styles.overlay} onClick={() => setPrescriptionModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              style={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <div ref={prescriptionRef} style={styles.rxContainer}>
                <div style={styles.rxHeader}>
                  <h3 style={{ margin: 0, color: '#3B82F6', fontSize: '18px', fontWeight: '800' }}>HealthConnect Rx</h3>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Digital Medical Prescription</span>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid #E2E8F0', margin: '14px 0' }} />
                
                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <p><strong>Doctor:</strong> {formatDoctorName(selectedPrescriptionAppt.doctorName)}</p>
                  <p><strong>Consultation for:</strong> {selectedPrescriptionAppt.userName || "Alex"}</p>
                  <p><strong>Date:</strong> {selectedPrescriptionAppt.date}</p>
                  <p><strong>Ticket ID:</strong> {selectedPrescriptionAppt.ticketId}</p>
                  <div style={{ marginTop: '14px', padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontWeight: '700', marginBottom: '6px', color: '#0F172A' }}>Clinical Advice & Prescribed Medicines:</p>
                    <p style={{ color: '#334155', fontStyle: 'italic', margin: 0 }}>
                      "{selectedPrescriptionAppt.prescription || "Standard recovery instructions provided during consultation."}"
                    </p>
                  </div>
                </div>
              </div>

              <div style={styles.modalBtns}>
                <button onClick={downloadPDF} style={styles.modalConfirmPill}>
                  📥 Download PDF Rx
                </button>
                <button onClick={() => setPrescriptionModalOpen(false)} style={styles.modalCancelPill}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    maxWidth: "520px",
    margin: "0 auto",
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
    backgroundColor: "#FFFFFF",
    color: "#3B82F6",
    border: "1px solid #E2E8F0",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
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
    backgroundColor: "#F8FAFC",
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
    gap: "10px",
  },
  btnCancel: {
    flex: 1,
    padding: "9px",
    borderRadius: "9999px",
    backgroundColor: "#FFFFFF",
    color: "#DC2626",
    border: "1px solid #FCA5A5",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnReschedule: {
    flex: 1,
    padding: "9px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(59, 130, 246, 0.3)",
  },
  btnPass: {
    padding: "7px 15px",
    borderRadius: "9999px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    color: "#2563EB",
    fontSize: "12px",
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

  // Modals
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
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "24px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 25px 50px rgba(15, 23, 42, 0.15)",
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
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "#F8FAFC",
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
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    border: "1px solid #CBD5E1",
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
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
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
    backgroundColor: "#FFFFFF",
    padding: "10px",
  },
  rxHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default MyAppointments;