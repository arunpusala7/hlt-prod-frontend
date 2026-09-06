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
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = d.getDate();
      dates.push({ iso, isoDate: iso, dayName, dateNum });
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
  }, [currentMonthDate]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthYearLabel = currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div style={styles.container}>
      {/* Header with Calendar Modal Toggle */}
      <div style={styles.headerRow}>
        <span style={styles.label}>Select Date</span>
        <button 
          onClick={() => setShowCalendarModal(!showCalendarModal)}
          className="tactile-card"
          style={styles.calendarToggleBtn}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{selectedDate || "Pick Date"}</span>
        </button>
      </div>

      {/* Horizontal Day Strip (Screen 3 Style) */}
      <div style={styles.stripContainer}>
        {quickDates.map((item) => {
          const isSelected = selectedDate === (item.iso || item.isoDate);
          return (
            <div
              key={item.iso}
              onClick={() => onChange(item.iso)}
              className="tactile-card"
              style={isSelected ? styles.stripPillActive : styles.stripPillInactive}
            >
              <span style={isSelected ? styles.dayActive : styles.dayInactive}>{item.dayName}</span>
              <span style={isSelected ? styles.numActive : styles.numInactive}>{item.dateNum}</span>
            </div>
          );
        })}
      </div>

      {/* Month Calendar Modal */}
      {showCalendarModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCalendarModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <button onClick={handlePrevMonth} style={styles.monthNavBtn}>&lsaquo;</button>
              <h4 style={styles.monthTitle}>{monthYearLabel}</h4>
              <button onClick={handleNextMonth} style={styles.monthNavBtn}>&rsaquo;</button>
            </div>

            <div style={styles.weekHeader}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                <div key={i} style={styles.weekDay}>{d}</div>
              ))}
            </div>

            <div style={styles.monthGrid}>
              {calendarGrid.map((cell, idx) => {
                if (!cell) return <div key={idx} style={styles.emptyDayCell} />;
                const isPast = cell.iso < activeMinDateStr;
                const isSelected = selectedDate === cell.iso;

                return (
                  <button
                    key={idx}
                    disabled={isPast}
                    onClick={() => {
                      onChange(cell.iso);
                      setShowCalendarModal(false);
                    }}
                    style={
                      isSelected
                        ? styles.dayCellActive
                        : isPast
                        ? styles.dayCellDisabled
                        : styles.dayCellNormal
                    }
                  >
                    {cell.day}
                  </button>
                );
              })}
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
    color: "#0F172A",
  },
  calendarToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "9999px",
    padding: "5px 12px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#0F172A",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
  },
  stripContainer: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "8px",
    scrollbarWidth: "none",
  },
  stripPillActive: {
    minWidth: "52px",
    height: "64px",
    borderRadius: "9999px",
    backgroundColor: "#3B82F6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(59, 130, 246, 0.35)",
    flexShrink: 0,
  },
  stripPillInactive: {
    minWidth: "52px",
    height: "64px",
    borderRadius: "9999px",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
    flexShrink: 0,
  },
  dayActive: {
    fontSize: "10px",
    color: "#EFF6FF",
    fontWeight: "600",
    marginBottom: "4px",
  },
  dayInactive: {
    fontSize: "10px",
    color: "#64748B",
    fontWeight: "500",
    marginBottom: "4px",
  },
  numActive: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#FFFFFF",
  },
  numInactive: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
    padding: "16px",
  },
  modalCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    borderRadius: "24px",
    padding: "24px",
    width: "100%",
    maxWidth: "340px",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    boxShadow: "0 24px 48px rgba(15, 23, 42, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  monthTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  monthNavBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    cursor: "pointer",
  },
  weekHeader: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    marginBottom: "8px",
  },
  weekDay: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94A3B8",
  },
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "6px",
  },
  emptyDayCell: {
    height: "36px",
  },
  dayCellNormal: {
    height: "36px",
    borderRadius: "50%",
    background: "transparent",
    color: "#0F172A",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  dayCellActive: {
    height: "36px",
    borderRadius: "50%",
    background: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(59, 130, 246, 0.4)",
  },
  dayCellDisabled: {
    height: "36px",
    borderRadius: "50%",
    background: "transparent",
    color: "#CBD5E1",
    fontSize: "13px",
    cursor: "not-allowed",
  },
};

export default CustomDatePicker;
