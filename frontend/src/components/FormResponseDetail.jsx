import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export function StatusPill({ status }) {
  const approved = status === "approved";
  return (
    <span className={`ef-status${approved ? " done" : ""}`}>
      {approved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
      {approved ? "Approved" : "Pending"}
    </span>
  );
}

// Full detail view of one filled-in form, opened from a responses list.
// `actions` (optional) renders extra controls, e.g. approve buttons, next to the status.
function FormResponseDetail({ form, response, onBack, actions = null }) {
  const meta = [
    ["Employee", response.userName],
    ["Form", form.title],
    ["Approved by", form.approvedByName || "—"],
    ["Submitted", new Date(response.submittedAt).toLocaleString()],
    ["Reviewed", response.reviewedAt ? new Date(response.reviewedAt).toLocaleString() : "—"],
  ];

  return (
    <div className="page-with-title-row" style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} aria-label="Back to list" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Response Details</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StatusPill status={response.status} />
          {actions}
        </div>
      </div>

      <div className="card ef-card" style={{ flex: "0 0 auto" }}>
        <div className="ef-header">
          <h3 className="ef-title">Overview</h3>
        </div>
        <dl className="fb-detail">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Answers take the remaining height and scroll when they don't fit on screen. */}
      <div className="card ef-card" style={{ minHeight: 220 }}>
        <div className="ef-header">
          <h3 className="ef-title">Answers</h3>
        </div>
        <div className="ef-scroll-body">
        <dl className="fb-detail">
          {form.fields.map((field) => {
            const answer = response.answers[field.id] || [];
            const value = answer.filter((entry) => entry !== null && String(entry).trim() !== "").join(", ") || "Not provided";
            return (
              <div key={field.id}>
                <dt>{field.label}</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
        </dl>
        </div>
      </div>
    </div>
  );
}

export default FormResponseDetail;
