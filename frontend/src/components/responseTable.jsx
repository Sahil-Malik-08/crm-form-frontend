import { StatusPill } from "./FormResponseDetail";

// Flatten forms into one row per filled-in response. `mine` uses each form's own response.
export const toResponseRows = (forms, { mine = false } = {}) =>
  forms.flatMap((form) => {
    const responses = mine ? (form.myResponse ? [form.myResponse] : []) : form.submissions || [];
    return responses.map((response) => ({
      id: response.id,
      form,
      response,
      employee: response.userName,
      formTitle: form.title,
      approver: form.approvedByName || "—",
      submittedAt: response.submittedAt,
      status: response.status || "pending",
    }));
  });

export const responseColumns = ({ employee = true, approver = true } = {}) => [
  employee && { key: "employee", label: "Employee", value: (row) => row.employee },
  { key: "form", label: "Form", value: (row) => row.formTitle },
  approver && { key: "approver", label: "Approved by", value: (row) => row.approver },
  {
    key: "submitted",
    label: "Submitted",
    value: (row) => new Date(row.submittedAt).toLocaleString(),
    sortValue: (row) => new Date(row.submittedAt).getTime(),
  },
  {
    key: "status",
    label: "Status",
    value: (row) => (row.status === "approved" ? "Approved" : "Pending"),
    render: (row) => <StatusPill status={row.status} />,
  },
].filter(Boolean);
