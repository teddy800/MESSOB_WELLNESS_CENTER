import React, { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function DashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load metrics");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="metrics-loading">Loading metrics...</div>;
  }

  if (error) {
    return <div className="metrics-error">Error: {error}</div>;
  }

  if (!metrics) {
    return <div className="metrics-empty">No metrics available</div>;
  }

  const totalUsers = metrics.users?.total || 0;
  const totalCenters = metrics.centers?.total || 0;
  const totalAppointments = metrics.appointments?.total || 0;
  const totalVitals = metrics.vitals?.total || 0;
  const totalFeedback = metrics.feedback?.total || 0;

  return (
    <div className="dashboard-metrics">
      <div className="metrics-grid">
        {/* Users Card */}
        <div className="metric-card users-card">
          <div className="metric-header">
            <h3>👥 Users</h3>
            <span className="metric-icon">👤</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalUsers}</span>
              <span className="metric-label">Total Users</span>
            </div>
          </div>
        </div>

        {/* Centers Card */}
        <div className="metric-card centers-card">
          <div className="metric-header">
            <h3>🏥 Centers</h3>
            <span className="metric-icon">🏢</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalCenters}</span>
              <span className="metric-label">Total Centers</span>
            </div>
          </div>
        </div>

        {/* Appointments Card */}
        <div className="metric-card appointments-card">
          <div className="metric-header">
            <h3>📅 Appointments</h3>
            <span className="metric-icon">📋</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalAppointments}</span>
              <span className="metric-label">Total Appointments</span>
            </div>
          </div>
        </div>

        {/* Vitals Card */}
        <div className="metric-card vitals-card">
          <div className="metric-header">
            <h3>💊 Vitals</h3>
            <span className="metric-icon">📊</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalVitals}</span>
              <span className="metric-label">Records</span>
            </div>
          </div>
        </div>

        {/* Feedback Card */}
        <div className="metric-card feedback-card">
          <div className="metric-header">
            <h3>⭐ Feedback</h3>
            <span className="metric-icon">💬</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalFeedback}</span>
              <span className="metric-label">Responses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardMetrics;
