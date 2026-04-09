import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllOrders,
  updateOrderStatus,
  getAllInvoices,
  updateInvoiceStatus,
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateQR,
} from "../../services/adminService.js";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const PINK = "#e91e8c";
const PINK_LIGHT = "#fce4f3";
const PINK_DARK = "#c2185b";
const GREEN = "#1D9E75";
const GREEN_LIGHT = "#e6f7ee";
const WHITE = "#fff";
const SURFACE = "#fafafa";
const BORDER = "rgba(0,0,0,.07)";

const STATUS_STYLE = {
  Empty: {
    bg: "transparent",
    border: "rgba(0,0,0,.15)",
    tc: "#b0aca6",
    label: "Free",
  },
  Placed: { bg: "#dbeeff", border: "#378ADD", tc: "#185FA5", label: "Placed" },
  Preparing: {
    bg: "#fff3e0",
    border: "#BA7517",
    tc: "#854F0B",
    label: "Preparing",
  },
  Ready: { bg: "#e6f7ee", border: "#1D9E75", tc: "#276749", label: "Ready" },
  Delivered: {
    bg: "#e6f7ee",
    border: "#1D9E75",
    tc: "#276749",
    label: "Delivered",
  },
  Completed: { bg: "#f0f0f0", border: "#aaa", tc: "#666", label: "Completed" },
  Cancelled: {
    bg: "#ffebeb",
    border: "#E24B4A",
    tc: "#A32D2D",
    label: "Cancelled",
  },
};

const ACTIVE_STATUSES = ["Placed", "Preparing", "Ready", "Delivered"];
const ALL_STATUSES = [
  "Placed",
  "Preparing",
  "Ready",
  "Delivered",
  "Completed",
  "Cancelled",
];

