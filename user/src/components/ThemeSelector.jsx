import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export const THEME_OPTIONS = [
  {
    id: "high-glass",
    name: "High Glassmorphism",
    badge: "✨ Vivid Aura",
    subtitle: "Deep blur & glowing edges",
    desc: "28px frosted blur, higher translucency, vibrant background mesh aura, and glowing specular border reflections.",
    previewStyle: {
      background: "rgba(255, 255, 255, 0.65)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1.5px solid rgba(255, 255, 255, 0.95)",
      boxShadow: "0 10px 25px -4px rgba(59, 130, 246, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 1)",
    },
    samplePill: {
      background: "rgba(59, 130, 246, 0.2)",
      color: "#2563EB",
      border: "1px solid rgba(59, 130, 246, 0.35)",
    }
  },
  {
    id: "fluid-theme",
    name: "Fluid Theme",
    badge: "🌊 iPhone Liquid",
    subtitle: "iOS liquid vibrancy & squircle glass",
    desc: "Inspired by iPhone & iOS: dynamic aurora mesh gradients, 32px Apple material blur, continuous squircle curvature, and liquid specular refraction.",
    previewStyle: {
      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.45))",
      backdropFilter: "blur(24px) saturate(220%)",
      WebkitBackdropFilter: "blur(24px) saturate(220%)",
      border: "1.5px solid rgba(255, 255, 255, 0.95)",
      boxShadow: "0 12px 32px -4px rgba(99, 102, 241, 0.25), inset 0 1.5px 0 0 rgba(255, 255, 255, 1)",
    },
    samplePill: {
      background: "linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(59, 130, 246, 0.25))",
      color: "#4338CA",
      border: "1px solid rgba(99, 102, 241, 0.4)",
    }
  },
  {
    id: "normal-glass",
    name: "Normal Glassmorphism",
    badge: "💎 Balanced Glass",
    subtitle: "Modern clinical polish",
    desc: "18px balanced frosted glass, subtle specular light line, ambient aura, and clean depth.",
    previewStyle: {
      background: "rgba(255, 255, 255, 0.82)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "1px solid rgba(255, 255, 255, 0.9)",
      boxShadow: "0 8px 20px -3px rgba(15, 23, 42, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
    },
    samplePill: {
      background: "#EFF6FF",
      color: "#3B82F6",
      border: "1px solid #BFDBFE",
    }
  },
  {
    id: "base-normal",
    name: "Base Normal",
    badge: "🏛️ Enterprise Solid",
    subtitle: "Classic solid cards",
    desc: "100% solid pure white surfaces, classic slate gray borders, standard elevation shadows, and zero blur.",
    previewStyle: {
      background: "#FFFFFF",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      border: "1px solid #E2E8F0",
      boxShadow: "0 4px 14px -2px rgba(15, 23, 42, 0.06)",
    },
    samplePill: {
      background: "#F1F5F9",
      color: "#334155",
      border: "1px solid #CBD5E1",
    }
  },
  {
    id: "minimal-swiggy",
    name: "Minimal like Swiggy",
    badge: "⚡ Instant Speed",
    subtitle: "Ultra-flat & distraction-free",
    desc: "Ultra-clean flat cards, razor-thin hairline borders, neutral canvas, zero glare, and snappy tactile response.",
    previewStyle: {
      background: "#FFFFFF",
      backdropFilter: "none",
      WebkitBackdropFilter: "none",
      border: "1px solid #EEF0F2",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
    },
    samplePill: {
      background: "#F8FAFC",
      color: "#0F172A",
      border: "1px solid #E2E8F0",
    }
  },
];

export function applyTheme(themeId) {
  try {
    document.documentElement.setAttribute("data-app-theme", themeId);
    localStorage.setItem("appTheme", themeId);
    window.dispatchEvent(new CustomEvent("app-theme-changed", { detail: { theme: themeId } }));
  } catch (err) {
    console.error("Error setting app theme:", err);
  }
}

