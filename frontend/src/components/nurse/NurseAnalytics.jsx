import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import '../../styles/nurse-analytics.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

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
  const [viewPeriod, setViewPeriod] = useState('daily'); // Unified period for both analytics and health conditions
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
    healthConditions: null,
    conditionTrends: null, // New: Line chart for condition trends
  });
  const [healthConditions, setHealthConditions] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState(null); // Month-over-month comparison

  // Generate dynamic line chart using SAME endpoint as bar chart
  const generateDynamicLineChart = async (period, rankedConditions) => {
    try {
      console.log('📈 Generating line chart for period:', period);
      
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
          
          labels.push(i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
          
          const params = {
            startDate: date.toISOString(),
            endDate: dateEnd.toISOString()
          };
          
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params })
              .then(res => res.data?.data || [])
              .catch(() => [])
          );
        }
      } else if (period === 'weekly') {
        const weeksToShow = 8;
        highlightedIndex = weeksToShow - 1;
        
        for (let i = weeksToShow - 1; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          labels.push(i === 0 ? 'This week' : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
          
          const params = {
            startDate: weekStart.toISOString(),
            endDate: weekEnd.toISOString()
          };
          
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params })
              .then(res => res.data?.data || [])
              .catch(() => [])
          );
        }
      } else if (period === 'monthly') {
        const monthsToShow = 12;
        highlightedIndex = monthsToShow - 1;
        
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1, 0, 0, 0, 0);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
          if (i === 0) monthEnd.setTime(today.getTime());
          
          labels.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
          
          const params = {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString()
          };
          
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params })
              .then(res => res.data?.data || [])
              .catch(() => [])
          );
        }
      } else {
        const monthsToShow = 12;
        highlightedIndex = -1;
        
        for (let i = monthsToShow - 1; i >= 0; i--) {
          const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1, 0, 0, 0, 0);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
          if (i === 0) monthEnd.setTime(today.getTime());
          
          labels.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
          
          const params = {
            startDate: monthStart.toISOString(),
            endDate: monthEnd.toISOString()
          };
          
          dataPointsPromises.push(
            api.get('/api/v1/conditions/period', { params })
              .then(res => res.data?.data || [])
              .catch(() => [])
          );
        }
      }
      
      const dataPoints = await Promise.all(dataPointsPromises);
      
      const lineDatasets = rankedConditions.map((condition, index) => {
        const conditionData = dataPoints.map(conditionsInPeriod => {
          const conditionMap = {};
          conditionsInPeriod.forEach(c => {
            const key = c.condition.toLowerCase().replace(/ /g, '_');
            if (key === 'heart_issues' || key === 'respiratory_issues') {
              conditionMap['heart_respiratory'] = (conditionMap['heart_respiratory'] || 0) + c.count;
            } else {
              conditionMap[key] = (conditionMap[key] || 0) + c.count;
            }
          });
          // Add tiny offset to prevent perfect overlap (0.01 * index)
          // This makes overlapping lines visible without affecting readability
          const baseValue = conditionMap[condition.key] || 0;
          return baseValue + (index * 0.01);
        });
        
        return {
          label: condition.label,
          data: conditionData,
          borderColor: condition.color,
          backgroundColor: condition.color + '20',
          borderWidth: 3, // Slightly thicker lines for better visibility
          tension: 0.4,
          fill: false,
          pointRadius: (context) => context.dataIndex === highlightedIndex ? 8 : 5,
          pointHoverRadius: (context) => context.dataIndex === highlightedIndex ? 10 : 7,
          pointBorderWidth: (context) => context.dataIndex === highlightedIndex ? 3 : 2,
          pointBackgroundColor: (context) => context.dataIndex === highlightedIndex ? '#ffffff' : condition.color,
          pointBorderColor: condition.color,
          pointStyle: 'circle',
        };
      });
      
      setChartData(prev => ({
        ...prev,
        conditionTrends: {
          labels,
          datasets: lineDatasets,
          highlightedIndex,
        },
      }));
      
      console.log('✅ Line chart generated');
    } catch (err) {
      console.error('❌ Failed to generate line chart:', err);
      setChartData(prev => ({
        ...prev,
        conditionTrends: null,
      }));
    }
  };


  const fetchHealthConditions = async (period = viewPeriod) => {
    try {
      console.log('🔍 Fetching health conditions for period:', period);
      
      // Calculate date range based on period
      const today = new Date();
      let startDate, endDate;
      
      if (period === 'all') {
        // All time - no date filters
        startDate = null;
        endDate = null;
      } else if (period === 'daily') {
        // Today only
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      } else if (period === 'weekly') {
        // Last 7 days (including today)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      } else if (period === 'monthly') {
        // From 1st of current month to today
        startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      }
      
      console.log('Date range:', startDate, 'to', endDate);
      
      // Fetch patient conditions within date range (or all time if no dates)
      const params = period === 'all' ? {} : {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      
      const response = await api.get('/api/v1/conditions/period', { params });
      
      const conditions = response.data.data || [];
      const totalWellnessPlans = response.data.meta?.totalWellnessPlans || 0;
      
      console.log('📊 Total wellness plans in period:', totalWellnessPlans);
      console.log('📊 Health conditions data:', conditions);
      
      // Get total unique patients in the period (from vitals records)
      const vitalsParams = period === 'all' ? {} : {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
      
      const vitalsRes = await api.get('/api/v1/vitals/all', { params: vitalsParams });
      
      const vitalsData = vitalsRes.data?.data || vitalsRes.data || [];
      const uniquePatients = new Set(vitalsData.map(v => v.userId).filter(Boolean));
      const totalPatients = uniquePatients.size;
      
      console.log('📊 Total patients in period:', totalPatients);
      console.log('📊 Health conditions data:', conditions);
      
      // Define all 7 conditions with their colors - distinct and easily distinguishable
      const allConditions = [
        { key: 'hypertension', label: 'Hypertension', color: '#dc2626' },      // Red
        { key: 'overweight', label: 'Overweight', color: '#f59e0b' },          // Amber/Orange
        { key: 'obesity', label: 'Obesity', color: '#7c3aed' },                // Purple
        { key: 'diabetes', label: 'Diabetes', color: '#2563eb' },              // Blue
        { key: 'heart_respiratory', label: 'Heart / Resp.', color: '#ec4899' }, // Pink
        { key: 'normal', label: 'Normal', color: '#10b981' },                  // Green
        { key: 'other', label: 'Other', color: '#64748b' },                    // Slate Gray
      ];
      
      // Create a map of condition counts
      const conditionMap = {};
      conditions.forEach(c => {
        const key = c.condition.toLowerCase().replace(/ /g, '_');
        // Combine heart issues and respiratory issues
        if (key === 'heart_issues' || key === 'respiratory_issues') {
          conditionMap['heart_respiratory'] = (conditionMap['heart_respiratory'] || 0) + c.count;
        } else {
          conditionMap[key] = (conditionMap[key] || 0) + c.count;
        }
      });
      
      console.log('📊 Condition map:', conditionMap);
      console.log('📊 Total wellness plans for percentage calc:', totalWellnessPlans);
      
      // Map counts to conditions and calculate percentages based on total wellness plans
      const rankedConditions = allConditions.map(c => ({
        ...c,
        count: conditionMap[c.key] || 0,
        percentage: totalWellnessPlans > 0 
          ? Math.round((conditionMap[c.key] || 0) / totalWellnessPlans * 100) 
          : 0,
        totalPatients: totalPatients
      })).sort((a, b) => b.count - a.count);
      
      setHealthConditions(rankedConditions);
      
      // Generate line chart with DYNAMIC date ranges based on actual data
      await generateDynamicLineChart(period, rankedConditions);
      
      console.log('✅ Health conditions ranked:', rankedConditions);
    } catch (err) {
      console.error('❌ Failed to fetch health conditions:', err);
      // Set empty data on error
      setHealthConditions([
        { key: 'hypertension', label: 'Hypertension', color: '#8b5cf6', count: 0, percentage: 0, totalPatients: 0 },
        { key: 'overweight', label: 'Overweight', color: '#10b981', count: 0, percentage: 0, totalPatients: 0 },
        { key: 'obesity', label: 'Obesity', color: '#f97316', count: 0, percentage: 0, totalPatients: 0 },
        { key: 'diabetes', label: 'Diabetes', color: '#f59e0b', count: 0, percentage: 0, totalPatients: 0 },
        { key: 'heart_respiratory', label: 'Heart / Resp.', color: '#ec4899', count: 0, percentage: 0, totalPatients: 0 },
      ]);
    }
  };



  useEffect(() => {
    fetchAnalytics().catch(err => {
      console.error('Error in fetchAnalytics:', err);
      setError('Failed to load analytics: ' + err.message);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, viewPeriod]);

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

  // Fetch health conditions when period changes
  useEffect(() => {
    fetchHealthConditions(viewPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Parse selected date
      const selectedDateObj = new Date(selectedDate);
      let startDate = new Date(selectedDateObj);
      let endDate = new Date(selectedDateObj);

      // Adjust date range based on activity period
      if (viewPeriod === 'all') {
        // All time - no date filters
        startDate = null;
        endDate = null;
      } else if (viewPeriod === 'weekly') {
        // Get start of week (Monday)
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        // End of week (Sunday)
        endDate.setDate(startDate.getDate() + 6);
      } else if (viewPeriod === 'monthly') {
        // Start of month
        startDate.setDate(1);
        // End of month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }
      // For daily, startDate and endDate are the same

      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      console.log('Fetching analytics for date range:', startDate, 'to', endDate);

      // Fetch appointments from queue endpoint with date parameter
      const appointmentsRes = await api.get('/api/v1/appointments/queue', {
        params: viewPeriod === 'all' ? {} : { date: selectedDate }
      });
      let appointmentsData = appointmentsRes.data.data || [];

      console.log('Queue appointments:', appointmentsData);

      // Filter appointments by selected date range (skip if all time)
      if (viewPeriod !== 'all') {
        appointmentsData = appointmentsData.filter(apt => {
          const aptDate = new Date(apt.scheduledAt);
          const isInRange = aptDate >= startDate && aptDate <= endDate;
          console.log(`Apt ${apt.appointmentId}: date=${aptDate.toDateString()}, inRange=${isInRange}`);
          return isInRange;
        });

        console.log('Filtered appointments:', appointmentsData.length);
      }

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

      // NO_SHOW appointments - fetch from queue
      const noShow = mappedAppointments.filter(a => a.appointmentStatus === 'NO_SHOW').length;

      // Count walk-ins separately from appointments
      // Walk-ins = number of wellness plans created for patients WITHOUT appointments in the period
      try {
        console.log('=== COUNTING WALK-INS ===');
        
        // Get all wellness plans created in the period (or all time)
        const vitalsParams = viewPeriod === 'all' ? {} : {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        
        const vitalsRes = await api.get('/api/v1/vitals/all', { params: vitalsParams });
        
        const vitalsData = vitalsRes.data?.data || vitalsRes.data || [];
        if (Array.isArray(vitalsData)) {
          const vitalsRecords = vitalsData;
          console.log(`Found ${vitalsRecords.length} vitals records in period`);
          
          // Get unique user IDs from vitals
          const vitalsUserIds = [...new Set(vitalsRecords.map(v => v.userId).filter(Boolean))];
          console.log('Users with vitals:', vitalsUserIds);
          
          // For each user with vitals, count their completed wellness plans in the period
          for (const userId of vitalsUserIds) {
            try {
              // Check if user has appointments in this period
              const hasAppointment = mappedAppointments.some(apt => apt.customerId === userId);
              
              // If no appointment, this is a walk-in - count their wellness plans
              if (!hasAppointment) {
                const plansRes = await api.get(`/api/v1/plans/${userId}`);
                const plansData = plansRes.data?.data || plansRes.data || [];
                
                if (Array.isArray(plansData)) {
                  // Count wellness plans created in this period (or all time)
                  const periodPlans = viewPeriod === 'all' 
                    ? plansData 
                    : plansData.filter(p => {
                        const pDate = new Date(p.createdAt);
                        return pDate >= startDate && pDate <= endDate;
                      });
                  
                  walkin += periodPlans.length; // Count each wellness plan
                  if (periodPlans.length > 0) {
                    console.log(`✓ Walk-in user ${userId}: ${periodPlans.length} wellness plans`);
                  }
                }
              }
            } catch (err) {
              console.log(`Could not fetch data for user ${userId}:`, err.message);
            }
          }
        }
        console.log('Total walk-in services completed:', walkin);
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
        const vitalsParams = viewPeriod === 'all' ? {} : {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        
        const vitalsRes = await api.get('/api/v1/vitals/all', { params: vitalsParams });
        
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
        const vitalsParams = viewPeriod === 'all' ? {} : {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        
        const vitalsRes = await api.get('/api/v1/vitals/all', { params: vitalsParams });
        
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
                const periodPlans = viewPeriod === 'all' 
                  ? plansArray 
                  : plansArray.filter(p => {
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

      // Fetch health conditions data
      await fetchHealthConditions();
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      if (err?.response?.status === 403) {
        setError('Access denied — Nurse Officer role required to view analytics.');
      } else if (err?.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load analytics. Please refresh.');
      }
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
      NO_SHOW: mappedAppointments.filter(a => a.appointmentStatus === 'NO_SHOW').length,
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
            value={viewPeriod}
            onChange={(e) => setViewPeriod(e.target.value)}
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
            <option value="all">🌐 All Time</option>
          </select>

          {viewPeriod === 'daily' && (
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
            <p className="card-label">{viewPeriod === 'all' ? 'Patients Total' : 'Patients Today'}</p>
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

      {/* Appointment Breakdown and Activity Summary - Side by Side */}
      <div className="analytics-metrics-grid">
        <div className="card metrics-card">
          <h3>Appointment Breakdown</h3>
          
          <div className="breakdown-item">
            <span>✅ Completed</span>
            <span className="breakdown-value">{analytics.completedAppointments}</span>
          </div>

          <div className="breakdown-item">
            <span>❌ No-Show</span>
            <span className="breakdown-value" title="Patient didn't show up for scheduled appointment">{analytics.noShowAppointments}</span>
          </div>
        </div>

        <div className="card metrics-card">
          <h3>{viewPeriod === 'all' ? 'Activity Summary' : "Today's Activity Summary"}</h3>
          
          <div className="breakdown-item">
            <span>💉 Vitals Recorded</span>
            <span className="breakdown-value">{analytics.vitalsRecorded}</span>
          </div>

          <div className="breakdown-item">
            <span>🎯 Wellness Plans</span>
            <span className="breakdown-value">{analytics.wellnessPlansCreated}</span>
          </div>
        </div>
      </div>

      {/* Health Conditions Ranked Chart */}
      <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#666' }}>
                {viewPeriod === 'daily' && 'Patients with each condition recorded today'}
                {viewPeriod === 'weekly' && `Total patients this week (${new Date(new Date().setDate(new Date().getDate() - 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`}
                {viewPeriod === 'monthly' && `Total patients this month (${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`}
                {viewPeriod === 'all' && 'All-time cumulative patient conditions'}
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Bar Chart */}
        <div style={{ marginTop: '2rem', position: 'relative', paddingLeft: '3rem' }}>
          {healthConditions.length > 0 && healthConditions[0].totalPatients > 0 ? (
            (() => {
              // Calculate dynamic Y-axis scale
              const maxCount = Math.max(...healthConditions.map(c => c.count), 1);
              const roundedMax = Math.ceil(maxCount / 10) * 10; // Round up to nearest 10
              const yAxisMax = roundedMax < 10 ? 10 : roundedMax; // Minimum 10
              const step = yAxisMax / 6; // 7 labels (0 to max)
              const yAxisLabels = Array.from({ length: 7 }, (_, i) => Math.round(yAxisMax - (i * step)));
              
              return (
                <>
                  {/* Y-axis label */}
                  <div style={{ position: 'absolute', left: '0', top: '175px', transform: 'rotate(-90deg)', transformOrigin: 'left center', fontSize: '0.9rem', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    Patients
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Y-axis */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '350px', paddingRight: '1rem', borderRight: '2px solid #e5e7eb' }}>
                      {yAxisLabels.map((label, index) => (
                        <span key={index} style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Chart area with grid lines */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      {/* Horizontal grid lines */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {yAxisLabels.map((_, i) => (
                          <div key={i} style={{ height: '1px', backgroundColor: '#e5e7eb', width: '100%' }} />
                        ))}
                      </div>

                      {/* Bars */}
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '350px', gap: '1rem', padding: '0 1rem' }}>
                        {healthConditions.map((condition) => {
                          // Calculate height in pixels based on actual patient count relative to dynamic max
                          const heightPx = (condition.count / yAxisMax) * 350;
                          const percentage = condition.percentage; // Use pre-calculated percentage
                          
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
                                cursor: 'pointer'
                              }}
                              className="condition-bar-container"
                            >
                              {/* Hover Tooltip */}
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
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <div style={{ width: '12px', height: '12px', backgroundColor: condition.color, borderRadius: '2px' }} />
                                  <span>{condition.label}</span>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem' }}>
                                  {condition.count} patients ({percentage}%)
                                </div>
                              </div>
                              
                              {/* Bar */}
                              <div
                                style={{
                                  width: '100%',
                                  height: `${heightPx}px`,
                                  backgroundColor: condition.color,
                                  borderRadius: '8px 8px 0 0',
                                  transition: 'all 0.3s ease',
                                  position: 'relative'
                                }}
                                className="condition-bar"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* X-axis labels */}
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

      {/* Health Condition Trends Line Chart */}
      <div className="card trend-chart-card" style={{ marginTop: '2rem', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 className="trend-chart-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#111' }}>
            Health Condition Trends
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#666' }}>
            {viewPeriod === 'daily' && 'Condition trends over the last 7 days (today highlighted)'}
            {viewPeriod === 'weekly' && 'Condition trends over the last 8 weeks - average daily patients per week (this week highlighted)'}
            {viewPeriod === 'monthly' && 'All 12 months up to now (current month counts data up to today only)'}
            {viewPeriod === 'all' && 'Historical condition trends (up to 12 months)'}
          </p>
        </div>

        {chartData.conditionTrends ? (
          <div style={{ height: '400px', position: 'relative' }}>
            <Line
              data={chartData.conditionTrends}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      font: {
                        size: 12,
                        weight: '500',
                      },
                      usePointStyle: true,
                      pointStyle: 'circle',
                    },
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 12,
                    titleFont: {
                      size: 14,
                      weight: 'bold',
                    },
                    bodyFont: {
                      size: 13,
                    },
                    callbacks: {
                      title: function(context) {
                        const label = context[0].label;
                        const isHighlighted = context[0].dataIndex === chartData.conditionTrends.highlightedIndex;
                        return isHighlighted ? `${label} ⭐` : label;
                      },
                      label: function(context) {
                        const label = context.dataset.label || '';
                        // Round to remove the tiny offset we added for visibility
                        const value = Math.round(context.parsed.y);
                        const suffix = viewPeriod === 'weekly' ? ' avg daily' : ' patients';
                        return `${label}: ${value}${suffix}`;
                      }
                    }
                  },
                },
                scales: {
                  x: {
                    grid: {
                      display: true,
                      color: (context) => {
                        return context.index === chartData.conditionTrends.highlightedIndex ? '#fbbf24' : '#e5e7eb';
                      },
                      lineWidth: (context) => {
                        return context.index === chartData.conditionTrends.highlightedIndex ? 2 : 1;
                      },
                    },
                    ticks: {
                      font: {
                        size: 11,
                        weight: (context) => {
                          return context.index === chartData.conditionTrends.highlightedIndex ? '700' : '500';
                        },
                      },
                      color: (context) => {
                        return context.index === chartData.conditionTrends.highlightedIndex ? '#f59e0b' : '#6b7280';
                      },
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#e5e7eb',
                      drawBorder: false,
                    },
                    ticks: {
                      font: {
                        size: 11,
                        weight: '500',
                      },
                      color: '#6b7280',
                      precision: 0,
                    },
                    title: {
                      display: true,
                      text: viewPeriod === 'weekly' ? 'Avg Daily Patients' : 'Number of Patients',
                      font: {
                        size: 12,
                        weight: '600',
                      },
                      color: '#374151',
                    },
                  },
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false,
                },
              }}
            />
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            Loading trend data...
          </p>
        )}

        {/* Monthly Comparison Table - Only for monthly view */}
        {viewPeriod === 'monthly' && monthlyComparison && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              📅 Month-over-Month Comparison
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ backgroundColor: '#284394', color: '#ffffff' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.9rem' }}>Condition</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>{monthlyComparison.previousMonth}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>{monthlyComparison.currentMonth}</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>Change</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlyComparison.conditions).map(([key, data], index) => {
                    const labels = {
                      hypertension: 'Hypertension',
                      overweight: 'Overweight',
                      obesity: 'Obesity',
                      diabetes: 'Diabetes',
                      heart_respiratory: 'Heart / Resp.',
                      normal: 'Normal',
                      other: 'Other',
                    };
                    
                    const trendColor = data.trend === 'up' ? '#dc2626' : data.trend === 'down' ? '#10b981' : '#6b7280';
                    const trendIcon = data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→';
                    const trendBg = data.trend === 'up' ? '#fee2e2' : data.trend === 'down' ? '#d1fae5' : '#f3f4f6';
                    
                    return (
                      <tr key={key} style={{ borderBottom: index < Object.keys(monthlyComparison.conditions).length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600', color: '#374151' }}>{labels[key]}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>{data.previous}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#284394' }}>{data.current}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: trendColor }}>
                          {data.change > 0 ? '+' : ''}{data.change} ({data.percentChange > 0 ? '+' : ''}{data.percentChange}%)
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '12px', 
                            backgroundColor: trendBg, 
                            color: trendColor, 
                            fontWeight: '700',
                            fontSize: '1.1rem'
                          }}>
                            {trendIcon}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NurseAnalytics;
