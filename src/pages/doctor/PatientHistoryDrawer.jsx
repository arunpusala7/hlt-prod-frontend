import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, FileText, Activity, ArrowLeft } from 'lucide-react';

const PatientHistoryDrawer = ({ isOpen, onClose, history, patientName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - dims the background & clicking it closes drawer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={styles.backdrop}
          />
          
          {/* Side Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={styles.drawerContainer}
          >
            {/* Header with Prominent Back Button */}
            <div style={styles.headerRow}>
              <button onClick={onClose} style={styles.backTopBtn}>
                <ArrowLeft size={16} /> &nbsp;Back to Queue
              </button>

              <button onClick={onClose} style={styles.closeIconBtn} aria-label="Close History">
                <X size={20} />
              </button>
            </div>

            {/* Patient Header Details */}
            <div style={styles.patientInfoBox}>
              <h2 style={styles.patientName}>{patientName}</h2>
              <p style={styles.medicalHistoryTag}>Medical Consultation History</p>
            </div>

            {/* Timeline Wrapper */}
            <div style={styles.timelineWrapper}>
              {history.length === 0 ? (
                <div style={styles.emptyState}>
                  <Activity size={36} style={{ opacity: 0.3, marginBottom: '10px', color: '#2563eb' }} />
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No past medical history found for this patient.</p>
                </div>
              ) : (
                history.map((item, index) => (
                  <div key={index} style={styles.timelineItem}>
                    {/* Timeline Dot */}
                    <div style={styles.timelineDot} />
                    
                    <div style={styles.cardItem}>
                      <div style={styles.dateLabel}>
                        <Calendar size={13} style={{ color: '#2563eb' }} />
                        <span>{item.date}</span>
                      </div>

                      <div style={styles.rxBox}>
                        <FileText size={16} style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <span style={styles.rxHeaderTag}>Prescription & Doctor Notes</span>
                          <p style={styles.rxContent}>
                            "{item.prescription || "No notes recorded"}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Back Button */}
            <div style={styles.drawerFooter}>
              <button onClick={onClose} style={styles.footerBackBtn}>
                &larr; Return to Schedule Queue
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 1400,
  },
  drawerContainer: {
    position: 'fixed',
    right: 0,
    top: 0,
    height: '100vh',
    width: 'min(460px, 100vw)',
    backgroundColor: '#ffffff',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
    zIndex: 1401,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    boxSizing: 'border-box',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backTopBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  closeIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px',
  },

  patientInfoBox: {
    paddingBottom: '14px',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '20px',
  },
  patientName: {
    margin: '0 0 2px 0',
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
  },
  medicalHistoryTag: {
    margin: 0,
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  timelineWrapper: {
    position: 'relative',
    borderLeft: '2px solid #e2e8f0',
    marginLeft: '10px',
    paddingLeft: '24px',
    flex: 1,
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 0',
  },
  timelineItem: {
    marginBottom: '24px',
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: '-32px',
    top: '4px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    border: '3px solid #2563eb',
  },
  cardItem: {
    backgroundColor: '#f8fafc',
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  dateLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
    color: '#0f172a',
    fontWeight: '700',
    fontSize: '13px',
  },
  rxBox: {
    backgroundColor: '#ffffff',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    display: 'flex',
    gap: '10px',
  },
  rxHeaderTag: {
    display: 'block',
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: '2px',
  },
  rxContent: {
    margin: 0,
    fontSize: "13px",
    color: "#334155",
    lineHeight: "1.5",
  },

  drawerFooter: {
    marginTop: 'auto',
    paddingTop: '14px',
    borderTop: '1px solid #f1f5f9',
  },
  footerBackBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default PatientHistoryDrawer;