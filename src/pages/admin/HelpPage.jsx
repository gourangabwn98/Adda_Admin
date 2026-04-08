import { useState } from "react";
import toast from "react-hot-toast";

// ── Styles injected once ───────────────────────────────────────────────────────
if (!document.getElementById("help-page-styles")) {
  const s = document.createElement("style");
  s.id = "help-page-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
    .hp * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
    @keyframes hp-slide { from { opacity:0; max-height:0; } to { opacity:1; max-height:400px; } }

    .hp-card {
      background: #fff;
      border: 1.5px solid rgba(0,0,0,.07);
      border-radius: 16px;
      padding: 24px;
    }
    .hp-input, .hp-textarea, .hp-select {
      width: 100%; padding: 11px 14px;
      border: 1.5px solid #ebebeb; border-radius: 10px;
      font-size: 14px; font-family: 'DM Sans', sans-serif;
      outline: none; background: #fff; color: #222;
      transition: border .15s;
    }
    .hp-input:focus, .hp-textarea:focus, .hp-select:focus {
      border-color: #e91e8c;
      box-shadow: 0 0 0 3px rgba(233,30,140,.08);
    }
    .hp-textarea { resize: vertical; min-height: 110px; }
    .hp-send-btn {
      width: 100%; padding: 12px;
      background: #e91e8c; color: #fff;
      border: none; border-radius: 12px;
      font-size: 14px; font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all .15s;
      box-shadow: 0 4px 16px rgba(233,30,140,.25);
    }
    .hp-send-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
    .hp-send-btn:disabled { opacity: .55; cursor: not-allowed; }

    .hp-contact-item {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 0; border-bottom: 1px solid #f5f5f5;
    }
    .hp-contact-item:last-child { border-bottom: none; }
    .hp-contact-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }

    .hp-link-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      cursor: pointer; transition: background .12s;
      text-decoration: none; color: #333; font-size: 13px;
    }
    .hp-link-item:hover { background: #fce4f3; color: #e91e8c; }
    .hp-link-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #e91e8c; flex-shrink: 0;
    }

    .hp-faq-item {
      border-bottom: 1px solid #f5f5f5; overflow: hidden;
    }
    .hp-faq-item:last-child { border-bottom: none; }
    .hp-faq-summary {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; cursor: pointer; user-select: none;
      font-size: 14px; font-weight: 500; color: #222; gap: 12px;
    }
    .hp-faq-summary:hover { color: #e91e8c; }
    .hp-faq-icon {
      width: 22px; height: 22px; border-radius: 50%;
      border: 1.5px solid #ddd; display: flex; align-items: center;
      justify-content: center; font-size: 13px; flex-shrink: 0;
      transition: all .2s;
    }
    .hp-faq-icon.open { background: #e91e8c; border-color: #e91e8c; color: #fff; transform: rotate(45deg); }
    .hp-faq-body {
      font-size: 13.5px; color: #666; line-height: 1.7;
      padding: 0 0 16px; display: none;
    }
    .hp-faq-body.open { display: block; animation: hp-slide .2s ease; }

    .hp-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 500;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    .hp-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      animation: spin .7s linear infinite;
      display: inline-block; margin-right: 6px;
    }
  `;
  document.head.appendChild(s);
}

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "How do I add a new chef?",
    a: "Go to the Chefs section → Click 'Add New Chef' → Enter the chef's name and phone number. They'll receive login credentials via SMS.",
  },
  {
    q: "Can chefs log in with their phone number?",
    a: "Yes. Chefs can log in using their registered 10-digit phone number without needing a separate password.",
  },
  {
    q: "How do I add new menu items?",
    a: "Navigate to Menu → Click 'Add Item' → Fill in the name, category, price, and upload an image. The item goes live immediately.",
  },
  {
    q: "How do I manage dining tables?",
    a: "Go to Tables → You can add, activate/deactivate, or delete tables. Click any table card to view its current order and update the status.",
  },
  {
    q: "How are invoices generated?",
    a: "Invoices are auto-generated when an order is marked as Delivered. You can view and mark them as Paid from the Tables or Invoices section.",
  },
  {
    q: "What if an order is placed by mistake?",
    a: "You can cancel an order from the order drawer by selecting Cancelled in the Update Order section. Cancelled orders won't appear on the floor plan.",
  },
];

// ── Quick links ───────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { icon: "🍽", label: "How to add menu items" },
  { icon: "🪑", label: "How to manage tables" },
  { icon: "📦", label: "How to handle orders" },
  { icon: "👨‍🍳", label: "How to create chef accounts" },
  { icon: "🧾", label: "How to generate invoices" },
  { icon: "📊", label: "How to read analytics" },
];

// ── FAQ accordion item ────────────────────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="hp-faq-item">
      <div className="hp-faq-summary" onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <div className={`hp-faq-icon${open ? " open" : ""}`}>+</div>
      </div>
      <div className={`hp-faq-body${open ? " open" : ""}`}>{a}</div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    topic: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSend = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Please fill in your name and message");
      return;
    }
    setSending(true);
    try {
      // Replace with your actual API call, e.g.:
      // await submitSupportQuery(form);
      await new Promise((r) => setTimeout(r, 1200)); // simulate
      toast.success("Query sent! We'll get back to you shortly.");
      setForm({ name: "", phone: "", topic: "", message: "" });
    } catch {
      toast.error("Failed to send query. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="hp"
      style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 60 }}
    >
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#111",
            marginBottom: 4,
          }}
        >
          Help & support
        </h1>
        <p style={{ fontSize: 13, color: "#aaa" }}>
          Get help from our team or browse common questions below
        </p>
      </div>

      {/* ── Hero band ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)",
          borderRadius: 18,
          padding: "28px 32px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,.7)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Powered by
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            Bengal Tech Solutions
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,.8)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📞</span>
            <a
              href="tel:7797233633"
              style={{
                color: "rgba(255,255,255,.9)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              +91 77972 33633
            </a>
            <span style={{ color: "rgba(255,255,255,.4)", margin: "0 4px" }}>
              ·
            </span>
            <span>Mon – Sat, 10 AM – 7 PM</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="tel:7797233633"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              background: "rgba(255,255,255,.15)",
              border: "1.5px solid rgba(255,255,255,.3)",
              borderRadius: 25,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              transition: "background .15s",
            }}
          >
            📞 Call us
          </a>
          <a
            href="https://wa.me/917797233633"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              background: "#25D366",
              border: "1.5px solid transparent",
              borderRadius: 25,
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            💬 WhatsApp
          </a>
        </div>
      </div>

      {/* ── Top row: Contact info + Quick links ──────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* Contact info */}
        <div className="hp-card">
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#111",
              marginBottom: 16,
            }}
          >
            Contact details
          </div>
          {[
            {
              icon: "📞",
              bg: "#fce4f3",
              label: "Phone",
              val: "+91 77972 33633",
              href: "tel:7797233633",
            },
            {
              icon: "✉️",
              bg: "#e6f1fb",
              label: "Email",
              val: "support@bengaltech.in",
              href: "mailto:support@bengaltech.in",
            },
            {
              icon: "💬",
              bg: "#e1f5ee",
              label: "WhatsApp",
              val: "+91 77972 33633",
              href: "https://wa.me/917797233633",
            },
            {
              icon: "🏢",
              bg: "#faeeda",
              label: "Company",
              val: "Bengal Tech Solutions",
              href: null,
            },
          ].map(({ icon, bg, label, val, href }) => (
            <div className="hp-contact-item" key={label}>
              <div className="hp-contact-icon" style={{ background: bg }}>
                {icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#aaa",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    style={{
                      fontSize: 14,
                      color: "#e91e8c",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    {val}
                  </a>
                ) : (
                  <div style={{ fontSize: 14, color: "#222", fontWeight: 500 }}>
                    {val}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="hp-card">
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#111",
              marginBottom: 14,
            }}
          >
            Quick guides
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {QUICK_LINKS.map(({ icon, label }) => (
              <div key={label} className="hp-link-item">
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>
                  {icon}
                </span>
                <div className="hp-link-dot" />
                <span>{label}</span>
                <span
                  style={{ marginLeft: "auto", color: "#ccc", fontSize: 12 }}
                >
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Send a query ─────────────────────────────────────────────────── */}
      <div className="hp-card" style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#111",
              marginBottom: 4,
            }}
          >
            Send us a query
          </div>
          <div style={{ fontSize: 13, color: "#aaa" }}>
            Describe your issue and our team will respond within 24 hours
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Your name *
            </div>
            <input
              className="hp-input"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Phone number
            </div>
            <input
              className="hp-input"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={10}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Topic
            </div>
            <select
              className="hp-select"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
            >
              <option value="">Select a topic…</option>
              <option value="order">Order management issue</option>
              <option value="table">Table / floor plan issue</option>
              <option value="menu">Menu management</option>
              <option value="invoice">Invoice / billing</option>
              <option value="chef">Chef accounts</option>
              <option value="technical">Technical / app issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div
              style={{
                fontSize: 12,
                color: "#aaa",
                marginBottom: 5,
                fontWeight: 500,
              }}
            >
              Message *
            </div>
            <textarea
              className="hp-textarea"
              placeholder="Describe your problem or question in detail…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              className="hp-send-btn"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? (
                <>
                  <span className="hp-spinner" />
                  Sending…
                </>
              ) : (
                "Send query →"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div className="hp-card">
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "#111",
            marginBottom: 4,
          }}
        >
          Frequently asked questions
        </div>
        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 18 }}>
          Quick answers to common questions
        </div>
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          marginTop: 32,
          fontSize: 12,
          color: "#ccc",
        }}
      >
        Built & maintained by{" "}
        <span style={{ color: "#e91e8c", fontWeight: 500 }}>
          Bengal Tech Solutions
        </span>
        {" · "}+91 77972 33633
      </div>
    </div>
  );
}
