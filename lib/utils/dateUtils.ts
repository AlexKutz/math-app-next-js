/**
 * Shared date utility functions
 * 
 * Centralizes all date-related operations to avoid duplication
 * and ensure consistent date handling across the application.
 */

/**
 * Converts a Date to ISO date string format (YYYY-MM-DD)
 * More reliable than native toISOString() for date-only comparisons
 */
export function toISODateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Gets today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  return toISODateString(new Date());
}

/**
 * Gets the start of today (midnight) as a Date object
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Adds days to a date and returns a new Date object
 * Sets time to midnight for consistent date comparisons
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Checks if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return toISODateString(date1) === toISODateString(date2);
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Calculates the difference in days between two dates
 * Positive result means date2 is after date1
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const d1 = getStartOfDay(date1);
  const d2 = getStartOfDay(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Type for date-like values that can be converted to dates
 */
export type DateLike = Date | string | null | undefined;

/**
 * Safely converts a DateLike value to a Date object
 * Returns null if the value is null/undefined or invalid
 */
export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  
  const date = value instanceof Date ? value : new Date(value);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Safely converts a DateLike to ISO date string
 * Returns null if the value is null/undefined
 */
export function toISODateStringSafe(value: DateLike): string | null {
  const date = toDate(value);
  return date ? toISODateString(date) : null;
}

/**
 * Checks if a date string represents today
 * Handles null/undefined gracefully
 */
export function isDateStringToday(dateString: DateLike): boolean {
  if (!dateString) return false;
  const date = toDate(dateString);
  if (!date) return false;
  return isToday(date);
}

/**
 * Compares two date-like values
 * Returns: -1 if d1 < d2, 0 if equal, 1 if d1 > d2
 * null/undefined values are treated as "earliest"
 */
export function compareDates(d1: DateLike, d2: DateLike): number {
  const date1 = toDate(d1);
  const date2 = toDate(d2);
  
  if (!date1 && !date2) return 0;
  if (!date1) return -1;
  if (!date2) return 1;
  
  const s1 = toISODateString(date1);
  const s2 = toISODateString(date2);
  
  if (s1 < s2) return -1;
  if (s1 > s2) return 1;
  return 0;
}

/**
 * Checks if date1 is before or equal to date2
 */
export function isBeforeOrEqual(d1: DateLike, d2: DateLike): boolean {
  return compareDates(d1, d2) <= 0;
}

/**
 * Checks if date1 is after date2
 */
export function isAfter(d1: DateLike, d2: DateLike): boolean {
  return compareDates(d1, d2) > 0;
}
