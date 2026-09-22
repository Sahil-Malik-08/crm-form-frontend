import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, ClipboardList, Clock, Eye, FileText } from "lucide-react";
import DataTable from "../components/DataTable";
import FormResponseDetail from "../components/FormResponseDetail";
import { FIELD_TYPES, fetchApprovals, fetchForms, setResponseStatus, submitFormResponse } from "../utils/employeeForms";
import { responseColumns, toResponseRows } from "../components/responseTable";

const inputType = (type) => FIELD_TYPES.includes(type) ? type : "text";

function AssignedForms({ auth }) {
  const [forms, setForms] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [tab, setTab] = useState("assigned");
  const [viewing, setViewing] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    try {
      const [assigned, review] = await Promise.all([fetchForms({ mine: true }), fetchApprovals()]);
      setForms(assigned);
      setApprovals(review);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setValue = (formId, fieldId, value) => {
    setDrafts((previous) => ({ ...previous, [formId]: { ...previous[formId], [fieldId]: value } }));
  };

  const submit = async (form, event) => {
    event.preventDefault();
    const draft = drafts[form.id] || {};
    const answers = {};
    const missing = form.fields.find((field) => {
      const value = draft[field.id] || [];
      answers[field.id] = Array.isArray(value) ? value : [value];
      return field.required && !answers[field.id].filter(Boolean).length;
    });
    if (missing) {
      setMessage({ type: "error", text: `"${missing.label}" is required.` });
      return;
    }
    setSaving(form.id);
    try {
      await submitFormResponse(form.id, answers);
      setMessage({ type: "success", text: "Response submitted successfully." });
      await load();
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2 }}>Employee portal</div>
        <h1 style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800 }}>Forms</h1>
      </div>
      {message && <div className={`fb-notice ${message.type}`}>{message.text}</div>}
      <div className="fb-tabs" role="tablist" style={{ alignSelf: "flex-start" }}>
        <button role="tab" aria-selected={tab === "assigned"} className={tab === "assigned" ? "active" : ""} onClick={() => setTab("assigned")}><FileText size={15} /> Assigned forms <span className="fb-count">{forms.length}</span></button>
        <button role="tab" aria-selected={tab === "responses"} className={tab === "responses" ? "active" : ""} onClick={() => setTab("responses")}><ClipboardList size={15} /> My responses <span className="fb-count">{responseForms.length}</span></button>
        {approvals.length > 0 && <button role="tab" aria-selected={tab === "approvals"} className={tab === "approvals" ? "active" : ""} onClick={() => setTab("approvals")}><ClipboardCheck size={15} /> Approvals <span className="fb-count">{pendingApprovalCount}</span></button>}
      </div>

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
          searchPlaceholder="Search response..."
          rows={responseRows}
          columns={responseColumns()}
          onRowClick={setViewing}
          renderActions={(row) => <button type="button" className="row-action-btn view" aria-label="View response" title="View response" onClick={() => setViewing(row)}><Eye size={14} /></button>}
          emptyTitle="No responses submitted yet"
          emptyText="Submitted form responses will appear here."
        />
      ) : forms.length ? forms.map((form) => {
        const approved = form.myResponse?.status === "approved";
        const draft = drafts[form.id] || {};
        return (
          <form className="card ef-card" key={form.id} onSubmit={(event) => submit(form, event)} noValidate>
            <div className="ef-header"><div><h3 className="ef-title">{form.title}</h3><div className="ef-meta">Approved by: <strong>{form.approvedByName || "Supervisor"}</strong></div></div><span className={`ef-status${approved ? " done" : ""}`}>{approved ? <CheckCircle2 size={14} /> : <Clock size={14} />} {approved ? "Approved" : form.myResponse ? "Pending" : "Not submitted"}</span></div>
            <div className="ef-body">
              {form.fields.map((field) => {
                const type = inputType(field.type);
                const value = draft[field.id] || (form.myResponse?.answers?.[field.id] || []);
                const choices = field.options || [];
                return <div className={`ef-field${type === "textarea" ? " full" : ""}`} key={field.id}>
                  <label className="ef-label">{field.label}{field.required && <span className="ef-required">*</span>}</label>
                  {type === "textarea" ? <textarea className="ef-input" rows={3} disabled={approved} value={Array.isArray(value) ? value[0] || "" : value} onChange={(event) => setValue(form.id, field.id, [event.target.value])} />
                    : type === "select" ? <select className="ef-input" disabled={approved} value={Array.isArray(value) ? value[0] || "" : value} onChange={(event) => setValue(form.id, field.id, [event.target.value])}><option value="">Select an option</option>{choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select>
                      : type === "multiselect" || type === "checkbox" ? <div className="assigned-form-options">{choices.map((choice) => { const selected = Array.isArray(value) && value.includes(choice); return <label key={choice}><input type={type === "checkbox" ? "checkbox" : "checkbox"} disabled={approved} checked={selected} onChange={(event) => setValue(form.id, field.id, selected ? value.filter((item) => item !== choice) : [...(Array.isArray(value) ? value : []), choice])} /> {choice}</label>; })}</div>
                        : <input className="ef-input" type={type} disabled={approved} value={Array.isArray(value) ? value[0] || "" : value} onChange={(event) => setValue(form.id, field.id, [event.target.value])} />}
                </div>;
              })}
            </div>
            <div className="ef-footer"><span className="ef-footer-note">{approved ? "This response is approved." : <><span className="ef-required">*</span> Required fields</>}</span><button className="primary" disabled={approved || saving === form.id}>{saving === form.id ? "Submitting..." : "Submit response"}</button></div>
          </form>
        );
      }) : <div className="card" style={{ padding: 18 }}><h3 style={{ margin: 0 }}>No forms assigned</h3><p>Your manager has not assigned any forms to you yet.</p></div>}
    </div>
  );
}

export default AssignedForms;