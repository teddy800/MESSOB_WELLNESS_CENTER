import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { regionalService } from '../services/regionalService';
import { analyticsService } from '../services/analyticsService';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

// ─── Role guard ───────────────────────────────────────────────────────────────
const REGIONAL_ROLES = ['REGIONAL_OFFICE', 'FEDERAL_OFFICE', 'SYSTEM_ADMIN'];

// ─── Root Component ───────────────────────────────────────────────────────────
const RegionalDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [centers, setCenters] = useState([]);
  const [trendsData, setTrendsData] = useState(null);

  const hasAccess = REGIONAL_ROLES.includes(user?.role);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, trends] = await Promise.allSettled([
        regionalService.getDashboardData(null),
        analyticsService.getTrends(),
      ]);

      if (dashboardData.status === 'fulfilled') {
        setAnalytics(dashboardData.value.analytics);
        const fetchedCenters = dashboardData.value.centers || [];
        setCenters(fetchedCenters);
      }
      if (trends.status === 'fulfilled') {
        setTrendsData(trends.value.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
      console.error('Center dashboard load error:', err);
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
          <p>Regional Office role required to access this dashboard.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'centers', label: '🏥 Centers' },
    { id: 'managers', label: '👔 Managers' },
    { id: 'performance', label: '📈 Performance' },
  ];

  // Filter centers based on selection
  const filteredCenters = selectedCenter === 'all' 
    ? centers 
    : centers.filter(c => c.id === selectedCenter);

  // Get center statistics
  const centerStats = {
    total: centers.length,
    active: centers.filter(c => c.status === 'ACTIVE').length,
    totalStaff: centers.reduce((sum, c) => sum + (c._count?.staff || 0), 0),
    totalCapacity: centers.reduce((sum, c) => sum + (c.capacity || 0), 0),
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Center Management Dashboard</h1>
          <p className="dashboard-subtitle">
            Create & Manage Health Centers — Welcome, {user?.fullName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="form-input"
            style={{ minWidth: '220px' }}
          >
            <option value="all">🏥 All Centers ({centers.length})</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                🏥 {c.name} - {c.city}
              </option>
            ))}
          </select>
          <button
            className="tab-btn"
            onClick={loadDashboardData}
            disabled={loading}
          >
            {loading ? '⏳ Loading…' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Center Statistics Bar */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '1rem 1.5rem', 
        borderRadius: '12px', 
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏥</span>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{centerStats.total}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Centers</div>
          </div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{centerStats.active}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Active Centers</div>
          </div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{centerStats.totalStaff}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Staff</div>
          </div>
        </div>
        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.3)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📊</span>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{centerStats.totalCapacity}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Capacity</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.9 }}>
          {selectedCenter !== 'all' && `📍 ${filteredCenters.find(c => c.id === selectedCenter)?.name}`}
          {selectedCenter === 'all' && '🏥 All Centers'}
        </div>
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
        {activeTab === 'overview' && <OverviewTab loading={loading} analytics={analytics} centers={filteredCenters} selectedCenter={selectedCenter} centerStats={centerStats} />}
        {activeTab === 'centers' && <CentersTab loading={loading} centers={filteredCenters} selectedCenter={selectedCenter} onRefresh={loadDashboardData} />}
        {activeTab === 'managers' && <ManagersTab loading={loading} centers={centers} onRefresh={loadDashboardData} />}
        {activeTab === 'performance' && <PerformanceTab loading={loading} analytics={analytics} trendsData={trendsData} centers={filteredCenters} />}
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ loading, analytics, centers, selectedCenter, centerStats }) => {
  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading center data…</div>;

  const summary = analytics?.summary || analytics || {};
  const isAllCenters = selectedCenter === 'all';

  // Calculate center-specific metrics
  const centerMetrics = centers.reduce((acc, center) => {
    acc.totalStaff += center._count?.staff || 0;
    acc.totalCapacity += center.capacity || 0;
    return acc;
  }, { totalStaff: 0, totalCapacity: 0 });

  const statCards = [
    { icon: '🏥', label: 'Centers', value: centers.length, sub: `${centerStats.active} active`, color: '#284394' },
    { icon: '👥', label: 'Total Staff', value: centerMetrics.totalStaff, sub: 'across all centers', color: '#2563eb' },
    { icon: '📋', label: 'Appointments', value: summary?.totalAppointments || 0, sub: 'total bookings', color: '#16a34a' },
    { icon: '✅', label: 'Completed', value: summary?.completedAppointments || 0, sub: 'appointments', color: '#22c55e' },
    { icon: '⏳', label: 'Pending', value: summary?.pendingAppointments || 0, sub: 'appointments', color: '#f59e0b' },
    { icon: '🩺', label: 'Vitals Recorded', value: summary?.totalVitals || 0, sub: 'health records', color: '#7c3aed' },
  ];

  // Completion rate
  const completionRate = summary?.totalAppointments > 0
    ? Math.round((summary.completedAppointments / summary.totalAppointments) * 100)
    : 0;

  // Center breakdown data
  const centerBreakdownData = centers.map(center => ({
    name: center.name,
    staff: center._count?.staff || 0,
    capacity: center.capacity || 0,
    region: center.region,
    city: center.city,
    status: center.status,
  })).slice(0, 10); // Top 10 centers

  return (
    <div className="mgr-overview">
      {/* Selection Info Banner */}
      {!isAllCenters && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <span style={{ fontSize: '2rem' }}>🏥</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {centers[0]?.name}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              📍 {centers[0]?.city}, {centers[0]?.region} • 
              👥 {centers[0]?._count?.staff || 0} Staff • 
              📊 {centers[0]?.capacity || 0} Capacity
            </div>
          </div>
          <span className={`status ${centers[0]?.status === 'ACTIVE' ? 'active' : 'inactive'}`} style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 600,
            background: centers[0]?.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: centers[0]?.status === 'ACTIVE' ? '2px solid #22c55e' : '2px solid #ef4444',
            color: 'white'
          }}>
            {centers[0]?.status}
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mgr-kpi-grid">
        {statCards.map((c) => (
          <div key={c.label} className="mgr-kpi-card">
            <div className="mgr-kpi-icon" style={{ background: c.color + '18', color: c.color }}>{c.icon}</div>
            <div className="mgr-kpi-body">
              <div className="mgr-kpi-value" style={{ color: c.color }}>{c.value}</div>
              <div className="mgr-kpi-label">{c.label}</div>
              <div className="mgr-kpi-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="mgr-charts-row" style={{ marginTop: '1.5rem' }}>
        {/* Completion Rate Gauge */}
        <div className="mgr-chart-card">
          <div className="mgr-chart-header">
            <h3>Completion Rate</h3>
            <span className={`mgr-status-badge ${completionRate > 80 ? 'normal' : completionRate > 60 ? 'moderate' : 'critical'}`}>
              {completionRate > 80 ? '🟢 Excellent' : completionRate > 60 ? '🟡 Good' : '🔴 Needs Attention'}
            </span>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: completionRate > 80 ? '#22c55e' : completionRate > 60 ? '#f59e0b' : '#ef4444' }}>
              {completionRate}%
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {summary?.completedAppointments || 0} of {summary?.totalAppointments || 0} appointments completed
            </div>
          </div>
        </div>

        {/* Feedback Score */}
        <div className="mgr-chart-card">
          <div className="mgr-chart-header">
            <h3>Average Feedback</h3>
            <p>Patient satisfaction score</p>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: '#3b82f6' }}>
              {summary?.averageFeedback ? summary.averageFeedback.toFixed(1) : '0.0'}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              ⭐ Out of 5.0
            </div>
          </div>
        </div>
      </div>

      {/* Center Performance Breakdown (Multi-center view only) */}
      {isAllCenters && centerBreakdownData.length > 0 && (
        <div className="mgr-chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="mgr-chart-header">
            <span className="mgr-live-badge">● LIVE</span>
            <h3>Center Performance Overview</h3>
            <p>Staff and capacity distribution across centers</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={centerBreakdownData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradStaff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradCapacity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#6b7280' }} 
                axisLine={false} 
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                formatter={(value, name, props) => {
                  if (name === 'Staff') return [value, `👥 ${name}`];
                  if (name === 'Capacity') return [value, `📊 ${name}`];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="staff" name="Staff" fill="url(#gradStaff)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="capacity" name="Capacity" fill="url(#gradCapacity)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Center Quick Stats Grid */}
      {isAllCenters && centers.length > 0 && (
        <div className="mgr-chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="mgr-chart-header">
            <h3>Center Quick Stats</h3>
            <p>Overview of all centers in selection</p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1rem',
            padding: '1rem'
          }}>
            {centers.slice(0, 6).map((center) => (
              <div key={center.id} style={{
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{center.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                      📍 {center.city}, {center.region}
                    </div>
                  </div>
                  <span className={`status ${center.status === 'ACTIVE' ? 'active' : 'inactive'}`} style={{ fontSize: '0.75rem' }}>
                    {center.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{center._count?.staff || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>👥 Staff</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{center.capacity || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📊 Capacity</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {centers.length > 6 && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>
              + {centers.length - 6} more centers
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Centers Tab ──────────────────────────────────────────────────────────────
const CentersTab = ({ loading, centers, selectedCenter, onRefresh }) => {
  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading centers…</div>;

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: '',
    city: '',
    capacity: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });

  const sortedCenters = [...centers].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name':
        aVal = a.name || '';
        bVal = b.name || '';
        break;
      case 'staff':
        aVal = a._count?.staff || 0;
        bVal = b._count?.staff || 0;
        break;
      case 'capacity':
        aVal = a.capacity || 0;
        bVal = b.capacity || 0;
        break;
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      default:
        return 0;
    }
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreateCenter = () => {
    setEditingCenter(null);
    setFormData({
      name: '',
      code: '',
      region: '',
      city: '',
      capacity: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleEditCenter = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name || '',
      code: center.code || '',
      region: center.region || '',
      city: center.city || '',
      capacity: center.capacity || '',
      phone: center.phone || '',
      email: center.email || '',
      status: center.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.code || !formData.region || !formData.city) {
      setFormError('Name, code, region, and city are required.');
      return;
    }

    setSaving(true);
    try {
      // TODO: Implement center creation/update API
      console.log('Center data:', formData);
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save center.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCenter(null);
    setFormData({
      name: '',
      code: '',
      region: '',
      city: '',
      capacity: '',
      phone: '',
      email: '',
      status: 'ACTIVE',
    });
    setFormError('');
  };

  return (
    <div className="users-content">
      <div className="users-header">
        <div>
          <h3>Health Centers Directory ({centers.length} centers)</h3>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {selectedCenter !== 'all' && `📍 ${centers[0]?.name}`}
            {selectedCenter === 'all' && '🏥 All Centers'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            style={{ padding: '0.5rem 1rem' }}
          >
            📋 Table
          </button>
          <button
            className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            style={{ padding: '0.5rem 1rem' }}
          >
            🎛️ Grid
          </button>
          <Button onClick={handleCreateCenter}>+ Create Center</Button>
        </div>
      </div>

      {centers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          No centers found. Create one to get started.
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem',
          padding: '1rem 0'
        }}>
          {sortedCenters.map((center) => (
            <div key={center.id} style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '1.5rem',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {center.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    <div>📍 {center.city}, {center.region}</div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <code style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {center.code}
                      </code>
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: center.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                  border: center.status === 'ACTIVE' ? '2px solid #22c55e' : '2px solid #ef4444'
                }}>
                  {center.status}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{center._count?.staff || 0}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>👥 Staff Members</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 800 }}>{center.capacity || 0}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>📊 Daily Capacity</div>
                </div>
              </div>

              {(center.phone || center.email) && (
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.85rem',
                  opacity: 0.9
                }}>
                  {center.phone && <div>📞 {center.phone}</div>}
                  {center.email && <div style={{ marginTop: '0.25rem' }}>📧 {center.email}</div>}
                </div>
              )}

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <Button 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCenter(center);
                  }}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  ✏️ Edit Center
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Center Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Code</th>
                <th>Region</th>
                <th>City</th>
                <th onClick={() => handleSort('staff')} style={{ cursor: 'pointer' }}>
                  Staff {sortBy === 'staff' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('capacity')} style={{ cursor: 'pointer' }}>
                  Capacity {sortBy === 'capacity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCenters.map((center) => (
                <tr key={center.id}>
                  <td style={{ fontWeight: 600 }}>{center.name}</td>
                  <td><code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{center.code}</code></td>
                  <td>{center.region}</td>
                  <td>{center.city}</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{center._count?.staff || 0}</td>
                  <td style={{ fontWeight: 700, color: '#22c55e' }}>{center.capacity || '—'}</td>
                  <td>
                    <span className={`status ${center.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {center.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {center.phone && <div>📞 {center.phone}</div>}
                    {center.email && <div>📧 {center.email}</div>}
                  </td>
                  <td>
                    <Button
                      size="small"
                      onClick={() => handleEditCenter(center)}
                    >
                      ✏️ Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>{editingCenter ? '✏️ Edit Center' : '➕ Create New Center'}</h3>
              <button onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Center Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Addis Ababa Main Center"
                />
                <Input
                  label="Center Code *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="AAC-001"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Region *"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                  placeholder="Addis Ababa"
                />
                <Input
                  label="City *"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  placeholder="Addis Ababa"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Daily Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="100"
                />
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251911234567"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="center@mesob.et"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingCenter ? '💾 Update Center' : '➕ Create Center'}
                </Button>
                <Button type="button" onClick={handleCloseModal}>
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

// ─── Performance Tab ──────────────────────────────────────────────────────────
const PerformanceTab = ({ loading, analytics, trendsData, centers }) => {
  const [period, setPeriod] = useState('weekly');

  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading performance data…</div>;

  const summary = analytics?.summary || analytics || {};

  // Sample data for demonstration
  const SAMPLE_WEEKLY = [
    { label: 'W1', appointments: 68, completed: 58, staff: 12, vitals: 65 },
    { label: 'W2', appointments: 82, completed: 71, staff: 15, vitals: 78 },
    { label: 'W3', appointments: 74, completed: 63, staff: 14, vitals: 70 },
    { label: 'W4', appointments: 91, completed: 79, staff: 16, vitals: 85 },
    { label: 'W5', appointments: 85, completed: 74, staff: 15, vitals: 80 },
    { label: 'W6', appointments: 78, completed: 67, staff: 13, vitals: 72 },
    { label: 'W7', appointments: 95, completed: 83, staff: 17, vitals: 90 },
    { label: 'W8', appointments: 88, completed: 76, staff: 16, vitals: 82 },
  ];

  const SAMPLE_MONTHLY = [
    { label: 'Jan', appointments: 310, completed: 268, vitals: 290, staff: 55 },
    { label: 'Feb', appointments: 285, completed: 247, vitals: 265, staff: 52 },
    { label: 'Mar', appointments: 342, completed: 298, vitals: 318, staff: 58 },
    { label: 'Apr', appointments: 368, completed: 321, vitals: 344, staff: 62 },
    { label: 'May', appointments: 395, completed: 347, vitals: 372, staff: 65 },
    { label: 'Jun', appointments: 412, completed: 362, vitals: 389, staff: 68 },
  ];

  const trendData = period === 'weekly' 
    ? (trendsData?.weekly || SAMPLE_WEEKLY)
    : (trendsData?.monthly || SAMPLE_MONTHLY);

  const periodLabel = period === 'weekly' ? 'Last 8 Weeks' : 'Last 6 Months';

  // Center performance metrics
  const centerPerformance = centers.map(center => ({
    name: center.name,
    staff: center._count?.staff || 0,
    capacity: center.capacity || 0,
    utilization: center.capacity ? Math.round((center._count?.staff || 0) / center.capacity * 100) : 0,
    region: center.region,
  })).sort((a, b) => b.utilization - a.utilization).slice(0, 10);

  return (
    <div className="mgr-analytics">
      {/* KPI Row */}
      <div className="mgr-kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '1.5rem' }}>
        {[
          { icon: '📊', label: 'Total Appointments', value: summary?.totalAppointments || 0, color: '#284394' },
          { icon: '✅', label: 'Completed', value: summary?.completedAppointments || 0, color: '#22c55e' },
          { icon: '⏳', label: 'Pending', value: summary?.pendingAppointments || 0, color: '#f59e0b' },
          { icon: '🩺', label: 'Vitals', value: summary?.totalVitals || 0, color: '#7c3aed' },
          { icon: '🏥', label: 'Centers', value: centers.length, color: '#0891b2' },
        ].map(c => (
          <div key={c.label} className="mgr-kpi-card">
            <div className="mgr-kpi-icon" style={{ background: c.color + '18', color: c.color }}>{c.icon}</div>
            <div className="mgr-kpi-body">
              <div className="mgr-kpi-value" style={{ color: c.color }}>{c.value}</div>
              <div className="mgr-kpi-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="mgr-dark-card" style={{ marginBottom: '1.5rem' }}>
        <div className="mgr-dark-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
            <span className="mgr-live-dot" />
            <span className="mgr-dark-title">📈 Performance Trends — {periodLabel}</span>
          </div>
          <div className="mgr-period-switcher">
            {['weekly', 'monthly'].map(p => (
              <button key={p} className={`mgr-period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradAppt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradVitals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f1f5f9' }}
              labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#6366f1" strokeWidth={3} fill="url(#gradAppt)" dot={{ r: 5, fill: '#6366f1' }} />
            <Area type="monotone" dataKey="completed" name="Completed" stroke="#22d3ee" strokeWidth={3} fill="url(#gradComp)" dot={{ r: 5, fill: '#22d3ee' }} />
            <Area type="monotone" dataKey="vitals" name="Vitals" stroke="#a78bfa" strokeWidth={2} fill="url(#gradVitals)" dot={{ r: 4, fill: '#a78bfa' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Center Performance Ranking */}
      {centerPerformance.length > 0 && (
        <div className="mgr-chart-card">
          <div className="mgr-chart-header">
            <h3>Center Performance Ranking</h3>
            <p>Top performing centers by staff utilization</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={centerPerformance} layout="horizontal" margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradUtil" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#6b7280' }} 
                axisLine={false} 
                tickLine={false}
                width={150}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                formatter={(value, name, props) => {
                  if (name === 'Staff') return [value, `👥 ${name}`];
                  if (name === 'Capacity') return [value, `📊 ${name}`];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="staff" name="Staff" fill="#2563eb" radius={[0, 6, 6, 0]} />
              <Bar dataKey="capacity" name="Capacity" fill="url(#gradUtil)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ─── Managers Tab ─────────────────────────────────────────────────────────────
const ManagersTab = ({ loading, centers, onRefresh }) => {
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [formError, setFormError] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'MANAGER',
    password: '',
    phone: '',
    centerId: '',
  });

  // Load managers
  const loadManagers = useCallback(async () => {
    setLoadingManagers(true);
    try {
      const response = await analyticsService.getStaffUsers();
      if (response.success) {
        setManagers(response.data);
      }
    } catch (err) {
      console.error('Error loading managers:', err);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  // Filter managers
  const filteredManagers = managers.filter(m => {
    const matchesRole = filterRole === 'all' || m.role === filterRole;
    const matchesSearch = !searchTerm || 
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesSearch;
  });

  // Handle create/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName || !formData.email || !formData.role) {
      setFormError('Name, email, and role are required.');
      return;
    }

    if (!editingManager && !formData.password) {
      setFormError('Password is required for new managers.');
      return;
    }

    setSaving(true);
    try {
      if (editingManager) {
        // Update existing manager
        await analyticsService.updateStaffUser(editingManager.id, {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          centerId: formData.centerId || null,
        });
      } else {
        // Create new manager
        await analyticsService.createStaffUser({
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          phone: formData.phone,
          centerId: formData.centerId || null,
        });
      }
      
      setShowModal(false);
      setEditingManager(null);
      setFormData({
        fullName: '',
        email: '',
        role: 'MANAGER',
        password: '',
        phone: '',
        centerId: '',
      });
      loadManagers();
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save manager.');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      fullName: manager.fullName,
      email: manager.email,
      role: manager.role,
      password: '',
      phone: manager.phone || '',
      centerId: manager.centerId || '',
    });
    setShowModal(true);
  };

  // Handle toggle status
  const handleToggle = async (managerId) => {
    setToggling(managerId);
    try {
      await analyticsService.toggleUserStatus(managerId);
      loadManagers();
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      setToggling(null);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingManager(null);
    setFormData({
      fullName: '',
      email: '',
      role: 'MANAGER',
      password: '',
      phone: '',
      centerId: '',
    });
    setFormError('');
  };

  if (loading || loadingManagers) {
    return <div className="mgr-loading"><div className="mgr-spinner" />Loading managers…</div>;
  }

  // Stats
  const totalManagers = managers.length;
  const activeManagers = managers.filter(m => m.isActive).length;
  const managersByRole = {
    MANAGER: managers.filter(m => m.role === 'MANAGER').length,
    REGIONAL_OFFICE: managers.filter(m => m.role === 'REGIONAL_OFFICE').length,
    NURSE_OFFICER: managers.filter(m => m.role === 'NURSE_OFFICER').length,
    SYSTEM_ADMIN: managers.filter(m => m.role === 'SYSTEM_ADMIN').length,
  };

  return (
    <div className="users-content">
      {/* Stats Row */}
      <div className="mgr-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {[
          { icon: '👔', label: 'Total Managers', value: totalManagers, color: '#284394' },
          { icon: '✅', label: 'Active', value: activeManagers, color: '#22c55e' },
          { icon: '🏢', label: 'Center Managers', value: managersByRole.MANAGER, color: '#2563eb' },
          { icon: '🌍', label: 'Regional Officers', value: managersByRole.REGIONAL_OFFICE, color: '#7c3aed' },
        ].map(c => (
          <div key={c.label} className="mgr-kpi-card">
            <div className="mgr-kpi-icon" style={{ background: c.color + '18', color: c.color }}>{c.icon}</div>
            <div className="mgr-kpi-body">
              <div className="mgr-kpi-value" style={{ color: c.color }}>{c.value}</div>
              <div className="mgr-kpi-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header with filters */}
      <div className="users-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3>Manager Directory ({filteredManagers.length} managers)</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '250px' }}
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="form-input"
            style={{ minWidth: '180px' }}
          >
            <option value="all">All Roles</option>
            <option value="MANAGER">Center Manager</option>
            <option value="REGIONAL_OFFICE">Regional Officer</option>
            <option value="NURSE_OFFICER">Nurse Officer</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
          </select>
          <Button onClick={() => setShowModal(true)}>+ Create Manager</Button>
        </div>
      </div>

      {/* Managers Table */}
      {filteredManagers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          {searchTerm || filterRole !== 'all' 
            ? 'No managers match your filters.' 
            : 'No managers found. Create one to get started.'}
        </div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.map((manager) => (
                <tr key={manager.id}>
                  <td style={{ fontWeight: 600 }}>{manager.fullName}</td>
                  <td>{manager.email}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: manager.role === 'MANAGER' ? '#dbeafe' : 
                                 manager.role === 'REGIONAL_OFFICE' ? '#e9d5ff' :
                                 manager.role === 'NURSE_OFFICER' ? '#d1fae5' : '#fef3c7',
                      color: manager.role === 'MANAGER' ? '#1e40af' :
                             manager.role === 'REGIONAL_OFFICE' ? '#6b21a8' :
                             manager.role === 'NURSE_OFFICER' ? '#065f46' : '#92400e',
                    }}>
                      {manager.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{manager.phone || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {manager.lastLoginAt
                      ? new Date(manager.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <span className={`status ${manager.isActive ? 'active' : 'inactive'}`}>
                      {manager.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        size="small"
                        onClick={() => handleEdit(manager)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleToggle(manager.id)}
                        disabled={toggling === manager.id}
                      >
                        {toggling === manager.id
                          ? '…'
                          : manager.isActive ? '🔒 Deactivate' : '🔓 Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingManager ? '✏️ Edit Manager' : '➕ Create New Manager'}</h3>
              <button onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder="John Doe"
                />
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="john@mesob.et"
                  disabled={!!editingManager}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="form-input"
                    required
                  >
                    <option value="NURSE_OFFICER">Nurse Officer</option>
                    <option value="MANAGER">Center Manager</option>
                    <option value="REGIONAL_OFFICE">Regional Officer</option>
                    <option value="SYSTEM_ADMIN">System Admin</option>
                  </select>
                </div>

                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251911234567"
                />
              </div>

              {!editingManager && (
                <Input
                  label="Password *"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Minimum 8 characters"
                />
              )}

              <div className="form-group">
                <label>Assign to Center (Optional)</label>
                <select
                  value={formData.centerId}
                  onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                  className="form-input"
                >
                  <option value="">No Center Assignment</option>
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.region})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Assign this manager to a specific health center
                </small>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editingManager ? '💾 Update Manager' : '➕ Create Manager'}
                </Button>
                <Button type="button" onClick={handleCloseModal}>
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

export default RegionalDashboard;
