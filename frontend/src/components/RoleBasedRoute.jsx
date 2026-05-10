import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function RoleBasedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleRoutes = {
      STAFF: '/dashboard',
      NURSE_OFFICER: '/nurse',
      MANAGER: '/manager',
      REGIONAL_OFFICE: '/regional',
      FEDERAL_OFFICE: '/regional',
      SYSTEM_ADMIN: '/admin',
    };
    return <Navigate to={roleRoutes[user.role] || '/dashboard'} replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default RoleBasedRoute;
