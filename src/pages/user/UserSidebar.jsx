function UserSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: "🏠" },
    // Profile removed from here (still accessible via top-right menu)
    { id: "book", label: "Book Appointment", icon: "➕" },
    { id: "my-appointments", label: "History", icon: "📅" },
  ];

  return (
    <aside style={styles.sidebar}>
      <ul style={styles.menuList}>
        {menuItems.map((item) => (
          <li
            key={item.id}
            style={activeTab === item.id ? { ...styles.menuItem, ...styles.active } : styles.menuItem}
            onClick={() => setActiveTab(item.id)}
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
    padding: "20px 12px" 
  },
  menuList: { 
    listStyle: "none", 
    padding: 0, 
    margin: 0, 
    display: "flex", 
    flexDirection: "column", 
    gap: "6px" 
  },
  menuItem: { 
    padding: "10px 14px", 
    fontSize: "13px",     
    fontWeight: "500", 
    color: "#475569", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    borderRadius: "8px", 
    transition: "all 0.2s ease" 
  },
  active: { 
    backgroundColor: "#eff6ff", 
    color: "#2563eb", 
    fontWeight: "700" 
  },
  icon: { fontSize: "14px" },
};

export default UserSidebar;