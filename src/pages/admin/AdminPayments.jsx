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
      {/* Top Navbar */}
      <nav style={styles.topNav}>
        <div style={styles.leftNavRow}>
          <button onClick={() => navigate("/admin")} style={styles.backBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Dashboard</span>
          </button>
          <div style={styles.titleGroup}>
            <h2 style={styles.topTitle}>Financial Settlement & Payment Registry</h2>
            <span style={styles.adminTag}>Razorpay HMAC Verified</span>
          </div>
        </div>

        {/* Top Right Profile Icon */}
        <div style={{ position: "relative" }} ref={profileMenuRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            style={styles.avatarBtn}
            title="Admin Account"
          >
            A
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={styles.profileDropdown}
              >
                <div style={styles.dropdownHeader}>
                  <p style={styles.dropdownUser}>System Administrator</p>
                  <p style={styles.dropdownEmail}>admin@healthconnect.com</p>
                </div>

                <div style={styles.menuDivider}></div>

                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin"); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                  </svg>
                  <span>Admin Dashboard</span>
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/appointments"); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>Manage Appointments</span>
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/doctors"); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                  <span>Active Doctor List</span>
                </div>

                <div style={styles.menuDivider}></div>

                <button style={styles.dropdownLogoutBtn} onClick={handleLogout}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign Out</span>
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
              <div style={{ ...styles.metricIconBox, backgroundColor: "#EFF6FF", color: "#2563EB" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
            </div>
            <h3 style={{ ...styles.metricValue, color: "#2563EB" }}>₹{totalRevenue.toLocaleString()}</h3>
            <span style={styles.metricSub}>Gross Payments Verified</span>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Total Orders</span>
              <div style={{ ...styles.metricIconBox, backgroundColor: "#F1F5F9", color: "#0F172A" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
            </div>
            <h3 style={styles.metricValue}>{payments.length}</h3>
            <span style={styles.metricSub}>Gateway Orders Issued</span>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Successful</span>
              <div style={{ ...styles.metricIconBox, backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
            </div>
            <h3 style={{ ...styles.metricValue, color: "#16A34A" }}>{successCount}</h3>
            <span style={styles.metricSub}>Settled Transactions</span>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeaderRow}>
              <span style={styles.metricLabel}>Pending / Created</span>
              <div style={{ ...styles.metricIconBox, backgroundColor: "#FEF3C7", color: "#D97706" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            <h3 style={{ ...styles.metricValue, color: "#D97706" }}>{pendingCount}</h3>
            <span style={styles.metricSub}>Unconfirmed Orders</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={styles.filterCard}>
          <div style={styles.searchWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" style={{ marginRight: "8px" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by Payment ID or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={styles.clearBtn}
                title="Clear search"
              >
                ✕
              </button>
            )}
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
            <p style={{ textAlign: "center", color: "#64748B", padding: "40px 0", fontSize: "13px" }}>
              Loading payment records...
            </p>
          ) : filteredPayments.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={styles.emptyIconWrap}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <h4 style={styles.emptyTitle}>No Transactions Found</h4>
              <p style={styles.emptySub}>No payment logs match your search or status filter.</p>
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
                      <td style={styles.td}>
                        <span style={styles.idBadge}>#{p.id}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.codePill}>{p.razorpayPaymentId || "Pending"}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.codePill}>{p.razorpayOrderId}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "800", color: "#0F172A" }}>
                        ₹{p.amount?.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ ...styles.td, color: "#64748B", fontSize: "12px" }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setSelectedTx(p)}
                          style={styles.inspectBtn}
                        >
                          <span>Inspect</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={styles.modalTitle}>Transaction Audit Details</h3>
                  <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                    HMAC SHA-256 Signature Verification Record
                  </p>
                </div>
                <button style={styles.modalCloseIcon} onClick={() => setSelectedTx(null)}>✕</button>
              </div>

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
                  <span style={{ ...styles.modalVal, color: "#2563EB", fontWeight: "800" }}>₹{selectedTx.amount?.toFixed(2)} INR</span>
                </div>

                <div style={styles.modalItem}>
                  <span style={styles.modalLabel}>HMAC Security Status</span>
                  <span style={{ ...styles.modalVal, color: selectedTx.status === "SUCCESS" ? "#16A34A" : "#D97706", fontWeight: "700" }}>
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

      {/* Footer */}
      <footer style={styles.footer}>
        HealthConnect Admin Workspace &bull; Razorpay Settlement Logs
      </footer>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  let style = styles.badgeSuccess;
  if (status === "CREATED") style = styles.badgeCreated;
  else if (status === "FAILED") style = styles.badgeFailed;

  return <span style={style}>● {status}</span>;
};

const styles = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  topNav: {
    backgroundColor: "#FFFFFF",
    padding: "14px 24px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  leftNavRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    backgroundColor: "#F8FAFC",
    color: "#2563EB",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  topTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.3px",
  },
  adminTag: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontSize: "10px",
    fontWeight: "800",
    padding: "3px 8px",
    borderRadius: "12px",
    textTransform: "uppercase",
    border: "1px solid #DBEAFE",
  },
  avatarBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
  },

  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "42px",
    width: "220px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
    padding: "6px 0",
    zIndex: 1200,
  },
  dropdownHeader: {
    padding: "10px 16px",
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  dropdownUser: {
    margin: "0 0 2px 0",
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
  },
  dropdownEmail: {
    margin: 0,
    fontSize: "11px",
    color: "#64748B",
  },
  menuDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "4px 0",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "600",
  },
  dropdownLogoutBtn: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#DC2626",
    fontWeight: "600",
    background: "none",
    border: "none",
    textAlign: "left",
  },

  content: {
    maxWidth: "1140px",
    margin: "0 auto",
    padding: "24px 20px 60px",
    width: "100%",
    boxSizing: "border-box",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "18px 20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
  },
  metricHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricIconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    margin: "8px 0 2px 0",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.5px",
  },
  metricSub: {
    fontSize: "11px",
    color: "#64748B",
  },

  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "16px 20px",
    border: "1px solid #E2E8F0",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
  },
  searchWrapper: {
    flex: "1 1 280px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    padding: "0 12px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 0",
    border: "none",
    fontSize: "13px",
    outline: "none",
    background: "transparent",
    color: "#0F172A",
    fontWeight: "500",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: "13px",
    padding: "4px",
  },
  statusGroup: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  filterBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  filterBtnActive: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
  },

  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
  },
  emptyBox: {
    textAlign: "center",
    padding: "48px 20px",
  },
  emptyIconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
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

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "12px 16px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    borderBottom: "1px solid #E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  tr: {
    borderBottom: "1px solid #F1F5F9",
    transition: "background-color 0.1s ease",
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#0F172A",
  },
  idBadge: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#64748B",
    fontFamily: "monospace",
  },
  codePill: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "600",
    backgroundColor: "#F1F5F9",
    padding: "3px 8px",
    borderRadius: "6px",
    color: "#334155",
  },
  inspectBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #DBEAFE",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  badgeSuccess: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
  },
  badgeCreated: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#FEF3C7",
    color: "#D97706",
  },
  badgeFailed: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
    padding: "20px",
    boxSizing: "border-box",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    padding: "24px",
    maxWidth: "520px",
    width: "100%",
    boxShadow: "0 20px 48px rgba(15, 23, 42, 0.2)",
    border: "1px solid #E2E8F0",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
  },
  modalCloseIcon: {
    background: "none",
    border: "none",
    fontSize: "16px",
    color: "#94A3B8",
    cursor: "pointer",
    padding: "4px",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  modalItem: {
    backgroundColor: "#F8FAFC",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
  },
  modalLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    display: "block",
    marginBottom: "3px",
  },
  modalVal: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCodeVal: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#334155",
    fontFamily: "monospace",
    wordBreak: "break-all",
  },
  signatureBox: {
    display: "block",
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#475569",
    wordBreak: "break-all",
    backgroundColor: "#FFFFFF",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #E2E8F0",
  },
  closeModalBtn: {
    padding: "10px 18px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    padding: "20px",
    color: "#94A3B8",
    fontSize: "12px",
    borderTop: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    marginTop: "auto",
  },
};

export default AdminPayments;
