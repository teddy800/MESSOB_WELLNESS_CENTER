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

  // ─── Center Management ──────────────────────────────────────────────────────
  async createCenter(centerData) {
    const response = await api.post('/api/v1/centers', centerData);
    return response.data;
  },

  async updateCenter(centerId, centerData) {
    const response = await api.put(`/api/v1/centers/${centerId}`, centerData);
    return response.data;
  },

  async deleteCenter(centerId) {
    const response = await api.delete(`/api/v1/centers/${centerId}`);
    return response.data;
  },

  // ─── Combined Dashboard Data ────────────────────────────────────────────────
  // Fetches centers (always available) + analytics (best-effort, may 403 for lower roles)
  async getDashboardData(region) {
    const [centersResult, analyticsResult] = await Promise.allSettled([
      this.getCenters(region),
      region ? this.getRegionalAnalytics(region) : this.getAllAnalytics(),
    ]);

    // Centers: extract .data array from { status, data: [...] } response shape
    const centersRaw = centersResult.status === 'fulfilled' ? centersResult.value : null;
    const centers = centersRaw?.data ?? centersRaw ?? [];

    // Analytics: may fail with 403 for REGIONAL_OFFICE/FEDERAL_OFFICE on getAllAnalytics
    const analyticsRaw = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
    const analytics = analyticsRaw?.data ?? analyticsRaw ?? null;

    return { analytics, centers };
  },
};
