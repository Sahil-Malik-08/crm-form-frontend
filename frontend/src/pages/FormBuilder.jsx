import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, ListChecks, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import DataTable from "../components/DataTable";
import FormResponseDetail from "../components/FormResponseDetail";
import { responseColumns, toResponseRows } from "../components/responseTable";
import { createForm, deleteForm as deleteFormRequest, fetchAccounts, fetchFormTemplates, fetchForms, isAdminUser, setResponseStatus, updateForm } from "../utils/employeeForms";

const createField = () => ({
  id: Date.now() + Math.random(),
  label: "",
  type: "text",
  required: true,
  options: [],
});

const createBuilder = () => ({
  title: "",
  assignedTo: "all",
  approvedBy: "",
  fields: [createField()],
});

const employeeName = (employee) => employee.fullName || employee.name || employee.email || `Employee ${employee.id}`;

const DEFAULT_TEMPLATES = [
  { id: "customer-default", title: "Customer Form", fields: ["Customer Name", "Phone Number", "Alternate Phone", "Sales Person", "House / Flat No.", "Locality / Sector", "City", "State", "Pincode", "Full Address"].map((label, index) => ({ id: index + 1, label, type: label === "Full Address" ? "textarea" : label === "Pincode" ? "number" : "text", required: !["Alternate Phone", "Sales Person", "House / Flat No.", "Locality / Sector", "Full Address"].includes(label) })) },
  { id: "contact-default", title: "Contact Form", fields: ["Full Name", "Phone Number", "Email Address", "Gender", "Birthday", "Address", "Notes"].map((label, index) => ({ id: index + 1, label, type: label === "Email Address" ? "email" : label === "Birthday" ? "date" : label === "Notes" ? "textarea" : "text", required: ["Full Name", "Phone Number"].includes(label) })) },
  { id: "employee-default", title: "Employee Form", fields: ["Full Name", "Employee Code", "Email", "Mobile Phone", "Department", "Job Title", "Branches", "Employee Type", "Gender", "Date Of Birth", "Marital Status", "Status"].map((label, index) => ({ id: index + 1, label, type: label === "Email" ? "email" : label === "Date Of Birth" ? "date" : "text", required: true })) },
];

const FIELD_TYPE_LABELS = { text: "Normal", number: "Number", date: "Date", email: "Email", textarea: "Long text", checkbox: "Checkbox", select: "Dropdown", multiselect: "Multi-select" };

