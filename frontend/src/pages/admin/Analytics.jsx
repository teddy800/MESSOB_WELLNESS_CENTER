import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import "../../styles/admin-analytics.css";

function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardMetrics();
      console.log("Dashboard metrics response:", response);
      setMetrics(response);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!metrics) return <div className="loading">No data available</div>;

  // Calculate appointment status percentages
  const appointmentTotal = metrics.appointments?.total || 0;
  const appointmentStats = metrics.appointments?.byStatus || {};
  const appointmentPercentages = Object.entries(appointmentStats).map(([status, count]) => ({
    status: status.replace(/_/g, " "),
    count,
    percentage: appointmentTotal > 0 ? ((count / appointmentTotal) * 100).toFixed(1) : 0,
  }));

  // Get users by role
  const usersByRole = Object.entries(metrics.users?.byRole || {}).map(([role, count]) => ({
    role,
    count,
  }));

  // Get centers by region
  const centersByRegion = Object.entries(metrics.centers?.byRegion || {}).map(([region, count]) => ({
    region,
    count,
  }));

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>System Analytics</h1>
        <p>Monitor system performance and usage metrics</p>
      </div>

      <div className="filters">
        <input
          type="date"
          name="dateFrom"
          value={filters.dateFrom}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="date"
          name="dateTo"
          value={filters.dateTo}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <button className="btn-export">Export Report</button>
      </div>

      <div className="analytics-grid">
        {/* Appointments by Status */}
        <div className="chart-card">
          <h3>Appointments by Status</h3>
          <div className="chart-placeholder">
            {appointmentPercentages.length > 0 ? (
              appointmentPercentages.map((item, idx) => (
                <div key={idx} className="status-item">
                  <span className="status-label">{item.status}</span>
                  <div className="status-bar" style={{ width: `${item.percentage}%` }}></div>
                  <span className="status-count">{item.percentage}%</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#999" }}>No appointment data</p>
            )}
          </div>
        </div>

        {/* Users by Role */}
        <div className="chart-card">
          <h3>Users by Role</h3>
          <div className="chart-placeholder">
            {usersByRole.length > 0 ? (
              usersByRole.map((item, idx) => (
                <div key={idx} className="role-item">
                  <span className="role-label">{item.role}</span>
                  <span className="role-count">{item.count}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#999" }}>No user data</p>
            )}
          </div>
        </div>

        {/* Centers by Region */}
        <div className="chart-card">
          <h3>Centers by Region</h3>
          <div className="chart-placeholder">
            {centersByRegion.length > 0 ? (
              centersByRegion.map((item, idx) => (
                <div key={idx} className="region-item">
                  <span className="region-label">{item.region || "Unknown"}</span>
                  <span className="region-count">{item.count}</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#999" }}>No center data</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="chart-card">
          <h3>System Health</h3>
          <div className="health-metrics">
            <div className="health-item">
              <span className="health-label">API Response Time</span>
              <span className="health-value">245ms</span>
              <span className="health-status good">✓ Good</span>
            </div>
            <div className="health-item">
              <span className="health-label">Database Connections</span>
              <span className="health-value">12/50</span>
              <span className="health-status good">✓ Good</span>
            </div>
            <div className="health-item">
              <span className="health-label">Uptime</span>
              <span className="health-value">99.9%</span>
              <span className="health-status good">✓ Good</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-summary">
        <h2>Key Metrics</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <h4>Total Appointments</h4>
            <p className="summary-value">{metrics.appointments?.total || 0}</p>
            <p className="summary-change">↑ 12% from last month</p>
          </div>
          <div className="summary-card">
            <h4>Active Users</h4>
            <p className="summary-value">{metrics.users?.total || 0}</p>
            <p className="summary-change">↑ 5% from last month</p>
          </div>
          <div className="summary-card">
            <h4>System Centers</h4>
            <p className="summary-value">{metrics.centers?.total || 0}</p>
            <p className="summary-change">→ No change</p>
          </div>
          <div className="summary-card">
            <h4>Health Records</h4>
            <p className="summary-value">{metrics.vitals?.total || 0}</p>
            <p className="summary-change">↑ 8% from last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
