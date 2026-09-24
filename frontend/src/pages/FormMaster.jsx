import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, Clock, FileText, Layers, Pencil, Plus, Search, Trash2, User, UserCog } from "lucide-react";
import { useMasters } from "../hooks/useMasters";
import { createFormTemplate, deleteFormTemplate, fetchAccounts, fetchFormTemplates, isAdminUser, updateFormTemplate } from "../utils/employeeForms";

const FIELD_TYPE_LABELS = { text: "Normal", number: "Number", date: "Date", email: "Email", textarea: "Long text", checkbox: "Checkbox", select: "Dropdown", multiselect: "Multi-select", master: "Master" };
const MASTER_OPTIONS = { departments: "Department", roles: "Role", states: "State", cities: "City" };

const createField = () => ({ id: Date.now() + Math.random(), label: "", type: "text", required: true, options: [] });
const DEFAULT_FIELDS = [
  { label: "Full Name", type: "text", required: true },
  { label: "Phone Number", type: "text", required: true },
  { label: "Email Address", type: "email", required: false },
  { label: "Gender", type: "text", required: false },
  { label: "Birthday", type: "date", required: false },
  { label: "Address", type: "text", required: false },
  { label: "Notes", type: "text", required: false },
];
const createBuilder = () => ({
  title: "",
  assignedTo: "all",
  approvedBy: "",
  fields: DEFAULT_FIELDS.map((field) => ({ ...createField(), ...field })),
});

const employeeName = (employee) => employee.fullName || employee.name || employee.email || `Employee ${employee.id}`;

