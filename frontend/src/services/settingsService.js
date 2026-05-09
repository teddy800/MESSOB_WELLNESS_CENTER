import api from './api';

export const settingsService = {
  // Get all system settings
  async getSettings() {
    const response = await api.get('/api/v1/settings');
    return response.data.data;
  },

  // Update system settings
  async updateSettings(settings) {
    const response = await api.put('/api/v1/settings', settings);
    return response.data.data;
  },

  // Get max login attempts
  async getMaxLoginAttempts() {
    const settings = await this.getSettings();
    return settings.maxLoginAttempts;
  },

  // Update max login attempts
  async updateMaxLoginAttempts(maxAttempts) {
    return this.updateSettings({ maxLoginAttempts: maxAttempts });
  },

  // Get session timeout
  async getSessionTimeout() {
    const settings = await this.getSettings();
    return settings.sessionTimeout;
  },

  // Update session timeout
  async updateSessionTimeout(timeout) {
    return this.updateSettings({ sessionTimeout: timeout });
  },

  // Get maintenance mode status
  async getMaintenanceMode() {
    const settings = await this.getSettings();
    return settings.maintenanceMode;
  },

  // Update maintenance mode
  async updateMaintenanceMode(enabled) {
    return this.updateSettings({ maintenanceMode: enabled });
  },

  // Get lockout duration
  async getLockoutDuration() {
    const settings = await this.getSettings();
    return settings.lockoutDuration;
  },

  // Update lockout duration
  async updateLockoutDuration(duration) {
    return this.updateSettings({ lockoutDuration: duration });
  },
};
