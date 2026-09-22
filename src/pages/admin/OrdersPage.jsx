import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllOrders,
  getOrdersSummary,
  getRestaurantProfile,
  updateOrderStatus,
  updatePaymentStatus,
  updateOrderPaymentMethod,
  updateOrderItemsAdmin,
} from "../../services/adminService.js";
import { getMenu } from "../../services/menuService.js";
import { placeOrder } from "../../services/orderService.js";
// import { placeOrder } from "../../services/orderService.js";

const PINK = "#e91e8c";
const WHITE = "#fff";

// ── CreateOrderModal responsive layout ──────────────────────────────────────
// The modal's menu-picker/order-summary area is a fixed "1fr 340px" grid.
// Below ~760px that fixed 340px column leaves the menu-picker column too
// little room, squeezing the search box, category filter, and item cards
// together (looking like the category filter "disappears"/overlaps the
// search bar). This breakpoint stacks the two columns instead. Uses the same
// "inject a <style> tag once" pattern already used elsewhere in this app
// (see ProfilePage.jsx) since inline styles can't express media queries.
if (!document.getElementById("create-order-modal-styles")) {
  const s = document.createElement("style");
  s.id = "create-order-modal-styles";
  s.textContent = `
    .com-grid { display: grid; grid-template-columns: 1fr 340px; }
    @media (max-width: 760px) {
      .com-grid { grid-template-columns: 1fr; }
      .com-left-panel { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,.08); }
    }
  `;
  document.head.appendChild(s);
}

// Service charge applies only to the categories selected in Admin → Profile
// → Pricing & delivery (matches server/utils/serviceCharge.js) — everything
// else is exempt. `applicableCategoryNames` is that selection, resolved to
// lowercased category names.
const isServiceChargeApplicable = (category, applicableCategoryNames) => {
  const normalized = String(category || "").trim().toLowerCase();
  return !!normalized && (applicableCategoryNames || []).includes(normalized);
};

const STATUS_STYLE = {
  Placed: { bg: "#E6F1FB", color: "#185FA5" },
  Preparing: { bg: "#FAEEDA", color: "#854F0B" },
  Ready: { bg: "#EAF3DE", color: "#3B6D11" },
  Delivered: { bg: "#EAF3DE", color: "#3B6D11" },
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
  Delivery: { bg: "#E8F5E9", color: "#2E7D32" },
};

