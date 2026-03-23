import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllOrders,
  updateOrderStatus,
  getAllInvoices,
  updateInvoiceStatus,
} from "../../services/adminService.js";

// ── constants ─────────────────────────────────────────────────────────────────
const PINK = "#e91e8c";
const WHITE = "#fff";

const STATUS_STYLE = {
  Empty: {
    bg: "transparent",
    border: "rgba(0,0,0,.15)",
    tc: "#888780",
    label: "Free",
  },
  Placed: { bg: "#dbeeff", border: "#378ADD", tc: "#185FA5", label: "Placed" },
  Preparing: {
    bg: "#fff3e0",
    border: "#BA7517",
    tc: "#854F0B",
    label: "Preparing",
  },
  Ready: { bg: "#e6f7ee", border: "#1D9E75", tc: "#3B6D11", label: "Ready" },
  Delivered: {
    bg: "#e6f7ee",
    border: "#1D9E75",
    tc: "#3B6D11",
    label: "Delivered",
  },
  Completed: {
    bg: "#f0f0f0",
    border: "#888780",
    tc: "#5F5E5A",
    label: "Completed",
  },
  Cancelled: {
    bg: "#ffebeb",
    border: "#E24B4A",
    tc: "#A32D2D",
    label: "Cancelled",
  },
};

const TABLES_CONFIG = [
  { id: 1, seats: 4 },
  { id: 2, seats: 4 },
  { id: 3, seats: 4 },
  { id: 4, seats: 4 },
  { id: 5, seats: 2 },
  { id: 6, seats: 2 },
  { id: 7, seats: 4 },
  { id: 8, seats: 4 },
];

const ACTIVE_STATUSES = ["Placed", "Preparing", "Ready", "Delivered"];

