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
      <div style={styles.topNav}>
        <button onClick={() => navigate("/admin")} style={styles.backBtn}>
          &larr; Back to Admin Dashboard
        </button>
        <h2 style={styles.topTitle}>Hospital Appointment Registry</h2>
        <span style={styles.adminTag}>Admin Control</span>
      </div>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {/* Search & Filter Header Card */}
        <div style={styles.filterCard}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="Search by doctor, patient name, or ticket ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            <p style={{ textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: "13px" }}>
              Syncing appointment schedule...
            </p>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyBox}>
              <h3 style={styles.emptyTitle}>No Appointments Found</h3>
              <p style={styles.emptySub}>No appointment records match your search or filter.</p>
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
                    return (
                      <tr key={apptId} style={styles.tr}>
                        <td style={styles.td}>#{apptId}</td>
                        <td style={styles.td}>
                          <strong style={{ color: "#0f172a" }}>Dr. {a.doctorName}</strong>
                        </td>
                        <td style={styles.td}>{a.userName || "Patient"}</td>
                        <td style={styles.td}>
                          <span style={styles.ticketCode}>#{a.ticketId ? a.ticketId.substring(0, 8) : "N/A"}</span>
                        </td>
                        <td style={styles.td}>
                          <div>{a.appointmentDate || a.date}</div>
                          <span style={styles.timeSub}>
                            {a.startTime ? a.startTime.substring(0, 5) : "--:--"} - {a.endTime ? a.endTime.substring(0, 5) : "--:--"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <StatusBadge status={a.status} />
                        </td>
                        <td style={styles.td}>
                          {a.status !== "CANCELLED" && a.status !== "COMPLETED" ? (
                            <button
                              style={styles.cancelBtn}
                              onClick={() => cancelAppointment(apptId)}
                            >
                              Cancel Booking
                            </button>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>No Actions</span>
                          )}
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

  return <span style={style}>{status}</span>;
};

const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  topNav: {
    backgroundColor: "#ffffff",
    padding: "16px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  backBtn: {
    padding: "8px 14px",
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
  adminTag: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
  },

  contentWrapper: {
    flex: 1,
    padding: "24px 16px",
    maxWidth: "1100px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
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
  emptyBox: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySub: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
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
  ticketCode: {
    fontFamily: "monospace",
    fontSize: "12px",
    backgroundColor: "#f1f5f9",
    padding: "3px 8px",
    borderRadius: "6px",
    color: "#334155",
  },
  timeSub: {
    fontSize: "11px",
    color: "#64748b",
  },

  cancelBtn: {
    padding: "6px 12px",
    backgroundColor: "#ffffff",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  badgeBooked: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeCompleted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeCancelled: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  badgeRescheduled: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },

  footer: {
    backgroundColor: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    color: "#64748b",
    textAlign: "center",
    padding: "16px",
    fontSize: "12px",
    marginTop: "auto",
  },
};

export default ManageAppointments;