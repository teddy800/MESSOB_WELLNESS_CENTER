import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function CallNextControl() {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCurrentCustomer();
  }, []);

  const fetchCurrentCustomer = async () => {
    try {
      const response = await api.get('/api/v1/appointments/queue');
      const data = response.data.data;
      
      let queueList = [];
      if (Array.isArray(data)) {
        queueList = data;
      } else if (data && data.queue && Array.isArray(data.queue)) {
        queueList = data.queue;
      }

      // Find first waiting customer
      const nextCustomer = queueList.find(item => item.status === 'WAITING');
      setCurrentCustomer(nextCustomer || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallNext = async () => {
    try {
      setLoading(true);
      setError('');

      // Call Physical Ticket API
      await api.post('/api/v1/tickets/call-next', {
        appointmentId: currentCustomer?.appointmentId,
        customerName: currentCustomer?.customerName,
      });

      // Update appointment status to IN_SERVICE
      await api.patch(`/api/v1/appointments/${currentCustomer?.appointmentId}`, {
        status: 'IN_PROGRESS',
      });

      setSuccess(`Called: ${currentCustomer?.customerName}`);
      
      setTimeout(() => {
        setSuccess('');
        fetchCurrentCustomer();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to call next customer');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      setLoading(true);
      setError('');

      await api.patch(`/api/v1/appointments/${currentCustomer?.appointmentId}`, {
        status: 'COMPLETED',
      });

      setSuccess('Appointment marked as completed');
      
      setTimeout(() => {
        setSuccess('');
        fetchCurrentCustomer();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card call-next-control">
      <h3>📢 Call Next & Display</h3>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="current-customer-display">
        {currentCustomer ? (
          <>
            <div className="display-screen">
              <div className="display-content">
                <p className="display-label">Now Serving:</p>
                <p className="display-name">{currentCustomer.customerName}</p>
                <p className="display-id">ID: {currentCustomer.appointmentId}</p>
                <p className="display-time">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="control-buttons">
              <button
                className="btn btn-primary btn-large"
                onClick={handleCallNext}
                disabled={loading || currentCustomer.status === 'IN_SERVICE'}
              >
                📢 Call Next
              </button>
              <button
                className="btn btn-success btn-large"
                onClick={handleMarkCompleted}
                disabled={loading || currentCustomer.status !== 'IN_SERVICE'}
              >
                ✓ Mark Completed
              </button>
            </div>

            <div className="customer-info">
              <p><strong>Status:</strong> {currentCustomer.status}</p>
              <p><strong>Type:</strong> {currentCustomer.type === 'ONLINE' ? '📅 Online' : '🚶 Walk-in'}</p>
              <p><strong>Check-in:</strong> {new Date(currentCustomer.checkInTime).toLocaleTimeString()}</p>
            </div>
          </>
        ) : (
          <div className="no-customer">
            <p className="empty-text">No customers waiting</p>
            <button
              className="btn btn-secondary"
              onClick={fetchCurrentCustomer}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallNextControl;
