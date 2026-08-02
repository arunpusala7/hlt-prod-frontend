import { useEffect, useState } from "react";
import api from "../../api/api";

function AllAppointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    api.get("/api/admin/appointments")
      .then(res => setAppointments(res.data))
      .catch(err => console.error(err));
  }, []);

  const cancelAppointment = async (id) => {
    try {
      await api.delete(`/api/admin/appointments/${id}`);
      setAppointments(appointments.filter(a => a.appointmentId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>All Appointments</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>User</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map(a => (
            <tr key={a.appointmentId}>
              <td>{a.doctorName}</td>
              <td>{a.userName}</td>
              <td>{a.date}</td>
              <td>{a.startTime} - {a.endTime}</td>
              <td>{a.status}</td>
              <td>
                <button onClick={() => cancelAppointment(a.appointmentId)}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AllAppointments;
