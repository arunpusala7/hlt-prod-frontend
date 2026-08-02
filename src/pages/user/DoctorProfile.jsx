import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatDoctorName } from "../../utils/formatDoctorName";

function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about"); // about | stories | testimonials | slots

  // Slot booking state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availabilities, setAvailabilities] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  useEffect(() => {
    if (id && selectedDate) {
      fetchDoctorSlots();
    }
  }, [id, selectedDate]);

  const fetchDoctorDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/doctors/${id}`);
      setDoctor(res.data);
    } catch (err) {
      toast.error("Failed to load doctor profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/api/availability/doctor/${id}?date=${selectedDate}`);
      const slotsArray = res.data?.slots || (Array.isArray(res.data) ? res.data : []);
      setAvailabilities(slotsArray);
    } catch (err) {
      console.error("Failed to load slots", err);
      setAvailabilities([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate 7 upcoming dates for horizontal date strip
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().split("T")[0];
    const dayName = i === 0 ? "TODAY" : d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dateNum = d.getDate();
    const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { isoDate, label: `${dayName} ${dateNum} ${monthName}` };
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBookAndPay = async (slot) => {
    setSelectedSlot(slot);
    setIsProcessingPayment(true);
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Razorpay SDK failed to load. Check internet connection.");
        setIsProcessingPayment(false);
        return;
      }

      // Step 1: Create Order
      const amount = doctor.consultationFee || 500;
      const orderRes = await api.post("/api/payments/create-order", {
        amount: amount,
        currency: "INR",
        appointmentId: null
      });

      const orderData = orderRes.data;

      // Step 2: Configure Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "HealthConnect Hospital",
        description: `Consultation with Dr. ${doctor.name}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify HMAC signature & complete booking
            const verifyRes = await api.post("/api/payments/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              doctorId: doctor.id,
              date: selectedDate,
              startTime: slot.startTime,
              endTime: slot.endTime
            });

            toast.success(`🎉 Appointment Booked! Ticket #${verifyRes.data?.ticketId?.substring(0, 8) || 'CONFIRMED'}`);
            fetchDoctorSlots();
            navigate("/user");
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: "Patient User",
          email: "patient@healthconnect.com",
        },
        theme: {
          color: "#2563eb",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      toast.error("Order creation failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600", marginTop: "12px" }}>
          Loading Specialist Portfolio...
        </p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div style={styles.errorContainer}>
        <h3>Doctor Profile Not Found</h3>
        <button onClick={() => navigate("/user")} style={styles.backBtn}>
          &larr; Return to Doctor Directory
        </button>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Top Navbar Header */}
      <nav style={styles.topNav}>
        <div style={styles.navLeftGroup}>
          <button onClick={() => navigate("/user")} style={styles.minimalBackBtn} title="Back">
            &larr;
          </button>
          <div style={styles.brandTitle} onClick={() => navigate("/user")}>
            <span style={{ color: '#2563eb', fontWeight: "900" }}>Health</span>
            <span style={{ color: '#0f172a', fontWeight: "900" }}>Connect</span>
          </div>
        </div>
        <span style={styles.navBadge}>Doctor Profile</span>
      </nav>

      {/* MNC-Grade Hero Showcase Banner */}
      <div style={styles.heroCoverBanner}>
        <div style={styles.heroInnerContainer}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatarLarge}>
              {doctor.name ? doctor.name.replace("Dr.", "").trim().charAt(0) : "D"}
            </div>
            <div style={styles.activeDot} title="Accepting Patient Appointments"></div>
          </div>

          <div style={styles.heroTextGroup}>
            <div style={styles.badgeRow}>
              <span style={styles.verifiedBadge}>✓ Medical Council Verified</span>
              <span style={styles.specialtyBadge}>{doctor.specialization} Specialist</span>
            </div>

            <h1 style={styles.doctorName}>{formatDoctorName(doctor.name)}</h1>
            <p style={styles.doctorSub}>
              {doctor.qualifications || "MBBS, MD, Senior Specialist"} &bull; {doctor.hospitalAffiliation || "HealthConnect Super Specialty Hospital"}
            </p>

            {/* Key Metrics Row */}
            <div style={styles.heroMetricsGrid}>
              <div style={styles.heroMetricCard}>
                <span style={styles.metricLabel}>VERIFIED RATING</span>
                <strong style={{ ...styles.metricVal, color: "#eab308" }}>⭐ 4.9 / 5.0</strong>
              </div>

              <div style={styles.heroMetricCard}>
                <span style={styles.metricLabel}>EXPERIENCE</span>
                <strong style={styles.metricVal}>{doctor.experienceYears || "12+ Years"}</strong>
              </div>

              <div style={styles.heroMetricCard}>
                <span style={styles.metricLabel}>PATIENT VISITS</span>
                <strong style={styles.metricVal}>3,500+ Cured</strong>
              </div>

              <div style={styles.heroMetricCard}>
                <span style={styles.metricLabel}>STATUS</span>
                <strong style={{ ...styles.metricVal, color: "#10b981" }}>● Available Today</strong>
              </div>
            </div>
          </div>

          {/* Minimal Book Consultation Button */}
          <div style={{ alignSelf: "center" }}>
            <button
              onClick={() => {
                navigate("/user", {
                  state: {
                    activeTab: "book",
                    selectedDoctorId: doctor.id
                  }
                });
              }}
              style={styles.simpleBookBtn}
            >
              Book Consultation &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Tab Bar Navigation */}
      <div style={styles.tabNavContainer}>
        <div style={styles.tabBar}>
          <button
            onClick={() => setActiveTab("about")}
            style={activeTab === "about" ? styles.tabActive : styles.tab}
          >
            👨‍⚕️ Overview & Credentials
          </button>
          <button
            onClick={() => setActiveTab("stories")}
            style={activeTab === "stories" ? styles.tabActive : styles.tab}
          >
            🏆 Clinical Success Stories
          </button>
          <button
            onClick={() => setActiveTab("testimonials")}
            style={activeTab === "testimonials" ? styles.tabActive : styles.tab}
          >
            ⭐ Patient Reviews (4.9)
          </button>
        </div>
      </div>

      {/* Main Tab Content Panels */}
      <div style={styles.mainContainer}>
        {/* TAB 1: OVERVIEW & CREDENTIALS */}
        {activeTab === "about" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={styles.sectionCard}>
            <h3 style={styles.sectionHeading}>About {formatDoctorName(doctor.name)}</h3>
            <p style={styles.bodyParagraph}>
              {doctor.aboutBio || "Dedicated healthcare specialist committed to providing world-class diagnostic care, evidence-based treatment plans, and empathetic patient consultations."}
            </p>

            <h4 style={styles.subHeading}>Qualifications & Clinical Credentials</h4>
            <div style={styles.credentialsGrid}>
              <div style={styles.credItem}>
                <div style={styles.credIconBox}>🎓</div>
                <div>
                  <span style={styles.credLabel}>Medical Degrees & Certification</span>
                  <strong style={styles.credValue}>{doctor.qualifications || "MBBS, MD, Board Certified Specialist"}</strong>
                </div>
              </div>

              <div style={styles.credItem}>
                <div style={styles.credIconBox}>🏥</div>
                <div>
                  <span style={styles.credLabel}>Hospital Practice Location</span>
                  <strong style={styles.credValue}>{doctor.hospitalAffiliation || "HealthConnect Super Specialty Center, Jubilee Hills"}</strong>
                </div>
              </div>

              <div style={styles.credItem}>
                <div style={styles.credIconBox}>⏱️</div>
                <div>
                  <span style={styles.credLabel}>Active Clinical Practice</span>
                  <strong style={styles.credValue}>{doctor.experienceYears || "12+ Years Active Experience"}</strong>
                </div>
              </div>
            </div>

            <h4 style={styles.subHeading}>Specialized Areas of Care</h4>
            <div style={styles.specPillRow}>
              <span style={styles.specPill}>Diagnostic Pathology</span>
              <span style={styles.specPill}>Preventive Healthcare</span>
              <span style={styles.specPill}>Advanced Pharmacotherapy</span>
              <span style={styles.specPill}>Chronic Disease Management</span>
              <span style={styles.specPill}>Holistic Wellness</span>
            </div>
          </motion.div>
        )}

        {/* TAB 2: CLINICAL SUCCESS STORIES */}
        {activeTab === "stories" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={styles.sectionCard}>
            <h3 style={styles.sectionHeading}>Featured Clinical Recovery Milestones</h3>
            <div style={styles.storyCard}>
              <div style={styles.storyHeaderRow}>
                <span style={styles.storyBadge}>🌟 Highlight Case Study</span>
                <span style={styles.successRateBadge}>99.4% Positive Outcome</span>
              </div>
              <p style={styles.bodyParagraph}>
                {doctor.successStories || "Successfully managed complex recovery cases with non-invasive clinical protocols and high patient satisfaction rates."}
              </p>
            </div>
          </motion.div>
        )}

        {/* TAB 3: PATIENT TESTIMONIALS */}
        {activeTab === "testimonials" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={styles.sectionCard}>
            <div style={styles.testTitleRow}>
              <h3 style={styles.sectionHeading}>Verified Patient Feedback</h3>
              <span style={styles.ratingSummaryBadge}>⭐ 4.9 Out of 5.0 (500+ Reviews)</span>
            </div>

            <div style={styles.testimonialCard}>
              <div style={styles.testHeaderRow}>
                <div style={styles.testAvatar}>P</div>
                <div>
                  <strong style={{ color: "#0f172a", fontSize: "14px", display: "block" }}>Verified Patient User</strong>
                  <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700" }}>✓ Verified Consultation Visit</span>
                </div>
                <span style={styles.starsText}>⭐⭐⭐⭐⭐ 5.0</span>
              </div>
              <p style={styles.testText}>
                "{doctor.testimonials || formatDoctorName(doctor.name) + " is extremely attentive and listened carefully to all my symptoms. The treatment prescribed showed results within 48 hours!"}"
              </p>
            </div>
          </motion.div>
        )}

        {/* TAB 4: AVAILABLE SLOTS & BOOKING */}
        {activeTab === "slots" && (
          <motion.div id="available-slots-section" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={styles.sectionCard}>
            <h3 style={styles.sectionHeading}>Select Consultation Date & Time Slot</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px 0" }}>
              Choose an available slot below to lock your appointment. Fee: <strong style={{ color: "#2563eb" }}>₹{doctor.consultationFee || 500}</strong>.
            </p>

            {/* Date Strip Picker */}
            <div style={styles.dateStripRow}>
              {dateStrip.map((item) => (
                <button
                  key={item.isoDate}
                  onClick={() => setSelectedDate(item.isoDate)}
                  style={selectedDate === item.isoDate ? styles.datePillActive : styles.datePill}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            {loadingSlots ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "30px 0", fontSize: "13px" }}>
                Checking real-time doctor availability...
              </p>
            ) : availabilities.length === 0 ? (
              <div style={styles.emptySlotBox}>
                <h4 style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>No Open Slots for Selected Date</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Please select another date from the strip above.</p>
              </div>
            ) : (
              <div style={styles.slotGrid}>
                {availabilities.map((slot) => {
                  const isAvailable = slot.status === "AVAILABLE" || slot.available === true || slot.status === "OPEN";
                  return (
                    <div
                      key={slot.id}
                      style={isAvailable ? styles.slotCardAvailable : styles.slotCardBooked}
                    >
                      <div>
                        <span style={styles.slotLabel}>CONSULTATION SLOT</span>
                        <strong style={styles.slotTimeText}>
                          {slot.startTime ? slot.startTime.substring(0, 5) : "--:--"} - {slot.endTime ? slot.endTime.substring(0, 5) : "--:--"}
                        </strong>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => handleBookAndPay(slot)}
                          disabled={isProcessingPayment}
                          style={styles.slotBookBtn}
                        >
                          {isProcessingPayment && selectedSlot?.id === slot.id ? "Processing..." : `Book ₹${doctor.consultationFee || 500}`}
                        </button>
                      ) : (
                        <span style={styles.bookedBadge}>Booked</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
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
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorContainer: {
    padding: "40px",
    textAlign: "center",
  },

  topNav: {
    backgroundColor: "#ffffff",
    padding: "12px 28px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  navLeftGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  minimalBackBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    fontSize: "18px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s",
  },
  brandTitle: {
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  },
  navBadge: {
    fontSize: "11px",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "3px 8px",
    borderRadius: "6px",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Hero Cover Banner
  heroCoverBanner: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "32px 24px",
  },
  heroInnerContainer: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    alignItems: "flex-start",
    gap: "28px",
    flexWrap: "wrap",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarLarge: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: "900",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.25)",
  },
  activeDot: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    width: "16px",
    height: "16px",
    backgroundColor: "#10b981",
    border: "3px solid #ffffff",
    borderRadius: "50%",
  },
  heroTextGroup: {
    flex: "1 1 340px",
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  verifiedBadge: {
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "3px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
  },
  specialtyBadge: {
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "3px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
  },
  doctorName: {
    margin: "0 0 4px 0",
    fontSize: "26px",
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  doctorSub: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.4",
  },
  heroMetricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "10px",
  },
  heroMetricCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  metricLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: "0.05em",
  },
  metricVal: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0f172a",
  },

  simpleBookBtn: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
    whiteSpace: "nowrap",
  },

  // Tabs
  tabNavContainer: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  tabBar: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    gap: "12px",
    overflowX: "auto",
  },
  tab: {
    padding: "14px 16px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabActive: {
    padding: "14px 16px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid #2563eb",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  // Main Container
  mainContainer: {
    maxWidth: "1100px",
    margin: "24px auto",
    padding: "0 16px",
    boxSizing: "border-box",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "28px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
  },
  sectionHeading: {
    margin: "0 0 12px 0",
    fontSize: "19px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subHeading: {
    margin: "24px 0 12px 0",
    fontSize: "15px",
    fontWeight: "800",
    color: "#0f172a",
  },
  bodyParagraph: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.6",
    margin: 0,
  },

  credentialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  credItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  credIconBox: {
    fontSize: "20px",
    backgroundColor: "#eff6ff",
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  credLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  credValue: {
    margin: "2px 0 0 0",
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
  },

  specPillRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  specPill: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  // Story Card
  storyCard: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "14px",
    padding: "20px",
  },
  storyHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  storyBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#ffffff",
    padding: "4px 10px",
    borderRadius: "8px",
  },
  successRateBadge: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#166534",
    backgroundColor: "#dcfce7",
    padding: "4px 10px",
    borderRadius: "8px",
  },

  // Testimonials
  testTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  ratingSummaryBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: "800",
    padding: "6px 12px",
    borderRadius: "8px",
  },
  testimonialCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px",
  },
  testHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  testAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },
  starsText: {
    marginLeft: "auto",
    fontSize: "12px",
    fontWeight: "700",
  },
  testText: {
    fontStyle: "italic",
    color: "#334155",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0,
  },

  // Slots
  dateStripRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    marginBottom: "20px",
    paddingBottom: "4px",
  },
  datePill: {
    padding: "9px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  datePillActive: {
    padding: "9px 16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
  },

  emptySlotBox: {
    textAlign: "center",
    padding: "36px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "14px",
    border: "1px dashed #cbd5e1",
  },
  slotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "14px",
  },
  slotCardAvailable: {
    backgroundColor: "#ffffff",
    border: "1px solid #bfdbfe",
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  },
  slotCardBooked: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    opacity: 0.65,
  },
  slotLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: "0.05em",
    display: "block",
  },
  slotTimeText: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
  },
  slotBookBtn: {
    padding: "9px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  bookedBadge: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#dc2626",
    backgroundColor: "#fef2f2",
    padding: "4px 10px",
    borderRadius: "8px",
  },
};

export default DoctorProfile;
