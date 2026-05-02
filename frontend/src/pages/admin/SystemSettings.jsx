import React, { useState } from "react";
import "../../styles/admin-settings.css";

function SystemSettings() {
  const [settings, setSettings] = useState({
    appointmentReminder: true,
    smsNotifications: true,
    emailNotifications: true,
    autoBackup: true,
    backupFrequency: "daily",
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    maintenanceMode: false,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      appointmentReminder: true,
      smsNotifications: true,
      emailNotifications: true,
      autoBackup: true,
      backupFrequency: "daily",
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      maintenanceMode: false,
    });
  };

  return (
    <div className="system-settings-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Configure system-wide settings and preferences</p>
      </div>

      {saved && <div className="success-message">✓ Settings saved successfully</div>}

      <div className="settings-container">
        {/* Notification Settings */}
        <div className="settings-section">
          <h2>Notification Settings</h2>
          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="appointmentReminder">Appointment Reminders</label>
              <p className="setting-description">Send SMS reminders for upcoming appointments</p>
            </div>
            <input
              type="checkbox"
              id="appointmentReminder"
              name="appointmentReminder"
              checked={settings.appointmentReminder}
              onChange={handleChange}
              className="toggle-switch"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="smsNotifications">SMS Notifications</label>
              <p className="setting-description">Enable SMS notifications for system alerts</p>
            </div>
            <input
              type="checkbox"
              id="smsNotifications"
              name="smsNotifications"
              checked={settings.smsNotifications}
              onChange={handleChange}
              className="toggle-switch"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="emailNotifications">Email Notifications</label>
              <p className="setting-description">Enable email notifications for important events</p>
            </div>
            <input
              type="checkbox"
              id="emailNotifications"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleChange}
              className="toggle-switch"
            />
          </div>
        </div>

        {/* Backup Settings */}
        <div className="settings-section">
          <h2>Backup Settings</h2>
          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="autoBackup">Automatic Backup</label>
              <p className="setting-description">Enable automatic database backups</p>
            </div>
            <input
              type="checkbox"
              id="autoBackup"
              name="autoBackup"
              checked={settings.autoBackup}
              onChange={handleChange}
              className="toggle-switch"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="backupFrequency">Backup Frequency</label>
              <p className="setting-description">How often to perform automatic backups</p>
            </div>
            <select
              id="backupFrequency"
              name="backupFrequency"
              value={settings.backupFrequency}
              onChange={handleChange}
              className="setting-select"
              disabled={!settings.autoBackup}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="backup-actions">
            <button className="btn-backup">💾 Manual Backup Now</button>
            <button className="btn-restore">↩️ Restore from Backup</button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <h2>Security Settings</h2>
          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
              <p className="setting-description">Maximum failed login attempts before lockout</p>
            </div>
            <input
              type="number"
              id="maxLoginAttempts"
              name="maxLoginAttempts"
              value={settings.maxLoginAttempts}
              onChange={handleChange}
              className="setting-input"
              min="1"
              max="10"
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
              <p className="setting-description">Automatically logout inactive users</p>
            </div>
            <input
              type="number"
              id="sessionTimeout"
              name="sessionTimeout"
              value={settings.sessionTimeout}
              onChange={handleChange}
              className="setting-input"
              min="5"
              max="480"
            />
          </div>
        </div>

        {/* System Status */}
        <div className="settings-section">
          <h2>System Status</h2>
          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="maintenanceMode">Maintenance Mode</label>
              <p className="setting-description">Put system in maintenance mode (users cannot access)</p>
            </div>
            <input
              type="checkbox"
              id="maintenanceMode"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
              className="toggle-switch"
            />
          </div>

          <div className="system-info">
            <div className="info-item">
              <span className="info-label">System Version:</span>
              <span className="info-value">1.0.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated:</span>
              <span className="info-value">May 3, 2026</span>
            </div>
            <div className="info-item">
              <span className="info-label">Database Size:</span>
              <span className="info-value">2.4 GB</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button onClick={handleSave} className="btn-save">
            💾 Save Settings
          </button>
          <button onClick={handleReset} className="btn-reset-settings">
            ↻ Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
