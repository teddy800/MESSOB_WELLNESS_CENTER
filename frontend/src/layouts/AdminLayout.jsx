import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import "../styles/admin-layout.css";

function AdminLayout({ children, activeTab, onTabChange }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-layout">
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
      />
      
      <div className="admin-main">
        <AdminHeader 
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
