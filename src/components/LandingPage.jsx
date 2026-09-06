import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { motion } from "framer-motion";
import { getDoctorPortrait, getSpecialtyIcon } from "../utils/doctorAvatars";
import { formatDoctorName } from "../utils/formatDoctorName";

function LandingPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");

  const specialties = [
    "All",
    "General Medicine",
    "Cardiology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "Dermatology"
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await api.get("/api/doctors/landing-page-doctors");
        setDoctors(res.data || []);
      } catch (err) {
        setDoctors([
          { id: 1, name: "Dr. Emily Roberts", specialization: "Pediatrics", consultationFee: 500 },
          { id: 2, name: "Dr. David Miller", specialization: "Dermatology", consultationFee: 500 },
          { id: 3, name: "Dr. Anita Shah", specialization: "General Medicine", consultationFee: 500 },
          { id: 4, name: "Dr. Rajesh Sharma", specialization: "Cardiology", consultationFee: 500 }
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
    const matchesSpecialty = selectedSpecialty === "All" || 
      doc.specialization?.toLowerCase().includes(selectedSpecialty.toLowerCase());
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div style={styles.pageCanvas}>
      {/* Top Floating Glass Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoGroup} onClick={() => navigate("/")}>
            {/* ECG Heartbeat Icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span style={styles.logoText}>
              Health<span style={{ color: "#3B82F6" }}>Connect</span>
            </span>
          </div>

          <div style={styles.headerRight}>
            <button 
              onClick={() => navigate("/login")} 
              style={styles.signInBtn}
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/register")} 
              style={styles.registerPillBtn}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section (Mirroring Screen 1 from UI Reference) */}
      <section style={styles.heroSection}>
        <div style={styles.heroContainer}>
          {/* Top Heartbeat Accent */}
          <div style={styles.heartbeatRow}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>

          {/* Doctor Cutout Portrait */}
          <div style={styles.portraitWrapper}>
            <img 
              src="/portraits/hero_doctor.jpg" 
              alt="Medical Specialist" 
              style={styles.portraitImg}
            />
          </div>

          {/* Elevated Surface Card Overlay (Bottom Sheet / Floating Card) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={styles.heroCard}
          >
            <span style={styles.heroTagline}>Your Health, Our Top Priority</span>
            <h1 style={styles.heroTitle}>From check-ups to care, all in one app.</h1>
            <p style={styles.heroDescription}>
              Connect with top certified medical specialists, book slots seamlessly, and receive verified digital consultations.
            </p>

            <div style={styles.ctaWrapper}>
              <button 
                onClick={() => navigate("/login")} 
                style={styles.heroPrimaryBtn}
              >
                <span>Get started</span>
                <span style={styles.arrowCircle}>↗</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Specialist Directory & Categories */}
      <section style={styles.directorySection}>
        <div style={styles.directoryContainer}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>Meet Our Specialists</h2>
              <p style={styles.sectionSub}>Book an appointment with leading hospital doctors</p>
            </div>
            
            {/* Search Pill */}
            <div style={styles.searchBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search by doctor or specialty..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Specialty Filter Horizontal Scroll Strip */}
          <div style={styles.filterStrip}>
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`filter-pill ${selectedSpecialty === spec ? 'active' : 'inactive'}`}
              >
                {getSpecialtyIcon(spec)} {spec}
              </button>
            ))}
          </div>

          {/* Doctor Cards Grid */}
          {loadingDoctors ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
              Loading verified specialists...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
              No doctors found matching your criteria.
            </div>
          ) : (
            <div style={styles.doctorGrid}>
              {filteredDoctors.map((doc) => (
                <motion.div
                  key={doc.id}
                  whileHover={{ y: -4 }}
                  className="glass-card"
                  style={styles.doctorCard}
                >
                  <div style={styles.docAvatarContainer}>
                    <img 
                      src={getDoctorPortrait(doc.id, doc.name)} 
                      alt={doc.name} 
                      style={styles.docAvatarImg} 
                    />
                  </div>

                  <div style={styles.docInfo}>
                    <h3 style={styles.docName}>{formatDoctorName(doc.name)}</h3>
                    <span style={styles.docSpecBadge}>
                      {getSpecialtyIcon(doc.specialization)} {doc.specialization || "General Specialist"}
                    </span>
                    <p style={styles.docFee}>₹{doc.consultationFee || 500} <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: "400" }}>/ Session</span></p>

                    <button
                      onClick={() => navigate(`/doctor-profile/${doc.id}`)}
                      style={styles.bookDocBtn}
                    >
                      View Profile & Slots
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={styles.footer}>
        <p>&copy; 2026 HealthConnect. Production Grade Minimalist Healthcare Experience.</p>
      </footer>
    </div>
  );
}

