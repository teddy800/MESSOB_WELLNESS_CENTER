import React, { useState } from "react";
import FeedbackList from "../../components/admin/FeedbackList";
import FeedbackAnalytics from "../../components/admin/FeedbackAnalytics";
import "../../styles/admin-feedback.css";

function FeedbackQuality() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="feedback-quality-page">
      <div className="page-header">
        <h1>Feedback & Quality Management</h1>
        <p>Monitor customer satisfaction and service quality</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          📋 Feedback List
        </button>
        <button
          className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Analytics
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "list" && <FeedbackList />}
        {activeTab === "analytics" && <FeedbackAnalytics />}
      </div>
    </div>
  );
}

export default FeedbackQuality;
