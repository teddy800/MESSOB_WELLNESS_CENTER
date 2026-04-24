import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import MyAppointments from '../components/dashboard/MyAppointments';
import HealthJourney from '../components/dashboard/HealthJourney';
import WellnessPlan from '../components/dashboard/WellnessPlan';
import ProfileSection from '../components/dashboard/ProfileSection';

function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading] = useState(false);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.fullName}</h1>
        <p className="dashboard-subtitle">Manage your health and appointments</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appointments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          💪 Health Journey
        </button>
        <button 
          className={`tab-btn ${activeTab === 'wellness' ? 'active' : ''}`}
          onClick={() => setActiveTab('wellness')}
        >
          🎯 Wellness Plan
        </button>
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'appointments' && (
          <>
            <BookingCalendar />
            <MyAppointments />
          </>
        )}

        {activeTab === 'health' && (
          <HealthJourney />
        )}

        {activeTab === 'wellness' && (
          <WellnessPlan />
        )}

        {activeTab === 'profile' && (
          <ProfileSection onLogout={logout} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
