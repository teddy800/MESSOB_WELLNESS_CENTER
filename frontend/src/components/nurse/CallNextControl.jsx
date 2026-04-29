import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function CallNextControl({ onNavigateToVitals }) {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRecordVitalsButton, setShowRecordVitalsButton] = useState(false);

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
      setShowRecordVitalsButton(false);
      
      // Store queue count for display
      const waitingCount = queueList.filter(item => item.status === 'WAITING').length;
      console.log(`Customers waiting: ${waitingCount}`);
    } catch (err) {
      console.error(err);
      setCurrentCustomer(null);
    }
  };

  const handleCallNext = async () => {
    try {
      setLoading(true);
      setError('');

      // Update appointment status to IN_PROGRESS
      await api.patch(`/api/v1/appointments/${currentCustomer?.appointmentId}`, {
        status: 'IN_PROGRESS',
      });

      setSuccess(`Called: ${currentCustomer?.customerName}`);
      setShowRecordVitalsButton(true);
      
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to call next customer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVitals = () => {
    // Pass customer info to VitalsEntry via NurseDashboard
    if (onNavigateToVitals) {
      onNavigateToVitals({
        customerId: currentCustomer.customerId,
        customerName: currentCustomer.customerName,
        appointmentId: currentCustomer.appointmentId,
      });
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
      setShowRecordVitalsButton(false);
      
      // Refresh queue to show next customer
      setTimeout(() => {
        setSuccess('');
        fetchCurrentCustomer();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToQueue = () => {
    setShowRecordVitalsButton(false);
    setError('');
    setSuccess('');
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
                <p className="display-id">ID: {currentCustomer.appointmentId?.substring(0, 12)}...</p>
                <p className="display-time">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="control-buttons">
              {!showRecordVitalsButton ? (
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleCallNext}
                  disabled={loading}
                >
                  📢 Call Next
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleRecordVitals}
                  disabled={loading}
                >
                  💉 Record Vitals
                </button>
              )}
            </div>

            <div className="customer-info">
              <p><strong>Status:</strong> {currentCustomer.status}</p>
              <p><strong>Type:</strong> {currentCustomer.type === 'ONLINE' ? '📅 Online' : '🚶 Walk-in'}</p>
              <p><strong>Check-in:</strong> {new Date(currentCustomer.checkInTime).toLocaleTimeString()}</p>
            </div>
          </>
        ) : (
          <div className="no-customer">
            <p className="empty-text">✓ No customers waiting</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              All customers are being served or queue is empty
            </p>
            <button
              className="btn btn-secondary"
              onClick={fetchCurrentCustomer}
              disabled={loading}
              style={{ marginTop: '1rem' }}
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
