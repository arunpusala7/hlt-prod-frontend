import { useEffect, useState } from "react";
import api from "../../api/api";

function DoctorList({ onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    api.get("/api/doctors")
      .then(res => setDoctors(res.data))
      .catch(() => alert("Failed to load doctors"));
  }, []);

  return (
    <div className="card">
      <h2>Select Doctor</h2>

      {doctors.map(doc => (
        <div
          key={doc.id}
          className="list-item"
          onClick={() => onSelectDoctor(doc)}
        >
          <strong>{doc.name}</strong> – {doc.specialization}
        </div>
      ))}
    </div>
  );
}

export default DoctorList;
