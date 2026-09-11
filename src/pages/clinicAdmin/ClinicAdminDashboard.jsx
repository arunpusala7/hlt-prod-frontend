import React, { useState, useEffect, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  Building2,
  Users,
  Stethoscope,
  CreditCard,
  Plus,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  Calendar,
  X,
  ShieldCheck,
  TrendingUp
} from "lucide-react";

export default function ClinicAdminDashboard() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("overview"); // overview | doctors | assistants | transactions
  const [loading, setLoading] = useState(true);

  // Clinic overview state
  const [clinicData, setClinicData] = useState({
    clinicId: null,
    clinicName: "",
    branchName: "",
    clinicCode: "",
    phone: "",
    email: "",
    address: "",
    totalRevenue: 0,
    totalTransactions: 0,
    clinicAdmins: [],
    doctors: [],
    assistants: [],
    transactions: [],
  });

  // Modals state
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddAssistantModal, setShowAddAssistantModal] = useState(false);

  // Form states
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    specialization: "",
    qualification: "",
    experience: 5,
    consultationFee: 500,
    about: "",
  });
  const [assistantForm, setAssistantForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter state
  const [doctorSearch, setDoctorSearch] = useState("");
  const [assistantSearch, setAssistantSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");

  const clinicAdminName = localStorage.getItem("userName") || "Clinic Administrator";

  useEffect(() => {
    fetchClinicOverview();
  }, []);

  const fetchClinicOverview = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/api/clinic-admin/overview");
      if (res.data) {
        startTransition(() => {
          setClinicData(res.data);
        });
      }
    } catch (err) {
      console.error("Failed to load clinic overview:", err);
      // Fallback: try transactions endpoint
      try {
        const txRes = await api.get("/api/clinic-admin/transactions");
        if (txRes.data) {
          startTransition(() => {
            setClinicData((prev) => ({ ...prev, transactions: txRes.data }));
          });
        }
      } catch (e2) {}
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Submit Add Doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!doctorForm.name || !doctorForm.email || !doctorForm.password) {
      toast.error("Please fill in required fields (Name, Email, Password)");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Onboarding doctor to clinic...");
    try {
      await api.post("/api/clinic-admin/doctors", {
        ...doctorForm,
        experience: Number(doctorForm.experience),
        consultationFee: Number(doctorForm.consultationFee),
      });
      toast.success(`Dr. ${doctorForm.name} onboarded successfully!`, { id: toastId });
      setShowAddDoctorModal(false);
      setDoctorForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        specialization: "",
        qualification: "",
        experience: 5,
        consultationFee: 500,
        about: "",
      });
      fetchClinicOverview(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to onboard doctor.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Add Assistant
  const handleAddAssistant = async (e) => {
    e.preventDefault();
    if (!assistantForm.name || !assistantForm.email || !assistantForm.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Registering front-desk assistant...");
    try {
      await api.post("/api/clinic-admin/assistants", assistantForm);
      toast.success(`${assistantForm.name} registered as front-desk PA!`, { id: toastId });
      setShowAddAssistantModal(false);
      setAssistantForm({
        name: "",
        email: "",
        password: "",
        phone: "",
      });
      fetchClinicOverview(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to onboard assistant.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const filteredDoctors = (clinicData.doctors || []).filter(
    (d) =>
      !doctorSearch.trim() ||
      d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.email?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredAssistants = (clinicData.assistants || []).filter(
    (a) =>
      !assistantSearch.trim() ||
      a.name?.toLowerCase().includes(assistantSearch.toLowerCase()) ||
      a.email?.toLowerCase().includes(assistantSearch.toLowerCase())
  );

  const filteredTransactions = (clinicData.transactions || []).filter(
    (t) =>
      !transactionSearch.trim() ||
      t.patientName?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.doctorName?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.razorpayOrderId?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.razorpayPaymentId?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  return (
    <div style={styles.pageWrap}>
      {/* Top Header */}
      <header style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>
            <Building2 size={20} color="#2563EB" />
          </div>
          <div>
            <div style={styles.headerClinic}>
              {clinicData.clinicName || clinicData.branchName || "Clinic Branch"}
            </div>
            <div style={styles.headerRoleBadge}>
              <span style={styles.onlineDot}></span>
              <span>Clinic Admin Portal &bull; {clinicAdminName}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={styles.tabGroup}>
          <button
            onClick={() => setActiveTab("overview")}
            style={activeTab === "overview" ? styles.tabActive : styles.tabInactive}
          >
            <Building2 size={16} />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            style={activeTab === "doctors" ? styles.tabActive : styles.tabInactive}
          >
            <Stethoscope size={16} />
            <span>Doctors ({clinicData.doctors?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("assistants")}
            style={activeTab === "assistants" ? styles.tabActive : styles.tabInactive}
          >
            <Users size={16} />
            <span>Front-Desk PAs ({clinicData.assistants?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            style={activeTab === "transactions" ? styles.tabActive : styles.tabInactive}
          >
            <CreditCard size={16} />
            <span>Transactions ({clinicData.transactions?.length || 0})</span>
          </button>
        </div>

        {/* Action Right */}
        <div style={styles.headerRight}>
          <button onClick={() => fetchClinicOverview()} style={styles.refreshBtn} title="Refresh">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.mainContainer}>
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div style={styles.tabContent}>
            {/* KPI Cards */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapBlue}>
                  <Stethoscope size={24} color="#2563EB" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Clinic Doctors</p>
                  <h3 style={styles.kpiValue}>{clinicData.doctors?.length || 0}</h3>
                  <p style={styles.kpiSub}>Active practitioners</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapGreen}>
                  <Users size={24} color="#16A34A" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Front-Desk PAs</p>
                  <h3 style={{ ...styles.kpiValue, color: "#16A34A" }}>
                    {clinicData.assistants?.length || 0}
                  </h3>
                  <p style={styles.kpiSub}>Receptionists & check-in staff</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapAmber}>
                  <CreditCard size={24} color="#D97706" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Total Transactions</p>
                  <h3 style={{ ...styles.kpiValue, color: "#D97706" }}>
                    {clinicData.totalTransactions || clinicData.transactions?.length || 0}
                  </h3>
                  <p style={styles.kpiSub}>Completed consultations</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapPurple}>
                  <TrendingUp size={24} color="#7C3AED" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Gross Clinic Revenue</p>
                  <h3 style={{ ...styles.kpiValue, color: "#7C3AED" }}>
                    ₹{Number(clinicData.totalRevenue || 0).toLocaleString("en-IN")}
                  </h3>
                  <p style={styles.kpiSub}>Razorpay settled earnings</p>
                </div>
              </div>
            </div>

            {/* Clinic Details Card */}
            <div style={styles.detailsCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Clinic Branch Profile</h3>
                <span style={styles.codeBadge}>
                  Code: {clinicData.clinicCode || "STANDALONE"}
                </span>
              </div>

              <div style={styles.profileGrid}>
                <div style={styles.profileItem}>
                  <Building2 size={16} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Branch Name</span>
                    <p style={styles.profileItemVal}>
                      {clinicData.branchName || clinicData.clinicName || "Main Clinic"}
                    </p>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <Phone size={16} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Phone Number</span>
                    <p style={styles.profileItemVal}>{clinicData.phone || "Not specified"}</p>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <Mail size={16} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Email</span>
                    <p style={styles.profileItemVal}>{clinicData.email || "Not specified"}</p>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <MapPin size={16} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Clinic Address</span>
                    <p style={styles.profileItemVal}>{clinicData.address || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActionsRow}>
              <button
                onClick={() => setShowAddDoctorModal(true)}
                style={styles.actionCardBtn}
              >
                <div style={styles.actionIconCircle}>
                  <Plus size={20} color="#2563EB" />
                </div>
                <div>
                  <h4 style={styles.actionTitle}>Onboard Clinic Doctor</h4>
                  <p style={styles.actionDesc}>
                    Add medical practitioner with specialty and consultation fees
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowAddAssistantModal(true)}
                style={styles.actionCardBtn}
              >
                <div style={styles.actionIconCircle}>
                  <Plus size={20} color="#16A34A" />
                </div>
                <div>
                  <h4 style={styles.actionTitle}>Onboard Front-Desk PA</h4>
                  <p style={styles.actionDesc}>
                    Provision assistant account for QR scanner and check-in desk
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: DOCTORS ================= */}
        {activeTab === "doctors" && (
          <div style={styles.tabContent}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionHeading}>Clinic Doctors</h2>
                <p style={styles.sectionSub}>Registered medical specialists at this branch</p>
              </div>

              <div style={styles.sectionActionRow}>
                <div style={styles.searchBox}>
                  <Search size={15} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Search doctor or specialty..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <button
                  onClick={() => setShowAddDoctorModal(true)}
                  style={styles.primaryAddBtn}
                >
                  <Plus size={16} />
                  <span>Onboard Doctor</span>
                </button>
              </div>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Doctor Name</th>
                    <th style={styles.th}>Specialization</th>
                    <th style={styles.th}>Qualification</th>
                    <th style={styles.th}>Experience</th>
                    <th style={styles.th}>Consultation Fee</th>
                    <th style={styles.th}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyTd}>
                        <Stethoscope size={32} color="#94A3B8" style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>
                          No doctors found for this branch. Click 'Onboard Doctor' to add one.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc, i) => (
                      <tr key={doc.id || i} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.patientCell}>
                            <div style={styles.avatarDoc}>
                              {doc.name ? doc.name.charAt(0).toUpperCase() : "D"}
                            </div>
                            <div>
                              <p style={styles.boldName}>{doc.name}</p>
                              <span style={styles.subEmail}>{doc.phone || ""}</span>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.specialtyPill}>
                            {doc.specialization || "General Medicine"}
                          </span>
                        </td>
                        <td style={styles.td}>{doc.qualification || "MBBS"}</td>
                        <td style={styles.td}>{doc.experience ? `${doc.experience} yrs` : "-"}</td>
                        <td style={styles.td}>
                          <span style={styles.feeText}>
                            ₹{Number(doc.consultationFee || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.emailText}>{doc.email}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ASSISTANTS ================= */}
        {activeTab === "assistants" && (
          <div style={styles.tabContent}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionHeading}>Front-Desk Assistants & PAs</h2>
                <p style={styles.sectionSub}>
                  Reception staff authorized for patient check-in and QR verification
                </p>
              </div>

              <div style={styles.sectionActionRow}>
                <div style={styles.searchBox}>
                  <Search size={15} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Search assistant..."
                    value={assistantSearch}
                    onChange={(e) => setAssistantSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <button
                  onClick={() => setShowAddAssistantModal(true)}
                  style={styles.primaryAddBtn}
                >
                  <Plus size={16} />
                  <span>Onboard Front-Desk PA</span>
                </button>
              </div>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Assistant Name</th>
                    <th style={styles.th}>Email Address</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Role / Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssistants.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={styles.emptyTd}>
                        <Users size={32} color="#94A3B8" style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>
                          No front-desk assistants assigned yet. Click 'Onboard Front-Desk PA' to add.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssistants.map((asst, i) => (
                      <tr key={asst.id || i} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.patientCell}>
                            <div style={styles.avatarMini}>
                              {asst.name ? asst.name.charAt(0).toUpperCase() : "A"}
                            </div>
                            <span style={styles.boldName}>{asst.name}</span>
                          </div>
                        </td>
                        <td style={styles.td}>{asst.email}</td>
                        <td style={styles.td}>{asst.phone || "-"}</td>
                        <td style={styles.td}>
                          <span style={styles.assistantBadge}>
                            <ShieldCheck size={12} />
                            <span>Front-Desk Station / PA</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TRANSACTIONS ================= */}
        {activeTab === "transactions" && (
          <div style={styles.tabContent}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionHeading}>Clinic Transactions</h2>
                <p style={styles.sectionSub}>Financial settlement records and appointment check-in status</p>
              </div>

              <div style={styles.searchBox}>
                <Search size={15} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, order ID..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Razorpay Order / Pay ID</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Check-In Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyTd}>
                        <CreditCard size={32} color="#94A3B8" style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>
                          No transactions recorded for this clinic branch.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, i) => (
                      <tr key={tx.appointmentId || i} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.boldName}>{tx.patientName || "Patient"}</div>
                          <span style={styles.subPhone}>{tx.patientPhone || ""}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.docName}>{tx.doctorName || "Doctor"}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.amountBold}>
                            ₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={styles.codePill}>{tx.razorpayOrderId || "N/A"}</span>
                            {tx.razorpayPaymentId && (
                              <span style={styles.subCodePill}>{tx.razorpayPaymentId}</span>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: "12px", color: "#475569" }}>
                            {tx.appointmentDate} &bull; {tx.appointmentTime}
                          </div>
                        </td>
                        <td style={styles.td}>
                          {tx.isCheckedIn ? (
                            <span style={styles.checkedInBadge}>
                              <CheckCircle2 size={12} />
                              <span>Checked In ({tx.checkedInBy || "PA"})</span>
                            </span>
                          ) : (
                            <span style={styles.waitingBadge}>
                              <Clock size={12} />
                              <span>Waiting Check-In</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: ONBOARD DOCTOR ================= */}
      <AnimatePresence>
        {showAddDoctorModal && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.modalBox}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Onboard Clinic Doctor</h3>
                  <p style={styles.modalSub}>
                    Register a practitioner directly under this clinic branch
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDoctorModal(false)}
                  style={styles.closeBtn}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddDoctor} style={styles.form}>
                <div style={styles.formRow2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Doctor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Vikram Seth"
                      value={doctorForm.name}
                      onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@clinic.com"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formRow2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={doctorForm.password}
                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9845012345"
                      value={doctorForm.phone}
                      onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formRow2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. Orthopedics, Cardiology"
                      value={doctorForm.specialization}
                      onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Qualification</label>
                    <input
                      type="text"
                      placeholder="e.g. MBBS, MS (Ortho)"
                      value={doctorForm.qualification}
                      onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formRow2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      value={doctorForm.experience}
                      onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Consultation Fee (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={doctorForm.consultationFee}
                      onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Doctor Bio / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief background, achievements, and clinic consultation focus..."
                    value={doctorForm.about}
                    onChange={(e) => setDoctorForm({ ...doctorForm, about: e.target.value })}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorModal(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={styles.submitBtn}
                  >
                    {submitting ? "Onboarding..." : "Onboard Doctor"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: ONBOARD ASSISTANT ================= */}
      <AnimatePresence>
        {showAddAssistantModal && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.modalBox}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Onboard Front-Desk PA</h3>
                  <p style={styles.modalSub}>
                    Provision a reception assistant account for QR scanner check-in
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAssistantModal(false)}
                  style={styles.closeBtn}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAssistant} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Receptionist"
                    value={assistantForm.name}
                    onChange={(e) => setAssistantForm({ ...assistantForm, name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address (Login Username) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ananya.pa@apolloclinic.com"
                    value={assistantForm.email}
                    onChange={(e) => setAssistantForm({ ...assistantForm, email: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={assistantForm.password}
                      onChange={(e) => setAssistantForm({ ...assistantForm, password: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9845098765"
                      value={assistantForm.phone}
                      onChange={(e) => setAssistantForm({ ...assistantForm, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setShowAddAssistantModal(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={styles.submitBtn}
                  >
                    {submitting ? "Registering..." : "Register Assistant"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  pageWrap: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  topHeader: {
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    padding: "12px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 20,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#EFF6FF",
    border: "1px solid #DBEAFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerClinic: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.01em",
  },
  headerRoleBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "500",
  },
  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
  },
  tabGroup: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: "4px",
    borderRadius: "12px",
    gap: "4px",
  },
  tabActive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#FFFFFF",
    color: "#2563EB",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "700",
    border: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  tabInactive: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "#64748B",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  refreshBtn: {
    padding: "8px 10px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  mainContainer: {
    flex: 1,
    padding: "28px",
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  kpiCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  kpiIconWrapBlue: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconWrapGreen: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#DCFCE7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconWrapAmber: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiIconWrapPurple: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#F3E8FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748B",
    margin: "0 0 4px 0",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  kpiValue: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  kpiSub: {
    fontSize: "12px",
    color: "#94A3B8",
    margin: 0,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "24px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  codeBadge: {
    padding: "4px 10px",
    borderRadius: "8px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontFamily: "monospace",
    fontWeight: "700",
    fontSize: "12px",
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },
  profileItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  profileItemLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748B",
    display: "block",
  },
  profileItemVal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "2px 0 0 0",
  },
  quickActionsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  actionCardBtn: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    gap: "16px",
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.15s, transform 0.15s",
  },
  actionIconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "#F1F5F9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  actionDesc: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },
  sectionHeading: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
  },
  sectionSub: {
    fontSize: "13px",
    color: "#64748B",
    margin: 0,
  },
  sectionActionRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "8px 14px",
    minWidth: "240px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: "13px",
    width: "100%",
    backgroundColor: "transparent",
  },
  primaryAddBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 18px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    borderRadius: "10px",
    border: "none",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeaderRow: {
    backgroundColor: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  th: {
    padding: "12px 16px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  tr: {
    borderBottom: "1px solid #F1F5F9",
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#334155",
  },
  emptyTd: {
    padding: "48px 16px",
    textAlign: "center",
  },
  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatarDoc: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "800",
    border: "1px solid #BFDBFE",
  },
  avatarMini: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
  },
  boldName: {
    fontWeight: "700",
    color: "#0F172A",
    margin: 0,
  },
  subEmail: {
    fontSize: "11px",
    color: "#64748B",
  },
  specialtyPill: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "20px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontWeight: "700",
    fontSize: "12px",
  },
  feeText: {
    fontWeight: "800",
    color: "#16A34A",
  },
  emailText: {
    color: "#64748B",
    fontSize: "12px",
  },
  assistantBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "3px 10px",
    borderRadius: "20px",
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
    fontSize: "12px",
    fontWeight: "700",
  },
  amountBold: {
    fontWeight: "800",
    color: "#0F172A",
  },
  docName: {
    fontWeight: "600",
    color: "#334155",
  },
  subPhone: {
    fontSize: "11px",
    color: "#64748B",
  },
  codePill: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "#F1F5F9",
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#475569",
    width: "fit-content",
  },
  subCodePill: {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    backgroundColor: "#EFF6FF",
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#2563EB",
    width: "fit-content",
  },
  checkedInBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "20px",
    backgroundColor: "#DCFCE7",
    color: "#16A34A",
    fontSize: "11px",
    fontWeight: "700",
  },
  waitingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "20px",
    backgroundColor: "#FEF3C7",
    color: "#B45309",
    fontSize: "11px",
    fontWeight: "700",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "20px",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    maxWidth: "540px",
    width: "100%",
    padding: "24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  modalSub: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    padding: "4px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  formRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    outline: "none",
    color: "#0F172A",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    outline: "none",
    color: "#0F172A",
    resize: "vertical",
  },
  modalActionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },
  cancelBtn: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
