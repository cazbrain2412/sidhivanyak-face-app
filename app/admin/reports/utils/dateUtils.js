import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST = "Asia/Kolkata";

/**
 * Returns array of day numbers to show in calendar
 * Supports month mode and range mode
 */
export function getCalendarDays({ dateMode, month, year, fromDate, toDate }) {
  // Month mode (existing behavior)
  if (dateMode === "month") {
    const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  // Date range mode
  if (dateMode === "range" && fromDate && toDate) {
    const start = dayjs(fromDate).tz(IST);
    const end = dayjs(toDate).tz(IST);

    const days = [];
    let d = start.clone();

    while (d.isSame(end) || d.isBefore(end)) {
      days.push(d.date());
      d = d.add(1, "day");
    }

    return days;
  }

  return [];
}

/**
 * Generates YYYY-MM-DD string in IST
 */
export function formatDateKey(year, month, day) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

