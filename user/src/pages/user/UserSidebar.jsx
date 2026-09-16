function UserSidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: "overview", label: "Home", icon: "🏠" },
    { id: "book", label: "Find Doctors", icon: "🔍" },
    { id: "my-appointments", label: "My Consultations", icon: "📅" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Navigation Links */}
      <ul style={styles.menuList}>
        <span style={styles.menuHeader}>MAIN MENU</span>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li
              key={item.id}
              style={isActive ? { ...styles.menuItem, ...styles.active } : styles.menuItem}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>

      {/* Hospital Support Mini Card at Bottom */}
      <div style={styles.supportCard}>
        <div style={styles.supportBadge}>● 24/7 Live Support</div>
        <h4 style={styles.supportTitle}>Medical Emergency?</h4>
        <p style={styles.supportDesc}>Contact our immediate triage and ambulance line.</p>
        <a href="tel:108" style={styles.callSupportBtn}>
          📞 Dial Helpline
        </a>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { 
    width: "240px", 
    backgroundColor: "#FFFFFF", 
    borderRight: "1px solid rgba(226, 232, 240, 0.8)", 
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  menuHeader: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: "0.06em",
    padding: "0 14px 6px",
    display: "block",
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
    padding: "11px 16px", 
    fontSize: "13px",     
    fontWeight: "600", 
    color: "#64748B", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    gap: "12px", 
    borderRadius: "9999px", 
    transition: "all 0.15s ease",
  },
  active: { 
    backgroundColor: "#EFF6FF", 
    color: "#3B82F6", 
    fontWeight: "700",
    boxShadow: "0 2px 6px rgba(59, 130, 246, 0.1)",
  },
  icon: { fontSize: "16px" },

  // Support Card
  supportCard: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "20px",
    padding: "16px",
    marginTop: "auto",
  },
  supportBadge: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#16A34A",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  supportTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  supportDesc: {
    fontSize: "11px",
    color: "#64748B",
    margin: "0 0 12px 0",
    lineHeight: "1.4",
  },
  callSupportBtn: {
    display: "block",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    border: "1px solid #CBD5E1",
    padding: "8px 12px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "700",
    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.03)",
  },
};

export default UserSidebar;