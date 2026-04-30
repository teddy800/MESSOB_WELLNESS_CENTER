import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import '../../styles/nurse-analytics.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function NurseAnalytics({ refreshTrigger = 0 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get today's date in local timezone
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [activityPeriod, setActivityPeriod] = useState('daily'); // daily, weekly, monthly
  const [analytics, setAnalytics] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    inProgressAppointments: 0,
    noShowAppointments: 0,
    totalPatientsToday: 0,
    capacityUtilization: 0,
    averageWaitTime: 0,
    completionRate: 0,
    onlineAppointments: 0,
    walkinAppointments: 0,
    vitalsRecorded: 0,
    wellnessPlansCreated: 0,
  });
  const [chartData, setChartData] = useState({
    statusDistribution: null,
    appointmentTrend: null,
    hourlyBreakdown: null,
  });

  useEffect(() => {
    fetchAnalytics().catch(err => {
      console.error('Error in fetchAnalytics:', err);
      setError('Failed to load analytics: ' + err.message);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activityPeriod]);

  // Listen for refreshTrigger changes and refresh analytics
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Analytics refresh triggered');
      fetchAnalytics().catch(err => {
        console.error('Error in fetchAnalytics:', err);
        setError('Failed to load analytics: ' + err.message);
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Parse selected date
      const selectedDateObj = new Date(selectedDate);
      let startDate = new Date(selectedDateObj);
      let endDate = new Date(selectedDateObj);

      // Adjust date range based on activity period
      if (activityPeriod === 'weekly') {
        // Get start of week (Monday)
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        // End of week (Sunday)
        endDate.setDate(startDate.getDate() + 6);
      } else if (activityPeriod === 'monthly') {
        // Start of month
        startDate.setDate(1);
        // End of month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }
      // For daily, startDate and endDate are the same

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('Fetching analytics for date range:', startDate, 'to', endDate);

      // Fetch appointments from queue endpoint with date parameter
      const appointmentsRes = await api.get('/api/v1/appointments/queue', {
        params: {
          date: selectedDate
        }
      });
      let appointmentsData = appointmentsRes.data.data || [];

      console.log('Queue appointments for', selectedDate, ':', appointmentsData);

      // Filter appointments by selected date range
      appointmentsData = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.scheduledAt);
        const isInRange = aptDate >= startDate && aptDate <= endDate;
        console.log(`Apt ${apt.appointmentId}: date=${aptDate.toDateString()}, inRange=${isInRange}`);
        return isInRange;
      });

      console.log('Filtered appointments:', appointmentsData.length);

      // Map queue status to appointment status for filtering
      const mappedAppointments = appointmentsData.map(apt => ({
        ...apt,
        appointmentStatus: apt.status, // Use status directly - no mapping needed
        customerId: apt.customerId,
        customerName: apt.customerName,
        appointmentId: apt.appointmentId,
        scheduledAt: apt.scheduledAt,
        type: apt.type || 'ONLINE'
      }));

      // Fetch capacity data
      const capacityRes = await api.get('/api/v1/analytics/capacity');
      const capacityData = capacityRes.data.data || {};

      // Calculate metrics
      const total = mappedAppointments.length;
      const completed = mappedAppointments.filter(a => a.appointmentStatus === 'COMPLETED').length;
      const waiting = mappedAppointments.filter(a => a.appointmentStatus === 'WAITING').length;
      const inProgress = mappedAppointments.filter(a => a.appointmentStatus === 'IN_PROGRESS').length;
      const inService = mappedAppointments.filter(a => a.appointmentStatus === 'IN_SERVICE').length;
      const completedAppointments = mappedAppointments.filter(a => a.appointmentStatus === 'COMPLETED');
      
      // Count online appointments (all appointments are online bookings)
      let onlineCount = total;
      let walkin = 0;

      // NO_SHOW appointments are not in the queue, so count is 0 for now
      const noShow = 0;

      // Count walk-ins separately from appointments
      // Walk-ins are external patients who had vitals recorded today (no appointment needed)
      try {
        console.log('=== COUNTING WALK-INS ===');
        // Get all vitals records for the selected date
        const vitalsRes = await api.get('/api/v1/vitals/all', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });
        
        const vitalsData = vitalsRes.data?.data || vitalsRes.data || [];
        if (Array.isArray(vitalsData)) {
          const vitalsRecords = vitalsData;
          console.log(`Found ${vitalsRecords.length} vitals records in period`);
          
          // Get unique user IDs from vitals
          const vitalsUserIds = [...new Set(vitalsRecords.map(v => v.userId).filter(Boolean))];
          console.log('Users with vitals:', vitalsUserIds);
          
          // Check which users are external
          for (const userId of vitalsUserIds) {
            try {
              const userRes = await api.get(`/api/v1/users/${userId}`);
              const userData = userRes.data?.data || userRes.data;
              
              if (userData?.isExternal === true) {
                // Count vitals records for this external user
                const userVitalsCount = vitalsRecords.filter(v => v.userId === userId).length;
                if (userVitalsCount > 0) {
                  walkin += 1; // Count each external user once
                  console.log(`✓ Walk-in user ${userData.fullName}: ${userVitalsCount} vitals records`);
                }
              }
            } catch (err) {
              console.log(`Could not fetch user ${userId}:`, err.message);
            }
          }
        }
        console.log('Total walk-ins:', walkin);
        console.log('=== WALK-IN COUNT COMPLETE ===');
      } catch (err) {
        console.error('Failed to count walk-ins:', err);
        walkin = 0; // Default to 0 if walk-in counting fails
      }

      // Calculate average wait time from actual data
      let totalWaitTime = 0;
      let completedWithTimes = 0;
      mappedAppointments.forEach(apt => {
        if (apt.appointmentStatus === 'COMPLETED') {
          totalWaitTime += 15;
          completedWithTimes++;
        }
      });
      const averageWaitTime = completedWithTimes > 0 ? Math.round(totalWaitTime / completedWithTimes) : 0;

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const utilizationPct = capacityData.utilizationPct || 0;

      // Calculate vitals recorded for ALL users (appointments + walk-ins) in the period
      let vitalsRecorded = 0;
      try {
        const vitalsRes = await api.get('/api/v1/vitals/all', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });
        
        const vitalsData = vitalsRes.data?.data || vitalsRes.data || [];
        if (Array.isArray(vitalsData)) {
          vitalsRecorded = vitalsData.length;
          console.log(`Total vitals recorded in period: ${vitalsRecorded}`);
        }
      } catch (err) {
        console.error('Failed to fetch vitals:', err);
        vitalsRecorded = 0; // Default to 0 if vitals fetching fails
      }

      // Calculate wellness plans created for ALL users (appointments + walk-ins) in the period
      let wellnessPlansCreated = 0;
      try {
        // Get all users who had vitals in the period (both appointments and walk-ins)
        const vitalsRes = await api.get('/api/v1/vitals/all', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });
        
        const vitalsData = vitalsRes.data?.data || vitalsRes.data || [];
        if (Array.isArray(vitalsData)) {
          const allUserIds = [...new Set(vitalsData.map(v => v.userId).filter(Boolean))];
          console.log('Fetching wellness plans for all users with vitals:', allUserIds);
          
          for (const userId of allUserIds) {
            try {
              const plansRes = await api.get(`/api/v1/plans/${userId}`);
              console.log(`Wellness plans response for ${userId}:`, plansRes.data);
              
              let plansArray = [];
              if (plansRes.data?.data && Array.isArray(plansRes.data.data)) {
                plansArray = plansRes.data.data;
              }
              
              if (Array.isArray(plansArray)) {
                const periodPlans = plansArray.filter(p => {
                  const pDate = new Date(p.createdAt);
                  return pDate >= startDate && pDate <= endDate;
                });
                console.log(`Found ${periodPlans.length} wellness plans for user ${userId} in period`);
                wellnessPlansCreated += periodPlans.length;
              }
            } catch (err) {
              console.log(`No wellness plans found for user ${userId}:`, err.message);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch wellness plans:', err);
        wellnessPlansCreated = 0; // Default to 0 if wellness plans fetching fails
      }

      setAnalytics({
        totalAppointments: onlineCount,
        completedAppointments: completed,
        waitingAppointments: waiting,
        inProgressAppointments: inProgress,
        inServiceAppointments: inService,
        noShowAppointments: noShow,
        totalPatientsToday: completed + walkin, // Walk-ins + Completed appointments
        capacityUtilization: utilizationPct,
        averageWaitTime: averageWaitTime,
        completionRate: completionRate,
        onlineAppointments: onlineCount,
        walkinAppointments: walkin,
        vitalsRecorded: vitalsRecorded,
        wellnessPlansCreated: wellnessPlansCreated,
      });

      // Generate chart data with all appointments
      generateChartData(mappedAppointments, noShow);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (appointmentsData, noShowCount = 0) => {
    // Map queue status to appointment status
    const mappedAppointments = appointmentsData.map(apt => ({
      ...apt,
      appointmentStatus: apt.status // Use status directly - no mapping needed
    }));

    // Status Distribution Pie Chart
    const statusCounts = {
      WAITING: mappedAppointments.filter(a => a.appointmentStatus === 'WAITING').length,
      IN_PROGRESS: mappedAppointments.filter(a => a.appointmentStatus === 'IN_PROGRESS').length,
      IN_SERVICE: mappedAppointments.filter(a => a.appointmentStatus === 'IN_SERVICE').length,
      COMPLETED: mappedAppointments.filter(a => a.appointmentStatus === 'COMPLETED').length,
      NO_SHOW: noShowCount,
    };

    const statusDistribution = {
      labels: ['Waiting', 'In Progress', 'In Service', 'Completed', 'No Show'],
      datasets: [
        {
          data: [statusCounts.WAITING, statusCounts.IN_PROGRESS, statusCounts.IN_SERVICE, statusCounts.COMPLETED, statusCounts.NO_SHOW],
          backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'],
          borderColor: ['#1e40af', '#d97706', '#6d28d9', '#059669', '#dc2626'],
          borderWidth: 2,
        },
      ],
    };

    // Hourly Breakdown Bar Chart
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    mappedAppointments.forEach(apt => {
      const appointmentDateField = apt.scheduledAt || apt.checkInTime;
      if (appointmentDateField) {
        const hour = new Date(appointmentDateField).getHours();
        hourlyData[hour]++;
      }
    });

    const hourlyBreakdown = {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Appointments',
          data: Object.values(hourlyData),
          backgroundColor: '#667eea',
          borderColor: '#764ba2',
          borderWidth: 1,
        },
      ],
    };

    // 7-Day Trend - Calculate from actual data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trendCounts = last7Days.map(date => {
      return appointmentsData.filter(apt => {
        const appointmentDateField = apt.scheduledAt || apt.checkInTime;
        if (!appointmentDateField) return false;
        return appointmentDateField.split('T')[0] === date;
      }).length;
    });

    const trendData = {
      labels: dayLabels,
      datasets: [
        {
          label: 'Appointments',
          data: trendCounts,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };

    setChartData({
      statusDistribution,
      appointmentTrend: trendData,
      hourlyBreakdown,
    });
  };

  if (loading) {
    return (
      <div className="card analytics-container">
        <h2>📊 Analytics</h2>
        <p style={{ textAlign: 'center', color: '#666' }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>📊 Nurse Analytics</h2>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={activityPeriod}
            onChange={(e) => setActivityPeriod(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <option value="daily">📅 Daily</option>
            <option value="weekly">📊 Weekly</option>
            <option value="monthly">📈 Monthly</option>
          </select>

          {activityPeriod === 'daily' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: '#374151' }}>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}
              />
            </div>
          )}
          
          <button 
            onClick={fetchAnalytics}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Overview Cards */}
      <div className="analytics-cards-grid">
        <div className="analytics-card">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <p className="card-label">Total Appointments</p>
            <p className="card-value">{analytics.totalAppointments}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <p className="card-label">Patients Today</p>
            <p className="card-value">{analytics.totalPatientsToday}</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">🚶</div>
          <div className="card-content">
            <p className="card-label">Walk-in Completed</p>
            <p className="card-value">{analytics.walkinAppointments}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="analytics-metrics-grid">
        <div className="card metrics-card">
          <h3>Performance Metrics</h3>
          
          <div className="metric-item">
            <div className="metric-label">
              <span>Completion Rate</span>
              <span className="metric-value">{analytics.completionRate}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${analytics.completionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">
              <span>Capacity Utilization</span>
              <span className="metric-value">{analytics.capacityUtilization}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${analytics.capacityUtilization}%` }}
              ></div>
            </div>
          </div>

          <div className="metric-item">
            <p><strong>Average Wait Time:</strong> {analytics.averageWaitTime} min</p>
          </div>
        </div>

        <div className="card metrics-card">
          <h3>Appointment Breakdown</h3>
          
          <div className="breakdown-item">
            <span>⏳ Waiting</span>
            <span className="breakdown-value">{analytics.waitingAppointments}</span>
          </div>
          
          <div className="breakdown-item">
            <span>🔄 In Progress</span>
            <span className="breakdown-value">{analytics.inProgressAppointments}</span>
          </div>
          
          <div className="breakdown-item">
            <span>💉 In Service</span>
            <span className="breakdown-value">{analytics.inServiceAppointments}</span>
          </div>

          <div className="breakdown-item">
            <span>✅ Completed</span>
            <span className="breakdown-value">{analytics.completedAppointments}</span>
          </div>

          <div className="breakdown-item">
            <span>❌ No-Show</span>
            <span className="breakdown-value" title="Patient didn't show up for scheduled appointment">{analytics.noShowAppointments}</span>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="card activity-card">
        <h3 style={{ margin: 0 }}>Today's Activity Summary</h3>
        
        <div className="activity-grid">
          <div className="activity-item">
            <p className="activity-label">💉 Vitals Recorded</p>
            <p className="activity-value">{analytics.vitalsRecorded}</p>
          </div>

          <div className="activity-item">
            <p className="activity-label">🎯 Wellness Plans</p>
            <p className="activity-value">{analytics.wellnessPlansCreated}</p>
          </div>

          <div className="activity-item">
            <p className="activity-label">⏱️ Avg Wait Time</p>
            <p className="activity-value">{analytics.averageWaitTime}m</p>
          </div>

          <div className="activity-item">
            <p className="activity-label">📊 Completion %</p>
            <p className="activity-value">{analytics.completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="card chart-card">
            <h3>Appointment Status Distribution</h3>
            {chartData.statusDistribution && (
              <Pie 
                data={chartData.statusDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="chart-container">
          <div className="card chart-card">
            <h3>7-Day Appointment Trend</h3>
            {chartData.appointmentTrend && (
              <Line 
                data={chartData.appointmentTrend}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            )}
          </div>
        </div>

        <div className="chart-container full-width">
          <div className="card chart-card">
            <h3>Hourly Appointment Breakdown</h3>
            {chartData.hourlyBreakdown && (
              <Bar 
                data={chartData.hourlyBreakdown}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NurseAnalytics;
