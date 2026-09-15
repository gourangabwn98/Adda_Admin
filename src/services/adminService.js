// ─── src/services/adminService.js ────────────────────────────────────────────
import api from "./api.js";
export const getDashboard = () => api.get("/admin/dashboard");
export const getAllOrders = (params) => api.get("/admin/orders", { params });
export const updateOrderStatus = (id, status) =>
  api.put(`/admin/orders/${id}/status`, { status });
// "Unpaid" in the UI maps to the existing "Pending" paymentStatus value —
// there's no separate "Unpaid" enum value in the Order schema.
export const updatePaymentStatus = (id, paymentStatus) =>
  api.put(`/admin/orders/${id}/status`, { paymentStatus });
export const updateOrderPaymentMethod = (id, paymentMethod) =>
  api.put(`/admin/orders/${id}/status`, { paymentMethod });
// Pending-confirmation requests (see orderRoutes.js, not under /admin/*)
export const acceptOrderRequest = (id) => api.put(`/orders/${id}/accept`);
export const declineOrderRequest = (id, reason) =>
  api.put(`/orders/${id}/decline`, { reason });
export const getAllUsers = (params) => api.get("/admin/users", { params });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
// src/services/adminService.js
export const getAllInvoices = () => api.get("admin/invoices/all");
export const updateInvoiceStatus = (id, status) =>
  api.patch(`/admin/invoices/${id}/status`, { status });

// ── NEW TABLE MANAGEMENT APIs ─────────────────────────────────────
// export const getAllTables = () => api.get("admin/tables");

// export const createTable = (data) => api.post("admin/tables", data);

// export const updateTable = (tableNo, data) =>
//   api.put(`admin/tables/${tableNo}`, data);

// export const deleteTable = (tableNo) => api.delete(`admin/tables/${tableNo}`);
// ── tables ────────────────────────────────────────────────────────────────────
export const getAllTables = () => api.get("/admin/tables");
export const getTableByNo = (tableNo) => api.get(`/admin/tables/${tableNo}`);
export const createTable = (data) => api.post("/admin/tables", data);
export const updateTable = (tableNo, d) =>
  api.put(`/admin/tables/${tableNo}`, d);
export const deleteTable = (tableNo) => api.delete(`/admin/tables/${tableNo}`);
export const regenerateQR = (tableNo) =>
  api.post(`/admin/tables/${tableNo}/regenerate-qr`);

//for chef

export const getAllChefs = () => api.get("admin/chefs");
// Waiter-wise daily revenue (Cash/Online), grouped by Chef — see
// server/controllers/chefController.js getChefRevenue. `params` may include
// `date` (YYYY-MM-DD, defaults to today) and/or `chefId` (scope to one).
export const getChefRevenue = (params) => api.get("admin/chefs/revenue", { params });
export const createChef = (data) => api.post("admin/chefs", data);
export const updateChefStatus = (id, status) =>
  api.patch(`admin/chefs/${id}/status`, { status });
export const deleteChef = (id) => api.delete(`admin/chefs/${id}`);

//admin profile

// export const getRestaurantProfile = () => api.get("admin/restaurant/profile");
// export const updateRestaurantProfile = (data) =>
//   api.put("admin/restaurant/profile", data);
// export const uploadRestaurantLogo = (formData) =>
//   api.post("admin/restaurant/logo", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// ── Restaurant Profile ─────────────────────────────────────────────────────
export const getRestaurantProfile    = ()       => api.get("admin/restaurant/profile");
export const updateRestaurantProfile = (data)   => api.put("admin/restaurant/profile", data);
export const uploadRestaurantLogo    = (formData) =>
  api.post("admin/restaurant/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Banners ────────────────────────────────────────────────────────────────
export const uploadRestaurantBanner = (formData) =>
  api.post("admin/restaurant/banner", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateRestaurantBanner = (bannerId, data) =>
  api.patch(`admin/restaurant/banner/${bannerId}`, data);
export const deleteRestaurantBanner = (bannerId) =>
  api.delete(`admin/restaurant/banner/${bannerId}`);

// ── Printer IPs ────────────────────────────────────────────────────────────
export const addRestaurantPrinter    = (data)       => api.post("admin/restaurant/printer", data);
export const updateRestaurantPrinter = (id, data)   => api.patch(`admin/restaurant/printer/${id}`, data);
export const deleteRestaurantPrinter = (id)         => api.delete(`admin/restaurant/printer/${id}`);