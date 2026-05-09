import React, { useState, useEffect } from "react";
import { settingsService } from "../../services/settingsService";
import "../../styles/admin-settings.css";

function SystemSettings() {
  const [settings, setSettings] = useState({
    maxLoginAttempts: 2,
    sessionTimeout: 30,
    maintenanceMode: false,
    lockoutDuration: 30,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [systemInfo, setSystemInfo] = useState({
    version: "1.0.0",
    lastUpdated: "May 3, 2026",
    databaseSize: "2.4 GB",
    uptime: "99.9%",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setError("");
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseInt(value) || value,
    }));
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      
      await settingsService.updateSettings(settings);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
      console.error("Error saving settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setSaved(false);
    setError("");
  };

  return (
    <div className="system-settings-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Configure system-wide settings and preferences</p>
      </div>

      {saved && <div className="success-message">✓ Settings saved successfully</div>}
      {error && <div className="error-message">✗ {error}</div>}

      <div className="settings-container">
        {/* Security Settings */}
        <div className="settings-section">
          <h2>Security Settings</h2>
          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="maxLoginAttempts">Max Login Attempts</label>
              <p className="setting-description">Maximum failed login attempts before account lockout</p>
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
              disabled={loading}
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
              <p className="setting-description">Automatically logout inactive users after this duration</p>
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
              disabled={loading}
            />
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <label htmlFor="lockoutDuration">Account Lockout Duration (minutes)</label>
              <p className="setting-description">How long to lock account after max failed attempts</p>
            </div>
            <input
              type="number"
              id="lockoutDuration"
              name="lockoutDuration"
              value={settings.lockoutDuration}
              onChange={handleChange}
              className="setting-input"
              min="5"
              max="120"
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="system-info">
            <div className="info-item">
              <span className="info-label">System Version:</span>
              <span className="info-value">{systemInfo.version}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated:</span>
              <span className="info-value">{systemInfo.lastUpdated}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Database Size:</span>
              <span className="info-value">{systemInfo.databaseSize}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Uptime:</span>
              <span className="info-value">{systemInfo.uptime}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button 
            onClick={handleSave} 
            className="btn-save"
            disabled={loading}
          >
            {loading ? "⏳ Saving..." : "💾 Save Settings"}
          </button>
          <button 
            onClick={handleReset} 
            className="btn-reset-settings"
            disabled={loading}
          >
            ↻ Reload Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;
