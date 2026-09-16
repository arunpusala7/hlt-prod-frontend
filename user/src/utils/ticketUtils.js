export const extractTicketId = (scannedText) => {
  if (!scannedText || typeof scannedText !== "string") return "";
  let text = scannedText.trim();

  // 1. Check if JSON format: { "ticketId": "..." }
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.ticketId) return String(parsed.ticketId).trim();
      if (parsed.ticket_id) return String(parsed.ticket_id).trim();
      if (parsed.id) return String(parsed.id).trim();
    } catch (e) {}
  }

  // 2. Check if URL containing ticketId query param (e.g. https://healthconnect.app/verify?ticketId=HC-QPYJ7B-4848)
  if (text.includes("ticketId=")) {
    try {
      const urlObj = new URL(text.startsWith("http") ? text : `https://${text}`);
      const val = urlObj.searchParams.get("ticketId");
      if (val) return val.trim();
    } catch (e) {
      const match = text.match(/ticketId=([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) return match[1].trim();
    }
  }

  // 3. Check if URL path with ticket ID (e.g. https://healthconnect.app/verify/HC-...)
  if (text.startsWith("http://") || text.startsWith("https://")) {
    try {
      const urlObj = new URL(text);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      const lastSeg = segments[segments.length - 1];
      if (lastSeg && (lastSeg.toUpperCase().startsWith("HC") || lastSeg.includes("-"))) {
        return lastSeg.trim();
      }
    } catch (e) {}
  }

  // 4. Clean leading # if present
  if (text.startsWith("#")) {
    text = text.substring(1).trim();
  }

  return text;
};
