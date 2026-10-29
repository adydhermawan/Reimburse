/**
 * Date-only helpers for transaction dates.
 *
 * transaction_date is a calendar date (no time). Parsing "YYYY-MM-DD" with `new Date()` treats it as UTC
 * midnight and `toISOString()` converts back to UTC, both of which shift the day in non-UTC timezones.
 * These helpers always work in the device's local timezone.
 */

/** Parse "YYYY-MM-DD" (or an ISO string starting with it) into a local-midnight Date. */
export const parseDateOnly = (value?: string | null): Date => {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return value ? new Date(value) : new Date();
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

/** Format a Date as "YYYY-MM-DD" using local date parts. */
export const formatDateOnly = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
