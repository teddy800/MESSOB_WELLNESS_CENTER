import React from 'react';
import { useAuth } from '../context/AuthContext';

function RegionalDashboard() {
  const { user } = useAuth();

  return (
    <div className="regional-dashboard">
      <div className="dashboard-header">
        <h1>Regional Office Dashboard</h1>
        <p>Welcome, {user?.fullName}</p>
      </div>

      <div className="dashboard-content">
        <div className="section">
          <h2>Regional Analytics</h2>
          <p>Regional monitoring and evaluation features coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default RegionalDashboard;
