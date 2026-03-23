// src/pages/admin/shared/Badge.jsx
import { STATUS_STYLE } from "./constants";

export default function Badge({ label, type }) {
  const s = STATUS_STYLE[label] ||
    STATUS_STYLE[type] || { bg: "#eee", color: "#555" };

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
}
