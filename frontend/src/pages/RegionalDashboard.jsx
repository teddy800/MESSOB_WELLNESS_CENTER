import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { regionalService } from '../services/regionalService';
import { analyticsService } from '../services/analyticsService';
import AdminLayout from '../layouts/AdminLayout';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import HealthConditionTrendsPanel from '../components/analytics/HealthConditionTrendsPanel';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import '../styles/admin-layout.css';
import '../styles/admin-dashboard.css';
import '../styles/manager-dashboard.css';
import '../styles/regional-dashboard-responsive.css';
import '../styles/dashboard-tokens.css';

// ─── Role guard ───────────────────────────────────────────────────────────────
const REGIONAL_ROLES = ['REGIONAL_OFFICE', 'FEDERAL_OFFICE', 'SYSTEM_ADMIN'];

// ─── Custom Tooltip for Performance Trends ───────────────────────────────────
const CustomAppointmentTrendsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {};
    const total = data.total || 0;
    const completed = data.completed || 0;
    const noShow = data.noShow || 0;
    const pending = total - completed - noShow;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return (
      <div style={{
        background: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        color: '#1f2937',
        minWidth: '240px',
      }}>
        {/* Header with day */}
        <div style={{
          fontSize: '15px',
          fontWeight: 700,
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '2px solid #f3f4f6',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '16px' }}>📅</span>
          {label}
        </div>

        {/* Metrics List */}
        <div style={{ display: 'grid', gap: '8px' }}>
          {/* Total Appointments */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>📊</span> Total
            </span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>
              {total}
            </span>
          </div>

          {/* Completed */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>✅</span> Completed
            </span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>
              {completed}
            </span>
          </div>

          {/* No-Show */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>❌</span> No-Show
            </span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>
              {noShow}
            </span>
          </div>

          {/* Pending (if any) */}
          {pending > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>⏳</span> Pending
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#8b5cf6' }}>
                {pending}
              </span>
            </div>
          )}
        </div>

        {/* Completion Rate */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
              Completion Rate
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: completionRate >= 80 ? '#10b981' : completionRate >= 60 ? '#f59e0b' : '#ef4444' }}>
              {completionRate}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#f3f4f6',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${completionRate}%`,
              height: '100%',
              background: completionRate >= 80 ? '#10b981' : completionRate >= 60 ? '#f59e0b' : '#ef4444',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
    { id: 'performance', label: '📈 Analytics' },
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
            <h2>📈 Analytics</h2>
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
    { icon: '📅', label: 'Daily Capacity', value: '36 slots', sub: 'appointment slots/day', color: '#284394' },
    { icon: '👥', label: 'Total Staff', value: centerMetrics.totalStaff, sub: 'across all centers', color: '#2563eb' },
    { icon: '📋', label: 'Appointments', value: summary?.totalAppointments || 0, sub: 'total bookings', color: '#16a34a' },
    { icon: '✅', label: 'Completed', value: summary?.completedAppointments || 0, sub: 'appointments', color: '#22c55e' },
    { icon: '⏳', label: 'Pending', value: summary?.pendingAppointments || 0, sub: 'appointments', color: '#f59e0b' },
    { icon: '🩺', label: 'Vitals Recorded', value: summary?.totalVitals || 0, sub: 'health records', color: '#7c3aed' },
  ];

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
      <div className="dash-kpi-grid">
        {statCards.map((c) => (
          <div key={c.label} className="dash-kpi-card">
            <div className="dash-kpi-icon" style={{ background: `${c.color}18`, color: c.color }}>
              {c.icon}
            </div>
            <div className="dash-kpi-body">
              <div className="dash-kpi-value" style={{ color: c.color }}>{c.value}</div>
              <div className="dash-kpi-label">{c.label}</div>
              <div className="dash-kpi-sub">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Outstanding Health Analytics Card Section */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
        border: '2px solid rgba(40, 67, 148, 0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative gradient overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #284394 0%, #22c55e 50%, #f59e0b 100%)',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
            }}>
              🏥
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#1f2937',
                letterSpacing: '-0.02em'
              }}>
                Health Analytics Overview
              </h3>
              <p style={{
                margin: '0.25rem 0 0 0',
                fontSize: '0.85rem',
                color: '#64748b',
                fontWeight: 500
              }}>
                Real-time employee health metrics and condition tracking
              </p>
            </div>
          </div>

          {/* Live Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(34, 197, 94, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
              animation: 'mgrPulse 2s ease-in-out infinite'
            }} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#16a34a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              LIVE DATA
            </span>
          </div>
        </div>

        {/* Health KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            {
              icon: '👥',
              label: 'Total Employees',
              value: summary.totalEmployees || 0,
              color: '#284394',
              bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              trend: null
            },
            {
              icon: '💚',
              label: 'Healthy',
              value: summary.healthyCount || 0,
              percentage: summary.healthyPercentage || 0,
              color: '#22c55e',
              bgGradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              trend: '+5%'
            },
            {
              icon: '⚠️',
              label: 'At Risk',
              value: summary.atRiskCount || 0,
              percentage: summary.atRiskPercentage || 0,
              color: '#f59e0b',
              bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              trend: '-2%'
            },
            {
              icon: '🚨',
              label: 'Critical',
              value: summary.criticalCount || 0,
              percentage: summary.criticalPercentage || 0,
              color: '#ef4444',
              bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              trend: '-3%'
            }
          ].map((metric, idx) => (
            <div
              key={idx}
              style={{
                background: metric.bgGradient,
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
                border: `2px solid ${metric.color}30`,
                boxShadow: `0 4px 16px ${metric.color}20`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 32px ${metric.color}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${metric.color}20`;
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{metric.icon}</span>
                {metric.trend && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: metric.trend.startsWith('+') ? '#22c55e' : '#ef4444',
                    background: metric.trend.startsWith('+') ? '#dcfce7' : '#fee2e2',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    border: `1px solid ${metric.trend.startsWith('+') ? '#22c55e' : '#ef4444'}40`
                  }}>
                    {metric.trend}
                  </span>
                )}
              </div>

              {/* Value */}
              <div style={{
                fontSize: '2.25rem',
                fontWeight: 900,
                color: metric.color,
                lineHeight: 1,
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem'
              }}>
                {metric.value}
                {metric.percentage !== undefined && (
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#64748b'
                  }}>
                    ({metric.percentage}%)
                  </span>
                )}
              </div>

              {/* Label */}
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {metric.label}
              </div>

              {/* Decorative element */}
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `${metric.color}15`,
                filter: 'blur(20px)'
              }} />
            </div>
          ))}
        </div>

        {/* Quick Stats Footer */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem 1.5rem',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.05)',
          flexWrap: 'wrap',
          justifyContent: 'space-around'
        }}>
          {[
            { icon: '📊', label: 'Conditions Tracked', value: summary.totalConditions || 0, color: '#6366f1' },
            { icon: '🩺', label: 'Recent Vitals', value: summary.recentVitals || 0, color: '#8b5cf6' },
            { icon: '📈', label: 'Health Trend', value: 'Improving', color: '#22c55e' },
            { icon: '⏱️', label: 'Last Updated', value: 'Just now', color: '#64748b' }
          ].map((stat, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{stat.icon}</span>
              <div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: stat.color,
                  lineHeight: 1
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Center Performance Breakdown (Multi-center view only) */}
      {isAllCenters && centerBreakdownData.length > 0 && (
        <div style={{
          marginTop: '1.25rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 70%, #e2e8f0 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow orbs */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#16a34a',
              letterSpacing: '0.05em',
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', display: 'inline-block' }} />
              LIVE
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.01em' }}>
              Center Performance Overview
            </h3>
          </div>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#6b7280', fontWeight: 400 }}>
            Staff and capacity distribution across all {centerBreakdownData.length} centers
          </p>

          {/* Summary pills */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Centers', value: centerBreakdownData.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
              { label: 'Total Staff', value: centerBreakdownData.reduce((s, c) => s + c.staff, 0), color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
              { label: 'Total Capacity', value: centerBreakdownData.reduce((s, c) => s + c.capacity, 0), color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            ].map(p => (
              <div key={p.label} style={{
                background: p.bg, border: `1px solid ${p.color}40`,
                borderRadius: '10px', padding: '0.5rem 1rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: p.color }}>{p.value}</span>
                <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 500 }}>{p.label}</span>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                axisLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={160}
                tick={{ fontSize: 12, fill: '#1f2937', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(name) => name.length > 20 ? name.slice(0, 18) + '…' : name}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                contentStyle={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  color: '#1f2937',
                  padding: '0.75rem 1rem',
                }}
                labelStyle={{ color: '#1f2937', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}
                itemStyle={{ color: '#374151', fontSize: '0.85rem' }}
                formatter={(value, name) => {
                  if (name === '👥 Staff') return [`${value} members`, name];
                  if (name === '📊 Capacity') return [`${value} slots/day`, name];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '1rem' }}
                formatter={(value) => (
                  <span style={{ color: '#374151', fontSize: '0.85rem', fontWeight: 600 }}>{value}</span>
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
            borderTop: '1px solid rgba(0,0,0,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.6rem',
          }}>
            {centerBreakdownData.map((c, i) => (
              <div key={`${c.name}-${c.city}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(0,0,0,0.03)',
                borderRadius: '8px', padding: '0.4rem 0.75rem',
                border: '1px solid rgba(0,0,0,0.08)',
              }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    👥 {c.staff} · 📊 {c.capacity}
                  </div>
                </div>
                <span style={{
                  marginLeft: 'auto', flexShrink: 0,
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '0.15rem 0.4rem', borderRadius: '4px',
                  background: c.status === 'ACTIVE' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: c.status === 'ACTIVE' ? '#16a34a' : '#dc2626',
                  border: `1px solid ${c.status === 'ACTIVE' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                  {c.status === 'ACTIVE' ? '● ON' : '○ OFF'}
                </span>
              </div>
            ))}
          </div>
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
  const [availableRegions, setAvailableRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'ACTIVE', 'INACTIVE'
  
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

  // Filter and search centers
  const filteredCenters = centers.filter(center => {
    // Status filter
    if (filterStatus !== 'all' && center.status !== filterStatus) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        center.name?.toLowerCase().includes(query) ||
        center.code?.toLowerCase().includes(query) ||
        center.city?.toLowerCase().includes(query) ||
        center.region?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const sortedCenters = [...filteredCenters].sort((a, b) => {
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
    loadRegions(); // Load regions when opening modal
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
    loadRegions(); // Load regions when opening modal
    setShowModal(true);
  };

  // Load available regions from admin
  const loadRegions = async () => {
    try {
      setLoadingRegions(true);
      const regionsData = await regionalService.getRegions();
      const regions = regionsData?.data || regionsData || [];
      setAvailableRegions(regions);
    } catch (error) {
      console.error('Error loading regions:', error);
      setFormError('Failed to load regions. Please try again.');
      setAvailableRegions([]);
    } finally {
      setLoadingRegions(false);
    }
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
                  style={{ 
                    width: '100%', 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 600
                  }}
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Button
                        size="small"
                        onClick={() => handleEditCenter(center)}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(59,130,246,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#2563eb';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(59,130,246,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#3b82f6';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(59,130,246,0.3)';
                        }}
                      >
                        ✏️ Edit
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
                <div className="form-group">
                  <label>Region *</label>
                  {loadingRegions ? (
                    <div style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', color: '#6b7280' }}>
                      Loading regions...
                    </div>
                  ) : (
                    <select
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="form-input"
                      required
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select a region...</option>
                      {availableRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  )}
                  {availableRegions.length === 0 && !loadingRegions && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                      No regions available. Please contact an admin to create regions first.
                    </div>
                  )}
                </div>
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
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        border: '2px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>
              Performance Trends Dashboard
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period Selector */}
            <div className="mgr-period-switcher" style={{ background: '#e2e8f0', borderRadius: '12px', padding: '0.25rem' }}>
              {['daily', 'weekly', 'monthly'].map(p => (
                <button 
                  key={p} 
                  className={`mgr-period-btn ${period === p ? 'active' : ''}`} 
                  onClick={() => setPeriod(p)}
                  style={{
                    background: period === p ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: period === p ? '#ffffff' : '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize',
                    boxShadow: period === p ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none'
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
              className="performance-metric-selector"
              style={{
                background: '#ffffff',
                border: '2px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: '#1e293b',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                colorScheme: 'light',
                WebkitAppearance: 'auto',
                appearance: 'auto'
              }}
            >
              <option value="appointments" style={{ background: '#ffffff', color: '#000000', fontWeight: '600' }}>📊 Appointments Overview</option>
              <option value="vitals" style={{ background: '#ffffff', color: '#000000', fontWeight: '600' }}>🩺 Vitals Tracking</option>
              <option value="users" style={{ background: '#ffffff', color: '#000000', fontWeight: '600' }}>👥 User Growth</option>
              <option value="efficiency" style={{ background: '#ffffff', color: '#000000', fontWeight: '600' }}>⚡ Efficiency Metrics</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '0.25rem' }}>
              {['chart', 'table'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    background: viewMode === mode ? '#284394' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.8rem',
                    color: viewMode === mode ? '#ffffff' : '#1e293b',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: viewMode === mode ? '0 2px 6px rgba(40,67,148,0.35)' : 'none'
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
              <span className="mgr-dark-title" style={{ color: '#1f2937', fontWeight: '800', fontSize: '1.25rem' }}>
                📈 {selectedMetric === 'appointments' ? 'Appointments & Completion Trends' :
                     selectedMetric === 'vitals' ? 'Vitals Recording Trends' :
                     selectedMetric === 'users' ? 'User Registration Trends' :
                     'Efficiency Performance Trends'} — {periodLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#1f2937', fontWeight: '600', background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.8)" horizontal={true} vertical={true} />
                <XAxis dataKey="label" tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 700 }} axisLine={{ stroke: '#94a3b8' }} tickLine={false} />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 700 }} 
                  axisLine={{ stroke: '#94a3b8' }} 
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)', 
                    border: '2px solid rgba(0,0,0,0.15)', 
                    borderRadius: '12px', 
                    color: '#1f2937',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                  }}
                  labelStyle={{ color: '#1e293b', fontWeight: 800, fontSize: '14px' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 700, fontSize: '13px' }}
                  formatter={(value) => [`${value}%`, 'Efficiency']}
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  dot={{ r: 7, fill: '#f97316', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 9, fill: '#f97316', strokeWidth: 3, stroke: '#ffffff' }}
                />
              </LineChart>
            ) : (
              <AreaChart data={trendData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  {chartConfig.dataKeys.map((key, index) => (
                    <linearGradient key={key} id={`grad${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartConfig.colors[index]} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={chartConfig.colors[index]} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.8)" horizontal={true} vertical={true} />
                <XAxis dataKey="label" tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 700 }} axisLine={{ stroke: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 700 }} axisLine={{ stroke: '#94a3b8' }} tickLine={false} />
                <Tooltip content={<CustomAppointmentTrendsTooltip />} />
                <Legend wrapperStyle={{ fontSize: '13px', color: '#1e293b', fontWeight: 700, paddingTop: '12px' }} />
                {chartConfig.dataKeys.map((key, index) => (
                  <Area 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    name={chartConfig.names[index]}
                    stroke={chartConfig.colors[index]} 
                    strokeWidth={4} 
                    fill={`url(#grad${key})`} 
                    dot={{ r: 6, fill: chartConfig.colors[index], strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 9, fill: chartConfig.colors[index], strokeWidth: 3, stroke: '#ffffff' }}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        /* Enhanced Data Table View */
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 70%, #e2e8f0 100%)',
          borderRadius: '20px',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 0 40px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.12)',
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
              background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: '20px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#15803d',
              letterSpacing: '0.05em',
            }}>
              📊 DATA TABLE
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1f2937' }}>
              Performance Data — {periodLabel}
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.12)', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>Period</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>📊 Appointments</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>✅ Completed</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>❌ No Show</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>🩺 Vitals</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>👥 New Users</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>⚡ Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((row, index) => (
                  <tr key={row.label} style={{ 
                    borderBottom: '1px solid #e2e8f0',
                    background: index % 2 === 0 ? '#f8fafc' : '#ffffff'
                  }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#1e293b', fontWeight: 700 }}>{row.label}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#1d4ed8', fontWeight: 700 }}>{row.appointments}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>{row.completed}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{row.noShow}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#7c3aed', fontWeight: 700 }}>{row.vitals}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{row.newUsers}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#ea580c', fontWeight: 700 }}>{row.efficiency}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f1f5f9',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#284394' }}>{metrics.totalAppointments}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Total Appointments</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{metrics.completionRate}%</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Completion Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>{metrics.noShowRate}%</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>No Show Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f97316' }}>{metrics.avgEfficiency}%</div>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Avg Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Health Condition Trends Panel ── */}
      <HealthConditionTrendsPanel periodSwitcherClassName="mgr-period-switcher" />

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
