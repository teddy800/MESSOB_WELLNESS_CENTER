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
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [regions, setRegions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [centers, setCenters] = useState([]);
  const [trendsData, setTrendsData] = useState(null);

  const hasAccess = REGIONAL_ROLES.includes(user?.role);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardData, trends] = await Promise.allSettled([
        regionalService.getDashboardData(selectedRegion === 'all' ? null : selectedRegion),
        analyticsService.getTrends(),
      ]);

      if (dashboardData.status === 'fulfilled') {
        setAnalytics(dashboardData.value.analytics);
        setCenters(dashboardData.value.centers);
        setRegions(dashboardData.value.allRegions);
      }
      if (trends.status === 'fulfilled') {
        setTrendsData(trends.value.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
      console.error('Regional dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

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
    { id: 'comparison', label: '⚖️ Comparison' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Regional Office Dashboard</h1>
          <p className="dashboard-subtitle">
            Multi-Region Monitoring & Analytics — Welcome, {user?.fullName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="form-input"
            style={{ minWidth: '200px' }}
          >
            <option value="all">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
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
        {activeTab === 'overview' && <OverviewTab loading={loading} analytics={analytics} selectedRegion={selectedRegion} />}
        {activeTab === 'centers' && <CentersTab loading={loading} centers={centers} selectedRegion={selectedRegion} />}
        {activeTab === 'managers' && <ManagersTab loading={loading} centers={centers} regions={regions} onRefresh={loadDashboardData} />}
        {activeTab === 'performance' && <PerformanceTab loading={loading} analytics={analytics} trendsData={trendsData} />}
        {activeTab === 'comparison' && <ComparisonTab loading={loading} centers={centers} regions={regions} />}
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ loading, analytics, selectedRegion }) => {
  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading regional data…</div>;

  const summary = analytics?.summary || analytics || {};
  const isMultiRegion = selectedRegion === 'all';

  const statCards = [
    { icon: '🏥', label: 'Total Centers', value: analytics?.totalCenters || 0, sub: isMultiRegion ? `${analytics?.totalRegions || 0} regions` : selectedRegion, color: '#284394' },
    { icon: '👥', label: 'Total Staff', value: summary?.totalStaff || 0, sub: 'across all centers', color: '#2563eb' },
    { icon: '📋', label: 'Appointments', value: summary?.totalAppointments || 0, sub: 'total bookings', color: '#16a34a' },
    { icon: '✅', label: 'Completed', value: summary?.completedAppointments || 0, sub: 'appointments', color: '#22c55e' },
    { icon: '⏳', label: 'Pending', value: summary?.pendingAppointments || 0, sub: 'appointments', color: '#f59e0b' },
    { icon: '🩺', label: 'Vitals Recorded', value: summary?.totalVitals || 0, sub: 'health records', color: '#7c3aed' },
  ];

  // Completion rate
  const completionRate = summary?.totalAppointments > 0
    ? Math.round((summary.completedAppointments / summary.totalAppointments) * 100)
    : 0;

  // Regional breakdown for multi-region view
  const regionalData = analytics?.regions || [];

  return (
    <div className="mgr-overview">
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

      {/* Regional Breakdown (Multi-region view only) */}
      {isMultiRegion && regionalData.length > 0 && (
        <div className="mgr-chart-card" style={{ marginTop: '1.5rem' }}>
          <div className="mgr-chart-header">
            <span className="mgr-live-badge">● LIVE</span>
            <h3>Regional Performance Overview</h3>
            <p>Appointments and completion rates by region</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#284394" stopOpacity={1} />
                  <stop offset="100%" stopColor="#284394" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="region" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="summary.totalAppointments" name="Total Appointments" fill="url(#gradTotal)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="summary.completedAppointments" name="Completed" fill="url(#gradCompleted)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ─── Centers Tab ──────────────────────────────────────────────────────────────
const CentersTab = ({ loading, centers, selectedRegion }) => {
  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading centers…</div>;

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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

  return (
    <div className="users-content">
      <div className="users-header">
        <h3>Health Centers ({centers.length} centers)</h3>
        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          {selectedRegion === 'all' ? 'All Regions' : selectedRegion}
        </div>
      </div>

      {centers.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
          No centers found for the selected region.
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
              </tr>
            </thead>
            <tbody>
              {sortedCenters.map((center) => (
                <tr key={center.id}>
                  <td style={{ fontWeight: 600 }}>{center.name}</td>
                  <td><code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{center.code}</code></td>
                  <td>{center.region}</td>
                  <td>{center.city}</td>
                  <td>{center._count?.staff || 0}</td>
                  <td>{center.capacity || '—'}</td>
                  <td>
                    <span className={`status ${center.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {center.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {center.phone && <div>📞 {center.phone}</div>}
                    {center.email && <div>📧 {center.email}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Performance Tab ──────────────────────────────────────────────────────────
const PerformanceTab = ({ loading, analytics, trendsData }) => {
  const [period, setPeriod] = useState('weekly');

  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading performance data…</div>;

  const summary = analytics?.summary || analytics || {};

  // Sample data for demonstration
  const SAMPLE_WEEKLY = [
    { label: 'W1', appointments: 68, completed: 58, staff: 12 },
    { label: 'W2', appointments: 82, completed: 71, staff: 15 },
    { label: 'W3', appointments: 74, completed: 63, staff: 14 },
    { label: 'W4', appointments: 91, completed: 79, staff: 16 },
    { label: 'W5', appointments: 85, completed: 74, staff: 15 },
    { label: 'W6', appointments: 78, completed: 67, staff: 13 },
    { label: 'W7', appointments: 95, completed: 83, staff: 17 },
    { label: 'W8', appointments: 88, completed: 76, staff: 16 },
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

  return (
    <div className="mgr-analytics">
      {/* KPI Row */}
      <div className="mgr-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {[
          { icon: '📊', label: 'Total Appointments', value: summary?.totalAppointments || 0, color: '#284394' },
          { icon: '✅', label: 'Completed', value: summary?.completedAppointments || 0, color: '#22c55e' },
          { icon: '⏳', label: 'Pending', value: summary?.pendingAppointments || 0, color: '#f59e0b' },
          { icon: '🩺', label: 'Vitals', value: summary?.totalVitals || 0, color: '#7c3aed' },
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
      <div className="mgr-dark-card">
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Comparison Tab ───────────────────────────────────────────────────────────
const ComparisonTab = ({ loading, centers, regions }) => {
  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading comparison data…</div>;

  // Group centers by region
  const centersByRegion = centers.reduce((acc, center) => {
    if (!acc[center.region]) acc[center.region] = [];
    acc[center.region].push(center);
    return acc;
  }, {});

  const regionStats = Object.entries(centersByRegion).map(([region, regionCenters]) => ({
    region,
    centers: regionCenters.length,
    totalStaff: regionCenters.reduce((sum, c) => sum + (c._count?.staff || 0), 0),
    totalCapacity: regionCenters.reduce((sum, c) => sum + (c.capacity || 0), 0),
    activeCenters: regionCenters.filter(c => c.status === 'ACTIVE').length,
  }));

  // Top performing centers (by staff count)
  const topCenters = [...centers]
    .sort((a, b) => (b._count?.staff || 0) - (a._count?.staff || 0))
    .slice(0, 10);

  return (
    <div className="mgr-analytics">
      {/* Regional Comparison */}
      <div className="mgr-chart-card" style={{ marginBottom: '1.5rem' }}>
        <div className="mgr-chart-header">
          <h3>Regional Comparison</h3>
          <p>Centers and staff distribution across regions</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={regionStats} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              labelStyle={{ fontWeight: 600, color: '#1e293b' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="centers" name="Centers" fill="#284394" radius={[6, 6, 0, 0]} />
            <Bar dataKey="totalStaff" name="Total Staff" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Centers */}
      <div className="users-content">
        <div className="users-header">
          <h3>Top Performing Centers</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>Ranked by staff count</p>
        </div>

        {topCenters.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
            No centers available for comparison.
          </div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Center Name</th>
                  <th>Region</th>
                  <th>Staff</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topCenters.map((center, idx) => (
                  <tr key={center.id}>
                    <td>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: idx < 3 ? (idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#cd7f32') : '#e5e7eb',
                        color: idx < 3 ? '#fff' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}>
                        {idx + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{center.name}</td>
                    <td>{center.region}</td>
                    <td style={{ fontWeight: 700, color: '#284394' }}>{center._count?.staff || 0}</td>
                    <td>{center.capacity || '—'}</td>
                    <td>
                      <span className={`status ${center.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {center.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Managers Tab ─────────────────────────────────────────────────────────────
const ManagersTab = ({ loading, centers, regions, onRefresh }) => {
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [formError, setFormError] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'NURSE_OFFICER',
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
    
    // For region filter, we'd need center data - simplified for now
    const matchesRegion = filterRegion === 'all';
    
    return matchesRole && matchesSearch && matchesRegion;
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
      role: 'NURSE_OFFICER',
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
    NURSE_OFFICER: managers.filter(m => m.role === 'NURSE_OFFICER').length,
    MANAGER: managers.filter(m => m.role === 'MANAGER').length,
    REGIONAL_OFFICE: managers.filter(m => m.role === 'REGIONAL_OFFICE').length,
    FEDERAL_OFFICE: managers.filter(m => m.role === 'FEDERAL_OFFICE').length,
    SYSTEM_ADMIN: managers.filter(m => m.role === 'SYSTEM_ADMIN').length,
  };

  return (
    <div className="users-content">
      {/* Stats Row */}
      <div className="mgr-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: '1.5rem' }}>
        {[
          { icon: '👔', label: 'Total Staff', value: totalManagers, color: '#284394' },
          { icon: '✅', label: 'Active', value: activeManagers, color: '#22c55e' },
          { icon: '👨‍⚕️', label: 'Nurse Officers', value: managersByRole.NURSE_OFFICER, color: '#10b981' },
          { icon: '🏢', label: 'Center Managers', value: managersByRole.MANAGER, color: '#2563eb' },
          { icon: '🌍', label: 'Regional Officers', value: managersByRole.REGIONAL_OFFICE, color: '#7c3aed' },
          { icon: '🏛️', label: 'Federal Officers', value: managersByRole.FEDERAL_OFFICE, color: '#f59e0b' },
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
            <option value="NURSE_OFFICER">Nurse Officer</option>
            <option value="MANAGER">Center Manager</option>
            <option value="REGIONAL_OFFICE">Regional Officer</option>
            <option value="FEDERAL_OFFICE">Federal Officer</option>
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
                      background: manager.role === 'NURSE_OFFICER' ? '#d1fae5' :
                                 manager.role === 'MANAGER' ? '#dbeafe' : 
                                 manager.role === 'REGIONAL_OFFICE' ? '#e9d5ff' :
                                 manager.role === 'FEDERAL_OFFICE' ? '#fef3c7' :
                                 manager.role === 'SYSTEM_ADMIN' ? '#fee2e2' : '#f3f4f6',
                      color: manager.role === 'NURSE_OFFICER' ? '#065f46' :
                             manager.role === 'MANAGER' ? '#1e40af' :
                             manager.role === 'REGIONAL_OFFICE' ? '#6b21a8' :
                             manager.role === 'FEDERAL_OFFICE' ? '#92400e' :
                             manager.role === 'SYSTEM_ADMIN' ? '#991b1b' : '#374151',
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
                    <option value="FEDERAL_OFFICE">Federal Officer</option>
                    <option value="SYSTEM_ADMIN">System Admin</option>
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    ℹ️ Select the appropriate role for this staff member
                  </small>
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
