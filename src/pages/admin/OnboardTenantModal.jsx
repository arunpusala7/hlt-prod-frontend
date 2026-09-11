import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/api";
import toast from "react-hot-toast";
import {
  Building2,
  Layers,
  ShieldCheck,
  X,
  CreditCard,
  User,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function OnboardTenantModal({ isOpen, onClose, onSuccess }) {
  // Mode: "SINGLE_CLINIC" | "ORGANIZATION"
  const [onboardType, setOnboardType] = useState("SINGLE_CLINIC");
  const [submitting, setSubmitting] = useState(false);

  // Form states for Single Clinic
  const [clinicForm, setClinicForm] = useState({
    tenantType: "SINGLE_CLINIC",
    name: "",
    code: "",
    domain: "",
    webUrl: "",
    about: "",
    description: "",
    googleAnalytics: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    branchName: "",
    phone: "",
    email: "",
    address: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  // Form states for Hospital Group / Organization
  const [orgForm, setOrgForm] = useState({
    name: "",
    code: "",
    domain: "",
    webUrl: "",
    about: "",
    description: "",
    googleAnalytics: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    phone: "",
    email: "",
    address: "",
    // Optional initial org admin credentials
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
  });

  if (!isOpen) return null;

  // Handle Single Clinic submit
  const handleSingleClinicSubmit = async (e) => {
    e.preventDefault();
    if (!clinicForm.name || !clinicForm.code) {
      toast.error("Please provide Clinic Name and Code");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Onboarding standalone clinic & admin...");

    try {
      // Primary: POST /api/admin/onboard-tenant
      let res;
      try {
        res = await api.post("/api/admin/onboard-tenant", clinicForm);
      } catch (err1) {
        // Direct alternative: POST /api/admin/single-clinic
        res = await api.post("/api/admin/single-clinic", clinicForm);
      }

      toast.success(`Clinic '${clinicForm.name}' onboarded successfully!`, { id: toastId });
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error("Single clinic onboarding error:", err);
      const msg = err.response?.data?.message || "Failed to onboard clinic.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Organization submit
  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    if (!orgForm.name || !orgForm.code) {
      toast.error("Please provide Organization Name and Code");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Onboarding hospital group...");

    try {
      // Step 1: POST /api/admin/organizations
      const orgPayload = {
        name: orgForm.name,
        code: orgForm.code,
        domain: orgForm.domain,
        webUrl: orgForm.webUrl,
        about: orgForm.about,
        description: orgForm.description,
        googleAnalytics: orgForm.googleAnalytics,
        razorpayKeyId: orgForm.razorpayKeyId,
        razorpayKeySecret: orgForm.razorpayKeySecret,
        phone: orgForm.phone,
        email: orgForm.email,
        address: orgForm.address,
      };

      const res = await api.post("/api/admin/organizations", orgPayload);
      const createdOrg = res.data;
      const orgId = createdOrg?.id || createdOrg?.organizationId;

      // Step 2: If admin credentials provided, provision Org Admin
      if (orgId && orgForm.adminEmail && orgForm.adminPassword) {
        toast.loading("Provisioning organization executive account...", { id: toastId });
        await api.post(`/api/admin/organizations/${orgId}/admin`, {
          name: orgForm.adminName || `${orgForm.name} Executive`,
          email: orgForm.adminEmail,
          password: orgForm.adminPassword,
          phone: orgForm.adminPhone || orgForm.phone,
        });
      }

      toast.success(`Hospital group '${orgForm.name}' onboarded!`, { id: toastId });
      if (onSuccess) onSuccess(createdOrg);
      onClose();
    } catch (err) {
      console.error("Organization onboarding error:", err);
      const msg = err.response?.data?.message || "Failed to onboard organization.";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={modalStyles.box}
      >
        {/* Header */}
        <div style={modalStyles.header}>
          <div>
            <h2 style={modalStyles.title}>Multi-Tenant Healthcare Onboarding</h2>
            <p style={modalStyles.sub}>
              Provision independent clinics or multi-branch hospital networks with white-label configuration
            </p>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={modalStyles.modeTabs}>
          <button
            type="button"
            onClick={() => setOnboardType("SINGLE_CLINIC")}
            style={onboardType === "SINGLE_CLINIC" ? modalStyles.modeTabActive : modalStyles.modeTabInactive}
          >
            <Building2 size={16} />
            <span>Standalone Clinic / Hospital</span>
          </button>
          <button
            type="button"
            onClick={() => setOnboardType("ORGANIZATION")}
            style={onboardType === "ORGANIZATION" ? modalStyles.modeTabActive : modalStyles.modeTabInactive}
          >
            <Layers size={16} />
            <span>Hospital Group / Multi-Branch Network</span>
          </button>
        </div>

        {/* ================= FORM: SINGLE CLINIC ================= */}
        {onboardType === "SINGLE_CLINIC" && (
          <form onSubmit={handleSingleClinicSubmit} style={modalStyles.form}>
            <div style={modalStyles.sectionTitle}>
              <Building2 size={15} color="#2563EB" />
              <span>Clinic Entity & White-Label Details</span>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Clinic Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Clinic Indiranagar"
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Clinic Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APOLLO_IND"
                  value={clinicForm.code}
                  onChange={(e) => setClinicForm({ ...clinicForm, code: e.target.value.toUpperCase() })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Custom Web Domain</label>
                <input
                  type="text"
                  placeholder="e.g. https://apolloclinic.com"
                  value={clinicForm.domain}
                  onChange={(e) => setClinicForm({ ...clinicForm, domain: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar"
                  value={clinicForm.branchName}
                  onChange={(e) => setClinicForm({ ...clinicForm, branchName: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={clinicForm.phone}
                  onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Contact Email</label>
                <input
                  type="email"
                  placeholder="info@apolloclinic.com"
                  value={clinicForm.email}
                  onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.group}>
              <label style={modalStyles.label}>Physical Address</label>
              <input
                type="text"
                placeholder="e.g. 100ft Road, Indiranagar, Bengaluru"
                value={clinicForm.address}
                onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                style={modalStyles.input}
              />
            </div>

            {/* Razorpay Gateway Config */}
            <div style={modalStyles.sectionTitle}>
              <CreditCard size={15} color="#16A34A" />
              <span>Razorpay Merchant Credentials (Optional)</span>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Razorpay Key ID</label>
                <input
                  type="text"
                  placeholder="rzp_live_apollo123"
                  value={clinicForm.razorpayKeyId}
                  onChange={(e) => setClinicForm({ ...clinicForm, razorpayKeyId: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Razorpay Key Secret</label>
                <input
                  type="password"
                  placeholder="apolloSecretKey999"
                  value={clinicForm.razorpayKeySecret}
                  onChange={(e) => setClinicForm({ ...clinicForm, razorpayKeySecret: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            {/* Clinic Admin Account */}
            <div style={modalStyles.sectionTitle}>
              <ShieldCheck size={15} color="#7C3AED" />
              <span>Initial Clinic Admin Provisioning</span>
            </div>

            <div style={modalStyles.row3}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Admin Name</label>
                <input
                  type="text"
                  placeholder="Dr. Suresh Admin"
                  value={clinicForm.adminName}
                  onChange={(e) => setClinicForm({ ...clinicForm, adminName: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Admin Email</label>
                <input
                  type="email"
                  placeholder="suresh.admin@apolloclinic.com"
                  value={clinicForm.adminEmail}
                  onChange={(e) => setClinicForm({ ...clinicForm, adminEmail: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Initial Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={clinicForm.adminPassword}
                  onChange={(e) => setClinicForm({ ...clinicForm, adminPassword: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.footer}>
              <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} style={modalStyles.submitBtn}>
                {submitting ? "Onboarding Clinic..." : "Onboard Clinic"}
              </button>
            </div>
          </form>
        )}

        {/* ================= FORM: HOSPITAL GROUP / ORGANIZATION ================= */}
        {onboardType === "ORGANIZATION" && (
          <form onSubmit={handleOrgSubmit} style={modalStyles.form}>
            <div style={modalStyles.sectionTitle}>
              <Layers size={15} color="#2563EB" />
              <span>Hospital Group Network Entity</span>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Hospital Group"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Group Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STAR"
                  value={orgForm.code}
                  onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value.toUpperCase() })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Network Web Domain</label>
                <input
                  type="text"
                  placeholder="e.g. https://starhospital.com"
                  value={orgForm.domain}
                  onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Headquarters Address</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Central Phone</label>
                <input
                  type="text"
                  placeholder="+91 80 1234 5678"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Central Email</label>
                <input
                  type="email"
                  placeholder="admin@starhospital.com"
                  value={orgForm.email}
                  onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            {/* Razorpay Gateway Config */}
            <div style={modalStyles.sectionTitle}>
              <CreditCard size={15} color="#16A34A" />
              <span>Razorpay Group Merchant Credentials</span>
            </div>

            <div style={modalStyles.row2}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Group Razorpay Key ID</label>
                <input
                  type="text"
                  placeholder="rzp_live_starKey123"
                  value={orgForm.razorpayKeyId}
                  onChange={(e) => setOrgForm({ ...orgForm, razorpayKeyId: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Group Razorpay Key Secret</label>
                <input
                  type="password"
                  placeholder="starSecretKey456"
                  value={orgForm.razorpayKeySecret}
                  onChange={(e) => setOrgForm({ ...orgForm, razorpayKeySecret: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            {/* Org Admin Provisioning */}
            <div style={modalStyles.sectionTitle}>
              <ShieldCheck size={15} color="#7C3AED" />
              <span>Hospital Group Executive Admin Account (Optional)</span>
            </div>

            <div style={modalStyles.row3}>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Executive Name</label>
                <input
                  type="text"
                  placeholder="Rohan Org Admin"
                  value={orgForm.adminName}
                  onChange={(e) => setOrgForm({ ...orgForm, adminName: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Executive Email</label>
                <input
                  type="email"
                  placeholder="rohan.admin@starhospital.com"
                  value={orgForm.adminEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, adminEmail: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={modalStyles.group}>
                <label style={modalStyles.label}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={orgForm.adminPassword}
                  onChange={(e) => setOrgForm({ ...orgForm, adminPassword: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
            </div>

            <div style={modalStyles.footer}>
              <button type="button" onClick={onClose} style={modalStyles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} style={modalStyles.submitBtn}>
                {submitting ? "Onboarding Group..." : "Onboard Hospital Group"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "20px",
  },
  box: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    maxWidth: "680px",
    width: "100%",
    padding: "26px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
    maxHeight: "90vh",
    overflowY: "auto",
    color: "#0F172A",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#0F172A",
    margin: "0 0 4px 0",
    letterSpacing: "-0.01em",
  },
  sub: {
    fontSize: "13px",
    color: "#64748B",
    margin: 0,
    lineHeight: 1.4,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    padding: "4px",
  },
  modeTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    backgroundColor: "#F1F5F9",
    padding: "4px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  modeTabActive: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    backgroundColor: "#FFFFFF",
    color: "#2563EB",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "700",
    border: "none",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    cursor: "pointer",
  },
  modeTabInactive: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px",
    backgroundColor: "transparent",
    color: "#64748B",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    borderBottom: "1px solid #F1F5F9",
    paddingBottom: "6px",
    marginTop: "6px",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  row3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  group: {
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
    padding: "9px 12px",
    borderRadius: "10px",
    border: "1px solid #CBD5E1",
    fontSize: "13px",
    outline: "none",
    color: "#0F172A",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
    borderTop: "1px solid #F1F5F9",
    paddingTop: "14px",
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
    padding: "10px 22px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
