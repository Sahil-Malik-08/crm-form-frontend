import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ClipboardList, Clock, Eye, FileText } from "lucide-react";
import DataTable from "../components/DataTable";
import FormResponseDetail from "../components/FormResponseDetail";
import { FIELD_TYPES, fetchApprovals, fetchForms, setResponseStatus, submitFormResponse } from "../utils/employeeForms";
import { responseColumns, toResponseRows } from "../components/responseTable";
import { useMasters } from "../hooks/useMasters";

const inputType = (type) => FIELD_TYPES.includes(type) ? type : "text";

// Dropdowns whose choices depend on another dropdown: City on State, Role on Department.
// A field matches either because it was built with the Master picker (masterKey set) or, for
// older forms built by hand, because its label says so. Child choices always come from the
// live master (the form's saved options are capped at 50), filtered by the parent's value.
const DEPENDENT_FIELDS = [
  { childKey: "cities", childLabel: /\bcit(y|ies)\b/i, parentKey: "states", parentLabel: /\bstates?\b/i, parentNameOf: (item) => item.stateName, noun: "state", plural: "cities" },
  { childKey: "roles", childLabel: /\broles?\b/i, parentKey: "departments", parentLabel: /\bdep(ar)?t/i, parentNameOf: (item) => item.departmentName, noun: "department", plural: "roles" },
];
const matchesField = (field, key, label) => field.type === "select" && (field.masterKey === key || label.test(field.label || ""));
const dependencyOf = (field) => DEPENDENT_FIELDS.find((dep) => matchesField(field, dep.childKey, dep.childLabel));
const isParentOf = (dep) => (field) => matchesField(field, dep.parentKey, dep.parentLabel);
const sameName = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

