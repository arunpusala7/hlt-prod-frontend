import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";

function ManageAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.delete(`/api/admin/appointments/${id}`);
      toast.success("Appointment Cancelled by Admin");
      loadAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const verifyAppointment = async (ticketId) => {
    if (!ticketId) {
      toast.error("No valid ticket ID for check-in");
      return;
    }
    try {
      await api.post(`/api/appointments/verify/${ticketId}`);
      toast.success("Appointment checked in & completed! 🎟️");
      loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed";
      toast.error(msg);
    }
  };

  const downloadPdfPass = async (appt) => {
    const apptId = appt.appointmentId || appt.id;
    const ticketId = appt.ticketId;
    toast("Generating official PDF pass...", { icon: "📥" });
    try {
      let url = "";
      if (ticketId && !ticketId.startsWith("HC-")) {
        url = `/api/appointments/ticket/${ticketId}/pdf`;
      } else if (apptId) {
        url = `/api/appointments/${apptId}/pdf`;
      }
      if (!url) {
        toast.error("No ticket reference found");
        return;
      }
      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `HealthConnect-Ticket-${ticketId || apptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Official PDF pass downloaded!");
    } catch (err) {
      console.error("PDF download failed", err);
      toast.error("Failed to download PDF pass");
    }
  };

  const filtered = appointments.filter((a) => {
    const docName = a.doctorName || "";
    const userName = a.userName || "";
    const ticketId = a.ticketId || "";
    const lowerSearch = searchTerm.toLowerCase();

    const matchesSearch =
      docName.toLowerCase().includes(lowerSearch) ||
      userName.toLowerCase().includes(lowerSearch) ||
      ticketId.toLowerCase().includes(lowerSearch);

    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.pageContainer}>
      {/* Top Navbar */}
      <nav style={styles.topNav}>
        <div style={styles.navLeft}>
          <button onClick={() => navigate("/admin")} style={styles.backBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Dashboard</span>
          </button>
          <div style={styles.titleGroup}>
            <h2 style={styles.topTitle}>Hospital Appointment Registry</h2>
            <span style={styles.adminTag}>Admin Control</span>
          </div>
        </div>

        <div style={styles.navRight}>
          <span style={styles.countBadge}>
            {appointments.length} Total Bookings
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {/* Search & Filter Header Card */}
        <div style={styles.filterCard}>
          <div style={styles.searchWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" style={{ marginRight: "8px" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              style={styles.searchInput}
              placeholder="Search by doctor, patient name, or ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            {["ALL", "BOOKED", "COMPLETED", "CANCELLED", "RESCHEDULED"].map((st) => (
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

        {/* Appointments Table Card */}
        <div style={styles.tableCard}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#64748B", padding: "40px 0", fontSize: "13px" }}>
              Syncing appointment schedule...
            </p>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={styles.emptyIconWrap}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 style={styles.emptyTitle}>No Appointments Found</h3>
              <p style={styles.emptySub}>No appointment records match your search query or status filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Appt ID</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Ticket ID</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const apptId = a.appointmentId || a.id;
                    const docRawName = a.doctorName || "Specialist";
                    const formattedDocName = docRawName.toLowerCase().startsWith("dr.") ? docRawName : `Dr. ${docRawName}`;
                    return (
                      <tr key={apptId} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={styles.idBadge}>#{apptId}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={styles.docAvatar}>
                              {docRawName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: "#0F172A", display: "block" }}>{formattedDocName}</strong>
                              <span style={{ fontSize: "11px", color: "#64748B" }}>{a.doctorSpecialization || "Specialist"}</span>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: "600", color: "#334155" }}>{a.userName || "Patient"}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.ticketCode} title={a.ticketId || "No Ticket ID"}>
                            #{a.ticketId ? a.ticketId.substring(0, 8) : `HC-${apptId}`}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: "600", color: "#0F172A" }}>{a.appointmentDate || a.date}</div>
                          <span style={styles.timeSub}>
                            {a.startTime ? a.startTime.substring(0, 5) : "--:--"} - {a.endTime ? a.endTime.substring(0, 5) : "--:--"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={a.status} />
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                              <button
                                style={styles.verifyBtn}
                                onClick={() => verifyAppointment(a.ticketId)}
                                title="Verify digital ticket & check-in patient"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Check In</span>
                              </button>
                            )}

                            <button
                              style={styles.pdfBtn}
                              onClick={() => downloadPdfPass(a)}
                              title="Download official PDF ticket pass"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              <span>PDF</span>
                            </button>

                            {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                              <button
                                style={styles.cancelBtn}
                                onClick={() => cancelAppointment(apptId)}
                                title="Cancel appointment"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="15" y1="9" x2="9" y2="15"></line>
                                  <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        HealthConnect Admin Workspace &bull; Appointment Management Registry
      </footer>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  let style = styles.badgeBooked;
  if (status === "COMPLETED") style = styles.badgeCompleted;
  else if (status === "CANCELLED") style = styles.badgeCancelled;
  else if (status === "RESCHEDULED") style = styles.badgeRescheduled;

  return <span style={style}>● {status}</span>;
};

const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
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
  navLeft: {
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
  },
  countBadge: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    backgroundColor: "#F1F5F9",
    padding: "5px 12px",
    borderRadius: "20px",
  },

  contentWrapper: {
    flex: 1,
    padding: "24px 20px 60px",
    maxWidth: "1140px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
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
  docAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
    flexShrink: 0,
  },
  ticketCode: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#F1F5F9",
    padding: "3px 8px",
    borderRadius: "6px",
    color: "#334155",
  },
  timeSub: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "600",
  },
  verifyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    backgroundColor: "#F0FDF4",
    color: "#16A34A",
    border: "1px solid #BBF7D0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  cancelBtn: {
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
  pdfBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    backgroundColor: "#F8FAFC",
    color: "#475569",
    border: "1px solid #CBD5E1",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  badgeBooked: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
  },
  badgeCompleted: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
  },
  badgeCancelled: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
  },
  badgeRescheduled: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#FEF3C7",
    color: "#D97706",
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

export default ManageAppointments;