import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analyticsService';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';

// ─── Role guard ───────────────────────────────────────────────────────────────
const MANAGER_ROLES = ['MANAGER', 'REGIONAL_OFFICE', 'FEDERAL_ADMIN'];

// ─── Root Component ───────────────────────────────────────────────────────────
const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]       = useState('overview');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [queueData, setQueueData]       = useState(null);
  const [healthData, setHealthData]     = useState(null);
  const [users, setUsers]               = useState([]);
  const [auditLogs, setAuditLogs]       = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    dailySlotLimit: 100,
    appointmentIntervalMinutes: 30,
    walkInEnabled: true,
    autoConfirmBookings: false,
  });

  const hasAccess = MANAGER_ROLES.includes(user?.role);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [capacity, booking, queue, health, settings, staffUsers, logs] =
        await Promise.allSettled([
          analyticsService.getCapacityInfo(),
          analyticsService.getBookingStats(),
          analyticsService.getQueueAnalytics(),
          analyticsService.getHealthAnalytics(),
          analyticsService.getSystemSettings(),
          analyticsService.getStaffUsers(),
          analyticsService.getAuditLogs(30),
        ]);

      if (capacity.status === 'fulfilled')   setCapacityInfo(capacity.value.data);
      if (booking.status === 'fulfilled')    setBookingStats(booking.value.data);
      if (queue.status === 'fulfilled')      setQueueData(queue.value.data);
      if (health.status === 'fulfilled')     setHealthData(health.value.data);
      if (settings.status === 'fulfilled')   setSystemSettings(settings.value.data);
      if (staffUsers.status === 'fulfilled') setUsers(staffUsers.value.data);
      if (logs.status === 'fulfilled')       setAuditLogs(logs.value.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) loadDashboardData();
  }, [hasAccess, loadDashboardData]);

  if (!hasAccess) {
    return (
      <div className="dashboard-container">
        <div className="access-denied">
          <h2>🚫 Access Denied</h2>
          <p>Manager role required to access this dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview',  label: '📊 Overview'  },
    { id: 'capacity',  label: '🎛️ Capacity'  },
    { id: 'analytics', label: '📈 Analytics' },
    { id: 'users',     label: '👥 Users'     },
    { id: 'audit',     label: '🔍 Audit'     },
    { id: 'settings',  label: '⚙️ Settings'  },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Manager Dashboard</h1>
          <p className="dashboard-subtitle">
            System Control Center — Welcome, {user?.fullName}
          </p>
        </div>
        <button
          className="tab-btn"
          onClick={loadDashboardData}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? '⏳ Loading…' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="dashboard-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview'  && <OverviewTab  loading={loading} capacityInfo={capacityInfo} bookingStats={bookingStats} />}
        {activeTab === 'capacity'  && <CapacityTab  loading={loading} capacityInfo={capacityInfo} />}
        {activeTab === 'analytics' && <AnalyticsTab loading={loading} queueData={queueData} healthData={healthData} />}
        {activeTab === 'users'     && <UsersTab     loading={loading} users={users} onRefresh={loadDashboardData} />}
        {activeTab === 'audit'     && <AuditTab     loading={loading} logs={auditLogs} />}
        {activeTab === 'settings'  && (
          <SettingsTab
            systemSettings={systemSettings}
            setSystemSettings={setSystemSettings}
          />
        )}
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ loading, capacityInfo, bookingStats }) => {
  if (loading) return <div className="loading">Loading dashboard data…</div>;

  const usedPct = capacityInfo
    ? Math.round((capacityInfo.slotsUsed / (capacityInfo.dailyLimit || 1)) * 100)
    : 0;

  const statCards = [
    { label: 'Daily Capacity',     value: capacityInfo?.slotsUsed ?? 0,          sub: `of ${capacityInfo?.dailyLimit ?? 100} slots` },
    { label: 'Total Appointments', value: bookingStats?.totalAppointments ?? 0,   sub: 'today' },
    { label: 'Completed Today',    value: bookingStats?.completedToday ?? 0,       sub: 'appointments' },
    { label: 'No-Show Rate',       value: `${bookingStats?.noShowRate ?? 0}%`,     sub: 'this week' },
    { label: 'Avg Service Time',   value: `${bookingStats?.averageServiceTime ?? 0}m`, sub: 'per patient' },
    { label: 'Total Users',        value: bookingStats?.totalUsers ?? 0,           sub: `${bookingStats?.activeUsers ?? 0} active` },
  ];

  return (
    <div className="overview-content">
      <div className="stats-grid">
        {statCards.map((c) => (
          <div key={c.label} className="stat-card">
            <h3>{c.label}</h3>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="charts-section">
        {/* Today breakdown */}
        <div className="chart-card">
          <h3>Today's Appointment Breakdown</h3>
          <div className="chart-content">
            {[
              ['Pending',     bookingStats?.pendingToday     ?? 0],
              ['In Progress', bookingStats?.inProgressToday  ?? 0],
              ['Completed',   bookingStats?.completedToday   ?? 0],
              ['Cancelled',   bookingStats?.cancelledToday   ?? 0],
              ['No-Show',     bookingStats?.noShowToday      ?? 0],
            ].map(([label, val]) => (
              <div key={label} className="stat-row">
                <span>{label}:</span>
                <span><strong>{val}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity gauge */}
        <div className="chart-card">
          <h3>Capacity Utilisation</h3>
          <div className="chart-content">
            <div className="stat-row">
              <span>Slots Used:</span>
              <span><strong>{capacityInfo?.slotsUsed ?? 0} / {capacityInfo?.dailyLimit ?? 100}</strong></span>
            </div>
            <div className="stat-row">
              <span>Remaining:</span>
              <span><strong>{capacityInfo?.slotsRemaining ?? 0}</strong></span>
            </div>
            <div className="stat-row">
              <span>Utilisation:</span>
              <span><strong>{usedPct}%</strong></span>
            </div>
            <div className="capacity-bar" style={{ marginTop: '0.75rem' }}>
              <div
                className="capacity-fill"
                style={{
                  width: `${usedPct}%`,
                  background: usedPct > 85 ? '#dc3545' : usedPct > 60 ? '#ffc107' : '#28a745',
                }}
              />
            </div>
          </div>
        </div>

        {/* All-time */}
        <div className="chart-card">
          <h3>All-Time Summary</h3>
          <div className="chart-content">
            <div className="stat-row"><span>Total Appointments:</span><span><strong>{bookingStats?.totalAllTime ?? 0}</strong></span></div>
            <div className="stat-row"><span>Total Users:</span><span><strong>{bookingStats?.totalUsers ?? 0}</strong></span></div>
            <div className="stat-row"><span>Active Users:</span><span><strong>{bookingStats?.activeUsers ?? 0}</strong></span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Capacity Tab ─────────────────────────────────────────────────────────────
const CapacityTab = ({ loading, capacityInfo }) => {
  if (loading) return <div className="loading">Loading capacity data…</div>;

  const pct = capacityInfo
    ? Math.round((capacityInfo.slotsUsed / (capacityInfo.dailyLimit || 1)) * 100)
    : 0;

  const barColor = pct > 85 ? '#dc3545' : pct > 60 ? '#ffc107' : '#28a745';
  const statusLabel = pct > 85 ? '🔴 Critical' : pct > 60 ? '🟡 Moderate' : '🟢 Normal';

  return (
    <div className="capacity-content">
      <div className="capacity-overview">
        <h3>Capacity Management — {capacityInfo?.date ?? 'Today'}</h3>

        <div className="capacity-stats">
          {[
            ['Daily Limit',  capacityInfo?.dailyLimit    ?? 100],
            ['Slots Used',   capacityInfo?.slotsUsed     ?? 0],
            ['Remaining',    capacityInfo?.slotsRemaining ?? 0],
            ['Utilisation',  `${pct}%`],
          ].map(([label, val]) => (
            <div key={label} className="capacity-item">
              <div className="capacity-label">{label}</div>
              <div className="capacity-value">{val}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <span>Status: <strong>{statusLabel}</strong></span>
        </div>

        <div className="capacity-bar">
          <div className="capacity-fill" style={{ width: `${pct}%`, background: barColor }} />
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h4>Peak Hours Today</h4>
          <p style={{ color: '#6c757d', fontSize: '0.85rem' }}>
            Switch to the Analytics tab to see peak hour breakdown.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Analytics Tab ────────────────────────────────────────────────────────────
const AnalyticsTab = ({ loading, queueData, healthData }) => {
  if (loading) return <div className="loading">Loading analytics…</div>;

  return (
    <div className="analytics-content">
      <div className="analytics-grid">

        {/* Queue */}
        <div className="analytics-card">
          <h3>📋 Queue Analytics</h3>
          <div className="analytics-data">
            {[
              ['Current Queue',    `${queueData?.currentQueueSize ?? 0} patients`],
              ['Avg Wait Time',    `${queueData?.averageWaitTime ?? 0} min`],
              ['Completed Today',  queueData?.completedToday ?? 0],
              ['Total Today',      queueData?.totalToday ?? 0],
              ['Completion Rate',  `${queueData?.completionRate ?? 0}%`],
            ].map(([label, val]) => (
              <div key={label} className="metric">
                <span>{label}:</span>
                <span><strong>{val}</strong></span>
              </div>
            ))}
          </div>

          {queueData?.peakHours?.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Peak Hours</h4>
              {queueData.peakHours.map(({ hour, count }) => (
                <div key={hour} className="metric">
                  <span>{hour}:00 – {hour + 1}:00</span>
                  <span>
                    <strong>{count}</strong>
                    <span
                      style={{
                        display: 'inline-block',
                        marginLeft: '0.5rem',
                        height: '8px',
                        width: `${Math.min(count * 6, 80)}px`,
                        background: '#007bff',
                        borderRadius: '4px',
                        verticalAlign: 'middle',
                      }}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Trends */}
        <div className="analytics-card">
          <h3>🏥 Health Trends</h3>
          <div className="analytics-data">
            {[
              ['Total Patients',       healthData?.totalPatients ?? 0],
              ['Vitals Recorded',      healthData?.totalVitalsRecorded ?? 0],
              ['High Risk (BP)',        healthData?.highRiskCount ?? 0],
              ['Avg BP',               healthData?.averageBP ? `${healthData.averageBP.systolic}/${healthData.averageBP.diastolic}` : '—'],
              ['Avg BMI',              healthData?.averageBmi ?? '—'],
            ].map(([label, val]) => (
              <div key={label} className="metric">
                <span>{label}:</span>
                <span><strong>{val}</strong></span>
              </div>
            ))}
          </div>

          {healthData?.bpRiskDistribution && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>BP Risk Distribution</h4>
              {[
                ['Normal',    healthData.bpRiskDistribution.normal,   '#28a745'],
                ['Elevated',  healthData.bpRiskDistribution.elevated,  '#ffc107'],
                ['Stage 1',   healthData.bpRiskDistribution.stage1,    '#fd7e14'],
                ['Stage 2',   healthData.bpRiskDistribution.stage2,    '#dc3545'],
                ['Crisis',    healthData.bpRiskDistribution.crisis,    '#6f42c1'],
              ].map(([label, count, color]) => (
                <div key={label} className="metric">
                  <span style={{ color }}>{label}:</span>
                  <span><strong>{count}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BMI Distribution */}
        <div className="analytics-card">
          <h3>⚖️ BMI Distribution</h3>
          <div className="analytics-data">
            {healthData?.bmiDistribution ? (
              [
                ['Underweight', healthData.bmiDistribution.underweight, '#17a2b8'],
                ['Normal',      healthData.bmiDistribution.normal,      '#28a745'],
                ['Overweight',  healthData.bmiDistribution.overweight,  '#ffc107'],
                ['Obesity',     healthData.bmiDistribution.obesity,     '#dc3545'],
              ].map(([label, count, color]) => (
                <div key={label} className="metric">
                  <span style={{ color }}>{label}:</span>
                  <span><strong>{count}</strong></span>
                </div>
              ))
            ) : (
              <p style={{ color: '#6c757d' }}>No BMI data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div className="analytics-card">
          <h3>⭐ Patient Feedback</h3>
          <div className="analytics-data">
            {healthData?.feedbackStats ? (
              [
                ['Total Responses',   healthData.feedbackStats.total],
                ['NPS Score',         `${healthData.feedbackStats.avgNps} / 10`],
                ['Service Quality',   `${healthData.feedbackStats.avgServiceQuality} / 5`],
                ['Staff Behaviour',   `${healthData.feedbackStats.avgStaffBehavior} / 5`],
                ['Cleanliness',       `${healthData.feedbackStats.avgCleanliness} / 5`],
                ['Wait Time Rating',  `${healthData.feedbackStats.avgWaitTime} / 5`],
              ].map(([label, val]) => (
                <div key={label} className="metric">
                  <span>{label}:</span>
                  <span><strong>{val}</strong></span>
                </div>
              ))
            ) : (
              <p style={{ color: '#6c757d' }}>No feedback data yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = ({ loading, users, onRefresh }) => {
  const [showModal, setShowModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [toggling, setToggling]     = useState(null);
  const [formError, setFormError]   = useState('');
  const [newUser, setNewUser]       = useState({
    fullName: '', email: '', role: 'NURSE_OFFICER', password: '',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      setFormError('All fields are required.');
      return;
    }
    setSaving(true);
    try {
      await analyticsService.createStaffUser(newUser);
      setShowModal(false);
      setNewUser({ fullName: '', email: '', role: 'NURSE_OFFICER', password: '' });
      onRefresh();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (userId) => {
    setToggling(userId);
    try {
      await analyticsService.toggleUserStatus(userId);
      onRefresh();
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <div className="loading">Loading users…</div>;

  return (
    <div className="users-content">
      <div className="users-header">
        <h3>Staff Management ({users.length} staff)</h3>
        <Button onClick={() => setShowModal(true)}>+ Create Staff</Button>
      </div>

      {users.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          No staff users found. Create one to get started.
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role.replace(/_/g, ' ')}</td>
                  <td>
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <span className={`status ${u.isActive ? 'active' : 'inactive'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Button
                      size="small"
                      onClick={() => handleToggle(u.id)}
                      disabled={toggling === u.id}
                    >
                      {toggling === u.id
                        ? '…'
                        : u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Staff User</h3>
              <button onClick={() => { setShowModal(false); setFormError(''); }}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              {formError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}
              <Input
                label="Full Name"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="form-input"
                >
                  <option value="NURSE_OFFICER">Nurse Officer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="REGIONAL_OFFICE">Regional Office</option>
                  <option value="FEDERAL_ADMIN">Federal Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating…' : 'Create User'}
                </Button>
                <Button type="button" onClick={() => { setShowModal(false); setFormError(''); }}>
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

// ─── Audit Tab ────────────────────────────────────────────────────────────────
const AuditTab = ({ loading, logs }) => {
  if (loading) return <div className="loading">Loading audit logs…</div>;

  const actionColor = (action) => {
    if (action.includes('FAIL') || action.includes('UNAUTHORIZED')) return '#dc3545';
    if (action.includes('LOGIN'))    return '#28a745';
    if (action.includes('REGISTER')) return '#007bff';
    return '#495057';
  };

  return (
    <div className="users-content">
      <div className="users-header">
        <h3>Audit Trail ({logs.length} recent entries)</h3>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          No audit logs found.
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>{log.user?.fullName ?? '—'}</td>
                  <td>
                    <span style={{ color: actionColor(log.action), fontWeight: 600 }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.resource ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{log.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────
const SettingsTab = ({ systemSettings, setSystemSettings }) => {
  const [local, setLocal]   = useState(systemSettings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await analyticsService.updateSystemSettings(local);
      setSystemSettings(res.data);
      setMsg({ type: 'success', text: '✅ Settings saved successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: '❌ Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-content">
      <h3>System Settings</h3>

      {msg && (
        <div
          className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}
          style={{ marginBottom: '1rem' }}
        >
          {msg.text}
        </div>
      )}

      <div className="settings-form">
        <div className="form-group">
          <label>Daily Slot Limit</label>
          <Input
            type="number"
            value={local.dailySlotLimit}
            onChange={(e) => setLocal({ ...local, dailySlotLimit: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label>Appointment Interval (minutes)</label>
          <Input
            type="number"
            value={local.appointmentIntervalMinutes}
            onChange={(e) => setLocal({ ...local, appointmentIntervalMinutes: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.walkInEnabled}
              onChange={(e) => setLocal({ ...local, walkInEnabled: e.target.checked })}
            />
            Enable Walk-in Registration
          </label>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={local.autoConfirmBookings}
              onChange={(e) => setLocal({ ...local, autoConfirmBookings: e.target.checked })}
            />
            Auto-Confirm Online Bookings
          </label>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default ManagerDashboard;