const STATUSES = [
  "All",
  "Placed",
  "Preparing",
  "Ready",
  "Delivered",
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

// ── Badge ─────────────────────────────────────────────────────────────────────
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

// ── StatPill ──────────────────────────────────────────────────────────────────
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

// Statuses an Admin may modify items on — matches
// server/controllers/orderController.js MODIFIABLE_STATUSES exactly;
// backend is the real enforcement (see adminUpdateOrderItems), this only
// controls whether the button is shown.
const ADMIN_MODIFIABLE_STATUSES = ["Placed", "Preparing"];

// ── OrderDetail (expand row) ──────────────────────────────────────────────────
const OrderDetail = ({ order, onStatusChange, onPaymentStatusChange, onPaymentMethodChange, onModify }) => {
  const subtotal = order.items?.reduce((s, i) => s + i.price * i.qty, 0) || 0;
  // const tax = Math.round(subtotal * 0.18);
  const tax=0;
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
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#aaa",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Items ordered
          </div>
          {ADMIN_MODIFIABLE_STATUSES.includes(order.status) && (
            <button
              onClick={() => onModify(order)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${PINK}`,
                background: "#fbeaf0",
                color: PINK,
              }}
            >
              ✏️ Modify Order
            </button>
          )}
        </div>
        {order.items?.map((item, i) => (
          <div
            key={i}
            style={{
              padding: "7px 0",
              borderBottom: "0.5px solid rgba(0,0,0,.06)",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
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
            {item.notes && (
              <div style={{ fontSize: 11, color: "#999", marginTop: 3, marginLeft: 34 }}>
                ↳ {item.notes}
              </div>
            )}
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
  ...(order.serviceCharge > 0
    ? [{ l: `Service Charge`, v: `₹${order.serviceCharge}` }]
    : []),
  ...(order.tax > 0
    ? [{ l: `GST`, v: `₹${order.tax}` }]
    : []),
  ...(order.deliveryFee > 0
    ? [{ l: `Delivery Fee`, v: `₹${order.deliveryFee}` }]
    : []),
            {/* { l: "GST (18%)", v: `₹${tax}` }, */}
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
            <span style={{ color: PINK }}>₹{Math.round(order.total)}</span>
          </div>
        </div>
      </div>
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
          { l: "Payment Method", v: order.paymentMethod || "—" },
          { l: "Table", v: order.tableNo ? `Table ${order.tableNo}` : "—" },
          ...(order.orderType === "Delivery"
            ? [
                { l: "Delivery Address", v: order.deliveryAddress || "—" },
                { l: "Delivery Phone", v: order.deliveryPhone ? `+91 ${order.deliveryPhone}` : "—" },
              ]
            : []),
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
            {[
              "Placed",
              "Preparing",
              "Ready",
              "Delivered",
              "Completed",
              "Cancelled",
            ]
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

        {/* Payment status + method — editable after the order was placed */}
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
            Payment status
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {/* "Unpaid" maps to the existing "Pending" paymentStatus value —
                there's no separate "Unpaid" value in the Order schema. */}
            {[
              { label: "Paid", value: "Paid" },
              { label: "Unpaid", value: "Pending" },
            ]
              .filter((o) => o.value !== order.paymentStatus)
              .map((o) => {
                const st = PAY_STYLE[o.value] || { bg: "#f0f0f0", color: "#666" };
                return (
                  <button
                    key={o.value}
                    onClick={() => onPaymentStatusChange(order._id, o.value)}
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
                    {o.label}
                  </button>
                );
              })}
          </div>
        </div>

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
            Payment method
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Cash", "Online"]
              .filter((m) => m !== order.paymentMethod)
              .map((m) => (
                <button
                  key={m}
                  onClick={() => onPaymentMethodChange(order._id, m)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "0.5px solid rgba(0,0,0,.15)",
                    background: "#f5f5f5",
                    color: "#555",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {m === "Cash" ? "💵" : "💳"} {m}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Replace the entire CreateOrderModal component in OrdersPage.jsx with this.
// Also add: import React from "react"; at the top of the file.

const isUrl = (s) => typeof s === "string" && s.startsWith("http");

const ItemImage = ({ src, name, size = 40 }) =>
  isUrl(src) ? (
    <img
      src={src}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        objectFit: "cover",
        flexShrink: 0,
        background: "#f5f5f5",
      }}
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  ) : (
    <span style={{ fontSize: Math.round(size * 0.6), flexShrink: 0, lineHeight: 1 }}>
      {src || "🍽️"}
    </span>
  );

const CreateOrderModal = ({ onClose, onCreated }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("Dining");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [tableNo, setTableNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [serviceChargePerItem, setServiceChargePerItem] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  // Lowercased category names the service charge applies to (Admin →
  // Profile → Pricing & delivery) — mirrors backend orderController.js
  // computeOrderPricing for this live preview.
  const [serviceChargeCategoryNames, setServiceChargeCategoryNames] = useState([]);

  useEffect(() => {
    getMenu({})
      .then((r) => { setMenuItems(r.data || []); setMenuLoading(false); })
      .catch(() => setMenuLoading(false));

    getRestaurantProfile()
      .then((res) => {
        const p = res.data?.data || res.data;
        setServiceChargePerItem(p?.serviceCharge || 0);
        setGstRate(p?.gstRate || 0);
        setServiceChargeCategoryNames(
          (p?.serviceChargeCategories || [])
            .map((c) => (typeof c === "string" ? c : c?.name))
            .filter(Boolean)
            .map((n) => n.trim().toLowerCase()),
        );
      })
      .catch(() => {});
  }, []);

  // Trim category strings before dedup/compare — the backend `category` field
  // has no `trim: true` (server/models/MenuItem.js), so a stray
  // leading/trailing space would otherwise create a duplicate chip that
  // never matches on `===`, breaking that category's filter.
  const categories = [
    "All",
    ...new Set(
      menuItems
        .map((m) => (typeof m.category === "string" ? m.category.trim() : ""))
        .filter(Boolean)
    ),
  ];

  const filtered = menuItems.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "All" ||
        (typeof m.category === "string" ? m.category.trim() : "") === categoryFilter)
  );

  const getQty = (id) => cart.find((c) => c.item._id === id)?.qty || 0;

  const addItem = (item) =>
    setCart((p) => {
      const ex = p.find((c) => c.item._id === item._id);
      return ex
        ? p.map((c) => (c.item._id === item._id ? { ...c, qty: c.qty + 1 } : c))
        : [...p, { item, qty: 1 }];
    });

  // Free-text prep note per cart item (e.g. "no onions") — printed on the
  // KOT (see server/models/Order.js item.notes).
  const updateNotes = (id, notes) =>
    setCart((p) => p.map((c) => (c.item._id === id ? { ...c, notes } : c)));

  const removeItem = (id) =>
    setCart((p) => {
      const ex = p.find((c) => c.item._id === id);
      if (!ex) return p;
      return ex.qty === 1
        ? p.filter((c) => c.item._id !== id)
        : p.map((c) => (c.item._id === id ? { ...c, qty: c.qty - 1 } : c));
    });

  const subtotal         = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  const tax              = Math.round(subtotal * (gstRate / 100));
  // Only Admin-selected categories incur service charge (matches
  // server/utils/serviceCharge.js).
  const chargeableQty    = cart
    .filter((c) => isServiceChargeApplicable(c.item.category, serviceChargeCategoryNames))
    .reduce((s, c) => s + c.qty, 0);
  const serviceChargeAmt = serviceChargePerItem * chargeableQty;
  // const discount         = subtotal > 400 ? 10 : 0;
  const total            = subtotal + tax + serviceChargeAmt;

  const handleSubmit = async () => {
    if (!cart.length) return toast.error("Add at least one item");
    if (orderType === "Dining" && !tableNo)
      return toast.error("Enter table number for dining");
    try {
      setLoading(true);
      const { data } = await placeOrder({
        items: cart.map((c) => ({ menuItemId: c.item._id, qty: c.qty, notes: c.notes || "" })),
        orderType,
        tableNo: orderType === "Dining" ? Number(tableNo) : null,
        paymentMethod,
        isGuest: true,
        // Admin placed this directly — skips the "awaiting confirmation"
        // step (see server/controllers/orderController.js placeOrder).
        orderSource: "admin",
      });
      toast.success(`Order ${data.orderId} created!`);
      onCreated(data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    padding: "9px 12px", borderRadius: 8,
    border: "1px solid rgba(0,0,0,.15)", fontSize: 13,
    outline: "none", background: WHITE, width: "100%", boxSizing: "border-box",
  };

  // ── KFC-style palette — scoped to this modal only; the rest of the page
  // keeps using the shared PINK/WHITE constants above, untouched. ──────────
  const KFC_RED   = "#c8102e";
  const KFC_DARK  = "#1e1e1e";
  const KFC_CREAM = "#fff8ef";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: KFC_CREAM, borderRadius: 18, width: "100%", maxWidth: 960,
        maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>

        {/* header — bold red banner */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px", background: KFC_RED, borderRadius: "18px 18px 0 0" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: WHITE, letterSpacing: 0.4,
              textTransform: "uppercase" }}>🍗 Create New Order</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", marginTop: 2 }}>
              Walk-in or manual order entry
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
            border: "none", background: "rgba(255,255,255,.2)", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            color: WHITE, fontWeight: 700 }}>
            ✕
          </button>
        </div>

        <div className="com-grid" style={{ flex: 1, overflow: "hidden" }}>

          {/* LEFT: menu picker */}
          <div className="com-left-panel" style={{ padding: "16px 20px", borderRight: "1px solid rgba(0,0,0,.06)",
            display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>

            {/* Sticky search + category filter bar — stays pinned at the top
                of this scrolling panel instead of scrolling away with the
                item grid when the menu list is long. The negative margin
                cancels the parent's `gap` so this bar's own background
                covers that gap too (otherwise scrolled items would peek
                through the gap right below it). */}
            <div style={{
              position: "sticky", top: 0, zIndex: 2, background: KFC_CREAM,
              display: "flex", flexDirection: "column", gap: 12,
              paddingBottom: 12, marginBottom: -12,
              borderBottom: "1px solid rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: KFC_DARK, letterSpacing: 0.8,
                textTransform: "uppercase" }}>
                Select items
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items…" style={inp} />

              {/* category filter — horizontally scrollable so it never wraps
                  or overflows the modal, at any width */}
              <div style={{
                display: "flex", flexWrap: "nowrap", gap: 8,
                overflowX: "auto", WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none", paddingBottom: 2,
              }}>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCategoryFilter(c)} style={{
                    padding: "6px 16px", borderRadius: 20, cursor: "pointer",
                    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                    textTransform: "uppercase", letterSpacing: 0.3,
                    border: categoryFilter === c ? `2px solid ${KFC_RED}` : "1px solid rgba(0,0,0,.15)",
                    background: categoryFilter === c ? KFC_RED : WHITE,
                    color: categoryFilter === c ? WHITE : "#555",
                    boxShadow: categoryFilter === c ? "0 3px 10px rgba(200,16,46,.35)" : "none",
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {menuLoading ? (
              <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Loading menu…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12 }}>
                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24,
                    color: "#bbb", fontSize: 13 }}>
                    No items found
                  </div>
                )}
                {filtered.map((m) => {
                  const qty = getQty(m._id);
                  return (
                    <div key={m._id} style={{ display: "flex", flexDirection: "column", gap: 6,
                      padding: 10, borderRadius: 14, background: WHITE,
                      border: qty > 0 ? `2px solid ${KFC_RED}` : "1px solid rgba(0,0,0,.08)",
                      boxShadow: qty > 0 ? "0 6px 16px rgba(200,16,46,.18)" : "0 1px 4px rgba(0,0,0,.04)",
                      transition: "box-shadow .15s, border-color .15s" }}>
                      <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10,
                        background: "#f6efe6", display: "flex", alignItems: "center",
                        justifyContent: "center", overflow: "hidden" }}>
                        <ItemImage src={m.image} name={m.name} size={64} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.25, minHeight: 33,
                        color: KFC_DARK }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase",
                        letterSpacing: 0.4 }}>
                        {m.category}
                      </div>
                      <div style={{ fontWeight: 800, color: KFC_RED, fontSize: 15 }}>
                        ₹{m.price}
                      </div>
                      {qty === 0 ? (
                        <button onClick={() => addItem(m)} style={{ width: "100%", padding: "8px 0",
                          borderRadius: 20, background: KFC_RED, color: WHITE, border: "none",
                          cursor: "pointer", fontSize: 12, fontWeight: 800, letterSpacing: 0.6,
                          textTransform: "uppercase" }}>
                          Add
                        </button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: KFC_DARK, borderRadius: 20, padding: "4px 6px" }}>
                          <button onClick={() => removeItem(m._id)} style={{ width: 26, height: 26,
                            borderRadius: "50%", border: "none", background: WHITE,
                            color: KFC_DARK, cursor: "pointer", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                            −
                          </button>
                          <span style={{ fontWeight: 800, color: WHITE, fontSize: 14 }}>{qty}</span>
                          <button onClick={() => addItem(m)} style={{ width: 26, height: 26,
                            borderRadius: "50%", background: KFC_RED, color: WHITE, border: "none",
                            cursor: "pointer", fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: summary + details */}
          <div style={{ background: WHITE, padding: "16px 20px", display: "flex",
            flexDirection: "column", gap: 14, overflowY: "auto" }}>

            {/* order type */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: KFC_DARK, letterSpacing: 0.8,
                textTransform: "uppercase", marginBottom: 8 }}>Order type</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Dining", "Take Away"].map((t) => (
                  <button key={t} onClick={() => setOrderType(t)} style={{ flex: 1, padding: "9px 0",
                    borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                    border: orderType === t ? `2px solid ${KFC_RED}` : "1px solid rgba(0,0,0,.15)",
                    background: orderType === t ? KFC_RED : WHITE,
                    color: orderType === t ? WHITE : "#555" }}>
                    {t === "Dining" ? "🪑" : "🛍️"} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* payment method */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: KFC_DARK, letterSpacing: 0.8,
                textTransform: "uppercase", marginBottom: 8 }}>Payment method</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Cash", "Online"].map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)} style={{ flex: 1, padding: "9px 0",
                    borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                    border: paymentMethod === m ? `2px solid ${KFC_RED}` : "1px solid rgba(0,0,0,.15)",
                    background: paymentMethod === m ? KFC_RED : WHITE,
                    color: paymentMethod === m ? WHITE : "#555" }}>
                    {m === "Cash" ? "💵" : "💳"} {m}
                  </button>
                ))}
              </div>
            </div>

            {/* table number */}
            {orderType === "Dining" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: KFC_DARK, letterSpacing: 0.8,
                  textTransform: "uppercase", marginBottom: 8 }}>Table number</div>
                <input type="number" min={1} value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)} placeholder="e.g. 3" style={inp} />
              </div>
            )}

            {/* optional customer */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: KFC_DARK, letterSpacing: 0.8,
                textTransform: "uppercase", marginBottom: 8 }}>Customer (optional)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name" style={inp} />
                <input value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10} placeholder="Phone number" style={inp} />
              </div>
            </div>

            {/* cart summary */}
            <div style={{ background: KFC_CREAM, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: KFC_DARK, letterSpacing: 0.8,
                textTransform: "uppercase", marginBottom: 8 }}>🧾 Your order</div>

              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#ccc", fontSize: 13 }}>
                  No items added yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* item rows */}
                  {cart.map((c) => (
                    <div key={c.item._id} style={{ padding: "6px 0", borderBottom: "1px dashed rgba(0,0,0,.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span>{c.item.name} <span style={{ color: "#aaa" }}>×{c.qty}</span></span>
                        <span style={{ fontWeight: 700 }}>₹{c.item.price * c.qty}</span>
                      </div>
                      {/* Prep note — printed on the KOT */}
                      <input
                        value={c.notes || ""}
                        onChange={(e) => updateNotes(c.item._id, e.target.value)}
                        placeholder="📝 Note (e.g. no onions)…"
                        maxLength={200}
                        style={{ width: "100%", marginTop: 4, padding: "5px 8px", borderRadius: 6,
                          border: "1px solid rgba(0,0,0,.1)", fontSize: 11, outline: "none",
                          boxSizing: "border-box", background: "#fafafa" }}
                      />
                    </div>
                  ))}

                  {/* ── totals ── */}
                  {[
                    { l: "Subtotal", v: `₹${subtotal}`, c: "#888" },
                    ...(tax > 0
                      ? [{ l: `GST (${gstRate}%)`, v: `₹${tax}`, c: "#888" }]
                      : []),
                    ...(serviceChargeAmt > 0
                      ? [{
                          l: `Service Charge (₹${serviceChargePerItem} × ${chargeableQty} item${chargeableQty !== 1 ? "s" : ""})`,
                          v: `₹${serviceChargeAmt}`,
                          c: "#888",
                        }]
                      : []),

                  ].map((r) => (
                    <div key={r.l} style={{ fontSize: 12, color: r.c,
                      display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span>{r.l}</span>
                      <span>{r.v}</span>
                    </div>
                  ))}

                  {/* grand total */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800,
                    fontSize: 16, borderTop: `2px solid ${KFC_RED}`, paddingTop: 8, marginTop: 4 }}>
                    <span style={{ color: KFC_DARK }}>Total</span>
                    <span style={{ color: KFC_RED }}>₹{total}</span>
                  </div>

                  {/* ── charge info pill ── */}
                  {(serviceChargeAmt > 0 || tax > 0) && (
                    <div style={{ fontSize: 11, color: "#aaa", background: WHITE,
                      borderRadius: 8, padding: "6px 10px", marginTop: 4, lineHeight: 1.5 }}>
                      {serviceChargeAmt > 0 && (
                        <div>⚡ ₹{serviceChargePerItem}/item × {chargeableQty} = ₹{serviceChargeAmt} service charge</div>
                      )}
                      {tax > 0 && (
                        <div>🧾 {gstRate}% GST = ₹{tax}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* submit */}
            <button onClick={handleSubmit} disabled={loading || cart.length === 0}
              style={{ width: "100%", padding: "15px 0", borderRadius: 28, border: "none",
                background: loading || cart.length === 0 ? "#ccc" : KFC_RED, color: WHITE,
                fontWeight: 800, fontSize: 15, marginTop: "auto", letterSpacing: 0.4,
                textTransform: "uppercase", boxShadow: loading || cart.length === 0
                  ? "none" : "0 8px 20px rgba(200,16,46,.4)",
                cursor: loading || cart.length === 0 ? "not-allowed" : "pointer" }}>
              {loading ? "Placing order…" : `Place Order · ₹${total}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MODIFY ORDER MODAL — Admin edits an existing Placed/Preparing order's
// items. Reuses the same menu-fetch/service-charge/pricing-preview pattern
// as CreateOrderModal above; the actual save goes through
// updateOrderItemsAdmin, which recomputes subtotal/tax/service charge/total
// server-side via the same computeOrderPricing used everywhere else — this
// modal's live totals are a preview only, not the source of truth.
// ══════════════════════════════════════════════════════════════════════════════
const ModifyOrderModal = ({ order, onClose, onSaved }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  // Seeded from the order's current items — menuItem is the snapshotted
  // MenuItem _id (see server/models/Order.js item schema), which is exactly
  // what updateOrderItemsAdmin needs back as menuItemId.
  const [cart, setCart] = useState(() =>
    (order.items || []).map((it) => ({
      item: {
        _id: String(it.menuItem),
        name: it.name,
        price: it.price,
        category: it.category,
      },
      qty: it.qty,
      notes: it.notes || "",
    })),
  );
  const [saving, setSaving] = useState(false);
  const [serviceChargePerItem, setServiceChargePerItem] = useState(0);
  const [gstRate, setGstRate] = useState(0);
  const [serviceChargeCategoryNames, setServiceChargeCategoryNames] = useState([]);

  useEffect(() => {
    getMenu({})
      .then((r) => { setMenuItems(r.data || []); setMenuLoading(false); })
      .catch(() => setMenuLoading(false));

    getRestaurantProfile()
      .then((res) => {
        const p = res.data?.data || res.data;
        setServiceChargePerItem(p?.serviceCharge || 0);
        setGstRate(p?.gstRate || 0);
        setServiceChargeCategoryNames(
          (p?.serviceChargeCategories || [])
            .map((c) => (typeof c === "string" ? c : c?.name))
            .filter(Boolean)
            .map((n) => n.trim().toLowerCase()),
        );
      })
      .catch(() => {});
  }, []);

  const categories = [
    "All",
    ...new Set(
      menuItems
        .map((m) => (typeof m.category === "string" ? m.category.trim() : ""))
        .filter(Boolean),
    ),
  ];

  const filtered = menuItems.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "All" ||
        (typeof m.category === "string" ? m.category.trim() : "") === categoryFilter),
  );

  const getQty = (id) => cart.find((c) => c.item._id === id)?.qty || 0;

  const addItem = (item) =>
    setCart((p) => {
      const ex = p.find((c) => c.item._id === item._id);
      return ex
        ? p.map((c) => (c.item._id === item._id ? { ...c, qty: c.qty + 1 } : c))
        : [...p, { item, qty: 1, notes: "" }];
    });

  const decreaseItem = (id) =>
    setCart((p) => {
      const ex = p.find((c) => c.item._id === id);
      if (!ex) return p;
      return ex.qty === 1
        ? p.filter((c) => c.item._id !== id)
        : p.map((c) => (c.item._id === id ? { ...c, qty: c.qty - 1 } : c));
    });

  const removeItemEntirely = (id) => setCart((p) => p.filter((c) => c.item._id !== id));

  const subtotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
  const tax = Math.round(subtotal * (gstRate / 100));
  const chargeableQty = cart
    .filter((c) => isServiceChargeApplicable(c.item.category, serviceChargeCategoryNames))
    .reduce((s, c) => s + c.qty, 0);
  const serviceChargeAmt = serviceChargePerItem * chargeableQty;
  const total = subtotal + tax + serviceChargeAmt;

  const handleSave = async () => {
    if (!cart.length) return toast.error("Order must have at least one item");
    try {
      setSaving(true);
      const { data } = await updateOrderItemsAdmin(
        order._id,
        cart.map((c) => ({ menuItemId: c.item._id, qty: c.qty, notes: c.notes || "" })),
      );
      toast.success("Order updated");
      onSaved(data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        style={{
          background: WHITE, borderRadius: 18, width: "100%", maxWidth: 960,
          maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,.35)",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px", background: PINK, borderRadius: "18px 18px 0 0" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: WHITE }}>✏️ Modify Order</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", marginTop: 2 }}>
              {order.orderId} · {order.tableNo ? `Table ${order.tableNo}` : order.orderType} · {order.status}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
            border: "none", background: "rgba(255,255,255,.2)", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            color: WHITE, fontWeight: 700 }}>
            ✕
          </button>
        </div>

        <div className="com-grid" style={{ flex: 1, overflow: "hidden" }}>
          {/* LEFT: menu picker — reuses the same sticky search/category bar
              pattern as CreateOrderModal. */}
          <div className="com-left-panel" style={{ padding: "16px 20px", borderRight: "1px solid rgba(0,0,0,.06)",
            display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
            <div style={{
              position: "sticky", top: 0, zIndex: 2, background: WHITE,
              display: "flex", flexDirection: "column", gap: 12,
              paddingBottom: 12, marginBottom: -12,
              borderBottom: "1px solid rgba(0,0,0,.06)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: 0.8,
                textTransform: "uppercase" }}>
                Add items
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu items…" style={{
                  padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,.15)",
                  fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
                }} />
              <div style={{
                display: "flex", flexWrap: "nowrap", gap: 8,
                overflowX: "auto", WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none", paddingBottom: 2,
              }}>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCategoryFilter(c)} style={{
                    padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                    border: categoryFilter === c ? `1.5px solid ${PINK}` : "1px solid rgba(0,0,0,.15)",
                    background: categoryFilter === c ? PINK : WHITE,
                    color: categoryFilter === c ? WHITE : "#555",
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {menuLoading ? (
              <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Loading menu…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12 }}>
                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24,
                    color: "#bbb", fontSize: 13 }}>
                    No items found
                  </div>
                )}
                {filtered.map((m) => {
                  const qty = getQty(m._id);
                  return (
                    <div key={m._id} style={{ display: "flex", flexDirection: "column", gap: 6,
                      padding: 10, borderRadius: 14, background: "#fafafa",
                      border: qty > 0 ? `2px solid ${PINK}` : "1px solid rgba(0,0,0,.08)" }}>
                      <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10,
                        background: "#f0f0f0", display: "flex", alignItems: "center",
                        justifyContent: "center", overflow: "hidden" }}>
                        <ItemImage src={m.image} name={m.name} size={64} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25, minHeight: 33 }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase" }}>
                        {m.category}
                      </div>
                      <div style={{ fontWeight: 700, color: PINK, fontSize: 15 }}>
                        ₹{m.price}
                      </div>
                      {qty === 0 ? (
                        <button onClick={() => addItem(m)} style={{ width: "100%", padding: "8px 0",
                          borderRadius: 20, background: PINK, color: WHITE, border: "none",
                          cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                          Add
                        </button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "#222", borderRadius: 20, padding: "4px 6px" }}>
                          <button onClick={() => decreaseItem(m._id)} style={{ width: 26, height: 26,
                            borderRadius: "50%", border: "none", background: WHITE,
                            color: "#222", cursor: "pointer", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
                            −
                          </button>
                          <span style={{ fontWeight: 700, color: WHITE, fontSize: 14 }}>{qty}</span>
                          <button onClick={() => addItem(m)} style={{ width: 26, height: 26,
                            borderRadius: "50%", background: PINK, color: WHITE, border: "none",
                            cursor: "pointer", fontWeight: 700, fontSize: 16, lineHeight: 1 }}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: current order items + live totals */}
          <div style={{ background: WHITE, padding: "16px 20px", display: "flex",
            flexDirection: "column", gap: 14, overflowY: "auto" }}>
            <div style={{ background: "#fafafa", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 0.8,
                textTransform: "uppercase", marginBottom: 8 }}>🧾 Order items</div>

              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#ccc", fontSize: 13 }}>
                  No items — add at least one before saving
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {cart.map((c) => (
                    <div key={c.item._id} style={{ padding: "6px 0", borderBottom: "1px dashed rgba(0,0,0,.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                        <span>{c.item.name} <span style={{ color: "#aaa" }}>×{c.qty}</span></span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700 }}>₹{c.item.price * c.qty}</span>
                          <button
                            onClick={() => removeItemEntirely(c.item._id)}
                            title="Remove item"
                            style={{ border: "none", background: "none", color: "#c62828",
                              cursor: "pointer", fontSize: 13, padding: 2 }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {[
                    { l: "Subtotal", v: `₹${subtotal}`, c: "#888" },
                    ...(tax > 0
                      ? [{ l: `GST (${gstRate}%)`, v: `₹${tax}`, c: "#888" }]
                      : []),
                    ...(serviceChargeAmt > 0
                      ? [{
                          l: `Service Charge (₹${serviceChargePerItem} × ${chargeableQty} item${chargeableQty !== 1 ? "s" : ""})`,
                          v: `₹${serviceChargeAmt}`,
                          c: "#888",
                        }]
                      : []),
                  ].map((r) => (
                    <div key={r.l} style={{ fontSize: 12, color: r.c,
                      display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span>{r.l}</span>
                      <span>{r.v}</span>
                    </div>
                  ))}

                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700,
                    fontSize: 16, borderTop: `2px solid ${PINK}`, paddingTop: 8, marginTop: 4 }}>
                    <span>Total</span>
                    <span style={{ color: PINK }}>₹{total}</span>
                  </div>
                </div>
              )}
            </div>

            {/* actions */}
            <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: "13px 0", borderRadius: 28,
                  border: "1.5px solid rgba(0,0,0,.15)", background: WHITE, color: "#555",
                  fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || cart.length === 0}
                style={{ flex: 2, padding: "13px 0", borderRadius: 28, border: "none",
                  background: saving || cart.length === 0 ? "#ccc" : PINK, color: WHITE,
                  fontWeight: 700, fontSize: 14,
                  cursor: saving || cart.length === 0 ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ORDERS PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [typeF, setTypeF] = useState("All");
  const [payF, setPayF] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [modifyingOrder, setModifyingOrder] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;
  const [startDate, setStartDate] = useState(""); // e.g. "2025-06-01"
  const [endDate, setEndDate] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    total: 0, today: 0, revenue: 0, pending: 0, byStatus: {}, rangeCount: 0, rangeAmount: 0,
  });

  // Debounce the search box so typing doesn't fire a request per keystroke —
  // the filtering itself now happens server-side (see fetchOrders below).
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    // Page reset lives in this same timeout (not a separate effect) so it
    // fires once the search term actually settles, not on every keystroke —
    // every other filter below already resets the page inline in its own
    // onChange handler.
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Server-side pagination + filtering — previously this fetched up to
  // 10,000 full order documents and filtered/paginated them all in the
  // browser on every load. Now only the current page's rows are fetched.
  const fetchOrders = useCallback(() => {
    getAllOrders({
      page,
      limit: PER_PAGE,
      status: filter !== "All" ? filter : undefined,
      orderType: typeF !== "All" ? typeF : undefined,
      paymentStatus: payF !== "All" ? payF : undefined,
      search: debouncedSearch || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((r) => {
        setOrders(r.data?.orders || []);
        setTotalCount(r.data?.total || 0);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load orders");
        setLoading(false);
      });
  }, [page, filter, typeF, payF, debouncedSearch, startDate, endDate]);

  // Stat pills / per-status chip counts / date-range pill — computed in the
  // database (see adminController.getOrdersSummary) instead of by summing
  // the entire order list client-side.
  const fetchSummary = useCallback(() => {
    getOrdersSummary({
      orderType: typeF !== "All" ? typeF : undefined,
      search: debouncedSearch || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((r) => setSummary(r.data || {}))
      .catch(() => {});
  }, [typeF, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o)),
      );
      toast.success(`→ ${newStatus}`);
      fetchSummary();
    } catch {
      toast.error("Update failed");
    }
  };

  const handlePaymentStatusChange = async (id, newPaymentStatus) => {
    try {
      await updatePaymentStatus(id, newPaymentStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, paymentStatus: newPaymentStatus } : o)),
      );
      toast.success(`Payment → ${newPaymentStatus === "Pending" ? "Unpaid" : newPaymentStatus}`);
      fetchSummary();
    } catch {
      toast.error("Payment status update failed");
    }
  };

  const handlePaymentMethodChange = async (id, newPaymentMethod) => {
    try {
      await updateOrderPaymentMethod(id, newPaymentMethod);
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, paymentMethod: newPaymentMethod } : o)),
      );
      toast.success(`Payment method → ${newPaymentMethod}`);
    } catch {
      toast.error("Payment method update failed");
    }
  };

  const handleOrderCreated = () => {
    setPage(1);
    fetchOrders();
    fetchSummary();
  };

  const paginated = orders;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  const stats = {
    total: summary.total || 0,
    today: summary.today || 0,
    revenue: summary.revenue || 0,
    pending: summary.pending || 0,
  };
  const rangeStats = { count: summary.rangeCount || 0, amount: summary.rangeAmount || 0 };

  const clearFilters = () => {
    setSearch("");
    setFilter("All");
    setTypeF("All");
    setPayF("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters =
    search || filter !== "All" || typeF !== "All" || payF !== "All" || startDate || endDate;

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
          <div style={{ fontSize: 20, fontWeight: 500 }}>All orders</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 3 }}>
            Search, filter and manage every order
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "10px 22px",
            background: PINK,
            color: WHITE,
            border: "none",
            borderRadius: 25,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create Order
        </button>
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
          <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  }}
