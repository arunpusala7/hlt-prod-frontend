import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import { formatDoctorName } from "../../utils/formatDoctorName";

const AppointmentReceipt = ({ appointment, onClose }) => {
  const receiptRef = useRef();

  const downloadPDF = async () => {
    const element = receiptRef.current;
    
    // 1. Capture the receipt design as high resolution image
    const canvas = await html2canvas(element, { scale: 3, useCORS: true });
    const data = canvas.toDataURL("image/png");

    // 2. Generate PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(data, "PNG", 0, 10, pdfWidth, pdfHeight);
    pdf.save(`HealthConnect-Pass-${appointment.ticketId || "booking"}.pdf`);
  };

  return (
    <div style={styles.overlay}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
        style={styles.modal}
      >
        
        {/* === E-TICKET PASS CONTAINER (DOWNLOAD TARGET) === */}
        <div ref={receiptRef} style={styles.ticketContainer}>
          {/* Top Brand Header */}
          <div style={styles.ticketHeader}>
            <div style={styles.brandRow}>
              <div style={styles.brandTitle}>
                <span style={{ color: '#ffffff', fontWeight: "900" }}>Health</span>
                <span style={{ color: '#93c5fd', fontWeight: "900" }}>Connect</span>
              </div>
              <span style={styles.ticketBadge}>CONFIRMED MEDICAL PASS</span>
            </div>
            <p style={styles.headerSub}>Official Digital Consultation Voucher</p>
          </div>

          {/* Ticket Body Content */}
          <div style={styles.ticketBody}>
            {/* Left Main Column */}
            <div style={styles.leftCol}>
              <div style={styles.fieldGroup}>
                <span style={styles.fieldLabel}>PATIENT NAME</span>
                <h3 style={styles.patientName}>
                  {appointment.userName && appointment.userName !== "Valued Patient" 
                    ? appointment.userName 
                    : (localStorage.getItem("userName") || "Patient User")}
                </h3>
              </div>

              <div style={styles.fieldGroup}>
                <span style={styles.fieldLabel}>ATTENDING SPECIALIST</span>
                <h3 style={styles.doctorName}>{formatDoctorName(appointment.doctorName)}</h3>
                <span style={styles.specTag}>{appointment.specialization}</span>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <span style={styles.fieldLabel}>DATE</span>
                  <strong style={styles.infoVal}>{appointment.appointmentDate || appointment.date}</strong>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.fieldLabel}>TIME SLOT</span>
                  <strong style={styles.infoVal}>{appointment.startTime}</strong>
                </div>
              </div>

              <div style={styles.hospitalRow}>
                <span style={styles.fieldLabel}>CLINIC LOCATION</span>
                <p style={styles.hospitalText}>HealthConnect Super Specialty Hospital & Center</p>
              </div>
            </div>

            {/* Perforated Divider */}
            <div style={styles.dividerCol}>
              <div style={styles.notchTop}></div>
              <div style={styles.dashedLine}></div>
              <div style={styles.notchBottom}></div>
            </div>

            {/* Right QR Scanner Column */}
            <div style={styles.rightCol}>
              <span style={styles.qrLabel}>RECEPTION QR CHECK-IN</span>
              
              <div style={styles.qrBox}>
                <QRCodeCanvas 
                  value={appointment.ticketId || "HEALTHCONNECT-CONFIRMED"} 
                  size={120} 
                  level={"H"}
                  includeMargin={true}
                />
              </div>

              <div style={styles.ticketIdBadge}>
                <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>TICKET ID</span>
                <strong style={{ fontSize: "12px", color: "#0f172a", fontFamily: "monospace" }}>
                  {appointment.ticketId ? appointment.ticketId.substring(0, 14) : "TCK-CONFIRMED"}
                </strong>
              </div>

              <span style={styles.statusPill}>● PAID & CONFIRMED</span>
            </div>
          </div>

          {/* Ticket Footer */}
          <div style={styles.ticketFooter}>
            <p style={styles.footerNote}>
              Please show this digital QR ticket at the hospital reception desk upon arrival.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionsRow}>
          <button onClick={downloadPDF} style={styles.btnDownload}>
            📥 Download PDF Pass
          </button>
          <button onClick={onClose} style={styles.btnClose}>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "16px",
    boxSizing: "border-box",
  },
  modal: {
    width: "100%",
    maxWidth: "680px",
  },
  
  ticketContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid #e2e8f0",
  },
  
  ticketHeader: {
    backgroundColor: "#2563eb",
    padding: "20px 24px",
    color: "#ffffff",
  },
  brandRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandTitle: {
    fontSize: "20px",
  },
  ticketBadge: {
    fontSize: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#ffffff",
    padding: "4px 10px",
    borderRadius: "20px",
    fontWeight: "800",
    letterSpacing: "0.05em",
  },
  headerSub: {
    margin: "4px 0 0 0",
    fontSize: "12px",
    color: "#93c5fd",
  },
  
  ticketBody: {
    display: "flex",
    position: "relative",
    backgroundColor: "#ffffff",
    flexWrap: "wrap",
  },
  leftCol: {
    flex: "1 1 320px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  dividerCol: {
    position: "relative",
    width: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notchTop: {
    width: "20px",
    height: "10px",
    backgroundColor: "#0f172a",
    borderBottomLeftRadius: "10px",
    borderBottomRightRadius: "10px",
  },
  dashedLine: {
    width: "1px",
    flex: 1,
    borderLeft: "2px dashed #cbd5e1",
    margin: "6px 0",
  },
  notchBottom: {
    width: "20px",
    height: "10px",
    backgroundColor: "#0f172a",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  },
  rightCol: {
    flex: "1 1 200px",
    padding: "24px",
    backgroundColor: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "10px",
  },
  
  fieldGroup: {},
  fieldLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "2px",
  },
  patientName: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#0f172a",
  },
  doctorName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  specTag: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "2px 8px",
    borderRadius: "6px",
    marginTop: "4px",
  },

  infoGrid: {
    display: "flex",
    gap: "16px",
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  infoBox: {
    flex: 1,
  },
  infoVal: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0f172a",
  },

  hospitalRow: {},
  hospitalText: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#475569",
    fontWeight: "600",
  },
  
  qrLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: "0.05em",
  },
  qrBox: {
    padding: "10px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  ticketIdBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statusPill: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "800",
  },
  
  ticketFooter: {
    backgroundColor: "#f1f5f9",
    padding: "12px 20px",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0",
  },
  footerNote: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "500",
  },
  
  actionsRow: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "12px",
  },
  btnDownload: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
  },
  btnClose: {
    padding: "12px 20px",
    backgroundColor: "#ffffff",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
  },
};

export default AppointmentReceipt;