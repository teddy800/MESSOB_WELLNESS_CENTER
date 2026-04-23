import api from './api';

export const wellnessService = {
  create: (data) => api.post('/api/v1/plans', data),
  getByUser: (userId, activeOnly = false) =>
    api.get(`/api/v1/plans/${userId}`, { params: { activeOnly } }),
};
