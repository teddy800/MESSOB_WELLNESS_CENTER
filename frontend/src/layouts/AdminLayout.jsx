import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/admin/AdminSidebar";
import ManagerSidebar from "../components/admin/ManagerSidebar";
import RegionalSidebar from "../components/admin/RegionalSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import "../styles/admin-layout.css";

function AdminLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  dashboardType = "admin",
  user,
  capacityInfo,
  staffCount,
  centerStats,
  centersCount,
  onRefresh,
  loading,
  lastUpdated,
  error,
  selectedCenter,
  setSelectedCenter,
  centers
}) {
  const { user: authUser } = useAuth();
  const currentUser = user || authUser;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderSidebar = () => {
    const commonProps = {
      activeTab,
      onTabChange,
      isOpen: sidebarOpen,
      user: currentUser
    };

    switch (dashboardType) {
      case "manager":
        return (
          <ManagerSidebar 
            {...commonProps}
            capacityInfo={capacityInfo}
            staffCount={staffCount}
            onRefresh={onRefresh}
            loading={loading}
          />
        );
      case "regional":
        return (
          <RegionalSidebar 
            {...commonProps}
            centerStats={centerStats}
            centersCount={centersCount}
            selectedCenter={selectedCenter}
            setSelectedCenter={setSelectedCenter}
            centers={centers}
          />
        );
      default:
        return <AdminSidebar {...commonProps} />;
    }
  };

  const getHeaderTitle = () => {
    switch (dashboardType) {
      case "manager":
        return "MESOB Manager Portal";
      case "regional":
        return "MESOB Regional Portal";
      default:
        return "MESOB Admin Portal";
    }
  };

  return (
    <div className="admin-layout">
      {renderSidebar()}
      
      <div className="admin-main">
        <AdminHeader 
          user={currentUser}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onTabChange={onTabChange}
          title={getHeaderTitle()}
          dashboardType={dashboardType}
          onRefresh={onRefresh}
          loading={loading}
          lastUpdated={lastUpdated}
        />
        
        <main className="admin-content">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
