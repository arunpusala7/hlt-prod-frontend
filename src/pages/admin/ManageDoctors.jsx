import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatDoctorName } from "../../utils/formatDoctorName";

function ManageDoctors() {
  const navigate = useNavigate();
  const [activeDoctors, setActiveDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    fetchActiveDoctors();
  }, []);

  const fetchActiveDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/doctors");
      setActiveDoctors(res.data || []);
    } catch (e) {
      toast.error("Failed to load doctor directory");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to delete Dr. ${doctorName}? This will remove their account and schedule.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/doctors/${doctorId}`);
      toast.success(`Dr. ${doctorName} account deleted`);
      fetchActiveDoctors();
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.error(`Dr. ${doctorName} has already been deleted.`);
      } else {
        toast.error("Failed to delete doctor account");
      }
      fetchActiveDoctors();
    }
  };

  const handleUpdateFee = async (doctorId, currentFee) => {
    const feeStr = window.prompt("Enter new consultation fee (₹):", currentFee || 500);
    if (!feeStr) return;
    const feeNum = parseFloat(feeStr);
    if (isNaN(feeNum) || feeNum < 0) {
      toast.error("Please enter a valid fee amount.");
      return;
    }
    try {
      await api.put(`/api/payments/doctor/${doctorId}/fee`, { consultationFee: feeNum });
      toast.success("Consultation fee updated successfully! 💳");
      fetchActiveDoctors();
    } catch (err) {
      toast.error("Failed to update consultation fee");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredDoctors = activeDoctors.filter((d) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(lowerSearch)) ||
      (d.specialization && d.specialization.toLowerCase().includes(lowerSearch)) ||
      (d.email && d.email.toLowerCase().includes(lowerSearch))
    );
  });

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
            <h2 style={styles.topTitle}>Doctor Directory & Specialist Registry</h2>
            <span style={styles.adminTag}>Directory Controls</span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div style={styles.navRight}>
          <button
            onClick={() => navigate("/admin/add-doctor")}
            style={styles.addDoctorNavBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Onboard Doctor</span>
          </button>

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
                  <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/users"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    <span>Registered Patients</span>
                  </div>
                  <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/payments"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginRight: "10px" }}>
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    <span>Payment Transactions</span>
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
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {/* Header Action Bar */}
        <div style={styles.actionBar}>
          <div style={styles.searchWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" style={{ marginRight: "8px" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by doctor name, specialization, or email..."
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={styles.countTag}>
              {filteredDoctors.length} Active Specialists
            </span>
          </div>
        </div>

        {/* Doctor List Card */}
        <div style={styles.tableCard}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#64748B", padding: "40px 0", fontSize: "13px" }}>
              Loading doctor accounts...
            </p>
          ) : filteredDoctors.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={styles.emptyIconWrap}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
              <h4 style={styles.emptyTitle}>No Doctors Found</h4>
              <p style={styles.emptySub}>No doctor accounts match your search criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Doctor Name</th>
                    <th style={styles.th}>Specialization</th>
                    <th style={styles.th}>Login Email</th>
                    <th style={styles.th}>Consultation Fee</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((d) => (
                    <tr key={d.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.idBadge}>#{d.id}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={styles.avatarBox}>
                            {d.name ? d.name.charAt(0).toUpperCase() : "D"}
                          </div>
                          <div>
                            <strong style={{ color: "#0F172A", display: "block" }}>
                              {formatDoctorName(d.name)}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>Specialist</span>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.specBadge}>{d.specialization || "General Medicine"}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.emailCode}>{d.email}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: "800", color: "#2563EB" }}>
                        ₹{d.consultationFee || 500}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleUpdateFee(d.id, d.consultationFee)}
                            style={styles.editFeeBtn}
                            title="Update Consultation Fee"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            <span>Edit Fee</span>
                          </button>

                          <button
                            onClick={() => handleDeleteDoctor(d.id, d.name)}
                            style={styles.deleteBtn}
                            title="Delete Doctor Account"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        HealthConnect Admin Workspace &bull; Doctor Directory Management
      </footer>
    </div>
  );
}

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
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  addDoctorNavBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "8px",
    border: "none",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
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

  contentWrapper: {
    flex: 1,
    padding: "24px 20px 60px",
    maxWidth: "1140px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    gap: "14px",
    flexWrap: "wrap",
  },
  searchWrapper: {
    flex: "1 1 320px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "0 14px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
  },
  searchInput: {
    width: "100%",
    padding: "11px 0",
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
  countTag: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    padding: "6px 14px",
    borderRadius: "20px",
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
  avatarBox: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
    flexShrink: 0,
  },
  specBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    padding: "3px 8px",
    borderRadius: "8px",
  },
  emailCode: {
    fontSize: "12px",
    color: "#475569",
    fontFamily: "monospace",
    backgroundColor: "#F8FAFC",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  editFeeBtn: {
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
  deleteBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    backgroundColor: "#FFFFFF",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
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

export default ManageDoctors;