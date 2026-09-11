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
  ShieldCheck,
  TrendingUp,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter
} from "lucide-react";

export default function OrgAdminDashboard() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState("branches"); // branches | doctors | transactions | overview
  const [loading, setLoading] = useState(true);

  // Hierarchy Data
  const [hierarchyData, setHierarchyData] = useState({
    organizationId: null,
    organizationName: "",
    totalClinics: 0,
    totalDoctors: 0,
    totalAssistants: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    clinics: [],
    overallTransactions: [],
  });

  // Selected clinic for details / transactions filter
  const [selectedClinicFilter, setSelectedClinicFilter] = useState("ALL");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Modals state
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [targetClinicForAdmin, setTargetClinicForAdmin] = useState(null);

  // Forms state
  const [clinicForm, setClinicForm] = useState({
    branchName: "",
    code: "",
    phone: "",
    email: "",
    address: "",
  });

  const [adminForm, setAdminForm] = useState({
    clinicId: "",
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // Search states
  const [branchSearch, setBranchSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");

  const orgAdminName = localStorage.getItem("userName") || "Hospital Network Executive";

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/api/org-admin/hierarchy");
      if (res.data) {
        startTransition(() => {
          setHierarchyData(res.data);
          // Set initial transactions
          const initialTx =
            res.data.overallTransactions && res.data.overallTransactions.length > 0
              ? res.data.overallTransactions
              : (res.data.clinics || []).flatMap((c) => c.transactions || []);
          setFilteredTransactions(initialTx);
        });
      }
    } catch (err) {
      console.error("Failed to load organization hierarchy:", err);
      toast.error("Error loading hospital network hierarchy.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Filter transactions when clinic filter changes
  const handleClinicFilterChange = async (clinicId) => {
    setSelectedClinicFilter(clinicId);
    setTransactionsLoading(true);
    try {
      if (clinicId === "ALL") {
        const res = await api.get("/api/org-admin/transactions");
        setFilteredTransactions(res.data || []);
      } else {
        const res = await api.get(`/api/org-admin/transactions?clinicId=${clinicId}`);
        setFilteredTransactions(res.data || []);
      }
    } catch (err) {
      // Fallback: filter from loaded hierarchy
      if (clinicId === "ALL") {
        const fallbackTx = (hierarchyData.clinics || []).flatMap((c) => c.transactions || []);
        setFilteredTransactions(fallbackTx);
      } else {
        const target = (hierarchyData.clinics || []).find((c) => String(c.clinicId) === String(clinicId));
        setFilteredTransactions(target?.transactions || []);
      }
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Create Clinic Branch
  const handleCreateClinic = async (e) => {
    e.preventDefault();
    if (!clinicForm.branchName || !clinicForm.code) {
      toast.error("Please enter branch name and clinic code");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Adding hospital branch...");
    try {
      await api.post("/api/org-admin/clinics", clinicForm);
      toast.success(`Branch '${clinicForm.branchName}' added successfully!`, { id: toastId });
      setShowAddClinicModal(false);
      setClinicForm({
        branchName: "",
        code: "",
        phone: "",
        email: "",
        address: "",
      });
      fetchHierarchy(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create clinic branch.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Clinic Admin
  const handleAssignAdmin = async (e) => {
    e.preventDefault();
    const clinicIdToAssign = targetClinicForAdmin || adminForm.clinicId;
    if (!clinicIdToAssign || !adminForm.name || !adminForm.email || !adminForm.password) {
      toast.error("Please fill in all required admin details and select a clinic");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Assigning branch administrator...");
    try {
      await api.post("/api/org-admin/clinic-admins", {
        ...adminForm,
        clinicId: Number(clinicIdToAssign),
      });
      toast.success(`${adminForm.name} assigned as branch admin!`, { id: toastId });
      setShowAssignAdminModal(false);
      setTargetClinicForAdmin(null);
      setAdminForm({
        clinicId: "",
        name: "",
        email: "",
        password: "",
        phone: "",
      });
      fetchHierarchy(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to assign clinic admin.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Aggregated doctors list across all branches
  const allDoctors = (hierarchyData.clinics || []).flatMap((c) =>
    (c.doctors || []).map((d) => ({
      ...d,
      clinicName: c.clinicName || c.branchName,
      clinicBranch: c.branchName,
      clinicId: c.clinicId,
    }))
  );

  const filteredBranches = (hierarchyData.clinics || []).filter(
    (c) =>
      !branchSearch.trim() ||
      c.branchName?.toLowerCase().includes(branchSearch.toLowerCase()) ||
      c.clinicName?.toLowerCase().includes(branchSearch.toLowerCase()) ||
      c.clinicCode?.toLowerCase().includes(branchSearch.toLowerCase()) ||
      c.address?.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const displayedDoctors = allDoctors.filter(
    (d) =>
      !doctorSearch.trim() ||
      d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      d.clinicName?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const displayedTransactions = (filteredTransactions || []).filter(
    (t) =>
      !transactionSearch.trim() ||
      t.patientName?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.doctorName?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.clinicName?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      t.razorpayOrderId?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  return (
    <div style={styles.pageWrap}>
      {/* Top Header */}
      <header style={styles.topHeader}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBadge}>
            <Layers size={20} color="#2563EB" />
          </div>
          <div>
            <div style={styles.headerOrg}>
              {hierarchyData.organizationName || "Hospital Network Group"}
            </div>
            <div style={styles.headerRoleBadge}>
              <span style={styles.onlineDot}></span>
              <span>Organization Executive Portal &bull; {orgAdminName}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={styles.tabGroup}>
          <button
            onClick={() => setActiveTab("branches")}
            style={activeTab === "branches" ? styles.tabActive : styles.tabInactive}
          >
            <Building2 size={16} />
            <span>Branches ({hierarchyData.clinics?.length || hierarchyData.totalClinics || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            style={activeTab === "doctors" ? styles.tabActive : styles.tabInactive}
          >
            <Stethoscope size={16} />
            <span>All Doctors ({allDoctors.length || hierarchyData.totalDoctors || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            style={activeTab === "transactions" ? styles.tabActive : styles.tabInactive}
          >
            <CreditCard size={16} />
            <span>Network Transactions</span>
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            style={activeTab === "overview" ? styles.tabActive : styles.tabInactive}
          >
            <Layers size={16} />
            <span>Group Overview</span>
          </button>
        </div>

        {/* Action Right */}
        <div style={styles.headerRight}>
          <button onClick={() => fetchHierarchy()} style={styles.refreshBtn} title="Refresh">
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
        {/* ================= TAB 1: BRANCHES & HIERARCHY ================= */}
        {activeTab === "branches" && (
          <div style={styles.tabContent}>
            {/* Top KPI Cards */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapBlue}>
                  <Building2 size={24} color="#2563EB" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Total Branches</p>
                  <h3 style={styles.kpiValue}>
                    {hierarchyData.totalClinics || hierarchyData.clinics?.length || 0}
                  </h3>
                  <p style={styles.kpiSub}>Active hospital clinics</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapGreen}>
                  <Stethoscope size={24} color="#16A34A" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Total Doctors</p>
                  <h3 style={{ ...styles.kpiValue, color: "#16A34A" }}>
                    {hierarchyData.totalDoctors || allDoctors.length || 0}
                  </h3>
                  <p style={styles.kpiSub}>Practitioners across all branches</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapAmber}>
                  <Users size={24} color="#D97706" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Front-Desk Assistants</p>
                  <h3 style={{ ...styles.kpiValue, color: "#D97706" }}>
                    {hierarchyData.totalAssistants || 0}
                  </h3>
                  <p style={styles.kpiSub}>Check-in receptionists</p>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIconWrapPurple}>
                  <TrendingUp size={24} color="#7C3AED" />
                </div>
                <div>
                  <p style={styles.kpiLabel}>Network Gross Revenue</p>
                  <h3 style={{ ...styles.kpiValue, color: "#7C3AED" }}>
                    ₹{Number(hierarchyData.totalRevenue || 0).toLocaleString("en-IN")}
                  </h3>
                  <p style={styles.kpiSub}>Total consultation settlements</p>
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionHeading}>Hospital Clinic Branches</h2>
                <p style={styles.sectionSub}>
                  Manage branches, assign clinic administrators, and inspect branch health
                </p>
              </div>

              <div style={styles.sectionActionRow}>
                <div style={styles.searchBox}>
                  <Search size={15} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Search branch or code..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <button
                  onClick={() => setShowAddClinicModal(true)}
                  style={styles.primaryAddBtn}
                >
                  <Plus size={16} />
                  <span>Add Branch Clinic</span>
                </button>
              </div>
            </div>

            {/* Branch Cards Grid */}
            <div style={styles.branchGrid}>
              {filteredBranches.length === 0 ? (
                <div style={styles.emptyCard}>
                  <Building2 size={36} color="#94A3B8" style={{ marginBottom: "10px" }} />
                  <p style={{ margin: 0, fontWeight: 700, color: "#475569" }}>
                    No branches added yet. Click 'Add Branch Clinic' to create your first hospital location.
                  </p>
                </div>
              ) : (
                filteredBranches.map((clinic) => (
                  <div key={clinic.clinicId} style={styles.branchCard}>
                    <div style={styles.branchCardHeader}>
                      <div>
                        <div style={styles.branchTitleRow}>
                          <h3 style={styles.branchTitle}>{clinic.branchName || clinic.clinicName}</h3>
                          <span style={styles.branchCodeBadge}>{clinic.clinicCode}</span>
                        </div>
                        <p style={styles.branchAddress}>
                          <MapPin size={12} />
                          <span>{clinic.address || "Main City Center"}</span>
                        </p>
                      </div>
                      <div style={styles.branchRevenueBadge}>
                        <span style={styles.branchRevLabel}>Branch Revenue</span>
                        <span style={styles.branchRevVal}>
                          ₹{Number(clinic.totalRevenue || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div style={styles.branchStatsRow}>
                      <div style={styles.miniStat}>
                        <span style={styles.miniStatLabel}>Doctors</span>
                        <span style={styles.miniStatVal}>{clinic.doctors?.length || 0}</span>
                      </div>
                      <div style={styles.miniStat}>
                        <span style={styles.miniStatLabel}>Assistants</span>
                        <span style={styles.miniStatVal}>{clinic.assistants?.length || 0}</span>
                      </div>
                      <div style={styles.miniStat}>
                        <span style={styles.miniStatLabel}>Transactions</span>
                        <span style={styles.miniStatVal}>
                          {clinic.totalTransactions || clinic.transactions?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Clinic Admins List */}
                    <div style={styles.adminsSection}>
                      <span style={styles.adminSectionTitle}>Branch Administrators</span>
                      {clinic.clinicAdmins && clinic.clinicAdmins.length > 0 ? (
                        <div style={styles.adminList}>
                          {clinic.clinicAdmins.map((adm) => (
                            <div key={adm.id} style={styles.adminPill}>
                              <ShieldCheck size={13} color="#2563EB" />
                              <span style={styles.adminNameBold}>{adm.name}</span>
                              <span style={styles.adminEmailSub}>({adm.email})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={styles.noAdminAlert}>
                          <span>No branch admin assigned yet.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div style={styles.branchFooter}>
                      <button
                        onClick={() => {
                          setTargetClinicForAdmin(clinic.clinicId);
                          setAdminForm((prev) => ({ ...prev, clinicId: clinic.clinicId }));
                          setShowAssignAdminModal(true);
                        }}
                        style={styles.assignAdminBtn}
                      >
                        <Plus size={14} />
                        <span>Assign Clinic Admin</span>
                      </button>
                      <button
                        onClick={() => {
                          handleClinicFilterChange(clinic.clinicId);
                          setActiveTab("transactions");
                        }}
                        style={styles.viewTxBtn}
                      >
                        <span>View Transactions ↗</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: DOCTORS DIRECTORY ================= */}
        {activeTab === "doctors" && (
          <div style={styles.tabContent}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionHeading}>Network Medical Staff</h2>
                <p style={styles.sectionSub}>
                  Search and inspect doctors across all hospital branches
                </p>
              </div>

              <div style={styles.searchBox}>
                <Search size={15} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search doctor, branch, or specialization..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Doctor Name</th>
                    <th style={styles.th}>Branch / Location</th>
                    <th style={styles.th}>Specialization</th>
                    <th style={styles.th}>Experience</th>
                    <th style={styles.th}>Consultation Fee</th>
                    <th style={styles.th}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyTd}>
                        <Stethoscope size={32} color="#94A3B8" style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>
                          No doctors found matching criteria across network branches.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedDoctors.map((doc, idx) => (
                      <tr key={doc.id || idx} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.patientCell}>
                            <div style={styles.avatarDoc}>
                              {doc.name ? doc.name.charAt(0).toUpperCase() : "D"}
                            </div>
                            <span style={styles.boldName}>{doc.name}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.branchTag}>{doc.clinicBranch || doc.clinicName}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.specialtyPill}>
                            {doc.specialization || "General Medicine"}
                          </span>
                        </td>
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

        {/* ================= TAB 3: NETWORK TRANSACTIONS ================= */}
        {activeTab === "transactions" && (
          <div style={styles.tabContent}>
            <div style={styles.sectionHeaderRow}>
              <div>
                <h2 style={styles.sectionHeading}>Financial Transactions & Check-Ins</h2>
                <p style={styles.sectionSub}>
                  Review real-time payment settlements and front-desk verification across clinics
                </p>
              </div>

              <div style={styles.sectionActionRow}>
                {/* Clinic Branch Filter Dropdown */}
                <div style={styles.filterDropdownWrap}>
                  <Filter size={15} color="#64748B" />
                  <select
                    value={selectedClinicFilter}
                    onChange={(e) => handleClinicFilterChange(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="ALL">All Branches</option>
                    {(hierarchyData.clinics || []).map((c) => (
                      <option key={c.clinicId} value={c.clinicId}>
                        {c.branchName || c.clinicName}
                      </option>
                    ))}
                  </select>
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
            </div>

            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Branch Clinic</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Razorpay Order ID</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Check-In Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsLoading ? (
                    <tr>
                      <td colSpan={7} style={styles.emptyTd}>
                        <RefreshCw size={24} className="animate-spin" color="#2563EB" />
                        <p style={{ margin: "8px 0 0 0", color: "#64748B" }}>
                          Loading transactions...
                        </p>
                      </td>
                    </tr>
                  ) : displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.emptyTd}>
                        <CreditCard size={32} color="#94A3B8" style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>
                          No transactions found for the selected clinic branch.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedTransactions.map((tx, idx) => (
                      <tr key={tx.appointmentId || idx} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.boldName}>{tx.patientName || "Patient"}</div>
                          <span style={styles.subPhone}>{tx.patientPhone || ""}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.branchTag}>{tx.clinicName || "Clinic"}</span>
                        </td>
                        <td style={styles.td}>{tx.doctorName || "Doctor"}</td>
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
                              <span>Verified ({tx.checkedInBy || "Front Desk"})</span>
                            </span>
                          ) : (
                            <span style={styles.waitingBadge}>
                              <Clock size={12} />
                              <span>Pending Check-in</span>
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

        {/* ================= TAB 4: GROUP OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div style={styles.tabContent}>
            <div style={styles.detailsCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Hospital Network Profile</h3>
                <span style={styles.codeBadge}>ID: {hierarchyData.organizationId || "ORG-1"}</span>
              </div>

              <div style={styles.profileGrid}>
                <div style={styles.profileItem}>
                  <Building2 size={18} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Network Group Name</span>
                    <p style={styles.profileItemVal}>
                      {hierarchyData.organizationName || "HealthConnect Group"}
                    </p>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <Building2 size={18} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Active Branches</span>
                    <p style={styles.profileItemVal}>
                      {hierarchyData.totalClinics || hierarchyData.clinics?.length || 0} Locations
                    </p>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <Stethoscope size={18} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Total Medical Specialists</span>
                    <p style={styles.profileItemVal}>
                      {hierarchyData.totalDoctors || allDoctors.length || 0} Doctors
                    </p>
                  </div>
                </div>

                <div style={styles.profileItem}>
                  <TrendingUp size={18} color="#64748B" />
                  <div>
                    <span style={styles.profileItemLabel}>Network Lifetime Revenue</span>
                    <p style={styles.profileItemVal}>
                      ₹{Number(hierarchyData.totalRevenue || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: ADD CLINIC BRANCH ================= */}
      <AnimatePresence>
        {showAddClinicModal && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.modalBox}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Add Hospital Branch</h3>
                  <p style={styles.modalSub}>
                    Provision a new clinic branch under {hierarchyData.organizationName}
                  </p>
                </div>
                <button onClick={() => setShowAddClinicModal(false)} style={styles.closeBtn}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateClinic} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Whitefield Branch"
                    value={clinicForm.branchName}
                    onChange={(e) => setClinicForm({ ...clinicForm, branchName: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Clinic Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STAR_WF"
                    value={clinicForm.code}
                    onChange={(e) => setClinicForm({ ...clinicForm, code: e.target.value.toUpperCase() })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 80 2841 0000"
                      value={clinicForm.phone}
                      onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Branch Email</label>
                    <input
                      type="email"
                      placeholder="whitefield@starhospital.com"
                      value={clinicForm.email}
                      onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Address</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. ITPL Main Road, Whitefield, Bengaluru"
                    value={clinicForm.address}
                    onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => setShowAddClinicModal(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={styles.submitBtn}>
                    {submitting ? "Creating..." : "Create Branch"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: ASSIGN CLINIC ADMIN ================= */}
      <AnimatePresence>
        {showAssignAdminModal && (
          <div style={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.modalBox}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Assign Clinic Administrator</h3>
                  <p style={styles.modalSub}>
                    Authorize a branch administrator to manage doctors and staff
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignAdminModal(false);
                    setTargetClinicForAdmin(null);
                  }}
                  style={styles.closeBtn}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignAdmin} style={styles.form}>
                {!targetClinicForAdmin && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Branch *</label>
                    <select
                      required
                      value={adminForm.clinicId}
                      onChange={(e) => setAdminForm({ ...adminForm, clinicId: e.target.value })}
                      style={styles.input}
                    >
                      <option value="">-- Choose Branch --</option>
                      {(hierarchyData.clinics || []).map((c) => (
                        <option key={c.clinicId} value={c.clinicId}>
                          {c.branchName || c.clinicName} ({c.clinicCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Branch Admin"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address (Login Username) *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.admin@starhospital.com"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
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
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876541111"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.modalActionRow}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignAdminModal(false);
                      setTargetClinicForAdmin(null);
                    }}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={styles.submitBtn}>
                    {submitting ? "Assigning..." : "Assign Branch Admin"}
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
  headerOrg: {
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
    maxWidth: "1240px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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
  filterDropdownWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "8px 12px",
  },
  selectInput: {
    border: "none",
    outline: "none",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    backgroundColor: "transparent",
    cursor: "pointer",
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
  branchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "18px",
  },
  branchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  branchCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  branchTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  branchTitle: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#0F172A",
    margin: 0,
  },
  branchCodeBadge: {
    padding: "2px 8px",
    borderRadius: "6px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    fontFamily: "monospace",
    fontWeight: "700",
    fontSize: "11px",
  },
  branchAddress: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
  },
  branchRevenueBadge: {
    textAlign: "right",
  },
  branchRevLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    display: "block",
  },
  branchRevVal: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#16A34A",
  },
  branchStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    backgroundColor: "#F8FAFC",
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #F1F5F9",
  },
  miniStat: {
    textAlign: "center",
  },
  miniStatLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    display: "block",
  },
  miniStatVal: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#0F172A",
  },
  adminsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  adminSectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  adminList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  adminPill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    backgroundColor: "#EFF6FF",
    borderRadius: "8px",
    fontSize: "12px",
  },
  adminNameBold: {
    fontWeight: "700",
    color: "#1E40AF",
  },
  adminEmailSub: {
    color: "#64748B",
    fontSize: "11px",
  },
  noAdminAlert: {
    fontSize: "12px",
    color: "#D97706",
    backgroundColor: "#FFFBEB",
    padding: "6px 10px",
    borderRadius: "8px",
  },
  branchFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #F1F5F9",
    paddingTop: "12px",
    marginTop: "auto",
    gap: "8px",
  },
  assignAdminBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
    borderRadius: "8px",
    border: "1px solid #DBEAFE",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
  },
  viewTxBtn: {
    padding: "6px 12px",
    backgroundColor: "transparent",
    color: "#64748B",
    borderRadius: "8px",
    border: "none",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyCard: {
    gridColumn: "1 / -1",
    padding: "48px 20px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    textAlign: "center",
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
  boldName: {
    fontWeight: "700",
    color: "#0F172A",
    margin: 0,
  },
  branchTag: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "6px",
    backgroundColor: "#F1F5F9",
    color: "#334155",
    fontWeight: "600",
    fontSize: "12px",
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
  subPhone: {
    fontSize: "11px",
    color: "#64748B",
  },
  amountBold: {
    fontWeight: "800",
    color: "#0F172A",
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
    maxWidth: "520px",
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
