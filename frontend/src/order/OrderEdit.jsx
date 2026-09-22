import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { request } from "../config";
import LocationFields from "../components/LocationFields";
import SearchSelect from "../components/SearchSelect";
import { formatCurrency } from "../utils/settings";

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr" },
  { value: "Ms", label: "Ms" },
  { value: "Mrs", label: "Mrs" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
];

function OrderEdit({ record, data = {}, onBack, onComplete }) {
  const safeRecord = record || {};
  const recordId = safeRecord.id ?? "";
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerRows, setCustomerRows] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOffset, setCustomerOffset] = useState(0);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerLoadingMore, setCustomerLoadingMore] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [itemsCatalog, setItemsCatalog] = useState(Array.isArray(data?.items) ? data.items : []);
  const customersList = Array.isArray(data?.customers) ? data.customers : data?.customers?.rows || [];
  const [form, setForm] = useState({
    title: safeRecord.title || "",
    customerId: customersList.find((x) => x.name === safeRecord.customer)?.id || "",
    customerName: safeRecord.customer || "",
    phoneNumber: safeRecord.phoneNumber || "",
    alternatePhone: safeRecord.alternatePhone || "",
    houseNo: safeRecord.houseNo || "",
    locality: safeRecord.locality || "",
    city: safeRecord.city || "",
    state: safeRecord.state || "",
    address: safeRecord.address || "",
    pincode: safeRecord.pincode || "",
    employeeId: safeRecord.employeeId || "",
    items: (safeRecord.items || []).map((i) => ({
      productName: i.productName || "",
      unitPrice: Number(i.unitPrice || 0),
      qty: Number(i.quantity || 1),
      amount: Number(i.subtotal || i.unitPrice * i.quantity || 0),
    })),
    status: safeRecord.status || "Pending",
    notes: safeRecord.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCustomerOptions = async (query = "", append = false) => {
    try {
      const offset = append ? customerOffset : 0;
      const params = new URLSearchParams({ limit: "20", offset: String(offset) });
      if (query.trim()) params.set("name", query.trim());
      const r = await request(`/customers?${params.toString()}`);
      if (!r.ok) return;
      const result = await r.json();
      const rows = result.rows || [];
      const total = result.total || 0;
      const options = rows.map((c) => ({ value: c.id, label: c.name }));
      const currentName = safeRecord.customer;
      if (currentName && !options.some((o) => o.label === currentName)) {
        options.unshift({ value: safeRecord.customerId || "", label: currentName });
      }
      if (append) {
        setCustomerOptions((prev) => {
          const existingLabels = new Set(prev.map((o) => o.label));
          const newOptions = options.filter((o) => !existingLabels.has(o.label));
          return [...prev, ...newOptions];
        });
        setCustomerRows((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newRows = rows.filter((r) => !existingIds.has(r.id));
          return [...prev, ...newRows];
        });
      } else {
        setCustomerOptions(options);
        setCustomerRows(rows);
      }
      setCustomerTotal(total);
      setCustomerOffset(offset + rows.length);
      if (currentName && !form.customerId) {
        const matched = rows.find((c) => c.name === currentName);
        if (matched) setForm((prev) => ({ ...prev, customerId: matched.id }));
      }
    } catch (err) {
      console.error("[OrderEdit] loadCustomerOptions failed:", err);
    }
  };

  const loadMoreCustomers = async () => {
    if (customerLoadingMore) return;
    if (customerOptions.length >= customerTotal) return;
    setCustomerLoadingMore(true);
    await loadCustomerOptions(customerQuery, true);
    setCustomerLoadingMore(false);
  };

  const loadEmployeeOptions = async () => {
    try {
      const r = await request(`/employees`);
      if (!r.ok) return;
      const result = await r.json();
      const all = Array.isArray(result) ? result : result.rows || [];
      const sales = all.filter((e) => (e.department || "").toLowerCase() === "sales");
      const currentName = safeRecord.employee;
      const current = all.find((e) => e.fullName === currentName);
      const keepCurrent = current && !sales.some((s) => s.id === current.id);
      setEmployeeOptions(keepCurrent ? [...sales, current] : sales);
    } catch (err) {
      console.error("[OrderEdit] loadEmployeeOptions failed:", err);
    }
  };

  const loadItems = async () => {
    try {
      const r = await request(`/items`);
      if (!r.ok) return;
      const result = await r.json();
      setItemsCatalog(Array.isArray(result) ? result : result.rows || []);
    } catch (err) {
      console.error("[OrderEdit] loadItems failed:", err);
    }
  };

  useEffect(() => {
    Promise.all([loadCustomerOptions(), loadEmployeeOptions(), loadItems()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAmount = form.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "productName" || field === "qty") {
      const item = itemsCatalog.find(x => x.name === value);
      const unitPrice = field === "productName" ? (item?.price || 0) : (items[index].unitPrice || 0);
      const qty = field === "qty" ? Math.max(1, Number(value)) : (items[index].qty || 1);
      items[index].unitPrice = unitPrice;
      items[index].amount = unitPrice * qty;
    }
    setForm({ ...form, items });
  };

  const addItemRow = () => setForm({ ...form, items: [...form.items, { productName: "", unitPrice: 0, qty: 1, amount: 0 }] });
  const removeItemRow = (index) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, i) => i !== index) }); };

  const updateAddressField = (field, value) => {
    // Functional update so React's batched calls from LocationFields
    // (state → city clear) compose on the latest form state.
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Clear city when state changes
      if (field === 'state') {
        updated.city = '';
      }
      const parts = [updated.houseNo, updated.locality, updated.city, updated.state, updated.pincode].filter(Boolean);
      updated.address = parts.join(", ");
      return updated;
    });
  };

  const handleCustomerChange = (id) => {
    const customer = customerRows.find((x) => x.id === Number(id))
      || customersList.find((x) => x.id === Number(id));
    if (customer) {
      setForm((prev) => ({
        ...prev,
        customerId: id,
        customerName: customer.name || "",
        phoneNumber: customer.phone || "",
        city: customer.city || "",
        state: customer.state || "",
        address: customer.address || "",
        pincode: "",
        alternatePhone: "",
        houseNo: "",
        locality: "",
      }));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const product = form.items.filter(i => i.productName).map(i => `${i.productName} x ${i.qty}`).join(', ');
    const amount = form.items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const payload = {
      title: form.title,
      customerName: form.customerName, phoneNumber: form.phoneNumber, alternatePhone: form.alternatePhone,
      houseNo: form.houseNo, locality: form.locality, city: form.city, state: form.state, address: form.address, pincode: form.pincode,
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      items: form.items.filter(i => i.productName).map(i => ({ itemName: i.productName, qty: Number(i.qty), amount: Number(i.amount) })),
      product, amount, status: form.status || 'Pending', notes: form.notes,
    };
    const r = await request(`/orders/${recordId}`, { method: "PUT", body: JSON.stringify(payload) });
    setSaving(false);
    if (r.ok) { onComplete(); } else { alert((await r.json()).message); }
  };

  return (
    <>
      {loading && (
        <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
          <div className="spinner" />
          <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading order data…</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Order Edit</h1>
          </div>
        </div>
      </div>
      <form className="form card" onSubmit={save}>
        {/* <h2>Order Edit</h2> */}

<SearchSelect
            label="Customer"
            required
            value={form.customerId}
            options={customerOptions}
            onChange={handleCustomerChange}
            onSearch={(query) => {
              setCustomerQuery(query);
              setCustomerOffset(0);
              loadCustomerOptions(query, false);
            }}
            onLoadMore={loadMoreCustomers}
            hasMore={customerOptions.length < customerTotal}
            loadingMore={customerLoadingMore}
            placeholder="Select customer"
            searchPlaceholder="Search customer"
          />

<label>Title <span className="required-marker">*</span>
          <select required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ width: "100%", padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.title ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
            <option value="">Select title</option>
            {TITLE_OPTIONS.map((x) => (<option key={x.value} value={x.value}>{x.label}</option>))}
          </select>
        </label>

<label>Employee <span className="required-marker">*</span>
            <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} style={{ color: form.employeeId ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              <option value="">Select employee</option>
              {employeeOptions.map((x) => (<option key={x.id} value={x.id}>{x.fullName}</option>))}
            </select>
          </label>

        <label>Phone number <span className="required-marker">*</span>
          <input type="tel" inputMode="numeric" pattern="[0-9]{10}" title="Enter exactly 10 digits." required maxLength={10} value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/[^0-9]/g, "") })} placeholder="e.g. 9876543210" />
        </label>

        <label>Alternate phone
          <input type="tel" inputMode="numeric" pattern="[0-9]{10}" title="Enter exactly 10 digits." maxLength={10} value={form.alternatePhone}
            onChange={(e) => setForm({ ...form, alternatePhone: e.target.value.replace(/[^0-9]/g, "") })} placeholder="e.g. 9876543211" />
        </label>

        <label>House No.
          <input value={form.houseNo} onChange={(e) => updateAddressField("houseNo", e.target.value)} placeholder="e.g. 12A" />
        </label>

        <label>Locality
          <input value={form.locality} onChange={(e) => updateAddressField("locality", e.target.value)} placeholder="e.g. Gulmohar Lane" />
        </label>

        <LocationFields
          state={form.state}
          city={form.city}
          onStateChange={(value) => updateAddressField("state", value)}
          onCityChange={(value) => updateAddressField("city", value)}
        />

        <label style={{ gridColumn: "1 / -1" }}>Pincode <span className="required-marker">*</span>
          <input type="text" required maxLength={6} value={form.pincode}
            onChange={(e) => updateAddressField("pincode", e.target.value.replace(/[^0-9]/g, ""))} placeholder="e.g. 110001" />
        </label>

        <label style={{ gridColumn: "1 / -1" }}>Address
          <textarea value={form.address} rows={2} readOnly
style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, font: "inherit", background: "var(--color-surface, #f8fafc)", color: "var(--color-text-primary, #0f172a)", boxSizing: "border-box", resize: "none" }} />
        </label>

        <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
