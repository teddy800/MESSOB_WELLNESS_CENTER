import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function NurseDashboard() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch queue data
    const fetchQueue = async () => {
      try {
        const response = await fetch('/api/v1/appointments/queue', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setQueue(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching queue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  return (
    <div className="nurse-dashboard">
      <div className="dashboard-header">
        <h1>Nurse Dashboard</h1>
        <p>Welcome, {user?.fullName}</p>
      </div>

      <div className="dashboard-content">
        <div className="queue-section">
          <h2>Live Queue</h2>
          {loading ? (
            <p>Loading queue...</p>
          ) : queue.length === 0 ? (
            <p>No appointments in queue</p>
          ) : (
            <div className="queue-list">
              {queue.map((appointment) => (
                <div key={appointment.id} className="queue-item">
                  <p><strong>{appointment.customerName}</strong></p>
                  <p>ID: {appointment.id}</p>
                  <p>Status: {appointment.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="capacity-section">
          <h2>Daily Capacity</h2>
          <div className="capacity-info">
            <p>Slots remaining: 100/100</p>
            <div className="capacity-bar">
              <div className="capacity-fill" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NurseDashboard;
