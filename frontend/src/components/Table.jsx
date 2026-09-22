import { Eye, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "../utils/settings";

function Table({ page, rows, remove, onView, onEdit }) {
  const columns =
    page === "employees"
      ? ["fullName", "email", "department", "role"]
      : page === "customers"
        ? ["name", "phone", "city", "state"]
        : ["name", "sku", "price", "stock"];
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c.replace(/([A-Z])/g, " $1")}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c}>{c === "price" ? formatCurrency(row[c]) : row[c] || "—"}</td>
              ))}
              <td>
                <div className="row-actions">
                  {onView && <button className="row-action-btn view" onClick={() => onView(row)}><Eye size={14} /> View</button>}
                  {onEdit && <button className="row-action-btn edit" onClick={() => onEdit(row)}><Pencil size={14} /> Edit</button>}
                  {remove && <button className="row-action-btn delete" onClick={() => remove(row.id)}>
                    <Trash2 size={7} /> Delete
                  </button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

