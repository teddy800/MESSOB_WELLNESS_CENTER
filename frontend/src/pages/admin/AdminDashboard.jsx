import React, { useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import DashboardMetrics from "../../components/admin/DashboardMetrics";
import DashboardCharts from "../../components/admin/DashboardCharts";
import UserManagement from "./UserManagement";
import CenterManagement from "./CenterManagement";
import AppointmentManagement from "./AppointmentManagement";
import HealthData from "./HealthData";
import FeedbackQuality from "./FeedbackQuality";
import Analytics from "./Analytics";
import AuditLogs from "./AuditLogs";
import SystemSettings from "./SystemSettings";
import "../../styles/admin-layout.css";
import "../../styles/admin-dashboard.css";
import "../../styles/admin-filters.css";
import "../../styles/admin-tables.css";
import "../../styles/admin-health.css";
import "../../styles/admin-feedback.css";
import "../../styles/admin-analytics.css";
import "../../styles/admin-audit.css";
import "../../styles/admin-settings.css";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="dashboard-section">
            <h2>System Dashboard</h2>
            <DashboardMetrics />
            <DashboardCharts />
          </div>
        );
      case "users":
        return <UserManagement />;
      case "centers":
        return <CenterManagement />;
      case "appointments":
        return <AppointmentManagement />;
      case "vitals":
        return <HealthData />;
      case "feedback":
        return <FeedbackQuality />;
      case "analytics":
        return <Analytics />;
      case "audit":
        return <AuditLogs />;
      case "settings":
        return <SystemSettings />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}

export default AdminDashboard;
