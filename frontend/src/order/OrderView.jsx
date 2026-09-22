import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { request, toTitleCase } from "../config";
import { formatDateTime } from "../utils/dateTime";
import { formatCurrency } from "../utils/settings";

function OrderView({ record, onBack, onEdit }) {
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (record?.id) {
      request(`/orders/${record.id}`).then(r => r.ok && r.json()).then(data => {
        if (data) setOrderData(data);
      });
    }
  }, [record?.id]);

  if (!orderData) return <p style={{ color: "var(--color-text-muted)" }}>Loading order details…</p>;

  const o = orderData;
  const items = o.items || [];

  const getItemTotal = (item) => {
    const unitPrice = Number(item?.unitPrice ?? item?.unit_price ?? 0);
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const subtotal = Number(item?.subtotal ?? item?.amount ?? 0);
    return Number.isFinite(subtotal) && subtotal > 0 ? subtotal : unitPrice * quantity;
  };

  const grandTotal = Number.isFinite(Number(o?.amount)) && Number(o.amount) > 0
    ? Number(o.amount)
    : items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const cardStyle = {
    width: "100%",
    background: "var(--color-surface-card)",
    padding: 24,
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    marginBottom: 20,
    boxSizing: "border-box",
  };

  const sectionHeader = (color) => ({
    margin: 0,
    marginBottom: 16,
    fontSize: 17,
    color: color,
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: 8,
  });

  const labelStyle = {
    display: "block",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "var(--color-text-muted)",
    fontWeight: 600,
  };

  const valueStyle = {
    fontSize: 15,
    color: "var(--color-text-primary)",
  };

  const strongValueStyle = {
    ...valueStyle,
    fontWeight: 600,
  };

  const thStyle = {
    background: "var(--color-surface)",
    color: "var(--color-text-secondary)",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "2px solid var(--color-border)",
  };

  return (
    <div style={{ width: "100%", padding: "10px 20px", boxSizing: "border-box", paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", color: "var(--color-text-secondary)" }}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)" }}>Order Details</h2>
            {/* <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>Viewing summary for Order #{o.id}</p> */}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onEdit(record)}
            style={{
              padding: "10px 24px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit 
          </button>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <h3 style={sectionHeader("#3b82f6")}>Order Overview</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 32px" }}>
          <div>
            <span style={labelStyle}>Order ID</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>#{o.id}</span>
          </div>
          <div>
            <span style={labelStyle}>Created At</span>
            <span style={{ fontSize: 15, color: "var(--color-text-primary)" }}>{formatDateTime(o.createdAt)}</span>
          </div>
          <div>
            <span style={labelStyle}>Status</span>
            <span style={{
              display: "inline-block",
              marginTop: 2,
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              background: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
            }}>
              {o.status}
            </span>
          </div>
          <div>
            <span style={labelStyle}>Last Updated</span>
            <span style={{ fontSize: 15, color: "var(--color-text-primary)" }}>{formatDateTime(o.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <h3 style={sectionHeader("#0284c7")}>Purchased Products</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "45%" }}>Product Name</th>
                <th style={{ ...thStyle, textAlign: "right", width: "20%" }}>Price Per Piece</th>
                <th style={{ ...thStyle, textAlign: "center", width: "15%" }}>Quantity</th>
                <th style={{ ...thStyle, textAlign: "right", width: "20%" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                   <td style={{ padding: "14px 16px", fontSize: 15, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", fontWeight: 600 }}>
                     {toTitleCase(item.productName || item.product_name || "—")}
                   </td>
<td style={{ padding: "14px 16px", fontSize: 15, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", textAlign: "right" }}>
                     {formatCurrency(Number(item.unitPrice || item.unit_price || 0))}
                   </td>
                  <td style={{ padding: "14px 16px", fontSize: 15, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", textAlign: "center" }}>
                    {item.quantity || item.qty || 1}
                  </td>
<td style={{ padding: "14px 16px", fontSize: 15, color: "var(--color-text-primary)", borderBottom: "1px solid var(--color-border)", textAlign: "right", fontWeight: 600 }}>
                     {formatCurrency(getItemTotal(item))}
                   </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--color-surface)", borderTop: "2px solid var(--color-border)" }}>
                <td colSpan={3} style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, fontSize: 17, color: "var(--color-text-primary)" }}>Total Amount:</td>
                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, fontSize: 20, color: "#16a34a" }}>{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <h3 style={sectionHeader("#10b981")}>Customer &amp; Delivery Address</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 32px" }}>
          <div><span style={labelStyle}>Customer Name</span><span style={strongValueStyle}>{toTitleCase(o.customer || "—")}</span></div>
          <div><span style={labelStyle}>Phone Number</span><span style={valueStyle}>{o.phoneNumber || "—"}</span></div>
          <div><span style={labelStyle}>Alt. Phone</span><span style={valueStyle}>{o.alternatePhone || "—"}</span></div>
          <div><span style={labelStyle}>House / Flat No.</span><span style={valueStyle}>{o.houseNo || "—"}</span></div>
          <div><span style={labelStyle}>Locality</span><span style={valueStyle}>{o.locality || "—"}</span></div>
          <div><span style={labelStyle}>City / State</span><span style={valueStyle}>{o.city || "—"}, {o.state || "—"}</span></div>
          <div><span style={labelStyle}>Pincode</span><span style={strongValueStyle}>{o.pincode || "—"}</span></div>
          <div style={{ gridColumn: "1 / -1" }}><span style={labelStyle}>Full Address</span><span style={{ fontSize: 15, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{o.address || "—"}</span></div>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <h3 style={sectionHeader("#8b5cf6")}>Assigned Staff</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 32px" }}>
          <div><span style={labelStyle}>Employee Name</span><span style={strongValueStyle}>{toTitleCase(o.employee || "Unassigned")}</span></div>
          <div><span style={labelStyle}>Email Address</span><span style={valueStyle}>{o.email || "—"}</span></div>
          <div><span style={labelStyle}>Department</span><span style={valueStyle}>{o.department || "—"}</span></div>
          <div><span style={labelStyle}>Role</span><span style={valueStyle}>{o.role || "—"}</span></div>
        </div>
      </div>

      <div className="card" style={cardStyle}>
        <h3 style={sectionHeader("var(--color-text-muted)")}>Notes &amp; System Log</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 32px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Notes</span>
            <p style={{ margin: "4px 0 0", fontSize: 15, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{o.notes || "No additional notes added."}</p>
          </div>
          <div><span style={labelStyle}>Created At</span><span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{formatDateTime(o.createdAt)}</span></div>
          <div><span style={labelStyle}>Last Updated</span><span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{formatDateTime(o.updatedAt)}</span></div>
        </div>
      </div>
    </div>
  );
}

export default OrderView;

