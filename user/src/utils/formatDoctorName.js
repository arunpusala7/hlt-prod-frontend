/**
 * Helper to safely format doctor names.
 * Prevents duplicate "Dr. Dr." prefixes when a name already contains "Dr." or "Dr".
 */
export const formatDoctorName = (name) => {
  if (!name) return "Dr. Specialist";
  const trimmed = String(name).trim();

  // Regex checks if string starts with "dr", "dr.", "dr ", "doctor", case-insensitive
  if (/^(dr|doctor)\.?\s+/i.test(trimmed)) {
    // Normalize to "Dr. RestOfName"
    const withoutPrefix = trimmed.replace(/^(dr|doctor)\.?\s+/i, "");
    return `Dr. ${withoutPrefix}`;
  }

  return `Dr. ${trimmed}`;
};
