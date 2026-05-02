import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mesob_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminService = {
  // Dashboard
  getDashboardMetrics: async () => {
    const response = await api.get("/admin/dashboard/metrics");
    return response.data.data;
  },

  // Users
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.role) params.append("role", filters.role);
    if (filters.region) params.append("region", filters.region);
    if (filters.center) params.append("center", filters.center);
    if (filters.status) params.append("status", filters.status);
    if (filters.verification) params.append("verification", filters.verification);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  // Centers
  getCenters: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.region) params.append("region", filters.region);
    if (filters.status) params.append("status", filters.status);
    if (filters.city) params.append("city", filters.city);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await api.get(`/admin/centers?${params}`);
    return response.data;
  },

  // Appointments
  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.region) params.append("region", filters.region);
    if (filters.center) params.append("center", filters.center);
    if (filters.status) params.append("status", filters.status);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await api.get(`/admin/appointments?${params}`);
    return response.data;
  },

  // Vitals
  getVitals: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.region) params.append("region", filters.region);
    if (filters.center) params.append("center", filters.center);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.bmiCategory) params.append("bmiCategory", filters.bmiCategory);
    if (filters.bpCategory) params.append("bpCategory", filters.bpCategory);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await api.get(`/admin/vitals?${params}`);
    return response.data;
  },

  // Feedback
  getFeedback: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.region) params.append("region", filters.region);
    if (filters.center) params.append("center", filters.center);
    if (filters.npsScore !== undefined) params.append("npsScore", filters.npsScore);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.feedbackType) params.append("feedbackType", filters.feedbackType);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await api.get(`/admin/feedback?${params}`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.region) params.append("region", filters.region);
    if (filters.center) params.append("center", filters.center);
    if (filters.user) params.append("user", filters.user);
    if (filters.action) params.append("action", filters.action);
    if (filters.resource) params.append("resource", filters.resource);
    if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.append("dateTo", filters.dateTo);
    if (filters.page) params.append("page", filters.page);
    if (filters.limit) params.append("limit", filters.limit);

    const response = await api.get(`/admin/audit-logs?${params}`);
    return response.data;
  },

  // Regions (for filter dropdowns)
  getRegions: async () => {
    try {
      const response = await api.get("/admin/regions");
      return response.data.data || [];
    } catch (err) {
      console.error("Error fetching regions:", err);
      return [];
    }
  },

  // Centers by region
  getCentersByRegion: async (region) => {
    try {
      const response = await api.get(`/admin/regions/${region}/centers`);
      return response.data.data || [];
    } catch (err) {
      console.error("Error fetching centers by region:", err);
      return [];
    }
  },

  // Create center
  createCenter: async (centerData) => {
    try {
      const response = await api.post("/admin/centers", centerData);
      return response.data.data;
    } catch (err) {
      console.error("Error creating center:", err);
      throw err;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (err) {
      console.error("Error deleting user:", err);
      throw err;
    }
  },

  // Delete center
  deleteCenter: async (centerId) => {
    try {
      const response = await api.delete(`/centers/${centerId}`);
      return response.data;
    } catch (err) {
      console.error("Error deleting center:", err);
      throw err;
    }
  },

  // Delete appointment
  deleteAppointment: async (appointmentId) => {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`);
      return response.data;
    } catch (err) {
      console.error("Error deleting appointment:", err);
      throw err;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data.data;
    } catch (err) {
      console.error("Error updating user:", err);
      throw err;
    }
  },

  // Update center
  updateCenter: async (centerId, centerData) => {
    try {
      const response = await api.put(`/centers/${centerId}`, centerData);
      return response.data.data;
    } catch (err) {
      console.error("Error updating center:", err);
      throw err;
    }
  },

  // Update appointment
  updateAppointment: async (appointmentId, appointmentData) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, appointmentData);
      return response.data.data;
    } catch (err) {
      console.error("Error updating appointment:", err);
      throw err;
    }
  },
};
