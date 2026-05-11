import api from './api';

export const notificationService = {
  // Get unread notifications count
  async getUnreadCount() {
    const response = await api.get('/api/v1/notifications/unread-count');
    return response.data.data.unreadCount;
  },

  // Get notifications with optional filters
  async getNotifications(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.isRead !== undefined) params.append('isRead', filters.isRead);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/api/v1/notifications?${params.toString()}`);
    return response.data.data;
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const response = await api.put(`/api/v1/notifications/${notificationId}/read`);
    return response.data.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.put('/api/v1/notifications/mark-all-read');
    return response.data;
  },

  // Delete a notification
  async deleteNotification(notificationId) {
    const response = await api.delete(`/api/v1/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all read notifications
  async deleteReadNotifications() {
    const response = await api.delete('/api/v1/notifications/read');
    return response.data;
  },
};
