import { useEffect, useState } from "react";
import api from "../../api/api";

function UserOverview({ setActiveTab }) {
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/appointments/my")
      .then(res => {
        const upcoming = res.data.find(a => a.status === "BOOKED" || a.status === "RESCHEDULED");
        setNextAppointment(upcoming);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      {/* Google-style Clean Welcome Banner */}
      <div style={styles.welcomeBanner}>
        <div>
          <h1 style={styles.greetingTitle}>Welcome back</h1>
          <p style={styles.greetingSub}>Manage your consultations and medical appointments effortlessly.</p>
        </div>
        <button style={styles.primaryActionBtn} onClick={() => setActiveTab('book')}>
          + Book Appointment
        </button>
      </div>

      <div style={styles.dashboardGrid}>
        {/* Upcoming Appointment Card */}
        <div style={styles.gridCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Upcoming Consultation</h3>
            <span style={styles.statusPill}>● Live Status</span>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading details...</p>
          ) : nextAppointment ? (
            <div style={styles.appointmentBox}>
              <div style={styles.dateCircle}>
                <span style={styles.dateMonth}>
                  {new Date(nextAppointment.date).toLocaleString('default', { month: 'short' })}
                </span>
                <span style={styles.dateNum}>
                  {new Date(nextAppointment.date).getDate()}
                </span>
              </div>

              <div style={styles.appointmentInfo}>
                <h4 style={styles.doctorName}>Dr. {nextAppointment.doctorName}</h4>
                <p style={styles.appointmentTime}>{nextAppointment.startTime} - {nextAppointment.endTime}</p>
                <span style={styles.ticketBadge}>Ticket #{nextAppointment.ticketId ? nextAppointment.ticketId.substring(0, 8) : 'N/A'}</span>
              </div>

              <button style={styles.viewHistoryBtn} onClick={() => setActiveTab('my-appointments')}>
                View Details
              </button>
            </div>
          ) : (
            <div style={styles.emptyBox}>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#64748b" }}>No upcoming appointments scheduled.</p>
              <button style={styles.textLinkBtn} onClick={() => setActiveTab('book')}>
                Schedule a consultation now &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Quick Shortcuts Card */}
        <div style={styles.gridCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Quick Actions</h3>
          </div>

          <div style={styles.quickActionList}>
            <div style={styles.shortcutItem} onClick={() => setActiveTab('book')}>
              <div>
                <h4 style={styles.shortcutTitle}>Find a Doctor</h4>
                <p style={styles.shortcutDesc}>Browse available hospital specialists and slots.</p>
              </div>
              <span style={styles.arrowIcon}>&rarr;</span>
            </div>

            <div style={styles.shortcutItem} onClick={() => setActiveTab('my-appointments')}>
              <div>
                <h4 style={styles.shortcutTitle}>Appointment History</h4>
                <p style={styles.shortcutDesc}>View past visits, tickets, and digital prescriptions.</p>
              </div>
              <span style={styles.arrowIcon}>&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  welcomeBanner: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px 28px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  greetingTitle: {
    margin: "0 0 4px 0",
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.3px",
  },
  greetingSub: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b",
  },
  primaryActionBtn: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  gridCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statusPill: {
    fontSize: "11px",
    color: "#16a34a",
    fontWeight: "600",
  },

  appointmentBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  dateCircle: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "8px 12px",
    textAlign: "center",
    border: "1px solid #cbd5e1",
    minWidth: "55px",
  },
  dateMonth: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563eb",
    textTransform: "uppercase",
  },
  dateNum: {
    display: "block",
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  appointmentInfo: {
    flex: 1,
    minWidth: "140px",
  },
  doctorName: {
    margin: "0 0 2px 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  appointmentTime: {
    margin: "0 0 4px 0",
    fontSize: "13px",
    color: "#64748b",
  },
  ticketBadge: {
    fontSize: "11px",
    color: "#475569",
    backgroundColor: "#e2e8f0",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  viewHistoryBtn: {
    padding: "8px 14px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyBox: {
    padding: "24px 0",
    textAlign: "center",
  },
  textLinkBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
  },

  quickActionList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  shortcutItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  shortcutTitle: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  shortcutDesc: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },
  arrowIcon: {
    fontSize: "16px",
    color: "#94a3b8",
  },
};

export default UserOverview;