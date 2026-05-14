import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function DashboardAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await adminService.getDashboardMetrics();
      const generatedAlerts = generateAlerts(data);
      setAlerts(generatedAlerts);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (metrics) => {
    const alerts = [];

    // Check for low user count
    if (metrics.users?.total < 5) {
      alerts.push({
        id: "low-users",
        type: "warning",
        title: "Low User Count",
        message: `Only ${metrics.users?.total} users in the system. Consider adding more users.`,
        icon: "⚠️",
      });
    }

    // Check for low center count
    if (metrics.centers?.total < 2) {
      alerts.push({
        id: "low-centers",
        type: "critical",
        title: "Insufficient Centers",
        message: `Only ${metrics.centers?.total} center(s) available. System needs at least 2 centers.`,
        icon: "🚨",
      });
    }

    // Check for low appointments
    if (metrics.appointments?.total < 10) {
      alerts.push({
        id: "low-appointments",
        type: "info",
        title: "Low Appointment Activity",
        message: `Only ${metrics.appointments?.total} appointments scheduled. Encourage more bookings.`,
        icon: "ℹ️",
      });
    }

    // Check for low feedback
    if (metrics.feedback?.total < 5) {
      alerts.push({
        id: "low-feedback",
        type: "info",
        title: "Limited Feedback",
        message: `Only ${metrics.feedback?.total} feedback responses. Encourage users to provide feedback.`,
        icon: "ℹ️",
      });
    }

    // Check NPS score
    const npsScore = metrics.feedback?.averageNPS || 0;
    if (npsScore < 5) {
      alerts.push({
        id: "low-nps",
        type: "critical",
        title: "Low NPS Score",
        message: `NPS score is ${npsScore.toFixed(1)}/10. Customer satisfaction needs improvement.`,
        icon: "🚨",
      });
    }

    return alerts;
  };

  const dismissAlert = (id) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  if (loading) {
    return <div className="alerts-loading">Loading alerts...</div>;
  }

  if (alerts.length === 0) {
    return (
      <div className="alerts-container">
        <div className="alerts-empty">
          <span className="empty-icon">✅</span>
          <p>All systems operational. No alerts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h3>System Alerts ({alerts.length})</h3>
      </div>
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert alert-${alert.type}`}>
            <div className="alert-icon">{alert.icon}</div>
            <div className="alert-content">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-message">{alert.message}</div>
            </div>
            <button
              className="alert-dismiss"
              onClick={() => dismissAlert(alert.id)}
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardAlerts;
