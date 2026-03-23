import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllOrders,
  updateOrderStatus,
} from "../../services/adminService.js";

const PINK = "#e91e8c";
const WHITE = "#fff";

const STATUS_STYLE = {
  Placed: { bg: "#E6F1FB", color: "#185FA5" },
  Preparing: { bg: "#FAEEDA", color: "#854F0B" },
  Ready: { bg: "#EAF3DE", color: "#3B6D11" },
  Completed: { bg: "#F1EFE8", color: "#5F5E5A" },
  Cancelled: { bg: "#FCEBEB", color: "#A32D2D" },
};
const PAY_STYLE = {
  Paid: { bg: "#EAF3DE", color: "#3B6D11" },
  Pending: { bg: "#FAEEDA", color: "#854F0B" },
  Failed: { bg: "#FCEBEB", color: "#A32D2D" },
};
const TYPE_STYLE = {
  Dining: { bg: "#FBEAF0", color: "#993556" },
  "Take Away": { bg: "#E6F1FB", color: "#185FA5" },
};

const STATUSES = [
  "All",
  "Placed",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];
const AVATAR_COLORS = [
  { bg: "#E6F1FB", c: "#185FA5" },
  { bg: "#FBEAF0", c: "#993556" },
  { bg: "#EAF3DE", c: "#3B6D11" },
  { bg: "#FAEEDA", c: "#854F0B" },
  { bg: "#EEEDFE", c: "#3C3489" },
  { bg: "#E1F5EE", c: "#085041" },
];
const avc = (n) =>
  AVATAR_COLORS[(n?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const ini = (n) =>
  !n || n === "Guest"
    ? "G"
    : n
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

const Badge = ({ label, map }) => {
  const s = map[label] || { bg: "#f0f0f0", color: "#666" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 9px",
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

const StatPill = ({ label, value, color, sub }) => (
  <div
    style={{
      background: "var(--color-background-secondary,#f5f5f5)",
      borderRadius: 8,
      padding: "12px 16px",
    }}
  >
    <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
    <div
      style={{
        fontSize: 20,
        fontWeight: 500,
        color: color || "var(--color-text-primary,#111)",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{sub}</div>
    )}
  </div>
);

// ── expanded order detail row ──────────────────────────────────────────────────
const OrderDetail = ({ order, onStatusChange }) => {
  const subtotal = order.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0;
  const tax = Math.round(subtotal * 0.18);
  return (
    <div
      style={{
        background: "rgba(233,30,140,.03)",
        borderRadius: 10,
        padding: 16,
        border: "0.5px solid rgba(233,30,140,.15)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginTop: 2,
      }}
    >
      {/* items */}
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
          Items ordered
        </div>
        {order.items?.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "7px 0",
              borderBottom: "0.5px solid rgba(0,0,0,.06)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 24,
                  height: 24,
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
            <span style={{ fontWeight: 500 }}>₹{item.price * item.qty}</span>
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
          {order.discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#3B6D11",
                marginBottom: 5,
              }}
            >
              <span>Discount</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
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
            <span style={{ color: PINK }}>₹{Math.round(order.total)}</span>
          </div>
        </div>
      </div>

      {/* info + update */}
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
          Order info
        </div>
        {[
          { l: "Order ID", v: order.orderId, vc: PINK },
          { l: "Customer", v: order.user?.name || "Guest" },
          {
            l: "Phone",
            v: order.user?.phone ? `+91 ${order.user.phone}` : "—",
          },
          { l: "Type", v: order.orderType },
          { l: "Table", v: order.tableNo ? `Table ${order.tableNo}` : "—" },
          {
            l: "Date",
            v: new Date(order.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ].map((r) => (
          <div
            key={r.l}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 0",
              borderBottom: "0.5px solid rgba(0,0,0,.05)",
              fontSize: 13,
            }}
          >
            <span style={{ color: "#888" }}>{r.l}</span>
            <span
              style={{
                fontWeight: 500,
                color: r.vc || "var(--color-text-primary,#111)",
              }}
            >
              {r.v}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 14 }}>
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
            Update status
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Placed", "Preparing", "Ready", "Completed", "Cancelled"]
              .filter((s) => s !== order.status)
              .map((s) => {
                const st = STATUS_STYLE[s] || { bg: "#f0f0f0", color: "#666" };
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange(order._id, s)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: `0.5px solid ${st.color}`,
                      background: st.bg,
                      color: st.color,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [typeF, setTypeF] = useState("All");
  const [payF, setPayF] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => {
    getAllOrders({ limit: 200 })
      .then((r) => {
        setOrders(r.data?.orders || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load orders");
        setLoading(false);
      });
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o)),
      );
      toast.success(`→ ${newStatus}`);
    } catch {
      toast.error("Update failed");
    }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      (filter === "All" || o.status === filter) &&
      (typeF === "All" || o.orderType === typeF) &&
      (payF === "All" || o.paymentStatus === payF) &&
      (!q ||
        o.orderId?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.phone?.includes(q))
    );
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // stats from all orders
  const stats = {
    total: orders.length,
    today: orders.filter(
      (o) => new Date(o.createdAt).toDateString() === new Date().toDateString(),
    ).length,
    revenue: orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((s, o) => s + Number(o.total || 0), 0),
    pending: orders.filter((o) =>
      ["Placed", "Preparing", "Ready"].includes(o.status),
    ).length,
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("All");
    setTypeF("All");
    setPayF("All");
    setPage(1);
  };
  const hasFilters =
    search || filter !== "All" || typeF !== "All" || payF !== "All";

  return (
    <>
      {/* header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>All orders</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>
          Search, filter and manage every order
        </div>
      </div>

      {/* stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatPill label="Total orders" value={stats.total} />
        <StatPill label="Today's orders" value={stats.today} color={PINK} />
        <StatPill
          label="Total collected"
          value={`₹${Math.round(stats.revenue).toLocaleString()}`}
          color="#1D9E75"
        />
        <StatPill label="Active orders" value={stats.pending} color="#BA7517" />
      </div>

      {/* filter bar */}
      <div
        style={{
          background: WHITE,
          border: "0.5px solid rgba(0,0,0,.08)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order ID, customer or phone…"
            style={{
              flex: 1,
              minWidth: 220,
              padding: "9px 14px",
              borderRadius: 8,
              border: "0.5px solid rgba(0,0,0,.15)",
              fontSize: 13,
              outline: "none",
              background: WHITE,
            }}
          />
          {[
            {
              val: filter,
              set: (v) => {
                setFilter(v);
                setPage(1);
              },
              opts: STATUSES,
              label: "Status",
            },
            {
              val: typeF,
              set: (v) => {
                setTypeF(v);
                setPage(1);
              },
              opts: ["All", "Dining", "Take Away"],
              label: "Type",
            },
            {
              val: payF,
              set: (v) => {
                setPayF(v);
                setPage(1);
              },
              opts: ["All", "Paid", "Pending", "Failed"],
              label: "Payment",
            },
          ].map((f) => (
            <select
              key={f.label}
              value={f.val}
              onChange={(e) => f.set(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "0.5px solid rgba(0,0,0,.15)",
                fontSize: 13,
                background: WHITE,
                cursor: "pointer",
              }}
            >
              {f.opts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
        </div>

        {/* status quick-filter tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUSES.map((s) => {
            const cnt =
              s === "All"
                ? orders.length
                : orders.filter((o) => o.status === s).length;
            const st = STATUS_STYLE[s] || { bg: "#f0f0f0", color: "#555" };
            return (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  setPage(1);
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  cursor: "pointer",
                  fontWeight: 500,
                  border: filter === s ? "none" : "0.5px solid rgba(0,0,0,.1)",
                  background:
                    filter === s
                      ? s === "All"
                        ? PINK
                        : st.bg
                      : "var(--color-background-secondary,#f5f5f5)",
                  color:
                    filter === s ? (s === "All" ? WHITE : st.color) : "#777",
                }}
              >
                {s} <span style={{ opacity: 0.7 }}>({cnt})</span>
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                border: `0.5px solid ${PINK}`,
                color: PINK,
                background: WHITE,
                marginLeft: 4,
              }}
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* table */}
      <div
        style={{
          background: WHITE,
          border: "0.5px solid rgba(0,0,0,.08)",
          borderRadius: 12,
          padding: 18,
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#aaa" }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#bbb" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>No orders match your filters</div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  borderRadius: 20,
                  border: `0.5px solid ${PINK}`,
                  color: PINK,
                  background: WHITE,
                  cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>
              Showing{" "}
              <span style={{ fontWeight: 500, color: PINK }}>
                {(page - 1) * PER_PAGE + 1}–
                {Math.min(page * PER_PAGE, filtered.length)}
              </span>{" "}
              of <span style={{ fontWeight: 500 }}>{filtered.length}</span>{" "}
              orders
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "",
                      "Order ID",
                      "Customer",
                      "Items",
                      "Amount",
                      "Type",
                      "Status",
                      "Payment",
                      "Date",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: "left",
                          padding: "9px 12px",
                          fontSize: 11,
                          color: "#888",
                          fontWeight: 500,
                          borderBottom: "0.5px solid rgba(0,0,0,.08)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((o) => {
                    const isOpen = expanded === o._id;
                    const av = avc(o.user?.name || "Guest");
                    return (
                      <>
                        <tr
                          key={o._id}
                          style={{
                            borderBottom: isOpen
                              ? "none"
                              : "0.5px solid rgba(0,0,0,.05)",
                            background: isOpen
                              ? "rgba(233,30,140,.02)"
                              : "transparent",
                            transition: "background .15s",
                          }}
                        >
                          {/* avatar */}
                          <td style={{ padding: "12px 8px 12px 12px" }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: av.bg,
                                color: av.c,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              {ini(o.user?.name)}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: 500,
                              color: PINK,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {o.orderId}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 500 }}>
                              {o.user?.name || "Guest"}
                            </div>
                            <div style={{ fontSize: 11, color: "#aaa" }}>
                              {o.user?.phone ? `+91 ${o.user.phone}` : "—"}
                            </div>
                          </td>
                          <td style={{ padding: "12px", maxWidth: 160 }}>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#888",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {o.items
                                ?.map((i) => `${i.name} ×${i.qty}`)
                                .join(", ") || "—"}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ₹{Math.round(o.total)}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <Badge
                              label={o.orderType || "—"}
                              map={TYPE_STYLE}
                            />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <Badge label={o.status} map={STATUS_STYLE} />
                          </td>
                          <td style={{ padding: "12px" }}>
                            <Badge label={o.paymentStatus} map={PAY_STYLE} />
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              fontSize: 12,
                              color: "#aaa",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                            <div style={{ fontSize: 11 }}>
                              {new Date(o.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => setExpanded(isOpen ? null : o._id)}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                cursor: "pointer",
                                border: `0.5px solid ${isOpen ? PINK : "rgba(0,0,0,.12)"}`,
                                background: isOpen ? "#fbeaf0" : WHITE,
                                color: isOpen
                                  ? PINK
                                  : "var(--color-text-primary,#111)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isOpen ? "Close ↑" : "View ↓"}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr
                            key={`${o._id}-d`}
                            style={{
                              borderBottom: "0.5px solid rgba(0,0,0,.05)",
                            }}
                          >
                            <td
                              colSpan={10}
                              style={{ padding: "4px 12px 16px" }}
                            >
                              <OrderDetail
                                order={o}
                                onStatusChange={(id, s) => {
                                  handleStatusChange(id, s);
                                  setExpanded(null);
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "0.5px solid rgba(0,0,0,.12)",
                    background: WHITE,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    color:
                      page === 1 ? "#ccc" : "var(--color-text-primary,#111)",
                    fontSize: 13,
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && arr[i - 1] !== p - 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span
                        key={`e${i}`}
                        style={{
                          padding: "6px 4px",
                          fontSize: 13,
                          color: "#aaa",
                        }}
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          border: "none",
                          background:
                            page === p
                              ? PINK
                              : "var(--color-background-secondary,#f5f5f5)",
                          color:
                            page === p
                              ? WHITE
                              : "var(--color-text-primary,#111)",
                          fontWeight: page === p ? 500 : 400,
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "0.5px solid rgba(0,0,0,.12)",
                    background: WHITE,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    color:
                      page === totalPages
                        ? "#ccc"
                        : "var(--color-text-primary,#111)",
                    fontSize: 13,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
