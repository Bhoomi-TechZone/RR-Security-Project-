import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../context/PermissionContext';
import authService from '../../services/authService';

/**
 * AdminRoute Component
 * Restricts route access strictly to authenticated Super Administrators (role === 'admin').
 * If a role-based user (role === 'user') accesses an /admin route, they are automatically
 * redirected to their dedicated /user/dashboard.
 */
function AdminRoute({ children }) {
  const location = useLocation();
  const token = authService.getToken();
  const { currentUser, isAdmin } = usePermissions();

  // If not logged in at all, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated as a role user (not admin), redirect to user panel
  if (currentUser && currentUser.role === 'user' && !isAdmin) {
    return <Navigate to="/user/dashboard" replace />;
  }

  // If authenticated as employee
  if (currentUser && currentUser.role === 'employee') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  // If authenticated as client
  if (currentUser && currentUser.role === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