function AssignedForms({ auth }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const masters = useMasters(["cities", "roles"]);
  const [approvals, setApprovals] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [tab, setTab] = useState("assigned");
  const [viewing, setViewing] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(null);
  // The Assigned forms tab lists the forms; clicking one opens just that form to fill in.
  const [openFormId, setOpenFormId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [assigned, review] = await Promise.all([fetchForms({ mine: true }), fetchApprovals()]);
      setForms(assigned);
      setApprovals(review);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setValue = (formId, fieldId, value) => {
    setDrafts((previous) => ({ ...previous, [formId]: { ...previous[formId], [fieldId]: value } }));
  };

  // Changing a state/department clears its dependent city/role answer, since those choices narrow to it.
  const setFieldValue = (form, field, value) => {
    setValue(form.id, field.id, value);
    DEPENDENT_FIELDS.filter((dep) => isParentOf(dep)(field)).forEach((dep) => {
      form.fields.filter((other) => dependencyOf(other) === dep).forEach((child) => setValue(form.id, child.id, []));
    });
  };

  const submit = async (form, event) => {
    event.preventDefault();
    const draft = drafts[form.id] || {};
    const answers = {};
    const missing = form.fields.find((field) => {
      // Fields left untouched keep the previously submitted answer, exactly as the form displays them.
      const value = draft[field.id] || form.myResponse?.answers?.[field.id] || [];
      answers[field.id] = Array.isArray(value) ? value : [value];
      return field.required && !answers[field.id].filter(Boolean).length;
    });
    if (missing) {
      setMessage({ type: "error", text: `"${missing.label}" is required.` });
      return;
    }
    for (const dep of DEPENDENT_FIELDS) {
      const parent = form.fields.find(isParentOf(dep));
      const orphan = parent && !answers[parent.id].filter(Boolean).length && form.fields.find((field) => dependencyOf(field) === dep && answers[field.id].filter(Boolean).length);
      if (orphan) {
        setMessage({ type: "error", text: `Select "${parent.label}" before choosing "${orphan.label}".` });
        return;
      }
    }
    setSaving(form.id);
    try {
      await submitFormResponse(form.id, answers);
      setMessage({ type: "success", text: "Response submitted successfully." });
      await load();
      setOpenFormId(null);
      setTab("responses");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(null);
    }
  };

  const responseForms = forms.filter((form) => form.myResponse);
  const responseRows = toResponseRows(responseForms, { mine: true });
  const approvalRows = toResponseRows(approvals);
  const pendingApprovalCount = approvalRows.filter((row) => row.response.status !== "approved").length;
  const openForm = tab === "assigned" ? forms.find((form) => form.id === openFormId) : null;
  const formStatus = (form) => (form.myResponse?.status === "approved" ? "Approved" : form.myResponse ? "Pending" : "Not submitted");
  const assignedRows = forms.map((form) => ({ id: form.id, form, title: form.title, approver: form.approvedByName || "Supervisor", fields: (form.fields || []).length, status: formStatus(form), submittedAt: form.myResponse?.submittedAt }));
  const changeTab = (next) => { setTab(next); setOpenFormId(null); };

  const changeStatus = async (row, status) => {
    try {
      await setResponseStatus(row.id, status);
      setMessage({ type: "success", text: status === "approved" ? "Response approved." : "Response marked as pending." });
      await load();
      setViewing(null);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const reviewButton = (row) => (
    <button type="button" className={row.response.status === "approved" ? "ef-btn-secondary" : "primary"} onClick={() => changeStatus(row, row.response.status === "approved" ? "pending" : "approved")}>
      {row.response.status === "approved" ? "Mark as pending" : "Approve"}
    </button>
  );

  if (viewing) {
    return <FormResponseDetail form={viewing.form} response={viewing.response} onBack={() => setViewing(null)} actions={viewing.canReview ? reviewButton(viewing) : null} />;
  }

  return (
    <div className="page-with-title-row" style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, minHeight: 0 }}>
      <div className="fb-page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => (openForm ? setOpenFormId(null) : window.history.back())} aria-label="Go back" title="Go back" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Forms</h1>
        </div>
        <div className="fb-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "assigned"} className={tab === "assigned" ? "active" : ""} onClick={() => changeTab("assigned")}><FileText size={15} /> Assigned forms <span className="fb-count">{forms.length}</span></button>
          <button role="tab" aria-selected={tab === "responses"} className={tab === "responses" ? "active" : ""} onClick={() => changeTab("responses")}><ClipboardList size={15} /> My responses <span className="fb-count">{responseForms.length}</span></button>
          {approvals.length > 0 && <button role="tab" aria-selected={tab === "approvals"} className={tab === "approvals" ? "active" : ""} onClick={() => changeTab("approvals")}><ClipboardCheck size={15} /> Approvals <span className="fb-count">{pendingApprovalCount}</span></button>}
        </div>
      </div>
      {message && <div className={`fb-notice ${message.type}`}>{message.text}</div>}

      {tab === "approvals" ? (
        approvalRows.length ? (
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 12px" }}>Submitted responses</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {approvalRows.map((row) => <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}><div><strong>{row.employee}</strong><div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{row.formTitle} · {new Date(row.submittedAt).toLocaleString()} · {row.response.status}</div></div><div style={{ display: "flex", gap: 8 }}><button type="button" className="ef-btn-secondary" onClick={() => setViewing({ ...row, canReview: true })}>View</button>{reviewButton(row)}</div></div>)}
            </div>
          </div>
        ) : <div className="card" style={{ padding: 18 }}>No submitted responses are available.</div>
      ) : tab === "responses" ? (
        <DataTable
          title="My responses"
          noun="response"
          loading={loading}
          searchPlaceholder="Search response..."
          rows={responseRows}
          columns={responseColumns()}
          onRowClick={setViewing}
          renderActions={(row) => <button type="button" className="row-action-btn view" aria-label="View response" title="View response" onClick={() => setViewing(row)}><Eye size={14} /></button>}
          emptyTitle="No responses submitted yet"
          emptyText="Submitted form responses will appear here."
        />
      ) : !openForm ? (
        <DataTable
          title="Assigned forms"
          noun="form"
          loading={loading}
          searchPlaceholder="Search form..."
          rows={assignedRows}
          columns={[
            { key: "title", label: "Form", value: (row) => row.title },
            { key: "approver", label: "Approved by", value: (row) => row.approver },
            { key: "fields", label: "Fields", value: (row) => row.fields, sortValue: (row) => row.fields },
            { key: "submitted", label: "Submitted", value: (row) => (row.submittedAt ? new Date(row.submittedAt).toLocaleString() : ""), sortValue: (row) => (row.submittedAt ? new Date(row.submittedAt).getTime() : 0) },
            { key: "status", label: "Status", value: (row) => row.status, render: (row) => <span className={`ef-status${row.status === "Approved" ? " done" : ""}`}>{row.status === "Approved" ? <CheckCircle2 size={14} /> : <Clock size={14} />} {row.status}</span> },
          ]}
          onRowClick={(row) => setOpenFormId(row.id)}
          renderActions={(row) => <button type="button" className="row-action-btn view" aria-label={`Open ${row.title}`} title="Open form" onClick={() => setOpenFormId(row.id)}><Eye size={14} /></button>}
          emptyTitle="No forms assigned"
          emptyText="Your manager has not assigned any forms to you yet."
        />
      ) : [openForm].map((form) => {
        const approved = form.myResponse?.status === "approved";
        const draft = drafts[form.id] || {};
        return (
          <form className="card ef-card" key={form.id} onSubmit={(event) => submit(form, event)} noValidate>
            <div className="ef-header"><div><h3 className="ef-title">{form.title}</h3><div className="ef-meta">Approved by: <strong>{form.approvedByName || "Supervisor"}</strong></div></div><span className={`ef-status${approved ? " done" : ""}`}>{approved ? <CheckCircle2 size={14} /> : <Clock size={14} />} {approved ? "Approved" : form.myResponse ? "Pending" : "Not submitted"}</span></div>
            <div className="ef-scroll-body"><div className="ef-body">
              {form.fields.map((field) => {
                const type = inputType(field.type);
                const value = draft[field.id] || (form.myResponse?.answers?.[field.id] || []);
                let choices = field.options || [];
                let placeholder = null;
                const dep = dependencyOf(field);
                if (dep) {
                  const parent = form.fields.find(isParentOf(dep));
                  const parentValue = parent ? (draft[parent.id] || (form.myResponse?.answers?.[parent.id] || []))[0] : null;
                  const items = masters[dep.childKey];
                  choices = parentValue && items ? items.filter((item) => sameName(dep.parentNameOf(item), parentValue)).map((item) => item.name) : [];
                  if (!choices.length) placeholder = !parentValue ? `Select a ${dep.noun} first` : !items ? `Loading ${dep.plural}...` : `No ${dep.plural} for this ${dep.noun}`;
                }
                return <div className={`ef-field${type === "textarea" ? " full" : ""}`} key={field.id}>
                  <label className="ef-label">{field.label}{field.required && <span className="ef-required">*</span>}</label>
                  {type === "textarea" ? <textarea className="ef-input" rows={3} disabled={approved} value={Array.isArray(value) ? value[0] || "" : value} onChange={(event) => setFieldValue(form, field, [event.target.value])} />
                    : type === "select" ? <select className="ef-input" disabled={approved || (dep && !choices.length)} value={Array.isArray(value) ? value[0] || "" : value} onChange={(event) => setFieldValue(form, field, [event.target.value])}><option value="">{placeholder || "Select an option"}</option>{choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select>
                      : type === "multiselect" || type === "checkbox" ? <div className="assigned-form-options">{choices.map((choice) => { const selected = Array.isArray(value) && value.includes(choice); return <label key={choice}><input type={type === "checkbox" ? "checkbox" : "checkbox"} disabled={approved} checked={selected} onChange={(event) => setFieldValue(form, field, selected ? value.filter((item) => item !== choice) : [...(Array.isArray(value) ? value : []), choice])} /> {choice}</label>; })}</div>
                        : <input className="ef-input" type={type} disabled={approved} value={Array.isArray(value) ? value[0] || "" : value} onChange={(event) => setFieldValue(form, field, [event.target.value])} />}
                </div>;
              })}
            </div></div>
            <div className="ef-footer"><span className="ef-footer-note">{approved ? "This response is approved." : <><span className="ef-required">*</span> Required fields</>}</span><button className="primary" disabled={approved || saving === form.id}>{saving === form.id ? "Submitting..." : "Submit response"}</button></div>
          </form>
        );
      })}
    </div>
  );
}

export default AssignedForms;