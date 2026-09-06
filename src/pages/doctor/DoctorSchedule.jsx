import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./DoctorSchedule.css";
import api from "../../api/api";
import toast from "react-hot-toast";
import { getLocalDateString } from "../../utils/dateUtils";

const localizer = momentLocalizer(moment);

const DoctorSchedule = () => {
  const [events, setEvents] = useState([]);
  const [rawSlots, setRawSlots] = useState([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedMobileDate, setSelectedMobileDate] = useState(getLocalDateString());
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
          <button className="nav-btn" onClick={goToBack} title="Previous">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button className="nav-btn" onClick={goToCurrent}>Today</button>
          <button className="nav-btn" onClick={goToNext} title="Next">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
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
      {/* ================= DESKTOP VIEW (≥ 768px) ================= */}
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
            <div className="icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
              </svg>
            </div>
            <div className="shift-info">
              <h4>Morning Shift</h4>
              <p>09:00 AM - 01:00 PM</p>
            </div>
          </div>

          <div className="shift-card" onClick={() => handleQuickAdd("AFTERNOON", viewDate)}>
            <div className="icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 18a5 5 0 0 0-10 0"></path>
                <line x1="12" y1="2" x2="12" y2="9"></line>
                <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line>
                <line x1="1" y1="18" x2="3" y2="18"></line>
                <line x1="21" y1="18" x2="23" y2="18"></line>
                <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line>
                <line x1="23" y1="22" x2="1" y2="22"></line>
              </svg>
            </div>
            <div className="shift-info">
              <h4>Afternoon Shift</h4>
              <p>02:00 PM - 06:00 PM</p>
            </div>
          </div>

          <div className="shift-card" onClick={() => handleQuickAdd("FULL", viewDate)}>
            <div className="icon-box" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div className="shift-info">
              <h4>Full Day</h4>
              <p>09:00 AM - 05:00 PM</p>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #F1F5F9', margin: '8px 0' }} />
          
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '12px', marginTop: 'auto' }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>Drag on calendar times to add custom slots.</p>
            <p style={{ margin: 0 }}>Click an existing slot to remove it.</p>
          </div>
        </div>
      </div>

      {/* ================= MOBILE VIEW (< 768px) ================= */}
      <div className="mobile-schedule-view">
        <div style={mobileStyles.headerCard}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3 style={mobileStyles.title}>Manage Availability</h3>
          </div>
          <p style={mobileStyles.sub}>Select a target date and tap a shift to publish consultation slots.</p>

          <div style={mobileStyles.dateRow}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span style={mobileStyles.dateLabel}>Date:</span>
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
            <div style={{ ...mobileStyles.iconBoxSmall, background: "#EFF6FF", color: "#2563EB" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
              </svg>
            </div>
            <div>
              <h4 style={mobileStyles.presetTitle}>Morning Shift</h4>
              <p style={mobileStyles.presetTime}>09:00 AM - 01:00 PM</p>
            </div>
          </div>

          <div style={mobileStyles.presetCard} onClick={() => handleQuickAdd("AFTERNOON", selectedMobileDate)}>
            <div style={{ ...mobileStyles.iconBoxSmall, background: "#FEF3C7", color: "#D97706" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M17 18a5 5 0 0 0-10 0"></path>
                <line x1="12" y1="2" x2="12" y2="9"></line>
                <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line>
                <line x1="1" y1="18" x2="3" y2="18"></line>
                <line x1="21" y1="18" x2="23" y2="18"></line>
                <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line>
                <line x1="23" y1="22" x2="1" y2="22"></line>
              </svg>
            </div>
            <div>
              <h4 style={mobileStyles.presetTitle}>Afternoon Shift</h4>
              <p style={mobileStyles.presetTime}>02:00 PM - 06:00 PM</p>
            </div>
          </div>

          <div style={mobileStyles.presetCard} onClick={() => handleQuickAdd("FULL", selectedMobileDate)}>
            <div style={{ ...mobileStyles.iconBoxSmall, background: "#DCFCE7", color: "#16A34A" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div>
              <h4 style={mobileStyles.presetTitle}>Full Day Shift</h4>
              <p style={mobileStyles.presetTime}>09:00 AM - 05:00 PM</p>
            </div>
          </div>
        </div>

        {/* Active Slots List for Mobile */}
        <div style={mobileStyles.activeSlotsBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h4 style={mobileStyles.activeHeader}>
              Active Slots
            </h4>
            <span style={mobileStyles.countBadge}>
              {rawSlots.length} {rawSlots.length === 1 ? "slot" : "slots"}
            </span>
          </div>

          {rawSlots.length === 0 ? (
            <p style={{ color: "#64748B", fontSize: "13px", margin: 0, textAlign: "center", padding: "20px 0" }}>
              No availability slots configured for this date.
            </p>
          ) : (
            <div style={mobileStyles.slotsList}>
              {rawSlots.map((slot, idx) => (
                <div key={slot.id || idx} style={mobileStyles.slotItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span style={mobileStyles.slotTimeText}>
                      {slot.startTime?.substring(0, 5)} - {slot.endTime?.substring(0, 5)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    style={mobileStyles.deleteBtn}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Remove</span>
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
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #E2E8F0",
    marginBottom: "14px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  title: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
  },
  sub: {
    margin: "0 0 14px 0",
    fontSize: "12px",
    color: "#64748B",
  },
  dateRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#F8FAFC",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
  },
  dateLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
  },
  dateInput: {
    border: "none",
    background: "transparent",
    fontSize: "13px",
    fontWeight: "700",
    color: "#2563EB",
    outline: "none",
    flex: 1,
  },

  presetsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  presetCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
    transition: "all 0.15s ease",
  },
  iconBoxSmall: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  presetTitle: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
  },
  presetTime: {
    margin: 0,
    fontSize: "12px",
    color: "#64748B",
  },

  activeSlotsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "18px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  activeHeader: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
  },
  countBadge: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    padding: "3px 8px",
    borderRadius: "20px",
  },
  slotsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  slotItem: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotTimeText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
  },
  deleteBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#FFFFFF",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default DoctorSchedule;