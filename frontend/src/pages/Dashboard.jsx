import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHealth } from '../services/healthService';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';

function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: user?.fullName || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
  });

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

  useEffect(() => {
    if (user) {
      setEditFormData({
        name: user.fullName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editFormData.name,
          phone: editFormData.phone,
          dateOfBirth: editFormData.dateOfBirth,
          gender: editFormData.gender,
          emergencyContactName: editFormData.emergencyContactName,
          emergencyContactPhone: editFormData.emergencyContactPhone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setEditSuccess('Profile updated successfully!');
      setShowEditProfile(false);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
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
      {editSuccess && (
        <div className="alert alert-success" role="alert">
          {editSuccess}
        </div>
      )}

      <section className="card user-profile-card">
        <div className="user-profile-header">
          <div className="user-avatar">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <h2>{user?.fullName || 'User'}</h2>
            <p className="user-email">{user?.email}</p>
            {user?.phone && <p className="user-phone">{user.phone}</p>}
            <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
              {formatRole(user?.role || 'USER')}
            </span>
          </div>
          <div className="user-actions">
            <Button variant="primary" onClick={() => setShowEditProfile(true)}>
              Edit Profile
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </section>

      {showEditProfile && (
        <section className="card edit-profile-card">
          <div className="edit-profile-header">
            <h3>Edit Profile</h3>
            <button 
              className="close-btn" 
              onClick={() => setShowEditProfile(false)}
              aria-label="Close edit profile"
            >
              ✕
            </button>
          </div>

          {editError && (
            <div className="alert alert-error" role="alert">
              {editError}
            </div>
          )}

          <form onSubmit={handleEditSubmit} className="edit-profile-form">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={editFormData.name}
              onChange={handleEditChange}
              disabled={editLoading}
            />

            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={editFormData.phone}
              onChange={handleEditChange}
              disabled={editLoading}
            />

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={editFormData.dateOfBirth}
              onChange={handleEditChange}
              disabled={editLoading}
            />

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={editFormData.gender}
                onChange={handleEditChange}
                disabled={editLoading}
                className="form-input"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <Input
              label="Emergency Contact Name"
              type="text"
              name="emergencyContactName"
              value={editFormData.emergencyContactName}
              onChange={handleEditChange}
              disabled={editLoading}
            />

            <Input
              label="Emergency Contact Phone"
              type="tel"
              name="emergencyContactPhone"
              value={editFormData.emergencyContactPhone}
              onChange={handleEditChange}
              disabled={editLoading}
            />

            <div className="edit-profile-actions">
              <Button
                type="submit"
                variant="primary"
                loading={editLoading}
                disabled={editLoading}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditProfile(false)}
                disabled={editLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

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
