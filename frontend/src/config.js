// Use the current site's API by default. This avoids browser CORS/network errors
// when the dashboard is opened from a hostname other than localhost.
// Set VITE_API_URL for deployments where the API is served on another origin.
export const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const nav = [
  ["users", "UserCheck", "Users"],
  ["assigned-forms", "ClipboardList", "Forms", "employee"],
  ["form-builder", "ClipboardList", "Form Builder", "admin"],
  ["form-responses", "ListChecks", "Form Responses", "admin"],
  ["settings", "Settings", "Settings", "admin"],
];

export const SETTINGS_MASTERS = [
  { key: "departments", label: "Department Master" },
  { key: "roles", label: "Role Master" },
  { key: "form-master", label: "Form Master" },
  { key: "states", label: "State Master" },
  { key: "cities", label: "City Master" },
];

export const toTitleCase = (value = "") =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const request = (path, options = {}) => {
  let token = null;
  try {
    const auth = JSON.parse(localStorage.getItem("companyDashboardAuth") || "null");
    token = auth?.token || null;
  } catch {
    token = null;
  }
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
};

