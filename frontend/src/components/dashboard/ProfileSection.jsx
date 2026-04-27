import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../forms/Button';
import Input from '../forms/Input';
import api from '../../services/api';

function ProfileSection({ onLogout }) {
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    emergencyContactName: user?.emergencyContactName || '',
    emergencyContactPhone: user?.emergencyContactPhone || '',
  });

  useEffect(() => {
    if (user) {
      setEditFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || '',
      });
    }
  }, [user]);

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
      await api.put('/api/v1/users/me', {
        fullName: editFormData.fullName,
        phone: editFormData.phone,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        emergencyContactName: editFormData.emergencyContactName,
        emergencyContactPhone: editFormData.emergencyContactPhone,
      });

      setEditSuccess('Profile updated successfully!');
      setShowEditProfile(false);
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile');
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
    <div className="profile-section">
      {editSuccess && (
        <div className="alert alert-success" role="alert">
          {editSuccess}
        </div>
      )}

      <div className="card user-profile-card">
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
            <Button variant="danger" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {showEditProfile && (
        <div className="card edit-profile-card">
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
              name="fullName"
              value={editFormData.fullName}
              onChange={handleEditChange}
              disabled={editLoading}
              required
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
        </div>
      )}

      <div className="card health-summary">
        <h3>📊 Health Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Member Since</span>
            <span className="summary-value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Last Login</span>
            <span className="summary-value">
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Account Status</span>
            <span className={`summary-value ${user?.isActive ? 'active' : 'inactive'}`}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSection;
