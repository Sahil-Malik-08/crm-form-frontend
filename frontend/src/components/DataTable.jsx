import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const selectStyle = {
  padding: "4px 8px",
  border: "1px solid var(--color-border, #e2e8f0)",
  borderRadius: 6,
  background: "var(--color-surface-card, #fff)",
  fontSize: 13,
  color: "var(--color-text-primary, #0f172a)",
};

// Users-style list: title, search, optional status filter, sortable columns and pagination.
// columns: [{ key, label, value(row) -> text used for search/sort, sortValue?(row), render?(row) }]
function DataTable({
  title,
  columns,
  rows,
  noun = "record",
  searchPlaceholder = "Search...",
  statusFilter = false,
  onRowClick,
  renderActions,
  actionsLabel = "Actions",
  emptyTitle = "Nothing to show",
  emptyText = "Try adjusting your search or filter criteria.",
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(
      (row) =>
        (status === "all" || row.status === status) &&
        (!q || columns.some((col) => String(col.value(row) ?? "").toLowerCase().includes(q))),
    );
    const sortCol = columns.find((col) => col.key === sort.key);
    if (!sortCol) return list;
    const direction = sort.dir === "asc" ? 1 : -1;
    const sortValue = sortCol.sortValue || ((row) => String(sortCol.value(row) ?? "").toLowerCase());
    return [...list].sort((a, b) => (sortValue(a) > sortValue(b) ? 1 : sortValue(a) < sortValue(b) ? -1 : 0) * direction);
  }, [rows, columns, query, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key) => {
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
    setPage(1);
  };

  const sortIcon = (key) => (sort.key !== key ? " ⇅" : sort.dir === "asc" ? " ▲" : " ▼");
  const cell = { textAlign: "center" };
  const head = { ...cell, background: "var(--color-surface)", cursor: "pointer", userSelect: "none" };

  return (
    <div className="card data-table-card" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {statusFilter && (
            <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} style={{ ...selectStyle, padding: "9px 12px", fontSize: 13 }}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          )}
          <div className="search-bar" style={{ width: 280, margin: 0 }}>
            <Search size={16} className="text-slate-400" />
            <input placeholder={searchPlaceholder} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="no-results">
          <SearchX size={64} />
          <h3>{rows.length === 0 ? emptyTitle : `No ${noun}s found`}</h3>
          <p>{rows.length === 0 ? emptyText : "Try adjusting your search or filter criteria."}</p>
        </div>
      ) : (
        <div className="data-table-shell" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div className="data-table-region" style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={head} onClick={() => toggleSort(col.key)}>
                    {col.label}
                    <span style={{ marginLeft: 4, fontSize: 10 }}>{sortIcon(col.key)}</span>
                  </th>
                ))}
                {renderActions && <th style={{ ...head, cursor: "default" }}>{actionsLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : "default" }}>
                  {columns.map((col) => (
                    <td key={col.key} style={cell}>{col.render ? col.render(row) : col.value(row) || "—"}</td>
                  ))}
                  {renderActions && (
                    <td style={cell} onClick={(event) => event.stopPropagation()}>
                      <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>{renderActions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="pagination-controls data-table-pagination" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 0", marginTop: 8, borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Per Page</span>
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} style={selectStyle}>
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Page {totalPages}</span>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total {noun}s {filtered.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="primary" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} style={{ opacity: safePage <= 1 ? 0.5 : 1 }}>Previous</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Page</span>
              <select value={safePage} onChange={(event) => setPage(Number(event.target.value))} style={selectStyle}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="primary" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} style={{ opacity: safePage >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
