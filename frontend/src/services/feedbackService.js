import api from './api';

export const feedbackService = {
  create: (data) => api.post('/api/v1/feedback', data),
  getAll: (params) => api.get('/api/v1/feedback', { params }),
  getStats: () => api.get('/api/v1/feedback', { params: { stats: true } }),
};