// ── Global Styles ─────────────────────────────────────────────────────────────
if (!document.getElementById("tables-page-styles")) {
  const s = document.createElement("style");
  s.id = "tables-page-styles";
  s.textContent = `
    @keyframes blinkBorder {
      0%,100%{ box-shadow:0 0 0 0 rgba(211,47,47,0); border-color:#d32f2f; }
      50%     { box-shadow:0 0 0 5px rgba(211,47,47,.25); border-color:#ff1744; }
    }
    @keyframes slideUp {
      from{ opacity:0; transform:translateY(18px); }
      to  { opacity:1; transform:translateY(0); }
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes pulseGreen {
      0%,100%{ box-shadow:0 0 0 0 rgba(29,158,117,0); }
      50%    { box-shadow:0 0 0 5px rgba(29,158,117,.22); }
    }
    @keyframes spin { to{transform:rotate(360deg)} }
    .tables-root *{ box-sizing:border-box; font-family:'DM Sans',sans-serif; }
    .blink-pending { animation:blinkBorder 1.4s ease-in-out infinite; }
    .pulse-live    { animation:pulseGreen 2s ease-in-out infinite; }
    .drawer-enter  { animation:slideUp .22s cubic-bezier(.4,0,.2,1) both; }
    .table-card-hover:hover{ transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.1); }
    .btn-ghost{ background:none; border:1px solid rgba(0,0,0,.07); border-radius:8px;
      padding:6px 14px; font-size:12px; cursor:pointer; color:#555; transition:all .15s; }
    .btn-ghost:hover{ background:#f5f5f5; border-color:#ccc; }
    .status-btn{ padding:5px 13px; border-radius:20px; font-size:11.5px; font-weight:500;
      cursor:pointer; transition:all .15s; border:1.5px solid transparent; }
    .status-btn:hover{ filter:brightness(.93); transform:scale(1.03); }
    .status-btn:disabled{ opacity:.45; cursor:not-allowed; }
    .modal-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000;
      display:flex; align-items:center; justify-content:center;
      animation:fadeIn .18s ease both; backdrop-filter:blur(2px); }
    .modal-box{ background:#fff; border-radius:20px; padding:28px;
      box-shadow:0 24px 64px rgba(0,0,0,.18); animation:slideUp .22s cubic-bezier(.4,0,.2,1) both; }
    .input-field{ width:100%; padding:11px 14px; border-radius:10px; border:1.5px solid #e0e0e0;
      font-size:14px; outline:none; transition:border .15s; }
    .input-field:focus{ border-color:${PINK}; }
    .tag{ display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
      border-radius:20px; font-size:11px; font-weight:500; }
    .spinner{ width:18px; height:18px; border:2.5px solid rgba(255,255,255,.3);
      border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
    .qr-btn{ display:flex; align-items:center; justify-content:center; gap:6px;
      padding:9px 16px; border-radius:10px; font-size:12px; font-weight:500;
      cursor:pointer; transition:all .15s; border:1.5px solid; }
    .qr-btn:hover{ filter:brightness(.94); transform:translateY(-1px); }
    @media print {
      body > *:not(#qr-print-area){ display:none !important; }
      #qr-print-area{ display:block !important; }
    }
  `;
  document.head.appendChild(s);
}

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QRModal({ table, onClose, onRegenerate }) {
  const [regen, setRegen] = useState(false);
  const [qrData, setQrData] = useState({
    code: table.qrCode,
    url: table.qrUrl,
  });

  const handleRegenerate = async () => {
    try {
      setRegen(true);
      const { data } = await onRegenerate(table.tableNo);
      setQrData({ code: data.qrCode, url: data.qrUrl });
      toast.success("QR regenerated!");
    } catch {
      toast.error("Regenerate failed");
    } finally {
      setRegen(false);
    }
  };

  const handleDownload = () => {
    if (!qrData.code) return;
    const a = document.createElement("a");
    a.href = qrData.code;
    a.download = `adda-table-${table.tableNo}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    // inject print-only div
    let el = document.getElementById("qr-print-area");
    if (!el) {
      el = document.createElement("div");
      el.id = "qr-print-area";
      document.body.appendChild(el);
    }
    el.style.display = "none";
    el.innerHTML = `
      <div style="text-align:center;padding:40px;font-family:sans-serif">
        <div style="font-size:28px;font-weight:800;color:#e91e8c;margin-bottom:4px">আড্ডা</div>
        <div style="font-size:13px;letter-spacing:3px;color:#888;margin-bottom:20px">ADDA CAFE</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:4px">Table ${table.tableNo}</div>
        <div style="font-size:13px;color:#888;margin-bottom:24px">${table.seats} seats · Scan to order</div>
        <img src="${qrData.code}" style="width:220px;height:220px;border:2px solid #e91e8c;border-radius:12px;padding:8px"/>
        <div style="margin-top:20px;font-size:11px;color:#aaa;word-break:break-all;max-width:300px;margin-left:auto;margin-right:auto">${qrData.url}</div>
        <div style="margin-top:24px;font-size:11px;color:#ccc">Scan QR code to place your order instantly</div>
      </div>
    `;
    window.print();
  };

  const handleCopyUrl = () => {
    if (!qrData.url) return;
    navigator.clipboard.writeText(qrData.url);
    toast.success("Link copied!");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ width: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
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
            <div style={{ fontWeight: 600, fontSize: 17 }}>
              QR Code — Table {table.tableNo}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>
              {table.seats} seats · {table.status || "Active"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1.5px solid #eee",
              background: SURFACE,
              cursor: "pointer",
              fontSize: 14,
              color: "#888",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* QR image */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          {qrData.code ? (
            <div
              style={{
                display: "inline-block",
                padding: 14,
                borderRadius: 16,
                border: `2px solid ${PINK}22`,
                background: "#fafafa",
              }}
            >
              <img
                src={qrData.code}
                alt={`QR Table ${table.tableNo}`}
                style={{
                  width: 200,
                  height: 200,
                  display: "block",
                  borderRadius: 8,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 200,
                height: 200,
                margin: "0 auto",
                borderRadius: 16,
                background: "#f5f5f5",
                border: "2px dashed #ddd",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ccc",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>⬛</div>
              <div style={{ fontSize: 12 }}>No QR yet</div>
            </div>
          )}

          {/* table label under QR */}
          <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>
            Table {table.tableNo}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            Scan to order instantly
          </div>
        </div>

        {/* URL strip */}
        {qrData.url && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 18,
              padding: "10px 12px",
              background: "#f8f8f8",
              borderRadius: 10,
              border: "1px solid #eee",
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 11,
                color: "#888",
                wordBreak: "break-all",
                fontFamily: "monospace",
                lineHeight: 1.4,
              }}
            >
              {qrData.url}
            </div>
            <button
              onClick={handleCopyUrl}
              className="btn-ghost"
              style={{ flexShrink: 0, fontSize: 11, padding: "5px 10px" }}
            >
              Copy
            </button>
          </div>
        )}

        {/* action buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <button
            onClick={handleDownload}
            disabled={!qrData.code}
            className="qr-btn"
            style={{
              background: PINK_LIGHT,
              color: PINK_DARK,
              borderColor: `${PINK}44`,
              opacity: !qrData.code ? 0.5 : 1,
            }}
          >
            ↓ Download PNG
          </button>
          <button
            onClick={handlePrint}
            disabled={!qrData.code}
            className="qr-btn"
            style={{
              background: "#f0f4ff",
              color: "#1a56db",
              borderColor: "#c7d7f8",
              opacity: !qrData.code ? 0.5 : 1,
            }}
          >
            🖨 Print QR
          </button>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regen}
          className="qr-btn"
          style={{
            width: "100%",
            background: "#f8f8f8",
            color: "#555",
            borderColor: "#ddd",
            opacity: regen ? 0.6 : 1,
          }}
        >
          {regen ? (
            <>
              <span
                className="spinner"
                style={{ borderTopColor: "#555", borderColor: "#ccc" }}
              />{" "}
              Regenerating…
            </>
          ) : (
            "↻ Regenerate QR"
          )}
        </button>

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#bbb",
            textAlign: "center",
          }}
        >
          Regenerating changes the QR image but keeps the same URL
        </div>
      </div>
    </div>
  );
}

// ── Chair ─────────────────────────────────────────────────────────────────────
const Chair = ({ pos, occupied }) => {
  const isHoriz = pos === "top" || pos === "bottom";
  return (
    <div
      style={{
        background: occupied ? PINK_LIGHT : WHITE,
        border: `1.5px solid ${occupied ? PINK : "rgba(0,0,0,.16)"}`,
        transition: "all .2s",
        flexShrink: 0,
        borderRadius: isHoriz
          ? pos === "top"
            ? "5px 5px 0 0"
            : "0 0 5px 5px"
          : pos === "left"
            ? "5px 0 0 5px"
            : "0 5px 5px 0",
        width: isHoriz ? 20 : 11,
        height: isHoriz ? 11 : 20,
      }}
    />
  );
};

// ── TableCard ─────────────────────────────────────────────────────────────────
const TableCard = ({
  config,
  order,
  invoice,
  onClick,
  isSelected,
  tableStatus,
  onToggleStatus,
  onDelete,
  onQR,
}) => {
  const status = order ? order.status : "Empty";
  const s = STATUS_STYLE[status] || STATUS_STYLE.Empty;
  const occ = !!(order && ACTIVE_STATUSES.includes(status));
  const is4 = config.seats >= 4;
  const isPending = invoice?.invoiceStatus?.toLowerCase() === "pending";
  const isActive = tableStatus === "Active";
  const w = is4 ? 78 : 64;
  const h = is4 ? 64 : 52;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        position: "relative",
      }}
    >
      {/* active pill */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          padding: "2px 8px",
          borderRadius: 20,
          marginBottom: 2,
          background: isActive ? GREEN_LIGHT : "#f0f0f0",
          color: isActive ? GREEN : "#999",
          border: `1px solid ${isActive ? "#b2dfdb" : "#e0e0e0"}`,
        }}
      >
        {isActive ? "Active" : "Inactive"}
      </div>

      {/* top chairs */}
      <div style={{ display: "flex", gap: 8 }}>
        <Chair pos="top" occupied={occ} />
        {is4 && <Chair pos="top" occupied={occ} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {is4 && <Chair pos="left" occupied={occ} />}

        {/* table body */}
        <div
          onClick={onClick}
          className={`table-card-hover ${isPending ? "blink-pending" : ""}`}
          style={{
            width: w,
            height: h,
            borderRadius: 12,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: isPending ? "#fff0f5" : isSelected ? PINK_LIGHT : s.bg,
            border: `2px solid ${isSelected ? PINK : isPending ? "#d32f2f" : s.border}`,
            transform: isSelected ? "scale(1.07)" : "scale(1)",
            boxShadow: isSelected
              ? `0 0 0 4px ${PINK}22, 0 4px 16px rgba(233,30,140,.15)`
              : "0 2px 8px rgba(0,0,0,.05)",
            transition: "all .18s cubic-bezier(.4,0,.2,1)",
            opacity: isActive ? 1 : 0.55,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isPending ? "#d32f2f" : isSelected ? PINK_DARK : s.tc,
              fontFamily: "'DM Mono',monospace",
              letterSpacing: 0.5,
            }}
          >
            T{config.id}
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: isPending ? "#d32f2f" : isSelected ? PINK : s.tc,
              marginTop: 1,
            }}
          >
            {isPending ? "Pay Due" : s.label}
          </div>
          {order && ACTIVE_STATUSES.includes(order.status) && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isPending ? "#d32f2f" : PINK,
                marginTop: 3,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              ₹{Math.round(order.total).toLocaleString()}
            </div>
          )}
        </div>

        {is4 && <Chair pos="right" occupied={occ} />}
      </div>

      {/* bottom chairs */}
      <div style={{ display: "flex", gap: 8 }}>
        <Chair pos="bottom" occupied={occ} />
        {is4 && <Chair pos="bottom" occupied={occ} />}
      </div>

      {/* action strip — now includes QR button */}
      <div
        style={{
          display: "flex",
          gap: 5,
          marginTop: 6,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQR(config.id);
          }}
          className="btn-ghost"
          style={{
            fontSize: 11,
            padding: "4px 10px",
            color: PINK,
            borderColor: `${PINK}44`,
            background: PINK_LIGHT,
          }}
        >
          QR
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(config.id);
          }}
          className="btn-ghost"
          style={{
            fontSize: 11,
            padding: "4px 10px",
            color: isActive ? "#c62828" : GREEN,
            borderColor: isActive ? "#ffcdd2" : "#b2dfdb",
          }}
        >
          {isActive ? "Off" : "On"}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(config.id);
          }}
          className="btn-ghost"
          style={{
            fontSize: 11,
            padding: "4px 10px",
            color: "#c62828",
            borderColor: "#ffcdd2",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// ── OrderDrawer (unchanged) ───────────────────────────────────────────────────
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
  const handleInvoiceStatus = async (ns) => {
    if (!invoice?._id) return;
    if (!window.confirm(`Mark invoice as "${ns}"?`)) return;
    try {
      setInvUpdating(true);
      await onInvoiceStatusChange(invoice._id, ns);
    } finally {
      setInvUpdating(false);
    }
  };

  return (
    <div
      className="drawer-enter"
      style={{
        background: WHITE,
        border: `1.5px solid ${isPending ? "#fca5a5" : BORDER}`,
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
        boxShadow: isPending
          ? "0 4px 32px rgba(211,47,47,.08)"
          : "0 4px 24px rgba(0,0,0,.05)",
        ...(isPending ? { background: "#fffbfb" } : {}),
      }}
    >
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
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontFamily: "'DM Mono',monospace", color: PINK }}>
              T{config.id}
            </span>
            <span style={{ fontSize: 13, color: "#aaa", fontWeight: 400 }}>
              · {config.seats} seats
            </span>
            {isPending && (
              <span
                className="tag"
                style={{
                  background: "#ffebee",
                  color: "#c62828",
                  border: "1px solid #ffcdd2",
                }}
              >
                ⚠ Invoice Pending
              </span>
            )}
          </div>
          {order && (
            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                marginTop: 5,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {order.orderId}
              {order.user?.name && (
                <span
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    marginLeft: 8,
                    color: "#888",
                  }}
                >
                  · {order.user.name}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1.5px solid #e8e8e8",
            background: SURFACE,
            cursor: "pointer",
            fontSize: 14,
            color: "#888",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      {!order ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#ccc" }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>○</div>
          <div style={{ fontSize: 14, color: "#aaa" }}>Table is free</div>
          <div style={{ fontSize: 12, marginTop: 4, color: "#ccc" }}>
            {config.seats} seats available
          </div>
        </div>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#bbb",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Order Items
            </div>
            {order.items?.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 0",
                  borderBottom: "1px solid #f5f5f5",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: PINK_LIGHT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 600,
                      color: PINK,
                      fontFamily: "'DM Mono',monospace",
                    }}
                  >
                    {item.qty}
                  </div>
                  <span style={{ color: "#333" }}>{item.name}</span>
                </div>
                <span
                  style={{ fontWeight: 500, fontFamily: "'DM Mono',monospace" }}
                >
                  ₹{(item.price * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1.5px solid #f0f0f0",
              }}
            >
              {[
                { l: "Subtotal", v: `₹${subtotal.toLocaleString()}` },
                { l: "GST (18%)", v: `₹${tax.toLocaleString()}` },
              ].map((r) => (
                <div
                  key={r.l}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#aaa",
                    marginBottom: 6,
                  }}
                >
                  <span>{r.l}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace" }}>
                    {r.v}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  fontSize: 16,
                  marginTop: 10,
                }}
              >
                <span>Total</span>
                <span
                  style={{
                    color: isPending ? "#d32f2f" : PINK,
                    fontFamily: "'DM Mono',monospace",
                  }}
                >
                  ₹{Math.round(order.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#bbb",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Current Status
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <span
                className="tag"
                style={{
                  background: s.bg,
                  color: s.tc,
                  border: `1.5px solid ${s.border}`,
                }}
              >
                {order.status}
              </span>
              <span
                className="tag"
                style={{
                  background: "#FBEAF0",
                  color: "#993556",
                  border: "1.5px solid #f5b8d0",
                }}
              >
                Dining
              </span>
              <span
                className="tag"
                style={{
                  background:
                    order.paymentStatus === "Paid" ? GREEN_LIGHT : "#fff3e0",
                  color: order.paymentStatus === "Paid" ? "#276749" : "#854F0B",
                  border: `1.5px solid ${order.paymentStatus === "Paid" ? "#a5d6a7" : "#ffcc80"}`,
                }}
              >
                {order.paymentStatus}
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#bbb",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Update Order
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 22,
              }}
            >
              {ALL_STATUSES.filter((st) => st !== order.status).map((st) => {
                const stl = STATUS_STYLE[st] || {
                  bg: "#f0f0f0",
                  border: "#aaa",
                  tc: "#555",
                };
                return (
                  <button
                    key={st}
                    className="status-btn"
                    onClick={() => handleStatus(st)}
                    disabled={updating}
                    style={{
                      background: stl.bg,
                      borderColor: stl.border,
                      color: stl.tc,
                    }}
                  >
                    {updating ? <span className="spinner" /> : st}
                  </button>
                );
              })}
            </div>

            {invoice ? (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#bbb",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Invoice
                </div>
                <div
                  style={{
                    background: isPending ? "#fff0f5" : GREEN_LIGHT,
                    border: `1.5px solid ${isPending ? "#fca5a5" : "#a5d6a7"}`,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  {[
                    {
                      l: "Invoice ID",
                      v: `…${invoice._id?.slice(-8)}`,
                      mono: true,
                    },
                    {
                      l: "Amount",
                      v: `₹${Math.round(invoice.total || order.total).toLocaleString()}`,
                      mono: true,
                    },
                  ].map((r) => (
                    <div
                      key={r.l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginBottom: 8,
                        color: "#555",
                      }}
                    >
                      <span style={{ color: "#aaa" }}>{r.l}</span>
                      <span
                        style={{
                          fontWeight: 500,
                          fontFamily: r.mono
                            ? "'DM Mono',monospace"
                            : undefined,
                        }}
                      >
                        {r.v}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#aaa" }}>Status</span>
                    <span
                      className="tag"
                      style={{
                        background: isPending ? "#ffebee" : GREEN_LIGHT,
                        color: isPending ? "#c62828" : "#276749",
                        border: `1px solid ${isPending ? "#ffcdd2" : "#a5d6a7"}`,
                        textTransform: "capitalize",
                      }}
                    >
                      {invoice.invoiceStatus}
                    </span>
                  </div>
                </div>
                {isPending && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleInvoiceStatus("completed")}
                      disabled={invUpdating}
                      style={{
                        flex: 1,
                        padding: "11px",
                        background: "#2e7d32",
                        color: WHITE,
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 13,
                        opacity: invUpdating ? 0.5 : 1,
                      }}
                    >
                      {invUpdating ? (
                        <span className="spinner" />
                      ) : (
                        "✓ Mark Paid"
                      )}
                    </button>
                    <button
                      onClick={() => handleInvoiceStatus("cancelled")}
                      disabled={invUpdating}
                      style={{
                        flex: 1,
                        padding: "11px",
                        background: "#c62828",
                        color: WHITE,
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 13,
                        opacity: invUpdating ? 0.5 : 1,
                      }}
                    >
                      {invUpdating ? <span className="spinner" /> : "✕ Cancel"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  background: "#f8f8f8",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 12,
                  color: "#bbb",
                  textAlign: "center",
                  border: "1px dashed #e0e0e0",
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

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, val, color }) => (
  <div
    style={{
      background: WHITE,
      borderRadius: 12,
      padding: "14px 18px",
      border: `1.5px solid ${BORDER}`,
      boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    }}
  >
    <div
      style={{
        fontSize: 22,
        fontWeight: 600,
        color: color || "#111",
        fontFamily: "'DM Mono',monospace",
      }}
    >
      {val}
    </div>
    <div
      style={{
        fontSize: 11,
        color: "#aaa",
        marginTop: 3,
        fontWeight: 500,
        letterSpacing: 0.3,
      }}
    >
      {label}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [tableMap, setTableMap] = useState({});
  const [invoiceMap, setInvoiceMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // create modal
  const [showModal, setShowModal] = useState(false);
  const [newTableNo, setNewTableNo] = useState("");
  const [newSeats, setNewSeats] = useState("4");
  const [creating, setCreating] = useState(false);

  // QR modal
  const [qrTable, setQrTable] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [ordersRes, invoicesRes, tablesRes] = await Promise.all([
        getAllOrders({ limit: 100 }),
        getAllInvoices().catch(() => ({ data: { invoices: [] } })),
        getAllTables().catch(() => ({ data: { tables: [] } })),
      ]);
      const orders = ordersRes?.data?.orders || [];
      const invoices = invoicesRes?.data?.invoices || [];
      const dbTables = tablesRes?.data?.tables || [];

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

      const iMap = {};
      invoices.forEach((inv) => {
        const orderIds = inv.orders?.map(String) || [];
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

      setTables(dbTables);
      setTableMap(oMap);
      setInvoiceMap(iMap);
    } catch {
      setError("Failed to load table data");
      toast.error("Could not load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
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

  const handleToggleStatus = async (tableNo) => {
    const tbl = tables.find((t) => t.tableNo === tableNo);
    if (!tbl) return;
    const ns = tbl.status === "Active" ? "Inactive" : "Active";
    try {
      await updateTable(tableNo, { status: ns });
      toast.success(`Table ${tableNo} → ${ns}`);
      fetchData();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (tableNo) => {
    if (!window.confirm(`Delete Table ${tableNo} permanently?`)) return;
    try {
      await deleteTable(tableNo);
      toast.success(`Table ${tableNo} deleted`);
      fetchData();
      if (selected === tableNo) setSelected(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete");
    }
  };

  const handleCreate = async () => {
    if (!newTableNo) return toast.error("Table number is required");
    setCreating(true);
    try {
      await createTable({
        tableNo: parseInt(newTableNo),
        seats: parseInt(newSeats),
      });
      toast.success(`Table ${newTableNo} created with QR!`);
      setShowModal(false);
      setNewTableNo("");
      await fetchData();
      // auto-open QR for the new table
      const res = await getAllTables();
      const created = (res.data?.tables || []).find(
        (t) => t.tableNo === parseInt(newTableNo),
      );
      if (created) setQrTable(created);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerate = async (tableNo) => {
    const { data } = await regenerateQR(tableNo);
    // update local tables state too
    setTables((p) =>
      p.map((t) =>
        t.tableNo === tableNo
          ? { ...t, qrCode: data.qrCode, qrUrl: data.qrUrl }
          : t,
      ),
    );
    return { data };
  };

  const activeTables = tables.filter((t) => t.status === "Active" || !t.status);
  const occupied = activeTables.filter((t) => tableMap[t.tableNo]).length;
  const revenue = Object.values(tableMap).reduce(
    (s, o) => s + Number(o.total || 0),
    0,
  );
  const pendingCount = Object.values(invoiceMap).filter(
    (i) => i.invoiceStatus?.toLowerCase() === "pending",
  ).length;
  const selectedConf = selected
    ? tables.find((t) => t.tableNo === selected)
    : null;
  const selectedOrder = selected ? tableMap[selected] || null : null;
  const selectedInv = selected ? invoiceMap[selected] || null : null;

  if (loading)
    return (
      <div
        className="tables-root"
        style={{ textAlign: "center", padding: "100px", color: "#ccc" }}
      >
        <div
          className="spinner"
          style={{
            width: 32,
            height: 32,
            borderWidth: 3,
            borderColor: "rgba(233,30,140,.2)",
            borderTopColor: PINK,
            margin: "0 auto 16px",
          }}
        />
        <div style={{ fontSize: 14 }}>Loading floor plan…</div>
      </div>
    );
  if (error)
    return (
      <div
        className="tables-root"
        style={{ textAlign: "center", padding: "80px", color: "#c62828" }}
      >
        <div style={{ fontSize: 16, marginBottom: 14 }}>{error}</div>
        <button
          onClick={fetchData}
          style={{
            padding: "10px 28px",
            background: PINK,
            color: WHITE,
            border: "none",
            borderRadius: 25,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="tables-root">
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
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>
            Table Management
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#aaa",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>Adda Cafe — Dining Floor</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                className="pulse-live"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: GREEN,
                  display: "inline-block",
                }}
              />
              <span style={{ color: GREEN, fontWeight: 500 }}>Live</span>
              <span style={{ color: "#ccc" }}>· every 30s</span>
            </span>
            {pendingCount > 0 && (
              <span
                className="tag blink-pending"
                style={{
                  background: "#ffebee",
                  color: "#c62828",
                  border: "1px solid #ffcdd2",
                  fontSize: 11,
                }}
              >
                {pendingCount} invoice{pendingCount > 1 ? "s" : ""} pending
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "10px 22px",
            background: PINK,
            color: WHITE,
            border: "none",
            borderRadius: 25,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13,
            boxShadow: `0 4px 16px ${PINK}44`,
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = PINK_DARK;
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = PINK;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          + New Table
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 10,
          marginBottom: 22,
        }}
      >
        <StatCard label="Occupied" val={occupied} color={PINK} />
        <StatCard
          label="Free"
          val={activeTables.length - occupied}
          color={GREEN}
        />
        <StatCard
          label="Active Revenue"
          val={`₹${Math.round(revenue).toLocaleString()}`}
        />
        <StatCard label="Total Tables" val={tables.length} />
        <StatCard
          label="Pending Invoices"
          val={pendingCount}
          color={pendingCount > 0 ? "#c62828" : GREEN}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
          padding: "10px 16px",
          background: WHITE,
          borderRadius: 10,
          border: `1.5px solid ${BORDER}`,
        }}
      >
        {[
          { label: "Free", bg: WHITE, border: "rgba(0,0,0,.18)" },
          { label: "Placed", bg: "#dbeeff", border: "#378ADD" },
          { label: "Preparing", bg: "#fff3e0", border: "#BA7517" },
          { label: "Ready", bg: GREEN_LIGHT, border: GREEN },
          {
            label: "Invoice pending",
            bg: "#fff0f5",
            border: "#d32f2f",
            blink: true,
          },
          { label: "Occupied chair", bg: PINK_LIGHT, border: PINK },
        ].map((l) => (
          <div
            key={l.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#888",
            }}
          >
            <div
              className={l.blink ? "blink-pending" : ""}
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: l.bg,
                border: `1.5px solid ${l.border}`,
              }}
            />
            {l.label}
          </div>
        ))}
      </div>

      {/* Floor plan */}
      <div
        style={{
          background: "#f7f5f1",
          borderRadius: 18,
          padding: 32,
          border: "1.5px solid rgba(0,0,0,.07)",
          boxShadow: "inset 0 2px 12px rgba(0,0,0,.03)",
        }}
      >
        <div
          style={{
            height: 6,
            background: "rgba(0,0,0,.16)",
            borderRadius: "4px 4px 0 0",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            padding: "12px 0 16px",
            borderBottom: "1px dashed rgba(0,0,0,.1)",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 20,
                borderRadius: 3,
                background: "rgba(200,225,255,.6)",
                border: "1.5px solid rgba(0,0,0,.15)",
                ...(i === 1 ? { marginRight: 18 } : {}),
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#bbb",
            letterSpacing: 2,
            textTransform: "uppercase",
            textAlign: "center",
            padding: "10px 0 20px",
          }}
        >
          Window side
        </div>

        {tables.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "48px 20px", color: "#ccc" }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>🪑</div>
            <div style={{ fontSize: 14 }}>No tables yet</div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                marginTop: 12,
                padding: "10px 24px",
                background: PINK,
                color: WHITE,
                border: "none",
                borderRadius: 25,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add First Table
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 40,
              justifyContent: "center",
              paddingBottom: 28,
            }}
          >
            {tables
              .sort((a, b) => a.tableNo - b.tableNo)
              .map((t) => (
                <TableCard
                  key={t.tableNo}
                  config={{ id: t.tableNo, seats: t.seats }}
                  order={tableMap[t.tableNo] || null}
                  invoice={invoiceMap[t.tableNo] || null}
                  onClick={() =>
                    setSelected(selected === t.tableNo ? null : t.tableNo)
                  }
                  isSelected={selected === t.tableNo}
                  tableStatus={t.status || "Active"}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                  onQR={() => setQrTable(t)}
                />
              ))}
          </div>
        )}

        <div
          style={{
            width: "100%",
            height: 1,
            margin: "0 0 18px",
            background:
              "repeating-linear-gradient(90deg,rgba(0,0,0,.1) 0,rgba(0,0,0,.1) 8px,transparent 8px,transparent 16px)",
          }}
        />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 10,
              color: "#bbb",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Counter &amp; Entrance
          </div>
          <div
            style={{
              width: 40,
              height: 6,
              background: "rgba(0,0,0,.22)",
              borderRadius: 3,
              margin: "0 auto",
            }}
          />
        </div>
      </div>

      {/* Order Drawer */}
      {selected && selectedConf && (
        <OrderDrawer
          config={{ id: selectedConf.tableNo, seats: selectedConf.seats }}
          order={selectedOrder}
          invoice={selectedInv}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onInvoiceStatusChange={handleInvoiceStatusChange}
        />
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-box"
            style={{ width: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Add New Table
            </div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 22 }}>
              A QR code will be generated automatically.
            </div>
            <label
              style={{
                fontSize: 12,
                color: "#888",
                fontWeight: 500,
                display: "block",
                marginBottom: 6,
              }}
            >
              Table Number
            </label>
            <input
              type="number"
              placeholder="e.g. 9"
              value={newTableNo}
              onChange={(e) => setNewTableNo(e.target.value)}
              className="input-field"
              style={{ marginBottom: 14 }}
            />
            <label
              style={{
                fontSize: 12,
                color: "#888",
                fontWeight: 500,
                display: "block",
                marginBottom: 6,
              }}
            >
              Seating Capacity
            </label>
            <select
              value={newSeats}
              onChange={(e) => setNewSeats(e.target.value)}
              className="input-field"
              style={{ marginBottom: 24 }}
            >
              <option value="2">2 Seats</option>
              <option value="4">4 Seats</option>
              <option value="6">6 Seats</option>
            </select>

            {/* QR info note */}
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 14px",
                background: "#fce4f3",
                borderRadius: 10,
                marginBottom: 20,
                border: `1px solid ${PINK}22`,
              }}
            >
              <span style={{ fontSize: 20 }}>⬛</span>
              <div style={{ fontSize: 12, color: "#993556", lineHeight: 1.5 }}>
                A unique QR code linking to{" "}
                <strong>Table {newTableNo || "?"}</strong>'s order page will be
                auto-generated. You can download or print it after creation.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost"
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  background: PINK,
                  color: WHITE,
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                  opacity: creating ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {creating ? (
                  <>
                    <span className="spinner" />
                    Creating…
                  </>
                ) : (
                  "Create + QR"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrTable && (
        <QRModal
          table={qrTable}
          onClose={() => setQrTable(null)}
          onRegenerate={handleRegenerate}
        />
      )}
    </div>
  );
}
