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
import QueueDisplayScreen from "../components/nurse/QueueDisplayScreen";

function NurseDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["queue", "vitals", "walkin", "wellness", "history", "display"];
    return tab && allowedTabs.includes(tab) ? tab : "queue";
  });
  const [capacity, setCapacity] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["queue", "vitals", "walkin", "wellness", "history", "display"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleCapacityUpdate = (newCapacity) => {
    setCapacity(newCapacity);
  };

  const handleWalkInSuccess = (data) => {
    if (data?.action === 'recordVitals' && data?.patientId) {
      setSelectedCustomer(data.patientId);
      setActiveTab('vitals');
    }
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
    <div className="nurse-dashboard-layout">
      <aside className="nurse-sidebar">
        <div className="sidebar-header">
          <h2>👨‍⚕️ Nurse</h2>
          <p>{user?.fullName}</p>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <span className="nav-icon">📋</span>
            <span className="nav-label">Queue</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'vitals' ? 'active' : ''}`}
            onClick={() => setActiveTab('vitals')}
          >
            <span className="nav-icon">💉</span>
            <span className="nav-label">Vitals</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'walkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('walkin')}
          >
            <span className="nav-icon">🚶</span>
            <span className="nav-label">Walk-in</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'wellness' ? 'active' : ''}`}
            onClick={() => setActiveTab('wellness')}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Wellness</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-label">History</span>
          </button>
          
          <button
            className={`sidebar-nav-item ${activeTab === 'display' ? 'active' : ''}`}
            onClick={() => setActiveTab('display')}
          >
            <span className="nav-icon">📺</span>
            <span className="nav-label">Display</span>
          </button>
        </nav>
      </aside>

      <main className="nurse-main-content">
        <div className="nurse-content-header">
          <h1>
            {activeTab === 'queue' && '📋 Queue Management'}
            {activeTab === 'vitals' && '💉 Record Vitals'}
            {activeTab === 'walkin' && '🚶 Register Walk-in'}
            {activeTab === 'wellness' && '🎯 Create Wellness Plan'}
            {activeTab === 'history' && '📚 Customer History'}
            {activeTab === 'display' && '📺 Queue Display'}
          </h1>
        </div>

        <div className="nurse-content-body">
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

        {activeTab === "display" && (
          <div className="display-section">
            <QueueDisplayScreen />
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default NurseDashboard;
