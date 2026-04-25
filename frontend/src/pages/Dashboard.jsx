import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BookingCalendar from "../components/dashboard/BookingCalendar";
import MyAppointments from "../components/dashboard/MyAppointments";
import HealthJourney from "../components/dashboard/HealthJourney";
import WellnessPlan from "../components/dashboard/WellnessPlan";
import ProfileSection from "../components/dashboard/ProfileSection";

function Dashboard() {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("appointments");

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["appointments", "health", "wellness", "profile"];
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

      <div className="dashboard-content">
        {activeTab === "appointments" && (
          <>
            <BookingCalendar />
            <MyAppointments />
          </>
        )}

        {activeTab === "health" && <HealthJourney />}

        {activeTab === "wellness" && <WellnessPlan />}

        {activeTab === "profile" && <ProfileSection onLogout={logout} />}
      </div>
    </div>
  );
}

export default Dashboard;
