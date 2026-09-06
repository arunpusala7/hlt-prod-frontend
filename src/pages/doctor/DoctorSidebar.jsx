function DoctorSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "appointments", label: "Today's Queue", icon: "📅" },
    { id: "schedule", label: "Set Availability", icon: "⏰" },
    { id: "scan", label: "Scan Ticket", icon: "📷" },
  ];

  return (
    <aside style={styles.sidebar}>
      <ul style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={isActive ? styles.activeItem : styles.item}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    backgroundColor: "#FFFFFF",
    borderRight: "1px solid rgba(226, 232, 240, 0.8)",
    padding: "24px 14px",
    display: "flex",
    flexDirection: "column",
  },
  menu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  item: {
    padding: "11px 16px",
    borderRadius: "9999px",
    cursor: "pointer",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.15s ease",
  },
  activeItem: {
    padding: "11px 16px",
    borderRadius: "9999px",
    cursor: "pointer",
    backgroundColor: "#EFF6FF",
    color: "#3B82F6",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  icon: {
    fontSize: "15px",
  },
};

export default DoctorSidebar;