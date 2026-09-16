import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_REASONS = [
  { id: "busy", label: "Busy on that date / Schedule conflict", icon: "🗓️" },
  { id: "resolved", label: "Health issue resolved / Feeling better", icon: "🩺" },
  { id: "hospital", label: "Consulting a nearby hospital instead", icon: "🏥" },
  { id: "unavailable", label: "Doctor unavailable or emergency", icon: "👨‍⚕️" },
  { id: "slot", label: "Found a better / earlier time slot", icon: "⚡" },
  { id: "other", label: "Other personal reason", icon: "💬" }
];

export default function CancelReasonDropdown({ 
  value, 
  onChange, 
  customNote = "", 
  onCustomNoteChange = null,
  placeholder = "Select reason for cancellation..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = DEFAULT_REASONS.find(
    r => r.label === value || r.id === value || value?.toLowerCase().includes(r.id)
  );

  return (
    <div ref={dropdownRef} style={styles.container}>
      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          ...styles.trigger,
          borderColor: isOpen ? "#3B82F6" : "#CBD5E1",
          boxShadow: isOpen ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "0 1px 3px rgba(15, 23, 42, 0.05)"
        }}
      >
        <div style={styles.triggerLeft}>
          <span style={styles.triggerIcon}>{selectedItem ? selectedItem.icon : "📋"}</span>
          <span style={value ? styles.triggerText : styles.triggerPlaceholder}>
            {value || placeholder}
          </span>
        </div>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          transition={{ duration: 0.2 }}
          style={styles.chevron}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.div>
      </div>

      {/* Floating Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={styles.menu}
          >
            {DEFAULT_REASONS.map((reason) => {
              const isSelected = value === reason.label || value === reason.id;
              return (
                <div
                  key={reason.id}
                  onClick={() => {
                    onChange(reason.label);
                    setIsOpen(false);
                  }}
                  style={{
                    ...styles.optionItem,
                    backgroundColor: isSelected ? "#EFF6FF" : "transparent",
                    color: isSelected ? "#1D4ED8" : "#1E293B",
                    fontWeight: isSelected ? "700" : "500",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={styles.optionLeft}>
                    <span style={styles.optionIcon}>{reason.icon}</span>
                    <span style={styles.optionLabel}>{reason.label}</span>
                  </div>
                  {isSelected && (
                    <span style={styles.checkMark}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Note input if 'Other' selected */}
      {(value === "Other personal reason" || value === "Other") && onCustomNoteChange && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: "auto" }}
          style={{ marginTop: "10px" }}
        >
          <input
            type="text"
            placeholder="Please specify your reason (optional)..."
            value={customNote}
            onChange={(e) => onCustomNoteChange(e.target.value)}
            style={styles.customNoteInput}
          />
        </motion.div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "100%",
  },
  trigger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 14px",
    backgroundColor: "var(--input-bg, #FFFFFF)",
    borderRadius: "14px",
    border: "1px solid #CBD5E1",
    cursor: "pointer",
    transition: "all 0.18s ease",
    userSelect: "none",
  },
  triggerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    overflow: "hidden",
  },
  triggerIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  triggerText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0F172A",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  triggerPlaceholder: {
    fontSize: "13px",
    color: "#94A3B8",
  },
  chevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: "8px",
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid rgba(226, 232, 240, 0.95)",
    boxShadow: "0 14px 34px -4px rgba(15, 23, 42, 0.15), 0 4px 12px rgba(0, 0, 0, 0.04)",
    padding: "6px",
    zIndex: 100,
    maxHeight: "260px",
    overflowY: "auto",
  },
  optionItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background-color 0.12s ease",
    fontSize: "13px",
  },
  optionLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  optionIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  optionLabel: {
    lineHeight: "1.3",
  },
  checkMark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  customNoteInput: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    outline: "none",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    boxSizing: "border-box",
  }
};
