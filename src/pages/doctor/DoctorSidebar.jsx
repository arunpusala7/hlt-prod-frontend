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
        {menuItems.map((item) => (
          <li
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={activeTab === item.id ? styles.activeItem : styles.item}
          >
            <span style={styles.icon}>{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "210px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #f1f5f9",
    padding: "20px 12px",
    display: "flex",
    flexDirection: "column",
  },
  menu: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  item: {
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.2s ease",
  },
  activeItem: {
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  icon: {
    fontSize: "14px",
  },
};

export default DoctorSidebar;