// ─── src/services/menuService.js ─────────────────────────────────────────────
import api from "./api.js";
export const getMenu = (params) => api.get("/menu", { params });
export const getCategories = () => api.get("/menu/categories");
// Admin operations (require JWT token)
export const createMenuItem = (data) => api.post("/menu", data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);
