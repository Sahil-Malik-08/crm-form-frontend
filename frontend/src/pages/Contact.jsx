import { useMemo, useState, useEffect } from "react";
import { Search, Eye, Pencil, Trash2, ArrowLeft, SearchX } from "lucide-react";
import { request, toTitleCase } from "../config";
import Field from "../components/Field";
import FilterPanel from "../components/FilterPanel";
import { formatDate } from "../utils/dateTime";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function Contact({ add, setAdd, setRecord, remove, record, load }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", phone: "", email: "" });
  const [localSearch, setLocalSearch] = useState("");
  const [sortKey, setSortKey] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const columns = [
    { key: "fullName", label: "Name", width: 180 },
    { key: "phoneNumber", label: "Phone Number", width: 160 },
    { key: "email", label: "Email", width: 220 },
    { key: "gender", label: "Gender", width: 120 },
    { key: "address", label: "Address", width: 260 },
    { key: "birthday", label: "Birthday", width: 120 },
  ];

  const alignStyle = { textAlign: "center" };
  const headerStyle = { ...alignStyle, background: "var(--color-surface)" };
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0) + 90;
  const sortableKeys = columns.filter((col) => col.key !== "actions").map((col) => col.key);

  const renderSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const handleHeaderClick = (key) => {
    handleSort(key);
  };

  const fetchPage = async (pageNum = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String((pageNum - 1) * pageSize) });
      if (nextFilters.name) params.set('name', nextFilters.name);
      if (nextFilters.phone) params.set('phone', nextFilters.phone);
      if (nextFilters.email) params.set('email', nextFilters.email);
      if (sortKey) params.set('sortBy', sortKey);
      if (sortDir) params.set('sortDir', sortDir);
      const r = await request(`/contacts?${params.toString()}`);
      if (r.ok) {
        const result = await r.json();
        const list = Array.isArray(result) ? result : result.rows || [];
        const total = Array.isArray(result) ? list.length : result.total || 0;
        setRows(list);
        setTotal(total);
        setCurrentPage(pageNum);
      }
    } catch (error) {
      console.error('[Contact] Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(currentPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortKey, sortDir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.name, filters.phone, filters.email]);

  const matchesSearch = (row) => !localSearch || localSearch.trim().length < 3 || (String(row.fullName || "") + " " + String(row.phoneNumber || "") + " " + String(row.email || "")).toLowerCase().includes(localSearch.toLowerCase());
  const filteredRows = useMemo(() => (rows || []).filter((row) =>
    matchesSearch(row) &&
    (!filters.name || row.fullName.toLowerCase().includes(filters.name.toLowerCase())) &&
    (!filters.phone || row.phoneNumber.includes(filters.phone)) &&
    (!filters.email || row.email.toLowerCase().includes(filters.email.toLowerCase()))
  ), [rows, filters, matchesSearch]);
  const activeCount = [filters.name, filters.phone, filters.email].filter(Boolean).length;

  const applyFilters = (nextFilters) => {
    setFilters({ ...nextFilters });
    fetchPage(1, { ...nextFilters });
  };

  const handleReset = () => {
    setFilters({ name: "", phone: "", email: "" });
    setSortKey("fullName");
    setSortDir("asc");
  };

  const handleSort = (key) => {
    setSortKey((prev) => {
      const nextDir = prev === key && sortDir === "asc" ? "desc" : "asc";
      setSortDir(nextDir);
      setCurrentPage(1);
      return key;
    });
  };

  if (record?.mode === "view") {
    return <ContactView record={record} onBack={() => setRecord(null)} onEdit={(r) => setRecord({ ...r, mode: "edit" })} />;
  }
  if (record?.mode === "edit") {
    return <ContactEdit record={record} onBack={() => setRecord({ ...record, mode: "view" })} onComplete={() => { setRecord(null); fetchPage(1); }} />;
  }

  return (
    <>
      {add && <ContactAdd complete={() => { setAdd(false); fetchPage(1); }} />}
      {!add && (
        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => window.history.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Contacts</h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="search-bar" style={{ width: 320, margin: 0 }}>
                <Search size={16} className="text-slate-400" />
                <input placeholder="Search contact..." value={localSearch} onChange={(e) => { const q = e.target.value; setLocalSearch(q); const nextFilters = { ...filters, name: q }; setFilters(nextFilters); if (q.trim().length >= 3 || q.trim().length === 0) fetchPage(1, nextFilters); }} />
              </div>
              <button className="primary" onClick={() => setAdd(!add)}>＋ Add</button>
            </div>
          </div>
          <FilterPanel
            fields={[
              { key: "name", label: "Contact Name", type: "search-select", placeholder: "Top contacts", searchPlaceholder: "Search all contacts...", icon: Search, options: [], onSearch: (query) => applyFilters({ ...filters, name: query }) },
              { key: "phone", label: "Phone", type: "text", placeholder: "Search phone...", icon: Search },
              { key: "email", label: "Email", type: "text", placeholder: "Search email...", icon: Search },
            ]}
            filters={filters}
            onApply={applyFilters}
            onReset={handleReset}
            activeCount={activeCount}
            style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
          >
            {loading ? (
              <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
                <div className="spinner" />
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading contacts...</div>
              </div>
            ) : filteredRows.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <div style={{ overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0 }}>
                  <div style={{ minWidth: tableWidth, display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
                    <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", flexShrink: 0 }}>
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col.key} style={{ ...headerStyle, width: col.width, cursor: "pointer", userSelect: "none" }} onClick={() => handleHeaderClick(col.key)}>
                              {col.label}
                              {sortableKeys.includes(col.key) ? <span style={{ marginLeft: 4, fontSize: 10 }}>{renderSortIcon(col.key) || " ⇅"}</span> : null}
                            </th>
                          ))}
                          <th style={{ ...headerStyle, width: 90 }}>Actions</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="table-container" style={{ overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
                      <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                        <tbody>
                          {filteredRows.map((row) => (
                            <tr key={row.id} onClick={() => setRecord({ ...row, mode: "view" })} tabIndex={0} style={{ cursor: "pointer" }}>
                              {columns.map((col) => (
                                <td key={col.key} style={{ ...alignStyle, width: col.width }}>{col.key === "fullName" ? toTitleCase(row[col.key] || "—") : (col.key === "birthday" && row[col.key] ? formatDate(row[col.key]) : row[col.key] || "—")}</td>
                              ))}
                              <td style={{ ...alignStyle, width: 90 }}>
                                <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                                  <button className="row-action-btn view" onClick={(event) => { event.stopPropagation(); setRecord({ ...row, mode: "view" }); }}><Eye size={14} /></button>
                                  <button className="row-action-btn edit" onClick={(event) => { event.stopPropagation(); setRecord({ ...row, mode: "edit" }); }}><Pencil size={14} /></button>
                                  <button className="row-action-btn delete" onClick={(event) => { event.stopPropagation(); remove(row.id); }}><Trash2 size={14} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="pagination-controls data-table-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 0", marginTop: 8, borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Per Page</span>
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                        {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Page {totalPages}</span>
                    <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Contact {total}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button className="primary" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} style={{ opacity: safeCurrentPage <= 1 ? 0.5 : 1 }}>Previous</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Page</span>
                      <select value={safeCurrentPage} onChange={(e) => { const p = Number(e.target.value); if (p >= 1 && p <= totalPages) setCurrentPage(p); }} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <button className="primary" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={{ opacity: safeCurrentPage >= totalPages ? 0.5 : 1 }}>Next</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-results">
                <SearchX size={64} />
                <h3>No contacts found</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </FilterPanel>
        </div>
      )}
    </>
  );
}

function ContactAdd({ complete }) {
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gender: "",
    address: "",
    birthday: "",
    notes: "",
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
    const body = {
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      gender: form.gender || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      birthday: form.birthday || null,
    };
    const r = await request("/contacts", { method: "POST", body: JSON.stringify(body) });
    setSaving(false);
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      setError(data.message || "Failed to save contact.");
      return;
    }
    complete();
  };

  return (
    <form className="form card" onSubmit={save} style={{ marginBottom: 16 }}>
      <h2>New Contact</h2>
      {error && <p style={{ gridColumn: "1 / -1", margin: "0 0 10px", color: "#b91c1c", fontSize: 13 }}>{error}</p>}
      <label style={{ gridColumn: "span 2" }}>Full Name <span className="required-marker">*</span>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      </label>
      <label>Phone Number <span className="required-marker">*</span>
        <input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/[^0-9]/g, "") })} />
      </label>
      <label>Email Address
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>Gender
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.gender ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>Birthday
        <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
      </label>
      <label style={{ gridColumn: "span 2" }}>Address
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </label>
      <label style={{ gridColumn: "span 2" }}>Notes
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </label>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save Contact"}</button>
      </div>
    </form>
  );
}

