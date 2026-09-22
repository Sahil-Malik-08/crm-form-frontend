import { useEffect, useMemo, useState } from "react";
import { request } from "../config";
import Field from "../components/Field";
import SearchSelect from "../components/SearchSelect";
import { useMasters } from "../hooks/useMasters";

function getRolesForDepartment(departmentName, roles, departments) {
  const department = (departments || []).find((item) => item.name.toLowerCase() === String(departmentName || "").toLowerCase());
  if (!department) return [];
  return (roles || []).filter((role) => String(role.departmentId) === String(department.id)).map((role) => role.name);
}

function UserForm({ record, complete, onBack, employees = [] }) {
  const isEdit = Boolean(record?.id);
  const [form, setForm] = useState({
    fullName: record?.fullName || "", username: record?.username || "", email: record?.email || "", password: "", phone: record?.phone || "",
    department: record?.department || "", role: record?.role || record?.designation || "", reportingTo: record?.reportingTo || "",
    branch: record?.branch || "", status: record?.status || "Active",
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => record?.employeeId || "");
  const [allEmployees, setAllEmployees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const masters = useMasters(["departments", "roles"]);

  useEffect(() => {
    let active = true;
    request("/employees?limit=100")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => active && setAllEmployees(Array.isArray(data) ? data : data?.rows || []))
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const employeeList = allEmployees.length ? allEmployees : employees;
  const employeeOptions = useMemo(() => employeeList.filter((employee) => String(employee.id) !== String(record?.id || "")).map((employee) => ({ value: employee.id, label: employee.fullName })), [employeeList, record?.id]);
  const branchOptions = useMemo(() => [...new Set(employeeList.map((employee) => employee.branch).filter(Boolean))].map((branch) => ({ value: branch, label: branch })), [employeeList]);
  const availableRoles = useMemo(() => {
    const roleNames = getRolesForDepartment(form.department, masters.roles, masters.departments);
    const byName = new Map((masters.roles || []).map((role) => [role.name.toLowerCase(), role]));
    return roleNames.map((name) => byName.get(name.toLowerCase()) || { id: name, name });
  }, [form.department, masters.roles, masters.departments]);

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const selectEmployee = (value) => {
    const employee = employeeList.find((item) => String(item.id) === String(value));
    setSelectedEmployeeId(value);
    setForm((previous) => ({ ...previous, fullName: employee?.fullName || previous.fullName, phone: employee?.phone || previous.phone, email: employee?.email || previous.email }));
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.username.trim() || (!isEdit && !form.password.trim())) {
      setError(isEdit ? "Full name and username are required." : "Full name, username, and password are required.");
      return;
    }
    setSaving(true);
    const body = {
      fullName: form.fullName.trim(), username: form.username.trim(), email: form.email.trim() || (form.username.includes("@") ? form.username.trim() : null), password: form.password || undefined,
      phone: form.phone || null, department: form.department || null, role: form.role || "employee", reportingTo: form.reportingTo ? Number(form.reportingTo) : null,
      branch: form.branch || null, status: form.status || "Active",
    };
    const response = await request(isEdit ? `/users/${record.id}` : "/users", { method: isEdit ? "PUT" : "POST", body: JSON.stringify(body) });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Could not save user.");
      return;
    }
    complete?.();
  };

  return (
    <form className="form card" onSubmit={save} autoComplete="off">
      <h2>{isEdit ? "Edit User" : "New User"}</h2>
      {error && <p style={{ gridColumn: "1 / -1", margin: "0 0 10px", color: "#b91c1c", fontSize: 13 }}>{error}</p>}
      <label>Full Name <span className="required-marker">*</span>
        <SearchSelect value={selectedEmployeeId} options={employeeOptions} onChange={selectEmployee} placeholder="Select employee" searchPlaceholder="Search employee..." style={{ marginTop: 6 }} />
      </label>
      <Field label="Phone" value={form.phone} change={(value) => update("phone", value)} autoComplete="tel" />
      <Field label="Username / Email" value={form.username} change={(value) => update("username", value)} autoComplete="username" />
      <Field label="Password" type="password" value={form.password} required={!isEdit} change={(value) => update("password", value)} autoComplete={isEdit ? "new-password" : "new-password"} />
      <Field label="Department" type="select" value={form.department} options={(masters.departments || []).map(({ name }) => ({ value: name, label: name }))} change={(value) => setForm((previous) => ({ ...previous, department: value, role: "" }))} />
      <Field label="Role" type="select" value={form.role} options={availableRoles.map(({ name }) => ({ value: name, label: name }))} change={(value) => update("role", value)} />
      <label>Reporting To
        <SearchSelect value={form.reportingTo} options={employeeOptions} onChange={(value) => update("reportingTo", value)} placeholder="Select employee" searchPlaceholder="Search employee..." style={{ marginTop: 6 }} />
      </label>
      <Field label="Branches" type="select" value={form.branch} options={branchOptions} required={false} change={(value) => update("branch", value)} />
      <Field label="Status" type="select" value={form.status} options={["Active", "Inactive"].map((value) => ({ value, label: value }))} change={(value) => update("status", value)} />
      <div className="form-actions">
        {onBack && <button type="button" className="delete" onClick={onBack}>Cancel</button>}
        <button className="primary" disabled={saving}>{saving ? "Saving..." : isEdit ? "Save User" : "Save User"}</button>
      </div>
    </form>
  );
}

export default UserForm;