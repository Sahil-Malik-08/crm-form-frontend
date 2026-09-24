import { request } from "../config";

export const FIELD_TYPES = ["text", "number", "date", "email", "textarea", "checkbox", "select", "multiselect"];

export const isAdminUser = (user = {}) =>
  String(user.role || user.designation || "").trim().toLowerCase() === "admin";

const readError = async (response, fallback) => {
  try {
    const data = await response.json();
    return data?.message || fallback;
  } catch {
    return fallback;
  }
};

const call = async (path, options, fallback) => {
  const response = await request(path, options);
  if (!response.ok) throw new Error(await readError(response, fallback));
  return response.status === 204 ? null : response.json();
};

// mine: only the forms assigned to the logged-in user (what an employee fills in).
export const fetchForms = ({ mine = false } = {}) =>
  call(mine ? "/forms?scope=mine" : "/forms", undefined, "Could not load forms.");

// Forms the logged-in user is the named approver for, with every response to review.
export const fetchApprovals = () => call("/forms/approvals", undefined, "Could not load approvals.");

export const setResponseStatus = (responseId, status) =>
  call(`/forms/responses/${responseId}/status`, { method: "PUT", body: JSON.stringify({ status }) }, "Could not update the status.");

export const createForm = (form) =>
  call("/forms", { method: "POST", body: JSON.stringify(form) }, "Could not save the form.");

export const updateForm = (id, form) =>
  call(`/forms/${id}`, { method: "PUT", body: JSON.stringify(form) }, "Could not update the form.");

export const deleteForm = (id) =>
  call(`/forms/${id}`, { method: "DELETE" }, "Could not delete the form.");

export const fetchFormTemplates = () =>
  call("/form-templates", undefined, "Could not load form templates.");

export const createFormTemplate = (template) =>
  call("/form-templates", { method: "POST", body: JSON.stringify(template) }, "Could not save the form template.");

export const updateFormTemplate = (id, template) =>
  call(`/form-templates/${id}`, { method: "PUT", body: JSON.stringify(template) }, "Could not update the form template.");

export const deleteFormTemplate = (id) =>
  call(`/form-templates/${id}`, { method: "DELETE" }, "Could not delete the form template.");

export const submitFormResponse = (id, answers) =>
  call(`/forms/${id}/responses`, { method: "POST", body: JSON.stringify({ answers }) }, "Could not submit the form.");

// Login accounts: the ids here match the logged-in user, so they are what forms are assigned to.
export const fetchAccounts = async () => {
  const data = await call("/users?limit=100", undefined, "Could not load employees.");
  return Array.isArray(data) ? data : data?.rows || [];
};
