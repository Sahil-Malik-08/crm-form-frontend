import { useState } from "react";

function ContactEdit({ record, onBack, onSave }) {
  const [form, setForm] = useState({
    fullName: record.fullName || "",
    phoneNumber: record.phoneNumber || "",
    email: record.email || "",
    gender: record.gender || "",
    address: record.address || "",
    birthday: record.birthday || "",
    notes: record.notes || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    setError("");
    setSaving(true);
    const saved = await onSave({ id: record.id, ...form, phoneNumber: form.phoneNumber.trim() });
    setSaving(false);
    if (saved !== false) onBack();
  };

  const inputStyle = {
    width: "100%",
    padding: "9px 10px",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    background: "var(--color-surface)",
    color: "var(--color-text-primary)",
    font: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="title">
        <div>
          <h1>Contact Edit</h1>
        </div>
        <button type="button" className="delete" onClick={onBack}>← Back</button>
      </div>

      <form onSubmit={save} style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 20, background: "var(--color-surface-card)" }}>
        {error && <p style={{ margin: "0 0 12px", color: "#b91c1c", fontSize: 13 }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Full Name <span style={{ color: "#b91c1c" }}>*</span></span>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Phone Number <span style={{ color: "#b91c1c" }}>*</span></span>
            <input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/[^0-9]/g, "") })} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Email Address</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Gender</span>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ ...inputStyle, color: form.gender ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Birthday</span>
            <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Address</span>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
          </label>
          <label style={{ gridColumn: "1 / -1", display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              style={{ ...inputStyle, resize: "vertical" }} />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button type="button" className="delete" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}

export default ContactEdit;

