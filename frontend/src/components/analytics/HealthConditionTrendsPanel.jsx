import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import '../../styles/nurse-analytics.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const ALL_CONDITIONS = [
  { key: 'hypertension', label: 'Hypertension', color: '#dc2626' },
  { key: 'overweight', label: 'Overweight', color: '#f59e0b' },
  { key: 'obesity', label: 'Obesity', color: '#7c3aed' },
  { key: 'diabetes', label: 'Diabetes', color: '#2563eb' },
  { key: 'heart_respiratory', label: 'Heart / Resp.', color: '#ec4899' },
  { key: 'normal', label: 'Normal', color: '#10b981' },
  { key: 'other', label: 'Other', color: '#64748b' },
];

function buildConditionMap(rows) {
  const conditionMap = {};
  (rows || []).forEach((c) => {
    const key = String(c.condition || '').toLowerCase().replace(/ /g, '_');
    if (key === 'heart_issues' || key === 'respiratory_issues') {
      conditionMap.heart_respiratory = (conditionMap.heart_respiratory || 0) + c.count;
    } else {
      conditionMap[key] = (conditionMap[key] || 0) + c.count;
    }
  });
  return conditionMap;
}

/**
 * Nurse-dashboard parity: period condition breakdown + multi-line trends from /api/v1/conditions/period.
 */
