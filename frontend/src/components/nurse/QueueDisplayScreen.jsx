import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function QueueDisplayScreen() {
  const [currentServing, setCurrentServing] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchQueueData();
    const queueInterval = setInterval(fetchQueueData, 3000); // Refresh every 3 seconds
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(queueInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchQueueData = async () => {
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

      // Find currently serving (IN_PROGRESS or IN_SERVICE)
      const serving = queueList.find(item => 
        item.status === 'IN_PROGRESS' || item.status === 'IN_SERVICE'
      );
      setCurrentServing(serving);

      // Get waiting queue (next 5)
      const waiting = queueList
        .filter(item => item.status === 'WAITING')
        .slice(0, 5);
      setWaitingQueue(waiting);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedWaitTime = (position) => {
    // Estimate 15 minutes per person
    const minutes = position * 15;
    if (minutes < 60) {
      return `~${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `~${hours}h ${mins}m`;
  };

  return (
    <div className="queue-display-screen">
      <div className="display-header">
        <h1>🏥 MESOB Wellness Center</h1>
        <div className="current-time">
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      <div className="now-serving-section">
        <h2 className="section-title">NOW SERVING</h2>
        {currentServing ? (
          <div className="now-serving-card">
            <div className="token-number">{currentServing.appointmentId}</div>
            <div className="customer-name">{currentServing.customerName}</div>
            <div className="service-type">
              {currentServing.type === 'ONLINE' ? '📅 Online Appointment' : '🚶 Walk-in'}
            </div>
          </div>
        ) : (
          <div className="no-serving">
            <p>No customer currently being served</p>
            <p className="waiting-message">Please wait for your turn</p>
          </div>
        )}
      </div>

      <div className="waiting-queue-section">
        <h2 className="section-title">WAITING QUEUE</h2>
        {waitingQueue.length > 0 ? (
          <div className="waiting-list">
            {waitingQueue.map((item, idx) => (
              <div key={item.id || idx} className="waiting-item">
                <div className="queue-position">#{idx + 1}</div>
                <div className="waiting-token">{item.appointmentId}</div>
                <div className="waiting-info">
                  <div className="waiting-type">
                    {item.type === 'ONLINE' ? '📅' : '🚶'}
                  </div>
                  <div className="estimated-wait">
                    {getEstimatedWaitTime(idx + 1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-waiting">
            <p>No customers waiting</p>
          </div>
        )}
      </div>

      <div className="display-footer">
        <p>Please have your appointment ID ready</p>
        <p>Thank you for your patience</p>
      </div>
    </div>
  );
}

export default QueueDisplayScreen;
