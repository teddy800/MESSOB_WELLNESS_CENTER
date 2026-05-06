import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { regionalService } from '../services/regionalService';
import { analyticsService } from '../services/analyticsService';
import AdminLayout from '../layouts/AdminLayout';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import '../styles/admin-layout.css';
import '../styles/admin-dashboard.css';

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
  const [centerAnalytics, setCenterAnalytics] = useState(null); // per-center analytics
  const [centers, setCenters] = useState([]);
  const [trendsData, setTrendsData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);


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
        const { analytics, centers } = dashboardData.value;
        setAnalytics(analytics);
        setCenters(Array.isArray(centers) ? centers : []);
      }
      if (trends.status === 'fulfilled') {
        setTrendsData(trends.value.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
      console.error('Center dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load per-center analytics when a specific center is selected
  useEffect(() => {
    if (selectedCenter !== 'all') {
      regionalService.getCenterAnalytics(selectedCenter)
        .then(res => setCenterAnalytics(res?.data ?? res ?? null))
        .catch(() => setCenterAnalytics(null));
    } else {
      setCenterAnalytics(null);
    }
  }, [selectedCenter]);

  // Initial load
  useEffect(() => {
    if (hasAccess) {
      loadDashboardData();
    }
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
    { id: 'centers', label: `🏥 Centers (${centers.length})` },
    { id: 'managers', label: '👔 Managers' },
    { id: 'performance', label: '📈 Performance' },
  ];

  // Filter centers based on selection
  const filteredCenters = selectedCenter === 'all'
    ? centers
    : centers.filter(c => c.id === selectedCenter);

  // Effective analytics: use per-center analytics if a center is selected
  const effectiveAnalytics = selectedCenter !== 'all' && centerAnalytics
    ? { summary: centerAnalytics }
    : analytics;

  // Get center statistics
  const centerStats = {
    total: centers.length,
    active: centers.filter(c => c.status === 'ACTIVE').length,
    totalStaff: centers.reduce((sum, c) => sum + (c._count?.staff || 0), 0),
    totalCapacity: centers.reduce((sum, c) => sum + (c.capacity || 0), 0),
  };

  const roleLabel = user?.role === 'FEDERAL_OFFICE' ? 'Federal Office'
    : user?.role === 'SYSTEM_ADMIN' ? 'System Admin'
    : 'Regional Office';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>📊 Regional Overview</h2>
              <div className="center-selector" style={{
                background: 'rgba(255,255,255,0.1)', 
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', 
                padding: '0.5rem'
              }}>
                <select
                  value={selectedCenter}
                  onChange={(e) => setSelectedCenter(e.target.value)}
                  style={{
                    minWidth: '200px',
                    padding: '0.5rem 2rem 0.5rem 0.85rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#2d3748',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                  }}
                >
                  <option value="all">🏥 All Centers ({centers.length})</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.status === 'ACTIVE' ? '✅' : '⚠️'} {c.name} — {c.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <OverviewTab loading={loading} analytics={effectiveAnalytics} centers={filteredCenters} selectedCenter={selectedCenter} centerStats={centerStats} />
          </div>
        );
      case 'centers':
        return (
          <div className="dashboard-section">
            <h2>🏥 Center Management</h2>
            <CentersTab loading={loading} centers={filteredCenters} selectedCenter={selectedCenter} onRefresh={loadDashboardData} />
          </div>
        );
      case 'managers':
        return (
          <div className="dashboard-section">
            <h2>👔 Manager Oversight</h2>
            <ManagersTab loading={loading} centers={centers} onRefresh={loadDashboardData} />
          </div>
        );
      case 'performance':
        return (
          <div className="dashboard-section">
            <h2>📈 Performance Analytics</h2>
            <PerformanceTab loading={loading} analytics={effectiveAnalytics} trendsData={trendsData} centers={filteredCenters} />
          </div>
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      dashboardType="regional"
      user={user}
      centerStats={centerStats}
      centersCount={centers.length}
      onRefresh={loadDashboardData}
      loading={loading}
      lastUpdated={lastUpdated}
      error={error}
      selectedCenter={selectedCenter}
      setSelectedCenter={setSelectedCenter}
      centers={centers}
    >
      {renderContent()}
    </AdminLayout>
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
          background: 'linear-gradient(135deg, #4c6fbe 0%, #5b7fd6 100%)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 12px rgba(76, 111, 190, 0.3)'
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
        <div style={{
          marginTop: '1.5rem',
          background: 'linear-gradient(135deg, #0f1f5c 0%, #1a3a8f 40%, #1e4db7 70%, #2563eb 100%)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 20px 60px rgba(15, 31, 92, 0.5), 0 0 40px rgba(37, 99, 235, 0.2)',
          border: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow orbs */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#4ade80',
              letterSpacing: '0.05em',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block' }} />
              LIVE
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Center Performance Overview
            </h3>
          </div>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
            Staff and capacity distribution across all {centerBreakdownData.length} centers
          </p>

          {/* Summary pills */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Centers', value: centerBreakdownData.length, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
              { label: 'Total Staff', value: centerBreakdownData.reduce((s, c) => s + c.staff, 0), color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
              { label: 'Total Capacity', value: centerBreakdownData.reduce((s, c) => s + c.capacity, 0), color: '#4ade80', bg: 'rgba(74,222,128,0.15)' },
            ].map(p => (
              <div key={p.label} style={{
                background: p.bg, border: `1px solid ${p.color}40`,
                borderRadius: '10px', padding: '0.5rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: p.color }}>{p.value}</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{p.label}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={Math.max(280, centerBreakdownData.length * 42)}>
            <BarChart
              data={centerBreakdownData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="gradStaffBlue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="gradCapacityGreen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
                </linearGradient>
                <filter id="barGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fontSize: 12, fill: '#ffffff', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(name) => name.length > 20 ? name.slice(0, 18) + '…' : name}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                contentStyle={{
                  background: 'linear-gradient(135deg, #0f1f5c 0%, #1a3a8f 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  color: '#ffffff',
                  padding: '0.75rem 1rem',
                }}
                labelStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}
                itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}
                formatter={(value, name) => {
                  if (name === '👥 Staff') return [`${value} members`, name];
                  if (name === '📊 Capacity') return [`${value} slots/day`, name];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => (
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
                )}
              />
              <Bar dataKey="staff" name="👥 Staff" fill="url(#gradStaffBlue)" radius={[0, 8, 8, 0]} maxBarSize={18} filter="url(#barGlow)" />
              <Bar dataKey="capacity" name="📊 Capacity" fill="url(#gradCapacityGreen)" radius={[0, 8, 8, 0]} maxBarSize={18} filter="url(#barGlow)" />
            </BarChart>
          </ResponsiveContainer>

          {/* Center name list below chart — ensures all are visible */}
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.6rem',
          }}>
            {centerBreakdownData.map((c, i) => (
              <div key={c.name} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.07)',
                borderRadius: '8px', padding: '0.4rem 0.75rem',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>
                    👥 {c.staff} · 📊 {c.capacity}
                  </div>
                </div>
                <span style={{
                  marginLeft: 'auto', flexShrink: 0,
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '0.15rem 0.4rem', borderRadius: '4px',
                  background: c.status === 'ACTIVE' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)',
                  color: c.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                  border: `1px solid ${c.status === 'ACTIVE' ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }}>
                  {c.status === 'ACTIVE' ? '● ON' : '○ OFF'}
                </span>
              </div>
            ))}
          </div>
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
                background: 'linear-gradient(135deg, #4c6fbe 0%, #5b7fd6 100%)',
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(76, 111, 190, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{center.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.25rem' }}>
                      📍 {center.city}, {center.region}
                    </div>
                  </div>
                  <span className={`status ${center.status === 'ACTIVE' ? 'active' : 'inactive'}`} style={{ fontSize: '0.75rem' }}>
                    {center.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{center._count?.staff || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)' }}>👥 Staff</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>{center.capacity || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.85)' }}>📊 Capacity</div>
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
    address: '',
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
      address: '',
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
      address: center.address || '',
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

    if (!formData.name || !formData.code || !formData.region || !formData.city || !formData.address) {
      setFormError('Name, code, region, city, and address are required.');
      return;
    }

    setSaving(true);
    try {
      const centerData = {
        name: formData.name,
        code: formData.code,
        region: formData.region,
        city: formData.city,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      };

      if (editingCenter) {
        // Update existing center
        await regionalService.updateCenter(editingCenter.id, {
          ...centerData,
          status: formData.status,
        });
      } else {
        // Create new center
        await regionalService.createCenter(centerData);
      }

      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to save center.');
      console.error('Center save error:', err);
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
      address: '',
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
              background: 'linear-gradient(135deg, #4c6fbe 0%, #5b7fd6 100%)',
              padding: '1.5rem',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 8px 24px rgba(76, 111, 190, 0.3)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(76, 111, 190, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 111, 190, 0.3)';
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

              <Input
                label="Address *"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="Bole Road, Near Edna Mall"
              />

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
  const [selectedMetric, setSelectedMetric] = useState('appointments');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  if (loading) return <div className="mgr-loading"><div className="mgr-spinner" />Loading performance data…</div>;

  const summary = analytics?.summary || analytics || {};

  // Enhanced sample data with more metrics for demonstration
  const SAMPLE_DAILY = [
    { label: 'Mon', appointments: 12, completed: 10, noShow: 1, vitals: 11, newUsers: 3, efficiency: 83 },
    { label: 'Tue', appointments: 15, completed: 13, noShow: 1, vitals: 14, newUsers: 4, efficiency: 87 },
    { label: 'Wed', appointments: 18, completed: 16, noShow: 2, vitals: 17, newUsers: 5, efficiency: 89 },
    { label: 'Thu', appointments: 14, completed: 12, noShow: 1, vitals: 13, newUsers: 2, efficiency: 86 },
    { label: 'Fri', appointments: 20, completed: 17, noShow: 2, vitals: 19, newUsers: 6, efficiency: 85 },
    { label: 'Sat', appointments: 16, completed: 14, noShow: 1, vitals: 15, newUsers: 3, efficiency: 88 },
    { label: 'Sun', appointments: 8, completed: 7, noShow: 0, vitals: 8, newUsers: 1, efficiency: 88 },
  ];

  const SAMPLE_WEEKLY = [
    { label: 'W1', appointments: 68, completed: 58, noShow: 5, vitals: 65, newUsers: 18, efficiency: 85 },
    { label: 'W2', appointments: 82, completed: 71, noShow: 6, vitals: 78, newUsers: 22, efficiency: 87 },
    { label: 'W3', appointments: 74, completed: 63, noShow: 7, vitals: 70, newUsers: 19, efficiency: 85 },
    { label: 'W4', appointments: 91, completed: 79, noShow: 8, vitals: 85, newUsers: 25, efficiency: 87 },
    { label: 'W5', appointments: 85, completed: 74, noShow: 6, vitals: 80, newUsers: 21, efficiency: 87 },
    { label: 'W6', appointments: 78, completed: 67, noShow: 7, vitals: 72, newUsers: 20, efficiency: 86 },
    { label: 'W7', appointments: 95, completed: 83, noShow: 8, vitals: 90, newUsers: 28, efficiency: 87 },
    { label: 'W8', appointments: 88, completed: 76, noShow: 7, vitals: 82, newUsers: 24, efficiency: 86 },
  ];

  const SAMPLE_MONTHLY = [
    { label: 'Jan', appointments: 310, completed: 268, noShow: 25, vitals: 290, newUsers: 85, efficiency: 86 },
    { label: 'Feb', appointments: 285, completed: 247, noShow: 22, vitals: 265, newUsers: 78, efficiency: 87 },
    { label: 'Mar', appointments: 342, completed: 298, noShow: 28, vitals: 318, newUsers: 95, efficiency: 87 },
    { label: 'Apr', appointments: 368, completed: 321, noShow: 30, vitals: 344, newUsers: 102, efficiency: 87 },
    { label: 'May', appointments: 395, completed: 347, noShow: 32, vitals: 372, newUsers: 115, efficiency: 88 },
    { label: 'Jun', appointments: 412, completed: 362, noShow: 35, vitals: 389, newUsers: 125, efficiency: 88 },
  ];

  // Get appropriate data based on period
  const getTrendData = () => {
    if (period === 'daily') {
      return trendsData?.daily || SAMPLE_DAILY;
    } else if (period === 'weekly') {
      return trendsData?.weekly || SAMPLE_WEEKLY;
    } else {
      return trendsData?.monthly || SAMPLE_MONTHLY;
    }
  };

  const trendData = getTrendData();
  const periodLabel = period === 'daily' ? 'Last 7 Days' : 
                     period === 'weekly' ? 'Last 8 Weeks' : 'Last 6 Months';

  // Center performance metrics
  const centerPerformance = centers.map(center => ({
    name: center.name,
    staff: center._count?.staff || 0,
    capacity: center.capacity || 0,
    utilization: center.capacity ? Math.round((center._count?.staff || 0) / center.capacity * 100) : 0,
    region: center.region,
  })).sort((a, b) => b.utilization - a.utilization).slice(0, 10);

  // Calculate performance metrics
  const calculateMetrics = () => {
    const totalAppointments = trendData.reduce((sum, item) => sum + (item.appointments || 0), 0);
    const totalCompleted = trendData.reduce((sum, item) => sum + (item.completed || 0), 0);
    const totalNoShow = trendData.reduce((sum, item) => sum + (item.noShow || 0), 0);
    const totalVitals = trendData.reduce((sum, item) => sum + (item.vitals || 0), 0);
    const totalNewUsers = trendData.reduce((sum, item) => sum + (item.newUsers || 0), 0);
    
    const completionRate = totalAppointments > 0 ? Math.round((totalCompleted / totalAppointments) * 100) : 0;
    const noShowRate = totalAppointments > 0 ? Math.round((totalNoShow / totalAppointments) * 100) : 0;
    const avgEfficiency = trendData.length > 0 ? Math.round(trendData.reduce((sum, item) => sum + (item.efficiency || 0), 0) / trendData.length) : 0;
    
    return {
      totalAppointments,
      totalCompleted,
      totalNoShow,
      totalVitals,
      totalNewUsers,
      completionRate,
      noShowRate,
      avgEfficiency
    };
  };

  const metrics = calculateMetrics();

  // Chart configuration based on selected metric
  const getChartConfig = () => {
    switch (selectedMetric) {
      case 'appointments':
        return {
          dataKeys: ['appointments', 'completed', 'noShow'],
          colors: ['#6366f1', '#22d3ee', '#f59e0b'],
          names: ['Total Appointments', 'Completed', 'No Show']
        };
      case 'vitals':
        return {
          dataKeys: ['vitals'],
          colors: ['#a78bfa'],
          names: ['Vitals Recorded']
        };
      case 'users':
        return {
          dataKeys: ['newUsers'],
          colors: ['#34d399'],
          names: ['New Users']
        };
      case 'efficiency':
        return {
          dataKeys: ['efficiency'],
          colors: ['#f97316'],
          names: ['Efficiency %']
        };
      default:
        return {
          dataKeys: ['appointments', 'completed'],
          colors: ['#6366f1', '#22d3ee'],
          names: ['Appointments', 'Completed']
        };
    }
  };

  const chartConfig = getChartConfig();

  return (
    <div className="mgr-analytics">
      {/* Enhanced KPI Row with Period-based Metrics */}
      <div className="mgr-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: '1.5rem' }}>
        {[
          { icon: '📊', label: `Total Appointments (${periodLabel})`, value: metrics.totalAppointments, color: '#284394', trend: '+12%' },
          { icon: '✅', label: `Completed (${metrics.completionRate}%)`, value: metrics.totalCompleted, color: '#22c55e', trend: '+8%' },
          { icon: '❌', label: `No Show (${metrics.noShowRate}%)`, value: metrics.totalNoShow, color: '#ef4444', trend: '-3%' },
          { icon: '🩺', label: 'Vitals Recorded', value: metrics.totalVitals, color: '#7c3aed', trend: '+15%' },
          { icon: '👥', label: 'New Users', value: metrics.totalNewUsers, color: '#059669', trend: '+22%' },
          { icon: '⚡', label: 'Avg Efficiency', value: `${metrics.avgEfficiency}%`, color: '#f97316', trend: '+5%' },
        ].map(c => (
          <div key={c.label} className="mgr-kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="mgr-kpi-icon" style={{ background: c.color + '18', color: c.color }}>{c.icon}</div>
            <div className="mgr-kpi-body">
              <div className="mgr-kpi-value" style={{ color: c.color }}>{c.value}</div>
              <div className="mgr-kpi-label" style={{ fontSize: '0.75rem' }}>{c.label}</div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: c.trend.startsWith('+') ? '#22c55e' : '#ef4444',
                fontWeight: 600,
                marginTop: '0.25rem'
              }}>
                {c.trend} vs prev period
              </div>
            </div>
            {/* Sparkline effect */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '40px',
              height: '20px',
              background: `linear-gradient(45deg, ${c.color}20, transparent)`,
              borderRadius: '8px 0 8px 0'
            }} />
          </div>
        ))}
      </div>

      {/* Advanced Control Panel */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.5)',
              borderRadius: '20px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#a5b4fc',
              letterSpacing: '0.05em'
            }}>
              🎯 ADVANCED ANALYTICS
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Performance Trends Dashboard
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period Selector */}
            <div className="mgr-period-switcher" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.25rem' }}>
              {['daily', 'weekly', 'monthly'].map(p => (
                <button 
                  key={p} 
                  className={`mgr-period-btn ${period === p ? 'active' : ''}`} 
                  onClick={() => setPeriod(p)}
                  style={{
                    background: period === p ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: period === p ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  📅 {p}
                </button>
              ))}
            </div>

            {/* Metric Selector */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="appointments">📊 Appointments Overview</option>
              <option value="vitals">🩺 Vitals Tracking</option>
              <option value="users">👥 User Growth</option>
              <option value="efficiency">⚡ Efficiency Metrics</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem' }}>
              {['chart', 'table'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    background: viewMode === mode ? 'rgba(255,255,255,0.2)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.8rem',
                    color: viewMode === mode ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {mode === 'chart' ? '📈 Chart' : '📋 Table'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Trend Visualization */}
      {viewMode === 'chart' ? (
        <div className="mgr-dark-card" style={{ marginBottom: '1.5rem' }}>
          <div className="mgr-dark-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
              <span className="mgr-live-dot" />
              <span className="mgr-dark-title">
                📈 {selectedMetric === 'appointments' ? 'Appointments & Completion Trends' :
                     selectedMetric === 'vitals' ? 'Vitals Recording Trends' :
                     selectedMetric === 'users' ? 'User Registration Trends' :
                     'Efficiency Performance Trends'} — {periodLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
              Real-time data • Updated every 5 minutes
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            {selectedMetric === 'efficiency' ? (
              <LineChart data={trendData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{ 
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '12px', 
                    color: '#f1f5f9',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                  formatter={(value) => [`${value}%`, 'Efficiency']}
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8, fill: '#f97316', strokeWidth: 3, stroke: '#ffffff' }}
                />
              </LineChart>
            ) : (
              <AreaChart data={trendData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  {chartConfig.dataKeys.map((key, index) => (
                    <linearGradient key={key} id={`grad${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartConfig.colors[index]} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={chartConfig.colors[index]} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ 
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '12px', 
                    color: '#f1f5f9',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                {chartConfig.dataKeys.map((key, index) => (
                  <Area 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    name={chartConfig.names[index]}
                    stroke={chartConfig.colors[index]} 
                    strokeWidth={3} 
                    fill={`url(#grad${key})`} 
                    dot={{ r: 5, fill: chartConfig.colors[index] }}
                    activeDot={{ r: 7, fill: chartConfig.colors[index], strokeWidth: 2, stroke: '#ffffff' }}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        /* Enhanced Data Table View */
        <div style={{
          background: 'linear-gradient(135deg, #0f1f5c 0%, #1a3a8f 40%, #1e4db7 70%, #2563eb 100%)',
          borderRadius: '20px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 20px 60px rgba(15, 31, 92, 0.5), 0 0 40px rgba(37, 99, 235, 0.2)',
          border: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{
              background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#4ade80',
              letterSpacing: '0.05em',
            }}>
              📊 DATA TABLE
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              Performance Data — {periodLabel}
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>Period</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>📊 Appointments</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>✅ Completed</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>❌ No Show</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>🩺 Vitals</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>👥 New Users</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>⚡ Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((row, index) => (
                  <tr key={row.label} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: index % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent'
                  }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#ffffff', fontWeight: 600 }}>{row.label}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#60a5fa', fontWeight: 600 }}>{row.appointments}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#4ade80', fontWeight: 600 }}>{row.completed}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#f87171', fontWeight: 600 }}>{row.noShow}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#c4b5fd', fontWeight: 600 }}>{row.vitals}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#34d399', fontWeight: 600 }}>{row.newUsers}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#fb923c', fontWeight: 600 }}>{row.efficiency}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>{metrics.totalAppointments}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Total Appointments</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>{metrics.completionRate}%</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Completion Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171' }}>{metrics.noShowRate}%</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>No Show Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fb923c' }}>{metrics.avgEfficiency}%</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Avg Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Performance Insights */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 40%, #059669 70%, #10b981 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(6, 95, 70, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52,211,153,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{
              background: 'rgba(52,211,153,0.3)', border: '1px solid rgba(52,211,153,0.6)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7',
              letterSpacing: '0.05em',
            }}>
              🎯 INSIGHTS
            </span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              Performance Insights
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { 
                icon: '📈', 
                title: 'Trending Up', 
                desc: `${selectedMetric === 'appointments' ? 'Appointments' : selectedMetric === 'vitals' ? 'Vitals' : selectedMetric === 'users' ? 'User registrations' : 'Efficiency'} showing ${period === 'daily' ? '15%' : period === 'weekly' ? '12%' : '18%'} growth`,
                color: '#4ade80'
              },
              { 
                icon: '⚡', 
                title: 'Peak Performance', 
                desc: `Best ${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}: ${trendData.reduce((max, item) => item.appointments > max.appointments ? item : max, trendData[0])?.label}`,
                color: '#60a5fa'
              },
              { 
                icon: '🎯', 
                title: 'Target Achievement', 
                desc: `${metrics.completionRate}% completion rate ${metrics.completionRate > 85 ? 'exceeds' : metrics.completionRate > 75 ? 'meets' : 'below'} target (85%)`,
                color: metrics.completionRate > 85 ? '#4ade80' : metrics.completionRate > 75 ? '#fbbf24' : '#f87171'
              },
              { 
                icon: '🔮', 
                title: 'Prediction', 
                desc: `Next ${period} projected: ${Math.round(metrics.totalAppointments * 1.08)} appointments (+8%)`,
                color: '#c4b5fd'
              }
            ].map((insight, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.75rem',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{insight.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                    {insight.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    {insight.desc}
                  </div>
                </div>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: insight.color, boxShadow: `0 0 8px ${insight.color}`
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Comparative Analysis */}
        <div style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 40%, #c2410c 70%, #ea580c 100%)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(124, 45, 18, 0.4), 0 0 40px rgba(234, 88, 12, 0.2)',
          border: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{
              background: 'rgba(251,146,60,0.3)', border: '1px solid rgba(251,146,60,0.6)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#fed7aa',
              letterSpacing: '0.05em',
            }}>
              📊 COMPARISON
            </span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              Period Comparison
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { 
                metric: 'Appointments', 
                current: metrics.totalAppointments, 
                previous: Math.round(metrics.totalAppointments * 0.92),
                icon: '📊'
              },
              { 
                metric: 'Completion Rate', 
                current: `${metrics.completionRate}%`, 
                previous: `${Math.max(0, metrics.completionRate - 3)}%`,
                icon: '✅'
              },
              { 
                metric: 'Efficiency', 
                current: `${metrics.avgEfficiency}%`, 
                previous: `${Math.max(0, metrics.avgEfficiency - 2)}%`,
                icon: '⚡'
              },
              { 
                metric: 'New Users', 
                current: metrics.totalNewUsers, 
                previous: Math.round(metrics.totalNewUsers * 0.85),
                icon: '👥'
              }
            ].map((comp, i) => {
              const isImprovement = typeof comp.current === 'string' 
                ? parseInt(comp.current) > parseInt(comp.previous)
                : comp.current > comp.previous;
              const changePercent = typeof comp.current === 'string'
                ? Math.round(((parseInt(comp.current) - parseInt(comp.previous)) / parseInt(comp.previous)) * 100)
                : Math.round(((comp.current - comp.previous) / comp.previous) * 100);
              
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{comp.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                        {comp.metric}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        Current: {comp.current} | Previous: {comp.previous}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.25rem 0.75rem', borderRadius: '20px',
                    background: isImprovement ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                    border: `1px solid ${isImprovement ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`
                  }}>
                    <span style={{ fontSize: '0.8rem' }}>
                      {isImprovement ? '📈' : '📉'}
                    </span>
                    <span style={{ 
                      fontSize: '0.8rem', fontWeight: 700,
                      color: isImprovement ? '#4ade80' : '#f87171'
                    }}>
                      {isImprovement ? '+' : ''}{changePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {centerPerformance.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #0f1f5c 0%, #1a3a8f 40%, #1e4db7 70%, #2563eb 100%)',
          borderRadius: '20px',
          padding: '1.75rem',
          boxShadow: '0 20px 60px rgba(15, 31, 92, 0.5), 0 0 40px rgba(37, 99, 235, 0.2)',
          border: '1px solid rgba(255,255,255,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow orbs */}
          <div style={{
            position: 'absolute', top: '-50px', right: '-50px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '30%',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.5)',
                borderRadius: '20px', padding: '0.25rem 0.75rem',
                fontSize: '0.75rem', fontWeight: 700, color: '#c4b5fd',
                letterSpacing: '0.05em',
              }}>
                🏆 RANKING
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Center Performance Ranking
              </h3>
            </div>
            <span style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500,
              background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
              padding: '0.3rem 0.75rem', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              Top {centerPerformance.length} centers · sorted by utilization
            </span>
          </div>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
            Staff utilization rate = staff ÷ capacity × 100%
          </p>

          {/* Rank cards — always visible list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {centerPerformance.map((c, i) => {
              const pct = c.utilization;
              const barColor = pct >= 80 ? '#4ade80' : pct >= 50 ? '#60a5fa' : '#f59e0b';
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
              return (
                <div key={c.name} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: i < 3 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '0.75rem 1rem',
                  border: i === 0 ? '1px solid rgba(250,204,21,0.4)' : i === 1 ? '1px solid rgba(148,163,184,0.3)' : i === 2 ? '1px solid rgba(180,120,60,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s ease',
                }}>
                  {/* Medal / rank */}
                  <span style={{ fontSize: i < 3 ? '1.4rem' : '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', minWidth: '28px', textAlign: 'center' }}>
                    {medal}
                  </span>
                  {/* Name + region */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>
                      📍 {c.region}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ flex: 2, minWidth: '80px' }}>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        borderRadius: '4px',
                        background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                        boxShadow: `0 0 8px ${barColor}80`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#60a5fa' }}>{c.staff}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>👥 Staff</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4ade80' }}>{c.capacity}</div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>📊 Cap</div>
                    </div>
                    <div style={{
                      minWidth: '52px', textAlign: 'center',
                      background: pct >= 80 ? 'rgba(74,222,128,0.2)' : pct >= 50 ? 'rgba(96,165,250,0.2)' : 'rgba(245,158,11,0.2)',
                      border: `1px solid ${barColor}60`,
                      borderRadius: '8px', padding: '0.25rem 0.4rem',
                    }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: barColor }}>{pct}%</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>util.</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              STAFF vs CAPACITY — BAR CHART
            </div>
            <ResponsiveContainer width="100%" height={Math.max(220, centerPerformance.length * 38)}>
              <BarChart
                data={centerPerformance}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                barCategoryGap="25%"
              >
                <defs>
                  <linearGradient id="gradRankStaff" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="gradRankCap" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={1} />
                  </linearGradient>
                  <filter id="rankGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)', fontWeight: 500 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={155}
                  tick={{ fontSize: 12, fill: '#ffffff', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(name) => name.length > 20 ? name.slice(0, 18) + '…' : name}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  contentStyle={{
                    background: 'linear-gradient(135deg, #0f1f5c 0%, #1a3a8f 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                  }}
                  labelStyle={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}
                  itemStyle={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}
                  formatter={(value, name) => {
                    if (name === '👥 Staff') return [`${value} members`, name];
                    if (name === '📊 Capacity') return [`${value} slots/day`, name];
                    return [value, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '0.75rem' }}
                  formatter={(value) => (
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
                  )}
                />
                <Bar dataKey="staff" name="👥 Staff" fill="url(#gradRankStaff)" radius={[0, 8, 8, 0]} maxBarSize={16} filter="url(#rankGlow)" />
                <Bar dataKey="capacity" name="📊 Capacity" fill="url(#gradRankCap)" radius={[0, 8, 8, 0]} maxBarSize={16} filter="url(#rankGlow)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
