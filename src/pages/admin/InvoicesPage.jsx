import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getAllOrders } from "../../services/adminService.js";

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

const Badge = ({ label, map }) => {
  const s = map[label] || { bg: "#f0f0f0", color: "#666" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
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

const SectionLabel = ({ children }) => (
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
    {children}
  </div>
);

// ── summary stat ──────────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <div
    style={{
      background: "var(--color-background-secondary,#f5f5f5)",
      borderRadius: 8,
      padding: "11px 14px",
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
  </div>
);

export default function InvoicesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getAllOrders({ limit: 200 })
      .then((r) => {
        setOrders(r.data.orders || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load invoices");
        setLoading(false);
      });
  }, []);

  // Only orders that are Completed or have paymentStatus Paid
  const invoiceOrders = orders.filter(
    (o) => o.status === "Completed" || o.paymentStatus === "Paid",
  );

  const filtered = invoiceOrders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderId?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.phone?.includes(q);
    const matchPay = payFilter === "All" || o.paymentStatus === payFilter;
    const matchType = typeFilter === "All" || o.orderType === typeFilter;
    return matchSearch && matchPay && matchType;
  });

  // stats
  const totalRevenue = invoiceOrders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((s, o) => s + Number(o.total || 0), 0);
  const paidCount = invoiceOrders.filter(
    (o) => o.paymentStatus === "Paid",
  ).length;
  const pendingCount = invoiceOrders.filter(
    (o) => o.paymentStatus === "Pending",
  ).length;
  const avgVal = paidCount ? Math.round(totalRevenue / paidCount) : 0;

  return (
    <>
      {/* header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 500 }}>Invoices</div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>
          Generated bills and receipts
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
        <StatPill label="Total invoices" value={invoiceOrders.length} />
        <StatPill
          label="Total collected"
          value={`₹${Math.round(totalRevenue).toLocaleString()}`}
          color={PINK}
        />
        <StatPill label="Paid" value={paidCount} color="#1D9E75" />
        <StatPill label="Avg bill" value={`₹${avgVal.toLocaleString()}`} />
      </div>

      {/* filters */}
      <div
        style={{
          background: WHITE,
          border: "0.5px solid rgba(0,0,0,.08)",
          borderRadius: 12,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer or phone…"
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

          <select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "0.5px solid rgba(0,0,0,.15)",
              fontSize: 13,
              background: WHITE,
              cursor: "pointer",
            }}
          >
            <option value="All">All payments</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Failed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "0.5px solid rgba(0,0,0,.15)",
              fontSize: 13,
              background: WHITE,
              cursor: "pointer",
            }}
          >
            <option value="All">All types</option>
            <option value="Dining">Dining</option>
            <option value="Take Away">Take Away</option>
          </select>
        </div>

        {(search || payFilter !== "All" || typeFilter !== "All") && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
            Showing{" "}
            <span style={{ fontWeight: 500, color: PINK }}>
              {filtered.length}
            </span>{" "}
            of {invoiceOrders.length} invoices
            <span
              onClick={() => {
                setSearch("");
                setPayFilter("All");
                setTypeFilter("All");
              }}
              style={{ color: PINK, cursor: "pointer", marginLeft: 10 }}
            >
              Clear filters
            </span>
          </div>
        )}
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
            <div style={{ fontSize: 14 }}>No invoices match your filters</div>
          </div>
        ) : (
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
                    "Order ID",
                    "Customer",
                    "Items",
                    "Amount",
                    "Type",
                    "Order status",
                    "Payment",
                    "Date",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
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
                {filtered.map((inv) => {
                  const isOpen = expanded === inv._id;
                  const subtotal =
                    inv.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0;
                  const tax = Math.round(subtotal * 0.18);
                  return (
                    <>
                      <tr
                        key={inv._id}
                        style={{
                          borderBottom: isOpen
                            ? "none"
                            : "0.5px solid rgba(0,0,0,.06)",
                          background: isOpen
                            ? "rgba(233,30,140,.03)"
                            : "transparent",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            fontWeight: 500,
                            color: PINK,
                          }}
                        >
                          {inv.orderId}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: 500 }}>
                            {inv.user?.name || "Guest"}
                          </div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>
                            {inv.user?.phone || "—"}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: 12,
                            color: "#888",
                            maxWidth: 160,
                          }}
                        >
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {inv.items
                              ?.map((i) => `${i.name} ×${i.qty}`)
                              .join(", ") || "—"}
                          </div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: 500 }}>
                          ₹{Math.round(inv.total)}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              background:
                                inv.orderType === "Dining"
                                  ? "#FBEAF0"
                                  : "#E6F1FB",
                              color:
                                inv.orderType === "Dining"
                                  ? "#993556"
                                  : "#185FA5",
                              padding: "2px 9px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                          >
                            {inv.orderType || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <Badge label={inv.status} map={STATUS_STYLE} />
                        </td>
                        <td style={{ padding: "12px" }}>
                          <Badge label={inv.paymentStatus} map={PAY_STYLE} />
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            fontSize: 12,
                            color: "#aaa",
                          }}
                        >
                          {inv.createdAt
                            ? new Date(inv.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button
                            onClick={() => setExpanded(isOpen ? null : inv._id)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              border: `0.5px solid ${isOpen ? PINK : "rgba(0,0,0,.15)"}`,
                              background: isOpen ? "#fbeaf0" : WHITE,
                              color: isOpen
                                ? PINK
                                : "var(--color-text-primary,#111)",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isOpen ? "Close" : "View ↓"}
                          </button>
                        </td>
                      </tr>

                      {/* expanded receipt row */}
                      {isOpen && (
                        <tr
                          key={`${inv._id}-detail`}
                          style={{
                            borderBottom: "0.5px solid rgba(0,0,0,.06)",
                            background: "rgba(233,30,140,.03)",
                          }}
                        >
                          <td colSpan={9} style={{ padding: "0 12px 16px" }}>
                            <div
                              style={{
                                background: WHITE,
                                borderRadius: 10,
                                padding: 16,
                                border: "0.5px solid rgba(233,30,140,.2)",
                                maxWidth: 480,
                              }}
                            >
                              <SectionLabel>
                                Receipt — {inv.orderId}
                              </SectionLabel>
                              {inv.items?.map((item, i) => (
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
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 10,
                                      alignItems: "center",
                                    }}
                                  >
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
                                  { label: "Subtotal", val: `₹${subtotal}` },
                                  { label: "GST (18%)", val: `₹${tax}` },
                                  ...(inv.discount > 0
                                    ? [
                                        {
                                          label: "Discount",
                                          val: `-₹${inv.discount}`,
                                        },
                                      ]
                                    : []),
                                ].map((r) => (
                                  <div
                                    key={r.label}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      fontSize: 12,
                                      color: "#888",
                                      marginBottom: 5,
                                    }}
                                  >
                                    <span>{r.label}</span>
                                    <span>{r.val}</span>
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
                                  <span style={{ color: PINK }}>
                                    ₹{Math.round(inv.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
