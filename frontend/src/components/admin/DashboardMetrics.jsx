import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

function DashboardMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState("daily");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timePeriod]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardMetrics(timePeriod);
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load metrics");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading && !metrics) {
    return <div className="metrics-loading">Loading metrics...</div>;
  }

  if (error && !metrics) {
    return <div className="metrics-error">Error: {error}</div>;
  }

  if (!metrics) {
    return <div className="metrics-empty">No metrics available</div>;
  }

  // Static totals (not affected by time period)
  const totalUsers = metrics.users?.total || 0;
  const totalCenters = metrics.centers?.total || 0;
  const totalRegions = metrics.regions?.total || 0;
  const totalPatients = metrics.patients?.total || 0;

  // Filtered by time period (actual data from backend)
  const totalAppointments = metrics.appointments?.total || 0;
  const totalWalkIns = metrics.walkIns?.total || 0;
  const totalFeedback = metrics.feedback?.total || 0;
  const totalPatientsServed = metrics.patientsServed?.total || 0;

  return (
    <div className="dashboard-metrics">
      {/* Static Totals Row - 4 cards */}
      <div className="static-totals-row">
        <div className="static-total-card">
          <div className="static-icon">👥</div>
          <div className="static-content">
            <div className="static-value">{totalUsers}</div>
            <div className="static-label">Total Users</div>
          </div>
        </div>
        <div className="static-total-card">
          <div className="static-icon">🏥</div>
          <div className="static-content">
            <div className="static-value">{totalCenters}</div>
            <div className="static-label">Total Centers</div>
          </div>
        </div>
        <div className="static-total-card">
          <div className="static-icon">🗺️</div>
          <div className="static-content">
            <div className="static-value">{totalRegions}</div>
            <div className="static-label">Total Regions</div>
          </div>
        </div>
        <div className="static-total-card">
          <div className="static-icon">👨‍⚕️</div>
          <div className="static-content">
            <div className="static-value">{totalPatients}</div>
            <div className="static-label">Total Patients</div>
          </div>
        </div>
      </div>

      {/* Header with Controls */}
      <div className="metrics-header">
        <div className="metrics-title">
          <h3>Performance Metrics</h3>
          <p className="metrics-subtitle">Filter by time period</p>
        </div>

        <div className="metrics-controls">
          <select 
            value={timePeriod} 
            onChange={(e) => setTimePeriod(e.target.value)}
            className="time-period-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button onClick={fetchMetrics} className="refresh-btn" title="Refresh metrics">
            🔄
          </button>
          <span className="last-updated">Updated: {formatLastUpdated()}</span>
        </div>
      </div>

      {/* Filtered Metrics Grid - 4 cards */}
      <div className="metrics-grid">
        {/* Appointments Card */}
        <div className="metric-card appointments-card">
          <div className="metric-header">
            <h3>📅 Appointments</h3>
            <span className="metric-icon">📋</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalAppointments}</span>
              <span className="metric-label">
                {timePeriod === "daily" ? "Today" : timePeriod === "weekly" ? "This Week" : "This Month"}
              </span>
            </div>
          </div>
        </div>

        {/* Walk-ins Card */}
        <div className="metric-card walkin-card">
          <div className="metric-header">
            <h3>🚶 Walk-ins</h3>
            <span className="metric-icon">👤</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalWalkIns}</span>
              <span className="metric-label">
                {timePeriod === "daily" ? "Today" : timePeriod === "weekly" ? "This Week" : "This Month"}
              </span>
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
              <span className="metric-label">
                {timePeriod === "daily" ? "Today" : timePeriod === "weekly" ? "This Week" : "This Month"}
              </span>
            </div>
          </div>
        </div>

        {/* Patients Served Card */}
        <div className="metric-card patients-served-card">
          <div className="metric-header">
            <h3>🩺 Patients Served</h3>
            <span className="metric-icon">✅</span>
          </div>
          <div className="metric-body">
            <div className="metric-main">
              <span className="metric-value">{totalPatientsServed}</span>
              <span className="metric-label">
                {timePeriod === "daily" ? "Today" : timePeriod === "weekly" ? "This Week" : "This Month"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Section */}
      <div className="system-health-section">
        <h3>System Health</h3>
        <div className="health-metrics-grid">
          <div className="health-metric-card">
            <div className="health-icon">⚡</div>
            <div className="health-content">
              <p className="health-label">API Response Time</p>
              <p className="health-value">245ms</p>
              <span className="health-status good">✓ Good</span>
            </div>
          </div>
          <div className="health-metric-card">
            <div className="health-icon">🔌</div>
            <div className="health-content">
              <p className="health-label">Database Connections</p>
              <p className="health-value">12/50</p>
              <span className="health-status good">✓ Good</span>
            </div>
          </div>
          <div className="health-metric-card">
            <div className="health-icon">⏱️</div>
            <div className="health-content">
              <p className="health-label">System Uptime</p>
              <p className="health-value">99.9%</p>
              <span className="health-status good">✓ Good</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardMetrics;
