import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import QuickHistoryModal from './QuickHistoryModal';

function LiveQueuePanel({ refreshTrigger, onNavigateToHistory }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  // Refresh queue when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      console.log('🔄 Queue refresh triggered');
      fetchQueue();
    }
  }, [refreshTrigger]);

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
      item.appointmentId?.includes(searchTerm) ||
      item.customerId?.includes(searchTerm);
    
    if (filter === 'all') {
      // Show all statuses except COMPLETED by default
      return matchesSearch && item.status !== 'COMPLETED';
    }
    return matchesSearch && item.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      WAITING: 'status-waiting',
      IN_PROGRESS: 'status-in-progress',
      IN_SERVICE: 'status-in-service',
      COMPLETED: 'status-completed',
    };
    return colors[status] || 'status-waiting';
  };

  const getAppointmentType = (type) => {
    return type === 'ONLINE' ? '📅 Online' : '🚶 Walk-in';
  };

  const handleSendReminder = async (appointmentId, customerName, customerEmail) => {
    try {
      // Send email reminder
      await api.post(`/api/v1/appointments/${appointmentId}/send-reminder`, {
        type: 'email',
        email: customerEmail,
      });
      alert(`✅ Email reminder sent to ${customerEmail}`);
    } catch (err) {
      alert("❌ Failed to send email reminder");
      console.error(err);
    }
  };

  const handleViewDetails = (customerId, customerName) => {
    // Show quick history modal instead of navigating
    setSelectedCustomerForHistory({ customerId, customerName });
    setShowHistoryModal(true);
  };

  const handleViewFullDetails = () => {
    // Navigate to full history view
    if (onNavigateToHistory && selectedCustomerForHistory) {
      onNavigateToHistory({
        customerId: selectedCustomerForHistory.customerId,
        customerName: selectedCustomerForHistory.customerName,
      });
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
            All ({queue.filter(q => q.status !== 'COMPLETED').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'WAITING' ? 'active' : ''}`}
            onClick={() => setFilter('WAITING')}
          >
            Waiting ({queue.filter(q => q.status === 'WAITING').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            In Progress ({queue.filter(q => q.status === 'IN_PROGRESS').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'IN_SERVICE' ? 'active' : ''}`}
            onClick={() => setFilter('IN_SERVICE')}
          >
            In Service ({queue.filter(q => q.status === 'IN_SERVICE').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed ({queue.filter(q => q.status === 'COMPLETED').length})
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
                <span className="customer-id" style={{ fontSize: '0.85rem', color: '#666' }}>
                  ID: {item.customerId?.substring(0, 8)}...
                </span>
                <span className="appointment-type">{getAppointmentType(item.type)}</span>
                <span className={`status-badge ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="queue-item-details">
                <p><strong>Appointment ID:</strong> {item.appointmentId?.substring(0, 12)}...</p>
                <p><strong>Check-in:</strong> {new Date(item.checkInTime).toLocaleTimeString()}</p>
                {item.reason && <p><strong>Reason:</strong> {item.reason}</p>}
              </div>

              <div className="queue-item-actions">
                {/* Only show Send Reminder and View Details for WAITING and IN_PROGRESS */}
                {(item.status === 'WAITING' || item.status === 'IN_PROGRESS') && (
                  <>
                    <button 
                      className="btn btn-small btn-primary"
                      onClick={() => handleSendReminder(item.appointmentId, item.customerName, item.customerEmail)}
                      title="Send email reminder to customer"
                    >
                      📧 Send Email
                    </button>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => handleViewDetails(item.customerId, item.customerName)}
                      title="View patient history"
                    >
                      📋 View History
                    </button>
                  </>
                )}
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

      {showHistoryModal && selectedCustomerForHistory && (
        <QuickHistoryModal
          customerId={selectedCustomerForHistory.customerId}
          customerName={selectedCustomerForHistory.customerName}
          onClose={() => setShowHistoryModal(false)}
          onViewDetails={handleViewFullDetails}
        />
      )}
    </div>
  );
}

export default LiveQueuePanel;
