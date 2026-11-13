import { RecurrenceRule, Task } from '../types';

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object at midnight local time
 */
export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Calculate the calendar week of the month (1 = Days 1-7, 2 = Days 8-14, 3 = Days 15-21, 4 = Days 22-28, 5 = Days 29+)
 */
export function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

/**
 * Check if a task is scheduled / due on a specific calendar date
 */
export function isTaskDueOnDate(task: Task, date: Date): boolean {
  const { recurrence } = task;
  const dayOfWeek = date.getDay();

  if (recurrence.type === 'daily') {
    return true;
  }

  if (recurrence.type === 'weekdays') {
    if (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0) {
      return false;
    }
    return recurrence.daysOfWeek.includes(dayOfWeek);
  }

  if (recurrence.type === 'month_week') {
    const currentWeekOfMonth = getWeekOfMonth(date);
    const matchesWeek = recurrence.weekOfMonth === currentWeekOfMonth;
    if (!matchesWeek) return false;

    // If specific weekdays are specified within that week
    if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      return recurrence.daysOfWeek.includes(dayOfWeek);
    }
    // If no specific days, it is due across all days of that week
    return true;
  }

  return false;
}

/**
 * Generate human-readable label for recurrence rules
 */
export function getRecurrenceLabel(rule: RecurrenceRule): string {
  if (rule.type === 'daily') {
    return 'Daily (Every day)';
  }

  if (rule.type === 'weekdays') {
    const days = rule.daysOfWeek || [];
    if (days.length === 0) return 'No days scheduled';
    if (days.length === 7) return 'Daily (Every day)';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      return 'Every Weekday (Mon–Fri)';
    }
    const names = days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_SHORT[d])
      .join(', ');
    return `Every ${names}`;
  }

  if (rule.type === 'month_week') {
    const weekLabel = `Week ${rule.weekOfMonth || 1}`;
    const days = rule.daysOfWeek || [];
    if (days.length === 0) {
      return `${weekLabel} of Month`;
    }
    const names = days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => WEEKDAY_SHORT[d])
      .join(', ');
    return `${weekLabel} of Month · ${names}`;
  }

  return 'Custom';
}

/**
 * Get the 7 dates of the week containing the base date (Monday to Sunday)
 */
export function getWeekDates(baseDate: Date): Date[] {
  const current = new Date(baseDate);
  current.setHours(0, 0, 0, 0);

  // JavaScript: 0 is Sunday, 1 is Monday...
  // We want Monday as index 0 of the week
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

/**
 * Get all dates in a month
 */
export function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

/**
 * Group days of a month by calendar week
 */
export function getMonthWeeksGrouped(year: number, month: number): { weekNum: number; dates: Date[] }[] {
  const dates = getMonthDates(year, month);
  const weekMap = new Map<number, Date[]>();

  dates.forEach((d) => {
    const weekNum = getWeekOfMonth(d);
    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, []);
    }
    weekMap.get(weekNum)!.push(d);
  });

  return Array.from(weekMap.entries()).map(([weekNum, weekDates]) => ({
    weekNum,
    dates: weekDates,
  }));
}

/**
 * Format date for top header display
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Check if two dates represent the exact same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
