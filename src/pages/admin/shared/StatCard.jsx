// src/pages/admin/shared/StatCard.jsx
import { STAT_COLORS } from "./constants";

export default function StatCard({ label, value, sub, colorIdx = 0 }) {
  return (
    <div
      style={{ background: "#f5f5f5", borderRadius: 8, padding: "14px 16px" }}
    >
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: STAT_COLORS[colorIdx % STAT_COLORS.length],
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}
