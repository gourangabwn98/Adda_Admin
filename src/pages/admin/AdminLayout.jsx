// src/pages/admin/AdminLayout.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  getDashboard,
  getRestaurantProfile,
} from "../../services/adminService.js";
import toast from "react-hot-toast";

import DashboardPage from "./DashboardPage.jsx";
import OrdersPage from "./OrdersPage.jsx";
import TablesPage from "./TablesPage.jsx";
import MenuAdminPage from "./MenuAdminPage.jsx";
import UsersPage from "./UsersPage.jsx";
import InvoicesPage from "./InvoicesPage.jsx";
import AnalyticsPage from "./AnalyticsPage.jsx";
import ChefsPage from "./ChefsPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import HelpPage from "./HelpPage.jsx";

import { PINK, W } from "./shared";

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", group: "main" },
  { id: "orders", label: "Orders", icon: "📦", group: "main" },
  { id: "tables", label: "Table Status", icon: "🪑", group: "main" },
  { id: "menu", label: "Menu Items", icon: "🍽", group: "main" },
  { id: "chefs", label: "Chefs", icon: "👨‍🍳", group: "main" },
  { id: "users", label: "Users", icon: "👥", group: "main" },
  { id: "invoices", label: "Invoices", icon: "🧾", group: "main" },
  { id: "analytics", label: "Revenue", icon: "📊", group: "main" },
  { id: "profile", label: "Profile", icon: "⚙️", group: "settings" },
  { id: "help", label: "Help & Support", icon: "❓", group: "settings" },
];

// ── Inject styles once ────────────────────────────────────────────────────────
if (!document.getElementById("admin-layout-styles")) {
  const s = document.createElement("style");
  s.id = "admin-layout-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'DM Sans', sans-serif; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 10px; margin: 1px 8px;
      cursor: pointer; font-size: 13px; font-weight: 400; color: #777;
      transition: all .15s; user-select: none;
    }
    .nav-item:hover  { background: #f5f5f5; color: #333; }
    .nav-item.active { background: #fce4f3; color: ${PINK}; font-weight: 500; }
    .nav-icon {
      width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0; transition: background .15s;
    }
    .nav-item.active .nav-icon { background: #f9c8e0; }
    .nav-item:hover  .nav-icon { background: #f0f0f0; }
    .nav-group-label {
      padding: 12px 20px 4px; font-size: 10px; color: #bbb;
      letter-spacing: 1.2px; text-transform: uppercase; font-weight: 500;
    }
    .sidebar-logo-img {
  width: 104px;
  height: 44px;
  // border-radius: 12px;
  object-fit: cover;
  // border: 2px solid #fce4f3;
  flex-shrink: 0;
}
    .logout-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; margin: 4px 8px; border-radius: 10px;
      font-size: 13px; color: #c62828; cursor: pointer;
      transition: background .15s; border: none; background: none;
      width: calc(100% - 16px); font-family: 'DM Sans', sans-serif;
    }
    .logout-btn:hover { background: #ffebee; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(s);
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [page, setPage] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    Promise.all([getDashboard(), getRestaurantProfile()])
      .then(([dashRes, profileRes]) => {
        setDashboardData(dashRes.data);
        const p = profileRes?.data?.data || profileRes?.data;
        setRestaurant(p || null);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  // ── Sign out — ask for confirmation first ──────────────────────────────────
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to sign out?")) return;
    logout?.();
    navigate("/login");
  };

  const rName = restaurant?.restaurantName || "Adda Cafe";
  const rLogo = restaurant?.logo || "";
  const rCity = restaurant?.city || "";

  const mainNav = NAV.filter((n) => n.group === "main");
  const settingsNav = NAV.filter((n) => n.group === "settings");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 230,
          background: "#fff",
          borderRight: "1px solid rgba(0,0,0,.06)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand header */}
        <div
          style={{
            padding: "18px 16px 14px",
            borderBottom: "1px solid rgba(0,0,0,.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/*
              Logo: only renders the <img> when a URL exists.
              onError hides it if the image fails to load.
              No letter/text fallback — nothing shows if empty or broken.
            */}
            {rLogo && (
              <img
                src={rLogo}
                alt={rName}
                className="sidebar-logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
        </div>

        {/* Main nav */}
        <div className="nav-group-label">Management</div>
        {mainNav.map((n) => (
          <div
            key={n.id}
            className={`nav-item${page === n.id ? " active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            <div className="nav-icon">{n.icon}</div>
            {n.label}
          </div>
        ))}

        {/* Settings nav */}
        <div className="nav-group-label" style={{ marginTop: 8 }}>
          Settings
        </div>
        {settingsNav.map((n) => (
          <div
            key={n.id}
            className={`nav-item${page === n.id ? " active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            <div className="nav-icon">{n.icon}</div>
            {n.label}
          </div>
        ))}

        {/* Push footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* User info + sign out */}
        <div
          style={{
            borderTop: "1px solid rgba(0,0,0,.06)",
            padding: "10px 8px 8px",
          }}
        >
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#fce4f3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  color: PINK,
                  flexShrink: 0,
                }}
              >
                {(user.name || user.email || "A").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#333",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name || "Admin"}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#bbb",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.email || user.phone || ""}
                </div>
              </div>
            </div>
          )}

          <button className="logout-btn" onClick={handleLogout}>
            <span style={{ fontSize: 15 }}>⎋</span>
            Sign out
          </button>

          <div style={{ padding: "6px 12px", fontSize: 10, color: "#ddd" }}>
            Adda Cafe v1.0 · Bengal Tech
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          padding: 24,
          background: "#f8f8f8",
          overflowY: "auto",
          minHeight: "100vh",
        }}
      >
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "100px 0", color: "#aaa" }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid rgba(233,30,140,.15)",
                borderTopColor: PINK,
                animation: "spin .7s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ fontSize: 14 }}>Loading dashboard…</div>
          </div>
        ) : (
          <>
            {page === "dashboard" && <DashboardPage data={dashboardData} />}
            {page === "orders" && <OrdersPage />}
            {page === "tables" && <TablesPage />}
            {page === "menu" && <MenuAdminPage />}
            {page === "chefs" && <ChefsPage />}
            {page === "users" && <UsersPage />}
            {page === "invoices" && (
              <InvoicesPage data={dashboardData?.recentOrders} />
            )}
            {page === "analytics" && <AnalyticsPage data={dashboardData} />}
            {page === "profile" && <ProfilePage />}
            {page === "help" && <HelpPage />}
          </>
        )}
      </main>
    </div>
  );
}