const styles = {
  pageCanvas: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "rgba(248, 250, 252, 0.85)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
    padding: "14px 24px",
  },
  headerInner: {
    maxWidth: "1120px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.02em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  signInBtn: {
    backgroundColor: "transparent",
    color: "#64748B",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 16px",
    borderRadius: "9999px",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  registerPillBtn: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "600",
    padding: "9px 20px",
    borderRadius: "9999px",
    boxShadow: "0 4px 14px -2px rgba(59, 130, 246, 0.4)",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Hero Section
  heroSection: {
    padding: "20px 16px 40px",
    display: "flex",
    justifyContent: "center",
  },
  heroContainer: {
    width: "100%",
    maxWidth: "460px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heartbeatRow: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    padding: "10px 16px",
  },
  portraitWrapper: {
    width: "100%",
    maxWidth: "340px",
    height: "360px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    overflow: "hidden",
    marginTop: "-20px",
    zIndex: 1,
  },
  portraitImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "bottom",
  },
  heroCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: "32px",
    padding: "32px 24px",
    boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    marginTop: "-30px",
    zIndex: 2,
    textAlign: "center",
  },
  heroTagline: {
    display: "inline-block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748B",
    marginBottom: "8px",
    letterSpacing: "0.02em",
  },
  heroTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: "1.25",
    marginBottom: "12px",
    letterSpacing: "-0.03em",
  },
  heroDescription: {
    fontSize: "14px",
    color: "#64748B",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  ctaWrapper: {
    display: "flex",
    justifyContent: "center",
  },
  heroPrimaryBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    padding: "14px 20px 14px 28px",
    borderRadius: "9999px",
    fontSize: "16px",
    fontWeight: "700",
    boxShadow: "0 8px 25px -4px rgba(59, 130, 246, 0.45)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  arrowCircle: {
    width: "34px",
    height: "34px",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "800",
  },

  // Directory Section
  directorySection: {
    padding: "20px 20px 60px",
    maxWidth: "1120px",
    width: "100%",
    margin: "0 auto",
  },
  directoryContainer: {
    width: "100%",
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  sectionSub: {
    fontSize: "14px",
    color: "#64748B",
    margin: "4px 0 0 0",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#FFFFFF",
    padding: "10px 18px",
    borderRadius: "9999px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 4px 12px -2px rgba(15, 23, 42, 0.03)",
    width: "100%",
    maxWidth: "340px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: "13px",
    width: "100%",
    backgroundColor: "transparent",
    color: "#0F172A",
  },
  filterStrip: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "12px",
    marginBottom: "24px",
    scrollbarWidth: "none",
  },

  // Doctor Grid
  doctorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
  },
  doctorCard: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  docAvatarContainer: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#EFF6FF",
    border: "3px solid #FFFFFF",
    boxShadow: "0 6px 16px -2px rgba(15, 23, 42, 0.08)",
    marginBottom: "14px",
  },
  docAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  docInfo: {
    width: "100%",
  },
  docName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  docSpecBadge: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#3B82F6",
    backgroundColor: "#EFF6FF",
    padding: "4px 10px",
    borderRadius: "9999px",
    marginBottom: "10px",
  },
  docFee: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 14px 0",
  },
  bookDocBtn: {
    width: "100%",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    padding: "10px 16px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px -2px rgba(59, 130, 246, 0.35)",
    transition: "background 0.2s",
  },

  footer: {
    marginTop: "auto",
    padding: "24px 20px",
    textAlign: "center",
    borderTop: "1px solid #E2E8F0",
    fontSize: "13px",
    color: "#94A3B8",
    backgroundColor: "#FFFFFF",
  },
};

export default LandingPage;
