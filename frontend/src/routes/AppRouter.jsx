import React, { useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/MainLayout";
import RoleBasedRoute from "../components/RoleBasedRoute";
import MaintenanceMode from "../components/MaintenanceMode";
import Dashboard from "../pages/Dashboard";
import NurseDashboard from "../pages/NurseDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import RegionalDashboard from "../pages/RegionalDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";

function AppRouter() {
  const { user } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenanceMode = () => {
      const settings = localStorage.getItem("systemSettings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setMaintenanceMode(parsed.maintenanceMode || false);
      }
    };

    checkMaintenanceMode();
    const interval = setInterval(checkMaintenanceMode, 5000);
    return () => clearInterval(interval);
  }, []);

  // Show maintenance page for non-admin users when maintenance mode is on
  // Admins can always access /admin route
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  if (maintenanceMode && user?.role !== "SYSTEM_ADMIN" && !isAdminRoute) {
    return <MaintenanceMode />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <RoleBasedRoute allowedRoles={["STAFF"]}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/nurse"
        element={
          <RoleBasedRoute allowedRoles={["NURSE_OFFICER"]}>
            <MainLayout>
              <NurseDashboard />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/nurse-dashboard"
        element={<Navigate to="/nurse" replace />}
      />
      <Route
        path="/manager"
        element={
          <RoleBasedRoute allowedRoles={["MANAGER"]}>
            <MainLayout>
              <ManagerDashboard />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/regional"
        element={
          <RoleBasedRoute allowedRoles={["REGIONAL_OFFICE", "FEDERAL_OFFICE"]}>
            <MainLayout>
              <RegionalDashboard />
            </MainLayout>
          </RoleBasedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleBasedRoute allowedRoles={["SYSTEM_ADMIN"]}>
            <AdminDashboard />
          </RoleBasedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRouter;
