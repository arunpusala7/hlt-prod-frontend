import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LoginSheet from "./LoginSheet";
import RegisterSheet from "./RegisterSheet";

/**
 * LandingPage Component
 * Elevated, high-end healthcare presentation with minimal glassmorphism.
 * Single non-scrollable viewport-fitted design (100dvh) with spring-physics bottom sheets.
 */
function LandingPage({ initialAuthSheet = null, initialEmail = "", initialSuccessMessage = "" }) {
  const navigate = useNavigate();
  const [activeAuthSheet, setActiveAuthSheet] = useState(initialAuthSheet);
  const [authEmail, setAuthEmail] = useState(initialEmail);
  const [authSuccessMessage, setAuthSuccessMessage] = useState(initialSuccessMessage);

  useEffect(() => {
    if (initialAuthSheet) {
      setActiveAuthSheet(initialAuthSheet);
    }
  }, [initialAuthSheet]);

  useEffect(() => {
    if (initialEmail) {
      setAuthEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (initialSuccessMessage) {
      setAuthSuccessMessage(initialSuccessMessage);
    }
  }, [initialSuccessMessage]);

  const handleCloseSheet = () => {
    setActiveAuthSheet(null);
    if (window.location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  };

  return (
    <div style={styles.pageCanvas}>
      {/* 1. Elevated Minimal Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoGroup} onClick={() => navigate("/")} title="HealthConnect">
            <span style={styles.logoText}>
              Health<span style={{ color: "#2563EB" }}>Connect</span>
            </span>
          </div>

          <div style={styles.headerRight}>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveAuthSheet("login")} 
              style={styles.signInBtn}
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </header>

      {/* 2. Single Non-Scrollable Hero Canvas (Zero Glassmorphism) */}
      <main style={styles.heroMain}>
        <div style={styles.heroContentContainer}>
          {/* Top Hero Image Showcase - Female Doctor Portrait (No circles/popups) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={styles.imageContainer}
          >
            <img 
              src="/portraits/doctor_female.png" 
              alt="Dr. Reva Sharma - Healthcare Specialist" 
              style={styles.heroDoctorImg}
              onError={(e) => {
                e.target.src = "/portraits/doctor_female.jpg";
              }}
            />
          </motion.div>

          {/* Clean Solid Information Card - Spacious, Free, Positioned Well Above Get Started Button */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            style={styles.infoCard}
          >
            <div style={styles.taglineBadge}>
              <span style={styles.taglineText}>India's Trusted Telehealth Network</span>
            </div>

            <h1 style={styles.mainTitle}>
              From check-ups to care,{" "}
              <span style={styles.gradientHeadingText}>all in one app.</span>
            </h1>

            <p style={styles.description}>
              Connect with verified doctors, reserve hospital slots in 60 seconds, and receive digital passes instantly.
            </p>

            {/* Feature Highlights Row */}
            <div style={styles.featuresRow}>
              <div style={styles.featureItem}>
                <span style={styles.featureLabel}>⭐ 4.9 Rating</span>
                <span style={styles.featureSub}>Top Rated Care</span>
              </div>
              <div style={styles.featureDivider}></div>
              <div style={styles.featureItem}>
                <span style={styles.featureLabel}>🛡️ 1,200+ Docs</span>
                <span style={styles.featureSub}>Board Certified</span>
              </div>
              <div style={styles.featureDivider}></div>
              <div style={styles.featureItem}>
                <span style={styles.featureLabel}>⚡ Instant Pass</span>
                <span style={styles.featureSub}>Zero Waiting</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 3. Fixed Bottom "Get Started" Action (Pinned at Bottom of Viewport) */}
      <div style={styles.fixedBottomContainer}>
        <motion.button 
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveAuthSheet("register")} 
          style={styles.fixedGetStartedBtn}
        >
          <div style={styles.btnTextCol}>
            <span style={styles.btnMainLabel}>Get Started</span>
            <span style={styles.btnSubLabel}>Free instant digital pass</span>
          </div>
          <div style={styles.arrowCircle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
        </motion.button>
        <span style={styles.trustCaption}>
          🔒 HIPAA-Grade Security • 100% Confidential • Instant Digital Pass
        </span>
      </div>

      {/* 4. Bottom-Up Sheets for Login & Register (Minimal Glassmorphism with Spring Physics) */}
      <AnimatePresence>
        {activeAuthSheet === "login" && (
          <LoginSheet
            key="login-sheet"
            isOpen={true}
            initialEmail={authEmail}
            initialSuccessMessage={authSuccessMessage}
            onClose={handleCloseSheet}
            onSwitchToRegister={() => {
              setAuthSuccessMessage("");
              setActiveAuthSheet("register");
            }}
          />
        )}

        {activeAuthSheet === "register" && (
          <RegisterSheet
            key="register-sheet"
            isOpen={true}
            onClose={handleCloseSheet}
            onSwitchToLogin={(registeredEmail) => {
              if (registeredEmail) {
                setAuthEmail(registeredEmail);
                setAuthSuccessMessage("Account created successfully! Please sign in with your password.");
              }
              setActiveAuthSheet("login");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  pageCanvas: {
    height: "100dvh",
    maxHeight: "100dvh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  header: {
    height: "64px",
    flexShrink: 0,
    zIndex: 100,
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
  },
  headerInner: {
    width: "100%",
    maxWidth: "960px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoGroup: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  logoText: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.02em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
  },
  signInBtn: {
    backgroundColor: "#FFFFFF",
    color: "#1D4ED8",
    fontSize: "13px",
    fontWeight: "700",
    padding: "6px 16px",
    borderRadius: "9999px",
    cursor: "pointer",
    border: "1px solid #BFDBFE",
    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.08)",
    transition: "all 0.15s ease",
  },

  // Hero Area (Non-Scrollable, Solid Healthcare Canvas, Zero Glassmorphism)
  heroMain: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 18px 120px 18px",
  },
  heroContentContainer: {
    width: "100%",
    maxWidth: "520px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    zIndex: 1,
  },

  // Image Showcase Section - Female Doctor Portrait (Enlarged, Zero Gap, Overlapped by Card)
  imageContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    flex: 1,
    minHeight: "260px",
    maxHeight: "470px",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 2,
  },
  heroDoctorImg: {
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    objectPosition: "bottom",
    transform: "scale(1.06)",
    transformOrigin: "bottom center",
    position: "relative",
    zIndex: 2,
    filter: "drop-shadow(0 16px 36px rgba(15, 23, 42, 0.16))",
  },

  // Solid, Spacious Information Card (Gracefully Overlapping Doctor Image, Elevated Above Get Started CTA)
  infoCard: {
    width: "100%",
    maxWidth: "480px",
    padding: "20px 24px 18px",
    textAlign: "center",
    borderRadius: "24px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    boxShadow: "0 -4px 20px rgba(15, 23, 42, 0.04), 0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04)",
    position: "relative",
    zIndex: 10,
    marginTop: "-42px",
    marginBottom: "10px",
  },
  taglineBadge: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    border: "1px solid #DBEAFE",
    padding: "4px 12px",
    borderRadius: "9999px",
    marginBottom: "8px",
  },
  taglineText: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#1D4ED8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  mainTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: "1.3",
    marginBottom: "8px",
    letterSpacing: "-0.02em",
  },
  gradientHeadingText: {
    background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  description: {
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.5",
    maxWidth: "420px",
    margin: "0 auto 14px auto",
  },
  featuresRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: "14px",
    padding: "10px 14px",
    border: "1px solid #E2E8F0",
  },
  featureItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    flex: 1,
  },
  featureLabel: {
    fontSize: "11.5px",
    fontWeight: "800",
    color: "#0F172A",
    whiteSpace: "nowrap",
  },
  featureSub: {
    fontSize: "9.5px",
    fontWeight: "600",
    color: "#64748B",
    whiteSpace: "nowrap",
  },
  featureDivider: {
    width: "1px",
    height: "22px",
    backgroundColor: "#E2E8F0",
  },

  // 3. Fixed Bottom Container (Thumb-friendly & Pinned)
  fixedBottomContainer: {
    position: "fixed",
    bottom: "16px",
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "0 18px",
    zIndex: 1000,
    pointerEvents: "none",
  },
  fixedGetStartedBtn: {
    pointerEvents: "auto",
    width: "100%",
    maxWidth: "480px",
    height: "56px",
    borderRadius: "9999px",
    background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px 0 24px",
    cursor: "pointer",
    boxShadow: "0 12px 30px -4px rgba(37, 99, 235, 0.45)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  btnTextCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
  },
  btnMainLabel: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: "-0.01em",
  },
  btnSubLabel: {
    fontSize: "10.5px",
    fontWeight: "600",
    color: "#BFDBFE",
  },
  arrowCircle: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  trustCaption: {
    marginTop: "7px",
    fontSize: "10.5px",
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    letterSpacing: "0.01em",
  },
};

export default LandingPage;
