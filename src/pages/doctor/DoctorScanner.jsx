import { useState } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';
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
        toast.loading("Verifying...", { id: "verify" });

        try {
          const res = await api.get(`/api/validate/${rawValue}`);
          const status = res.data.status;

          if (status === "VALID") {
            // ✅ YOUR PATIENT
            toast.success("Verified!", { id: "verify" });
            setValidationData({ ...res.data, status: "VALID" });
            
          } else if (status === "WRONG_DOCTOR") {
            // ❌ ANOTHER DOCTOR'S PATIENT
            toast.error("Wrong Doctor!", { id: "verify" });
            setValidationData({ 
                status: "WRONG_DOCTOR", 
                message: res.data.message // "This ticket belongs to Dr. Smith"
            });
            
          } else {
            // ❌ INVALID TICKET
            toast.error("Invalid Ticket", { id: "verify" });
            setValidationData({ status: "INVALID" });
          }
        } catch (err) {
          toast.error("Error connecting", { id: "verify" });
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
    <div style={{ width: "100%", textAlign: "center" }}>
      {isScanning ? (
        <div style={{ borderRadius: "12px", overflow: "hidden", width: "100%", maxWidth: "450px", height: "min(350px, 55vh)", margin: "0 auto", background: "#000" }}>
           <Scanner onScan={handleScan} components={{ audio: false, finder: true }} />
        </div>
      ) : (
        <div style={{ padding: "20px", border: "1px solid #eee", borderRadius: "12px", background: "#fff" }}>
          
          {/* === 1. VALID === */}
          {validationData?.status === "VALID" && (
             <div>
               <div style={{fontSize:'50px'}}>✅</div>
               <h2 style={{ color: "#2e7d32", margin:'10px 0' }}>Verified</h2>
               <p style={{fontSize: '18px', fontWeight: 'bold'}}>{validationData.patientName}</p>
               <p>{validationData.date} @ {validationData.time}</p>
               <button onClick={resetScanner} style={btnStyle}>Scan Next</button>
             </div>
          )}

          {/* === 2. WRONG DOCTOR (New Case) === */}
          {validationData?.status === "WRONG_DOCTOR" && (
             <div>
               <div style={{fontSize:'50px'}}>⚠️</div>
               <h2 style={{ color: "#f57c00", margin:'10px 0' }}>Not Your Patient</h2>
               <p style={{ color: "#555" }}>{validationData.message}</p>
               <button onClick={resetScanner} style={btnStyle}>Scan Again</button>
             </div>
          )}

          {/* === 3. INVALID === */}
          {validationData?.status === "INVALID" && (
             <div>
               <div style={{fontSize:'50px'}}>❌</div>
               <h2 style={{ color: "#c62828", margin:'10px 0' }}>Invalid Ticket</h2>
               <p>Ticket not found in system.</p>
               <button onClick={resetScanner} style={btnStyle}>Try Again</button>
             </div>
          )}

        </div>
      )}
    </div>
  );
}

const btnStyle = { marginTop: "15px", padding: "10px 20px", background: "#1a73e8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" };

export default DoctorScanner;