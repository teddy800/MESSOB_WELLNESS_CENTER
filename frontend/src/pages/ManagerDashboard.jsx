import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    dailySlotLimit: 100,
    appointmentIntervalMinutes: 30,
    walkInEnabled: true
  });

  // Check if user has manager access
  const hasManagerAccess = () => {
    return ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'].includes(user?.role);
  };

  useEffect(() => {
    if (hasManagerAccess()) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [capacity, booking, queue, health, settings] = await Promise.allSettled([
        analyticsService.getCapacityInfo(),
        analyticsService.getBookingStats(),
        analyticsService.getQueueAnalytics(),
        analyticsService.getHealthAnalytics(),
        analyticsService.getSystemSettings(),
      ]);

      if (capacity.status === 'fulfilled') {
        setCapacityInfo(capacity.value.data);
      }
      
      if (booking.status === 'fulfilled') {
        setBookingStats(booking.value.data);
      }
      
      if (settings.status === 'fulfilled') {
        setSystemSettings(settings.value.data);
      }
      
      // Mock users data for now
      setUsers([
        { id: '1', fullName: 'Dr. Sarah Johnson', email: 'sarah@mesob.et', role: 'NURSE_OFFICER', isActive: true },
        { id: '2', fullName: 'Nurse Mike Wilson', email: 'mike@mesob.et', role: 'NURSE_OFFICER', isActive: true }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasManagerAccess()) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Manager role required to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <p className="dashboard-subtitle">System Control Center</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          🎛️ Capacity
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            loading={loading}
            capacityInfo={capacityInfo}
            bookingStats={bookingStats}
          />
        )}

        {activeTab === 'capacity' && (
          <CapacityTab 
            loading={loading}
            capacityInfo={capacityInfo}
            systemSettings={systemSettings}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab loading={loading} />
        )}

        {activeTab === 'users' && (
          <UsersTab 
            users={users}
            loading={loading}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            systemSettings={systemSettings}
            setSystemSettings={setSystemSettings}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ loading, capacityInfo, bookingStats }) => {
  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="overview-content">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Daily Capacity</h3>
          <div className="stat-value">{capacityInfo?.slotsUsed || 0}</div>
          <div className="stat-label">of {capacityInfo?.dailyLimit || 100} slots</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <div className="stat-value">{bookingStats?.totalAppointments || 0}</div>
          <div className="stat-label">today</div>
        </div>
        
        <div className="stat-card">
          <h3>No-Show Rate</h3>
          <div className="stat-value">{bookingStats?.noShowRate || 0}%</div>
          <div className="stat-label">this week</div>
        </div>
        
        <div className="stat-card">
          <h3>Avg Service Time</h3>
          <div className="stat-value">{bookingStats?.averageServiceTime || 0}</div>
          <div className="stat-label">minutes</div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Today's Statistics</h3>
          <div className="chart-content">
            <div className="stat-row">
              <span>Online Bookings:</span>
              <span>{bookingStats?.onlineBookings || 0}</span>
            </div>
            <div className="stat-row">
              <span>Walk-in Bookings:</span>
              <span>{bookingStats?.walkInBookings || 0}</span>
            </div>
            <div className="stat-row">
              <span>Capacity Used:</span>
              <span>{Math.round(((capacityInfo?.slotsUsed || 0) / (capacityInfo?.dailyLimit || 100)) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Capacity Tab Component
const CapacityTab = ({ loading, capacityInfo, systemSettings }) => {
  if (loading) {
    return <div className="loading">Loading capacity data...</div>;
  }

  return (
    <div className="capacity-content">
      <div className="capacity-overview">
        <h3>Capacity Management</h3>
        <div className="capacity-stats">
          <div className="capacity-item">
            <div className="capacity-label">Daily Limit</div>
            <div className="capacity-value">{capacityInfo?.dailyLimit || 100}</div>
          </div>
          <div className="capacity-item">
            <div className="capacity-label">Slots Used</div>
            <div className="capacity-value">{capacityInfo?.slotsUsed || 0}</div>
          </div>
          <div className="capacity-item">
            <div className="capacity-label">Remaining</div>
            <div className="capacity-value">{capacityInfo?.slotsRemaining || 0}</div>
          </div>
        </div>
        
        <div className="capacity-bar">
          <div 
            className="capacity-fill" 
            style={{ 
              width: `${Math.round(((capacityInfo?.slotsUsed || 0) / (capacityInfo?.dailyLimit || 100)) * 100)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ loading }) => {
  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-content">
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Queue Analytics</h3>
          <div className="analytics-data">
            <div className="metric">
              <span>Current Queue:</span>
              <span>12 patients</span>
            </div>
            <div className="metric">
              <span>Average Wait:</span>
              <span>15 minutes</span>
            </div>
            <div className="metric">
              <span>Completion Rate:</span>
              <span>92%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Health Trends</h3>
          <div className="analytics-data">
            <div className="metric">
              <span>High Risk Patients:</span>
              <span>8</span>
            </div>
            <div className="metric">
              <span>Average BP:</span>
              <span>120/80</span>
            </div>
            <div className="metric">
              <span>Health Score:</span>
              <span>85/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, loading }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    role: 'NURSE_OFFICER'
  });

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  const handleCreateUser = (e) => {
    e.preventDefault();
    // Handle user creation logic here
    console.log('Creating user:', newUser);
    setShowCreateModal(false);
    setNewUser({ fullName: '', email: '', role: 'NURSE_OFFICER' });
  };

  return (
    <div className="users-content">
      <div className="users-header">
        <h3>User Management</h3>
        <Button onClick={() => setShowCreateModal(true)}>
          Create User
        </Button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role.replace('_', ' ')}</td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <Button size="small">
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New User</h3>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <Input
                label="Full Name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                required
              />
              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="NURSE_OFFICER">Nurse Officer</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              <div className="modal-actions">
                <Button type="submit">Create User</Button>
                <Button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ systemSettings, setSystemSettings }) => {
  const [localSettings, setLocalSettings] = useState(systemSettings);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await analyticsService.updateSystemSettings(localSettings);
      setSystemSettings(response.data);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-content">
      <h3>System Settings</h3>
      
      <div className="settings-form">
        <div className="form-group">
          <label>Daily Slot Limit</label>
          <Input
            type="number"
            value={localSettings.dailySlotLimit}
            onChange={(e) => setLocalSettings({
              ...localSettings, 
              dailySlotLimit: parseInt(e.target.value)
            })}
          />
        </div>

        <div className="form-group">
          <label>Appointment Interval (minutes)</label>
          <Input
            type="number"
            value={localSettings.appointmentIntervalMinutes}
            onChange={(e) => setLocalSettings({
              ...localSettings, 
              appointmentIntervalMinutes: parseInt(e.target.value)
            })}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={localSettings.walkInEnabled}
              onChange={(e) => setLocalSettings({
                ...localSettings, 
                walkInEnabled: e.target.checked
              })}
            />
            Enable Walk-in Registration
          </label>
        </div>

        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default ManagerDashboard;