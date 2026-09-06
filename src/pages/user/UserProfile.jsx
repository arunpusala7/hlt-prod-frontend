import { useEffect, useState } from "react";
import api from "../../api/api";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import ThemeSelector from "../../components/ThemeSelector";

function UserProfile() {
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [user, setUser] = useState({
    name: localStorage.getItem("userName") || "Alex Rivera",
    email: localStorage.getItem("userEmail") || "alex.rivera@example.com",
    role: "Verified Patient",
    phone: localStorage.getItem("userPhone") || "+91 98765 43210",
    emergencyContact: localStorage.getItem("userEmergency") || "Sarah Rivera (Sister) - +91 98765 43211",
    bloodGroup: localStorage.getItem("userBloodGroup") || "O+",
    age: localStorage.getItem("userAge") || "28",
    gender: localStorage.getItem("userGender") || "Male",
    city: localStorage.getItem("userCity") || "Hyderabad, Telangana",
    smsAlerts: localStorage.getItem("userSmsAlerts") !== "false",
    emailAlerts: localStorage.getItem("userEmailAlerts") !== "false",
    whatsappAlerts: localStorage.getItem("userWhatsappAlerts") !== "false",
    memberId: localStorage.getItem("userMemberId") || "HC-MEM-84920",
  });

  const [editForm, setEditForm] = useState({ ...user });

  useEffect(() => {
    // 1. Fetch user data from backend
    api.get("/api/user/me")
      .then(res => {
        if (res.data) {
          const loadedName = res.data.name || localStorage.getItem("userName") || "Alex Rivera";
          const loadedEmail = res.data.email || localStorage.getItem("userEmail") || "alex.rivera@example.com";
          const stableId = res.data.id ? `HC-MEM-${10000 + Number(res.data.id)}` : "HC-MEM-84920";
          
          setUser(prev => ({
            ...prev,
            name: loadedName,
            email: loadedEmail,
            role: "Verified Patient",
            memberId: stableId,
          }));
          setEditForm(prev => ({
            ...prev,
            name: loadedName,
            email: loadedEmail,
            memberId: stableId,
          }));
          localStorage.setItem("userName", loadedName);
          localStorage.setItem("userEmail", loadedEmail);
          localStorage.setItem("userMemberId", stableId);
        }
      })
      .catch(() => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            const fallbackName = decoded.name || decoded.sub?.split('@')[0] || "Alex Rivera";
            const fallbackEmail = decoded.sub || decoded.email || "alex.rivera@example.com";
            setUser(prev => ({
              ...prev,
              name: fallbackName,
              email: fallbackEmail,
            }));
            setEditForm(prev => ({
              ...prev,
              name: fallbackName,
              email: fallbackEmail,
            }));
          } catch (e) {
            console.error("Invalid Token", e);
          }
        }
      });

    // 2. Fetch user appointment statistics
    api.get("/api/appointments/my")
      .then(res => {
        const all = res.data || [];
        const upcoming = all.filter(a => a.status === 'BOOKED' || a.status === 'RESCHEDULED').length;
        const completed = all.filter(a => a.status === 'COMPLETED').length;
        setStats({ total: all.length, upcoming, completed });
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setUser({ ...editForm });
    localStorage.setItem("userName", editForm.name);
    localStorage.setItem("userPhone", editForm.phone);
    localStorage.setItem("userEmergency", editForm.emergencyContact);
    localStorage.setItem("userBloodGroup", editForm.bloodGroup);
    localStorage.setItem("userAge", editForm.age);
    localStorage.setItem("userGender", editForm.gender);
    localStorage.setItem("userCity", editForm.city);
    setIsEditing(false);

    // Persist name to backend
    try {
      await api.put("/api/user/profile", { name: editForm.name.trim() });
      toast.success("Profile saved to your account!");
    } catch (err) {
      // Local save succeeded; backend sync failed silently
      toast.success("Profile details updated locally!");
      console.error("Backend profile sync failed:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  const togglePreference = (key) => {
    setUser(prev => {
      const updated = !prev[key];
      const next = { ...prev, [key]: updated };
      if (key === "smsAlerts") localStorage.setItem("userSmsAlerts", String(updated));
      if (key === "emailAlerts") localStorage.setItem("userEmailAlerts", String(updated));
      if (key === "whatsappAlerts") localStorage.setItem("userWhatsappAlerts", String(updated));
      toast.success(`${key === "smsAlerts" ? "SMS Reminders" : key === "emailAlerts" ? "Email Receipts" : "WhatsApp Updates"} ${updated ? "enabled" : "disabled"}`);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="profile-page-container">
      {/* 2-Column Responsive Layout (Stacked on mobile, side-by-side on desktop) */}
      <div className="profile-layout-grid">
        
        {/* =====================================================================
            LEFT COLUMN: HERO IDENTITY + STATS + DIGITAL MEMBERSHIP CARD
            ===================================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* 1. Identity Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="profile-card"
          >
            {/* Rich Medical Brand Cover */}
            <div style={styles.coverBanner}>
              <div style={styles.coverOverlayPattern}></div>
              <div style={styles.coverBadgePill}>
                <span style={styles.pulseGreenDot}></span>
                <span>Active Member</span>
              </div>
            </div>

            {/* Profile Avatar & Primary Info */}
            <div className="profile-header-main">
              <div style={styles.avatarWrapper}>
                <div style={styles.avatarLarge}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={styles.onlineBadge} title="Active Member"></div>
              </div>

              <div style={{ flex: 1, minWidth: "160px" }}>
                <div style={styles.nameRow}>
                  <h2 style={styles.userNameHeading}>{user.name}</h2>
                  <span style={styles.verifiedIcon} title="Verified Clinical Profile">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </span>
                </div>
                <p style={styles.userEmailSub}>{user.email}</p>
                <div style={styles.badgeRow}>
                  <span style={styles.roleBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Verified Patient
                  </span>
                  <span style={styles.memberIdBadge}>{user.memberId}</span>
                </div>
              </div>

              <div className="profile-header-actions">
                <button 
                  style={isEditing ? styles.cancelBtn : styles.editBtn}
                  onClick={() => {
                    if (isEditing) {
                      handleCancelEdit();
                    } else {
                      setEditForm({ ...user });
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? (
                    <>✕ Cancel</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* 2. Responsive Consultation Statistics Counter Tiles */}
          <div className="profile-stats-grid">
            <motion.div whileHover={{ y: -2 }} className="profile-card" style={styles.statTile}>
              <div style={{ ...styles.statIconBadge, backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <span style={styles.statNumber}>{stats.total}</span>
              <span style={styles.statTitle}>Total Visits</span>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="profile-card" style={styles.statTile}>
              <div style={{ ...styles.statIconBadge, backgroundColor: "#FEF3C7", color: "#D97706" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <span style={{ ...styles.statNumber, color: "#D97706" }}>{stats.upcoming}</span>
              <span style={styles.statTitle}>Upcoming</span>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="profile-card" style={styles.statTile}>
              <div style={{ ...styles.statIconBadge, backgroundColor: "#DCFCE7", color: "#16A34A" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <span style={{ ...styles.statNumber, color: "#16A34A" }}>{stats.completed}</span>
              <span style={styles.statTitle}>Completed</span>
            </motion.div>
          </div>

          {/* 3. HealthConnect Digital Membership Pass Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={styles.digitalPassCard}
          >
            <div style={styles.passHeader}>
              <div style={styles.passBrand}>
                <div style={styles.passLogoBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div>
                  <span style={styles.passBrandName}>HealthConnect</span>
                  <span style={styles.passSubTag}>DIGITAL PATIENT ID</span>
                </div>
              </div>
              <span style={styles.priorityChip}>PRIORITY OPD</span>
            </div>

            <div style={styles.passBody}>
              <div style={styles.passInfoSection}>
                <span style={styles.passLabel}>PATIENT NAME</span>
                <span style={styles.passValueName}>{user.name}</span>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  <div>
                    <span style={styles.passLabel}>BLOOD GROUP</span>
                    <span style={styles.passValueText}>{user.bloodGroup}</span>
                  </div>
                  <div>
                    <span style={styles.passLabel}>MEMBER ID</span>
                    <span style={styles.passValueText}>{user.memberId}</span>
                  </div>
                </div>
              </div>

              {/* Scannable Hospital Kiosk QR Code */}
              <div style={styles.qrContainer} onClick={() => setShowQrModal(true)} title="Tap to expand QR">
                <div style={styles.qrFrame}>
                  <QRCodeCanvas 
                    value={`HEALTHCONNECT:${user.memberId}:${user.name}`}
                    size={72}
                    level="H"
                  />
                </div>
                <span style={styles.qrLabel}>KIOSK SCAN</span>
              </div>
            </div>

            <div style={styles.passFooter}>
              <span>Valid across all partner clinic OPDs & diagnostic kiosks</span>
              <span style={{ color: "#60A5FA", fontWeight: "700", cursor: "pointer" }} onClick={() => setShowQrModal(true)}>
                View Large ↗
              </span>
            </div>
          </motion.div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: PERSONAL & CLINICAL DETAILS + PREFERENCES + SECURITY
            ===================================================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* 1. Personal & Medical Information Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="profile-card" 
            style={{ padding: "24px" }}
          >
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardHeading}>Personal & Medical Details</h3>
                <p style={styles.cardSubheading}>Primary contact and clinical identification info</p>
              </div>
              {isEditing && (
                <span style={styles.editingBadge}>Editing Mode</span>
              )}
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="profile-info-grid">
                
                {/* Full Name */}
                <div style={styles.infoField}>
                  <label style={styles.fieldLabel}>FULL NAME</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={styles.inputStyle}
                      placeholder="e.g. Alex Rivera"
                      required
                    />
                  ) : (
                    <div style={styles.displayFieldValue}>{user.name}</div>
                  )}
                </div>

                {/* Email Address (Read-only verified) */}
                <div style={styles.infoField}>
                  <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
                  <div style={styles.displayFieldValueWithTag}>
                    <span style={{ wordBreak: "break-all" }}>{user.email}</span>
                    <span style={styles.verifiedTag}>Verified</span>
                  </div>
                </div>

                {/* Mobile Number */}
                <div style={styles.infoField}>
                  <label style={styles.fieldLabel}>MOBILE PHONE</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={styles.inputStyle}
                      placeholder="+91 98765 43210"
                    />
                  ) : (
                    <div style={styles.displayFieldValue}>{user.phone}</div>
                  )}
                </div>

                {/* Blood Group */}
                <div style={styles.infoField}>
                  <label style={styles.fieldLabel}>BLOOD GROUP</label>
                  {isEditing ? (
                    <select 
                      value={editForm.bloodGroup} 
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      style={styles.selectStyle}
                    >
                      {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Not Known"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={styles.bloodBadgeDisplay}>
                      <span style={{ color: "#EF4444", fontWeight: "800" }}>🩸</span>
                      <span>{user.bloodGroup}</span>
                    </div>
                  )}
                </div>

                {/* Age */}
                <div style={styles.infoField}>
                  <label style={styles.fieldLabel}>AGE</label>
                  {isEditing ? (
                    <input 
                      type="number" 
                      min="1" 
                      max="120"
                      value={editForm.age} 
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                      style={styles.inputStyle}
                      placeholder="28"
                    />
                  ) : (
                    <div style={styles.displayFieldValue}>{user.age ? `${user.age} Years` : "28 Years"}</div>
                  )}
                </div>

                {/* Gender */}
                <div style={styles.infoField}>
                  <label style={styles.fieldLabel}>GENDER</label>
                  {isEditing ? (
                    <select 
                      value={editForm.gender} 
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      style={styles.selectStyle}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  ) : (
                    <div style={styles.displayFieldValue}>{user.gender}</div>
                  )}
                </div>

                {/* Emergency Contact (Full-width) */}
                <div style={{ ...styles.infoField, gridColumn: "1 / -1" }}>
                  <label style={styles.fieldLabel}>EMERGENCY CONTACT & RELATION</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.emergencyContact} 
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      style={styles.inputStyle}
                      placeholder="Name (Relation) - Phone Number"
                    />
                  ) : (
                    <div style={styles.displayFieldValue}>
                      <span style={{ color: "#F59E0B", marginRight: "6px" }}>⚠️</span>
                      {user.emergencyContact}
                    </div>
                  )}
                </div>

                {/* Residential City */}
                <div style={{ ...styles.infoField, gridColumn: "1 / -1" }}>
                  <label style={styles.fieldLabel}>RESIDENTIAL LOCATION / CITY</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.city} 
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      style={styles.inputStyle}
                      placeholder="City, State"
                    />
                  ) : (
                    <div style={styles.displayFieldValue}>
                      <span style={{ marginRight: "6px" }}>📍</span>
                      {user.city}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Mode Save / Cancel Action Buttons */}
              {isEditing && (
                <div style={styles.formActionRow}>
                  <button type="button" style={styles.formCancelBtn} onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.formSaveBtn}>
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </motion.div>

          {/* 2. Visual Theme & Appearance Selection Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <ThemeSelector />
          </motion.div>

          {/* 3. Care Preferences & Notifications Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="profile-card" 
            style={{ padding: "24px" }}
          >
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardHeading}>Care Preferences & Alerts</h3>
                <p style={styles.cardSubheading}>Manage real-time appointment reminders and consultation receipts</p>
              </div>
            </div>

            {/* Toggle 1: SMS Reminders */}
            <div className="profile-pref-row">
              <div style={{ flex: 1, paddingRight: "12px" }}>
                <h4 style={styles.prefTitle}>SMS Appointment Reminders</h4>
                <p style={styles.prefDesc}>Receive automated SMS notifications with OPD token 1 hour prior to your visit.</p>
              </div>
              <button 
                type="button"
                style={user.smsAlerts ? styles.toggleActive : styles.toggleInactive}
                onClick={() => togglePreference("smsAlerts")}
                title={user.smsAlerts ? "Disable SMS Reminders" : "Enable SMS Reminders"}
              >
                <div style={user.smsAlerts ? styles.toggleKnobActive : styles.toggleKnobInactive}></div>
              </button>
            </div>

            <div style={styles.prefDivider}></div>

            {/* Toggle 2: Email Prescriptions */}
            <div className="profile-pref-row">
              <div style={{ flex: 1, paddingRight: "12px" }}>
                <h4 style={styles.prefTitle}>Email Prescriptions & Invoices</h4>
                <p style={styles.prefDesc}>Receive verified clinical passes, PDF advice slips, and Razorpay invoices in your inbox.</p>
              </div>
              <button 
                type="button"
                style={user.emailAlerts ? styles.toggleActive : styles.toggleInactive}
                onClick={() => togglePreference("emailAlerts")}
                title={user.emailAlerts ? "Disable Email Receipts" : "Enable Email Receipts"}
              >
                <div style={user.emailAlerts ? styles.toggleKnobActive : styles.toggleKnobInactive}></div>
              </button>
            </div>

            <div style={styles.prefDivider}></div>

            {/* Toggle 3: WhatsApp Updates */}
            <div className="profile-pref-row">
              <div style={{ flex: 1, paddingRight: "12px" }}>
                <h4 style={styles.prefTitle}>WhatsApp Care Connect</h4>
                <p style={styles.prefDesc}>Receive direct doctor queue updates, instant reschedule alerts, and payment receipts via WhatsApp.</p>
              </div>
              <button 
                type="button"
                style={user.whatsappAlerts ? styles.toggleActive : styles.toggleInactive}
                onClick={() => togglePreference("whatsappAlerts")}
                title={user.whatsappAlerts ? "Disable WhatsApp Alerts" : "Enable WhatsApp Alerts"}
              >
                <div style={user.whatsappAlerts ? styles.toggleKnobActive : styles.toggleKnobInactive}></div>
              </button>
            </div>
          </motion.div>

          {/* 3. Account Security & Session Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="profile-card" 
            style={{ padding: "24px" }}
          >
            <div style={styles.cardHeaderRow}>
              <div>
                <h3 style={styles.cardHeading}>Account Security & Access</h3>
                <p style={styles.cardSubheading}>Session authentication and device logout</p>
              </div>
            </div>

            <div style={styles.securityItemRow}>
              <div style={styles.securityInfo}>
                <div style={styles.securityIconBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <span style={styles.securityMainTitle}>Active Encrypted Session</span>
                  <p style={styles.securitySubText}>Signed in with JWT Token &bull; TLS 1.3 256-bit encryption</p>
                </div>
              </div>

              <button style={styles.logoutPillBtn} onClick={handleLogout} title="Sign Out of this Device">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Large Scannable Digital ID Pass Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div style={styles.modalBackdrop} onClick={() => setShowQrModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={styles.qrModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.qrModalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0F172A" }}>
                    Patient Digital Pass
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Scan at hospital check-in kiosk</span>
                </div>
                <button style={styles.closeBtn} onClick={() => setShowQrModal(false)}>✕</button>
              </div>

              <div style={styles.qrLargeBox}>
                <QRCodeCanvas 
                  value={`HEALTHCONNECT:${user.memberId}:${user.name}:${user.email}`}
                  size={180}
                  level="H"
                />
              </div>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#0F172A", display: "block" }}>
                  {user.name}
                </span>
                <span style={{ fontSize: "12px", color: "#3B82F6", fontWeight: "700" }}>
                  {user.memberId}
                </span>
              </div>

              <button style={styles.qrModalCloseBtn} onClick={() => setShowQrModal(false)}>
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  coverBanner: {
    height: "100px",
    background: "linear-gradient(135deg, #0A192F 0%, #1E3A8A 55%, #2563EB 100%)",
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    padding: "14px 18px",
    overflow: "hidden",
  },
  coverOverlayPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
    backgroundSize: "16px 16px",
    pointerEvents: "none",
  },
  coverBadgePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(8px)",
    padding: "4px 12px",
    borderRadius: "9999px",
    color: "#FFFFFF",
    fontSize: "11px",
    fontWeight: "700",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    position: "relative",
    zIndex: 2,
  },
  pulseGreenDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    boxShadow: "0 0 8px #10B981",
  },
  avatarWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  avatarLarge: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "800",
    border: "4px solid #FFFFFF",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.28)",
  },
  onlineBadge: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    border: "2.5px solid #FFFFFF",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "2px",
    flexWrap: "wrap",
  },
  userNameHeading: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  verifiedIcon: {
    display: "inline-flex",
    alignItems: "center",
  },
  userEmailSub: {
    fontSize: "12.5px",
    color: "#64748B",
    margin: "0 0 8px 0",
    wordBreak: "break-all",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  roleBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    padding: "3px 10px",
    borderRadius: "9999px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    border: "1px solid #DBEAFE",
  },
  memberIdBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    padding: "3px 10px",
    borderRadius: "9999px",
  },
  editBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#0F172A",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  cancelBtn: {
    backgroundColor: "rgba(254, 226, 226, 0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    color: "#DC2626",
    border: "1px solid rgba(254, 202, 202, 0.9)",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  statTile: {
    padding: "16px 12px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--stat-card-bg, rgba(255, 255, 255, 0.75))",
    backdropFilter: "var(--card-blur, blur(16px))",
    WebkitBackdropFilter: "var(--card-blur, blur(16px))",
    border: "var(--card-border, 1px solid rgba(255, 255, 255, 0.9))",
    boxShadow: "var(--card-shadow, 0 8px 24px -4px rgba(15, 23, 42, 0.04))",
  },
  statIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "6px",
  },
  statNumber: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    display: "block",
    lineHeight: "1.1",
    letterSpacing: "-0.02em",
  },
  statTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    marginTop: "3px",
  },
  digitalPassCard: {
    background: "linear-gradient(135deg, rgba(10, 25, 47, 0.95) 0%, rgba(17, 34, 64, 0.92) 55%, rgba(30, 58, 138, 0.95) 100%)",
    borderRadius: "24px",
    padding: "20px",
    color: "#FFFFFF",
    boxShadow: "0 16px 36px -4px rgba(10, 25, 47, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    position: "relative",
    overflow: "hidden",
  },
  passHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px dashed rgba(255, 255, 255, 0.15)",
    paddingBottom: "12px",
    marginBottom: "14px",
  },
  passBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  passLogoBox: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  passBrandName: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#FFFFFF",
    display: "block",
    lineHeight: "1.2",
  },
  passSubTag: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#93C5FD",
    letterSpacing: "0.06em",
  },
  priorityChip: {
    fontSize: "9.5px",
    fontWeight: "800",
    color: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    padding: "2px 8px",
    borderRadius: "9999px",
    letterSpacing: "0.05em",
  },
  passBody: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
  },
  passInfoSection: {
    flex: 1,
  },
  passLabel: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: "0.06em",
    display: "block",
  },
  passValueName: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#FFFFFF",
    display: "block",
    marginTop: "2px",
  },
  passValueText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#F8FAFC",
    display: "block",
    marginTop: "1px",
  },
  qrContainer: {
    textAlign: "center",
    cursor: "pointer",
  },
  qrFrame: {
    backgroundColor: "#FFFFFF",
    padding: "6px",
    borderRadius: "12px",
    display: "inline-block",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  qrLabel: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#93C5FD",
    letterSpacing: "0.06em",
    display: "block",
    marginTop: "4px",
  },
  passFooter: {
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    paddingTop: "10px",
    marginTop: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
    color: "#94A3B8",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "10px",
    flexWrap: "wrap",
  },
  cardHeading: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 3px 0",
    letterSpacing: "-0.01em",
  },
  cardSubheading: {
    fontSize: "12.5px",
    color: "#64748B",
    margin: 0,
  },
  editingBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    border: "1px solid #BFDBFE",
    padding: "3px 10px",
    borderRadius: "9999px",
  },
  infoField: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  fieldLabel: {
    fontSize: "10.5px",
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: "0.05em",
  },
  displayFieldValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    padding: "8px 0",
  },
  displayFieldValueWithTag: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    padding: "8px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  verifiedTag: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    padding: "2px 8px",
    borderRadius: "9999px",
    display: "inline-block",
  },
  bloodBadgeDisplay: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    padding: "8px 0",
  },
  inputStyle: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "var(--input-border, 1.5px solid rgba(226, 232, 240, 0.85))",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    backgroundColor: "var(--input-bg, rgba(248, 250, 252, 0.75))",
    backdropFilter: "var(--card-blur, blur(10px))",
    WebkitBackdropFilter: "var(--card-blur, blur(10px))",
    outline: "none",
    transition: "all 0.15s ease",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
  },
  selectStyle: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "var(--input-border, 1.5px solid rgba(226, 232, 240, 0.85))",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0F172A",
    backgroundColor: "var(--input-bg, rgba(248, 250, 252, 0.75))",
    backdropFilter: "var(--card-blur, blur(10px))",
    WebkitBackdropFilter: "var(--card-blur, blur(10px))",
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
    boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.03)",
  },
  formActionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "22px",
    paddingTop: "16px",
    borderTop: "1px solid #F1F5F9",
  },
  formCancelBtn: {
    backgroundColor: "#F1F5F9",
    color: "#475569",
    border: "none",
    padding: "10px 20px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  formSaveBtn: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    padding: "10px 24px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
  },
  prefTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 3px 0",
  },
  prefDesc: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
    lineHeight: "1.45",
  },
  prefDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "8px 0",
  },
  toggleActive: {
    width: "46px",
    height: "26px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
    transition: "background-color 0.2s ease",
  },
  toggleInactive: {
    width: "46px",
    height: "26px",
    borderRadius: "9999px",
    backgroundColor: "#E2E8F0",
    border: "none",
    padding: "2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexShrink: 0,
    transition: "background-color 0.2s ease",
  },
  toggleKnobActive: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
  },
  toggleKnobInactive: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
  },
  securityItemRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    backgroundColor: "rgba(248, 250, 252, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    padding: "16px",
    borderRadius: "18px",
    border: "1px solid rgba(226, 232, 240, 0.85)",
    boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
  },
  securityInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  securityIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "#ECFDF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  securityMainTitle: {
    fontSize: "13.5px",
    fontWeight: "700",
    color: "#0F172A",
    display: "block",
  },
  securitySubText: {
    fontSize: "11.5px",
    color: "#64748B",
    margin: "2px 0 0 0",
  },
  logoutPillBtn: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    padding: "9px 18px",
    borderRadius: "9999px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "16px",
  },
  qrModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "28px",
    padding: "24px",
    width: "100%",
    maxWidth: "340px",
    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
  },
  qrModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  closeBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#F1F5F9",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrLargeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #E2E8F0",
  },
  qrModalCloseBtn: {
    width: "100%",
    marginTop: "20px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    border: "none",
    padding: "12px",
    borderRadius: "9999px",
    fontSize: "13.5px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default UserProfile;