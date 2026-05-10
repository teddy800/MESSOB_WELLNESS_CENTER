import React, { useState, useEffect } from "react";
import { notificationService } from "../../services/notificationService";
import "../../styles/notification-panel.css";

function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    severity: "",
    isRead: "",
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({
        type: filters.type || undefined,
        severity: filters.severity || undefined,
        isRead: filters.isRead === "" ? undefined : filters.isRead === "true",
        limit: 50,
      });
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      setTotal(total - 1);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#f97316";
      case "MEDIUM":
        return "#eab308";
      case "LOW":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "SYSTEM_ALERT":
        return "⚠️";
      case "USER_REGISTRATION":
        return "👤";
      case "DATA_ISSUE":
        return "📊";
      default:
        return "📢";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h2>Notifications</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="notification-filters">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="SYSTEM_ALERT">System Alerts</option>
            <option value="USER_REGISTRATION">User Registration</option>
            <option value="DATA_ISSUE">Data Issues</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="filter-select"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filters.isRead}
            onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>

          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            Mark All Read
          </button>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.isRead ? "read" : "unread"}`}
              >
                <div className="notification-icon">
                  {getTypeIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-title">
                    {notification.title}
                    <span
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(notification.severity) }}
                    >
                      {notification.severity}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(notification.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="notification-footer">
          <span className="total-count">Total: {total}</span>
        </div>
      </div>
    </div>
  );
}

export default NotificationPanel;
