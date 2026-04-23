import api from './api';

export const vitalsService = {
  getStatus: () => api.get('/api/v1/vitals/status'),
  postBmi: (data) => api.post('/api/v1/vitals/bmi', data),
  postBloodPressure: (data) => api.post('/api/v1/vitals/blood-pressure', data),
  getHistory: (userId, limit = 50) => api.get(`/api/v1/vitals/history/${userId}?limit=${limit}`),
  getLatest: (userId) => api.get(`/api/v1/vitals/latest/${userId}`),
};
