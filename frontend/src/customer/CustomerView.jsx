import { ArrowLeft } from "lucide-react";
import { toTitleCase } from "../config";

function CustomerView({ record, onBack, onEdit }) {
  const fields = [
    ["name", "Customer Name"],
    ["phone", "Phone Number"],
    ["alternatePhone", "Alternate Phone"],
    ["salesPerson", "Sales Person"],
    ["houseNo", "House / Flat No."],
    ["locality", "Locality"],
    ["city", "City"],
    ["state", "State"],
    ["pincode", "Pincode"],
    ["address", "Full Address"],
  ];

  const nameFields = new Set(["name", "salesPerson"]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Customer Details</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={() => onEdit(record)}>Edit</button>
        </div>
      </div>
      <div style={{ background: "var(--color-surface-card, #fff)", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 12, padding: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {fields.map(([k, label], i) => (
              <tr key={k} style={{ borderBottom: i < fields.length - 1 ? "1px solid var(--color-border, #f1f5f9)" : "none" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary, #475569)", fontSize: 14, width: 200, background: "var(--color-surface, #f8fafc)" }}>{label}</td>
                <td style={{ padding: "12px 16px", color: "var(--color-text-primary, #0f172a)", fontSize: 14 }}>{nameFields.has(k) ? toTitleCase(record[k] || "—") : (record[k] || "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
          {/* <button type="button" className="primary" onClick={() => onEdit(record)}> Edit</button>
          <button type="button" className="delete" onClick={onBack}>← Back</button> */}
        </div>
      </div>
    </>
  );
}
export default CustomerView;
