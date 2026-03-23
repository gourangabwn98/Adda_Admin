// src/pages/admin/shared/OrdersTable.jsx
import { useEffect, useState } from "react";
import { PINK, STATUS_STYLE } from "./constants";
import Badge from "./Badge";
// import { updateOrderStatus } from "../../services/adminService.js";
import toast from "react-hot-toast";
import { updateOrderStatus } from "../../../services/adminService";

export default function OrdersTable({ rows: initialRows, hideAction = false }) {
  // Local state for rows — allows instant UI updates
  const [rows, setRows] = useState(initialRows);

  // Sync with parent prop changes (if parent refreshes data)
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Change order status to "${newStatus}"?`)) return;

    // Optimistic update: show new status immediately
    const originalRows = [...rows];
    setRows((prev) =>
      prev.map((row) =>
        row._id === orderId ? { ...row, status: newStatus } : row,
      ),
    );

    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order updated to ${newStatus}`);
    } catch (err) {
      // Revert on error
      setRows(originalRows);
      toast.error("Failed to update status");
      console.error("Status update failed:", err);
    }
  };

  if (!rows?.length) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#aaa" }}>
        No orders found
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            {[
              "Order ID",
              "Table No",
              "Customer",
              "Items",
              "Total",
              "Type",
              "Status",
              "Time",
              !hideAction && "Action",
            ]
              .filter(Boolean)
              .map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    fontSize: 11,
                    color: "#888",
                    borderBottom: "0.5px solid #eee",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((o, i) => (
            <tr key={i} style={{ borderBottom: "0.5px solid #f5f5f5" }}>
              <td
                style={{ padding: "11px 12px", fontWeight: 500, color: PINK }}
              >
                {o.orderId || o._id?.slice(-8)}
              </td>

              <td style={{ padding: "11px 12px", color: "#444" }}>
                {o.tableNo ? `Table ${o.tableNo}` : "—"}
              </td>

              <td style={{ padding: "11px 12px" }}>
                <div>{o.user?.name || (o.isGuest ? "Guest" : "—")}</div>
                <div style={{ fontSize: 11, color: "#bbb" }}>
                  {o.user?.phone || o.guestInfo?.phone || "—"}
                </div>
              </td>

              <td
                style={{
                  padding: "11px 12px",
                  fontSize: 12,
                  color: "#888",
                  maxWidth: 160,
                }}
              >
                {o.items?.map((i) => `${i.name} ×${i.qty}`).join(", ")}
              </td>

              <td style={{ padding: "11px 12px", fontWeight: 500 }}>
                ₹{o.total}
              </td>

              <td style={{ padding: "11px 12px", fontSize: 12 }}>
                {o.orderType}
              </td>

              <td style={{ padding: "11px 12px" }}>
                <Badge label={o.status} />
              </td>

              <td style={{ padding: "11px 12px", fontSize: 12, color: "#bbb" }}>
                {new Date(o.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>

              {!hideAction && (
                <td style={{ padding: "11px 12px" }}>
                  <select
                    onChange={(e) => handleStatusChange(o._id, e.target.value)}
                    value={o.status || ""} // controlled value
                    style={{
                      padding: "4px 8px",
                      borderRadius: 8,
                      border: "0.5px solid #ddd",
                      fontSize: 11,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>
                      Update
                    </option>
                    {[
                      "Placed",
                      "Preparing",
                      "Ready",
                      "Delivered",
                      "Completed",
                      "Cancelled",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
