import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NurseAnalytics from "../components/nurse/NurseAnalytics";
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
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["analytics", "queue", "vitals", "walkin", "wellness", "history"];
    return tab && allowedTabs.includes(tab) ? tab : "analytics";
  });
  const [capacity, setCapacity] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [queueRefreshTrigger, setQueueRefreshTrigger] = useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowedTabs = ["analytics", "queue", "vitals", "walkin", "wellness", "history"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleCapacityUpdate = (newCapacity) => {
    setCapacity(newCapacity);
  };

  const handleStatusChanged = () => {
    // Trigger queue refresh when status changes
    setQueueRefreshTrigger(prev => prev + 1);
  };

  const handleWalkInSuccess = (data) => {
    if (data?.action === 'recordVitals' && data?.patientId) {
      setSelectedCustomer(data.patientId);
      setActiveTab('vitals');
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleVitalsSuccess = (data) => {
    if (data?.action === 'createWellnessPlan') {
      setSelectedCustomer(data.patientId);
      setActiveTab('wellness');
      // Pass vitals and suggested plan to wellness component
      if (data.suggestedPlan) {
        sessionStorage.setItem('suggestedWellnessPlan', JSON.stringify(data.suggestedPlan));
      }
      if (data.vitals) {
        sessionStorage.setItem('latestVitals', JSON.stringify(data.vitals));
      }
    }
    setRefreshKey((prev) => prev + 1);
  };

  const handleNavigateToWellness = (customerInfo) => {
    console.log('🎯 handleNavigateToWellness called with:', customerInfo);
    setSelectedCustomer(customerInfo.customerId);
    setSelectedAppointmentId(customerInfo.appointmentId);
    setActiveTab('wellness');
    // Pass vitals and suggested plan to wellness component
    if (customerInfo.suggestedPlan) {
      sessionStorage.setItem('suggestedWellnessPlan', JSON.stringify(customerInfo.suggestedPlan));
    }
    if (customerInfo.vitals) {
      sessionStorage.setItem('latestVitals', JSON.stringify(customerInfo.vitals));
    }
  };

  const handleNavigateToVitals = (customerInfo) => {
    setSelectedCustomer(customerInfo.customerId);
    setSelectedAppointmentId(customerInfo.appointmentId);
    setActiveTab('vitals');
  };

  const handleBackToQueue = async () => {
    // Reset selected customer and appointment
    setSelectedCustomer(null);
    setSelectedAppointmentId(null);
    // Refresh the queue to show updated status
    setRefreshKey((prev) => prev + 1);
    // Navigate to queue
    setActiveTab('queue');
  };

  const handleNavigateToHistory = (customerInfo) => {
    // Store customer info in sessionStorage for CustomerHistoryView to read
    sessionStorage.setItem('selectedCustomerForHistory', JSON.stringify({
      id: customerInfo.customerId,
      fullName: customerInfo.customerName,
    }));
    // Navigate to history tab
    setActiveTab('history');
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
            className={`sidebar-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Analytics</span>
          </button>
          
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
        </nav>
      </aside>

      <main className="nurse-main-content">
        <div className="nurse-content-header">
          <h1>
            {activeTab === 'analytics' && '📊 Analytics'}
            {activeTab === 'queue' && '📋 Queue Management'}
            {activeTab === 'vitals' && '💉 Record Vitals'}
            {activeTab === 'walkin' && '🚶 Register Walk-in'}
            {activeTab === 'wellness' && '🎯 Create Wellness Plan'}
            {activeTab === 'history' && '📚 Customer History'}
          </h1>
        </div>

        <div className="nurse-content-body">
        {activeTab === "analytics" && (
          <div className="analytics-section">
            <NurseAnalytics refreshTrigger={queueRefreshTrigger} />
          </div>
        )}

        {activeTab === "queue" && (
          <div className="queue-section">
            <div className="queue-main">
              <LiveQueuePanel key={refreshKey} refreshTrigger={queueRefreshTrigger} onNavigateToHistory={handleNavigateToHistory} />
            </div>
            <div className="queue-sidebar">
              <CapacityTracker onCapacityUpdate={handleCapacityUpdate} />
              <CallNextControl onNavigateToVitals={handleNavigateToVitals} onStatusChanged={handleStatusChanged} />
            </div>
          </div>
        )}

        {activeTab === "vitals" && (
          <div className="vitals-section">
            <VitalsEntry
              customerId={selectedCustomer}
              appointmentId={selectedAppointmentId}
              onSuccess={handleVitalsSuccess}
              onNavigateToWellness={handleNavigateToWellness}
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
              appointmentId={selectedAppointmentId}
              onSuccess={handleWellnessSuccess}
              onBackToQueue={handleBackToQueue}
              onStatusChanged={handleStatusChanged}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-section">
            <CustomerHistoryView customerId={selectedCustomer} />
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default NurseDashboard;
