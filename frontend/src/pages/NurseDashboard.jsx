import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LiveQueuePanel from "../components/nurse/LiveQueuePanel";
import CapacityTracker from "../components/nurse/CapacityTracker";
import RegisterWalkIn from "../components/nurse/RegisterWalkIn";
import VitalsEntry from "../components/nurse/VitalsEntry";
import CallNextControl from "../components/nurse/CallNextControl";
import WellnessPlanCreation from "../components/nurse/WellnessPlanCreation";
import CustomerHistoryView from "../components/nurse/CustomerHistoryView";

function NurseDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("queue");
  const [capacity, setCapacity] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["queue", "vitals", "walkin", "wellness", "history"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }
    setActiveTab("queue");
  }, [searchParams]);

  const handleCapacityUpdate = (newCapacity) => {
    setCapacity(newCapacity);
  };

  const handleWalkInSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleVitalsSuccess = () => {
    setSelectedCustomer(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleWellnessSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="nurse-dashboard-container">
      <div className="nurse-dashboard-header">
        <h1>👨‍⚕️ Nurse Dashboard</h1>
        <p className="dashboard-subtitle">
          Manage queue, record vitals, and serve customers
        </p>
        <p className="dashboard-subtitle">Welcome, {user?.fullName}</p>
      </div>

      <div className="nurse-dashboard-content">
        {activeTab === "queue" && (
          <div className="queue-section">
            <div className="queue-main">
              <LiveQueuePanel key={refreshKey} />
            </div>
            <div className="queue-sidebar">
              <CapacityTracker onCapacityUpdate={handleCapacityUpdate} />
              <CallNextControl />
            </div>
          </div>
        )}

        {activeTab === "vitals" && (
          <div className="vitals-section">
            <VitalsEntry
              customerId={selectedCustomer}
              onSuccess={handleVitalsSuccess}
            />
          </div>
        )}

        {activeTab === "walkin" && (
          <div className="walkin-section">
            <RegisterWalkIn
              onSuccess={handleWalkInSuccess}
              capacityAvailable={capacity?.available > 0}
            />
          </div>
        )}

        {activeTab === "wellness" && (
          <div className="wellness-section">
            <WellnessPlanCreation
              customerId={selectedCustomer}
              onSuccess={handleWellnessSuccess}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-section">
            <CustomerHistoryView customerId={selectedCustomer} />
          </div>
        )}
      </div>
    </div>
  );
}

export default NurseDashboard;
