import { useState, useMemo } from "react";

function CustomDatePicker({ selectedDate, onChange, minDate }) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const activeMinDateStr = minDate || todayStr;

  // Generate next 14 days for quick horizontal strip
  const quickDates = useMemo(() => {
    const dates = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = i === 0 ? "TODAY" : d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const monthName = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      const dayNum = d.getDate();
      dates.push({ iso, dayName, monthName, dayNum });
    }
    return dates;
  }, []);

  // Calendar Grid Calculations
  const calendarGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding empty days for first week
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Days of current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      // Format ISO string manually in local time to avoid timezone offset shifts
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      days.push({ day, iso });
    }
    return days;
  }, [currentMonthDate]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (iso) => {
    if (iso < activeMinDateStr) return; // Prevent selecting past dates
    onChange(iso);
    setShowCalendarModal(false);
  };

  const formattedMonthHeader = currentMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <span style={styles.label}>Select Appointment Date</span>
        <button 
          type="button" 
          style={styles.calendarToggleBtn}
          onClick={() => setShowCalendarModal(!showCalendarModal)}
        >
          📅 Calendar View
        </button>
      </div>

      {/* Horizontal Quick Date Strip (Google Calendar Style) */}
      <div style={styles.dateStrip}>
        {quickDates.map((item) => {
          const isSelected = selectedDate === item.iso;
          return (
            <button
              key={item.iso}
              type="button"
              onClick={() => onChange(item.iso)}
              style={isSelected ? styles.stripCardActive : styles.stripCard}
            >
              <span style={isSelected ? styles.stripDayActive : styles.stripDay}>
                {item.dayName}
              </span>
              <span style={isSelected ? styles.stripNumActive : styles.stripNum}>
                {item.dayNum}
              </span>
              <span style={isSelected ? styles.stripMonthActive : styles.stripMonth}>
                {item.monthName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Google-Style Custom Calendar Modal Grid */}
      {showCalendarModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCalendarModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <button type="button" style={styles.navBtn} onClick={handlePrevMonth}>‹</button>
              <h3 style={styles.monthTitle}>{formattedMonthHeader}</h3>
              <button type="button" style={styles.navBtn} onClick={handleNextMonth}>›</button>
            </div>

            {/* Weekdays Row */}
            <div style={styles.weekdaysGrid}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(w => (
                <span key={w} style={styles.weekdayLabel}>{w}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div style={styles.daysGrid}>
              {calendarGrid.map((item, idx) => {
                if (!item) return <div key={`empty-${idx}`} style={styles.emptyDay} />;
                const isDisabled = item.iso < activeMinDateStr;
                const isSelected = selectedDate === item.iso;

                return (
                  <button
                    key={item.iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(item.iso)}
                    style={
                      isSelected 
                        ? styles.dayCellSelected 
                        : (isDisabled ? styles.dayCellDisabled : styles.dayCell)
                    }
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            <div style={styles.modalFooter}>
              <button 
                type="button" 
                style={styles.closeModalBtn}
                onClick={() => setShowCalendarModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    marginBottom: "20px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
  },
  calendarToggleBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "4px 8px",
  },

  // Horizontal Quick Strip
  dateStrip: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "8px",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  stripCard: {
    flex: "0 0 62px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 4px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  stripCardActive: {
    flex: "0 0 62px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 4px",
    borderRadius: "12px",
    backgroundColor: "#2563eb",
    border: "1px solid #2563eb",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
  },
  stripDay: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
    marginBottom: "2px",
  },
  stripDayActive: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "2px",
  },
  stripNum: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "2px",
  },
  stripNumActive: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: "2px",
  },
  stripMonth: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#94a3b8",
  },
  stripMonthActive: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#ffffff",
  },

  // Modal Overlay
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "16px",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    width: "100%",
    maxWidth: "340px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  monthTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  navBtn: {
    background: "#f1f5f9",
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#334155",
    cursor: "pointer",
  },
  weekdaysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    marginBottom: "8px",
  },
  weekdayLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748b",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
    textAlign: "center",
    marginBottom: "16px",
  },
  emptyDay: {
    height: "36px",
  },
  dayCell: {
    height: "36px",
    border: "none",
    background: "transparent",
    borderRadius: "50%",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
    cursor: "pointer",
  },
  dayCellDisabled: {
    height: "36px",
    border: "none",
    background: "transparent",
    fontSize: "13px",
    color: "#cbd5e1",
    cursor: "not-allowed",
  },
  dayCellSelected: {
    height: "36px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: "50%",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  modalFooter: {
    textAlign: "right",
  },
  closeModalBtn: {
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default CustomDatePicker;
