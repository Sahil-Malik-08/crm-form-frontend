import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { request } from "../config";
import Field from "../components/Field";
import { getCurrencySymbol } from "../utils/settings";

function ItemEdit({ record, onBack, onComplete }) {
  const [form, setForm] = useState({ ...record });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name, itemCode: form.itemCode,
      category: form.category || null, description: form.description || null,
      price: Number(form.price), stock: Number(form.stock), status: form.status || "Active"
    };
    const r = await request(`/items/${record.id}`, { method: "PUT", body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) { onComplete(); } else { alert((await r.json()).message); }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Item Edit</h1>
          </div>
        </div>
      </div>
      <form className="form card" onSubmit={save}>
        {/* <h2>Item Edit</h2> */}
        <Field label="Item Code" value={form.itemCode} change={(v) => setForm({ ...form, itemCode: v.toUpperCase() })} />
        <Field label="Item Name" value={form.name} change={(v) => setForm({ ...form, name: v })} />
        <label>Category
          <select value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.category ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
            <option value="">-- Select Category --</option>
            {["Electronics", "Furniture", "Office", "Kitchen", "Clothing", "Accessories", "Stationery", "Others"].map(cat => (<option key={cat}>{cat}</option>))}
          </select>
        </label>
        <label>Status
          <select value={form.status || "Active"} onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.status ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
            <option value="Active">Active</option><option value="Inactive">Inactive</option>
          </select>
        </label>
        <Field label={`Selling Price (${getCurrencySymbol()})`} type="number" value={form.price} change={(v) => setForm({ ...form, price: v })} />
        <Field label="Stock" type="number" value={form.stock} change={(v) => setForm({ ...form, stock: v })} />
        <label style={{ gridColumn: "1 / -1" }}>Description
          <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", font: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </>
  );
}
export default ItemEdit;

