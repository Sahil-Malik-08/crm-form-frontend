import Field from "../components/Field";
import { ArrowLeft } from "lucide-react";
import { toTitleCase } from "../config";

function UserView({ record, onBack, onEdit }) {
  const fields = [
    ["fullName", "Full name"],
    ["username", "Username"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["department", "Department"],
    ["role", "Role"],
    ["reportsTo", "Reports To"],
    ["branch", "Branches"],
    ["status", "Status"],
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>User Details</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={() => onEdit(record)}>Edit</button>
        </div>
      </div>
      <div className="form card">
        {/* <h2>User Details</h2> */}
        {fields.map(([k, label]) => {
          const displayValue = k === "reportsTo" ? (record.reportsTo || "—")
            : k === "role" ? (record.role || record.designation || "—")
            : k === "fullName" ? toTitleCase(record[k] || "—")
            : (record[k] || "—");
          return (
            <Field key={k} label={label} type="text" value={displayValue} disabled={true} change={() => {}} />
          );
        })}
      </div>
    </>
  );
}

export default UserView;