function FormMaster({ auth }) {
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("title");
  const [sortDir, setSortDir] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [builder, setBuilder] = useState(createBuilder);
  const [builderErrors, setBuilderErrors] = useState({});
  const [builderSaving, setBuilderSaving] = useState(false);
  const [builderMessage, setBuilderMessage] = useState(null);
  const masters = useMasters(["departments", "roles", "states", "cities"]);
  const isAdmin = isAdminUser(auth?.user || {});
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  useEffect(() => {
    if (!isAdmin) return;
    fetchFormTemplates()
      .then((list) => { setTemplates(Array.isArray(list) ? list : []); setTemplatesError(""); })
      .catch((error) => setTemplatesError(error.message))
      .finally(() => setTemplatesLoading(false));
    fetchAccounts().then(setEmployees).catch((error) => console.error("[FormMaster] Failed to load employees:", error));
  }, [isAdmin]);

  const employeeLookup = useMemo(
    () => Object.fromEntries(employees.map((employee) => [String(employee.id), employeeName(employee)])),
    [employees],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query ? templates.filter((template) => String(template.title || "").toLowerCase().includes(query)) : templates;
    const sorted = [...list].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === "fields") { av = a.fields?.length || 0; bv = b.fields?.length || 0; }
      if (sortKey === "createdAt") { av = a.createdAt ? new Date(a.createdAt).getTime() : 0; bv = b.createdAt ? new Date(b.createdAt).getTime() : 0; }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [templates, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedTemplates = filteredTemplates.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const handleSort = (key) => {
    setSortDir((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
    setCurrentPage(1);
  };

  const updateBuilder = (key, value) => {
    setBuilder((prev) => ({ ...prev, [key]: value }));
    if (builderErrors[key]) setBuilderErrors((prev) => ({ ...prev, [key]: false }));
  };

  const updateField = (index, key, value) => {
    setBuilder((prev) => ({
      ...prev,
      fields: prev.fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, [key]: value } : field)),
    }));
    if (key === "label" && builderErrors.fields) setBuilderErrors((prev) => ({ ...prev, fields: false }));
  };

  const updateFieldType = (index, type) => {
    updateField(index, "type", type);
    if (type === "master" && !builder.fields[index]?.masterKey) updateField(index, "masterKey", "departments");
    if (["select", "multiselect", "checkbox"].includes(type) && !(builder.fields[index]?.options || []).length) {
      updateField(index, "options", ["Option 1", "Option 2"]);
    }
  };

  const updateFieldOption = (fieldIndex, optionIndex, value) => {
    const options = [...(builder.fields[fieldIndex].options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, "options", options);
  };

  const addFieldOption = (fieldIndex) => {
    const options = builder.fields[fieldIndex].options || [];
    updateField(fieldIndex, "options", [...options, `Option ${options.length + 1}`]);
  };

  const removeFieldOption = (fieldIndex, optionIndex) => {
    const options = (builder.fields[fieldIndex].options || []).filter((_, index) => index !== optionIndex);
    updateField(fieldIndex, "options", options);
  };

  const addField = () => setBuilder((prev) => ({ ...prev, fields: [...prev.fields, createField()] }));

  const removeField = (index) => {
    setBuilder((prev) => ({ ...prev, fields: prev.fields.filter((_, fieldIndex) => fieldIndex !== index) }));
  };

  const closeAdd = () => {
    setShowAdd(false);
    setEditingTemplateId(null);
    setBuilder(createBuilder());
    setBuilderErrors({});
    setBuilderMessage(null);
  };

  const editTemplate = (template) => {
    setBuilder({
      title: template.title || "",
      assignedTo: template.assignedTo || "all",
      approvedBy: template.approvedBy ? String(template.approvedBy) : "",
      fields: (template.fields || []).map((field) => ({ ...field, type: field.masterKey ? "master" : field.type, id: field.id || Date.now() + Math.random() })),
    });
    setEditingTemplateId(template.id);
    setBuilderErrors({});
    setBuilderMessage(null);
    setSelectedTemplate(null);
    setShowAdd(true);
  };

  const saveNewTemplate = async (event) => {
    event.preventDefault();
    const validFields = builder.fields.filter((field) => field.label.trim());
    const nextErrors = { title: !builder.title.trim(), fields: validFields.length === 0 };
    if (nextErrors.title || nextErrors.fields) {
      setBuilderErrors(nextErrors);
      setBuilderMessage({ type: "error", text: nextErrors.title ? "Please add a form title." : "Add at least one field with a label." });
      return;
    }
    setBuilderSaving(true);
    try {
      const payload = {
        title: builder.title.trim(),
        assignedTo: builder.assignedTo,
        approvedBy: builder.approvedBy,
        fields: validFields.map(({ label, type, required, options, masterKey }) => (type === "master"
          ? { label: label.trim(), type: "select", required, masterKey, options: (masters[masterKey] || []).map((item) => item.name) }
          : { label: label.trim(), type, required, options })),
      };
      if (editingTemplateId) await updateFormTemplate(editingTemplateId, payload);
      else await createFormTemplate(payload);
      setTemplates(await fetchFormTemplates());
      closeAdd();
    } catch (error) {
      setBuilderMessage({ type: "error", text: error.message });
    } finally {
      setBuilderSaving(false);
    }
  };

  const removeTemplate = async (template) => {
    if (!window.confirm(`Delete ${template.title}?`)) return;
    try {
      await deleteFormTemplate(template.id);
      setTemplates((current) => current.filter((item) => item.id !== template.id));
      setSelectedTemplate((current) => (current?.id === template.id ? null : current));
    } catch (error) {
      setTemplatesError(error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card fb-empty">
        <h3>Admin access required</h3>
        <p>Only administrators can use the form master.</p>
      </div>
    );
  }

  if (selectedTemplate) {
    const fieldTypeCounts = (selectedTemplate.fields || []).length;
    const detailAssignedTo = selectedTemplate.assignedTo === "all" || !selectedTemplate.assignedTo
      ? "All employees"
      : employeeLookup[String(selectedTemplate.assignedTo)] || "Employee";
    const detailItems = [
      { label: "Assigned to", value: detailAssignedTo, icon: User },
      { label: "Approved by", value: selectedTemplate.approvedByName || "Not selected", icon: CheckCircle2 },
      { label: "Created by", value: selectedTemplate.createdByName || "—", icon: UserCog },
      { label: "Created at", value: selectedTemplate.createdAt ? new Date(selectedTemplate.createdAt).toLocaleString() : "—", icon: Calendar },
      { label: "Updated at", value: selectedTemplate.updatedAt ? new Date(selectedTemplate.updatedAt).toLocaleString() : "—", icon: Clock },
      { label: "Fields", value: fieldTypeCounts, icon: Layers },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minHeight: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginTop: -20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSelectedTemplate(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>{selectedTemplate.title}</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className="row-action-btn edit" aria-label={`Edit ${selectedTemplate.title}`} title="Edit form" onClick={() => editTemplate(selectedTemplate)}>
              <Pencil size={16} />
            </button>
            <button className="row-action-btn delete" aria-label={`Delete ${selectedTemplate.title}`} title="Delete form" onClick={() => removeTemplate(selectedTemplate)}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="card ef-card">
          <div className="ef-scroll-body">
            <div className="ef-body">
              {detailItems.map((item) => (
                <div className="ef-field" key={item.label}>
                  <label className="ef-label">{item.label}</label>
                  <input className="ef-input" type="text" disabled value={String(item.value)} readOnly />
                </div>
              ))}
              {(selectedTemplate.fields || []).map((field, index) => {
                const choices = field.options || [];
                return (
                  <div className={`ef-field${field.type === "textarea" ? " full" : ""}`} key={field.id ?? index}>
                    <label className="ef-label">{field.label}{field.required && <span className="ef-required">*</span>}</label>
                    {field.type === "textarea" ? (
                      <textarea className="ef-input" rows={3} disabled placeholder="Long text" />
                    ) : field.type === "select" ? (
                      <select className="ef-input" disabled defaultValue="">
                        <option value="">Select an option</option>
                        {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                      </select>
                    ) : field.type === "multiselect" || field.type === "checkbox" ? (
                      <div className="assigned-form-options">
                        {choices.map((choice) => (
                          <label key={choice}><input type="checkbox" disabled /> {choice}</label>
                        ))}
                      </div>
                    ) : (
                      <input className="ef-input" type={field.type} disabled placeholder={FIELD_TYPE_LABELS[field.type] || "Text"} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAdd) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {builderMessage && <div className={`fb-notice ${builderMessage.type}`}>{builderMessage.text}</div>}
        <form className="card ef-card" onSubmit={saveNewTemplate} noValidate>
          <div className="ef-header">
            <div>
              <h3 className="ef-title">{editingTemplateId ? "Edit form" : "Create a new form"}</h3>
              <div className="ef-meta">Define the fields for this form template.</div>
            </div>
          </div>

          <div className="ef-scroll-body">
            <div className="ef-body">
              <div className="ef-field full">
                <label className="ef-label" htmlFor="fm-title">
                  Form title<span className="ef-required">*</span>
                </label>
                <input
                  id="fm-title"
                  className={`ef-input${builderErrors.title ? " invalid" : ""}`}
                  value={builder.title}
                  onChange={(event) => updateBuilder("title", event.target.value)}
                  placeholder="e.g. Vendor onboarding form"
                />
                {builderErrors.title && <span className="ef-error">A title is required.</span>}
              </div>

              <div className="ef-field">
                <label className="ef-label" htmlFor="fm-assigned">Assigned to</label>
                <select id="fm-assigned" className="ef-input" value={builder.assignedTo} onChange={(event) => updateBuilder("assignedTo", event.target.value)}>
                  <option value="all">All employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>
                  ))}
                </select>
              </div>

              <div className="ef-field">
                <label className="ef-label" htmlFor="fm-approver">Approved by</label>
                <select id="fm-approver" className="ef-input" value={builder.approvedBy} onChange={(event) => updateBuilder("approvedBy", event.target.value)}>
                  <option value="">Select approver</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fb-section">
              <div className="fb-section-head">
                <div>
                  <h4>Form fields</h4>
                  <span>{builder.fields.length} {builder.fields.length === 1 ? "field" : "fields"}</span>
                </div>
                {builderErrors.fields && <span className="ef-error">Add at least one field with a label.</span>}
              </div>

              <div className="fb-fields">
                {builder.fields.map((field, index) => (
                  <div key={field.id} className="fb-field-row">
                    <span className="fb-field-index">{index + 1}</span>

                    <div className="ef-field fb-grow">
                      <label className="ef-label" htmlFor={`fm-label-${field.id}`}>Field label</label>
                      <input id={`fm-label-${field.id}`} className="ef-input" value={field.label} onChange={(event) => updateField(index, "label", event.target.value)} placeholder="e.g. Vendor name" />
                    </div>

                    <div className="ef-field">
                      <label className="ef-label" htmlFor={`fm-type-${field.id}`}>Field type</label>
                      <select id={`fm-type-${field.id}`} className="ef-input" value={field.type} onChange={(event) => updateFieldType(index, event.target.value)}>
                        {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>

                    {field.type === "master" && (
                      <div className="ef-field">
                        <label className="ef-label" htmlFor={`fm-master-${field.id}`}>Master</label>
                        <select id={`fm-master-${field.id}`} className="ef-input" value={field.masterKey || "departments"} onChange={(event) => updateField(index, "masterKey", event.target.value)}>
                          {Object.entries(MASTER_OPTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                    )}

                    {["select", "multiselect", "checkbox"].includes(field.type) && (
                      <div className="ef-field fb-options-field">
                        <div className="fb-options-head">
                          <span className="ef-label">Choices</span>
                          <button type="button" className="fb-add-choice" onClick={() => addFieldOption(index)}>+ Add choice</button>
                        </div>
                        <div className="fb-options-list">
                          {(field.options || []).map((option, optionIndex) => (
                            <div className="fb-option-row" key={`${field.id}-option-${optionIndex}`}>
                              <input
                                id={`fm-option-${field.id}-${optionIndex}`}
                                className="ef-input"
                                value={option}
                                onChange={(event) => updateFieldOption(index, optionIndex, event.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                              <button type="button" className="fb-icon-btn" onClick={() => removeFieldOption(index, optionIndex)} disabled={(field.options || []).length <= 1} aria-label={`Remove choice ${optionIndex + 1}`} title="Remove choice">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="fb-switch">
                      <input type="checkbox" checked={field.required} onChange={(event) => updateField(index, "required", event.target.checked)} />
                      <span>Required</span>
                    </label>

                    <button type="button" className="fb-icon-btn" onClick={() => removeField(index)} disabled={builder.fields.length === 1} aria-label={`Remove field ${index + 1}`} title="Remove field">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="fb-add" onClick={addField}>
                <Plus size={16} /> Add field
              </button>
            </div>
          </div>

          <div className="ef-footer">
            <span className="ef-footer-note"><span className="ef-required">*</span> Required fields</span>
            <div className="ef-actions">
              <button type="button" className="ef-btn-secondary" onClick={closeAdd}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={builderSaving}>
                <FileText size={16} /> {builderSaving ? "Saving..." : editingTemplateId ? "Update form" : "Save form"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) return <span style={{ marginLeft: 4, fontSize: 10 }}> ⇅</span>;
    return <span style={{ marginLeft: 4, fontSize: 10 }}>{sortDir === "asc" ? " ▲" : " ▼"}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, minHeight: 0 }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Form Master</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="search-bar" style={{ width: 320, margin: 0 }}>
              <Search size={16} className="text-slate-400" />
              <input placeholder="Search forms..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
            <button className="primary" onClick={() => setShowAdd(true)}>＋ Add</button>
          </div>
        </div>

        {templatesLoading ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
            <div className="spinner" />
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading forms...</div>
          </div>
        ) : templatesError ? (
          <div className="fb-notice error">{templatesError}</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="no-results">
            <FileText size={64} />
            <h3>No forms found</h3>
            <p>Try adjusting your search, or create one from Form Builder.</p>
          </div>
        ) : (
          <div className="data-table-shell" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="data-table-region" style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
              <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 220, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("title")}>Title{renderSortIcon("title")}</th>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 80, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("fields")}>Fields{renderSortIcon("fields")}</th>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 150 }}>Approved by</th>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 130, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("createdAt")}>Created{renderSortIcon("createdAt")}</th>
                    <th style={{ textAlign: "center", background: "var(--color-surface)" }}>Field Preview</th>
                    <th style={{ textAlign: "center", background: "var(--color-surface)", width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTemplates.map((template) => (
                    <tr key={template.id} onClick={() => setSelectedTemplate(template)} tabIndex={0} style={{ cursor: "pointer" }}>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <FileText size={15} />
                          <strong>{template.title}</strong>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>{template.fields?.length || 0}</td>
                      <td style={{ textAlign: "center" }}>{template.approvedByName || "—"}</td>
                      <td style={{ textAlign: "center" }}>{template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "—"}</td>
                      <td style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 12 }}>
                        {(template.fields || []).slice(0, 4).map((field) => field.label).join(", ")}{(template.fields || []).length > 4 ? "..." : ""}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                          <button type="button" className="row-action-btn edit" aria-label={`Edit ${template.title}`} title="Edit form" onClick={(event) => { event.stopPropagation(); editTemplate(template); }}>
                            <Pencil size={14} />
                          </button>
                          <button type="button" className="row-action-btn delete" aria-label={`Delete ${template.title}`} title="Delete form" onClick={(event) => { event.stopPropagation(); removeTemplate(template); }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-controls data-table-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 0", marginTop: 8, borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Per Page</span>
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                    {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Page {totalPages}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Forms {filteredTemplates.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="primary" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{ opacity: safeCurrentPage <= 1 ? 0.5 : 1 }}>Previous</button>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Page</span>
                  <select value={safeCurrentPage} onChange={(e) => { const p = Number(e.target.value); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button className="primary" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: safeCurrentPage >= totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FormMaster;