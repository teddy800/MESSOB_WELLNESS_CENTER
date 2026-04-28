import api from './api';

export const regionalService = {
  // ─── Regional Analytics ─────────────────────────────────────────────────────
  async getRegionalAnalytics(region) {
    const response = await api.get(`/api/v1/centers/analytics/region/${region}`);
    return response.data;
  },

  async getAllAnalytics() {
    const response = await api.get('/api/v1/centers/analytics/all');
    return response.data;
  },

  // ─── Regions & Centers ──────────────────────────────────────────────────────
  async getRegions() {
    const response = await api.get('/api/v1/regions');
    return response.data;
  },

  async getCenters(region) {
    const params = region ? { region } : {};
    const response = await api.get('/api/v1/centers', { params });
    return response.data;
  },

  async getCenterAnalytics(centerId) {
    const response = await api.get(`/api/v1/centers/${centerId}/analytics`);
    return response.data;
  },

  // ─── Combined Dashboard Data ────────────────────────────────────────────────
  async getDashboardData(region) {
    const [analytics, centers, allRegions] = await Promise.all([
      region ? this.getRegionalAnalytics(region) : this.getAllAnalytics(),
      this.getCenters(region),
      this.getRegions(),
    ]);
    return { analytics, centers, allRegions };
  },
};
