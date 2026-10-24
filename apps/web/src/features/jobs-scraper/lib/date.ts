export function getTodayInManila(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

const relativeTime = new Intl.RelativeTimeFormat("en");

// Computed at render time; the site's own "20h ago" text is only true on scan day.
export function formatAge(date: string, dateOnly = false): string {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
  const days = Math.floor(minutes / 1440);
  if (dateOnly) return days < 1 ? "today" : relativeTime.format(-days, "day");
  if (minutes < 1) return "just now";
  if (minutes < 60) return relativeTime.format(-minutes, "minute");
  if (minutes < 1440)
    return relativeTime.format(-Math.floor(minutes / 60), "hour");
  return relativeTime.format(-days, "day");
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(date));
}
