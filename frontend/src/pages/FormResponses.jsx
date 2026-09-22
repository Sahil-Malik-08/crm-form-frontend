import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Briefcase, ClipboardList, Eye, Lock, Search, SearchX, UserRound } from "lucide-react";
import { FilterPanel } from "../components";
import FormResponseDetail from "../components/FormResponseDetail";
import { responseColumns, toResponseRows } from "../components/responseTable";
import { fetchForms, isAdminUser, setResponseStatus } from "../utils/employeeForms";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const EMPTY_FILTERS = { form: [], employee: [], status: "" };
const COLUMN_WIDTH = 170;
const ACTIONS_WIDTH = 90;

const selectStyle = {
  padding: "4px 8px",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: 6,
  background: "var(--color-surface-card, #fff)",
  fontSize: 13,
  color: "var(--color-text-primary, #0f172a)",
};
const mutedText = { fontSize: 13, color: "var(--color-text-muted)" };

const toOptions = (values) => [...new Set(values.filter(Boolean))].sort().map((value) => ({ value, label: value }));

function FormResponses({ auth }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "submitted", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const currentUser = auth?.user || {};
  const isAdmin = isAdminUser(currentUser);

  const load = useCallback(
    () => fetchForms().then((list) => { setForms(list); setError(null); }).catch((err) => setError(err.message)).finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const rows = useMemo(() => toResponseRows(forms), [forms]);
  const columns = useMemo(() => responseColumns(), []);

  const fields = useMemo(() => [
    { key: "form", label: "Form", type: "multi-select", placeholder: "All forms", icon: ClipboardList, options: toOptions(rows.map((row) => row.formTitle)) },
    { key: "employee", label: "Employee", type: "multi-select", placeholder: "All employees", icon: UserRound, options: toOptions(rows.map((row) => row.employee)) },
    {
      key: "status", label: "Status", icon: Briefcase, placeholder: "All statuses",
      options: [{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }],
    },
  ], [rows]);

  const activeCount = [filters.form.length, filters.employee.length, filters.status].filter(Boolean).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(
      (row) =>
        (!filters.form.length || filters.form.includes(row.formTitle)) &&
        (!filters.employee.length || filters.employee.includes(row.employee)) &&
        (!filters.status || row.status === filters.status) &&
        (!q || columns.some((col) => String(col.value(row) ?? "").toLowerCase().includes(q))),
    );
    const sortCol = columns.find((col) => col.key === sort.key);
    if (!sortCol) return list;
    const direction = sort.dir === "asc" ? 1 : -1;
    const sortValue = sortCol.sortValue || ((row) => String(sortCol.value(row) ?? "").toLowerCase());
    return [...list].sort((a, b) => (sortValue(a) > sortValue(b) ? 1 : sortValue(a) < sortValue(b) ? -1 : 0) * direction);
  }, [rows, columns, filters, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const applyFilters = (next) => { setFilters({ ...EMPTY_FILTERS, ...next }); setPage(1); };
  const resetFilters = () => { setFilters(EMPTY_FILTERS); setSort({ key: "submitted", dir: "desc" }); setPage(1); };
  const toggleSort = (key) => { setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" })); setPage(1); };
  const sortIcon = (key) => (sort.key !== key ? " ⇅" : sort.dir === "asc" ? " ▲" : " ▼");

  // Only the approver named on a form may change the status of its responses (enforced by the API too).
  const canReview = (form) => form.approvedBy !== null && Number(form.approvedBy) === Number(currentUser.id);

  const changeStatus = async (row, status) => {
    try {
      await setResponseStatus(row.id, status);
      await load();
      setViewing((prev) => (prev && prev.id === row.id ? { ...prev, response: { ...prev.response, status } } : prev));
    } catch (err) {
      setError(err.message);
    }
  };

  const reviewButton = (row) =>
    canReview(row.form) ? (
      <button type="button" className={row.response.status === "approved" ? "ef-btn-secondary" : "primary"} onClick={() => changeStatus(row, row.response.status === "approved" ? "pending" : "approved")}>
        {row.response.status === "approved" ? "Mark as pending" : "Approve"}
      </button>
    ) : null;

  if (!isAdmin) {
    return (
      <div className="card fb-empty">
        <Lock size={28} />
        <h3>Admin access required</h3>
        <p>Only administrators can view all form responses.</p>
      </div>
    );
  }

  if (viewing) {
    return <FormResponseDetail form={viewing.form} response={viewing.response} onBack={() => setViewing(null)} actions={reviewButton(viewing)} />;
  }

  const headerStyle = { textAlign: "center", background: "var(--color-surface)", cursor: "pointer", userSelect: "none", width: COLUMN_WIDTH };
  const tableWidth = columns.length * COLUMN_WIDTH + ACTIONS_WIDTH;

  return (
    <div className="card form-responses-card" style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.history.back()} aria-label="Back" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Form Responses</h1>
        </div>
        <div className="search-bar" style={{ width: 320, margin: 0 }}>
          <Search size={16} className="text-slate-400" />
          <input placeholder="Search response..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        </div>
      </div>

      <FilterPanel fields={fields} filters={filters} onApply={applyFilters} onReset={resetFilters} activeCount={activeCount} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {loading ? (
          <div style={{ display: "grid", placeItems: "center", minHeight: 200, gap: 10 }}>
            <div className="spinner" />
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading responses...</div>
          </div>
        ) : error ? (
          <div className="fb-notice error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="no-results">
            <SearchX size={64} />
            <h3>{rows.length === 0 ? "No responses yet" : "No responses found"}</h3>
            <p>{rows.length === 0 ? "Filled-in forms from employees will be listed here." : "Try adjusting your search or filter criteria."}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div style={{ overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0 }}>
              <div style={{ minWidth: tableWidth, display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
                <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", flexShrink: 0 }}>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} style={headerStyle} onClick={() => toggleSort(col.key)}>
                          {col.label}
                          <span style={{ marginLeft: 4, fontSize: 10 }}>{sortIcon(col.key)}</span>
                        </th>
                      ))}
                      <th style={{ ...headerStyle, width: ACTIONS_WIDTH, cursor: "default" }}>Actions</th>
                    </tr>
                  </thead>
                </table>
                <div className="table-container" style={{ overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
                  <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                    <tbody>
                      {visible.map((row) => (
                        <tr key={row.id} onClick={() => setViewing(row)} style={{ cursor: "pointer" }}>
                          {columns.map((col) => (
                            <td key={col.key} style={{ textAlign: "center", width: COLUMN_WIDTH }}>{col.render ? col.render(row) : col.value(row) || "—"}</td>
                          ))}
                          <td style={{ textAlign: "center", width: ACTIONS_WIDTH }}>
                            <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                              <button className="row-action-btn view" aria-label="View response" onClick={(event) => { event.stopPropagation(); setViewing(row); }}><Eye size={14} /></button>
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
                  <span style={mutedText}>Per Page</span>
                  <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} style={selectStyle}>
                    {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
                <span style={mutedText}>Total Page {totalPages}</span>
                <span style={mutedText}>Total Responses {filtered.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="primary" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ opacity: safePage <= 1 ? 0.5 : 1 }}>Previous</button>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={mutedText}>Page</span>
                  <select value={safePage} onChange={(event) => setPage(Number(event.target.value))} style={selectStyle}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button className="primary" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ opacity: safePage >= totalPages ? 0.5 : 1 }}>Next</button>
              </div>
            </div>
          </div>
        )}
      </FilterPanel>
    </div>
  );
}

export default FormResponses;
