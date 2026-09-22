import { Eye, Pencil, Trash2 } from "lucide-react";
import { toTitleCase } from "../config";

function User({ rows, onView, onEdit, onDelete, total, pageSize, pageSizeOptions, currentPage, totalPages, safeCurrentPage, onPageSizeChange, onJumpToPage, onPrevPage, onNextPage, sortKey, sortDir, onSort }) {
  const columns = [
    { key: "fullName", label: "Name", width: 180 },
    { key: "username", label: "Username", width: 160 },
    { key: "department", label: "Department", width: 160 },
    { key: "role", label: "Role", width: 160 },
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
    if (!onSort) return;
    onSort(key);
  };

  return (
    <>
      <div className="data-table-shell" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div className="data-table-region" style={{ overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0 }}>
          <div style={{ minWidth: tableWidth, display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
            <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", flexShrink: 0 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} style={{ ...headerStyle, width: col.width, cursor: onSort && col.key !== "actions" ? "pointer" : "default", userSelect: "none" }} onClick={() => handleHeaderClick(col.key)}>
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
                  {(rows || []).map((row) => (
                    <tr key={row.id} onClick={() => onView?.(row)} tabIndex={onView ? 0 : -1} style={{ cursor: onView ? "pointer" : "default" }}>
                      {columns.map((col) => (
                        <td key={col.key} style={{ ...alignStyle, width: col.width }}>{col.key === "fullName" ? toTitleCase(row[col.key] || "—") : (row[col.key] || "—")}</td>
                      ))}
                      <td style={{ ...alignStyle, width: 90 }}>
                        <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                          {onView && <button className="row-action-btn view" onClick={(event) => { event.stopPropagation(); onView(row); }}><Eye size={14} /></button>}
                          {onEdit && <button className="row-action-btn edit" onClick={(event) => { event.stopPropagation(); onEdit(row); }}><Pencil size={14} /></button>}
                          {onDelete && <button className="row-action-btn delete" onClick={(event) => { event.stopPropagation(); onDelete(row.id); }}><Trash2 size={14} /></button>}
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
              <select value={pageSize} onChange={onPageSizeChange} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                {(pageSizeOptions || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Page {totalPages}</span>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total User {total}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="primary" disabled={safeCurrentPage <= 1} onClick={onPrevPage} style={{ opacity: safeCurrentPage <= 1 ? 0.5 : 1 }}>Previous</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Page</span>
              <select value={safeCurrentPage} onChange={onJumpToPage} style={{ padding: "4px 8px", border: "1px solid var(--color-border, #e2e8f0)", borderRadius: 6, background: "var(--color-surface-card, #fff)", fontSize: 13, color: "var(--color-text-primary, #0f172a)" }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="primary" disabled={safeCurrentPage >= totalPages} onClick={onNextPage} style={{ opacity: safeCurrentPage >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default User;