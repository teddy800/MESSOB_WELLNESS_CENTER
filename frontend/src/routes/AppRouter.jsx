import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import RoleBasedRoute from "../components/RoleBasedRoute";
import Dashboard from "../pages/Dashboard";
import NurseDashboard from "../pages/NurseDashboard";
import ManagerDashboard from "../pages/ManagerDashboard";
import RegionalDashboard from "../pages/RegionalDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Login from "../pages/Login";
import Register from "../pages/Register";

function AppRouter() {
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
