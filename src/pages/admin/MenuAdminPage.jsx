import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  getMenu,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../services/menuService.js";

const PINK = "#e91e8c";
const WHITE = "#fff";

// ── shared mini-components ─────────────────────────────────────────────────
const Badge = ({ label, type }) => {
  const MAP = {
    Ready: { bg: "#EAF3DE", color: "#3B6D11" },
    Preparing: { bg: "#FAEEDA", color: "#854F0B" },
    Cancelled: { bg: "#FCEBEB", color: "#A32D2D" },
  };
  const s = MAP[type] || { bg: "#f0f0f0", color: "#555" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
};

const CATEGORIES = ["Burger", "Biryani", "Pizza", "Wrap", "Rice", "Drinks"];
const TAGS = ["Veg", "Non Veg"];

const EMPTY_FORM = {
  name: "",
  price: "",
  originalPrice: "",
  description: "",
  category: "Burger",
  tag: "Veg",
  image: "🍔",
  categoryImage: "🍔",
  isAvailable: true,
  rating: 4.0,
};

// ── modal ──────────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onSaved }) {
  const isEdit = !!item?._id;
  const [form, setForm] = useState(
    isEdit
      ? { ...item, price: item.price, originalPrice: item.originalPrice || "" }
      : { ...EMPTY_FORM },
  );
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.price) return toast.error("Price is required");
    if (isNaN(Number(form.price))) return toast.error("Price must be a number");

    const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice
        ? Number(form.originalPrice)
        : undefined,
      rating: Number(form.rating) || 4.0,
    };

    try {
      setLoading(true);
      if (isEdit) {
        const { data } = await updateMenuItem(item._id, payload);
        toast.success("Item updated!");
        onSaved(data, "edit");
      } else {
        const { data } = await createMenuItem(payload);
        toast.success("Item created!");
        onSaved(data, "create");
      }
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  // field style
  const inp = {
    width: "100%",
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
  const sel = { ...inp, background: WHITE, cursor: "pointer" };
  const lbl = {
    fontSize: 12,
    color: "#666",
    display: "block",
    marginBottom: 5,
    fontWeight: 600,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: WHITE,
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 17 }}>
            {isEdit ? "Edit Menu Item" : "Add New Item"}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f0f0f0",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          {/* Name */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Item Name *</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Dunked Zinger Burger"
              style={inp}
            />
          </div>

          {/* Price */}
          <div>
            <label style={lbl}>Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="290"
              style={inp}
            />
          </div>

          {/* Original Price */}
          <div>
            <label style={lbl}>Original Price (₹)</label>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
              placeholder="440 (optional)"
              style={inp}
            />
          </div>

          {/* Category */}
          <div>
            <label style={lbl}>Category *</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              style={sel}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label style={lbl}>Tag *</label>
            <select
              value={form.tag}
              onChange={(e) => set("tag", e.target.value)}
              style={sel}
            >
              {TAGS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of the item…"
              rows={3}
              style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          {/* Image emoji */}
          <div>
            <label style={lbl}>Item Image (emoji)</label>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="🍔"
              style={inp}
            />
          </div>

          {/* Category Image emoji */}
          <div>
            <label style={lbl}>Category Image (emoji)</label>
            <input
              value={form.categoryImage}
              onChange={(e) => set("categoryImage", e.target.value)}
              placeholder="🍔"
              style={inp}
            />
          </div>

          {/* Rating */}
          <div>
            <label style={lbl}>Rating (1–5)</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => set("rating", e.target.value)}
              style={inp}
            />
          </div>

          {/* Available toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Available</label>
            <div
              onClick={() => set("isAvailable", !form.isAvailable)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                cursor: "pointer",
                position: "relative",
                background: form.isAvailable ? "#1D9E75" : "#ddd",
                transition: "background .2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: form.isAvailable ? 22 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: WHITE,
                  transition: "left .2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#888" }}>
              {form.isAvailable ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              border: "1px solid #ddd",
              borderRadius: 25,
              background: WHITE,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 2,
              padding: "11px",
              border: "none",
              borderRadius: 25,
              background: loading ? "#ccc" : PINK,
              color: WHITE,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {loading ? "Saving…" : isEdit ? "Update Item" : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────
export default function MenuAdminPage() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState(["All"]);
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "create" | item-object

  useEffect(() => {
    Promise.all([getMenu({}), getCategories()])
      .then(([m, c]) => {
        setItems(m.data || []);
        setCats(["All", ...(c.data || [])]);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load menu");
        setLoading(false);
      });
  }, []);

  const handleSaved = (saved, mode) => {
    if (mode === "create") setItems((p) => [saved, ...p]);
    else setItems((p) => p.map((i) => (i._id === saved._id ? saved : i)));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    try {
      await deleteMenuItem(id);
      setItems((p) => p.filter((i) => i._id !== id));
      toast.success("Item deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleAvail = async (item) => {
    try {
      const { data } = await updateMenuItem(item._id, {
        isAvailable: !item.isAvailable,
      });
      setItems((p) => p.map((i) => (i._id === data._id ? data : i)));
      toast.success(
        `${data.name} → ${data.isAvailable ? "Available" : "Hidden"}`,
      );
    } catch {
      toast.error("Update failed");
    }
  };

  const filtered = items.filter(
    (i) =>
      (selCat === "All" || i.category === selCat) &&
      i.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 500 }}>Menu Items</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
              Manage the café's food & beverage catalog
            </div>
          </div>
          <button
            onClick={() => setModal("create")}
            style={{
              background: PINK,
              color: WHITE,
              border: "none",
              borderRadius: 25,
              padding: "10px 22px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: WHITE,
          border: "0.5px solid #eee",
          borderRadius: 12,
          padding: 18,
        }}
      >
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name…"
            style={{
              flex: 1,
              minWidth: 200,
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
              outline: "none",
            }}
          />
          <select
            value={selCat}
            onChange={(e) => setSelCat(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
              background: WHITE,
              cursor: "pointer",
              minWidth: 160,
            }}
          >
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Summary counts */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Total Items",
              val: items.length,
              color: "#185FA5",
              bg: "#E6F1FB",
            },
            {
              label: "Available",
              val: items.filter((i) => i.isAvailable).length,
              color: "#3B6D11",
              bg: "#EAF3DE",
            },
            {
              label: "Hidden",
              val: items.filter((i) => !i.isAvailable).length,
              color: "#A32D2D",
              bg: "#FCEBEB",
            },
            {
              label: "Veg Items",
              val: items.filter((i) => i.tag === "Veg").length,
              color: "#3B6D11",
              bg: "#EAF3DE",
            },
            {
              label: "Non Veg Items",
              val: items.filter((i) => i.tag === "Non Veg").length,
              color: "#854F0B",
              bg: "#FAEEDA",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 8,
                padding: "8px 14px",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>
                {s.val}
              </span>
              <span style={{ fontSize: 11, color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "48px 0", color: "#aaa" }}
          >
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "48px 20px", color: "#aaa" }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
            <div>No items match your filters</div>
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
                    "Item",
                    "Category",
                    "Price",
                    "Tag",
                    "Rating",
                    "Available",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        color: "#888",
                        fontSize: 11,
                        fontWeight: 500,
                        borderBottom: "0.5px solid #eee",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    style={{ borderBottom: "0.5px solid #f5f5f5" }}
                  >
                    {/* Name + emoji */}
                    <td style={{ padding: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{item.image}</span>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.name}</div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#aaa",
                              marginTop: 1,
                            }}
                          >
                            {item.description?.slice(0, 40)}
                            {item.description?.length > 40 ? "…" : ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          background: "#f5f5f5",
                          padding: "3px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      >
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 600 }}>₹{item.price}</div>
                      {item.originalPrice && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#aaa",
                            textDecoration: "line-through",
                          }}
                        >
                          ₹{item.originalPrice}
                        </div>
                      )}
                    </td>

                    {/* Tag */}
                    <td style={{ padding: "12px" }}>
                      <Badge
                        label={item.tag || "—"}
                        type={item.tag === "Veg" ? "Ready" : "Preparing"}
                      />
                    </td>

                    {/* Rating */}
                    <td
                      style={{
                        padding: "12px",
                        color: "#BA7517",
                        fontWeight: 500,
                      }}
                    >
                      ★ {item.rating?.toFixed(1)}
                    </td>

                    {/* Available toggle */}
                    <td style={{ padding: "12px" }}>
                      <div
                        onClick={() => toggleAvail(item)}
                        title="Click to toggle"
                        style={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          cursor: "pointer",
                          position: "relative",
                          background: item.isAvailable ? "#1D9E75" : "#ddd",
                          transition: "background .2s",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 2,
                            left: item.isAvailable ? 20 : 2,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: WHITE,
                            transition: "left .2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setModal(item)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 8,
                            border: "0.5px solid #ddd",
                            background: WHITE,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 8,
                            border: "0.5px solid #f9a8a8",
                            background: WHITE,
                            color: "#A32D2D",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ItemModal
          item={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
