import api from './api';

export const analyticsService = {
  // System Settings
  async getSystemSettings() {
    try {
      const response = await api.get('/api/v1/analytics/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  },

  async updateSystemSettings(settings) {
    try {
      const response = await api.put('/api/v1/analytics/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  },

  // Capacity Management
  async getCapacityInfo(date) {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/v1/analytics/capacity', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching capacity info:', error);
      throw error;
    }
  },

  // Booking Statistics
  async getBookingStats(date) {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/v1/analytics/appointments/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw error;
    }
  },

  // Queue Analytics
  async getQueueAnalytics() {
    try {
      const response = await api.get('/api/v1/analytics/queue/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching queue analytics:', error);
      throw error;
    }
  },

  // Health Analytics
  async getHealthAnalytics() {
    try {
      const response = await api.get('/api/v1/analytics/health/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching health analytics:', error);
      throw error;
    }
  }
};