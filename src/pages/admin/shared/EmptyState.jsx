// src/pages/admin/shared/EmptyState.jsx
export default function EmptyState({ msg = "No data found" }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#aaa" }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  );
}
