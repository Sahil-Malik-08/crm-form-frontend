import Field from "../components/Field";
import { ArrowLeft } from "lucide-react";
import { toTitleCase } from "../config";
import { formatCurrency } from "../utils/settings";

function ItemView({ record, onBack, onEdit }) {
  const fields = [
    ["itemCode", "Item Code"],
    ["name", "Item Name"],
    ["category", "Category"],
    ["status", "Status"],
    ["price", "Selling Price"],
    ["stock", "Stock"],
    ["description", "Description"]
  ];

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "price") return formatCurrency(value);
    if (key === "name") return toTitleCase(value);
    return value;
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Item Details</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={() => onEdit(record)}>Edit</button>
        </div>
      </div>
      <div className="form card">
        {/* <h2>Item Details</h2> */}
        {fields.map(([k, label]) => (
          <Field key={k} label={label} type="text"
            value={formatValue(k, record[k])}
            disabled={true} change={() => {}} />
        ))}
      </div>
    </>
  );
}
export default ItemView;

