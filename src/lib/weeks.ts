import type { WeekOption } from "@/types/weeks";

const DAYS_PER_WEEK = 7;

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * Weeks run Sunday to Saturday. The current week ends today, since the
 * remaining days have not happened yet; earlier weeks are complete.
 */
export function getWeekOptions(today: Date, count: number): WeekOption[] {
  const currentSunday = addDays(startOfDay(today), -today.getDay());

  return Array.from({ length: count }, (_, weeksAgo) => {
    const start = addDays(currentSunday, -weeksAgo * DAYS_PER_WEEK);
    const end =
      weeksAgo === 0 ? startOfDay(today) : addDays(start, DAYS_PER_WEEK - 1);
    const range = formatRange(start, end);

    return {
      id: toDateKey(start),
      label: `${describeWeeksAgo(weeksAgo)} · ${range}`,
      range,
      start,
      end,
    };
  });
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function describeWeeksAgo(weeksAgo: number): string {
  if (weeksAgo === 0) return "This week";
  if (weeksAgo === 1) return "Last week";
  return `${weeksAgo} weeks ago`;
}

function formatRange(start: Date, end: Date): string {
  if (start.getTime() === end.getTime()) return dayFormatter.format(start);
  return `${dayFormatter.format(start)} – ${dayFormatter.format(end)}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Calendar arithmetic rather than adding milliseconds, so DST shifts don't
// land a date on the wrong day.
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
