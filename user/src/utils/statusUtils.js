/**
 * Centralized status resolution utilities for HealthConnect Multi-Tenant Architecture.
 * 
 * Rules:
 * 1. Organization Inactive -> Automatically cascades deactivation to all child clinics in its network.
 * 2. Clinic Inactive -> Targets only that specific clinic branch (siblings unaffected). Standalone clinics pause their entire facility.
 * 3. Doctors linked to an inactive clinic or inactive organization cannot accept new bookings or slot reservations.
 * 4. Historical data (past tickets, receipts, medical records) is always preserved.
 */

/**
 * Checks whether any entity (Org, Clinic, Doctor, Tenant) is marked active.
 * Handles boolean `active`, boolean `isActive`, and string `status` ("ACTIVE" vs "INACTIVE").
 * Defaults to true if unspecified.
 */
export const isEntityActive = (entity) => {
  if (!entity || typeof entity !== "object") return true;
  if (entity.active === false || entity.isActive === false) return false;
  if (typeof entity.status === "string" && entity.status.trim().toUpperCase() === "INACTIVE") {
    return false;
  }
  return true;
};

/**
 * Checks whether an Organization is active.
 */
export const isOrgActive = (org) => {
  return isEntityActive(org);
};

/**
 * Checks whether a Clinic is active, accounting for automatic cascading
 * deactivation from a parent organization.
 */
export const isClinicActive = (clinic, parentOrg = null) => {
  if (!clinic) return true;
  if (parentOrg && !isOrgActive(parentOrg)) {
    return false; // Parent organization is paused -> all child clinics cascade to inactive
  }
  return isEntityActive(clinic);
};

/**
 * Resolves the clinic associated with a doctor from either `doctor.clinic`,
 * or by matching `clinicId` in `tenantClinics`.
 */
export const getDoctorClinic = (doctor, tenantClinics = []) => {
  if (!doctor) return null;

  // If doctor has an embedded clinic object
  if (doctor.clinic && typeof doctor.clinic === "object") {
    if (Array.isArray(tenantClinics) && tenantClinics.length > 0) {
      const matched = tenantClinics.find(
        (c) => String(c.id) === String(doctor.clinic.id) || String(c.code) === String(doctor.clinic.code)
      );
      if (matched) {
        return { ...doctor.clinic, ...matched };
      }
    }
    return doctor.clinic;
  }

  // If doctor has clinicId or clinicCode
  const cId = doctor.clinicId || doctor.clinic?.id;
  if (cId != null && Array.isArray(tenantClinics) && tenantClinics.length > 0) {
    const matched = tenantClinics.find((c) => String(c.id) === String(cId));
    if (matched) return matched;
  }

  return null;
};

/**
 * Determines if a doctor is currently available for taking new patient bookings.
 * Returns false if:
 * - The parent tenant (Organization or Clinic) is deactivated
 * - The doctor's assigned clinic branch is deactivated
 * - The doctor profile itself is deactivated
 */
export const isDoctorActiveForBooking = (doctor, tenant = null) => {
  if (!doctor) return false;

  // 1. Doctor's own active flag
  if (!isEntityActive(doctor)) return false;

  // 2. Parent Tenant (Organization or Standalone Clinic) active check
  if (tenant && !isEntityActive(tenant)) {
    return false;
  }

  // 3. Clinic branch active check (with cascading check from tenant if ORGANIZATION)
  const tenantClinics = tenant?.clinics || [];
  const clinic = getDoctorClinic(doctor, tenantClinics);
  if (clinic) {
    const parentOrg = tenant?.tenantType === "ORGANIZATION" ? tenant : null;
    if (!isClinicActive(clinic, parentOrg)) {
      return false;
    }
  }

  return true;
};

/**
 * Returns a user-friendly explanatory reason when bookings are paused for a doctor/clinic.
 */
export const getBookingDisabledReason = (doctor, tenant = null) => {
  if (tenant && !isEntityActive(tenant)) {
    return `Online bookings for ${tenant.name || "this healthcare network"} are temporarily suspended.`;
  }

  const tenantClinics = tenant?.clinics || [];
  const clinic = getDoctorClinic(doctor, tenantClinics);
  if (clinic) {
    const parentOrg = tenant?.tenantType === "ORGANIZATION" ? tenant : null;
    if (!isClinicActive(clinic, parentOrg)) {
      const branchName = clinic.branchName || clinic.name || "this clinic branch";
      return `Appointment bookings are temporarily paused at ${branchName}.`;
    }
  }

  if (!isEntityActive(doctor)) {
    return `Dr. ${doctor?.name || "this specialist"} is currently not accepting new appointments.`;
  }

  return "Booking is currently unavailable.";
};
