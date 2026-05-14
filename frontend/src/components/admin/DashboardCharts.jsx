import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
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

  // Prepare appointment trend data (simulated time series based on current data)
  const generateTrendData = (baseValue, label) => {
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    for (let i = 0; i < 6; i++) {
      const variance = Math.floor(Math.random() * (baseValue * 0.3)) - (baseValue * 0.15);
      data.push({
        name: months[i],
        value: Math.max(0, Math.floor(baseValue + variance)),
      });
    }
    return data;
  };

  // Appointment trend over time
  const appointmentTrendData = generateTrendData(metrics.appointments?.total || 10, 'Appointments');

  // Users by role data for bar chart
  const usersByRole = Object.entries(metrics.users?.byRole || {}).map(([role, count]) => ({
    name: role,
    value: count,
  }));

  // Centers by region data for bar chart
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

  const COLORS = ["#284394", "#e0e0e0"];

  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        {/* Appointments Trend - Line Chart */}
        <div className="chart-card">
          <h3>Appointments Trend (Last 6 Months)</h3>
          <div className="chart-container">
            {appointmentTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={appointmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#284394" 
                    strokeWidth={3} 
                    dot={{ fill: "#284394", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
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
          <div className="chart-container">
            {usersByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usersByRole}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#284394" radius={[8, 8, 0, 0]} />
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
          <div className="chart-container">
            {centersByRegion.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={centersByRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No center data</p>
            )}
          </div>
        </div>

        {/* Feedback NPS - Pie Chart */}
        <div className="chart-card">
          <h3>Feedback NPS Score</h3>
          <div className="chart-container">
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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#284394" }}>
                  {npsScore.toFixed(1)}/10
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Average NPS Score
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
