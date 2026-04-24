import api from './api';

export const analyticsService = {
  // System Settings
  async getSystemSettings() {
    const response = await api.get('/api/v1/analytics/settings');
    return response.data;
  },

  async updateSystemSettings(settings) {
    const response = await api.put('/api/v1/analytics/settings', settings);
    return response.data;
  },

  // Capacity Management
  async getCapacityInfo(date) {
    const params = date ? { date } : {};
    const response = await api.get('/api/v1/analytics/capacity', { params });
    return response.data;
  },

  // Booking Statistics
  async getBookingStats(date) {
    const params = date ? { date } : {};
    const response = await api.get('/api/v1/analytics/appointments/stats', { params });
    return response.data;
  },

  // Queue Analytics
  async getQueueAnalytics() {
    const response = await api.get('/api/v1/analytics/queue/analytics');
    return response.data;
  },

  // Health Analytics
  async getHealthAnalytics() {
    const response = await api.get('/api/v1/analytics/health/analytics');
    return response.data;
  },

  // Staff Performance
  async getStaffPerformance() {
    const response = await api.get('/api/v1/analytics/staff/performance');
    return response.data;
  },

  // Audit Trail
  async getAuditTrail(limit = 50) {
    const response = await api.get('/api/v1/analytics/audit-trail', {
      params: { limit }
    });
    return response.data;
  },

  // Reports
  async generateReport(startDate, endDate, reportType = 'custom') {
    const response = await api.post('/api/v1/analytics/reports/generate', {
      startDate,
      endDate,
      reportType
    });
    return response.data;
  },

  async generateMonthlyReport(year, month) {
    const response = await api.get(`/api/v1/analytics/reports/monthly/${year}/${month}`);
    return response.data;
  },

  async generateQuarterlyReport(year, quarter) {
    const response = await api.get(`/api/v1/analytics/reports/quarterly/${year}/${quarter}`);
    return response.data;
  }
};