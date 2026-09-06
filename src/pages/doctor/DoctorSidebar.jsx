import React from "react";

function DoctorSidebar({ activeTab, setActiveTab, doctor, queueCount = 0 }) {
  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      ),
    },
    {
      id: "appointments",
      label: "Today's Queue",
      badge: queueCount > 0 ? queueCount : null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
    {
      id: "schedule",
      label: "Set Availability",
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
    },
    {
      id: "scan",
      label: "Scan Ticket",
      badge: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
          <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
          <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
          <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
          <rect x="7" y="7" width="10" height="10" rx="1"></rect>
        </svg>
      ),
    },
  ];

  const docInitial = doctor?.name ? doctor.name.charAt(0).toUpperCase() : "D";

  return (
    <aside style={styles.sidebar}>
      {/* Workspace Tag */}
      <div style={styles.workspaceHeader}>
        <span style={styles.workspaceTag}>Clinic Workspace</span>
      </div>

      {/* Nav Menu */}
      <ul style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={isActive ? styles.activeItem : styles.item}
            >
              <div style={styles.iconAndLabel}>
                <span style={isActive ? styles.activeIconWrap : styles.iconWrap}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={isActive ? styles.activeBadge : styles.inactiveBadge}>
                  {item.badge}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Doctor Identity Card Pinned to Bottom */}
      {doctor && (
        <div style={styles.doctorCardBottom}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatarCircle}>{docInitial}</div>
            <span style={styles.onlineDot} title="Active in Clinic"></span>
          </div>
          <div style={styles.docInfo}>
            <span style={styles.docName}>Dr. {doctor.name}</span>
            <span style={styles.docRole}>{doctor.specialization || "Specialist"}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "230px",
    backgroundColor: "#FFFFFF",
    borderRight: "1px solid #E2E8F0",
    padding: "20px 14px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
    boxSizing: "border-box",
  },
  workspaceHeader: {
    padding: "0 8px 16px 8px",
    borderBottom: "1px solid #F1F5F9",
    marginBottom: "12px",
  },
  workspaceTag: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  menu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
  },
  item: {
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#475569",
    fontSize: "13.5px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "all 0.15s ease",
    border: "1px solid transparent",
  },
  activeItem: {
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontSize: "13.5px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid #BFDBFE",
    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.08)",
  },
  iconAndLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  iconWrap: {
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconWrap: {
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: "800",
    padding: "2px 7px",
    borderRadius: "9999px",
  },
  inactiveBadge: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 7px",
    borderRadius: "9999px",
  },
  doctorCardBottom: {
    padding: "12px",
    borderRadius: "14px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "auto",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "13px",
  },
  onlineDot: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    border: "2px solid #FFFFFF",
  },
  docInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  docName: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#0F172A",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  docRole: {
    fontSize: "11px",
    color: "#64748B",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export default DoctorSidebar;