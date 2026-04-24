import api from './api';

export const userManagementService = {
  // Get all users with filtering
  async getAllUsers(filters = {}) {
    const response = await api.get('/api/v1/users', { params: filters });
    return response.data;
  },

  // Create new user
  async createUser(userData) {
    const response = await api.post('/api/v1/users', userData);
    return response.data;
  },

  // Update user status (activate/deactivate)
  async updateUserStatus(userId, isActive) {
    const response = await api.put(`/api/v1/users/${userId}/status`, { isActive });
    return response.data;
  }
};