// Global application preferences (currency + financial year) stored in
// localStorage so the choice applies across the whole SPA ("all website")
// and survives reloads. No backend table is required.

export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", locale: "ja-JP" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", locale: "ar-AE" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", locale: "en-SG" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", locale: "en-AU" },
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STORAGE_KEY = "companyDashboardGlobalSettings";

// Default financial year starts at the given month and runs ~12 months. The
// year defaults to the start year of the financial year that contains today.
export function getDefaultFYStartMonth() {
  return 3; // April
}

export function getDefaultFYEndMonth(fyStartMonth = getDefaultFYStartMonth()) {
  return (Number(fyStartMonth) + 11) % 12; // 12 months later, one month before start
}

// The year defaults to the start year of the financial year that contains the
// current date (i.e. "current year" for the active financial period).
export function getFYStartYear(fyStartMonth) {
  const now = new Date();
  const m = now.getMonth();
  return m < fyStartMonth ? now.getFullYear() - 1 : now.getFullYear();
}

const DEFAULTS = { currency: "INR", fyStartMonth: 3, fyEndMonth: 2, fyYear: getFYStartYear(3) };

export function getGlobalSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    const fyStartMonth = typeof parsed.fyStartMonth === "number" ? parsed.fyStartMonth : getDefaultFYStartMonth();
    return {
      currency: parsed.currency || "INR",
      fyStartMonth,
      // Backward compatible: older saved settings had no ending month, so derive it.
      fyEndMonth: typeof parsed.fyEndMonth === "number" ? parsed.fyEndMonth : getDefaultFYEndMonth(fyStartMonth),
      fyYear: typeof parsed.fyYear === "number" ? parsed.fyYear : getFYStartYear(fyStartMonth),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGlobalSettings(partial) {
  const next = { ...getGlobalSettings(), ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage errors */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("global-settings-changed"));
  }
  return next;
}

// Subscribe to preference changes (returns an unsubscribe function).
export function subscribeGlobalSettings(cb) {
  const handler = () => cb();
  if (typeof window !== "undefined") {
    window.addEventListener("global-settings-changed", handler);
  }
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("global-settings-changed", handler);
    }
  };
}

export function getCurrencySymbol(code) {
  const cur = CURRENCIES.find((c) => c.code === (code || getGlobalSettings().currency)) || CURRENCIES[0];
  return cur.symbol;
}

export function formatCurrency(value, { compact = false, maximumFractionDigits = 2 } = {}) {
  const { currency } = getGlobalSettings();
  const cur = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const num = Number(value || 0);
  try {
    return new Intl.NumberFormat(cur.locale, {
      style: "currency",
      currency: cur.code,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : maximumFractionDigits,
    }).format(num);
  } catch {
    return `${cur.symbol}${num.toLocaleString(cur.locale)}`;
  }
}

// End year: the financial year ends in the calendar year after the start when
// the end month falls before the start month (e.g. Apr → Mar is next Mar);
// otherwise it ends within the same calendar year (e.g. Jan → Dec).
function getFYEndYear(fyStartMonth, fyEndMonth, fyStartYear) {
  return Number(fyEndMonth) > Number(fyStartMonth) ? fyStartYear : fyStartYear + 1;
}

// Returns the [from, to] date range (inclusive) for a financial year that
// starts in `fyStartMonth` (0-11) of `fyStartYear` and ends in `fyEndMonth`.
export function getFYRange(fyStartMonth, fyEndMonth, fyStartYear) {
  const startMonth = typeof fyStartMonth === "number" ? fyStartMonth : getDefaultFYStartMonth();
  const endMonth = typeof fyEndMonth === "number" ? fyEndMonth : getDefaultFYEndMonth(startMonth);
  const startYear = Number(fyStartYear) || getFYStartYear(startMonth);
  const endYear = getFYEndYear(startMonth, endMonth, startYear);
  const start = new Date(startYear, startMonth, 1);
  const end = new Date(endYear, endMonth + 1, 0, 23, 59, 59);
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(start), to: fmt(end) };
}

export function getFYLabel(fyStartMonth, fyEndMonth, fyStartYear) {
  const startMonth = typeof fyStartMonth === "number" ? fyStartMonth : getDefaultFYStartMonth();
  const endMonth = typeof fyEndMonth === "number" ? fyEndMonth : getDefaultFYEndMonth(startMonth);
  const startYear = Number(fyStartYear) || getFYStartYear(startMonth);
  const endYear = getFYEndYear(startMonth, endMonth, startYear);
  return `${MONTHS[startMonth]} ${startYear} – ${MONTHS[endMonth]} ${endYear}`;
}
