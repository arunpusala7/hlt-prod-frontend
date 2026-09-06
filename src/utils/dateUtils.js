// Timezone-safe date and time formatting utilities
// Prevents UTC conversion shifts (e.g. toISOString() displaying yesterday in IST/Asia/Kolkata)

export const getLocalDateString = (d = new Date()) => {
  const dateObj = d instanceof Date ? d : new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  try {
    const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = raw.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  } catch {}
  return new Date(dateStr);
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "Today";
  try {
    const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = raw.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const dateObj = new Date(y, m - 1, d);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${days[dateObj.getDay()]}, ${String(d).padStart(2, "0")} ${months[m - 1]} ${y}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const formatTime12h = (timeStr) => {
  if (!timeStr) return "10:00 AM";
  try {
    const parts = timeStr.split(":");
    let hours = parseInt(parts[0], 10);
    const mins = parts[1] ? parts[1].substring(0, 2) : "00";
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
  } catch {
    return timeStr;
  }
};

