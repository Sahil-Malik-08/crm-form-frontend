import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { request } from "../config";
import LocationFields from "../components/LocationFields";
import SearchSelect from "../components/SearchSelect";
import { formatCurrency } from "../utils/settings";

const records = (data, key) => Array.isArray(data?.[key]) ? data[key] : data?.[key]?.rows || [];

const salesEmployees = (data) =>
  records(data, "employees").filter(
    (e) => (e.department || "").toLowerCase() === "sales",
  );

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr" },
  { value: "Ms", label: "Ms" },
  { value: "Mrs", label: "Mrs" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
];

function OrderAdd({ data, complete, onBack }) {
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerRows, setCustomerRows] = useState([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOffset, setCustomerOffset] = useState(0);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerLoadingMore, setCustomerLoadingMore] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [itemsCatalog, setItemsCatalog] = useState(Array.isArray(data?.items) ? data.items : []);
  const [form, setForm] = useState({
    title: "", customerId: "", customerName: "", phoneNumber: "", alternatePhone: "",
    houseNo: "", locality: "", city: "", state: "", address: "", pincode: "",
    employeeId: "", items: [{ itemId: "", qty: 1, amount: 0 }], notes: "", status: "Pending",
  });

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
        setCustomerOffset((prev) => prev + rows.length);
        setCustomerTotal(total);
      } else {
        setCustomerOptions(options);
        setCustomerRows(rows);
        setCustomerOffset(rows.length);
        setCustomerTotal(total);
      }
    } catch (err) {
      console.error("[OrderAdd] loadCustomerOptions failed:", err);
    }
  };

  const loadEmployeeOptions = async () => {
    try {
      const r = await request(`/employees`);
      if (!r.ok) return;
      const result = await r.json();
      const all = Array.isArray(result) ? result : result.rows || [];
      const sales = all.filter((e) => (e.department || "").toLowerCase() === "sales");
      setEmployeeOptions(sales);
    } catch (err) {
      console.error("[OrderAdd] loadEmployeeOptions failed:", err);
    }
  };

  const loadItems = async () => {
    try {
      const r = await request(`/items`);
      if (!r.ok) return;
      const result = await r.json();
      setItemsCatalog(Array.isArray(result) ? result : result.rows || []);
    } catch (err) {
      console.error("[OrderAdd] loadItems failed:", err);
    }
  };

  useEffect(() => {
    loadCustomerOptions();
    loadEmployeeOptions();
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreCustomers = async () => {
    if (customerLoadingMore || customerOptions.length >= customerTotal) return;
    await loadCustomerOptions(customerQuery, true);
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === "itemId" || field === "qty") {
      const item = itemsCatalog.find((x) => x.id === Number(value));
      if (field === "itemId" && item) items[index].amount = item.price * items[index].qty;
      else if (field === "qty") {
        const selectedItem = itemsCatalog.find((x) => x.id === Number(items[index].itemId));
        if (selectedItem) items[index].amount = selectedItem.price * Number(value);
      }
    }
    setForm({ ...form, items });
  };

  const addItemRow = () => setForm({ ...form, items: [...form.items, { itemId: "", qty: 1, amount: 0 }] });
  const removeItemRow = (index) => { if (form.items.length > 1) setForm({ ...form, items: form.items.filter((_, i) => i !== index) }); };
  const totalAmount = form.items.reduce((sum, item) => sum + Number(item.amount), 0);

  const updateAddressField = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'state') {
        updated.city = '';
        updated.pincode = '';
      }
      const parts = [updated.houseNo, updated.locality, updated.city, updated.state, updated.pincode].filter(Boolean);
      updated.address = parts.join(", ");
      return updated;
    });
  };

  const handleCustomerChange = (id) => {
    const customer = customerRows.find((x) => x.id === Number(id))
      || (Array.isArray(data?.customers) ? data.customers.find((x) => x.id === Number(id)) : null);
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
    if (!/^\d{10}$/.test(form.phoneNumber)) { alert("Phone number must contain exactly 10 digits."); return; }
    if (form.alternatePhone && !/^\d{10}$/.test(form.alternatePhone)) { alert("Alternate phone number must contain exactly 10 digits."); return; }
    if (!/^\d{6}$/.test(form.pincode)) { alert("Pincode must contain exactly 6 digits."); return; }

    if (form.items.some(item => item.itemId)) {
      const validItems = form.items.filter(i => i.itemId);
      for (const item of validItems) {
        const body = { title: form.title, customerId: Number(form.customerId), employeeId: Number(form.employeeId), itemId: Number(item.itemId), quantity: Number(item.qty), status: form.status };
        const r = await request("/orders", { method: "POST", body: JSON.stringify(body) });
        if (!r.ok) { alert((await r.json()).message); return; }
      }
    } else {
      const body = { title: form.title, customerId: Number(form.customerId), employeeId: Number(form.employeeId), itemId: 1, quantity: 1, status: form.status };
      const r = await request("/orders", { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) { alert((await r.json()).message); return; }
    }
    complete();
  };

  return (
    <form className="form card" onSubmit={save}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between", gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>New Order</h1>
          </div>
        </div>
      </div>
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

<label>Assign employee <span className="required-marker">*</span>
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
          style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, font: "inherit", background: "var(--color-surface, #f8fafc)", color: "var(--color-text-primary, #0f172a)", boxSizing: "border-box" }} />
      </label>

      <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
          <strong style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary, #475569)" }}>Items</strong>
        {form.items.map((item, index) => (
          <div key={index} style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary, #475569)", display: "block", marginBottom: 4 }}>Item <span className="required-marker">*</span></label>
              <select required value={item.itemId} onChange={(e) => updateItem(index, "itemId", e.target.value)}
                style={{ width: "100%", padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: item.itemId ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
                <option value="">Select item</option>
                {itemsCatalog.map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}
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

      <label style={{ gridColumn: "1 / -1" }}>Notes
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, font: "inherit", background: "var(--color-surface-card, #fff)", color: "var(--color-text-primary, #0f172a)", resize: "vertical", boxSizing: "border-box" }} />
      </label>

      <button className="primary" style={{ gridColumn: "1 / -1", justifySelf: "end" }}>Add Order</button>
    </form>
  );
}

export default OrderAdd;