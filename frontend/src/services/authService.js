import api from './api';

export const authService = {
  register: (data) => api.post('/api/v1/auth/register', data),
  login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
  logout: () => api.post('/api/v1/auth/logout'),
  me: () => api.get('/api/v1/auth/me'),
  verifyToken: (token) => api.post('/api/v1/auth/verify-token', { token }),
};
