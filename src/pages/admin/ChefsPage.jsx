import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllChefs,
  createChef,
  updateChefStatus,
  updateChefRole,
  deleteChef,
  getChefRevenue,
} from "../../services/adminService.js";

const PINK = "#e91e8c";
const WHITE = "rgb(216, 227, 232)";
// Must match server models/Chef.js STAFF_ROLES. Records created before roles
// existed have no role and are treated as Waiter by the server.
const STAFF_ROLES = ["Waiter", "Chef", "Manager", "Others"];

// Local calendar date as "YYYY-MM-DD" — same pattern as
// DashboardPage.jsx todayStr(), used as the revenue filter's default.
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

export default function ChefsPage() {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newChef, setNewChef] = useState({
    name: "",
    phone: "",
    status: "Active",
    role: "Waiter",
  });
  const [submitting, setSubmitting] = useState(false);
  // Waiter-wise daily revenue (Cash/Online), keyed by chefId.
  const [revenueByChef, setRevenueByChef] = useState({});
  const [revenueDate, setRevenueDate] = useState("");
  // Calendar filter for the Cash/Online/Total columns — defaults to today,
  // same default the backend already applies when no `date` is sent.
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const fetchChefs = useCallback(async () => {
    try {
      const res = await getAllChefs();
      setChefs(res.data?.chefs || []);
    } catch (err) {
      toast.error("Failed to load chefs");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await getChefRevenue({ date: selectedDate });
      const rows = res.data?.chefs || [];
      setRevenueByChef(Object.fromEntries(rows.map((r) => [r.chefId, r])));
      setRevenueDate(res.data?.date || "");
    } catch {
      // Non-fatal — the chef list itself still renders without revenue.
      setRevenueByChef({});
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchChefs();
  }, [fetchChefs]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const handleCreateChef = async () => {
    if (!newChef.name || !newChef.phone) {
      return toast.error("Name and Phone are required");
    }
    if (newChef.phone.length !== 10) {
      return toast.error("Phone number must be 10 digits");
    }

    setSubmitting(true);
    try {
      await createChef(newChef);
      toast.success("Chef account created successfully");
      setShowModal(false);
      setNewChef({ name: "", phone: "", status: "Active", role: "Waiter" });
      fetchChefs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create chef");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (chefId, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await updateChefStatus(chefId, newStatus);
      toast.success(`Chef status changed to ${newStatus}`);
      fetchChefs();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleRoleChange = async (chefId, role) => {
    try {
      await updateChefRole(chefId, role);
      toast.success(`Role changed to ${role}`);
      fetchChefs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteChef = async (chefId, name) => {
    if (!window.confirm(`Delete chef "${name}"?`)) return;

    try {
      await deleteChef(chefId);
      toast.success("Chef deleted");
      fetchChefs();
    } catch (err) {
      toast.error("Failed to delete chef");
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 100, color: "#aaa" }}>
        Loading chefs...
      </div>
    );

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            Chef Management
          </h1>
          <p style={{ color: "#666", marginTop: 4 }}>
            Create and manage chef accounts for login
            {revenueDate && ` · Daily revenue for ${revenueDate}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Revenue date filter — drives the Cash/Online/Total columns below */}
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              border: "0.5px solid rgba(0,0,0,.15)",
              fontSize: 13,
              cursor: "pointer",
            }}
          />
          {selectedDate !== todayStr() && (
            <button
              onClick={() => setSelectedDate(todayStr())}
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                border: `0.5px solid ${PINK}`,
                background: "white",
                color: PINK,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: PINK,
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 25,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add New Chef
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 12,
          border: "0.5px solid #eee",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f8f8" }}>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "left",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Chef Name
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "left",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Phone Number
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "left",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Role
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "right",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Cash {selectedDate === todayStr() ? "Today" : revenueDate}
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "right",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Online {selectedDate === todayStr() ? "Today" : revenueDate}
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "right",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Total {selectedDate === todayStr() ? "Today" : revenueDate}
              </th>
              <th
                style={{
                  padding: "14px 16px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#666",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {chefs.map((chef) => {
              const rev = revenueByChef[chef._id];
              return (
              <tr key={chef._id} style={{ borderTop: "0.5px solid #eee" }}>
                <td style={{ padding: "14px 16px", fontWeight: 500 }}>
                  {chef.name}
                </td>
                <td style={{ padding: "14px 16px", color: "#555" }}>
                  +91 {chef.phone}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <select
                    value={chef.role || "Waiter"}
                    onChange={(e) => handleRoleChange(chef._id, e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "0.5px solid #ddd",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background:
                        chef.status === "Active" ? "#EAF3DE" : "#FCEBEB",
                      color: chef.status === "Active" ? "#3B6D11" : "#A32D2D",
                    }}
                  >
                    {chef.status}
                  </span>
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right", color: "#555" }}>
                  ₹{Math.round(rev?.cash || 0).toLocaleString()}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right", color: "#555" }}>
                  ₹{Math.round(rev?.online || 0).toLocaleString()}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: PINK }}>
                  ₹{Math.round(rev?.total || 0).toLocaleString()}
                </td>
                <td style={{ padding: "14px 16px", textAlign: "center" }}>
                  <button
                    onClick={() => handleToggleStatus(chef._id, chef.status)}
                    style={{
                      marginRight: 8,
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "0.5px solid #ddd",
                      background: "white",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {chef.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDeleteChef(chef._id, chef.name)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "0.5px solid #c62828",
                      background: "#ffebee",
                      color: "#c62828",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
              );
            })}
            {chefs.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  style={{ padding: 40, textAlign: "center", color: "#aaa" }}
                >
                  No chefs added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Chef Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: WHITE,
              borderRadius: 16,
              width: 420,
              padding: 24,
            }}
          >
            <h3 style={{ margin: "0 0 20px 0" }}>Add New Chef</h3>

            <input
              placeholder="Chef Full Name"
              value={newChef.name}
              onChange={(e) => setNewChef({ ...newChef, name: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />

            <input
              type="tel"
              placeholder="Phone Number (10 digits)"
              maxLength={10}
              value={newChef.phone}
              onChange={(e) =>
                setNewChef({
                  ...newChef,
                  phone: e.target.value.replace(/\D/g, ""),
                })
              }
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />

            <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>
              Role
            </label>
            <select
              value={newChef.role}
              onChange={(e) => setNewChef({ ...newChef, role: e.target.value })}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 20,
                borderRadius: 8,
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: WHITE,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChef}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  background: PINK,
                  color: WHITE,
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {submitting ? "Creating..." : "Create Chef Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
