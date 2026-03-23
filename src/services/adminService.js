// ─── src/services/adminService.js ────────────────────────────────────────────
import api from "./api.js";
export const getDashboard = () => api.get("/admin/dashboard");
export const getAllOrders = (params) => api.get("/admin/orders", { params });
export const updateOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, { status });
export const getAllUsers = (params) => api.get("/admin/users", { params });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
// src/services/adminService.js
export const getAllInvoices = () => api.get("admin/invoices/all");
export const updateInvoiceStatus = (id, status) =>
  api.patch(`/admin/invoices/${id}/status`, { status });
