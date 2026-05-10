import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function CapacityTracker() {
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DAILY_SLOTS = 100;

  useEffect(() => {
    fetchCapacity();
    const interval = setInterval(fetchCapacity, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/analytics/capacity');
      const data = response.data.data;
      
      // Map backend response to component state
      setCapacity({
        booked: data.slotsUsed || 0,
        available: data.slotsRemaining || 0,
        total: data.dailyLimit || 100,
        utilizationPct: data.utilizationPct || 0,
      });
      setError('');
    } catch (err) {
      // If endpoint fails, calculate from appointments
      fetchAppointmentsCount();
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsCount = async () => {
    try {
      const response = await api.get('/api/v1/appointments');
      const data = response.data.data;
      
      let appointmentsList = [];
      if (Array.isArray(data)) {
        appointmentsList = data;
      } else if (data && data.appointments && Array.isArray(data.appointments)) {
        appointmentsList = data.appointments;
      }

      // Count today's appointments
      const today = new Date().toDateString();
      const todayCount = appointmentsList.filter(apt => 
        new Date(apt.scheduledAt).toDateString() === today
      ).length;

      setCapacity({
        booked: todayCount,
        available: DAILY_SLOTS - todayCount,
        total: DAILY_SLOTS,
      });
    } catch (err) {
      setError('Failed to load capacity');
      console.error(err);
    }
  };

  if (!capacity) {
    return (
      <div className="card capacity-tracker">
        <h3>📊 Daily Capacity</h3>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  const percentageUsed = (capacity.booked / capacity.total) * 100;
  const getCapacityStatus = () => {
    if (percentageUsed >= 100) return 'full';
    if (percentageUsed >= 80) return 'high';
    if (percentageUsed >= 50) return 'medium';
    return 'low';
  };

  const getStatusColor = () => {
    const status = getCapacityStatus();
    const colors = {
      full: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981',
    };
    return colors[status];
  };

  return (
    <div className="card capacity-tracker">
      <h3>📊 Daily Capacity</h3>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="capacity-info">
        <div className="capacity-stat">
          <span className="stat-label">Slots Remaining</span>
          <span className="stat-value">{capacity.available}/{capacity.total}</span>
        </div>
        <div className="capacity-stat">
          <span className="stat-label">Booked</span>
          <span className="stat-value">{capacity.booked}</span>
        </div>
      </div>

      <div className="capacity-bar-container">
        <div className="capacity-bar">
          <div 
            className="capacity-fill"
            style={{ 
              width: `${percentageUsed}%`,
              backgroundColor: getStatusColor(),
            }}
          ></div>
        </div>
        <p className="capacity-percentage">{Math.round(percentageUsed)}% Full</p>
      </div>

      <div className="capacity-status">
        <span className={`status-badge status-${getCapacityStatus()}`}>
          {getCapacityStatus() === 'full' && '🔴 FULL'}
          {getCapacityStatus() === 'high' && '🟠 HIGH'}
          {getCapacityStatus() === 'medium' && '🔵 MEDIUM'}
          {getCapacityStatus() === 'low' && '🟢 AVAILABLE'}
        </span>
      </div>

      <button 
        className="btn btn-small btn-secondary"
        onClick={fetchCapacity}
        disabled={loading}
      >
        🔄 Refresh
      </button>
    </div>
  );
}

export default CapacityTracker;
