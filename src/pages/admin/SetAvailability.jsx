import { useEffect, useState } from "react";
import api from "../../api/api";

function SetAvailability() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/api/doctors")
      .then(res => setDoctors(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/api/availability/add", {
        date,
        startTime,
        endTime
      });

      setMessage("Availability added successfully ✅");
    } catch (err) {
      console.error(err);
      setMessage("Failed to add availability ❌");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Set Doctor Availability</h2>

        {message && <p>{message}</p>}

        <form onSubmit={handleSubmit}>
          <select value={doctorId} onChange={e => setDoctorId(e.target.value)} required>
            <option value="">Select Doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />

          <input
            type="number"
            placeholder="Slot duration (minutes)"
            value={slotDurationMinutes}
            onChange={e => setSlotDurationMinutes(Number(e.target.value))}
            min="5"
            required
          />

          <button className="primary">Add Availability</button>
        </form>
      </div>
    </div>
  );
}

export default SetAvailability;
