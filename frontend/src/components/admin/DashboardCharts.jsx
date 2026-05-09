import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import SystemHealthChart from "./SystemHealthChart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function DashboardCharts() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardMetrics();
      setMetrics(response);
    } catch (err) {
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="dashboard-charts"><p>Loading charts...</p></div>;
  if (!metrics) return <div className="dashboard-charts"><p>No data available</p></div>;

  // Prepare appointment data for line chart
  const appointmentStats = metrics.appointments?.byStatus || {};
  const appointmentChartData = Object.entries(appointmentStats).map(([status, count]) => ({
    name: status.replace(/_/g, " "),
    value: count,
  }));

  // Prepare users by role data for bar chart
  const usersByRole = Object.entries(metrics.users?.byRole || {}).map(([role, count]) => ({
    name: role,
    value: count,
  }));

  // Prepare centers by region data for bar chart
  const centersByRegion = Object.entries(metrics.centers?.byRegion || {}).map(([region, count]) => ({
    name: region || "Unknown",
    value: count,
  }));

  // NPS data for pie chart
  const npsScore = metrics.feedback?.averageNPS || 0;
  const npsPercentage = Math.min((npsScore / 10) * 100, 100);
  const npsData = [
    { name: "NPS Score", value: npsPercentage },
    { name: "Remaining", value: 100 - npsPercentage },
  ];

  const COLORS = ["#254091", "#e0e0e0"];

  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        {/* Appointments Trend - Line Chart */}
        <div className="chart-card">
          <h3>Appointments Trend</h3>
          <div className="chart-placeholder">
            {appointmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={appointmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#254091" strokeWidth={2} dot={{ fill: "#254091" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No appointment data</p>
            )}
          </div>
        </div>

        {/* Users by Role - Bar Chart */}
        <div className="chart-card">
          <h3>Users by Role</h3>
          <div className="chart-placeholder">
            {usersByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#254091" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No user data</p>
            )}
          </div>
        </div>

        {/* Centers by Region - Bar Chart */}
        <div className="chart-card">
          <h3>Centers by Region</h3>
          <div className="chart-placeholder">
            {centersByRegion.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={centersByRegion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#254091" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No center data</p>
            )}
          </div>
        </div>

        {/* Feedback NPS - Pie Chart */}
        <div className="chart-card">
          <h3>Feedback NPS</h3>
          <div className="chart-placeholder">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "250px" }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={npsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {npsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#254091" }}>
                  {npsScore.toFixed(1)}/10
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Average NPS Score
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Chart */}
        <SystemHealthChart />
      </div>
    </div>
  );
}

export default DashboardCharts;
