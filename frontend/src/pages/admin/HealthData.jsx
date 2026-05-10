import React, { useState } from "react";
import VitalRecordsList from "../../components/admin/VitalRecordsList";
import WellnessPlansList from "../../components/admin/WellnessPlansList";
import "../../styles/admin-health.css";

function HealthData() {
  const [activeTab, setActiveTab] = useState("vitals");

  return (
    <div className="health-data-page">
      <div className="page-header">
        <h1>Health Data Management</h1>
        <p>Manage vital records and wellness plans</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "vitals" ? "active" : ""}`}
          onClick={() => setActiveTab("vitals")}
        >
          📊 Vital Records
        </button>
        <button
          className={`tab-button ${activeTab === "wellness" ? "active" : ""}`}
          onClick={() => setActiveTab("wellness")}
        >
          💪 Wellness Plans
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "vitals" && <VitalRecordsList />}
        {activeTab === "wellness" && <WellnessPlansList />}
      </div>
    </div>
  );
}

export default HealthData;
