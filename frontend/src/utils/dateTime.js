/**
 * Centralized date/time formatting configuration and utilities.
 *
 * Change the format here once, and every displayed timestamp in the
 * frontend will automatically follow the new format.
 */

export const DATE_TIME_CONFIG = {
  locale: "en-IN",
  timeZone: "Asia/Kolkata",
  dateStyle: "medium",
  timeStyle: "short",
};

export const DATE_ONLY_CONFIG = {
  locale: "en-IN",
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
};

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = safeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(DATE_TIME_CONFIG.locale, {
    timeZone: DATE_TIME_CONFIG.timeZone,
    dateStyle: DATE_TIME_CONFIG.dateStyle,
    timeStyle: DATE_TIME_CONFIG.timeStyle,
  }).format(date);
}

export function formatDate(value) {
  const date = safeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(DATE_ONLY_CONFIG.locale, {
    timeZone: DATE_ONLY_CONFIG.timeZone,
    day: DATE_ONLY_CONFIG.day,
    month: DATE_ONLY_CONFIG.month,
    year: DATE_ONLY_CONFIG.year,
  }).format(date);
}

export function formatTime(value) {
  const date = safeDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(DATE_TIME_CONFIG.locale, {
    timeZone: DATE_TIME_CONFIG.timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
