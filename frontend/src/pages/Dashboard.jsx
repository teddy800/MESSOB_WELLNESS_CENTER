import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHealth } from '../services/healthService';
import Button from '../components/forms/Button';

function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHealth() {
      try {
        setLoading(true);
        const result = await fetchHealth();
        setHealth(result);
      } catch (err) {
        setError('Failed to reach backend /api/health endpoint.');
      } finally {
        setLoading(false);
      }
    }

    loadHealth();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      CUSTOMER_STAFF: 'badge-blue',
      NURSE_OFFICER: 'badge-green',
      MANAGER: 'badge-purple',
      REGIONAL_OFFICE: 'badge-orange',
      FEDERAL_ADMIN: 'badge-red',
    };
    return roleMap[role] || 'badge-gray';
  };

  const formatRole = (role) => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="dashboard-container">
      <section className="card user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <h2>{user?.fullName || 'User'}</h2>
            <p className="user-email">{user?.email}</p>
            <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
              {formatRole(user?.role || 'USER')}
            </span>
          </div>
          <div className="user-actions">
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>System Status</h3>
        
        {loading && <p className="status-text">Checking backend health...</p>}

        {!loading && error && <p className="error-text">{error}</p>}

        {!loading && health && (
          <div className="status-box">
            <h4>Backend Health Response</h4>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </div>
        )}
      </section>

      <section className="card">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" disabled>
            <span className="quick-action-icon">📊</span>
            <span className="quick-action-label">Record Vitals</span>
            <span className="quick-action-badge">Coming Soon</span>
          </button>
          <button className="quick-action-card" disabled>
            <span className="quick-action-icon">📅</span>
            <span className="quick-action-label">Book Appointment</span>
            <span className="quick-action-badge">Coming Soon</span>
          </button>
          <button className="quick-action-card" disabled>
            <span className="quick-action-icon">💪</span>
            <span className="quick-action-label">Wellness Plans</span>
            <span className="quick-action-badge">Coming Soon</span>
          </button>
          <button className="quick-action-card" disabled>
            <span className="quick-action-icon">💬</span>
            <span className="quick-action-label">Feedback</span>
            <span className="quick-action-badge">Coming Soon</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
