import api from './api';

export const analyticsService = {

  // ─── System Settings ────────────────────────────────────────────────────────
  async getSystemSettings() {
    const response = await api.get('/api/v1/analytics/settings');
    return response.data;
  },

  async updateSystemSettings(settings) {
    const response = await api.put('/api/v1/analytics/settings', settings);
    return response.data;
  },

  // ─── Capacity ───────────────────────────────────────────────────────────────
  async getCapacityInfo(date) {
    const params = date ? { date } : {};
    const response = await api.get('/api/v1/analytics/capacity', { params });
    return response.data;
  },

  // ─── Booking Stats ──────────────────────────────────────────────────────────
  async getBookingStats(date) {
    const params = date ? { date } : {};
    const response = await api.get('/api/v1/analytics/appointments/stats', { params });
    return response.data;
  },

  // ─── Queue Analytics ────────────────────────────────────────────────────────
  async getQueueAnalytics() {
    const response = await api.get('/api/v1/analytics/queue/analytics');
    return response.data;
  },

  // ─── Health Analytics ───────────────────────────────────────────────────────
  async getHealthAnalytics() {
    const response = await api.get('/api/v1/analytics/health/analytics');
    return response.data;
  },

  // ─── Staff Users ────────────────────────────────────────────────────────────
  async getStaffUsers() {
    const response = await api.get('/api/v1/analytics/users/staff');
    return response.data;
  },

  async createStaffUser(userData) {
    const response = await api.post('/api/v1/analytics/users/staff', userData);
    return response.data;
  },

  async updateStaffUser(userId, userData) {
    const response = await api.put(`/api/v1/analytics/users/${userId}`, userData);
    return response.data;
  },

  async toggleUserStatus(userId) {
    const response = await api.patch(`/api/v1/analytics/users/${userId}/toggle`);
    return response.data;
  },

  // ─── Audit Logs ─────────────────────────────────────────────────────────────
  async getAuditLogs(limit = 50) {
    const response = await api.get('/api/v1/analytics/audit-logs', { params: { limit } });
    return response.data;
  },

  // ─── Trends (daily / weekly / monthly) ──────────────────────────────────────
  async getTrends() {
    const response = await api.get('/api/v1/analytics/trends');
    return response.data;
  },
};