>
  <input
    type="date"
    value={startDate}
    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
    style={{
      padding: "9px 12px",
      borderRadius: 8,
      border: "0.5px solid rgba(0,0,0,.15)",
      fontSize: 13,
      background: WHITE,
      cursor: "pointer",
      color: startDate ? "#111" : "#aaa",
    }}
  />
  <span style={{ fontSize: 12, color: "#aaa" }}>to</span>
  <input
    type="date"
    value={endDate}
    min={startDate || undefined}
    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
    style={{
      padding: "9px 12px",
      borderRadius: 8,
      border: "0.5px solid rgba(0,0,0,.15)",
      fontSize: 13,
      background: WHITE,
      cursor: "pointer",
      color: endDate ? "#111" : "#aaa",
    }}
  />

  {/* totals for current range/filters */}
  {(startDate || endDate) && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        borderRadius: 20,
        background: "rgba(233,30,140,.07)",
        border: "0.5px solid rgba(233,30,140,.2)",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "#888" }}>
        📦 <b style={{ color: "#111" }}>{rangeStats.count}</b> order
        {rangeStats.count !== 1 ? "s" : ""}
      </span>
      <span style={{ color: "rgba(0,0,0,.15)" }}>|</span>
      <span style={{ color: "#888" }}>
        💰 <b style={{ color: PINK }}>
          ₹{Math.round(rangeStats.amount).toLocaleString()}
        </b>
      </span>
    </div>
  )}
