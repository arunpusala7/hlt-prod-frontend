import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data || []);
    } catch (e) {
      toast.error("Failed to load patient accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete patient user "${userName}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success(`User "${userName}" account deleted`);
      fetchUsers();
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.error(`User "${userName}" has already been deleted.`);
      } else {
        toast.error("Failed to delete user account");
      }
      fetchUsers();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const filteredUsers = users.filter((u) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(lowerSearch)) ||
      (u.email && u.email.toLowerCase().includes(lowerSearch))
    );
  });

  return (
    <div style={styles.pageContainer}>
      {/* Top Navbar */}
      <nav style={styles.topNav}>
        <div style={styles.leftNavRow}>
          <button onClick={() => navigate("/admin")} style={styles.backBtn}>
            &larr; Back
          </button>
          <h2 style={styles.topTitle}>Registered Patient Accounts</h2>
        </div>

        {/* Top Right Profile Icon */}
        <div style={{ position: "relative" }} ref={profileMenuRef}>
          <button
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            style={styles.avatarOnlyBtn}
            title="Admin Account & Menu"
          >
            <div style={styles.avatarCircle}>A</div>
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={styles.profileDropdown}
              >
                <div style={styles.dropdownHeader}>
                  <p style={styles.dropdownUser}>Administrator</p>
                  <p style={styles.dropdownEmail}>admin@gmail.com</p>
                  <span style={styles.onlineBadge}>● Master Admin</span>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin"); }}>
                  🏠 Admin Dashboard
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/appointments"); }}>
                  📅 Manage Appointments
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/doctors"); }}>
                  🏥 Active Doctor List
                </div>
                <div style={styles.dropdownItem} onClick={() => { setProfileDropdownOpen(false); navigate("/admin/payments"); }}>
                  💳 Payment Transactions
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />

                <button style={styles.dropdownLogoutBtn} onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {/* Header Action Bar */}
        <div style={styles.actionBar}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by patient name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.countBadge}>
            Total Patients: {filteredUsers.length}
          </div>
        </div>

        {/* User List Card */}
        <div style={styles.tableCard}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "40px 0", fontSize: "13px" }}>
              Loading patient accounts...
            </p>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <h4 style={{ color: "#0f172a", margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700" }}>No Patient Accounts Found</h4>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>No patient accounts match your search.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>User ID</th>
                    <th style={styles.th}>Patient Name</th>
                    <th style={styles.th}>Registered Email</th>
                    <th style={styles.th}>Account Role</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>#{u.id}</td>
                      <td style={styles.td}>
                        <strong style={{ color: "#0f172a" }}>{u.name}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.emailCode}>{u.email}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.roleBadge}>{u.role || "USER"}</span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          style={styles.deleteBtn}
                        >
                          🗑️ Delete User
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
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  topNav: {
    backgroundColor: "#ffffff",
    padding: "14px 28px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
  },
  leftNavRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backBtn: {
    padding: "6px 12px",
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

  avatarOnlyBtn: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    borderRadius: "50%",
  },
  avatarCircle: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
  },
  profileDropdown: {
    position: "absolute",
    right: 0,
    top: "120%",
    width: "220px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "10px",
    zIndex: 1000,
  },
  dropdownHeader: {
    padding: "4px 8px 8px 8px",
  },
  dropdownUser: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "800",
    color: "#0f172a",
  },
  dropdownEmail: {
    margin: "0 0 4px 0",
    fontSize: "11px",
    color: "#64748b",
  },
  onlineBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16a34a",
  },
  dropdownItem: {
    padding: "8px 10px",
    fontSize: "13px",
    color: "#334155",
    fontWeight: "500",
    borderRadius: "6px",
    cursor: "pointer",
  },
  dropdownLogoutBtn: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "4px",
  },

  contentWrapper: {
    maxWidth: "1100px",
    margin: "24px auto",
    padding: "0 16px",
    boxSizing: "border-box",
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "16px",
  },
  searchWrapper: {
    flex: "1 1 280px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  searchIcon: {
    fontSize: "13px",
    color: "#64748b",
    marginRight: "8px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 0",
    border: "none",
    fontSize: "13px",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
  },
  countBadge: {
    padding: "8px 14px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
  },

  tableCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
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
  roleBadge: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
  },
  emailCode: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#475569",
  },
  deleteBtn: {
    padding: "6px 12px",
    backgroundColor: "#ffffff",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default ManageUsers;