export default function HealthConditionTrendsPanel({ periodSwitcherClassName = 'mgr-period-switcher' }) {
  const [viewPeriod, setViewPeriod] = useState('daily');
  const [healthConditions, setHealthConditions] = useState([]);
  const [conditionTrends, setConditionTrends] = useState(null);

  const generateDynamicLineChart = useCallback(async (period, rankedConditions) => {
    try {
      const today = new Date();
      let labels = [];
      let dataPointsPromises = [];
      let highlightedIndex = -1;

      if (period === 'daily') {
        const daysToShow = 7;
        highlightedIndex = daysToShow - 1;
        for (let i = daysToShow - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dateEnd = new Date(date);
          dateEnd.setHours(23, 59, 59, 999);
          labels.push(
            i === 0
              ? 'Today'
              : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          );
          const params = { startDate: date.toISOString(), endDate: dateEnd.toISOString() };
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params }).then((res) => res.data?.data || []).catch(() => [])
          );
        }
      } else if (period === 'weekly') {
        const weeksToShow = 8;
        highlightedIndex = weeksToShow - 1;
        for (let i = weeksToShow - 1; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - i * 7);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          labels.push(
            i === 0
              ? 'This week'
              : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          );
          const params = { startDate: weekStart.toISOString(), endDate: weekEnd.toISOString() };
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params }).then((res) => res.data?.data || []).catch(() => [])
          );
        }
      } else {
        const monthsToShow = 12;
        highlightedIndex = monthsToShow - 1;
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1, 0, 0, 0, 0);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
          if (i === 0) monthEnd.setTime(today.getTime());
          labels.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          const params = { startDate: monthStart.toISOString(), endDate: monthEnd.toISOString() };
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params }).then((res) => res.data?.data || []).catch(() => [])
          );
        }
      }

      const dataPoints = await Promise.all(dataPointsPromises);
      const lineDatasets = rankedConditions.map((condition, index) => {
        const conditionData = dataPoints.map((conditionsInPeriod) => {
          const conditionMap = buildConditionMap(conditionsInPeriod);
          const baseValue = conditionMap[condition.key] || 0;
          return baseValue + index * 0.01;
        });
        return {
          label: condition.label,
          data: conditionData,
          borderColor: condition.color,
          backgroundColor: condition.color + '20',
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointRadius: (ctx) => (ctx.dataIndex === highlightedIndex ? 8 : 5),
          pointHoverRadius: (ctx) => (ctx.dataIndex === highlightedIndex ? 10 : 7),
          pointBorderWidth: (ctx) => (ctx.dataIndex === highlightedIndex ? 3 : 2),
          pointBackgroundColor: (ctx) => (ctx.dataIndex === highlightedIndex ? '#ffffff' : condition.color),
          pointBorderColor: condition.color,
          pointStyle: 'circle',
        };
      });

      setConditionTrends({ labels, datasets: lineDatasets, highlightedIndex });
    } catch {
      setConditionTrends(null);
    }
  }, []);

  const fetchHealthConditions = useCallback(
    async (period) => {
      try {
        const today = new Date();
        let startDate;
        let endDate;

        if (period === 'daily') {
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        } else if (period === 'weekly') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        } else {
          startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
          endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        }

        const params = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        const response = await api.get('/api/v1/conditions/period', { params });
        const conditions = response.data.data || [];
        const totalWellnessPlans = response.data.meta?.totalWellnessPlans || 0;

        const vitalsRes = await api.get('/api/v1/vitals/all', { params });
        const vitalsData = vitalsRes.data?.data || vitalsRes.data || [];
        const uniquePatients = new Set((Array.isArray(vitalsData) ? vitalsData : []).map((v) => v.userId).filter(Boolean));
        const totalPatients = uniquePatients.size;

        const conditionMap = buildConditionMap(conditions);
        const rankedConditions = ALL_CONDITIONS.map((c) => ({
          ...c,
          count: conditionMap[c.key] || 0,
          percentage:
            totalWellnessPlans > 0 ? Math.round(((conditionMap[c.key] || 0) / totalWellnessPlans) * 100) : 0,
          totalPatients,
        })).sort((a, b) => b.count - a.count);

        setHealthConditions(rankedConditions);
        await generateDynamicLineChart(period, rankedConditions);
      } catch {
        setHealthConditions(
          ALL_CONDITIONS.map((c) => ({ ...c, count: 0, percentage: 0, totalPatients: 0 }))
        );
        setConditionTrends(null);
      }
    },
    [generateDynamicLineChart]
  );

  useEffect(() => {
    fetchHealthConditions(viewPeriod);
  }, [viewPeriod, fetchHealthConditions]);

  const periodSubtitle =
    viewPeriod === 'daily'
      ? 'Patients with each condition recorded today'
      : viewPeriod === 'weekly'
        ? `Total patients this week (${new Date(new Date().setDate(new Date().getDate() - 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        : `Total patients this month (${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  const trendSubtitle =
    viewPeriod === 'daily'
      ? 'Condition trends over the last 7 days (today highlighted)'
      : viewPeriod === 'weekly'
        ? 'Condition trends over the last 8 weeks — this week highlighted'
        : 'All 12 months up to now (current month to date)';

  return (
    <div className="health-condition-trends-panel" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <div className={periodSwitcherClassName}>
          {['daily', 'weekly', 'monthly'].map((p) => (
            <button
              key={p}
              type="button"
              className={`mgr-period-btn ${viewPeriod === p ? 'active' : ''}`}
              onClick={() => setViewPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#666' }}>{periodSubtitle}</p>
        </div>

        <div style={{ marginTop: '2rem', position: 'relative', paddingLeft: '3rem' }}>
          {healthConditions.length > 0 && healthConditions[0].totalPatients > 0 ? (
            (() => {
              const maxCount = Math.max(...healthConditions.map((c) => c.count), 1);
              const roundedMax = Math.ceil(maxCount / 10) * 10;
              const yAxisMax = roundedMax < 10 ? 10 : roundedMax;
              const step = yAxisMax / 6;
              const yAxisLabels = Array.from({ length: 7 }, (_, i) => Math.round(yAxisMax - i * step));
              return (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '175px',
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'left center',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Patients
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '350px',
                        paddingRight: '1rem',
                        borderRight: '2px solid #e5e7eb',
                      }}
                    >
                      {yAxisLabels.map((label, index) => (
                        <span key={index} style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                          {label}
                        </span>
                      ))}
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '350px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        {yAxisLabels.map((_, i) => (
                          <div key={i} style={{ height: '1px', backgroundColor: '#e5e7eb', width: '100%' }} />
                        ))}
                      </div>
                      <div
                        style={{
                          position: 'relative',
                          display: 'flex',
                          justifyContent: 'space-around',
                          alignItems: 'flex-end',
                          height: '350px',
                          gap: '1rem',
                          padding: '0 1rem',
                        }}
                      >
                        {healthConditions.map((condition) => {
                          const heightPx = (condition.count / yAxisMax) * 350;
                          return (
                            <div
                              key={condition.key}
                              style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                maxWidth: '120px',
                                position: 'relative',
                                cursor: 'pointer',
                              }}
                              className="condition-bar-container"
                            >
                              <div
                                className="condition-tooltip"
                                style={{
                                  position: 'absolute',
                                  bottom: `${heightPx + 10}px`,
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                                  color: '#fff',
                                  padding: '0.75rem 1rem',
                                  borderRadius: '8px',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  opacity: 0,
                                  pointerEvents: 'none',
                                  transition: 'opacity 0.2s ease',
                                  zIndex: 10,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <div style={{ width: '12px', height: '12px', backgroundColor: condition.color, borderRadius: '2px' }} />
                                  <span>{condition.label}</span>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                  {condition.count} patients ({condition.percentage}%)
                                </div>
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${heightPx}px`,
                                  backgroundColor: condition.color,
                                  borderRadius: '8px 8px 0 0',
                                  transition: 'all 0.3s ease',
                                  position: 'relative',
                                }}
                                className="condition-bar"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', marginTop: '1rem', marginLeft: '4rem' }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', gap: '1rem', padding: '0 1rem' }}>
                      {healthConditions.map((condition) => (
                        <div key={condition.key} style={{ flex: 1, maxWidth: '120px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151', wordBreak: 'break-word' }}>
                            {condition.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
              No health conditions data available for this period.
            </p>
          )}
        </div>
      </div>

      <div className="card trend-chart-card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="trend-chart-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111' }}>
            📈 Health Condition Trends
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#666' }}>{trendSubtitle}</p>
        </div>

        {conditionTrends ? (
          <div style={{ height: '400px', position: 'relative' }}>
            <Line
              data={conditionTrends}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      font: { size: 12, weight: '500' },
                      usePointStyle: true,
                      pointStyle: 'circle',
                    },
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                      title(ctx) {
                        const label = ctx[0].label;
                        const hi = conditionTrends.highlightedIndex;
                        return ctx[0].dataIndex === hi ? `${label} ⭐` : label;
                      },
                      label(ctx) {
                        const label = ctx.dataset.label || '';
                        const value = Math.round(ctx.parsed.y);
                        const suffix = viewPeriod === 'weekly' ? ' avg daily' : ' patients';
                        return `${label}: ${value}${suffix}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: true,
                      color: (ctx) =>
                        ctx.index === conditionTrends.highlightedIndex ? '#fbbf24' : '#e5e7eb',
                      lineWidth: (ctx) => (ctx.index === conditionTrends.highlightedIndex ? 2 : 1),
                    },
                    ticks: {
                      font: {
                        size: 11,
                        weight: (ctx) => (ctx.index === conditionTrends.highlightedIndex ? '700' : '500'),
                      },
                      color: (ctx) => (ctx.index === conditionTrends.highlightedIndex ? '#f59e0b' : '#6b7280'),
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: '#e5e7eb', drawBorder: false },
                    ticks: {
                      font: { size: 11, weight: '500' },
                      color: '#6b7280',
                      precision: 0,
                    },
                    title: {
                      display: true,
                      text: viewPeriod === 'weekly' ? 'Avg Daily Patients' : 'Number of Patients',
                      font: { size: 12, weight: '600' },
                      color: '#374151',
                    },
                  },
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false },
              }}
            />
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>Loading trend data...</p>
        )}
      </div>
    </div>
  );
}
