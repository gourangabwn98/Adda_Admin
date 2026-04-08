import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getDashboard,
  updateOrderStatus,
  getAllOrders,
  getAllInvoices,
  updateInvoiceStatus,
  getAllTables, // ← Added for dynamic tables
} from "../../services/adminService.js";

// ── constants ─────────────────────────────────────────────────────────────────
const PINK = "#e91e8c";
const WHITE = "#fff";

const STATUS_STYLE = {
  Placed: { bg: "#E6F1FB", color: "#185FA5" },
  Preparing: { bg: "#FAEEDA", color: "#854F0B" },
  Ready: { bg: "#EAF3DE", color: "#3B6D11" },
  Delivered: { bg: "#EAF3DE", color: "#3B6D11" },
  Completed: { bg: "#F1EFE8", color: "#5F5E5A" },
  Cancelled: { bg: "#FCEBEB", color: "#A32D2D" },
};

const TYPE_STYLE = {
  Dining: { bg: "#FBEAF0", color: "#993556" },
  "Take Away": { bg: "#E6F1FB", color: "#185FA5" },
};

const AVATAR_COLORS = [
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#E1F5EE", color: "#085041" },
];

// ── inject blink keyframe once ────────────────────────────────────────────────
if (!document.getElementById("dash-blink-style")) {
  const s = document.createElement("style");
  s.id = "dash-blink-style";
  s.textContent = `
    @keyframes dashBlink {
      0%,100%{ box-shadow:0 0 0 0 rgba(211,47,47,0); border-color:#d32f2f; }
      50%     { box-shadow:0 0 0 4px rgba(211,47,47,0.3); border-color:#ff1744; }
    }
    .dash-blink{ animation:dashBlink 1.4s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── helpers ───────────────────────────────────────────────────────────────────
const isToday = (d) => {
  const dt = new Date(d),
    n = new Date();
  return (
    dt.getFullYear() === n.getFullYear() &&
    dt.getMonth() === n.getMonth() &&
    dt.getDate() === n.getDate()
  );
};

const initials = (n) =>
  !n || n === "Guest"
    ? "G"
    : n
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

const avatarColor = (s) =>
  AVATAR_COLORS[(s?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── StatusBadge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ label }) => {
  const s = STATUS_STYLE[label] || { bg: "#f0f0f0", color: "#666" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

const TypeBadge = ({ label }) => {
  const s = TYPE_STYLE[label] || { bg: "#f0f0f0", color: "#666" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
  <div
    style={{
      background: "var(--color-background-secondary,#f5f5f5)",
      borderRadius: 8,
      padding: "14px 16px",
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: "var(--color-text-secondary,#888)",
        marginBottom: 5,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 500,
        color: color || "var(--color-text-primary,#111)",
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-tertiary,#aaa)",
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 500,
      color: "var(--color-text-tertiary,#999)",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: 12,
    }}
  >
    {children}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: WHITE,
      border: "0.5px solid rgba(0,0,0,.08)",
      borderRadius: 12,
      padding: 16,
      ...style,
    }}
  >
    {children}
  </div>
);

// ── StatusSummary ─────────────────────────────────────────────────────────────
function StatusSummary({ orders }) {
  const counts = {};
  orders.forEach((o) => {
    if (!counts[o.status]) counts[o.status] = { count: 0, revenue: 0 };
    counts[o.status].count++;
    counts[o.status].revenue += Number(o.total || 0);
  });
  const all = {
    count: orders.length,
    revenue: orders.reduce((s, o) => s + Number(o.total || 0), 0),
  };
  const cells = [
    ...[
      "Placed",
      "Preparing",
      "Ready",
      "Delivered",
      "Completed",
      "Cancelled",
    ].map((s) => ({
      label: s,
      ...(counts[s] || { count: 0, revenue: 0 }),
      style: STATUS_STYLE[s] || { bg: "#f0f0f0", color: "#666" },
    })),
    {
      label: "Total",
      count: all.count,
      revenue: all.revenue,
      style: {
        bg: "var(--color-background-secondary,#f0f0f0)",
        color: "var(--color-text-primary,#333)",
      },
    },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,minmax(0,1fr))",
        gap: 8,
        marginBottom: 16,
      }}
    >
      {cells.map((c) => (
        <div
          key={c.label}
          style={{
            background: c.style.bg,
            borderRadius: 8,
            padding: "10px 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: c.style.color,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {c.label}
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: c.style.color }}>
            {c.count}
          </div>
          <div
            style={{
              fontSize: 10,
              color: c.style.color,
              opacity: 0.8,
              marginTop: 2,
            }}
          >
            ₹{Math.round(c.revenue).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TableMap with dynamic tables from API ─────────────────────────────────────
function TableMap({
  orders,
  invoiceMap,
  onStatusChange,
  onInvoiceStatusChange,
}) {
  const [activeTable, setActiveTable] = useState(null);
  const [tables, setTables] = useState([]); // ← Dynamic tables from backend

  // Fetch tables
  useEffect(() => {
    getAllTables()
      .then((res) => setTables(res.data?.tables || []))
      .catch((err) => {
        console.error("Failed to load tables", err);
        setTables([]);
      });
  }, []);

  // build tableNo → order map
  const tableOrderMap = {};
  orders
    .filter(
      (o) =>
        o.orderType === "Dining" &&
        o.tableNo &&
        !["Completed", "Cancelled"].includes(o.status),
    )
    .forEach((o) => {
      tableOrderMap[Number(o.tableNo)] = o;
    });

  const selectedOrder = activeTable ? tableOrderMap[activeTable] || null : null;
  const selectedInvoice = activeTable ? invoiceMap[activeTable] || null : null;
  const isPending = selectedInvoice?.invoiceStatus?.toLowerCase() === "pending";

  return (
    <div>
      {/* Dynamic Table Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {tables.length > 0 ? (
          tables
            .filter((t) => t.status === "Active" || !t.status)
            .sort((a, b) => a.tableNo - b.tableNo)
            .map((t) => {
              const o = tableOrderMap[t.tableNo];
              const inv = invoiceMap[t.tableNo];
              const pending = inv?.invoiceStatus?.toLowerCase() === "pending";
              const st = o
                ? pending
                  ? { bg: "#fff0f5", color: "#d32f2f" }
                  : STATUS_STYLE[o.status] || { bg: "#f0f0f0", color: "#888" }
                : {
                    bg: "var(--color-background-secondary,#f5f5f5)",
                    color: "#888780",
                  };
              const borderColor = pending
                ? "#d32f2f"
                : o
                  ? st.color
                  : "#B4B2A9";
              const isActive = activeTable === t.tableNo;

              return (
                <div
                  key={t.tableNo}
                  className={pending ? "dash-blink" : ""}
                  onClick={() => setActiveTable(isActive ? null : t.tableNo)}
                  style={{
                    borderRadius: 8,
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: st.bg,
                    borderLeft: `3px solid ${borderColor}`,
                    border: isActive ? `2px solid ${PINK}` : "none",
                    outline: isActive ? `2px solid ${PINK}33` : "none",
                    transition: "transform .12s",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
                    position: "relative",
                  }}
                >
                  {/* pending dot */}
                  {pending && (
                    <div
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#d32f2f",
                        border: "2px solid #fff",
                        zIndex: 2,
                      }}
                    />
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                      T{t.tableNo}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        background: st.bg,
                        color: st.color,
                        padding: "1px 6px",
                        borderRadius: 10,
                        fontWeight: 500,
                        border: `0.5px solid ${borderColor}`,
                      }}
                    >
                      {pending ? "Pay Due" : o ? o.status : "Free"}
                    </span>
                  </div>
                  {o ? (
                    <>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--color-text-secondary,#777)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {o.user?.name || "Guest"}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: pending ? "#d32f2f" : PINK,
                          marginTop: 2,
                        }}
                      >
                        ₹{Math.round(o.total)}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary,#aaa)",
                        marginTop: 3,
                      }}
                    >
                      {t.seats} seats
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 40,
              color: "#aaa",
            }}
          >
            Loading tables...
          </div>
        )}
      </div>

      {/* inline drawer when table selected - Your original code unchanged */}
      {activeTable && (
        <div
          style={{
            background: isPending ? "#fff8f8" : WHITE,
            border: `0.5px solid ${isPending ? "#fca5a5" : "rgba(0,0,0,.1)"}`,
            borderRadius: 10,
            padding: 16,
            marginTop: 4,
          }}
        >
          {/* drawer header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div>
              <span style={{ fontWeight: 500, fontSize: 14 }}>
                Table {activeTable}
              </span>
              {selectedOrder && (
                <span style={{ fontSize: 12, color: "#aaa", marginLeft: 8 }}>
                  {selectedOrder.orderId} ·{" "}
                  {selectedOrder.user?.name || "Guest"}
                </span>
              )}
              {isPending && (
                <span
                  style={{
                    marginLeft: 10,
                    background: "#ffebee",
                    color: "#c62828",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  Invoice Pending
                </span>
              )}
            </div>
            <button
              onClick={() => setActiveTable(null)}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: "0.5px solid rgba(0,0,0,.15)",
                background: "#f5f5f5",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              ✕
            </button>
          </div>

          {!selectedOrder ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: "#aaa",
                fontSize: 13,
              }}
            >
              This table is free — no active order
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* LEFT: items */}
              <div>
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
                  Items
                </div>
                {selectedOrder.items?.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "0.5px solid rgba(0,0,0,.06)",
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
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
                    marginTop: 10,
                    paddingTop: 10,
                  }}
                >
                  {[
                    {
                      l: "Subtotal",
                      v: `₹${selectedOrder.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0}`,
                    },
                    {
                      l: "GST (18%)",
                      v: `₹${Math.round((selectedOrder.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0) * 0.18)}`,
                    },
                  ].map((r) => (
                    <div
                      key={r.l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#888",
                        marginBottom: 4,
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
                      fontSize: 14,
                      marginTop: 6,
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: isPending ? "#d32f2f" : PINK }}>
                      ₹{Math.round(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT: status update + invoice */}
              <div>
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
                    marginBottom: 16,
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
                    .filter((s) => s !== selectedOrder.status)
                    .map((s) => {
                      const stl = STATUS_STYLE[s] || {
                        bg: "#f0f0f0",
                        color: "#555",
                      };
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            onStatusChange(selectedOrder._id, s);
                            setActiveTable(null);
                          }}
                          style={{
                            padding: "5px 11px",
                            borderRadius: 20,
                            fontSize: 12,
                            cursor: "pointer",
                            border: `0.5px solid ${stl.color}`,
                            background: stl.bg,
                            color: stl.color,
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                </div>

                {/* invoice section */}
                {selectedInvoice ? (
                  <>
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
                      Invoice
                    </div>
                    <div
                      style={{
                        background: isPending ? "#fff0f5" : "#f8fdf8",
                        border: `0.5px solid ${isPending ? "#fca5a5" : "#c3e6cb"}`,
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "#888" }}>Amount</span>
                        <span style={{ fontWeight: 500 }}>
                          ₹
                          {Math.round(
                            selectedInvoice.total || selectedOrder.total,
                          )}
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
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedInvoice.invoiceStatus}
                        </span>
                      </div>
                    </div>
                    {isPending && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            onInvoiceStatusChange(
                              selectedInvoice._id,
                              "completed",
                            );
                            setActiveTable(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "9px",
                            background: "#2e7d32",
                            color: WHITE,
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => {
                            onInvoiceStatusChange(
                              selectedInvoice._id,
                              "cancelled",
                            );
                            setActiveTable(null);
                          }}
                          style={{
                            flex: 1,
                            padding: "9px",
                            background: "#c62828",
                            color: WHITE,
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      background: "#f5f5f5",
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 12,
                      color: "#aaa",
                      textAlign: "center",
                    }}
                  >
                    No invoice yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── OrderList ─────────────────────────────────────────────────────────────────
function OrderList({ orders, onStatusChange }) {
  const [type, setType] = useState("all");

  const activeOrders = orders.filter(
    (o) => !["Completed", "Cancelled"].includes(o.status),
  );
  const countDining = activeOrders.filter(
    (o) => o.orderType === "Dining",
  ).length;
  const countTakeaway = activeOrders.filter(
    (o) => o.orderType === "Take Away",
  ).length;

  const visible = activeOrders.filter((o) => {
    if (type === "dining") return o.orderType === "Dining";
    if (type === "takeaway") return o.orderType === "Take Away";
    return true;
  });

  const btnStyle = (k) => ({
    flex: 1,
    textAlign: "center",
    cursor: "pointer",
    borderRadius: 10,
    padding: "12px 14px",
    border: type === k ? `2px solid ${PINK}` : "0.5px solid rgba(0,0,0,.1)",
    background: type === k ? "#fbeaf0" : WHITE,
    transition: "border-color .15s",
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          {
            key: "all",
            label: "All orders",
            count: activeOrders.length,
            color: "var(--color-text-primary,#111)",
          },
          { key: "dining", label: "Dining", count: countDining, color: PINK },
          {
            key: "takeaway",
            label: "Take away",
            count: countTakeaway,
            color: "#378ADD",
          },
        ].map((b) => (
          <div
            key={b.key}
            style={btnStyle(b.key)}
            onClick={() => setType(b.key)}
          >
            <div style={{ fontSize: 18, fontWeight: 500, color: b.color }}>
              {b.count}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary,#888)",
                marginTop: 3,
              }}
            >
              {b.label}
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "var(--color-text-tertiary,#aaa)",
            fontSize: 13,
          }}
        >
          No active orders in this category
        </div>
      ) : (
        visible.map((o) => {
          const av = avatarColor(o.user?.name || "Guest");
          return (
            <div
              key={o._id}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "11px 0",
                borderBottom: "0.5px solid rgba(0,0,0,.06)",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: av.bg,
                  color: av.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {initials(o.user?.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>
                      {o.user?.name || "Guest"}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: PINK,
                        marginLeft: 8,
                        fontWeight: 500,
                      }}
                    >
                      {o.orderId}
                    </span>
                  </div>
                  <span style={{ fontWeight: 500, color: PINK, fontSize: 13 }}>
                    ₹{Math.round(o.total)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary,#888)",
                    marginBottom: 6,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {o.items?.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <StatusBadge label={o.status} />
                  <TypeBadge label={o.orderType} />
                  {o.tableNo && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary,#aaa)",
                      }}
                    >
                      Table {o.tableNo}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary,#aaa)",
                      marginLeft: "auto",
                    }}
                  >
                    {new Date(o.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) onStatusChange(o._id, e.target.value);
                    }}
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 8,
                      border: "0.5px solid rgba(0,0,0,.12)",
                      background: WHITE,
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>
                      Update status…
                    </option>
                    {[
                      "Placed",
                      "Preparing",
                      "Ready",
                      "Delivered",
                      "Completed",
                      "Cancelled",
                    ]
                      .filter((s) => s !== o.status)
                      .map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

// ── main DashboardPage ────────────────────────────────────────────────────────
export default function DashboardPage({ data }) {
  const s = data?.stats || {};

  const [allTodayOrders, setAllTodayOrders] = useState([]);
  const [invoiceMap, setInvoiceMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        getAllOrders({ limit: 100 }),
        getAllInvoices().catch(() => ({ data: { invoices: [] } })),
      ]);

      const orders = (ordersRes.data.orders || []).filter((o) =>
        isToday(o.createdAt),
      );
      const invoices = invoicesRes.data?.invoices || [];

      // build invoiceMap: tableNo → invoice (only active dining orders)
      const activedining = orders.filter(
        (o) =>
          o.orderType === "Dining" &&
          o.tableNo &&
          !["Completed", "Cancelled"].includes(o.status),
      );
      const iMap = {};
      invoices.forEach((inv) => {
        const orderIds = inv.orders?.map(String) || [];
        for (const o of activedining) {
          if (orderIds.includes(String(o._id))) {
            iMap[Number(o.tableNo)] = {
              ...inv,
              invoiceStatus: inv.status || inv.paymentStatus || "pending",
            };
            break;
          }
        }
      });

      setAllTodayOrders(orders);
      setInvoiceMap(iMap);
    } catch {
      toast.error("Failed to load today's data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`→ ${newStatus}`);
      setAllTodayOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
      );
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

  const todayRevenue = allTodayOrders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const pendingInvoices = Object.values(invoiceMap).filter(
    (i) => i.invoiceStatus?.toLowerCase() === "pending",
  ).length;

  const statBoxes = [
    {
      label: "Total revenue",
      value: `₹${(s.totalRevenue || 0).toLocaleString()}`,
      sub: "All paid orders",
      color: PINK,
    },
    {
      label: "Total orders",
      value: s.totalOrders || 0,
      sub: `+${allTodayOrders.length} today`,
      color: "#1D9E75",
    },
    {
      label: "Registered users",
      value: s.totalUsers || 0,
      sub: "Guests included",
      color: "#378ADD",
    },
    {
      label: "Menu items",
      value: s.totalItems || 0,
      sub: "Available",
      color: "#BA7517",
    },
    {
      label: "Today's revenue",
      value: `₹${Math.round(todayRevenue).toLocaleString()}`,
      sub: `${allTodayOrders.length} orders`,
      color: PINK,
    },
    {
      label: "Avg order value",
      value: `₹${allTodayOrders.length ? Math.round(allTodayOrders.reduce((s, o) => s + Number(o.total || 0), 0) / allTodayOrders.length) : 0}`,
      sub: "Today",
    },
    {
      label: "Active tables",
      value: `${allTodayOrders.filter((o) => o.orderType === "Dining" && o.tableNo && !["Completed", "Cancelled"].includes(o.status)).length}`,
      sub: "Dining now",
    },
    {
      label: "Pending invoices",
      value: pendingInvoices,
      sub: "Needs attention",
      color: pendingInvoices > 0 ? "#c62828" : "#1D9E75",
    },
  ];

  return (
    <>
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 500 }}>Dashboard</div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-text-secondary,#888)",
              marginTop: 3,
            }}
          >
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {pendingInvoices > 0 && (
            <span
              className="dash-blink"
              style={{
                background: "#ffebee",
                color: "#c62828",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                border: "0.5px solid #fca5a5",
              }}
            >
              {pendingInvoices} invoice{pendingInvoices > 1 ? "s" : ""} pending
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
            <span
              style={{
                fontSize: 12,
                color: "var(--color-text-tertiary,#aaa)",
                marginLeft: 4,
              }}
            >
              refreshes every 10s
            </span>
          </div>
        </div>
      </div>

      {/* stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {statBoxes.map((b, i) => (
          <StatCard key={i} {...b} />
        ))}
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            color: "var(--color-text-tertiary,#aaa)",
          }}
        >
          Loading today's data…
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)",
            gap: 16,
          }}
        >
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <SectionLabel>Orders by status — today</SectionLabel>
              <StatusSummary orders={allTodayOrders} />
              <SectionLabel>Live table map</SectionLabel>
              <TableMap
                orders={allTodayOrders}
                invoiceMap={invoiceMap}
                onStatusChange={handleStatusChange}
                onInvoiceStatusChange={handleInvoiceStatusChange}
              />
            </Card>
          </div>

          {/* RIGHT */}
          <Card>
            <SectionLabel>Recent orders — today (active only)</SectionLabel>
            <OrderList
              orders={allTodayOrders}
              onStatusChange={handleStatusChange}
            />
          </Card>
        </div>
      )}
    </>
  );
}
