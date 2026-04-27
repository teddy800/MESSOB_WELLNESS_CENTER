import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function AppointmentReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/appointments');
      const appointments = response.data.data;
      
      if (!Array.isArray(appointments)) {
        setReminders([]);
        return;
      }

      const upcomingAppointments = appointments
        .filter(apt => apt.status === 'CONFIRMED')
        .map(apt => ({
          ...apt,
          daysUntil: Math.ceil(
            (new Date(apt.scheduledAt) - new Date()) / (1000 * 60 * 60 * 24)
          ),
        }))
        .filter(apt => apt.daysUntil > 0 && apt.daysUntil <= 7)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      setReminders(upcomingAppointments);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const sendSmsReminder = async (appointmentId) => {
    try {
      await api.post(`/api/v1/appointments/${appointmentId}/send-reminder`);
      alert('SMS reminder sent successfully!');
    } catch (err) {
      alert('Failed to send SMS reminder');
    }
  };

  const getReminderColor = (daysUntil) => {
    if (daysUntil === 1) return 'red';
    if (daysUntil <= 3) return 'orange';
    return 'blue';
  };

  if (loading) return <p className="loading-text">Loading reminders...</p>;

  if (reminders.length === 0) {
    return (
      <div className="card appointment-reminders">
        <h3>📬 Appointment Reminders</h3>
        <p className="empty-text">No upcoming appointments in the next 7 days</p>
      </div>
    );
  }

  return (
    <div className="card appointment-reminders">
      <h3>📬 Appointment Reminders ({reminders.length})</h3>
      
      <div className="reminders-list">
        {reminders.map((reminder) => (
          <div 
            key={reminder.id} 
            className={`reminder-item reminder-${getReminderColor(reminder.daysUntil)}`}
          >
            <div className="reminder-header">
              <span className="reminder-days">
                {reminder.daysUntil === 1 ? 'Tomorrow' : `In ${reminder.daysUntil} days`}
              </span>
              <span className="reminder-date">
                {new Date(reminder.scheduledAt).toLocaleDateString()}
              </span>
            </div>

            <div className="reminder-details">
              <p><strong>Time:</strong> {new Date(reminder.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Reason:</strong> {reminder.reason}</p>
              <p><strong>ID:</strong> {reminder.id}</p>
            </div>

            <div className="reminder-actions">
              <button 
                className="btn btn-small btn-primary"
                onClick={() => sendSmsReminder(reminder.id)}
              >
                📱 Send SMS Reminder
              </button>
              <span className="sms-status">
                {reminder.smsStatus === 'sent' ? '✅ SMS Sent' : '⏳ Not sent'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="reminder-info">
        <p>💡 Tip: SMS reminders help you remember your appointments. Enable notifications in your phone settings.</p>
      </div>
    </div>
  );
}

export default AppointmentReminders;
