import { useState, useRef, useEffect } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { request, toTitleCase } from "../config";
import { formatCurrency } from "../utils/settings";

function Order({ rows, total, load, onView, onEdit, onDelete, pageSize, pageSizeOptions, totalPages, safeCurrentPage, onPageSizeChange, onJumpToPage, onPrevPage, onNextPage, sortKey, sortDir, onSort, onOrdersTableScroll }) {
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const handleScroll = () => onOrdersTableScroll?.(el.scrollTop > 0);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [onOrdersTableScroll]);

  const confirm = async () => {
    setSaving(true);
    const response = await request(`/orders/${pending.order.id}`, {
      method: "PUT",
      body: JSON.stringify({ status: pending.status }),
    });
    setSaving(false);
    if (response.ok) {
      setPending(null);
      load?.();
    } else {
      alert((await response.json()).message);
    }
  };

  const columns = [
    { key: "id", label: "Order ID", width: 90 },
    { key: "customer", label: "Customer", width: 160 },
    { key: "state", label: "State", width: 120 },
    { key: "city", label: "City", width: 130 },
    { key: "date", label: "Date", width: 110 },
    { key: "employee", label: "Assigned employee", width: 200 },
    { key: "status", label: "Status", width: 150 },
    { key: "amount", label: "Amount", width: 130 },
    ...(onView || onEdit ? [{ key: "actions", label: "Actions", width: 110 }] : []),
  ];

  const alignStyle = { textAlign: "center" };
  const headerStyle = { ...alignStyle, background: "var(--color-surface)" };
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const sortableKeys = columns.filter((col) => col.key !== "actions" && col.key !== "status").map((col) => col.key);

  const renderSortIcon = (key) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const handleHeaderClick = (key) => {
    if (key === "actions" || key === "status") return;
    onSort?.(key);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={{ overflowX: "auto", overflowY: "hidden", flex: 1, minHeight: 0 }}>
          <div style={{ minWidth: tableWidth, display: "grid", gridTemplateRows: "auto 1fr", height: "100%" }}>
            <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", flexShrink: 0 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                     <th
                       key={col.key}
                       style={{ ...headerStyle, width: col.width, cursor: col.key === "actions" || col.key === "status" ? "default" : "pointer", userSelect: "none" }}
                       onClick={() => handleHeaderClick(col.key)}
                     >
                      {col.label}
                      {sortableKeys.includes(col.key) ? <span style={{ marginLeft: 4, fontSize: 10 }}>{renderSortIcon(col.key) || " ⇅"}</span> : null}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
            <div ref={tableContainerRef} className="table-container" style={{ overflowY: "auto", overflowX: "hidden", minHeight: 0 }}>
              <table className="modern-table" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                <tbody>
                  {(rows || []).map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => onView?.(order)}
                      onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && onView) {
                          event.preventDefault();
                          onView(order);
                        }
                      }}
                      tabIndex={onView ? 0 : -1}
                      style={{ cursor: onView ? "pointer" : "default" }}
                    >
                      <td style={{ ...alignStyle, width: 90 }}>#{order.id}</td>
                      <td style={{ ...alignStyle, width: 160 }}>{toTitleCase(order.customer || "—")}</td>
                      <td style={{ ...alignStyle, width: 120 }}>{order.state || "—"}</td>
                      <td style={{ ...alignStyle, width: 130 }}>{order.city || "—"}</td>
                      <td style={{ ...alignStyle, width: 110 }}>{order.date || "—"}</td>
                      <td style={{ ...alignStyle, width: 200 }} title={order.employee}>{toTitleCase(order.employee || "—")}</td>
                      <td style={{ ...alignStyle, width: 150 }}>
                        {load ? (
                          <select className={`status-badge ${order.status.toLowerCase()}`} value={order.status}
                            style={{ margin: "0 auto", appearance: "auto", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", cursor: "pointer", color: "inherit", letterSpacing: "0.3px" }}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => event.target.value !== order.status && setPending({ order, status: event.target.value })}>
                            {["Pending", "Processing", "Completed", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
                          </select>
                        ) : <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>}
                      </td>
                      <td style={{ ...alignStyle, width: 130 }}>{formatCurrency(order.amount)}</td>
                      {(onView || onEdit) && (
                        <td style={{ ...alignStyle, width: 110 }}>
                          <div className="row-actions" style={{ justifyContent: "center", gap: 6 }}>
                            {onView && <button className="row-action-btn view" onClick={(event) => { event.stopPropagation(); onView(order); }}><Eye size={14} /></button>}
                            {onEdit && <button className="row-action-btn edit" onClick={(event) => { event.stopPropagation(); onEdit(order); }}><Pencil size={14} /></button>}
                            {onDelete && <button className="row-action-btn delete" onClick={(event) => { event.stopPropagation(); onDelete(order.id); }}><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      )}
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
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Total Order {total}</span>
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
      {pending && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Confirm status change</h2>
            <p>Change order for <b>{pending.order.customer}</b> from <b>{pending.order.status}</b> to <b>{pending.status}</b>?</p>
            <div>
              <button onClick={() => setPending(null)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={confirm}>{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Order;
