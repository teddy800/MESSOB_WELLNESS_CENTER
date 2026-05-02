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
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardMetrics();
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
            <div className="status-item">
              <span className="status-label">Waiting</span>
              <div className="status-bar" style={{ width: "35%" }}></div>
              <span className="status-count">35%</span>
            </div>
            <div className="status-item">
              <span className="status-label">In Progress</span>
              <div className="status-bar" style={{ width: "25%" }}></div>
              <span className="status-count">25%</span>
            </div>
            <div className="status-item">
              <span className="status-label">Completed</span>
              <div className="status-bar" style={{ width: "30%" }}></div>
              <span className="status-count">30%</span>
            </div>
            <div className="status-item">
              <span className="status-label">Cancelled</span>
              <div className="status-bar" style={{ width: "10%" }}></div>
              <span className="status-count">10%</span>
            </div>
          </div>
        </div>

        {/* Users by Role */}
        <div className="chart-card">
          <h3>Users by Role</h3>
          <div className="chart-placeholder">
            <div className="role-item">
              <span className="role-label">Nurse Officer</span>
              <span className="role-count">45</span>
            </div>
            <div className="role-item">
              <span className="role-label">Manager</span>
              <span className="role-count">12</span>
            </div>
            <div className="role-item">
              <span className="role-label">Regional Office</span>
              <span className="role-count">8</span>
            </div>
            <div className="role-item">
              <span className="role-label">Staff</span>
              <span className="role-count">156</span>
            </div>
          </div>
        </div>

        {/* Centers by Region */}
        <div className="chart-card">
          <h3>Centers by Region</h3>
          <div className="chart-placeholder">
            <div className="region-item">
              <span className="region-label">Addis Ababa</span>
              <span className="region-count">8</span>
            </div>
            <div className="region-item">
              <span className="region-label">Oromia</span>
              <span className="region-count">12</span>
            </div>
            <div className="region-item">
              <span className="region-label">SNNPR</span>
              <span className="region-count">10</span>
            </div>
            <div className="region-item">
              <span className="region-label">Amhara</span>
              <span className="region-count">9</span>
            </div>
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
            <p className="summary-value">{metrics?.totalAppointments || 0}</p>
            <p className="summary-change">↑ 12% from last month</p>
          </div>
          <div className="summary-card">
            <h4>Active Users</h4>
            <p className="summary-value">{metrics?.totalUsers || 0}</p>
            <p className="summary-change">↑ 5% from last month</p>
          </div>
          <div className="summary-card">
            <h4>System Centers</h4>
            <p className="summary-value">{metrics?.totalCenters || 0}</p>
            <p className="summary-change">→ No change</p>
          </div>
          <div className="summary-card">
            <h4>Health Records</h4>
            <p className="summary-value">{metrics?.totalVitals || 0}</p>
            <p className="summary-change">↑ 8% from last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
