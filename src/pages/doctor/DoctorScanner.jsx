import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import api from "../../api/api";
import toast from "react-hot-toast";

function DoctorScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [validationData, setValidationData] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = async (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue;
      if (rawValue && isScanning) {
        setIsScanning(false);
        setScanResult(rawValue);
        toast.loading("Verifying ticket pass...", { id: "verify" });

        try {
          const res = await api.get(`/api/validate/${rawValue}`);
          const status = res.data.status;

          if (status === "VALID") {
            toast.success("Patient verified!", { id: "verify" });
            setValidationData({ ...res.data, status: "VALID" });
          } else if (status === "WRONG_DOCTOR") {
            toast.error("Wrong Doctor!", { id: "verify" });
            setValidationData({
              status: "WRONG_DOCTOR",
              message: res.data.message || "This ticket belongs to another doctor.",
            });
          } else {
            toast.error("Invalid Ticket", { id: "verify" });
            setValidationData({ status: "INVALID" });
          }
        } catch (err) {
          toast.error("Error connecting to verification server", { id: "verify" });
          setIsScanning(true);
        }
      }
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setValidationData(null);
    setIsScanning(true);
  };

  return (
    <div style={scannerStyles.container}>
      {isScanning ? (
        <div style={scannerStyles.scannerBox}>
          <div style={scannerStyles.cameraFrame}>
            <Scanner
              onScan={handleScan}
              components={{ audio: false, finder: true }}
              styles={{
                container: { borderRadius: "16px", overflow: "hidden", width: "100%", height: "100%" },
                video: { objectFit: "cover" },
              }}
            />
          </div>
          <div style={scannerStyles.scanPrompt}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
              <rect x="7" y="7" width="10" height="10" rx="1"></rect>
            </svg>
            <span>Position the patient QR pass within the viewfinder</span>
          </div>
        </div>
      ) : (
        <div style={scannerStyles.resultCard}>
          {/* === 1. VALID === */}
          {validationData?.status === "VALID" && (
            <div style={scannerStyles.statusSection}>
              <div style={scannerStyles.iconBadgeSuccess}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <div style={scannerStyles.verifiedPill}>
                <span style={scannerStyles.statusDotSuccess}></span>
                <span>Verified Patient Pass</span>
              </div>

              <h2 style={scannerStyles.resultHeading}>Check-in Successful</h2>
              <p style={scannerStyles.resultSub}>Patient has an active booking on your schedule.</p>

              <div style={scannerStyles.patientCard}>
                <div style={scannerStyles.patientAvatar}>
                  {validationData.patientName ? validationData.patientName.charAt(0).toUpperCase() : "P"}
                </div>
                <div style={scannerStyles.patientInfo}>
                  <p style={scannerStyles.patientName}>{validationData.patientName}</p>
                  <div style={scannerStyles.patientMeta}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                    </svg>
                    <span>{validationData.date}</span>
                    <span style={{ color: "#CBD5E1" }}>•</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{validationData.time}</span>
                  </div>
                </div>
              </div>

              <button onClick={resetScanner} style={scannerStyles.primaryBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                  <rect x="7" y="7" width="10" height="10" rx="1"></rect>
                </svg>
                <span>Scan Next Patient</span>
              </button>
            </div>
          )}

          {/* === 2. WRONG DOCTOR === */}
          {validationData?.status === "WRONG_DOCTOR" && (
            <div style={scannerStyles.statusSection}>
              <div style={scannerStyles.iconBadgeWarning}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>

              <div style={scannerStyles.warningPill}>
                <span>Assigned to Another Doctor</span>
              </div>

              <h2 style={scannerStyles.resultHeadingWarning}>Different Practitioner</h2>
              <p style={scannerStyles.messageBoxWarning}>
                {validationData.message || "This appointment ticket belongs to a different doctor's consultation queue."}
              </p>

              <button onClick={resetScanner} style={scannerStyles.secondaryBtn}>
                <span>Scan Another Pass</span>
              </button>
            </div>
          )}

          {/* === 3. INVALID === */}
          {validationData?.status === "INVALID" && (
            <div style={scannerStyles.statusSection}>
              <div style={scannerStyles.iconBadgeDanger}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>

              <div style={scannerStyles.dangerPill}>
                <span>Invalid or Expired Pass</span>
              </div>

              <h2 style={scannerStyles.resultHeadingDanger}>Unrecognized Ticket</h2>
              <p style={scannerStyles.resultSub}>
                This QR ticket could not be validated in the HealthConnect database. It may have expired or been cancelled.
              </p>

              <button onClick={resetScanner} style={scannerStyles.dangerBtn}>
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const scannerStyles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  scannerBox: {
    width: "100%",
    maxWidth: "420px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },
  cameraFrame: {
    borderRadius: "16px",
    overflow: "hidden",
    width: "100%",
    height: "min(340px, 50vh)",
    backgroundColor: "#0F172A",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
    border: "2px solid #E2E8F0",
  },
  scanPrompt: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
    backgroundColor: "#F1F5F9",
    padding: "8px 14px",
    borderRadius: "20px",
  },
  resultCard: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "24px 20px",
    boxSizing: "border-box",
  },
  statusSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconBadgeSuccess: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#DCFCE7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)",
  },
  iconBadgeWarning: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    boxShadow: "0 4px 12px rgba(217, 119, 6, 0.15)",
  },
  iconBadgeDanger: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "#FEE2E2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)",
  },
  verifiedPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    backgroundColor: "#ECFDF5",
    color: "#059669",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  statusDotSuccess: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
  },
  warningPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    backgroundColor: "#FFFBEB",
    color: "#B45309",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  dangerPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  resultHeading: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  resultHeadingWarning: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#92400E",
    margin: "0 0 4px 0",
  },
  resultHeadingDanger: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#991B1B",
    margin: "0 0 4px 0",
  },
  resultSub: {
    fontSize: "13px",
    color: "#64748B",
    margin: "0 0 18px 0",
  },
  messageBoxWarning: {
    fontSize: "14px",
    color: "#78350F",
    backgroundColor: "#FEF3C7",
    padding: "12px 16px",
    borderRadius: "10px",
    margin: "0 0 20px 0",
    width: "100%",
    boxSizing: "border-box",
    fontWeight: "600",
  },
  patientCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "12px 16px",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "20px",
    textAlign: "left",
  },
  patientAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "800",
    border: "1px solid #BFDBFE",
    flexShrink: 0,
  },
  patientInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    overflow: "hidden",
  },
  patientName: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  patientMeta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "600",
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 20px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  secondaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 20px",
    backgroundColor: "#D97706",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  dangerBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 20px",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
};

export default DoctorScanner;