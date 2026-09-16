import { useState } from "react";
import api from "../../api/api";

function CheckAvailability({ doctor, onSelectSlot }) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const checkAvailability = async () => {
    try {
      const res = await api.get(
        `/api/availability/doctor/${doctor.id}?date=${date}`
      );
      setSlots(res.data.availableSlots || []);
      setSelectedIndex(null);
    } catch (err) {
      alert("Failed to load slots");
    }
  };

  return (
    <div className="card">
      <h2>Check Availability – {doctor.name}</h2>

      <div className="date-row">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button onClick={checkAvailability}>Check</button>
      </div>

      {/* SLOT GRID */}
      <div className="slot-grid">
        {slots.map((slot, index) => (
          <div
            key={index}
            className={`slot-box ${
              selectedIndex === index ? "selected" : ""
            }`}
            onClick={() => {
              setSelectedIndex(index);
              onSelectSlot({ ...slot, date });
            }}
          >
            <span>{slot.startTime}</span>
            <span>–</span>
            <span>{slot.endTime}</span>
          </div>
        ))}
      </div>

      {slots.length === 0 && date && (
        <p className="muted">No slots available for this date.</p>
      )}
    </div>
  );
}

export default CheckAvailability;
