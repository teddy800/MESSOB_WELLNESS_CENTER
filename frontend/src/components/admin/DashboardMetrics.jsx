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

  const { users, centers, appointments, vitals, feedback } = metrics;

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
              <span className="metric-value">{users.total}</span>
              <span className="metric-label">Total Users</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Active:</span>
                <span className="detail-value">{users.active}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Verified:</span>
                <span className="detail-value">{users.verified}</span>
              </div>
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
              <span className="metric-value">{centers.total}</span>
              <span className="metric-label">Total Centers</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Active:</span>
                <span className="detail-value">{centers.active}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Regions:</span>
                <span className="detail-value">{Object.keys(centers.byRegion).length}</span>
              </div>
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
              <span className="metric-value">{appointments.total}</span>
              <span className="metric-label">Total Appointments</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Completed:</span>
                <span className="detail-value">{appointments.completed}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Waiting:</span>
                <span className="detail-value">{appointments.waiting}</span>
              </div>
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
              <span className="metric-value">{vitals.total}</span>
              <span className="metric-label">Records</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Avg BMI:</span>
                <span className="detail-value">{vitals.averageBMI.toFixed(1)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Avg HR:</span>
                <span className="detail-value">{vitals.averageHeartRate.toFixed(0)}</span>
              </div>
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
              <span className="metric-value">{feedback.total}</span>
              <span className="metric-label">Responses</span>
            </div>
            <div className="metric-details">
              <div className="detail-item">
                <span className="detail-label">Avg NPS:</span>
                <span className="detail-value">{feedback.averageNPS.toFixed(1)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Quality:</span>
                <span className="detail-value">{feedback.averageServiceQuality.toFixed(1)}/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardMetrics;