export default function ThemeSelector({ className = "" }) {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem("appTheme") || "base-normal";
  });

  useEffect(() => {
    // Ensure document attribute is synchronized on mount
    const saved = localStorage.getItem("appTheme") || "base-normal";
    document.documentElement.setAttribute("data-app-theme", saved);
    setActiveTheme(saved);

    const handleThemeEvent = (e) => {
      if (e.detail?.theme) {
        setActiveTheme(e.detail.theme);
      }
    };
    window.addEventListener("app-theme-changed", handleThemeEvent);
    return () => window.removeEventListener("app-theme-changed", handleThemeEvent);
  }, []);

  const handleSelect = (theme) => {
    if (activeTheme === theme.id) return;
    setActiveTheme(theme.id);
    applyTheme(theme.id);
    toast.success(`Active theme: ${theme.name}`, {
      icon: theme.id === "fluid-theme" ? "🌊" : theme.id === "high-glass" ? "✨" : theme.id === "minimal-swiggy" ? "⚡" : theme.id === "base-normal" ? "🏛️" : "💎",
      style: {
        borderRadius: "9999px",
        background: "rgba(15, 23, 42, 0.92)",
        color: "#ffffff",
        fontSize: "13px",
        fontWeight: "600",
      },
    });
  };

  return (
    <div className={`profile-card ${className}`} style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.titleBadgeRow}>
            <span style={styles.headerIcon}>🎨</span>
            <h3 style={styles.heading}>Interface Appearance & Visual Theme</h3>
          </div>
          <p style={styles.subheading}>
            Select your preferred visual style across all screens, doctor cards, and navigation.
          </p>
        </div>
      </div>

      {/* 2x2 Grid for Desktop, Single Column for Mobile */}
      <div style={styles.grid}>
        {THEME_OPTIONS.map((t) => {
          const isSelected = activeTheme === t.id;
          return (
            <motion.div
              key={t.id}
              whileTap={{ scale: 0.975 }}
              onClick={() => handleSelect(t)}
              className="tactile-card"
              style={{
                ...styles.themeOptionCard,
                ...(isSelected ? styles.themeOptionActive : styles.themeOptionInactive),
              }}
            >
              {/* Card Top Row: Badge & Radio Check */}
              <div style={styles.optionTopRow}>
                <span style={isSelected ? styles.tagActive : styles.tagInactive}>
                  {t.badge}
                </span>

                <div style={isSelected ? styles.radioOuterActive : styles.radioOuterInactive}>
                  {isSelected && <div style={styles.radioInner}></div>}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div style={{ marginTop: "10px" }}>
                <h4 style={styles.optionTitle}>{t.name}</h4>
                <p style={styles.optionSubtitle}>{t.subtitle}</p>
              </div>

              {/* Mini Simulated Card Preview */}
              <div style={styles.previewContainer}>
                <div style={{ ...styles.previewCardBox, ...t.previewStyle }}>
                  <div style={styles.previewRow}>
                    <div style={styles.previewAvatar}></div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.previewLineOne}></div>
                      <div style={styles.previewLineTwo}></div>
                    </div>
                    <div style={{ ...styles.previewPill, ...t.samplePill }}>
                      Slot
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={styles.optionDesc}>{t.desc}</p>

              {/* Active Indicator Strip */}
              {isSelected && (
                <div style={styles.activeFooterPill}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Currently Applied</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
  },
  headerRow: {
    marginBottom: "18px",
  },
  titleBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  headerIcon: {
    fontSize: "18px",
  },
  heading: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  subheading: {
    fontSize: "13px",
    color: "#64748B",
    margin: 0,
    lineHeight: "1.4",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  themeOptionCard: {
    padding: "16px",
    borderRadius: "20px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    transition: "all 0.18s cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  themeOptionInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    border: "1.5px solid rgba(226, 232, 240, 0.8)",
  },
  themeOptionActive: {
    backgroundColor: "rgba(239, 246, 255, 0.75)",
    border: "2px solid #3B82F6",
    boxShadow: "0 8px 24px -4px rgba(59, 130, 246, 0.25)",
  },
  optionTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagActive: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#1D4ED8",
    backgroundColor: "#DBEAFE",
    padding: "3px 9px",
    borderRadius: "9999px",
    letterSpacing: "0.01em",
  },
  tagInactive: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "rgba(241, 245, 249, 0.9)",
    padding: "3px 9px",
    borderRadius: "9999px",
  },
  radioOuterInactive: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #CBD5E1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioOuterActive: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2px solid #3B82F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioInner: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
  },
  optionTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  optionSubtitle: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
    fontWeight: "500",
  },
  previewContainer: {
    margin: "12px 0",
    padding: "10px",
    borderRadius: "14px",
    backgroundColor: "rgba(241, 245, 249, 0.5)",
    border: "1px dashed rgba(203, 213, 225, 0.8)",
  },
  previewCardBox: {
    padding: "10px 12px",
    borderRadius: "12px",
    width: "100%",
  },
  previewRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  previewAvatar: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#93C5FD",
    flexShrink: 0,
  },
  previewLineOne: {
    height: "6px",
    width: "60%",
    backgroundColor: "#CBD5E1",
    borderRadius: "9999px",
    marginBottom: "4px",
  },
  previewLineTwo: {
    height: "5px",
    width: "40%",
    backgroundColor: "#E2E8F0",
    borderRadius: "9999px",
  },
  previewPill: {
    fontSize: "9px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "9999px",
    flexShrink: 0,
  },
  optionDesc: {
    fontSize: "11.5px",
    color: "#64748B",
    lineHeight: "1.45",
    margin: "0 0 10px 0",
  },
  activeFooterPill: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#2563EB",
    paddingTop: "6px",
    borderTop: "1px solid rgba(191, 219, 254, 0.8)",
  },
};
