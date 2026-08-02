import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState(null);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/payments");
      setPayments(res.data || []);
    } catch (err) {
      toast.error("Failed to load payment transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredPayments = payments.filter((p) => {
    const pId = p.razorpayPaymentId || "";
    const oId = p.razorpayOrderId || "";
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = pId.toLowerCase().includes(lowerSearch) || oId.toLowerCase().includes(lowerSearch);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const pendingCount = payments.filter((p) => p.status !== "SUCCESS").length;

  return (
    <div style={styles.pageContainer}>
      {/* Minimal Top Navbar */}
      <nav style={styles.topNav}>
        <div style={styles.leftNavRow}>
          <button onClick={() => navigate("/admin")} style={styles.backBtn}>
            &larr; Back
          </button>
          <h2 style={styles.topTitle}>Payments</h2>
        </div>

        {/* Top Right Profile Icon */}
        <div style={{ position: "relative" }} ref={profileMenuRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            style={styles.avatarOnlyBtn}
            title="Admin Account & Menu"
          >
            <div style={styles.avatarCircle}>A</div>
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={styles.profileDropdown}
              >
                <div style={styles.dropdownHeader}>
                  <p style={styles.dropdownUser}>Administrator</p>
                  <p style={styles.dropdownEmail}>admin@gmail.com</p>
                  <span style={styles.onlineBadge}>● Master Admin</span>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin"); }}>
                  🏠 Admin Dashboard
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/appointments"); }}>
                  📅 Manage Appointments
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/doctors"); }}>
                  🏥 Active Doctor List
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

                <button style={styles.dropdownLogoutBtn} onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Visual Summary Cards */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Total Revenue</span>
              <div style={{ ...styles.metricIconBox, background: '#eff6ff', color: '#2563eb' }}>💰</div>
            </div>
            <h3 style={{ ...styles.metricValue, color: "#2563eb" }}>₹{totalRevenue.toLocaleString()}</h3>
            <span style={styles.metricSub}>Gross Payments</span>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Total Orders</span>
              <div style={{ ...styles.metricIconBox, background: '#f1f5f9', color: '#0f172a' }}>📊</div>
            </div>
            <h3 style={styles.metricValue}>{payments.length}</h3>
            <span style={styles.metricSub}>Orders Issued</span>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Successful</span>
              <div style={{ ...styles.metricIconBox, background: '#dcfce7', color: '#16a34a' }}>✅</div>
            </div>
            <h3 style={{ ...styles.metricValue, color: "#16a34a" }}>{successCount}</h3>
            <span style={styles.metricSub}>Verified Transactions</span>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Pending / Created</span>
              <div style={{ ...styles.metricIconBox, background: '#fef3c7', color: '#d97706' }}>⏳</div>
            </div>
            <h3 style={{ ...styles.metricValue, color: "#d97706" }}>{pendingCount}</h3>
            <span style={styles.metricSub}>Unconfirmed Orders</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={styles.filterCard}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search Payment ID or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.statusGroup}>
            {["ALL", "SUCCESS", "CREATED", "FAILED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={statusFilter === st ? styles.filterBtnActive : styles.filterBtn}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table Card */}
        <div style={styles.tableCard}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: "13px" }}>
              Loading transactions...
            </p>
          ) : filteredPayments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h4 style={{ color: "#0f172a", margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700" }}>No Transactions Found</h4>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>No payment records matching your filter parameters.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Tx ID</th>
                    <th style={styles.th}>Razorpay Payment ID</th>
                    <th style={styles.th}>Razorpay Order ID</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>#{p.id}</td>
                      <td style={styles.td}>
                        <span style={styles.codePill}>{p.razorpayPaymentId || "Pending"}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.codePill}>{p.razorpayOrderId}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "800", color: "#0f172a" }}>
                        ₹{p.amount?.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ ...styles.td, color: "#64748b", fontSize: "12px" }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setSelectedTx(p)}
                          style={styles.inspectBtn}
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div style={styles.modalOverlay} onClick={() => setSelectedTx(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.modalTitle}>Transaction Audit Details</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0" }}>
                HMAC SHA-256 Signature Verification Record
              </p>

              <div style={styles.modalGrid}>
                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>Database ID</span>
                  <span style={styles.modalVal}>#{selectedTx.id}</span>
                </div>

                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>Appointment ID</span>
                  <span style={styles.modalVal}>{selectedTx.appointmentId ? `#${selectedTx.appointmentId}` : "Unlinked"}</span>
                </div>

                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>Razorpay Payment ID</span>
                  <span style={styles.modalCodeVal}>{selectedTx.razorpayPaymentId || "Pending Completion"}</span>
                </div>

                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>Razorpay Order ID</span>
                  <span style={styles.modalCodeVal}>{selectedTx.razorpayOrderId}</span>
                </div>

                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>Amount Charged</span>
                  <span style={{ ...styles.modalVal, color: "#2563eb" }}>₹{selectedTx.amount?.toFixed(2)} INR</span>
                </div>

                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>HMAC Security Status</span>
                  <span style={{ ...styles.modalVal, color: selectedTx.status === "SUCCESS" ? "#16a34a" : "#d97706" }}>
                    {selectedTx.status === "SUCCESS" ? "● PASSED & VERIFIED" : "● PENDING VERIFICATION"}
                  </span>
                </div>

                {selectedTx.razorpaySignature && (
                  <div style={{ ...styles.modalItem, gridColumn: "1 / -1" }}>
                    <span style={styles.modalLabel}>HMAC SHA-256 Signature</span>
                    <span style={styles.signatureBox}>{selectedTx.razorpaySignature}</span>
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", marginTop: "20px" }}>
                <button style={styles.closeModalBtn} onClick={() => setSelectedTx(null)}>
                  Close Audit Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  let style = styles.badgeSuccess;
  if (status === "CREATED") style = styles.badgeCreated;
  else if (status === "FAILED") style = styles.badgeFailed;

  return <span style={style}>{status}</span>;
};

const styles = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  topNav: {
    backgroundColor: "#ffffff",
    padding: "14px 28px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  leftNavRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backBtn: {
    padding: "6px 12px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  topTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },

  // Avatar Icon Only
  avatarOnlyBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    borderRadius: "50%",
  },
  avatarCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
  },
  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "120%",
    width: "220px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "10px",
    zIndex: 1000,
  },
  dropdownHeader: {
    padding: "4px 8px 8px 8px",
  },
  dropdownUser: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  dropdownEmail: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    color: "#64748b",
  },
  onlineBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16a34a",
  },
  dropdownItem: {
    padding: "8px 10px",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "500",
    borderRadius: "6px",
    cursor: "pointer",
  },
  dropdownLogoutBtn: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
  },

  content: {
    maxWidth: "1100px",
    margin: "24px auto",
    padding: "0 16px",
    boxSizing: "border-box",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  metricCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "18px 20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  metricHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricIconBox: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },
  metricValue: {
    margin: "8px 0 2px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  metricSub: {
    fontSize: "11px",
    color: "#94a3b8",
  },

  filterCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "16px 20px",
    border: "1px solid #e2e8f0",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  searchWrapper: {
    flex: "1 1 280px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 12px",
  },
  searchIcon: {
    fontSize: "13px",
    color: "#64748b",
    marginRight: "8px",
  },
  searchInput: {
    width: "100%",
    padding: "9px 0",
    border: "none",
    fontSize: "13px",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
  },

  statusGroup: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  filterBtnActive: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "12px 16px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#0f172a",
  },
  codePill: {
    fontFamily: "monospace",
    fontSize: "12px",
    backgroundColor: "#f1f5f9",
    padding: "3px 8px",
    borderRadius: "6px",
    color: "#334155",
  },

  inspectBtn: {
    padding: "6px 12px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeCreated: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeFailed: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },

  // Modal
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
    maxWidth: "500px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
  modalTitle: {
    margin: "0 0 2px 0",
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  modalItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  modalLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  modalVal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  modalCodeVal: {
    fontFamily: "monospace",
    fontSize: "12px",
    fontWeight: "600",
    color: "#334155",
  },
  signatureBox: {
    fontFamily: "monospace",
    fontSize: "11px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "8px",
    borderRadius: "6px",
    color: "#475569",
    wordBreak: "break-all",
    marginTop: "2px",
  },
  closeModalBtn: {
    padding: "9px 18px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default AdminPayments;
