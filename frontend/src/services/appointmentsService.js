import api from './api';

export const appointmentsService = {
  getAll: (params) => api.get('/api/v1/appointments', { params }),
  getById: (id) => api.get(`/api/v1/appointments/${id}`),
  create: (data) => api.post('/api/v1/appointments', data),
  update: (id, data) => api.patch(`/api/v1/appointments/${id}`, data),
};