function FormBuilder({ auth }) {
  const [employees, setEmployees] = useState([]);
  const [forms, setForms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [builder, setBuilder] = useState(createBuilder);
  const [activeTab, setActiveTab] = useState("builder");
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [editingFormId, setEditingFormId] = useState(null);
  const [templates, setTemplates] = useState([]);

  const currentUser = auth?.user || {};
  const isAdmin = isAdminUser(currentUser);

  const loadForms = useCallback(async () => {
    try {
      setForms(await fetchForms());
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAccounts().then(setEmployees).catch((error) => console.error("[FormBuilder] Failed to load employees:", error));
    loadForms();
    fetchFormTemplates().then((list) => setTemplates(list.length ? list : DEFAULT_TEMPLATES)).catch((error) => { console.error("[FormBuilder] Failed to load form templates:", error); setTemplates(DEFAULT_TEMPLATES); });
  }, [isAdmin, loadForms]);

  const employeeLookup = useMemo(
    () => Object.fromEntries(employees.map((employee) => [String(employee.id), employeeName(employee)])),
    [employees],
  );

  const updateBuilder = (key, value) => {
    setBuilder((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const updateField = (index, key, value) => {
    setBuilder((prev) => ({
      ...prev,
      fields: prev.fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, [key]: value } : field)),
    }));
    if (key === "label" && errors.fields) setErrors((prev) => ({ ...prev, fields: false }));
  };

  const updateFieldType = (index, type) => {
    updateField(index, "type", type);
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

  const editForm = (form) => {
    setBuilder({
      title: form.title || "",
      assignedTo: form.assignedTo || "all",
      approvedBy: form.approvedBy ? String(form.approvedBy) : "",
      fields: (form.fields || []).map((field) => ({ ...field, id: field.id || Date.now() + Math.random() })),
    });
    setEditingFormId(form.id);
    setErrors({});
    setMessage(null);
    setActiveTab("builder");
  };

  const resetBuilder = () => {
    setBuilder(createBuilder());
    setEditingFormId(null);
    setErrors({});
    setMessage(null);
  };

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => String(item.id) === String(templateId));
    if (!template) return;
    setBuilder((previous) => ({
      ...previous,
      title: template.title,
      fields: template.fields.map((field) => ({ ...field, id: Date.now() + Math.random() })),
    }));
    setEditingFormId(null);
    setErrors({});
    setMessage({ type: "success", text: `Loaded ${template.title} from Form Master.` });
  };

  const saveForm = async (event) => {
    event.preventDefault();
    const validFields = builder.fields.filter((field) => field.label.trim());
    const nextErrors = { title: !builder.title.trim(), fields: validFields.length === 0 };

    if (nextErrors.title || nextErrors.fields) {
      setErrors(nextErrors);
      setMessage({ type: "error", text: nextErrors.title ? "Please add a form title." : "Add at least one field with a label." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: builder.title.trim(),
        assignedTo: builder.assignedTo,
        approvedBy: builder.approvedBy,
        fields: validFields.map(({ id, label, type, required, options }) => ({ id, label: label.trim(), type, required, options })),
      };
      if (editingFormId) await updateForm(editingFormId, payload);
      else await createForm(payload);
      await loadForms();
      resetBuilder();
      setErrors({});
      setActiveTab("forms");
      setMessage({ type: "success", text: editingFormId ? "Form updated successfully." : "Form created and assigned successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (formId) => {
    try {
      await deleteFormRequest(formId);
      setForms((prev) => prev.filter((form) => form.id !== formId));
      setMessage({ type: "success", text: "Form deleted." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const responseRows = useMemo(() => toResponseRows(forms), [forms]);
  const formRows = useMemo(
    () =>
      forms.map((form) => ({
        id: form.id,
        form,
        title: form.title,
        assignedTo: form.assignedTo === "all" ? "All employees" : employeeLookup[String(form.assignedTo)] || "Employee",
        approver: form.approvedByName || "Not selected",
        received: (form.submissions || []).length,
        pending: (form.submissions || []).filter((response) => response.status !== "approved").length,
        createdAt: form.createdAt,
      })),
    [forms, employeeLookup],
  );

  // Only the approver named on a form may change the status of its responses (enforced by the API too).
  const canReview = (form) => form.approvedBy !== null && Number(form.approvedBy) === Number(currentUser.id);

  const changeStatus = async (row, status) => {
    try {
      await setResponseStatus(row.id, status);
      await loadForms();
      setViewing((prev) => (prev && prev.id === row.id ? { ...prev, response: { ...prev.response, status } } : prev));
      setMessage({ type: "success", text: status === "approved" ? "Response approved." : "Response marked as pending." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const reviewButton = (row) =>
    canReview(row.form) ? (
      <button type="button" className={row.response.status === "approved" ? "ef-btn-secondary" : "primary"} onClick={() => changeStatus(row, row.response.status === "approved" ? "pending" : "approved")}>
        {row.response.status === "approved" ? "Mark as pending" : "Approve"}
      </button>
    ) : null;

  if (!isAdmin) {
    return (
      <div className="card fb-empty">
        <Lock size={28} />
        <h3>Admin access required</h3>
        <p>Only administrators can create and manage employee forms.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
      <div className="fb-page-head">
        <div>
          <div style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Admin portal
          </div>
          <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800 }}>Form Builder</h1>
        </div>
        <div className="fb-tabs" role="tablist">
          <button role="tab" aria-selected={activeTab === "builder"} className={activeTab === "builder" ? "active" : ""} onClick={() => setActiveTab("builder")}>
            <FileText size={15} /> Build form
          </button>
          <button role="tab" aria-selected={activeTab === "forms"} className={activeTab === "forms" ? "active" : ""} onClick={() => setActiveTab("forms")}>
            <ClipboardList size={15} /> Forms
            <span className="fb-count">{forms.length}</span>
          </button>
          <button role="tab" aria-selected={activeTab === "responses"} className={activeTab === "responses" ? "active" : ""} onClick={() => { setActiveTab("responses"); setViewing(null); }}>
            <ListChecks size={15} /> Responses
            <span className="fb-count">{responseRows.length}</span>
          </button>
        </div>
      </div>

      {message && <div className={`fb-notice ${message.type}`}>{message.text}</div>}

      {activeTab === "builder" ? (
        <form className="card ef-card" onSubmit={saveForm} noValidate>
          <div className="ef-header">
            <div>
              <h3 className="ef-title">{editingFormId ? "Edit form" : "Create a new form"}</h3>
            </div>
          </div>

          <div className="ef-scroll-body">
          <div className="ef-body">
            <div className="ef-field full">
              <label className="ef-label" htmlFor="fb-template">Form Master template</label>
              <select id="fb-template" className="ef-input" defaultValue="" onChange={(event) => applyTemplate(event.target.value)}>
                <option value="">Start with a blank form</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
              </select>
            </div>
            <div className="ef-field full">
              <label className="ef-label" htmlFor="fb-title">
                Form title<span className="ef-required">*</span>
              </label>
              <input
                id="fb-title"
                className={`ef-input${errors.title ? " invalid" : ""}`}
                value={builder.title}
                onChange={(event) => updateBuilder("title", event.target.value)}
                placeholder="e.g. Employee check-in form"
              />
              {errors.title && <span className="ef-error">A title is required.</span>}
            </div>

            <div className="ef-field">
              <label className="ef-label" htmlFor="fb-assigned">Assigned to</label>
              <select id="fb-assigned" className="ef-input" value={builder.assignedTo} onChange={(event) => updateBuilder("assignedTo", event.target.value)}>
                <option value="all">All employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employeeName(employee)}</option>
                ))}
              </select>
            </div>

            <div className="ef-field">
              <label className="ef-label" htmlFor="fb-approver">Approved by</label>
              <select id="fb-approver" className="ef-input" value={builder.approvedBy} onChange={(event) => updateBuilder("approvedBy", event.target.value)}>
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
              {errors.fields && <span className="ef-error">Add at least one field with a label.</span>}
            </div>

            <div className="fb-fields">
              {builder.fields.map((field, index) => (
                <div key={field.id} className="fb-field-row">
                  <span className="fb-field-index">{index + 1}</span>

                  <div className="ef-field fb-grow">
                    <label className="ef-label" htmlFor={`fb-label-${field.id}`}>Field label</label>
                    <input id={`fb-label-${field.id}`} className="ef-input" value={field.label} onChange={(event) => updateField(index, "label", event.target.value)} placeholder="e.g. Leave type" />
                  </div>

                  <div className="ef-field">
                    <label className="ef-label" htmlFor={`fb-type-${field.id}`}>Field type</label>
                    <select id={`fb-type-${field.id}`} className="ef-input" value={field.type} onChange={(event) => updateFieldType(index, event.target.value)}>
                      {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>

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
                              id={`fb-option-${field.id}-${optionIndex}`}
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
              <button type="button" className="ef-btn-secondary" onClick={resetBuilder}>
                Reset
              </button>
              <button className="primary" type="submit" disabled={saving}>
                <FileText size={16} /> {saving ? "Saving..." : editingFormId ? "Update form" : "Save form"}
              </button>
            </div>
          </div>
        </form>
      ) : activeTab === "forms" ? (
        <DataTable
          title="Forms"
          noun="form"
          searchPlaceholder="Search form..."
          rows={formRows}
          emptyTitle="No forms yet"
          emptyText="Create your first employee form from the Build form tab."
          columns={[
            { key: "title", label: "Title", value: (row) => row.title },
            { key: "assignedTo", label: "Assigned to", value: (row) => row.assignedTo },
            { key: "approver", label: "Approved by", value: (row) => row.approver },
            { key: "received", label: "Responses", value: (row) => row.received, sortValue: (row) => row.received },
            { key: "pending", label: "Pending", value: (row) => row.pending, sortValue: (row) => row.pending },
            { key: "created", label: "Created", value: (row) => new Date(row.createdAt).toLocaleDateString(), sortValue: (row) => new Date(row.createdAt).getTime() },
          ]}
          renderActions={(row) => (
            <div className="row-actions">
              <button type="button" className="row-action-btn edit" aria-label={`Edit ${row.title}`} title="Edit form" onClick={() => editForm(row.form)}>
                <Pencil size={14} />
              </button>
              <button type="button" className="row-action-btn delete" aria-label={`Delete ${row.title}`} title="Delete form" onClick={() => window.confirm(`Delete "${row.title}" and all of its responses?`) && deleteForm(row.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          )}
        />
      ) : viewing ? (
        <FormResponseDetail form={viewing.form} response={viewing.response} onBack={() => setViewing(null)} actions={reviewButton(viewing)} />
      ) : (
        <DataTable
          title="Form responses"
          noun="response"
          searchPlaceholder="Search response..."
          statusFilter
          rows={responseRows}
          emptyTitle="No responses yet"
          emptyText="Filled-in forms from employees will be listed here."
          columns={responseColumns()}
          onRowClick={setViewing}
          renderActions={responseRows.some((row) => canReview(row.form)) ? reviewButton : undefined}
          actionsLabel="Review"
        />
      )}
    </div>
  );
}

export default FormBuilder;
