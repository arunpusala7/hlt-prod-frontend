import { useEffect, useState, useCallback, useRef } from "react";
import api from "../../api/api";
import toast from "react-hot-toast"; 
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CustomDatePicker from "../../components/CustomDatePicker";

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setAppointments(res.data);
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
      // Updated to match your backend: RescheduleController.java
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>My Appointments</h2>
        <button style={styles.refreshBtn} onClick={loadAppointments}>Refresh List ↻</button>
      </div>

      {loading && <p>Loading appointments...</p>}
      {!loading && appointments.length === 0 && <div style={styles.empty}>No appointments found.</div>}

      <div style={styles.grid}>
        {appointments.map((a) => (
          <div key={a.appointmentId} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.docInfo}>
                <span style={styles.icon}>👨‍⚕️</span>
                <div>
                  <h4 style={styles.docName}>Dr. {a.doctorName}</h4>
                  <span style={styles.date}>{a.date}</span>
                </div>
              </div>
              <span style={getStatusStyle(a.status)}>{a.status}</span>
            </div>
            <div style={styles.cardBody}>
               <p style={styles.timeLabel}>Scheduled Time:</p>
               <p style={styles.timeValue}>{a.startTime} – {a.endTime || '---'}</p>
            </div>

            <div style={styles.actions}>
              {(a.status === "BOOKED" || a.status === "RESCHEDULED") && (
                <>
                  <button style={styles.cancelBtn} onClick={() => initiateCancel(a)}>Cancel</button>
                  <button style={styles.rescheduleBtn} onClick={() => openRescheduleModal(a)}>Reschedule</button>
                </>
              )}
              {a.status === "COMPLETED" && (
                <button style={styles.prescriptionBtn} onClick={() => openPrescriptionModal(a)}>📄 View Prescription</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- CANCEL MODAL --- */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div style={styles.overlay} onClick={() => setCancelModalOpen(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modal} onClick={e => e.stopPropagation()}
            >
              <h3>Cancel Appointment 🚫</h3>
              <p style={{color: '#666', fontSize: '14px'}}>
                Please tell us why you are cancelling with Dr. {apptToCancel?.doctorName}.
              </p>
              <div style={{marginBottom: '20px'}}>
                  <label style={styles.label}>Reason:</label>
                  <select style={styles.select} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                    <option value="">-- Select a Reason --</option>
                    {cancellationReasons.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
              </div>
              <div style={styles.modalActions}>
                <button onClick={() => setCancelModalOpen(false)} style={styles.btnCancelText}>Keep Appointment</button>
                <button onClick={handleConfirmCancel} style={styles.btnDanger}>Confirm Cancellation</button>
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
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={styles.modal} onClick={e => e.stopPropagation()}
            >
              <h3 style={{margin: '0 0 14px 0', color: '#0f172a', fontSize: '16px'}}>Reschedule Appointment</h3>
              <CustomDatePicker
                selectedDate={newDate}
                onChange={handleDateChange}
              />
              {newDate && (
                <div style={{marginBottom: '20px'}}>
                  <label style={styles.label}>Available Slots:</label>
                  {loadingSlots ? <p style={{fontSize:'12px'}}>Loading slots...</p> : (
                    <div style={styles.slotGrid}>
                      {availableSlots.length > 0 ? availableSlots.map((slot, idx) => (
                        <button key={idx} onClick={() => setNewSlot(slot)} style={newSlot === slot ? styles.slotActive : styles.slot}>
                          {slot.startTime.substring(0,5)}
                        </button>
                      )) : <p style={{fontSize:'12px', color:'red'}}>No slots available</p>}
                    </div>
                  )}
                </div>
              )}
              <div style={styles.modalActions}>
                <button onClick={() => setRescheduleModalOpen(false)} style={styles.btnCancel}>Cancel</button>
                <button onClick={handleConfirmReschedule} disabled={!newSlot} style={newSlot ? styles.btnConfirm : styles.btnDisabled}>Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PRESCRIPTION MODAL (LETTERHEAD) --- */}
      <AnimatePresence>
        {prescriptionModalOpen && selectedPrescriptionAppt && (
           <div style={styles.overlay} onClick={() => setPrescriptionModalOpen(false)}>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               style={styles.modalPaper} onClick={e => e.stopPropagation()}
             >
               <div style={{display:'flex', justifyContent:'flex-end'}}><button onClick={() => setPrescriptionModalOpen(false)} style={styles.closeBtn}>×</button></div>
               <div ref={prescriptionRef} style={styles.letterhead}>
                 <div style={styles.letterHeader}>
                     <h1 style={{margin: 0, fontSize: '24px', color: '#1a73e8', textTransform: 'uppercase'}}>HealthConnect Hospital</h1>
                     <p style={{margin: '5px 0 0', fontSize: '12px', color: '#555'}}>123, Wellness Avenue, Tech City, India | Ph: +91 98765 43210</p>
                     <hr style={{border: 'none', borderBottom: '2px solid #1a73e8', marginTop: '15px'}} />
                 </div>
                 <div style={styles.docDetails}>
                     <div style={{flex: 1}}>
                         <p style={styles.metaLabel}>DOCTOR</p>
                         <h3 style={styles.metaValue}>Dr. {selectedPrescriptionAppt.doctorName}</h3>
                         <span style={styles.specializationBadge}>{selectedPrescriptionAppt.doctorSpecialization || "General Physician"}</span>
                     </div>
                     <div style={{flex: 1, textAlign: 'right'}}>
                         <p style={styles.metaLabel}>DATE</p>
                         <h3 style={styles.metaValue}>{selectedPrescriptionAppt.date}</h3>
                     </div>
                 </div>
                 <div style={styles.patientBox}>
                     <div><p style={styles.metaLabel}>Patient Name</p><p style={{margin:0, fontSize: '14px', fontWeight:'bold'}}>{selectedPrescriptionAppt.userName || "User"}</p></div>
                     <div style={{textAlign: 'right'}}><p style={styles.metaLabel}>Ticket ID</p><p style={{margin:0, fontSize: '14px', fontFamily: 'monospace'}}>#{selectedPrescriptionAppt.ticketId?.substring(0,8) || 'N/A'}</p></div>
                 </div>
                 <div style={styles.rxBody}>
                     <h2 style={{color: '#1a73e8', fontFamily: 'serif', fontSize: '32px', margin: '0 0 15px 0'}}>℞</h2>
                     <div style={styles.notesText}>
                         {selectedPrescriptionAppt.prescription ? (
                             selectedPrescriptionAppt.prescription.split('\n').map((line, i) => (
                               <div key={i} style={{marginBottom: '10px', display: 'flex'}}><span style={{color:'#1a73e8', marginRight: '8px'}}>•</span><span>{line}</span></div>
                             ))
                         ) : (<p style={{color: '#888', fontStyle: 'italic'}}>No specific notes provided.</p>)}
                     </div>
                 </div>
                 <div style={styles.letterFooter}>
                     <div style={{flex: 1}}><p style={{fontSize: '10px', color: '#888'}}>Digitally generated on {new Date().toLocaleDateString()}</p></div>
                     <div style={styles.stampContainer}><div style={styles.stampBox}><span>✔ VERIFIED</span></div></div>
                 </div>
               </div>
               <div style={styles.modalActions}><button onClick={downloadPDF} style={styles.btnDownload}>⬇ Download PDF</button></div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const getStatusStyle = (status) => {
  if (status === 'COMPLETED') return styles.badgeCompleted;
  if (status === 'CANCELLED') return styles.badgeCancelled;
  if (status === 'RESCHEDULED') return styles.badgeRescheduled;
  return styles.badgeBooked;
};

const styles = {
  container: { maxWidth: "1000px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { color: "#0f172a", fontSize: "20px", fontWeight: "700", margin: 0 },
  refreshBtn: { background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", color: "#475569", fontSize: "13px", fontWeight: "600" },
  empty: { textAlign: "center", padding: "40px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  card: { background: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  docInfo: { display: "flex", alignItems: "center", gap: "10px" },
  icon: { fontSize: "14px", fontWeight: "bold", color: "#2563eb", background: "#eff6ff", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "1px solid #bfdbfe" },
  docName: { margin: "0", fontSize: "15px", fontWeight: "700", color: "#0f172a" },
  date: { fontSize: "12px", color: "#64748b" },
  cardBody: { background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", border: "1px solid #f1f5f9" },
  timeLabel: { margin: "0 0 2px 0", fontSize: "11px", color: "#64748b" },
  timeValue: { margin: "0", fontWeight: "700", color: "#0f172a", fontSize: "14px" },
  badgeBooked: { background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  badgeCompleted: { background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  badgeCancelled: { background: "#fef2f2", color: "#991b1b", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  badgeRescheduled: { background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },
  actions: { display: 'flex', gap: '8px' },
  cancelBtn: { flex: 1, padding: "8px", background: "#ffffff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  rescheduleBtn: { flex: 1, padding: "8px", background: "#eff6ff", border: "1px solid #2563eb", color: "#2563eb", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" },
  prescriptionBtn: { width: "100%", padding: "9px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: '24px', borderRadius: '14px', width: '90%', maxWidth: '380px', boxShadow: "0 20px 40px rgba(0,0,0,0.15)" },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '700', color: '#0f172a' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' },
  select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background:'white' },
  btnDanger: { padding: '10px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  btnCancelText: { padding: '10px 14px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: '13px' },
  slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' },
  slot: { padding: '8px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  slotActive: { padding: '8px', border: '1px solid #2563eb', background: '#2563eb', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' },
  btnConfirm: { padding: '10px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
  btnDisabled: { padding: '10px 18px', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontSize: '13px' },
  btnCancel: { padding: '10px 14px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: '13px' },
  modalPaper: { background: '#f8fafc', padding: '20px', borderRadius: '12px', width: '95%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' },
  letterhead: { background: 'white', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', color: '#0f172a', borderRadius: "8px" },
  letterHeader: { textAlign: 'center', marginBottom: '20px' },
  docDetails: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  metaLabel: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  metaValue: { fontSize: '15px', margin: 0, color: '#0f172a', fontWeight: "700" },
  specializationBadge: { fontSize: '11px', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' },
  patientBox: { background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', border: '1px solid #e2e8f0' },
  rxBody: { minHeight: '130px' },
  notesText: { fontSize: '14px', lineHeight: '1.6' },
  letterFooter: { marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stampContainer: { textAlign: 'right' },
  stampBox: { border: '2px solid #16a34a', color: '#16a34a', padding: '4px 8px', fontWeight: 'bold', borderRadius: '4px' },
  btnDownload: { padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  closeBtn: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: "#64748b" }
};

export default MyAppointments;