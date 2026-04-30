import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/dashboard/BookingCalendar";
import MyAppointments from "../components/dashboard/MyAppointments";
import HealthJourney from "../components/dashboard/HealthJourney";
import WellnessPlan from "../components/dashboard/WellnessPlan";
import ProfileSection from "../components/dashboard/ProfileSection";
import RiskScoring from "../components/dashboard/RiskScoring";
import HealthAlerts from "../components/dashboard/HealthAlerts";
import AppointmentReminders from "../components/dashboard/AppointmentReminders";
import FeedbackForm from "../components/dashboard/FeedbackForm";
import LongitudinalRecords from "../components/dashboard/LongitudinalRecords";

function Dashboard() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("appointments");

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["appointments", "health", "wellness", "profile", "feedback", "records"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }
    setActiveTab("appointments");
  }, [searchParams]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.fullName}</h1>
        <p className="dashboard-subtitle">
          Manage your health and appointments
        </p>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <span className="nav-icon">📅</span>
              <span className="nav-label">Appointments</span>
            </button>
            
            <button
              className={`sidebar-nav-item ${activeTab === 'health' ? 'active' : ''}`}
              onClick={() => setActiveTab('health')}
            >
              <span className="nav-icon">❤️</span>
              <span className="nav-label">Health</span>
            </button>
            
            <button
              className={`sidebar-nav-item ${activeTab === 'wellness' ? 'active' : ''}`}
              onClick={() => setActiveTab('wellness')}
            >
              <span className="nav-icon">🎯</span>
              <span className="nav-label">Wellness</span>
            </button>
            
            <button
              className={`sidebar-nav-item ${activeTab === 'records' ? 'active' : ''}`}
              onClick={() => setActiveTab('records')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Records</span>
            </button>
            
            <button
              className={`sidebar-nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              <span className="nav-icon">💬</span>
              <span className="nav-label">Give Feedback</span>
            </button>
            
            <button
              className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-label">Profile</span>
            </button>
          </nav>
        </aside>

        <main className="dashboard-content">
          {activeTab === "appointments" && (
            <>
              <BookingCalendar />
              <MyAppointments />
              <AppointmentReminders />
            </>
          )}

          {activeTab === "health" && (
            <>
              <HealthAlerts />
              <RiskScoring />
              <HealthJourney />
            </>
          )}

          {activeTab === "wellness" && <WellnessPlan />}

          {activeTab === "records" && <LongitudinalRecords />}

          {activeTab === "feedback" && <FeedbackForm />}

          {activeTab === "profile" && <ProfileSection onLogout={logout} />}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
