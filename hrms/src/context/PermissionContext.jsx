import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    return authService.getCurrentUser();
  });

  const refreshPermissions = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      if (profile) {
        setCurrentUser(profile);
        localStorage.setItem('novaspark_active_user', JSON.stringify(profile));
      }
    } catch (e) {
      console.warn('Failed to refresh permissions from profile:', e);
    }
  }, []);

  useEffect(() => {
    // Initial profile fetch to ensure latest permissions from database
    const token = authService.getToken();
    if (token) {
      refreshPermissions();
    }

    const handleStorageChange = (e) => {
      if (e.key === 'novaspark_active_user') {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (_) {}
      }
    };

    const handleAuthChange = (e) => {
      setCurrentUser(e.detail || authService.getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [refreshPermissions]);

  const isAdmin = currentUser?.role === 'admin';

  const permissions = currentUser?.permissions || {};

  /**
   * Check if active user has permission for a specific module & action
   * @param {string} moduleKey - e.g. 'employees', 'clients', 'attendance', 'payroll'
   * @param {string} actionKey - e.g. 'view', 'add', 'edit', 'delete', 'approve', 'export'
   * @returns {boolean}
   */
  const hasPermission = useCallback((moduleKey, actionKey = 'view') => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (!moduleKey) return true;

    // Normalizing legacy module key names
    const normalizedKey = moduleKey === 'companies' ? 'clients' : moduleKey;
    const moduleActions = permissions[normalizedKey] || permissions[moduleKey];

    if (!moduleActions) return false;
    if (Array.isArray(moduleActions)) {
      return moduleActions.includes(actionKey) || moduleActions.includes('*');
    }
    return false;
  }, [currentUser, isAdmin, permissions]);

  // Specific action checkers
  const canView = useCallback((moduleKey) => hasPermission(moduleKey, 'view'), [hasPermission]);
  const canAdd = useCallback((moduleKey) => hasPermission(moduleKey, 'add'), [hasPermission]);
  const canEdit = useCallback((moduleKey) => hasPermission(moduleKey, 'edit'), [hasPermission]);
  const canDelete = useCallback((moduleKey) => hasPermission(moduleKey, 'delete'), [hasPermission]);
  const canApprove = useCallback((moduleKey) => hasPermission(moduleKey, 'approve'), [hasPermission]);
  const canExport = useCallback((moduleKey) => hasPermission(moduleKey, 'export'), [hasPermission]);
  const canPrint = useCallback((moduleKey) => hasPermission(moduleKey, 'print'), [hasPermission]);
  const canIssue = useCallback((moduleKey) => hasPermission(moduleKey, 'issue'), [hasPermission]);
  const canReturn = useCallback((moduleKey) => hasPermission(moduleKey, 'return'), [hasPermission]);

  const value = {
    currentUser,
    setCurrentUser,
    isAdmin,
    userRole: currentUser?.role === 'admin' ? 'Administrator' : (currentUser?.roleName || 'User'),
    permissions,
    hasPermission,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canApprove,
    canExport,
    canPrint,
    canIssue,
    canReturn,
    refreshPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Custom hook to consume permissions anywhere in the application
 */
export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    // Fallback if accessed outside provider
    const user = authService.getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const permissions = user?.permissions || {};

    const hasPermission = (moduleKey, actionKey = 'view') => {
      if (isAdmin) return true;
      if (!moduleKey) return true;
      const normalizedKey = moduleKey === 'companies' ? 'clients' : moduleKey;
      const actions = permissions[normalizedKey] || permissions[moduleKey];
      return Array.isArray(actions) && (actions.includes(actionKey) || actions.includes('*'));
    };

    return {
      currentUser: user,
      isAdmin,
      userRole: user?.roleName || user?.role || 'Admin',
      permissions,
      hasPermission,
      canView: (mod) => hasPermission(mod, 'view'),
      canAdd: (mod) => hasPermission(mod, 'add'),
      canEdit: (mod) => hasPermission(mod, 'edit'),
      canDelete: (mod) => hasPermission(mod, 'delete'),
      canApprove: (mod) => hasPermission(mod, 'approve'),
      canExport: (mod) => hasPermission(mod, 'export'),
      canPrint: (mod) => hasPermission(mod, 'print'),
      canIssue: (mod) => hasPermission(mod, 'issue'),
      canReturn: (mod) => hasPermission(mod, 'return'),
      refreshPermissions: () => {}
    };
  }
  return context;
}

/**
 * Helper component for conditional rendering based on role permission
 */
export function PermissionGuard({ module, action = 'view', fallback = null, children }) {
  const { hasPermission } = usePermissions();
  if (hasPermission(module, action)) {
    return <>{children}</>;
  }
  return fallback;
}

export default PermissionContext;
