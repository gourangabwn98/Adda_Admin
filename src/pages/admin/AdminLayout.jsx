// src/pages/admin/AdminLayout.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { getDashboard } from "../../services/adminService.js";
import toast from "react-hot-toast";

import DashboardPage from "./DashboardPage.jsx";
import OrdersPage from "./OrdersPage.jsx";
import TablesPage from "./TablesPage.jsx";
import MenuAdminPage from "./MenuAdminPage.jsx";
import UsersPage from "./UsersPage.jsx";
import InvoicesPage from "./InvoicesPage.jsx";
import AnalyticsPage from "./AnalyticsPage.jsx";

import { PINK, W } from "./shared";

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "tables", label: "Table Status" },
  { id: "menu", label: "Menu Items" },
  { id: "users", label: "Users" },
  { id: "invoices", label: "Invoices" },
  { id: "analytics", label: "Revenue" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [page, setPage] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    getDashboard()
      .then((res) => {
        setDashboardData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load dashboard");
        setLoading(false);
      });
  }, [user, navigate]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: W,
          borderRight: "0.5px solid #eee",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 16px 14px",
            borderBottom: "0.5px solid #eee",
          }}
        >
          <div
            style={{
              color: PINK,
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 1,
            }}
          >
            আড্ডা
          </div>
          <div
            style={{
              color: "#bbb",
              fontSize: 10,
              letterSpacing: 3,
              marginTop: 2,
            }}
          >
            ADDA CAFE · ADMIN
          </div>
        </div>

        <div
          style={{
            padding: "12px 10px 4px",
            fontSize: 10,
            color: "#bbb",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Management
        </div>

        {NAV.map((n) => (
          <div
            key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 14px",
              borderRadius: 8,
              margin: "2px 8px",
              cursor: "pointer",
              fontSize: 13,
              background: page === n.id ? "#f5f5f5" : "transparent",
              color: page === n.id ? PINK : "#777",
              fontWeight: page === n.id ? 600 : 400,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "currentColor",
                flexShrink: 0,
              }}
            />
            {n.label}
          </div>
        ))}

        <div
          style={{
            marginTop: "auto",
            padding: "14px 16px",
            borderTop: "0.5px solid #eee",
            fontSize: 12,
            color: "#bbb",
          }}
        >
          Adda Cafe v1.0
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: 24,
          background: "#f8f8f8",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "100px 0", color: "#aaa" }}
          >
            Loading dashboard...
          </div>
        ) : (
          <>
            {page === "dashboard" && <DashboardPage data={dashboardData} />}
            {page === "orders" && <OrdersPage />}
            {/* {page === "tables" && (
              <TablesPage data={dashboardData?.tableOrders} />
            )} */}
            {page === "tables" && <TablesPage />}
            {page === "menu" && <MenuAdminPage />}
            {page === "users" && <UsersPage />}
            {page === "invoices" && (
              <InvoicesPage data={dashboardData?.recentOrders} />
            )}
            {page === "analytics" && <AnalyticsPage data={dashboardData} />}
          </>
        )}
      </main>
    </div>
  );
}