function ContactView({ record, onBack, onEdit }) {
  const safeRecord = record || {};
  const fields = [
    ["fullName", "Name"],
    ["phoneNumber", "Phone Number"],
    ["email", "Email"],
    ["gender", "Gender"],
    ["address", "Address"],
    ["birthday", "Birthday"],
    ["notes", "Notes"],
  ];

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Contact Details</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="primary" onClick={() => onEdit(record)}>Edit</button>
        </div>
      </div>
      <div className="form card">
        {/* <h2>Contact Details</h2> */}
        {fields.map(([k, label]) => {
          const raw = k === "birthday" && safeRecord[k] ? formatDate(safeRecord[k]) : safeRecord[k];
          const displayValue = k === "fullName" ? toTitleCase(raw || "—") : (raw || "—");
          return (
            <Field key={k} label={label} type="text" value={displayValue} disabled={true} change={() => {}} />
          );
        })}
      </div>
    </>
  );
}

function ContactEdit({ record, onBack, onComplete }) {
  const safeRecord = record || {};
  const [form, setForm] = useState({
    fullName: safeRecord.fullName || "",
    phoneNumber: safeRecord.phoneNumber || "",
    email: safeRecord.email || "",
    gender: safeRecord.gender || "",
    address: safeRecord.address || "",
    birthday: safeRecord.birthday || "",
    notes: safeRecord.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      fullName: form.fullName,
      phoneNumber: form.phoneNumber,
      email: form.email || null,
      gender: form.gender || null,
      address: form.address || null,
      birthday: form.birthday || null,
      notes: form.notes || null,
    };
    const id = safeRecord.id;
    if (!id) {
      alert("Missing contact id.");
      setSaving(false);
      return;
    }
    const r = await request(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(body) });
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
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Contact Edit</h1>
          </div>
        </div>
      </div>
      <form className="form card" onSubmit={save}>
        <h2>Contact Edit</h2>
        <Field label="Full Name" value={form.fullName} change={(v) => setForm({ ...form, fullName: v })} />
        <Field label="Phone Number" value={form.phoneNumber} change={(v) => setForm({ ...form, phoneNumber: v })} />
        <Field label="Email" type="email" value={form.email} change={(v) => setForm({ ...form, email: v })} />
        <label>Gender
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={{ width: "100%", marginTop: 6, padding: 9, border: "1px solid var(--color-border, #cbd5e1)", borderRadius: 7, background: "var(--color-surface-card, #fff)", color: form.gender ? "var(--color-text-primary)" : "var(--color-text-muted)", font: "inherit" }}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>Birthday
          <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>Address
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>Notes
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </label>
        <div className="form-actions">
          <button type="button" className="delete" onClick={onBack}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save "}</button>
        </div>
      </form>
    </>
  );
}

export default Contact;
export { ContactAdd, ContactView, ContactEdit };
