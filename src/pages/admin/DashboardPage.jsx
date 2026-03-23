import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getDashboard,
  updateOrderStatus,
  getAllOrders,
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

const TABLES = [
  { id: 1, seats: 4 },
  { id: 2, seats: 4 },
  { id: 3, seats: 4 },
  { id: 4, seats: 4 },
  { id: 5, seats: 4 },
  { id: 6, seats: 2 },
  { id: 7, seats: 2 },
  { id: 8, seats: 4 },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const isToday = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const initials = (name) => {
  if (!name || name === "Guest") return "G";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const AVATAR_COLORS = [
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#E1F5EE", color: "#085041" },
];

const avatarColor = (str) =>
  AVATAR_COLORS[(str?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── sub-components ────────────────────────────────────────────────────────────
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

// ── status summary mini-cards ──────────────────────────────────────────────────
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
      style: STATUS_STYLE[s],
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

// ── live table map ──────────────────────────────────────────────────────────────
function TableMap({ orders }) {
  // map tableNo → active order
  const tableMap = {};
  orders
    .filter(
      (o) =>
        o.orderType === "Dining" &&
        o.tableNo &&
        !["Completed", "Cancelled"].includes(o.status),
    )
    .forEach((o) => {
      tableMap[Number(o.tableNo)] = o;
    });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,minmax(0,1fr))",
        gap: 8,
      }}
    >
      {TABLES.map((t) => {
        const o = tableMap[t.id];
        const st = o
          ? STATUS_STYLE[o.status]
          : {
              bg: "var(--color-background-secondary,#f5f5f5)",
              color: "#888780",
            };
        const borderColor = o ? st.color : "#B4B2A9";
        return (
          <div
            key={t.id}
            style={{
              borderRadius: 8,
              padding: "10px 12px",
              background: st.bg,
              borderLeft: `3px solid ${borderColor}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 500 }}>T{t.id}</span>
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
                {o ? o.status : "Free"}
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
                    color: PINK,
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
      })}
    </div>
  );
}

// ── order list with dining/takeaway filter ────────────────────────────────────
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
    transition: "border-color .15s",
    border: type === k ? `2px solid ${PINK}` : "0.5px solid rgba(0,0,0,.1)",
    background: type === k ? "#fbeaf0" : WHITE,
  });

  return (
    <>
      {/* type filter */}
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

      {/* list */}
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
              {/* avatar */}
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
                {/* row 1 */}
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

                {/* items */}
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

                {/* badges row */}
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

                {/* inline status update */}
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

// ── main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage({ data }) {
  const s = data?.stats || {};

  const [allTodayOrders, setAllTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayOrders = useCallback(async () => {
    try {
      const res = await getAllOrders({ limit: 100 });
      const filtered = (res.data.orders || []).filter((o) =>
        isToday(o.createdAt),
      );
      setAllTodayOrders(filtered);
    } catch {
      toast.error("Failed to load today's orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayOrders();
    const interval = setInterval(fetchTodayOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchTodayOrders]);

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

  const todayRevenue = allTodayOrders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((s, o) => s + Number(o.total || 0), 0);

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
      color: "var(--color-text-primary,#111)",
    },
    {
      label: "Active tables",
      value: `${allTodayOrders.filter((o) => o.orderType === "Dining" && o.tableNo && !["Completed", "Cancelled"].includes(o.status)).length} / ${TABLES.length}`,
      sub: "Dining now",
    },
    {
      label: "Total invoices",
      value: s.totalInvoices || 0,
      sub: "Generated",
      color: "#378ADD",
    },
  ];

  return (
    <>
      {/* Header */}
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
            refreshes every 30s
          </span>
        </div>
      </div>

      {/* Stat grid */}
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
          {/* LEFT column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <SectionLabel>Orders by status — today</SectionLabel>
              <StatusSummary orders={allTodayOrders} />

              <SectionLabel>Live table map</SectionLabel>
              <TableMap orders={allTodayOrders} />
            </Card>
          </div>

          {/* RIGHT column */}
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
