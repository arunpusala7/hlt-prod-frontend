import React, { useState, useEffect } from "react";
import api from "../../api/api";
import toast from "react-hot-toast";

function DoctorHome({ doctor, setActiveTab }) {
  const [fee, setFee] = useState(doctor?.consultationFee || 500);
  const [isUpdatingFee, setIsUpdatingFee] = useState(false);
  const [todayStats, setTodayStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

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

      // Fetch live today's stats via /api/doctor/stats (aggregated endpoint)
      api.get("/api/doctor/stats")
        .then((res) => {
          const s = res.data;
          if (s) {
            setTodayStats({
              total: (s.todayAppointmentsCount || 0),
              pending: (s.upcomingAppointmentsCount || 0),
              completed: (s.completedAppointmentsCount || 0),
              cancelled: (s.cancelledAppointmentsCount || 0),
            });
            if (s.consultationFee) setFee(s.consultationFee);
          }
        })
        .catch(() => {
          // Fallback: fetch today's stats from individual appointments
          const today = new Date().toISOString().split("T")[0];
          api.get(`/api/doctor/appointments?date=${today}`)
            .then((res) => {
              const appts = res.data || [];
              const pending = appts.filter(a => a.status === "BOOKED" || a.status === "RESCHEDULED").length;
              const completed = appts.filter(a => a.status === "COMPLETED").length;
              const cancelled = appts.filter(a => a.status === "CANCELLED").length;
              setTodayStats({ total: appts.length, pending, completed, cancelled });
            })
            .catch(() => {});
        });
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

  const adjustFee = (delta) => {
    setFee((prev) => Math.max(0, Number(prev) + delta));
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

  const currentHour = new Date().getHours();
  const greetingTime = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={styles.container}>
      {/* 1. Hero Welcome Banner */}
      <div style={styles.welcomeBanner}>
        <div style={styles.bannerContent}>
          <div style={styles.badgeRow}>
            <span style={styles.pillBadge}>Hospital Specialist</span>
            <span style={styles.specBadge}>{doctor.specialization || "General Medicine"}</span>
            <span style={styles.hospitalTag}>Jubilee Hills Super Specialty</span>
          </div>
          <h1 style={styles.heading}>{greetingTime}, Dr. {doctor.name}</h1>
          <p style={styles.subtext}>
            {todayStats.pending > 0 ? (
              <>You have <strong style={{ color: "#2563EB" }}>{todayStats.pending} patients</strong> waiting in today's queue. Ready for consultations?</>
            ) : (
              <>All patient consultations are up to date. Review queue status or update your schedule slots.</>
            )}
          </p>
        </div>

        <button 
          onClick={() => setActiveTab("appointments")}
          style={styles.bannerCtaBtn}
        >
          <span>Open Queue ({todayStats.pending})</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      {/* 2. Live KPI Metrics Row (4 Cards) */}
      <div style={styles.kpiGrid}>
        {/* Metric 1: Total Appointments */}
        <div style={styles.kpiCard} onClick={() => setActiveTab("appointments")}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Today's Patients</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div style={styles.kpiValue}>{todayStats.total}</div>
          <span style={styles.kpiSub}>Total scheduled bookings</span>
        </div>

        {/* Metric 2: Waiting in Queue */}
        <div style={styles.kpiCard} onClick={() => setActiveTab("appointments")}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Waiting in Queue</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: "#FEF3C7", color: "#D97706" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: todayStats.pending > 0 ? "#D97706" : "#0F172A" }}>
            {todayStats.pending}
          </div>
          <span style={styles.kpiSub}>Awaiting consultation</span>
        </div>

        {/* Metric 3: Completed Visits */}
        <div style={styles.kpiCard} onClick={() => setActiveTab("appointments")}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Completed Visits</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: "#DCFCE7", color: "#16A34A" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div style={{ ...styles.kpiValue, color: "#16A34A" }}>{todayStats.completed}</div>
          <span style={styles.kpiSub}>Prescriptions issued</span>
        </div>

        {/* Metric 4: Consultation Fee */}
        <div style={styles.kpiCard}>
          <div style={styles.kpiTopRow}>
            <span style={styles.kpiLabel}>Consultation Fee</span>
            <div style={{ ...styles.kpiIconWrap, backgroundColor: "#F3E8FF", color: "#9333EA" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
          </div>
          <div style={styles.kpiValue}>₹{fee}</div>
          <span style={styles.kpiSub}>Active patient slot rate</span>
        </div>
      </div>

      {/* 3. Consultation Fee & Public Profile Controls */}
      <div style={styles.controlsGrid}>
        {/* Fee Control Card */}
        <div style={styles.controlCard}>
          <div style={styles.controlCardHeader}>
            <div>
              <h3 style={styles.controlTitle}>Consultation Fee Setting</h3>
              <p style={styles.controlSub}>Set the fee patients see when reserving your appointment slots.</p>
            </div>
          </div>

          <div style={styles.feeControlRow}>
            <div style={styles.feeInputWrapper}>
              <span style={styles.currencyPrefix}>₹</span>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                style={styles.feeNumericInput}
                min="0"
                step="50"
              />
            </div>

            <div style={styles.stepperGroup}>
              <button onClick={() => adjustFee(50)} style={styles.stepBtn}>+₹50</button>
              <button onClick={() => adjustFee(100)} style={styles.stepBtn}>+₹100</button>
            </div>

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
        <div style={styles.controlCard}>
          <div style={styles.controlCardHeader}>
            <div>
              <h3 style={styles.controlTitle}>Public Profile & Portfolio</h3>
              <p style={styles.controlSub}>Manage your qualifications, medical bio, and patient testimonials.</p>
            </div>
          </div>

          <div style={styles.profileSummaryRow}>
            <div style={styles.summaryPill}>
              <span style={styles.summaryLabel}>Qualifications:</span>
              <span style={styles.summaryVal}>{profileData.qualifications}</span>
            </div>
            <div style={styles.summaryPill}>
              <span style={styles.summaryLabel}>Exp:</span>
              <span style={styles.summaryVal}>{profileData.experienceYears}</span>
            </div>
          </div>

          <button
            onClick={() => setShowProfileEditor((prev) => !prev)}
            style={showProfileEditor ? styles.closeProfileBtn : styles.editProfileBtn}
          >
            {showProfileEditor ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: "6px" }}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Close Bio Editor</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: "6px" }}>
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span>Edit Public Bio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Expandable Doctor Profile Editor */}
      {showProfileEditor && (
        <form onSubmit={handleProfileSave} style={styles.profileFormCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>Edit Public Doctor Profile</h3>
            <p style={styles.formSub}>This information displays directly to patients on your dedicated Doctor Profile page.</p>
          </div>

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
              <label style={styles.label}>About & Medical Bio</label>
              <textarea
                rows="3"
                value={profileData.aboutBio}
                onChange={(e) => setProfileData({ ...profileData, aboutBio: e.target.value })}
                placeholder="Describe your clinical expertise and patient care philosophy..."
                style={styles.textarea}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Success Stories & Milestones</label>
              <textarea
                rows="2"
                value={profileData.successStories}
                onChange={(e) => setProfileData({ ...profileData, successStories: e.target.value })}
                placeholder="Key clinical milestones or successful case outcomes..."
                style={styles.textarea}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Patient Testimonials & Feedback</label>
              <textarea
                rows="2"
                value={profileData.testimonials}
                onChange={(e) => setProfileData({ ...profileData, testimonials: e.target.value })}
                placeholder="Featured patient recovery reviews..."
                style={styles.textarea}
              />
            </div>
          </div>

          <div style={styles.formFooter}>
            <button
              type="button"
              onClick={() => setShowProfileEditor(false)}
              style={styles.cancelProfileBtn}
            >
              Cancel
            </button>
            <button type="submit" disabled={isUpdatingProfile} style={styles.saveProfileBtn}>
              {isUpdatingProfile ? "Publishing Changes..." : "Publish Profile Changes"}
            </button>
          </div>
        </form>
      )}

      {/* 5. Quick Shortcuts Grid (3 Action Cards) */}
      <div style={styles.shortcutsGrid}>
        {/* Card 1: Today's Queue */}
        <div style={styles.shortcutCard} onClick={() => setActiveTab("appointments")}>
          <div style={styles.shortcutTop}>
            <div style={{ ...styles.shortcutIconWrap, backgroundColor: "#EFF6FF", color: "#2563EB" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <span style={styles.shortcutTag}>Queue</span>
          </div>
          <h3 style={styles.shortcutTitle}>Today's Queue</h3>
          <p style={styles.shortcutDesc}>Review arriving patients, view past history, and send digital prescriptions.</p>
          <span style={styles.shortcutLink}>Open Queue &rarr;</span>
        </div>

        {/* Card 2: Schedule Slots */}
        <div style={styles.shortcutCard} onClick={() => setActiveTab("schedule")}>
          <div style={styles.shortcutTop}>
            <div style={{ ...styles.shortcutIconWrap, backgroundColor: "#F0FDF4", color: "#16A34A" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span style={styles.shortcutTag}>Slots</span>
          </div>
          <h3 style={styles.shortcutTitle}>Set Availability</h3>
          <p style={styles.shortcutDesc}>Publish morning/evening shifts or custom time slots on your patient calendar.</p>
          <span style={styles.shortcutLink}>Manage Slots &rarr;</span>
        </div>

        {/* Card 3: Camera QR Scanner */}
        <div style={styles.shortcutCard} onClick={() => setActiveTab("scan")}>
          <div style={styles.shortcutTop}>
            <div style={{ ...styles.shortcutIconWrap, backgroundColor: "#FDF2F8", color: "#DB2777" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                <rect x="7" y="7" width="10" height="10" rx="1"></rect>
              </svg>
            </div>
            <span style={styles.shortcutTag}>Verification</span>
          </div>
          <h3 style={styles.shortcutTitle}>QR Ticket Scanner</h3>
          <p style={styles.shortcutDesc}>Scan patient digital tickets via camera for instant clinic gate verification.</p>
          <span style={styles.shortcutLink}>Open Scanner &rarr;</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  welcomeBanner: {
    backgroundColor: "#FFFFFF",
    padding: "24px 28px",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
  },
  bannerContent: {
    flex: 1,
    minWidth: "280px",
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "10px",
  },
  pillBadge: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #DBEAFE",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  specBadge: {
    backgroundColor: "#F1F5F9",
    color: "#334155",
    padding: "3px 10px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: "700",
  },
  hospitalTag: {
    fontSize: "11.5px",
    color: "#64748B",
    fontWeight: "600",
  },
  heading: {
    margin: "0 0 6px 0",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.02em",
  },
  subtext: {
    margin: 0,
    fontSize: "13.5px",
    color: "#475569",
    lineHeight: "1.5",
  },
  bannerCtaBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    padding: "11px 20px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
    transition: "transform 0.15s ease",
  },

  // KPI Metrics Grid
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  kpiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "18px 20px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  kpiTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  kpiLabel: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#64748B",
  },
  kpiIconWrap: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: "1.2",
    marginBottom: "3px",
  },
  kpiSub: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "600",
  },

  // Controls Grid
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  controlCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "20px 22px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  controlCardHeader: {
    marginBottom: "14px",
  },
  controlTitle: {
    margin: "0 0 3px 0",
    fontSize: "15.5px",
    fontWeight: "800",
    color: "#0F172A",
  },
  controlSub: {
    margin: 0,
    fontSize: "12px",
    color: "#64748B",
    lineHeight: "1.4",
  },
  feeControlRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  feeInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  currencyPrefix: {
    position: "absolute",
    left: "12px",
    fontWeight: "800",
    fontSize: "16px",
    color: "#0F172A",
    pointerEvents: "none",
  },
  feeNumericInput: {
    padding: "9px 12px 9px 28px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    width: "90px",
    outline: "none",
  },
  stepperGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  stepBtn: {
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "#F1F5F9",
    border: "1px solid #E2E8F0",
    fontSize: "12px",
    fontWeight: "700",
    color: "#334155",
    cursor: "pointer",
  },
  saveFeeBtn: {
    padding: "9px 16px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
  },
  profileSummaryRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  summaryPill: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "5px 10px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  summaryLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
  },
  summaryVal: {
    fontSize: "11.5px",
    fontWeight: "700",
    color: "#0F172A",
  },
  editProfileBtn: {
    padding: "9px 16px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
  },
  closeProfileBtn: {
    padding: "9px 16px",
    backgroundColor: "#F1F5F9",
    color: "#64748B",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
  },

  // Profile Editor Form Card
  profileFormCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    padding: "24px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
    marginBottom: "20px",
  },
  formHeader: {
    marginBottom: "16px",
  },
  formTitle: {
    margin: "0 0 3px 0",
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
  },
  formSub: {
    margin: 0,
    fontSize: "12.5px",
    color: "#64748B",
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
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    color: "#0F172A",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    color: "#0F172A",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical",
  },
  formFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "18px",
  },
  cancelProfileBtn: {
    padding: "10px 16px",
    backgroundColor: "transparent",
    color: "#64748B",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveProfileBtn: {
    padding: "10px 20px",
    backgroundColor: "#16A34A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
  },

  // Shortcuts Grid
  shortcutsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  shortcutCard: {
    backgroundColor: "#FFFFFF",
    padding: "20px",
    borderRadius: "18px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "all 0.15s ease",
  },
  shortcutTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  shortcutIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTag: {
    fontSize: "10.5px",
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    padding: "2px 8px",
    borderRadius: "9999px",
  },
  shortcutTitle: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  shortcutDesc: {
    margin: "0 0 16px 0",
    fontSize: "12.5px",
    color: "#64748B",
    lineHeight: "1.45",
    flex: 1,
  },
  shortcutLink: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#2563EB",
  },
};

export default DoctorHome;