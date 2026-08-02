import { useState } from "react";
import api from "../../api/api";

function CreateDoctor() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !specialization) {
      alert("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/admin/create-doctor-account", {
        name,
        email,
        password,
        specialization,
      });

      alert("Doctor account created successfully");

      // clear form
      setName("");
      setEmail("");
      setPassword("");
      setSpecialization("");

    } catch (err) {
      console.error(err);
      alert(err.response?.data || "Failed to create doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Doctor Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Doctor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Doctor Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Specialization (e.g. Cardiology)"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Doctor"}
        </button>
      </form>
    </div>
  );
}

export default CreateDoctor;
