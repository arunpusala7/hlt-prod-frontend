import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./DoctorSchedule.css";
import api from "../../api/api";
import toast from "react-hot-toast";

const localizer = momentLocalizer(moment);

const DoctorSchedule = () => {
  const [events, setEvents] = useState([]);
  const [rawSlots, setRawSlots] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedMobileDate, setSelectedMobileDate] = useState(new Date().toISOString().split("T")[0]);
  const [view, setView] = useState("week");

  const doctorId = localStorage.getItem("userId");

  useEffect(() => {
    if (doctorId) fetchSlots();
  }, [doctorId, viewDate, selectedMobileDate]);

  const fetchSlots = async () => {
    try {
      const formattedDate = moment(viewDate).format("YYYY-MM-DD");
      const res = await api.get(`/api/availability/doctor/${doctorId}?date=${formattedDate}`);
      const slotDate = res.data.date || formattedDate;
      const slotsList = res.data.availableSlots || [];
      
      setRawSlots(slotsList);

      const calendarEvents = slotsList.map((slot, index) => ({
        id: slot.id || index,
        title: "Available",
        start: moment(`${slotDate} ${slot.startTime}`, "YYYY-MM-DD HH:mm:ss").toDate(),
        end: moment(`${slotDate} ${slot.endTime}`, "YYYY-MM-DD HH:mm:ss").toDate(),
      }));
      setEvents(calendarEvents);
    } catch (err) {
      console.error("Error fetching slots", err);
    }
  };

  // Logic to Save Slot
  const saveSlot = async (start, end) => {
    const dateStr = moment(start).format("YYYY-MM-DD");
    const startTimeStr = moment(start).format("HH:mm:00");
    const endTimeStr = moment(end).format("HH:mm:00");

    const tempId = Math.random();
    setEvents((prev) => [...prev, { id: tempId, start, end, title: "Saving..." }]);

    try {
      await api.post("/api/availability/add", {
        doctorId: doctorId,
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
      toast.success("Availability Slot Added!");
      fetchSlots();
    } catch (err) {
      toast.error("Failed to add slot");
      setEvents((prev) => prev.filter((e) => e.id !== tempId));
    }
  };

  // Quick Add Preset
  const handleQuickAdd = (type, targetDateObj) => {
    const baseDate = moment(targetDateObj || viewDate).format("YYYY-MM-DD");
    let start, end;

    if (type === "MORNING") {
      start = moment(`${baseDate} 09:00:00`).toDate();
      end = moment(`${baseDate} 13:00:00`).toDate();
    } else if (type === "AFTERNOON") {
      start = moment(`${baseDate} 14:00:00`).toDate();
      end = moment(`${baseDate} 18:00:00`).toDate();
    } else if (type === "FULL") {
      start = moment(`${baseDate} 09:00:00`).toDate();
      end = moment(`${baseDate} 17:00:00`).toDate();
    }

    saveSlot(start, end);
  };

  const handleSelectSlot = ({ start, end }) => {
    if (start < new Date()) return toast.error("Cannot add past slots");
    saveSlot(start, end);
  };

  const handleSelectEvent = async (event) => {
    if (window.confirm("Delete this slot?")) {
      deleteSlot(event.id);
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await api.delete(`/api/availability/delete/${slotId}`);
      toast.success("Slot Removed");
      fetchSlots();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Custom Desktop Toolbar Component
  const CustomToolbar = (toolbar) => {
    const goToBack = () => { toolbar.onNavigate('PREV'); setViewDate(moment(viewDate).subtract(1, view === 'week' ? 'week' : 'day').toDate()); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); setViewDate(moment(viewDate).add(1, view === 'week' ? 'week' : 'day').toDate()); };
    const goToCurrent = () => { toolbar.onNavigate('TODAY'); setViewDate(new Date()); };

    return (
      <div className="custom-toolbar">
        <div className="nav-btn-group">
          <button className="nav-btn" onClick={goToBack}>&lt;</button>
          <button className="nav-btn" onClick={goToCurrent}>Today</button>
          <button className="nav-btn" onClick={goToNext}>&gt;</button>
        </div>
        <span className="current-date-label">{toolbar.label}</span>
        <div className="nav-btn-group">
          <button className={`nav-btn ${view === 'week' ? 'active' : ''}`} onClick={() => {setView('week'); toolbar.onView('week')}}>Week</button>
          <button className={`nav-btn ${view === 'day' ? 'active' : ''}`} onClick={() => {setView('day'); toolbar.onView('day')}}>Day</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      {/* ================= DESKTOP VIEW (≥ 900px) ================= */}
      <div className="desktop-schedule-view schedule-container">
        <div className="calendar-card">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            date={viewDate}
            onNavigate={(date) => setViewDate(date)}
            view={view}
            onView={(v) => setView(v)}
            components={{ toolbar: CustomToolbar }}
            step={30}
            timeslots={2}
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 20, 0, 0)}
          />
        </div>

        <div className="action-panel">
          <div>
            <h3 className="panel-title">Quick Shifts</h3>
            <p className="panel-subtitle">Add shift for <strong>{moment(viewDate).format("MMM Do")}</strong></p>
          </div>

          <div className="shift-card" onClick={() => handleQuickAdd("MORNING", viewDate)}>
            <div className="icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>🌅</div>
            <div className="shift-info">
              <h4>Morning Shift</h4>
              <p>09:00 AM - 01:00 PM</p>
            </div>
          </div>

          <div className="shift-card" onClick={() => handleQuickAdd("AFTERNOON", viewDate)}>
            <div className="icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>🌇</div>
            <div className="shift-info">
              <h4>Afternoon Shift</h4>
              <p>02:00 PM - 06:00 PM</p>
            </div>
          </div>

          <div className="shift-card" onClick={() => handleQuickAdd("FULL", viewDate)}>
            <div className="icon-box" style={{ background: '#dcfce7', color: '#166534' }}>💼</div>
            <div className="shift-info">
              <h4>Full Day</h4>
              <p>09:00 AM - 05:00 PM</p>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #f1f5f9', margin: '10px 0' }} />
          
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: 'auto' }}>
            <p style={{ margin: "0 0 4px 0" }}>Drag on calendar times to add custom slots.</p>
            <p style={{ margin: 0 }}>Click an existing slot to remove it.</p>
          </div>
        </div>
      </div>

      {/* ================= MOBILE VIEW (< 900px) ================= */}
      <div className="mobile-schedule-view">
        <div style={mobileStyles.headerCard}>
          <h3 style={mobileStyles.title}>Manage Availability</h3>
          <p style={mobileStyles.sub}>Tap a shift to instantly publish slots for your patients.</p>

          <div style={mobileStyles.dateRow}>
            <span style={mobileStyles.dateLabel}>Select Date:</span>
            <input
              type="date"
              value={selectedMobileDate}
              onChange={(e) => {
                setSelectedMobileDate(e.target.value);
                setViewDate(new Date(e.target.value));
              }}
              style={mobileStyles.dateInput}
            />
          </div>
        </div>

        {/* Quick Shift Presets Grid */}
        <div style={mobileStyles.presetsGrid}>
          <div style={mobileStyles.presetCard} onClick={() => handleQuickAdd("MORNING", selectedMobileDate)}>
            <div style={{ fontSize: "20px" }}>🌅</div>
            <div>
              <h4 style={mobileStyles.presetTitle}>Morning Shift</h4>
              <p style={mobileStyles.presetTime}>09:00 AM - 01:00 PM</p>
            </div>
          </div>

          <div style={mobileStyles.presetCard} onClick={() => handleQuickAdd("AFTERNOON", selectedMobileDate)}>
            <div style={{ fontSize: "20px" }}>🌇</div>
            <div>
              <h4 style={mobileStyles.presetTitle}>Afternoon Shift</h4>
              <p style={mobileStyles.presetTime}>02:00 PM - 06:00 PM</p>
            </div>
          </div>

          <div style={mobileStyles.presetCard} onClick={() => handleQuickAdd("FULL", selectedMobileDate)}>
            <div style={{ fontSize: "20px" }}>💼</div>
            <div>
              <h4 style={mobileStyles.presetTitle}>Full Day Shift</h4>
              <p style={mobileStyles.presetTime}>09:00 AM - 05:00 PM</p>
            </div>
          </div>
        </div>

        {/* Active Slots List for Mobile */}
        <div style={mobileStyles.activeSlotsBox}>
          <h4 style={mobileStyles.activeHeader}>
            Active Slots ({rawSlots.length})
          </h4>

          {rawSlots.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0, textAlign: "center", padding: "16px 0" }}>
              No slots added for {selectedMobileDate}. Tap a shift above to add.
            </p>
          ) : (
            <div style={mobileStyles.slotsList}>
              {rawSlots.map((slot, idx) => (
                <div key={slot.id || idx} style={mobileStyles.slotItem}>
                  <div>
                    <span style={mobileStyles.slotTimeText}>
                      {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    style={mobileStyles.deleteBtn}
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const mobileStyles = {
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    marginBottom: "14px",
  },
  title: {
    margin: "0 0 2px 0",
    fontSize: "17px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sub: {
    margin: "0 0 14px 0",
    fontSize: "12px",
    color: "#64748b",
  },
  dateRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#f8fafc",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },
  dateLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
  },
  dateInput: {
    border: "none",
    background: "transparent",
    fontSize: "13px",
    fontWeight: "700",
    color: "#2563eb",
    outline: "none",
  },

  presetsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  presetCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
  },
  presetTitle: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  presetTime: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },

  activeSlotsBox: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "18px",
    border: "1px solid #e2e8f0",
  },
  activeHeader: {
    margin: "0 0 12px 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
  },
  slotsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  slotItem: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotTimeText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0f172a",
  },
  deleteBtn: {
    backgroundColor: "#ffffff",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default DoctorSchedule;