import { useState } from "react";
import { request } from "../config";
import Field from "../components/Field";
import { getCurrencySymbol } from "../utils/settings";

function ItemAdd({ complete }) {
  const [form, setForm] = useState({
    name: "", itemCode: "", category: "", brand: "", unit: "", status: "Active",
    purchasePrice: "", price: "", stock: "", minStock: "", description: ""
  });

  const save = async (e) => {
    e.preventDefault();
    const body = {
      name: form.name, itemCode: form.itemCode,
      category: form.category || null, description: form.description || null,
      price: Number(form.price), stock: Number(form.stock), status: form.status || "Active"
    };
    const r = await request("/items", { method: "POST", body: JSON.stringify(body) });
    if (!r.ok) { alert((await r.json()).message); return; }
    complete();
  };

  return (
    <form className="form card" onSubmit={save}>
      <h2>New Item</h2>
      <Field label="Item Code" value={form.itemCode} change={(v) => setForm({ ...form, itemCode: v.toUpperCase() })} />
      <Field label="Item Name" value={form.name} change={(v) => setForm({ ...form, name: v })} />
      <label>Category
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.category ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
          <option value="">-- Select Category --</option>
          {["Electronics", "Furniture", "Office", "Kitchen", "Clothing", "Accessories", "Stationery", "Others"].map(cat => (<option key={cat}>{cat}</option>))}
        </select>
      </label>
      <label>Status
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.status ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
          <option value="Active">Active</option><option value="Inactive">Inactive</option>
        </select>
      </label>
      <Field label={`Selling Price (${getCurrencySymbol()})`} type="number" value={form.price} change={(v) => setForm({ ...form, price: v })} />
      <Field label="Stock" type="number" value={form.stock} change={(v) => setForm({ ...form, stock: v })} />
      <label style={{ gridColumn: "1 / -1" }}>Description
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
          style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", font: "inherit", resize: "vertical", boxSizing: "border-box" }} />
      </label>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="primary">Save Item</button>
      </div>
    </form>
  );
}
export default ItemAdd;

