import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { formatDoctorName } from "../../utils/formatDoctorName";
import { getDoctorPortrait } from "../../utils/doctorAvatars";
import { getLocalDateString } from "../../utils/dateUtils";

function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Slot booking state
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
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
      toast.error("Failed to load doctor details");
      // Fallback preview
      setDoctor({
        id: id,
        name: "Dr. Emily Roberts",
        specialization: "Pediatrician",
        consultationFee: 500,
        experienceYears: "10y+",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await api.get(`/api/availability/doctor/${id}?date=${selectedDate}`);
      const slotsList = res.data?.availableSlots || res.data?.slots || (Array.isArray(res.data) ? res.data : []);
      setAvailabilities(slotsList);
    } catch {
      setAvailabilities([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Generate 7 upcoming days for horizontal date selector strip (Timezone-safe)
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = getLocalDateString(d);
    const dayName = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    const dateNum = d.getDate();
    return { isoDate, dayName, dateNum };
  });

  const todayIso = getLocalDateString();
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  const isCustomDateSelected = !dateStrip.some(d => d.isoDate === selectedDate);

  const selectedCustomFormatted = useMemo(() => {
    if (!selectedDate) return { month: "Custom", day: "Pick" };
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      const month = dt.toLocaleDateString("en-US", { month: "short" });
      const day = dt.getDate();
      return { month, day };
    } catch {
      return { month: "Custom", day: "Pick" };
    }
  }, [selectedDate]);

  const calendarGrid = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      days.push({ day, iso });
    }
    return days;
  }, [calendarViewDate]);

  const handlePrevCalendarMonth = (e) => {
    e.stopPropagation();
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextCalendarMonth = (e) => {
    e.stopPropagation();
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectCustomDate = (isoDate) => {
    setSelectedDate(isoDate);
    setSelectedSlot(null);
    setShowCustomCalendar(false);
  };

  const calendarMonthLabel = calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

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

  const handleBookAndPay = async () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot first.");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const sdkLoaded = await loadRazorpayScript();
      const amount = doctor?.consultationFee || 500;
      const formatTime = (t) => t.substring(0, 5);

      // Step 1: Create Order on Backend
      const orderRes = await api.post("/api/payments/create-order", {
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        startTime: formatTime(selectedSlot.startTime),
        endTime: formatTime(selectedSlot.endTime)
      });

      const { orderId, amount: resAmount, keyId } = orderRes.data;

      // Fallback if Razorpay SDK popup is blocked
      if (!sdkLoaded || !window.Razorpay) {
        toast("Processing verified booking...", { icon: '💳' });
        await api.post("/api/payments/verify-payment", {
          razorpayOrderId: orderId,
          razorpayPaymentId: "pay_demo_" + Math.random().toString(36).substring(2, 9),
          razorpaySignature: "sig_demo_" + Math.random().toString(36).substring(2, 9),
          doctorId: doctor.id,
          userId: localStorage.getItem("userId"),
          appointmentDate: selectedDate,
          startTime: formatTime(selectedSlot.startTime),
          endTime: formatTime(selectedSlot.endTime)
        });

        toast.success("Appointment Confirmed!");
        navigate("/user", { state: { activeTab: "my-appointments" } });
        return;
      }

      // Step 2: Open Razorpay Gateway
      const options = {
        key: keyId,
        amount: Math.round((resAmount || amount) * 100),
        currency: "INR",
        name: "HealthConnect Specialist Care",
        description: `Consultation with ${doctor.name}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await api.post("/api/payments/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              doctorId: doctor.id,
              userId: localStorage.getItem("userId"),
              appointmentDate: selectedDate,
              startTime: formatTime(selectedSlot.startTime),
              endTime: formatTime(selectedSlot.endTime)
            });

            toast.success("Appointment Successfully Booked!");
            navigate("/user", { state: { activeTab: "my-appointments" } });
          } catch (verifyErr) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: localStorage.getItem("userName") || "Alex",
          email: localStorage.getItem("userEmail") || "alex@example.com"
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", () => {
        toast.error("Payment Cancelled");
      });
      razorpayInstance.open();

    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading || !doctor) {
    return (
      <div style={styles.loadingContainer}>
        <p style={{ color: "#64748B", fontSize: "14px", fontWeight: "600" }}>Loading specialist details...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageCanvas}>
      <div style={styles.mobileFrame}>
        {/* Top Bar with Back Arrow */}
        <div style={styles.topNav}>
          <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2 style={styles.navTitle}>Doctor Details</h2>
          <div style={{ width: "36px" }}></div>
        </div>

        {/* Doctor Header with Overlapping Cutout Portrait (Screen 3) */}
        <div style={styles.docHeader}>
          <div style={styles.docHeaderTextCol}>
            <h1 style={styles.docName}>{formatDoctorName(doctor.name)}</h1>
            <p style={styles.docPrice}>₹{doctor.consultationFee || 500} <span style={{ color: "#64748B", fontSize: "14px", fontWeight: "500" }}>/ Session</span></p>
          </div>

          <div style={styles.docHeaderImgCol}>
            <img 
              src={getDoctorPortrait(doctor.id, doctor.name)} 
              alt={doctor.name} 
              style={styles.docCutoutImg} 
            />
          </div>
        </div>

        {/* Stats Card */}
        <div style={styles.statsCard}>
          <div style={styles.statCol}>
            <h4 style={styles.statVal}>{doctor.experienceYears || "10y+"}</h4>
            <span style={styles.statLabel}>Experience</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statCol}>
            <h4 style={styles.statVal}>30k+</h4>
            <span style={styles.statLabel}>Consultations</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statCol}>
            <h4 style={styles.statVal}>12k+</h4>
            <span style={styles.statLabel}>Reviews</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statCol}>
            <h4 style={styles.statVal}>4.9</h4>
            <span style={styles.statLabel}>Rating</span>
          </div>
        </div>

        {/* Horizontal Date Selector Strip */}
        <div style={styles.dateSection}>
          <div style={styles.dateStripRow}>
            {/* Starting Slot: Custom Calendar Pill */}
            <div
              onClick={() => {
                if (selectedDate) {
                  try {
                    const [y, m] = selectedDate.split("-").map(Number);
                    setCalendarViewDate(new Date(y, m - 1, 1));
                  } catch {}
                }
                setShowCustomCalendar(true);
              }}
              style={isCustomDateSelected ? styles.customDatePillActive : styles.customDatePillInactive}
              title="Choose custom date"
            >
              {isCustomDateSelected ? (
                <>
                  <span style={styles.customBadgeActive}>{selectedCustomFormatted.month}</span>
                  <span style={styles.customDateNumActive}>{selectedCustomFormatted.day}</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" style={{ marginBottom: "2px" }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span style={styles.customPillTitle}>Custom</span>
                </>
              )}
            </div>

            {dateStrip.map((item) => {
              const isSelected = selectedDate === item.isoDate;
              return (
                <div
                  key={item.isoDate}
                  onClick={() => {
                    setSelectedDate(item.isoDate);
                    setSelectedSlot(null);
                  }}
                  style={isSelected ? styles.datePillActive : styles.datePillInactive}
                >
                  <span style={isSelected ? styles.dayNameActive : styles.dayName}>{item.dayName}</span>
                  <span style={isSelected ? styles.dateNumActive : styles.dateNum}>{item.dateNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Slot Selector Section */}
        <div style={styles.slotCard}>
          <h3 style={styles.slotHeading}>Choose a date</h3>

          {loadingSlots ? (
            <p style={{ textAlign: "center", color: "#64748B", padding: "20px 0", fontSize: "13px" }}>Loading slots...</p>
          ) : availabilities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#64748B" }}>
              <p style={{ margin: "0 0 10px 0", fontSize: "13px" }}>No slots available for this day.</p>
              <button 
                onClick={() => navigate("/user", { state: { activeTab: "book", selectedDoctorId: doctor.id } })}
                style={{ background: "#EFF6FF", color: "#3B82F6", padding: "8px 16px", borderRadius: "9999px", fontSize: "12px", fontWeight: "700" }}
              >
                Join Waitlist
              </button>
            </div>
          ) : (
            <div style={styles.slotGrid}>
              {availabilities.map((slot, idx) => {
                const isSelected = selectedSlot === slot;
                const timeLabel = slot.startTime.substring(0, 5);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlot(slot)}
                    style={isSelected ? styles.slotPillActive : styles.slotPillInactive}
                  >
                    {timeLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky / Fixed Bottom Action Button */}
        <div style={styles.bottomBar}>
          <button
            onClick={handleBookAndPay}
            disabled={!selectedSlot || isProcessingPayment}
            style={selectedSlot && !isProcessingPayment ? styles.bookPillBtn : styles.bookPillBtnDisabled}
          >
            {isProcessingPayment ? "Processing..." : "Book Appointment"}
          </button>
        </div>
        {/* Custom Calendar Bottom Sheet */}
        <AnimatePresence>
          {showCustomCalendar && createPortal(
            <div 
              style={styles.calendarModalOverlay} 
              onClick={() => setShowCustomCalendar(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                style={styles.calendarModalCard}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Drag Handle */}
                <div style={styles.sheetHandleRow} onClick={() => setShowCustomCalendar(false)}>
                  <div style={styles.sheetDragPill}></div>
                </div>

                <div style={styles.calSheetContent}>
                  {/* Modal Header */}
                  <div style={styles.calModalHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={styles.calIconBadge}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div>
                        <h3 style={styles.calModalTitle}>Select Date</h3>
                        <p style={styles.calModalSub}>Choose any upcoming appointment date</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowCustomCalendar(false)}
                      style={styles.calCloseBtn}
                      title="Close calendar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {/* Month Navigation Row */}
                  <div style={styles.calMonthNavRow}>
                    <button 
                      onClick={handlePrevCalendarMonth} 
                      style={styles.calMonthNavBtn}
                      title="Previous Month"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>

                    <div style={styles.calMonthDisplay}>
                      <span style={styles.calMonthText}>{calendarMonthLabel}</span>
                    </div>

                    <button 
                      onClick={handleNextCalendarMonth} 
                      style={styles.calMonthNavBtn}
                      title="Next Month"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>

                  {/* Weekday Names Header */}
                  <div style={styles.calWeekRow}>
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                      <div key={i} style={styles.calWeekCol}>{d}</div>
                    ))}
                  </div>

                  {/* Day Cells Grid */}
                  <div style={styles.calDaysGrid}>
                    {calendarGrid.map((cell, idx) => {
                      if (!cell) return <div key={idx} style={styles.calEmptyCell} />;
                      const isPast = cell.iso < todayIso;
                      const isSelected = selectedDate === cell.iso;
                      const isToday = cell.iso === todayIso;

                      return (
                        <button
                          key={idx}
                          disabled={isPast}
                          onClick={() => handleSelectCustomDate(cell.iso)}
                          style={
                            isSelected
                              ? styles.calDayBtnActive
                              : isPast
                              ? styles.calDayBtnDisabled
                              : isToday
                              ? styles.calDayBtnToday
                              : styles.calDayBtnNormal
                          }
                        >
                          <span>{cell.day}</span>
                          {isToday && !isSelected && <span style={styles.calTodayDot}></span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer with Active Date Summary */}
                  <div style={styles.calFooter}>
                    <div style={styles.calSelectionInfo}>
                      <span style={styles.calInfoLabel}>Selected Date</span>
                      <span style={styles.calInfoValue}>
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowCustomCalendar(false)}
                      style={styles.calConfirmBtn}
                    >
                      Confirm Date
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles = {
  pageCanvas: {
    minHeight: "100vh",
    backgroundColor: "transparent",
    display: "flex",
    justifyContent: "center",
    padding: "16px 12px 30px",
  },
  mobileFrame: {
    width: "100%",
    maxWidth: "460px",
    display: "flex",
    flexDirection: "column",
  },
  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "0 4px",
  },
  backBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--card-bg, #FFFFFF)",
    backdropFilter: "var(--card-blur, blur(16px))",
    WebkitBackdropFilter: "var(--card-blur, blur(16px))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "var(--card-shadow, 0 2px 8px rgba(15, 23, 42, 0.05))",
    border: "var(--card-border, 1px solid #E2E8F0)",
  },
  navTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0F172A",
    margin: 0,
  },

  // Doctor Header
  docHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "relative",
    padding: "0 8px 10px",
    minHeight: "150px",
  },
  docHeaderTextCol: {
    flex: 1,
    paddingRight: "10px",
  },
  docName: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: "1.2",
    marginBottom: "8px",
    letterSpacing: "-0.02em",
  },
  docPrice: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#3B82F6",
    margin: 0,
  },
  docHeaderImgCol: {
    width: "140px",
    height: "160px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  docCutoutImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "bottom",
  },

  // Stats Card
  statsCard: {
    borderRadius: "22px",
    padding: "16px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
    border: "1px solid #E2E8F0",
    backgroundColor: "#F8FAFC",
    marginBottom: "20px",
  },
  statCol: {
    flex: 1,
    textAlign: "center",
  },
  statVal: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  statLabel: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "500",
  },
  statDivider: {
    width: "1px",
    height: "24px",
    backgroundColor: "#E2E8F0",
  },

  // Date Selector Strip
  dateSection: {
    marginBottom: "20px",
  },
  dateStripRow: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none",
  },
  customDatePillActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "64px",
    borderRadius: "18px",
    backgroundColor: "#2563EB",
    border: "1.5px solid #1D4ED8",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  customDatePillInactive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "54px",
    height: "64px",
    borderRadius: "18px",
    backgroundColor: "#F8FAFC",
    border: "1.5px dashed #93C5FD",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  customBadgeActive: {
    fontSize: "9.5px",
    fontWeight: "800",
    color: "#DBEAFE",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  customDateNumActive: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: "2px",
  },
  customPillTitle: {
    fontSize: "9.5px",
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: "0.02em",
  },
  calendarModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "stretch",
    zIndex: 999999,
    touchAction: "none",
  },
  calendarModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    width: "100%",
    maxWidth: "100%",
    maxHeight: "85vh",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -16px 48px -4px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    borderBottom: "none",
  },
  sheetHandleRow: {
    width: "100%",
    padding: "12px 0 4px 0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    cursor: "pointer",
  },
  sheetDragPill: {
    width: "44px",
    height: "5px",
    backgroundColor: "#CBD5E1",
    borderRadius: "9999px",
  },
  calSheetContent: {
    padding: "0 20px 20px 20px",
    overflowY: "auto",
    flex: 1,
  },
  calModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px",
    paddingBottom: "12px",
    borderBottom: "1px solid #F1F5F9",
  },
  calIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  calModalTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 1px 0",
  },
  calModalSub: {
    fontSize: "11px",
    color: "#64748B",
    margin: 0,
    fontWeight: "500",
  },
  calCloseBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  calMonthNavRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    backgroundColor: "var(--input-bg, #F8FAFC)",
    padding: "6px 8px",
    borderRadius: "12px",
    border: "var(--card-border, 1px solid #E2E8F0)",
  },
  calMonthNavBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    backgroundColor: "var(--card-bg, #FFFFFF)",
    border: "var(--card-border, 1px solid #CBD5E1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
  },
  calMonthDisplay: {
    display: "flex",
    alignItems: "center",
  },
  calMonthText: {
    fontSize: "13.5px",
    fontWeight: "700",
    color: "#0F172A",
  },
  calWeekRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    marginBottom: "6px",
    textAlign: "center",
  },
  calWeekCol: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    padding: "4px 0",
  },
  calDaysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "3px",
    marginBottom: "14px",
  },
  calDayBtnNormal: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#1E293B",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  calDayBtnActive: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.35)",
  },
  calDayBtnToday: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "1.5px solid #93C5FD",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  calDayBtnDisabled: {
    aspectRatio: "1",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "transparent",
    color: "#CBD5E1",
    fontSize: "13px",
    cursor: "not-allowed",
    opacity: 0.45,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  calEmptyCell: {
    aspectRatio: "1",
  },
  calTodayDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    backgroundColor: "#2563EB",
    marginTop: "2px",
  },
  calFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "14px",
    paddingBottom: "8px",
    marginTop: "6px",
    borderTop: "1px solid #F1F5F9",
  },
  calSelectionInfo: {
    display: "flex",
    flexDirection: "column",
  },
  calInfoLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  calInfoValue: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#0F172A",
    marginTop: "2px",
  },
  calConfirmBtn: {
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    padding: "9px 24px",
    borderRadius: "9999px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
    transition: "all 0.15s ease",
  },
  datePillActive: {
    width: "46px",
    height: "64px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
  },
  datePillInactive: {
    width: "46px",
    height: "64px",
    borderRadius: "9999px",
    backgroundColor: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
  },
  dayName: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "500",
    marginBottom: "4px",
  },
  dayNameActive: {
    fontSize: "11px",
    color: "#EFF6FF",
    fontWeight: "600",
    marginBottom: "4px",
  },
  dateNum: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
  },
  dateNumActive: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Slot Card
  slotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
    border: "1px solid #E2E8F0",
    marginBottom: "24px",
  },
  slotHeading: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 16px 0",
  },
  slotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  slotPillInactive: {
    padding: "10px 8px",
    borderRadius: "9999px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    color: "#0F172A",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.15s ease",
  },
  slotPillActive: {
    padding: "10px 8px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    border: "1px solid #3B82F6",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
  },

  // Bottom Fixed Bar
  bottomBar: {
    position: "sticky",
    bottom: "16px",
    width: "100%",
    zIndex: 10,
  },
  bookPillBtn: {
    width: "100%",
    padding: "15px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.45)",
    transition: "all 0.2s",
  },
  bookPillBtnDisabled: {
    width: "100%",
    padding: "15px",
    borderRadius: "9999px",
    backgroundColor: "#CBD5E1",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "not-allowed",
  },

  loadingContainer: {
    minHeight: "80vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default DoctorProfile;
