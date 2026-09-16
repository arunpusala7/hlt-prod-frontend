import { useState } from "react";
import api from "../../api/api";

function ConfirmBooking({ doctor, slot, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const confirmBooking = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 🔧 FIX: Convert HH:mm:ss → HH:mm
      const formatTime = (time) => time.substring(0, 5);

      await api.post("/api/appointments/book", {
        doctorId: doctor.id,
        date: slot.date,
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
      });

      alert("✅ Appointment booked successfully");
      onSuccess();
    } catch (err) {
      alert("❌ Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Confirm Booking</h2>

      <p><b>Doctor:</b> {doctor.name}</p>
      <p><b>Date:</b> {slot.date}</p>
      <p>
        <b>Time:</b> {slot.startTime} – {slot.endTime}
      </p>

      <button onClick={confirmBooking} disabled={loading}>
        {loading ? "Booking..." : "Confirm Appointment"}
      </button>
    </div>
  );
}

export default ConfirmBooking;
