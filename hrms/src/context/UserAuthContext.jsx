import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ROLES } from '../data/rolesPermissionsData';

// Default mock user profiles for testing different permission sets
export const MOCK_ROLE_USERS = [
  {
    id: 'USR001',
    name: 'Amit Kumar',
    initials: 'AK',
    email: 'amit.kumar@novaspark.com',
    username: 'amit.kumar',
    role: 'Supervisor',
    roleId: 'role-supervisor',
    status: 'Active',
    avatarTone: 'info'
  },
  {
    id: 'USR003',
    name: 'Neha Sharma',
    initials: 'NS',
    email: 'neha.sharma@novaspark.com',
    username: 'neha.sharma',
    role: 'HR User',
    roleId: 'role-hr-user',
    status: 'Active',
    avatarTone: 'success'
  },
  {
    id: 'USR005',
    name: 'Neha Chawla',
    initials: 'NC',
    email: 'neha.chawla@novaspark.com',
    username: 'neha.chawla',
    role: 'Payroll User',
    roleId: 'role-payroll-user',
    status: 'Active',
    avatarTone: 'warning'
  },
  {
    id: 'USR002',
    name: 'Rohit Singh',
    initials: 'RS',
    email: 'rohit.singh@novaspark.com',
    username: 'rohit.singh',
    role: 'Site Supervisor',
    roleId: 'role-site-supervisor',
    status: 'Active',
    avatarTone: 'secondary'
  },
  {
    id: 'USR099',
    name: 'Rohan Verma',
    initials: 'RV',
    email: 'rohan.v@novaspark.com',
    username: 'rohan.verma',
    role: 'Restricted User',
    roleId: 'role-restricted',
    status: 'Active',
    avatarTone: 'danger',
    customPermissions: {} // No module access (empty dashboard test)
  }
];

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('novaspark_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return null;
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'novaspark_active_user') {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const permissions = currentUser?.permissions || {};

  /**
   * Check if the current user has a specific module and action permission
   * @param {string} moduleKey - e.g. 'employees', 'attendance', 'leave'
   * @param {string} actionKey - e.g. 'view', 'add', 'edit', 'delete', 'approve'
   * @returns {boolean}
   */
  const hasPermission = (moduleKey, actionKey = 'view') => {
    if (!currentUser) return false;
    if (isAdmin) return true;
    if (!moduleKey) return true;

    const normalizedKey = moduleKey === 'companies' ? 'clients' : moduleKey;
    const actions = permissions[normalizedKey] || permissions[moduleKey];
    if (Array.isArray(actions)) {
      return actions.includes(actionKey) || actions.includes('*');
    }
    return false;
  };

  /**
   * Helper shorthand to check if user can view a module
   */
  const canView = (moduleKey) => hasPermission(moduleKey, 'view');

  const switchUser = (userObj) => {
    if (userObj) {
      setCurrentUser(userObj);
      localStorage.setItem('novaspark_active_user', JSON.stringify(userObj));
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        currentUser,
        permissions,
        isAdmin,
        hasPermission,
        canView,
        switchUser
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    const user = (() => {
      const saved = localStorage.getItem('novaspark_active_user');
      if (saved) {
        try { return JSON.parse(saved); } catch (_) {}
      }
      return null;
    })();

    const isAdmin = user?.role === 'admin';
    const permissions = user?.permissions || {};

    return {
      currentUser: user,
      permissions,
      isAdmin,
      hasPermission: (mod, act = 'view') => {
        if (isAdmin) return true;
        if (!mod) return true;
        const normalizedKey = mod === 'companies' ? 'clients' : mod;
        const actions = permissions[normalizedKey] || permissions[mod];
        return Array.isArray(actions) && (actions.includes(act) || actions.includes('*'));
      },
      canView: (mod) => {
        if (isAdmin) return true;
        if (!mod) return true;
        const normalizedKey = mod === 'companies' ? 'clients' : mod;
        const actions = permissions[normalizedKey] || permissions[mod];
        return Array.isArray(actions) && (actions.includes('view') || actions.includes('*'));
      },
      switchUser: () => {}
    };
  }
  return context;
}
