import React from "react";

function DashboardCharts() {
  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Appointments Trend</h3>
          <div className="chart-placeholder">
            <p>Line chart will be implemented in Phase 5</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Users by Role</h3>
          <div className="chart-placeholder">
            <p>Bar chart will be implemented in Phase 5</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Centers by Region</h3>
          <div className="chart-placeholder">
            <p>Bar chart will be implemented in Phase 5</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Feedback NPS</h3>
          <div className="chart-placeholder">
            <p>Gauge chart will be implemented in Phase 5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
