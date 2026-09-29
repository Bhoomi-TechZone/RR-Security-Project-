// NovaSpark HRMS — Admin User Management Data Source
// Manages HRMS login users who access the system with dynamic role-based permissions.
// NOTE: Users inherit permissions directly from their assigned Role. (USER -> ROLE -> PERMISSIONS)

import { INITIAL_ROLES, PERMISSION_MODULES, normalizePermissions } from './rolesPermissionsData';

export const INITIAL_ADMIN_USERS = [];

// Helper to resolve inherited role permissions for a user
export const getUserPermissions = (user, rolesList = INITIAL_ROLES) => {
  if (!user) return {};
  const role = rolesList.find(r => r.id === user.roleId || r.name === user.roleName);
  return role ? normalizePermissions(role.permissions || {}) : {};
};

// Helper to format a preview of permissions for a role
export const getRolePermissionsOverview = (role) => {
  if (!role || !role.permissions) return [];
  const perms = normalizePermissions(role.permissions);

  return PERMISSION_MODULES.map(mod => {
    const grantedActionKeys = perms[mod.key] || [];
    const isEnabled = grantedActionKeys.length > 0;

    const actionLabels = mod.actions
      .filter(act => grantedActionKeys.includes(act.key))
      .map(act => act.label);

    return {
      moduleKey: mod.key,
      moduleName: mod.name,
      category: mod.category,
      description: mod.description,
      isEnabled,
      actionCount: grantedActionKeys.length,
      totalActions: mod.actions.length,
      actionLabels: actionLabels.length > 0 ? actionLabels.join(' / ') : 'No Access'
    };
  });
};
