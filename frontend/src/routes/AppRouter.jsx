import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRouter;
