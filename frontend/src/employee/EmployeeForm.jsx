import { useMemo, useState } from "react";
import { request } from "../config";
import Field from "../components/Field";
import { useMasters } from "../hooks/useMasters";

function getRolesForDepartment(departmentName, roles, departments) {
  const department = (departments || []).find((item) => item.name.toLowerCase() === String(departmentName || "").toLowerCase());
  if (!department) return [];
  return (roles || []).filter((role) => String(role.departmentId) === String(department.id)).map((role) => role.name);
}

const initialForm = (record = {}) => ({
  fullName: record.fullName || "", employeeCode: record.employeeCode || "", email: record.email || "", phone: record.phone || "",
  department: record.department || "", designation: record.designation || "", branch: record.branch || "", employeeType: record.employeeType || "",
  gender: record.gender || "", dateOfBirth: record.dateOfBirth ? String(record.dateOfBirth).slice(0, 10) : "", maritalStatus: record.maritalStatus || "", status: record.status || "Active",
});

function EmployeeForm({ record, onComplete, onBack }) {
  const isEdit = Boolean(record?.id);
  const [form, setForm] = useState(() => initialForm(record));
  const [saving, setSaving] = useState(false);
  const masters = useMasters(["departments", "roles"]);
  const branchOptions = useMemo(() => {
    const values = new Set(["Head Office"]);
    if (record?.branch) values.add(record.branch);
    return [...values].map((value) => ({ value, label: value }));
  }, [record?.branch]);
  const availableDesignations = useMemo(() => {
    const roleNames = getRolesForDepartment(form.department, masters.roles, masters.departments);
    const byName = new Map((masters.roles || []).map((role) => [role.name.toLowerCase(), role]));
    return roleNames.map((name) => byName.get(name.toLowerCase()) || { id: name, name });
  }, [form.department, masters.roles, masters.departments]);
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const body = {
      fullName: form.fullName.trim(), employeeCode: form.employeeCode.trim() || null, email: form.email.trim(), phone: form.phone || null,
      department: form.department || null, designation: form.designation || null, branch: form.branch.trim() || null,
      employeeType: form.employeeType || null, gender: form.gender || null, dateOfBirth: form.dateOfBirth || null,
      maritalStatus: form.maritalStatus || null, status: form.status || "Active",
    };
    const response = await request(isEdit ? `/employees/${record.id}` : "/employees", { method: isEdit ? "PUT" : "POST", body: JSON.stringify(body) });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.message || "Could not save employee.");
      return;
    }
    onComplete?.();
  };

  const options = (values) => values.map((value) => ({ value, label: value }));

  return (
    <form className="form card" onSubmit={save}>
      <h2>{isEdit ? "Edit Employee" : "New Employee"}</h2>
      <Field label="Full Name" value={form.fullName} change={(value) => update("fullName", value)} />
      <Field label="Employee Code" value={form.employeeCode} change={(value) => update("employeeCode", value)} />
      <Field label="Email" type="email" value={form.email} change={(value) => update("email", value)} />
      <Field label="Mobile Phone" value={form.phone} change={(value) => update("phone", value)} />
      <Field label="Department" type="select" value={form.department} options={(masters.departments || []).map(({ name }) => ({ value: name, label: name }))} change={(value) => setForm((previous) => ({ ...previous, department: value, designation: "" }))} />
      <Field label="Job Title" type="select" value={form.designation} options={availableDesignations.map(({ name }) => ({ value: name, label: name }))} change={(value) => update("designation", value)} />
      <Field label="Branches" type="select" value={form.branch} options={branchOptions} change={(value) => update("branch", value)} />
      <Field label="Employee Type" type="select" value={form.employeeType} options={options(["Full Time", "Part Time", "Contract", "Intern"])} change={(value) => update("employeeType", value)} />
      <Field label="Gender" type="select" value={form.gender} options={options(["Male", "Female", "Other"])} change={(value) => update("gender", value)} />
      <Field label="Date Of Birth" type="date" value={form.dateOfBirth} change={(value) => update("dateOfBirth", value)} />
      <Field label="Marital Status" type="select" value={form.maritalStatus} options={options(["Single", "Married", "Other"])} change={(value) => update("maritalStatus", value)} />
      <Field label="Status" type="select" value={form.status} options={options(["Active", "Inactive"])} change={(value) => update("status", value)} />
      <div className="form-actions">
        {onBack && <button type="button" className="delete" onClick={onBack}>Cancel</button>}
        <button className="primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      </div>
    </form>
  );
}

export default EmployeeForm;