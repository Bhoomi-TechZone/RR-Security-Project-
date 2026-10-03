import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../context/PermissionContext';
import authService from '../../services/authService';

/**
 * UserRoute Component
 * Restricts route access strictly to authenticated Role-Based Users (role === 'user' or admin).
 * If an unauthenticated user accesses /user, redirects to /login.
 */
function UserRoute({ children }) {
  const location = useLocation();
  const token = authService.getToken();
  const { currentUser, isAdmin } = usePermissions();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated as super administrator, redirect to admin panel
  if (currentUser && (currentUser.role === 'admin' || isAdmin)) {
    return <Navigate to="/admin/dashboard" replace />;
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

export default UserRoute;
