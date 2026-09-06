// Doctor Cutout Portrait & Avatar Mapping Utility with Transparent Cutouts

const DOCTOR_PORTRAITS = [
  "/portraits/hero_doctor.png",
  "/portraits/doctor_female.png",
  "/portraits/doctor_male.png",
  "/portraits/hero_doctor.png",
  "/portraits/doctor_female.png",
  "/portraits/doctor_male.png",
];

const SPECIALTY_ICONS = {
  "Cardiology": "🩺",
  "Cardio": "🩺",
  "Pediatrics": "🩺",
  "General Medicine": "🩺",
  "General": "🩺",
  "Neurology": "🩺",
  "Orthopedics": "🩺",
  "Dermatology": "🩺",
  "Nephrology": "🩺",
  "Kidney": "🩺",
  "Kidney Care": "🩺",
  "Oncology": "🩺",
  "Psychiatry": "🩺",
  "Gastroenterology": "🩺",
  "Gastro": "🩺",
  "Homeopathy": "🩺"
};

/**
 * Returns a high-res cutout doctor portrait image URL (Transparent PNG).
 */
export function getDoctorPortrait(doctorId, name = "") {
  if (!doctorId && !name) return DOCTOR_PORTRAITS[2]; // doctor_male.png

  const lowerName = String(name).toLowerCase();
  if (lowerName.includes("ananya") || lowerName.includes("priya") || lowerName.includes("meera") || lowerName.includes("kavita") || lowerName.includes("sunita") || lowerName.includes("sarah") || lowerName.includes("elena") || lowerName.includes("emily")) {
    return "/portraits/doctor_female.png";
  }
  if (lowerName.includes("collins") || lowerName.includes("david") || lowerName.includes("miller") || lowerName.includes("arun") || lowerName.includes("sai") || lowerName.includes("rajesh") || lowerName.includes("vikram") || lowerName.includes("suresh") || lowerName.includes("arvind") || lowerName.includes("rohan") || lowerName.includes("marcus")) {
    return "/portraits/doctor_male.png";
  }

  const numericId = typeof doctorId === "number" ? doctorId : Math.abs(String(doctorId).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return DOCTOR_PORTRAITS[numericId % DOCTOR_PORTRAITS.length];
}

/**
 * Returns an appropriate specialty icon emoji.
 */
export function getSpecialtyIcon(specialization) {
  return SPECIALTY_ICONS[specialization] || "🩺";
}
