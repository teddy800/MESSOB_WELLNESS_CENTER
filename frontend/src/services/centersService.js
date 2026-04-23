import api from './api';

export const centersService = {
  getAll: (params) => api.get('/api/v1/centers', { params }),
  getById: (id) => api.get(`/api/v1/centers/${id}`),
  create: (data) => api.post('/api/v1/centers', data),
  update: (id, data) => api.put(`/api/v1/centers/${id}`, data),
  delete: (id) => api.delete(`/api/v1/centers/${id}`),
  getAnalytics: (id) => api.get(`/api/v1/centers/${id}/analytics`),
  getRegionalAnalytics: (region) => api.get(`/api/v1/centers/analytics/region/${region}`),
  getAllAnalytics: () => api.get('/api/v1/centers/analytics/all'),
};
