import React from 'react';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Federal Admin Dashboard</h1>
        <p>Welcome, {user?.fullName}</p>
      </div>

      <div className="dashboard-content">
        <div className="section">
          <h2>System Administration</h2>
          <p>System administration features coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