<strong style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary, #475569)" }}>Items</strong>
          {form.items.map((item, index) => (
            <div key={index} style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
 <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary, #475569)", display: "block", marginBottom: 4 }}>Item <span className="required-marker">*</span></label>
                 <select required value={item.productName} onChange={(e) => updateItem(index, "productName", e.target.value)}
                   style={{ width: "100%", padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: item.productName ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
                  <option value="">Select item</option>
                  {itemsCatalog.map((x) => (<option key={x.id} value={x.name}>{x.name}</option>))}
                </select>
              </div>
              <div style={{ width: 80 }}>
<label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary, #475569)", display: "block", marginBottom: 4 }}>Qty</label>
              <input type="number" value={item.qty} min={1}
                onChange={(e) => updateItem(index, "qty", Math.max(1, Number(e.target.value)))}
                style={{ width: "100%", padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", font: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ width: 110 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary, #475569)", display: "block", marginBottom: 4 }}>Amount</label>
              <input type="number" value={item.amount} min={0} step="0.01"
                onChange={(e) => updateItem(index, "amount", Number(e.target.value))}
                style={{ width: "100%", padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", font: "inherit", boxSizing: "border-box" }} />
              </div>
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItemRow(index)}
                  style={{ border: 0, background: "#fee2e2", color: "#b91c1c", borderRadius: 5, padding: "9px 12px", cursor: "pointer", fontWeight: 700 }}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItemRow}
            style={{ marginTop: 8, border: 0, background: "#f1f5f9", color: "#2563eb", borderRadius: 5, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            + Add More Item
          </button>
        </div>

        <label style={{ gridColumn: "1 / -1" }}>Total amount
          <input type="text" readOnly className="total-amount"
            value={formatCurrency(totalAmount)}
            style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, font: "inherit", fontWeight: 700, fontSize: 16, background: "var(--color-surface, #f8fafc)", boxSizing: "border-box" }} />
        </label>

        <label>Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={"badge " + (form.status || "pending").toLowerCase()} style={{ color: form.status ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
            {["Pending", "Processing", "Completed", "Cancelled"].map((s) => (<option key={s}>{s}</option>))}
          </select>
        </label>

        <label style={{ gridColumn: "1 / -1" }}>Notes
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, font: "inherit", background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", resize: "vertical", boxSizing: "border-box" }} />
        </label>

        <div className="form-actions">
          <button type="button" className="delete" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </>
  );
}

export default OrderEdit;

