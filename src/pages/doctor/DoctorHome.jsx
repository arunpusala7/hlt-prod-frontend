import React, { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";

function DoctorHome({ doctor, setActiveTab }) {
  const [fee, setFee] = useState(doctor?.consultationFee || 500);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);

  // Profile Bio Editor State
  const [profileData, setProfileData] = useState({
    qualifications: doctor?.qualifications || "MBBS, MD, Senior Specialist",
    experienceYears: doctor?.experienceYears || "10+ Years",
    hospitalAffiliation: doctor?.hospitalAffiliation || "HealthConnect Super Specialty Center",
    aboutBio: doctor?.aboutBio || "Dedicated specialist focusing on compassionate patient care, advanced clinical diagnostics, and holistic treatment plans.",
    successStories: doctor?.successStories || "Successfully treated over 2,500 patients with a 98% positive recovery outcome rate.",
    testimonials: doctor?.testimonials || "Dr. " + (doctor?.name || "Specialist") + " is extremely thorough, empathetic, and attentive. Highly recommended!",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  useEffect(() => {
    if (doctor?.id) {
      // Fetch fee
      api.get(`/api/payments/doctor/${doctor.id}/fee`)
        .then((res) => {
          if (res.data?.consultationFee) {
            setFee(res.data.consultationFee);
          }
        })
        .catch(() => {});

      // Fetch profile details
      api.get(`/api/doctors/${doctor.id}`)
        .then((res) => {
          if (res.data) {
            setProfileData({
              qualifications: res.data.qualifications || "MBBS, MD, Senior Specialist",
              experienceYears: res.data.experienceYears || "10+ Years",
              hospitalAffiliation: res.data.hospitalAffiliation || "HealthConnect Super Specialty Center",
              aboutBio: res.data.aboutBio || "Dedicated specialist focusing on compassionate patient care, advanced clinical diagnostics, and holistic treatment plans.",
              successStories: res.data.successStories || "Successfully treated over 2,500 patients with a 98% positive recovery outcome rate.",
              testimonials: res.data.testimonials || "Extremely thorough, empathetic, and attentive doctor!",
            });
          }
        })
        .catch(() => {});
    }
  }, [doctor]);

  const handleFeeUpdate = async () => {
    if (!doctor?.id) return;
    setIsUpdatingFee(true);
    try {
      await api.put(`/api/payments/doctor/${doctor.id}/fee`, { consultationFee: Number(fee) });
      toast.success(`Consultation fee updated to ₹${fee}!`);
    } catch (err) {
      toast.error("Failed to update consultation fee");
    } finally {
      setIsUpdatingFee(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await api.put("/api/doctor/profile", profileData);
      toast.success("Public Doctor Profile & Portfolio updated!");
      setShowProfileEditor(false);
    } catch (err) {
      toast.error("Failed to update doctor profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!doctor) return null;

  return (
    <div style={styles.container}>
      {/* Welcome Banner Card */}
      <div style={styles.welcomeBanner}>
        <div>
          <div style={styles.pillBadge}>Hospital Specialist Workspace</div>
          <h1 style={styles.heading}>Welcome back, Dr. {doctor.name}</h1>
          <p style={styles.subtext}>
            Review your patient appointments, check queue status, or manage your public profile portfolio.
          </p>
        </div>
      </div>

      {/* Consultation Fee & Public Profile Controls Row */}
      <div style={styles.controlsGrid}>
        {/* Fee Control Card */}
        <div style={styles.feeCard}>
          <div>
            <h3 style={styles.feeTitle}>💰 Consultation Fee Control</h3>
            <p style={styles.feeSub}>Set fee visible to patients on your profile page.</p>
          </div>
          <div style={styles.feeControlGroup}>
            <span style={styles.currencySymbol}>₹</span>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              style={styles.feeInput}
              min="0"
              step="50"
            />
            <button
              onClick={handleFeeUpdate}
              disabled={isUpdatingFee}
              style={styles.saveFeeBtn}
            >
              {isUpdatingFee ? "Saving..." : "Save Fee"}
            </button>
          </div>
        </div>

        {/* Profile Portfolio Card */}
        <div style={styles.feeCard}>
          <div>
            <h3 style={styles.feeTitle}>⭐ Public Profile & Bio Portfolio</h3>
            <p style={styles.feeSub}>Manage your qualifications, bio, success stories, and testimonials.</p>
          </div>
          <button
            onClick={() => setShowProfileEditor((prev) => !prev)}
            style={styles.editProfileBtn}
          >
            {showProfileEditor ? "Close Editor" : "✏️ Edit Public Portfolio"}
          </button>
        </div>
      </div>

      {/* Expandable Doctor Profile Editor */}
      {showProfileEditor && (
        <form onSubmit={handleProfileSave} style={styles.profileFormCard}>
          <h3 style={styles.formTitle}>Edit Public Doctor Profile</h3>
          <p style={styles.formSub}>This information will be displayed to patients on your dedicated Doctor Profile page.</p>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Medical Qualifications</label>
              <input
                type="text"
                value={profileData.qualifications}
                onChange={(e) => setProfileData({ ...profileData, qualifications: e.target.value })}
                placeholder="e.g. MBBS, MD (Cardiology), FACC"
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Years of Experience</label>
              <input
                type="text"
                value={profileData.experienceYears}
                onChange={(e) => setProfileData({ ...profileData, experienceYears: e.target.value })}
                placeholder="e.g. 12+ Years Experience"
                style={styles.input}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Hospital / Clinic Affiliation</label>
              <input
                type="text"
                value={profileData.hospitalAffiliation}
                onChange={(e) => setProfileData({ ...profileData, hospitalAffiliation: e.target.value })}
                placeholder="e.g. HealthConnect Super Specialty Center, Jubilee Hills"
                style={styles.input}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>About & Bio</label>
              <textarea
                rows="3"
                value={profileData.aboutBio}
                onChange={(e) => setProfileData({ ...profileData, aboutBio: e.target.value })}
                placeholder="Describe your medical background and care philosophy..."
                style={styles.textarea}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Success Stories & Milestones</label>
              <textarea
                rows="2"
                value={profileData.successStories}
                onChange={(e) => setProfileData({ ...profileData, successStories: e.target.value })}
                placeholder="Key medical achievements, successful operations, or milestones..."
                style={styles.textarea}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Patient Testimonials & Reviews</label>
              <textarea
                rows="2"
                value={profileData.testimonials}
                onChange={(e) => setProfileData({ ...profileData, testimonials: e.target.value })}
                placeholder="Featured feedback from cured patients..."
                style={styles.textarea}
              />
            </div>
          </div>

          <div style={{ textAlign: "right", marginTop: "16px" }}>
            <button type="submit" disabled={isUpdatingProfile} style={styles.saveProfileBtn}>
              {isUpdatingProfile ? "Saving Profile..." : "Publish Profile Changes"}
            </button>
          </div>
        </form>
      )}

      <div style={styles.statsGrid}>
        {/* Card 1: Today's Appointments */}
        <div style={styles.card} onClick={() => setActiveTab('appointments')}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.iconBox}>📋</div>
            <span style={styles.cardTag}>Live Queue</span>
          </div>
          <h3 style={styles.cardTitle}>Today's Consultations</h3>
          <p style={styles.cardDesc}>View patient lists, complete visits, and send digital prescriptions.</p>
          <span style={styles.linkBtn}>Open Queue &rarr;</span>
        </div>

        {/* Card 2: Update Schedule */}
        <div style={styles.card} onClick={() => setActiveTab('schedule')}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.iconBox}>⏰</div>
            <span style={styles.cardTag}>Slot Management</span>
          </div>
          <h3 style={styles.cardTitle}>Update Schedule</h3>
          <p style={styles.cardDesc}>Add morning/afternoon shifts or custom time slots for upcoming days.</p>
          <span style={styles.linkBtn}>Manage Slots &rarr;</span>
        </div>

        {/* Card 3: Camera QR Scanner */}
        <div style={styles.card} onClick={() => setActiveTab('scan')}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.iconBox}>📷</div>
            <span style={styles.cardTag}>Verification</span>
          </div>
          <h3 style={styles.cardTitle}>QR Ticket Scanner</h3>
          <p style={styles.cardDesc}>Scan patient smartphone QR codes for instant check-in at entry.</p>
          <span style={styles.linkBtn}>Open Scanner &rarr;</span>
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
    padding: "24px 28px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    marginBottom: "16px",
    border: "1px solid #e2e8f0",
  },
  pillBadge: {
    display: "inline-block",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "8px",
    textTransform: "uppercase",
  },
  heading: {
    margin: "0 0 6px 0",
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: "800",
  },
  subtext: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },

  // Fee Card & Profile Card
  feeCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "18px 24px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  feeTitle: {
    margin: "0 0 4px 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  feeSub: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },
  feeControlGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  currencySymbol: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  feeInput: {
    width: "80px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    outline: "none",
  },
  saveFeeBtn: {
    padding: "8px 14px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  editProfileBtn: {
    padding: "8px 14px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },

  // Profile Editor Form
  profileFormCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  },
  formTitle: {
    margin: "0 0 4px 0",
    fontSize: "18px",
    fontWeight: "800",
    color: "#0f172a",
  },
  formSub: {
    margin: "0 0 20px 0",
    fontSize: "13px",
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical",
  },
  saveProfileBtn: {
    padding: "10px 20px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  iconBox: {
    fontSize: "16px",
    background: "#eff6ff",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "1px solid #bfdbfe",
  },
  cardTag: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "6px",
  },
  cardTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  cardDesc: {
    margin: "0 0 16px 0",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.4",
  },
  linkBtn: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: "13px",
    display: "inline-block",
  },
};

export default DoctorHome;