</div>
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
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATUSES.map((s) => {
            const cnt =
              s === "All" ? summary.total || 0 : summary.byStatus?.[s] || 0;
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
        ) : orders.length === 0 ? (
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
                {Math.min(page * PER_PAGE, totalCount)}
              </span>{" "}
              of <span style={{ fontWeight: 500 }}>{totalCount}</span>{" "}
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
                       "Table",  
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
                          <td style={{ padding: "12px", fontWeight: 500, color: "#111", whiteSpace: "nowrap" }}>
  {o.tableNo ? (
    <span style={{
      background: "#fbeaf0",
      color: "#e91e8c",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
    }}>
      T{o.tableNo}
    </span>
  ) : (
    <span style={{ color: "#ccc", fontSize: 12 }}>—</span>
  )}
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
                            <td colSpan={11} style={{ padding: "4px 12px 16px" }}>
                              <OrderDetail
                                order={o}
                                onStatusChange={(id, s) => {
                                  handleStatusChange(id, s);
                                  setExpanded(null);
                                }}
                                onPaymentStatusChange={handlePaymentStatusChange}
                                onPaymentMethodChange={handlePaymentMethodChange}
                                onModify={setModifyingOrder}
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

      {/* Create order modal */}
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={handleOrderCreated}
        />
      )}

      {/* Modify order modal — Admin editing an existing Placed/Preparing order */}
      {modifyingOrder && (
        <ModifyOrderModal
          order={modifyingOrder}
          onClose={() => setModifyingOrder(null)}
          onSaved={(updated) => {
            // Updates the Admin UI immediately from the backend's
            // authoritative response, without waiting for the next poll —
            // other listeners (Admin Dashboard, Waiter) pick up the same
            // "order-status-updated" socket event the backend already emits.
            setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
            fetchSummary();
          }}
        />
      )}
    </>
  );
}
