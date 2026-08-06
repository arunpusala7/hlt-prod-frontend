import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";
import api from "../api/api";

const QRScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [statusData, setStatusData] = useState(null);

    useEffect(() => {
        // 1. Initialize Scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: 250 },
            false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            scanner.clear(); // Stop camera after successful scan
            setScanResult(decodedText);
            verifyTicket(decodedText); // Call Backend
        }

        function onScanFailure(error) {
            // console.warn(error); // Keep console clean
        }

        // Cleanup when leaving page
        return () => {
            scanner.clear().catch(err => console.error("Scanner cleanup error", err));
        };
    }, []);

    // 2. Backend Verification Logic
    const verifyTicket = async (ticketId) => {
        const loadingToast = toast.loading("Checking database...");
        
        try {
            const res = await api.post(`/api/appointments/verify/${ticketId}`);
            toast.dismiss(loadingToast);
            toast.success("Check-In Successful!");
            setStatusData({ success: true, ...res.data });
        } catch (error) {
            toast.dismiss(loadingToast);
            const msg = error.response?.data?.message || "Verification Failed";
            toast.error(msg);
            setStatusData({ success: false, message: msg });
        }
    };

    return (
        <div className="container mt-5 text-center">
            <h2 className="mb-4 text-primary">Doctor's Scanner</h2>

            {/* Camera View */}
            {!statusData && (
                <div id="reader" style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}></div>
            )}

            {/* Success Result Display */}
            {statusData && statusData.success && (
                <div className="card shadow p-4 mt-4 bg-success text-white">
                    <h3>✅ {statusData.status}</h3>
                    <hr />
                    <p className="fs-5"><strong>Patient:</strong> {statusData.userName}</p>
                    <p><strong>Ticket ID:</strong> {scanResult}</p>
                    <button 
                        className="btn btn-light mt-3" 
                        onClick={() => window.location.reload()}
                    >
                        Scan Next Patient
                    </button>
                </div>
            )}

            {/* Error Result Display */}
            {statusData && !statusData.success && (
                <div className="card shadow p-4 mt-4 bg-danger text-white">
                    <h3>❌ Verification Failed</h3>
                    <p className="fs-5">{statusData.message}</p>
                    <button 
                        className="btn btn-light mt-3" 
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;