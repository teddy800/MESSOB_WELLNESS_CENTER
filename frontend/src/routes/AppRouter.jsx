import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../components/MainLayout';

import Login      from '../pages/Login';
import Register   from '../pages/Register';
import Dashboard  from '../pages/Dashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import Vitals     from '../pages/Vitals';
import Appointments from '../pages/Appointments';
import Wellness   from '../pages/Wellness';
import Feedback   from '../pages/Feedback';
import Analytics  from '../pages/Analytics';
import Centers    from '../pages/Centers';
import Users      from '../pages/Users';
import Profile    from '../pages/Profile';

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
            success: { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } },
            error:   { style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All authenticated users */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/vitals" element={
            <ProtectedRoute>
              <MainLayout><Vitals /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <MainLayout><Appointments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/wellness" element={
            <ProtectedRoute>
              <MainLayout><Wellness /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute>
              <MainLayout><Feedback /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout><Profile /></MainLayout>
            </ProtectedRoute>
          } />

          {/* NURSE_OFFICER and above — can view centers & own-center analytics */}
          <Route path="/centers" element={
            <ProtectedRoute roles={['NURSE_OFFICER','MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN']}>
              <MainLayout><Centers /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute roles={['NURSE_OFFICER','MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN']}>
              <MainLayout><Analytics /></MainLayout>
            </ProtectedRoute>
          } />

          {/* MANAGER and above — user management & manager dashboard */}
          <Route path="/manager" element={
            <ProtectedRoute roles={['MANAGER','REGIONAL_OFFICE','FEDERAL_ADMIN']}>
              <MainLayout><ManagerDashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['MANAGER','FEDERAL_ADMIN']}>
              <MainLayout><Users /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Fallbacks */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
