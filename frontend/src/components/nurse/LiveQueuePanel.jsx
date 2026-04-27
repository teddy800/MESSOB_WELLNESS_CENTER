import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function LiveQueuePanel() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchQueue();
    // Removed auto-refresh - queue only refreshes when user clicks refresh button
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/appointments/queue');
      const data = response.data.data;
      
      let queueList = [];
      if (Array.isArray(data)) {
        queueList = data;
      } else if (data && data.queue && Array.isArray(data.queue)) {
        queueList = data.queue;
      }
      
      setQueue(queueList);
      setError('');
    } catch (err) {
      setError('Failed to load queue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(item => {
    const matchesSearch = 
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.appointmentId?.includes(searchTerm);
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && item.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      WAITING: 'status-waiting',
      IN_SERVICE: 'status-in-service',
      COMPLETED: 'status-completed',
    };
    return colors[status] || 'status-waiting';
  };

  const getAppointmentType = (type) => {
    return type === 'ONLINE' ? '📅 Online' : '🚶 Walk-in';
  };

  const handleSendReminder = async (appointmentId, customerName) => {
    try {
      await api.post(`/api/v1/appointments/${appointmentId}/send-reminder`);
      alert(`✅ SMS reminder sent to ${customerName}`);
    } catch (err) {
      alert("❌ Failed to send SMS reminder");
      console.error(err);
    }
  };

  return (
    <div className="card live-queue-panel">
      <h2>📋 Live Queue</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="queue-controls">
        <input
          type="text"
          placeholder="Search by name or appointment ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <div className="filter-tabs">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({queue.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'WAITING' ? 'active' : ''}`}
            onClick={() => setFilter('WAITING')}
          >
            Waiting
          </button>
          <button 
            className={`filter-btn ${filter === 'IN_SERVICE' ? 'active' : ''}`}
            onClick={() => setFilter('IN_SERVICE')}
          >
            In Service
          </button>
          <button 
            className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
          </button>
        </div>
      </div>

      {loading && <p className="loading-text">Loading queue...</p>}

      {!loading && filteredQueue.length === 0 ? (
        <p className="empty-text">No customers in queue</p>
      ) : (
        <div className="queue-list">
          {filteredQueue.map((item, idx) => (
            <div key={item.id || idx} className={`queue-item ${getStatusColor(item.status)}`}>
              <div className="queue-item-header">
                <span className="queue-number">#{idx + 1}</span>
                <span className="customer-name">{item.customerName}</span>
                <span className="appointment-type">{getAppointmentType(item.type)}</span>
                <span className={`status-badge ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="queue-item-details">
                <p><strong>ID:</strong> {item.appointmentId}</p>
                <p><strong>Check-in:</strong> {new Date(item.checkInTime).toLocaleTimeString()}</p>
                {item.reason && <p><strong>Reason:</strong> {item.reason}</p>}
              </div>

              <div className="queue-item-actions">
                <button 
                  className="btn btn-small btn-primary"
                  onClick={() => handleSendReminder(item.appointmentId, item.customerName)}
                  title="Send SMS reminder to customer"
                >
                  📱 Send Reminder
                </button>
                <button className="btn btn-small btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button 
        className="btn btn-primary btn-refresh"
        onClick={fetchQueue}
        disabled={loading}
      >
        🔄 Refresh Queue
      </button>
    </div>
  );
}

export default LiveQueuePanel;
