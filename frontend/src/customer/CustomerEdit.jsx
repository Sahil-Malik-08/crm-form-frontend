import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { request } from "../config";
import LocationFields from "../components/LocationFields";
import SearchSelect from "../components/SearchSelect";

function CustomerEdit({ record, onBack, onComplete, salesPersonOptions = [] }) {
  const [form, setForm] = useState({
    name: record.name || "",
    phone: record.phone || "",
    alternatePhone: record.alternatePhone || "",
    houseNo: record.houseNo || "",
    locality: record.locality || "",
    city: record.city || "",
    state: record.state || "",
    pincode: record.pincode || "",
    address: record.address || "",
    salesPerson: record.salesPerson || "",
  });
  const [saving, setSaving] = useState(false);

  const assembleAddress = (partial) => {
    const parts = [partial.houseNo, partial.locality, partial.city, partial.state, partial.pincode].filter(Boolean);
    return parts.join(", ");
  };

  const updateField = (field, value) => {
    setForm((previous) => {
      const updated = { ...previous, [field]: value };
      if (field === 'state') {
        updated.city = '';
      }
      updated.address = assembleAddress(updated);
      return updated;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name, phone: form.phone || null, alternatePhone: form.alternatePhone || null,
      houseNo: form.houseNo || null, locality: form.locality || null,
      city: form.city || null, state: form.state || null,
      address: form.address || null, pincode: form.pincode || null,
      salesPerson: form.salesPerson || null,
    };
    const r = await request(`/customers/${record.id}`, { method: "PUT", body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) { onComplete(); } else { alert((await r.json()).message); }
  };

const inputStyle = { width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", font: "inherit" };

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Customer Edit</h1>
          </div>
        </div>
      </div>
      <form className="form card" onSubmit={save}>
        {/* <h2>Customer Edit</h2> */}

        <label style={{ gridColumn: "span 2" }}>Customer Name <span className="required-marker">*</span>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        </label>

        <label>Phone Number <span className="required-marker">*</span>
          <input type="tel" inputMode="numeric" pattern="[0-9]{10}" title="Enter exactly 10 digits." required maxLength={10} value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })} style={inputStyle} />
        </label>

        <label>Alternate Phone
          <input type="tel" inputMode="numeric" pattern="[0-9]{10}" title="Enter exactly 10 digits." maxLength={10} value={form.alternatePhone}
            onChange={(e) => setForm({ ...form, alternatePhone: e.target.value.replace(/[^0-9]/g, "") })} style={inputStyle} />
        </label>

        <label>Sales Person
          {salesPersonOptions.length > 0 ? (
            <SearchSelect
              value={form.salesPerson}
              options={salesPersonOptions}
              onChange={(value) => updateField("salesPerson", value)}
              placeholder="Select sales person"
              searchPlaceholder="Search sales person..."
              style={{ marginTop: 6 }}
            />
          ) : (
            <input type="text" value={form.salesPerson} onChange={(e) => setForm({ ...form, salesPerson: e.target.value })}
              placeholder="Sales person name" style={inputStyle} />
          )}
        </label>

        <label>House / Flat No.
          <input type="text" value={form.houseNo} onChange={(e) => updateField("houseNo", e.target.value)} style={inputStyle} />
        </label>

        <label>Locality / Sector
          <input type="text" value={form.locality} onChange={(e) => updateField("locality", e.target.value)} style={inputStyle} />
        </label>

        <LocationFields
          state={form.state}
          city={form.city}
          onStateChange={(value) => updateField("state", value)}
          onCityChange={(value) => updateField("city", value)}
          onPincodeChange={(value) => updateField("pincode", value)}
        />

        <label style={{ gridColumn: "span 2" }}>Pincode <span className="required-marker">*</span>
          <input type="text" required maxLength={6} value={form.pincode}
            onChange={(e) => updateField("pincode", e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="6-digit PIN code" style={inputStyle} />
        </label>

        <label style={{ gridColumn: "span 2" }}>Full Address (Auto-generated)
          <textarea value={form.address} rows={3} readOnly
style={{ ...inputStyle, background: "var(--color-surface, #f8fafc)", boxSizing: "border-box", resize: "none" }} />
        </label>

        <div className="form-actions">
          <button type="button" className="delete" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save "}</button>
        </div>
      </form>
    </>
  );
}
export default CustomerEdit;
