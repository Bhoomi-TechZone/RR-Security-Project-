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
  // Store currently selected demo user in localStorage or default to Amit Kumar (Supervisor)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('novaspark_active_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return MOCK_ROLE_USERS[0];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('novaspark_active_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Resolve active permissions from current user + role store
  const getPermissions = () => {
    if (currentUser.customPermissions !== undefined) {
      return currentUser.customPermissions;
    }

    const savedRoles = localStorage.getItem('novaspark_roles_data');
    const rolesList = savedRoles ? JSON.parse(savedRoles) : INITIAL_ROLES;
    const roleObj = rolesList.find(r => r.id === currentUser.roleId || r.name === currentUser.role);

    return roleObj ? roleObj.permissions || {} : {};
  };

  const permissions = getPermissions();

  /**
   * Check if the current user has a specific module and action permission
   * @param {string} moduleKey - e.g. 'employees', 'attendance', 'leave'
   * @param {string} actionKey - e.g. 'view', 'add', 'edit', 'delete', 'approve'
   * @returns {boolean}
   */
  const hasPermission = (moduleKey, actionKey = 'view') => {
    if (!permissions || !permissions[moduleKey]) return false;
    const actions = permissions[moduleKey];
    return Array.isArray(actions) && actions.includes(actionKey);
  };

  /**
   * Helper shorthand to check if user can view a module
   */
  const canView = (moduleKey) => hasPermission(moduleKey, 'view');

  /**
   * Switch the active demo user
   */
  const switchUser = (userId) => {
    const found = MOCK_ROLE_USERS.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        currentUser,
        permissions,
        hasPermission,
        canView,
        switchUser,
        availableDemoUsers: MOCK_ROLE_USERS
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    // Return safe fallback if rendered outside provider
    const defaultUser = MOCK_ROLE_USERS[0];
    const defaultRole = INITIAL_ROLES.find(r => r.id === 'role-supervisor');
    const defaultPerms = defaultRole ? defaultRole.permissions : {};
    
    return {
      currentUser: defaultUser,
      permissions: defaultPerms,
      hasPermission: (mod, act = 'view') => {
        const actions = defaultPerms[mod];
        return Array.isArray(actions) && actions.includes(act);
      },
      canView: (mod) => {
        const actions = defaultPerms[mod];
        return Array.isArray(actions) && actions.includes('view');
      },
      switchUser: () => {},
      availableDemoUsers: MOCK_ROLE_USERS
    };
  }
  return context;
}
