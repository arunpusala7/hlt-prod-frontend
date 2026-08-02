import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";

function LandingPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const specialties = [
    "General Medicine",
    "Cardiology",
    "Pediatrics",
    "Neurology",
    "Orthopedics"
  ];

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await api.get("/api/doctors/landing-page-doctors");
        setDoctors(res.data || []);
      } catch (err) {
        setDoctors([
          { id: 1, name: "Dr. Sarah Jenkins", specialization: "Cardiology" },
          { id: 2, name: "Dr. Rajesh Sharma", specialization: "General Medicine" },
          { id: 3, name: "Dr. Elena Rostova", specialization: "Pediatrics" },
          { id: 4, name: "Dr. Marcus Vance", specialization: "Neurology" }
        ]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || 
      doc.specialization?.toLowerCase().includes(selectedSpecialty.toLowerCase());
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div style={styles.pageWrapper}>
      {/* ================= HEADER ================= */}
      <nav style={styles.navbar}>
        <div className="landing-nav-container" style={styles.navContainer}>
          <div style={styles.logoGroup} onClick={() => navigate("/")}>
            <div style={styles.logoText}>
              Health<span style={{ color: "#2563eb" }}>Connect</span>
            </div>
          </div>

          <div className="landing-desktop-links" style={styles.desktopNavLinks}>
            <span style={styles.navLink} onClick={() => scrollToSection("about")}>About</span>
            <span style={styles.navLink} onClick={() => scrollToSection("doctors")}>Doctors</span>
            <span style={styles.navLink} onClick={() => scrollToSection("how-it-works")}>How It Works</span>
            <span style={styles.navLink} onClick={() => navigate("/login")}>Sign In</span>
          </div>

          <div style={styles.actionGroup}>
            <button 
              className="landing-hamburger-btn"
              style={styles.hamburgerBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={styles.mobileMenuDropdown}
            >
              <div style={styles.mobileMenuItem} onClick={() => scrollToSection("about")}>About Us</div>
              <div style={styles.mobileMenuItem} onClick={() => scrollToSection("doctors")}>Find Specialists</div>
              <div style={styles.mobileMenuItem} onClick={() => scrollToSection("how-it-works")}>How It Works</div>
              <div style={styles.mobileMenuItem} onClick={() => navigate("/login")}>Sign In</div>
              <div style={styles.mobileMenuItem} onClick={() => navigate("/register")}>Create Account</div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ================= HERO (FULL-WIDTH HORIZONTAL IMAGE BANNER) ================= */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          <div style={styles.heroTextCol}>
            <div style={styles.pillBadge}>Smart Healthcare Access</div>
            <h1 style={styles.heroHeading}>
              Book Doctor Appointments <br />
              <span style={{ color: "#2563eb" }}>On Your Phone</span>
            </h1>
          </div>

          {/* Full Horizontal Banner Container */}
          <div style={styles.fullBannerWrapper}>
            <img
              src="/minimal_doctor.jpg"
              alt="Medical Professional Banner"
              style={styles.fullWidthBannerImg}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1200&auto=format&fit=crop";
              }}
            />
          </div>

          <div style={{ ...styles.heroTextCol, marginTop: "16px" }}>
            <p style={styles.heroSubheading}>
              Connect directly with verified specialists. Book slots online, verify via email OTP, and receive instant digital QR tickets.
            </p>

            <div style={styles.heroBtnGroup}>
              <button style={styles.heroPrimaryBtn} onClick={() => navigate("/register")}>
                Book Appointment
              </button>
              <button style={styles.heroSecondaryBtn} onClick={() => scrollToSection("about")}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BASIC INFORMATION ================= */}
      <section id="about" style={styles.sectionContainer}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Why Choose HealthConnect</h2>
          <p style={styles.sectionSub}>Simple, secure, and fast medical consultations.</p>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoDot}></div>
            <h3 style={styles.infoTitle}>Verified Specialists</h3>
            <p style={styles.infoText}>
              Consult certified hospital doctors with real-time slot availability.
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoDot}></div>
            <h3 style={styles.infoTitle}>Email OTP Protection</h3>
            <p style={styles.infoText}>
              6-digit OTP verification ensures valid bookings and email confirmation.
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoDot}></div>
            <h3 style={styles.infoTitle}>Digital QR Ticket</h3>
            <p style={styles.infoText}>
              Get an instant digital ticket on your phone for priority hospital entry.
            </p>
          </div>
        </div>
      </section>

      {/* ================= DOCTOR DIRECTORY ================= */}
      <section id="doctors" style={{ ...styles.sectionContainer, backgroundColor: "#ffffff" }}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Available Doctors</h2>
          <p style={styles.sectionSub}>Select a specialist to reserve your appointment.</p>
        </div>

        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search doctor or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.chipRow}>
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty((prev) => (prev === spec ? "" : spec))}
              style={selectedSpecialty === spec ? styles.chipActive : styles.chip}
            >
              {spec}
            </button>
          ))}
        </div>

        {loadingDoctors ? (
          <p style={{ textAlign: "center", color: "#64748b", fontSize: "13px" }}>Loading doctors...</p>
        ) : (
          <div style={styles.doctorGrid}>
            {filteredDoctors.map((doc) => (
              <div key={doc.id} style={styles.doctorCard}>
                <div style={styles.docAvatarRow}>
                  <div style={styles.docAvatar}>
                    {doc.name ? doc.name.charAt(0) : "D"}
                  </div>
                  <div>
                    <h3 style={styles.docName}>{doc.name}</h3>
                    <p style={styles.docSpecialty}>{doc.specialization || "General Medicine"}</p>
                  </div>
                </div>

                <button
                  style={styles.docBookBtn}
                  onClick={() => navigate("/register")}
                >
                  Book Slot
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= HOW IT WORKS (3 STEPS) ================= */}
      <section id="how-it-works" style={styles.sectionContainer}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
        </div>

        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <span style={styles.stepNum}>1</span>
            <h3 style={styles.stepTitle}>Select Doctor</h3>
            <p style={styles.stepDesc}>Pick your specialist and select an available slot.</p>
          </div>

          <div style={styles.stepCard}>
            <span style={styles.stepNum}>2</span>
            <h3 style={styles.stepTitle}>Verify Email OTP</h3>
            <p style={styles.stepDesc}>Enter the 6-digit security code sent to your email.</p>
          </div>

          <div style={styles.stepCard}>
            <span style={styles.stepNum}>3</span>
            <h3 style={styles.stepTitle}>Get QR Ticket</h3>
            <p style={styles.stepDesc}>Show your smartphone QR ticket for priority check-in.</p>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <span>HealthConnect © 2026</span>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span style={styles.footerLink} onClick={() => navigate("/login")}>Login</span>
            <span style={styles.footerLink} onClick={() => navigate("/register")}>Register</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#0f172a",
  },
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #f1f5f9",
    width: "100%",
  },
  navContainer: {
    maxWidth: "1000px",
    width: "100%",
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    boxSizing: "border-box",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  logoBadge: {
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "11px",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  desktopNavLinks: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
  },
  navLink: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
  },
  hamburgerBtn: {
    background: "transparent",
    border: "none",
    color: "#0f172a",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileMenuDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 1001,
  },
  mobileMenuItem: {
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#f8fafc",
  },

  // HERO (FULL WIDTH HORIZONTAL BANNER)
  heroSection: {
    backgroundColor: "#f8fafc",
    padding: "24px 16px 32px 16px",
    borderBottom: "1px solid #f1f5f9",
  },
  heroContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  heroTextCol: {
    textAlign: "center",
    maxWidth: "650px",
    margin: "0 auto",
  },
  pillBadge: {
    display: "inline-block",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    padding: "4px 12px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  heroHeading: {
    fontSize: "26px",
    fontWeight: "800",
    lineHeight: "1.25",
    color: "#0f172a",
    marginBottom: "10px",
    letterSpacing: "-0.3px",
  },
  heroSubheading: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.5",
    marginBottom: "18px",
  },
  heroBtnGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  heroPrimaryBtn: {
    padding: "12px 24px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  heroSecondaryBtn: {
    padding: "12px 20px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // FULL WIDTH BANNER WRAPPER
  fullBannerWrapper: {
    width: "100%",
    marginTop: "8px",
  },
  fullWidthBannerImg: {
    width: "100%",
    maxHeight: "320px",
    objectFit: "cover",
    objectPosition: "center 20%",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
  },

  // INFO SECTION
  sectionContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "35px 16px",
    width: "100%",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  sectionSub: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  infoDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    marginBottom: "10px",
  },
  infoTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  infoText: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.4",
    margin: 0,
  },

  // DOCTORS
  searchWrapper: {
    maxWidth: "400px",
    margin: "0 auto 12px auto",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: "20px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
  },
  chipRow: {
    display: "flex",
    gap: "6px",
    overflowX: "auto",
    paddingBottom: "6px",
    marginBottom: "20px",
    scrollbarWidth: "none",
  },
  chip: {
    padding: "5px 12px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#475569",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  chipActive: {
    padding: "5px 12px",
    borderRadius: "14px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  doctorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "12px",
  },
  doctorCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "14px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docAvatarRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  docAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
  },
  docName: {
    margin: "0 0 2px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  docSpecialty: {
    margin: 0,
    fontSize: "11px",
    color: "#64748b",
  },
  docBookBtn: {
    padding: "6px 12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  // STEPS
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },
  stepCard: {
    padding: "16px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  stepNum: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#2563eb",
    display: "block",
    marginBottom: "4px",
  },
  stepTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  stepDesc: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.4",
  },

  // FOOTER
  footer: {
    backgroundColor: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    padding: "16px",
    marginTop: "auto",
  },
  footerContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#64748b",
    flexWrap: "wrap",
    gap: "10px",
  },
  footerLink: {
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: "500",
  },
};
