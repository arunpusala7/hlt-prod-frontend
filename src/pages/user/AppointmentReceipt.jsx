import React, { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { formatDoctorName } from "../../utils/formatDoctorName";
import { getDoctorPortrait } from "../../utils/doctorAvatars";
import api from "../../api/api";

const AppointmentReceipt = ({ appointment, onClose }) => {
  const receiptRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll and prevent background chaining when receipt sheet is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  if (!appointment) return null;

  // Normalized Info
  const doctorName = formatDoctorName(appointment.doctorName || appointment.name || "Doctor");
  const specialization =
    appointment.doctorSpecialization ||
    appointment.specialization ||
    "Specialist";
  const doctorId = appointment.doctorId || appointment.id || 1;
  const patientName =
    appointment.userName &&
    appointment.userName !== "Valued Patient" &&
    appointment.userName !== "Patient"
      ? appointment.userName
      : localStorage.getItem("userName") || "Alex";

  const rawTicket =
    appointment.ticketId ||
    (appointment.appointmentId ? `HC-${appointment.appointmentId}` : null) ||
    "HC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const displayTicketId = rawTicket.startsWith("HC-") ? rawTicket : `HC-${rawTicket}`;

  // Date Formatting: e.g. "Sun, 06 Sep 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return "Today";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return dateStr;
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Time Formatting: e.g. "10:00 AM"
  const formatTime12h = (timeStr) => {
    if (!timeStr) return "10:00 AM";
    try {
      const parts = timeStr.split(":");
      let hours = parseInt(parts[0], 10);
      const mins = parts[1] ? parts[1].substring(0, 2) : "00";
      if (isNaN(hours)) return timeStr;
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const formattedDate = formatDate(appointment.appointmentDate || appointment.date);
  const startTime = formatTime12h(appointment.startTime);
  const endTime = formatTime12h(
    appointment.endTime ||
      (appointment.startTime ? appointment.startTime.replace(/:\d\d$/, ":30") : null)
  );

  // High-Resolution PDF Download — tries server-side first, falls back to client-side
  const downloadPDF = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    toast("Saving pass...", { icon: "📥" });

    // Attempt 1: Server-generated OpenPDF with QR code
    const ticketIdForPdf = appointment.ticketId || rawTicket;
    const appointmentIdForPdf = appointment.appointmentId || appointment.id;
    try {
      let pdfUrl = null;
      if (ticketIdForPdf && !ticketIdForPdf.startsWith("HC-")) {
        pdfUrl = `/api/appointments/ticket/${ticketIdForPdf}/pdf`;
      } else if (appointmentIdForPdf && typeof appointmentIdForPdf === "number") {
        pdfUrl = `/api/appointments/${appointmentIdForPdf}/pdf`;
      }

      if (pdfUrl) {
        const res = await api.get(pdfUrl, { responseType: "blob" });
        if (res.data && res.data.size > 100) {
          const blob = new Blob([res.data], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `HealthConnect-Pass-${displayTicketId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success("Official pass downloaded!");
          setIsDownloading(false);
          return;
        }
      }
    } catch (serverErr) {
      // Server PDF unavailable, fall through to client-side generation
      console.log("Server PDF unavailable, using client-side generation");
    }

    // Attempt 2: Client-side html2canvas generation
    const element = receiptRef.current;
    if (!element) {
      setIsDownloading(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const yOffset = Math.max(16, (297 - pdfHeight) / 2);
      pdf.addImage(imgData, "PNG", 15, yOffset, pdfWidth - 30, ((pdfWidth - 30) * canvas.height) / canvas.width);
      pdf.save(`HealthConnect-Pass-${displayTicketId}.pdf`);
      toast.success("Pass downloaded successfully!");
    } catch (err) {
      console.error("PDF download failed", err);
      toast.error("Could not generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      style={styles.sheetOverlay} 
      onClick={onClose}
      onTouchMove={(e) => { if (e.target === e.currentTarget) e.preventDefault(); }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320, mass: 0.85 }}
        style={styles.bottomSheet}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle Bar */}
        <div style={styles.dragHandleRow} onClick={onClose} title="Slide down to close">
          <div style={styles.dragPill}></div>
        </div>

        {/* Scrollable Pass Content */}
        <div style={styles.sheetScrollableBody}>
          <div ref={receiptRef} style={styles.cleanPassCard}>
            {/* Header: Title + Status + Close */}
            <div style={styles.topRow}>
              <div>
                <span style={styles.passLabel}>APPOINTMENT PASS</span>
                <div style={styles.statusRow}>
                  <span style={styles.statusDot}></span>
                  <span style={styles.statusText}>Confirmed</span>
                </div>
              </div>

              <button onClick={onClose} style={styles.closeBtn} title="Close Pass">
                ✕
              </button>
            </div>

            {/* Doctor Info */}
            <div style={styles.docRow}>
              <img
                src={getDoctorPortrait(doctorId, doctorName)}
                alt={doctorName}
                style={styles.docAvatar}
              />
              <div>
                <h3 style={styles.docName}>{doctorName}</h3>
                <span style={styles.specBadge}>{specialization}</span>
              </div>
            </div>

            <div style={styles.divider}></div>

            {/* Patient & Timings (Only Needed Info) */}
            <div style={styles.infoRow}>
              <div>
                <span style={styles.infoLabel}>PATIENT</span>
                <strong style={styles.infoVal}>{patientName}</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={styles.infoLabel}>TIME</span>
                <strong style={styles.infoVal}>{startTime} – {endTime}</strong>
              </div>
            </div>

            <div style={styles.infoRow}>
              <div>
                <span style={styles.infoLabel}>DATE</span>
                <strong style={styles.infoVal}>{formattedDate}</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={styles.infoLabel}>TICKET ID</span>
                <strong style={styles.ticketIdVal}>{displayTicketId}</strong>
              </div>
            </div>

            {/* Centered Minimal QR Code */}
            <div style={styles.qrSection}>
              <div style={styles.qrBox}>
                <QRCodeCanvas
                  value={`https://healthconnect.app/verify?ticketId=${encodeURIComponent(displayTicketId)}`}
                  size={120}
                  level="M"
                />
              </div>
              <span style={styles.qrHint}>Scan at reception for direct check-in</span>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Actions */}
        <div style={styles.bottomBar}>
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            style={styles.btnDownload}
          >
            {isDownloading ? "Saving..." : "📥 Download Pass"}
          </button>
          <button onClick={onClose} style={styles.btnClose}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const styles = {
  sheetOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 100000,
    touchAction: "none",
  },
  bottomSheet: {
    width: "100%",
    maxWidth: "460px",
    maxHeight: "88vh",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.18)",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
    overflow: "hidden",
  },
  dragHandleRow: {
    width: "100%",
    padding: "12px 0 6px 0",
    display: "flex",
    justifyContent: "center",
    cursor: "pointer",
    backgroundColor: "#FFFFFF",
  },
  dragPill: {
    width: "42px",
    height: "5px",
    borderRadius: "9999px",
    backgroundColor: "#CBD5E1",
  },
  sheetScrollableBody: {
    padding: "10px 20px 16px 20px",
    overflowY: "auto",
    flex: 1,
    overscrollBehavior: "contain",
    overscrollBehaviorY: "contain",
    WebkitOverflowScrolling: "touch",
  },
  cleanPassCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: "20px",
    padding: "16px 18px",
    border: "1px solid #E2E8F0",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  passLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: "2px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#16A34A",
  },
  statusText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#16A34A",
  },
  closeBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    border: "none",
    color: "#64748B",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  docRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  docAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  docName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  specBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#2563EB",
    marginTop: "2px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "0 0 14px 0",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  infoLabel: {
    fontSize: "9.5px",
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: "0.06em",
    display: "block",
    marginBottom: "2px",
  },
  infoVal: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
    display: "block",
  },
  ticketIdVal: {
    fontSize: "13px",
    fontWeight: "800",
    fontFamily: "monospace",
    color: "#2563EB",
    display: "block",
  },
  qrSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "4px",
    paddingTop: "14px",
    borderTop: "1px dashed #E2E8F0",
  },
  qrBox: {
    padding: "8px",
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  qrHint: {
    fontSize: "10.5px",
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: "6px",
  },
  bottomBar: {
    display: "flex",
    gap: "10px",
    padding: "12px 20px 20px 20px",
    borderTop: "1px solid #F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  btnDownload: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "9999px",
    border: "none",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
  },
  btnClose: {
    padding: "12px 24px",
    backgroundColor: "var(--input-bg, #F8FAFC)",
    color: "#64748B",
    borderRadius: "9999px",
    border: "var(--card-border, 1px solid #E2E8F0)",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
};

export default AppointmentReceipt;