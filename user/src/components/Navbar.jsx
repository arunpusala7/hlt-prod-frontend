import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";

function Navbar() {
  const role = localStorage.getItem("role");

  return (
    <nav style={styles.nav}>
      <h3 style={styles.logo}>Appointment System</h3>

      <div style={styles.links}>
        {role === "ADMIN" && (
          <>
            <Link to="/admin">Admin</Link>
            <Link to="/admin/add-doctor">Add Doctor</Link>
            <Link to="/admin/set-availability">Availability</Link>
            <Link to="/admin/appointments">Appointments</Link>
          </>
        )}

        {role === "USER" && (
          <>
            <Link to="/user">Dashboard</Link>
            <Link to="/user/doctors">Doctors</Link>
            <Link to="/user/check-availability">Availability</Link>
            <Link to="/user/book">Book</Link>
          </>
        )}

        <LogoutButton />
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#222",
    color: "#fff"
  },
  logo: {
    margin: 0
  },
  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  }
};

export default Navbar;