// ── blink keyframe injected once ─────────────────────────────────────────────
if (!document.getElementById("blink-style")) {
  const s = document.createElement("style");
  s.id = "blink-style";
  s.textContent = `
    @keyframes blinkBorder {
      0%,100% { box-shadow: 0 0 0 0 rgba(211,47,47,0); border-color: #d32f2f; }
      50%      { box-shadow: 0 0 0 4px rgba(211,47,47,0.35); border-color: #ff1744; }
    }
    .blink-pending { animation: blinkBorder 1.4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── Chair ─────────────────────────────────────────────────────────────────────
const Chair = ({ pos, occupied }) => {
  const base = {
    background: occupied ? "#f9c8dc" : WHITE,
    border: `1.5px solid ${occupied ? PINK : "rgba(0,0,0,.18)"}`,
    transition: "background .2s",
    flexShrink: 0,
  };
  if (pos === "top" || pos === "bottom")
    return (
      <div
        style={{
          ...base,
          width: 20,
          height: 12,
          borderRadius: pos === "top" ? "6px 6px 0 0" : "0 0 6px 6px",
        }}
      />
    );
  return (
    <div
      style={{
        ...base,
        width: 12,
        height: 20,
        borderRadius: pos === "left" ? "6px 0 0 6px" : "0 6px 6px 0",
      }}
    />
  );
};

// ── TableCard ─────────────────────────────────────────────────────────────────
const TableCard = ({ config, order, invoice, onClick, isSelected }) => {
  const status = order ? order.status : "Empty";
  const s = STATUS_STYLE[status] || STATUS_STYLE.Empty;
  const occ = order && ACTIVE_STATUSES.includes(status);
  const is4 = config.seats === 4;
  const isPending = invoice?.invoiceStatus?.toLowerCase() === "pending";

  const w = is4 ? 80 : 66;
  const h = is4 ? 64 : 52;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        position: "relative",
      }}
    >
      {/* pending alert dot */}
      {isPending && (
        <div
          style={{
            position: "absolute",
            top: -6,
            right: -2,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#d32f2f",
            border: "2px solid #fff",
            zIndex: 2,
            animation: "blinkBorder 1s ease-in-out infinite",
          }}
        />
      )}

      {/* top chairs */}
      <div style={{ display: "flex", gap: 6 }}>
        <Chair pos="top" occupied={occ} />
        {is4 && <Chair pos="top" occupied={occ} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {is4 && <Chair pos="left" occupied={occ} />}

        <div
          onClick={onClick}
          className={isPending ? "blink-pending" : ""}
          style={{
            width: w,
            height: h,
            borderRadius: 10,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: isPending ? "#fff0f5" : s.bg,
            border: `2px solid ${isSelected ? PINK : isPending ? "#d32f2f" : s.border}`,
            transform: isSelected ? "scale(1.06)" : "scale(1)",
            boxShadow: isSelected ? `0 0 0 3px ${PINK}33` : "none",
            transition: "transform .15s",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: isPending ? "#d32f2f" : s.tc,
            }}
          >
            T{config.id}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: 0.3,
              color: isPending ? "#d32f2f" : s.tc,
            }}
          >
            {isPending ? "Pay Due" : s.label}
          </div>
          {order && ACTIVE_STATUSES.includes(status) && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isPending ? "#d32f2f" : PINK,
                marginTop: 2,
              }}
            >
              ₹{Math.round(order.total)}
            </div>
          )}
          {config.seats === 2 && !isPending && (
            <div style={{ fontSize: 9, color: "#aaa", marginTop: 1 }}>
              2 pax
            </div>
          )}
        </div>

        {is4 && <Chair pos="right" occupied={occ} />}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Chair pos="bottom" occupied={occ} />
        {is4 && <Chair pos="bottom" occupied={occ} />}
      </div>
    </div>
  );
};

// ── OrderDrawer ────────────────────────────────────────────────────────────────
const OrderDrawer = ({
  config,
  order,
  invoice,
  onClose,
  onStatusChange,
  onInvoiceStatusChange,
}) => {
  const [updating, setUpdating] = useState(false);
  const [invUpdating, setInvUpdating] = useState(false);

  const s = order
    ? STATUS_STYLE[order.status] || STATUS_STYLE.Empty
    : STATUS_STYLE.Empty;
  const subtotal =
    order?.items?.reduce((sum, i) => sum + i.price * i.qty, 0) || 0;
  const tax = Math.round(subtotal * 0.18);
  const isPending = invoice?.invoiceStatus?.toLowerCase() === "pending";

  const handleStatus = async (val) => {
    if (!val || !order) return;
    try {
      setUpdating(true);
      await onStatusChange(order._id, val);
    } finally {
      setUpdating(false);
    }
  };

  const handleInvoiceStatus = async (newStatus) => {
    if (!invoice?._id) return;
    if (!window.confirm(`Mark invoice as "${newStatus}"?`)) return;
    try {
      setInvUpdating(true);
      await onInvoiceStatusChange(invoice._id, newStatus);
    } finally {
      setInvUpdating(false);
    }
  };

  return (
    <div
      style={{
        background: WHITE,
        border: `0.5px solid ${isPending ? "#fca5a5" : "rgba(0,0,0,.1)"}`,
        borderRadius: 12,
        padding: 20,
        marginTop: 20,
        ...(isPending ? { background: "#fff8f8" } : {}),
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 500, fontSize: 15 }}>
            Table {config.id}
            <span
              style={{
                fontSize: 12,
                color: "#aaa",
                fontWeight: 400,
                marginLeft: 6,
              }}
            >
              · {config.seats} seats
            </span>
            {isPending && (
              <span
                style={{
                  marginLeft: 10,
                  background: "#ffebee",
                  color: "#c62828",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: 20,
                }}
              >
                Invoice Pending
              </span>
            )}
          </div>
          {order && (
            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
              {order.orderId} · {order.user?.name || "Guest"} ·{" "}
              {order.user?.phone || "—"}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "0.5px solid rgba(0,0,0,.15)",
            background: "#f5f5f5",
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
          }}
        >
          ✕
        </button>
      </div>

      {!order ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>○</div>
          <div style={{ fontSize: 14 }}>This table is free</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {config.seats} seats available
          </div>
        </div>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* LEFT: items + totals */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#aaa",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Order items
            </div>
            {order.items?.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "0.5px solid rgba(0,0,0,.06)",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 500,
                      color: PINK,
                    }}
                  >
                    {item.qty}
                  </div>
                  <span>{item.name}</span>
                </div>
                <span style={{ fontWeight: 500 }}>
                  ₹{item.price * item.qty}
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: "0.5px solid rgba(0,0,0,.08)",
                marginTop: 12,
                paddingTop: 12,
              }}
            >
              {[
                { l: "Subtotal", v: `₹${subtotal}` },
                { l: "GST (18%)", v: `₹${tax}` },
              ].map((r) => (
                <div
                  key={r.l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#888",
                    marginBottom: 5,
                  }}
                >
                  <span>{r.l}</span>
                  <span>{r.v}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 500,
                  fontSize: 15,
                  marginTop: 8,
                }}
              >
                <span>Total</span>
                <span style={{ color: isPending ? "#d32f2f" : PINK }}>
                  ₹{Math.round(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: badges + status + invoice actions */}
          <div>
            {/* badges */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#aaa",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Status
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  background: s.bg,
                  color: s.tc,
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {order.status}
              </span>
              <span
                style={{
                  background: "#FBEAF0",
                  color: "#993556",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                Dining
              </span>
              <span
                style={{
                  background:
                    order.paymentStatus === "Paid" ? "#EAF3DE" : "#FAEEDA",
                  color: order.paymentStatus === "Paid" ? "#3B6D11" : "#854F0B",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {order.paymentStatus}
              </span>
            </div>

            {/* order status update */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#aaa",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Update order
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              {[
                "Placed",
                "Preparing",
                "Ready",
                "Delivered",
                "Completed",
                "Cancelled",
              ]
                .filter((st) => st !== order.status)
                .map((st) => {
                  const stl = STATUS_STYLE[st] || {
                    bg: "#f0f0f0",
                    color: "#555",
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => handleStatus(st)}
                      disabled={updating}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        cursor: "pointer",
                        border: `0.5px solid ${stl.tc}`,
                        background: stl.bg,
                        color: stl.tc,
                        fontWeight: 500,
                        opacity: updating ? 0.5 : 1,
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
            </div>

            {/* invoice section */}
            {invoice && (
              <>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#aaa",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Invoice
                </div>

                {/* invoice info */}
                <div
                  style={{
                    background: isPending ? "#fff0f5" : "#f8fdf8",
                    border: `0.5px solid ${isPending ? "#fca5a5" : "#c3e6cb"}`,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: "#888" }}>Invoice ID</span>
                    <span
                      style={{ fontWeight: 500, fontSize: 11, color: "#555" }}
                    >
                      …{invoice._id?.slice(-8)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: "#888" }}>Amount</span>
                    <span style={{ fontWeight: 500 }}>
                      ₹{Math.round(invoice.total || order.total)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#888" }}>Status</span>
                    <span
                      style={{
                        background: isPending ? "#ffebee" : "#EAF3DE",
                        color: isPending ? "#c62828" : "#3B6D11",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {invoice.invoiceStatus}
                    </span>
                  </div>
                </div>

                {/* invoice action buttons — only when pending */}
                {isPending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleInvoiceStatus("completed")}
                      disabled={invUpdating}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#2e7d32",
                        color: WHITE,
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 13,
                        opacity: invUpdating ? 0.5 : 1,
                      }}
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleInvoiceStatus("cancelled")}
                      disabled={invUpdating}
                      style={{
                        flex: 1,
                        padding: "10px",
                        background: "#c62828",
                        color: WHITE,
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 13,
                        opacity: invUpdating ? 0.5 : 1,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

            {/* no invoice yet */}
            {!invoice && (
              <div
                style={{
                  background: "#f5f5f5",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: "#aaa",
                  textAlign: "center",
                }}
              >
                No invoice generated yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────
export default function TablesPage() {
  const [tableMap, setTableMap] = useState({}); // tableNo → order
  const [invoiceMap, setInvoiceMap] = useState({}); // tableNo → invoice info
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch orders + invoices in parallel
      const [ordersRes, invoicesRes] = await Promise.all([
        getAllOrders({ limit: 100 }),
        getAllInvoices().catch(() => ({ data: { invoices: [] } })), // graceful fail
      ]);

      const orders = ordersRes?.data?.orders || [];
      const invoices = invoicesRes?.data?.invoices || [];

      // Build order map: only active dining orders with tableNo
      const oMap = {};
      orders
        .filter(
          (o) =>
            o.orderType === "Dining" &&
            o.tableNo &&
            !["Completed", "Cancelled"].includes(o.status),
        )
        .forEach((o) => {
          oMap[Number(o.tableNo)] = o;
        });

      // Build invoice map: link each invoice to a table via orderId
      const iMap = {};
      invoices.forEach((inv) => {
        // inv.orders is array of order ObjectIds
        const orderIds = inv.orders?.map(String) || [];
        // Find which table this invoice belongs to
        for (const [tableNo, order] of Object.entries(oMap)) {
          if (orderIds.includes(String(order._id))) {
            iMap[Number(tableNo)] = {
              ...inv,
              invoiceStatus: inv.status || inv.paymentStatus || "pending",
            };
            break;
          }
        }
      });

      setTableMap(oMap);
      setInvoiceMap(iMap);
    } catch (e) {
      setError("Failed to load table data");
      toast.error("Could not load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Status → ${newStatus}`);
      await fetchData();
      setSelected(null);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleInvoiceStatusChange = async (invoiceId, newStatus) => {
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
      toast.success(`Invoice → ${newStatus}`);
      await fetchData();
    } catch {
      toast.error("Invoice update failed");
    }
  };

  const selectedConfig = selected
    ? TABLES_CONFIG.find((t) => t.id === selected)
    : null;
  const selectedOrder = selected ? tableMap[selected] || null : null;
  const selectedInvoice = selected ? invoiceMap[selected] || null : null;

  const occupied = TABLES_CONFIG.filter((t) => tableMap[t.id]).length;
  const revenue = Object.values(tableMap).reduce(
    (s, o) => s + Number(o.total || 0),
    0,
  );
  const covers = TABLES_CONFIG.filter((t) => tableMap[t.id]).reduce(
    (s, t) => s + t.seats,
    0,
  );
  const pendingCount = Object.values(invoiceMap).filter(
    (i) => i.invoiceStatus?.toLowerCase() === "pending",
  ).length;

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#aaa" }}>
        Loading floor plan…
      </div>
    );
  if (error)
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#c62828" }}>
        <div style={{ fontSize: 16, marginBottom: 12 }}>{error}</div>
        <button
          onClick={fetchData}
          style={{
            padding: "10px 24px",
            background: PINK,
            color: WHITE,
            border: "none",
            borderRadius: 25,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );

  return (
    <>
      {/* page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Table status</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>
            Adda Cafe — dining floor · click any table to view order
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pendingCount > 0 && (
            <span
              style={{
                background: "#ffebee",
                color: "#c62828",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                border: "0.5px solid #fca5a5",
                animation: "blinkBorder 1.4s ease-in-out infinite",
              }}
            >
              {pendingCount} invoice{pendingCount > 1 ? "s" : ""} pending
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#1D9E75",
              }}
            />
            <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 500 }}>
              Live
            </span>
            <span style={{ fontSize: 12, color: "#aaa", marginLeft: 4 }}>
              every 30s
            </span>
          </div>
        </div>
      </div>

      {/* stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,minmax(0,1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          { label: "Occupied", val: occupied, color: PINK },
          {
            label: "Free",
            val: TABLES_CONFIG.length - occupied,
            color: "#1D9E75",
          },
          {
            label: "Active revenue",
            val: `₹${Math.round(revenue).toLocaleString()}`,
          },
          { label: "Covers seated", val: covers },
          {
            label: "Invoices pending",
            val: pendingCount,
            color: pendingCount > 0 ? "#c62828" : "#3B6D11",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: WHITE,
              border: `0.5px solid ${s.color === "c62828" ? "#fca5a5" : "rgba(0,0,0,.08)"}`,
              borderRadius: 8,
              padding: "10px 14px",
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: s.color || "var(--color-text-primary,#111)",
              }}
            >
              {s.val}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* legend */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
          padding: "10px 14px",
          background: WHITE,
          borderRadius: 10,
          border: "0.5px solid rgba(0,0,0,.08)",
        }}
      >
        {[
          { label: "Free", bg: WHITE, border: "rgba(0,0,0,.2)" },
          { label: "Placed", bg: "#dbeeff", border: "#378ADD" },
          { label: "Preparing", bg: "#fff3e0", border: "#BA7517" },
          { label: "Ready", bg: "#e6f7ee", border: "#1D9E75" },
          { label: "Delivered", bg: "#e6f7ee", border: "#1D9E75" },
          { label: "Invoice pending", bg: "#fff0f5", border: "#d32f2f" },
          { label: "Occupied chair", bg: "#f9c8dc", border: PINK },
        ].map((l) => (
          <div
            key={l.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#777",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: l.bg,
                border: `1.5px solid ${l.border}`,
                ...(l.label === "Invoice pending"
                  ? { animation: "blinkBorder 1.4s ease-in-out infinite" }
                  : {}),
              }}
            />
            {l.label}
          </div>
        ))}
      </div>

      {/* floor plan */}
      <div
        style={{
          background: "var(--color-background-secondary,#f5f3ef)",
          borderRadius: 16,
          padding: 28,
          border: "0.5px solid rgba(0,0,0,.08)",
        }}
      >
        {/* wall */}
        <div
          style={{
            height: 6,
            background: "rgba(0,0,0,.18)",
            borderRadius: "4px 4px 0 0",
            marginBottom: 0,
          }}
        />

        {/* windows */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            padding: "10px 0 14px",
            borderBottom: "1px dashed rgba(0,0,0,.1)",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 20,
                borderRadius: 3,
                background: WHITE,
                border: "1.5px solid rgba(0,0,0,.2)",
                ...(i === 1 ? { marginRight: 16 } : {}),
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#aaa",
            letterSpacing: 2,
            textTransform: "uppercase",
            textAlign: "center",
            paddingTop: 10,
            paddingBottom: 16,
          }}
        >
          Window side
        </div>

        {/* tables */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            justifyContent: "center",
            paddingBottom: 24,
          }}
        >
          {TABLES_CONFIG.map((t) => (
            <TableCard
              key={t.id}
              config={t}
              order={tableMap[t.id] || null}
              invoice={invoiceMap[t.id] || null}
              onClick={() => setSelected(selected === t.id ? null : t.id)}
              isSelected={selected === t.id}
            />
          ))}
        </div>

        {/* divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            margin: "0 0 16px",
            background:
              "repeating-linear-gradient(90deg,rgba(0,0,0,.1) 0,rgba(0,0,0,.1) 8px,transparent 8px,transparent 16px)",
          }}
        />

        {/* entrance */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              color: "#aaa",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Counter &amp; entrance
          </div>
          <div
            style={{
              width: 36,
              height: 6,
              background: "rgba(0,0,0,.25)",
              borderRadius: 3,
              margin: "0 auto",
            }}
          />
        </div>
      </div>

      {/* order drawer */}
      {selected && selectedConfig && (
        <OrderDrawer
          config={selectedConfig}
          order={selectedOrder}
          invoice={selectedInvoice}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onInvoiceStatusChange={handleInvoiceStatusChange}
        />
      )}
    </>
  );
}
