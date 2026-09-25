import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Users,
  Shield,
  KeyRound,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import styles from './RolePermissions.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import RoleSummaryCards from '../../components/permissions/RoleSummaryCards';
import RolesTable from '../../components/permissions/RolesTable';
import RoleFormModal from '../../components/permissions/RoleFormModal';
import RoleDetailsDrawer from '../../components/permissions/RoleDetailsDrawer';
import PermissionMatrix from '../../components/permissions/PermissionMatrix';
import AssignedUsersTable from '../../components/permissions/AssignedUsersTable';
import AssignUserModal from '../../components/permissions/AssignUserModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/common/Toast';

import {
  PERMISSION_MODULES,
  createFullPermissions,
  createEmptyPermissions,
} from '../../data/rolesPermissionsData';

import { useCompany } from '../../context/CompanyContext';
import roleService from '../../services/roleService';
import { mockEmployees } from '../../data/employeeData';

function RolePermissions() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  const { activeCompany } = useCompany();
  const companyId = activeCompany?.companyId || activeCompany?.id || 'comp_rr_security';

  // Page mode: 'roles' | 'permissions'
  const [viewMode, setViewMode] = useState(() =>
    searchParams.get('tab') === 'permissions' ? 'permissions' : 'roles'
  );
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);

  // Active main tab under 'roles' mode: 'roles' | 'users'
  const [activeTab, setActiveTab] = useState('roles');

  // Summary card active filter
  const [cardFilter, setCardFilter] = useState('all');

  // Dynamic Roles state from Backend
  const [roles, setRoles] = useState([]);
  // Assigned Users state from Backend
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast feedback state
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Fetch Roles and Assigned Users for the active company
  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [fetchedRoles, fetchedUsers] = await Promise.all([
        roleService.getRoles(companyId),
        roleService.getAssignedUsers(companyId),
      ]);
      setRoles(Array.isArray(fetchedRoles) ? fetchedRoles : []);
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
    } catch (err) {
      console.error('Failed to load roles/permissions from backend:', err);
      showToast('Could not load roles and permissions. Please try again.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Modals & Drawers state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [isDuplicateRole, setIsDuplicateRole] = useState(false);

  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedRoleForDetails, setSelectedRoleForDetails] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [defaultRoleForAssignment, setDefaultRoleForAssignment] = useState('');

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    onConfirm: null,
  });

  // Directory of employees eligible for user assignment
  const mockDirectoryUsers = mockEmployees.map((emp) => ({
    id: `usr-${emp.id}`,
    employeeId: emp.employeeId,
    name: emp.name,
    initials: emp.initials,
    email: `${emp.name.toLowerCase().replace(/\s+/g, '.')}@novaspark.com`,
    company: emp.companyName || activeCompany?.name || 'RR Security',
    designation: emp.designation,
    department: emp.department,
  }));

  // Handlers for Role Actions
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setIsDuplicateRole(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEditRoleInfo = (role) => {
    if (role.type === 'system') {
      showToast('System roles cannot have their metadata edited.', 'danger');
      return;
    }
    setEditingRole(role);
    setIsDuplicateRole(false);
    setIsFormModalOpen(true);
  };

  const handleOpenDuplicateRole = (role) => {
    setEditingRole(role);
    setIsDuplicateRole(true);
    setIsFormModalOpen(true);
  };

  const handleFormModalSubmit = async ({ name, description, status, cloneFromId, goToPermissions }) => {
    setIsFormModalOpen(false);

    try {
      if (editingRole && !isDuplicateRole) {
        // Update existing role info
        const updated = await roleService.updateRole(
          companyId,
          editingRole.id || editingRole.roleId,
          { name, description, status }
        );

        setRoles((prev) =>
          prev.map((r) => (r.id === updated.id || r.roleId === updated.id ? updated : r))
        );

        // Update roleName in local users list
        setUsers((prev) =>
          prev.map((u) => (u.roleId === editingRole.id ? { ...u, roleName: name } : u))
        );

        showToast(`✓ Role "${name}" updated successfully.`);
      } else {
        // Create new role or duplicate
        let permissions = createEmptyPermissions();

        if (cloneFromId) {
          const sourceRole = roles.find((r) => r.id === cloneFromId || r.roleId === cloneFromId);
          if (sourceRole && sourceRole.permissions) {
            permissions = JSON.parse(JSON.stringify(sourceRole.permissions));
          }
        }

        const created = await roleService.createRole(companyId, {
          name,
          description,
          status,
          permissions,
        });

        setRoles((prev) => [...prev, created]);
        showToast(`✓ Role "${name}" created successfully.`);

        if (goToPermissions) {
          setSelectedRoleForPermissions(created);
          setViewMode('permissions');
        }
      }
    } catch (err) {
      console.error('Error saving role:', err);
      showToast(err.message || 'Failed to save role.', 'danger');
    }
  };

  // View Role Details Drawer
  const handleViewRole = (role) => {
    setSelectedRoleForDetails(role);
    setIsDetailsDrawerOpen(true);
  };

  // Open Permission Matrix View
  const handleEditPermissions = (role) => {
    setSelectedRoleForPermissions(role);
    setViewMode('permissions');
  };

  // Save Permissions from Matrix
  const handleSavePermissions = async (roleId, updatedPermissions) => {
    try {
      const updated = await roleService.updateRolePermissions(companyId, roleId, updatedPermissions);
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId || r.roleId === roleId ? { ...r, permissions: updatedPermissions } : r))
      );

      if (selectedRoleForPermissions && (selectedRoleForPermissions.id === roleId || selectedRoleForPermissions.roleId === roleId)) {
        setSelectedRoleForPermissions((prev) => ({
          ...prev,
          permissions: updatedPermissions,
        }));
      }

      showToast('✓ Role permissions updated and saved successfully.');
    } catch (err) {
      console.error('Error saving permissions:', err);
      showToast(err.message || 'Failed to update role permissions.', 'danger');
    }
  };

  // Toggle Active / Inactive status of a role
  const handleToggleRoleStatus = (role) => {
    if (role.type === 'system' && role.name === 'Admin') {
      showToast('The Admin system role cannot be deactivated.', 'danger');
      return;
    }

    const isDeactivating = role.status === 'Active' || role.status === 'active';
    const newStatus = isDeactivating ? 'Inactive' : 'Active';

    setConfirmDialog({
      isOpen: true,
      title: isDeactivating ? `Deactivate "${role.name}" Role?` : `Activate "${role.name}" Role?`,
      description: isDeactivating
        ? `Users currently assigned to this role may lose access to protected features while the role is inactive.`
        : `Activating this role will restore permission access for all assigned users.`,
      confirmLabel: isDeactivating ? 'Deactivate Role' : 'Activate Role',
      variant: isDeactivating ? 'warning' : 'primary',
      onConfirm: async () => {
        try {
          const roleId = role.id || role.roleId;
          const updated = await roleService.updateRole(companyId, roleId, { status: newStatus });
          setRoles((prev) =>
            prev.map((r) => (r.id === roleId || r.roleId === roleId ? { ...r, status: newStatus } : r))
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`✓ Role "${role.name}" is now ${newStatus}.`);
        } catch (err) {
          console.error('Error toggling role status:', err);
          showToast(err.message || 'Failed to update role status.', 'danger');
        }
      },
    });
  };

  // Delete custom role
  const handleDeleteRole = (role) => {
    if (role.type === 'system') {
      showToast('Protected system roles cannot be deleted.', 'danger');
      return;
    }

    const roleId = role.id || role.roleId;
    const assignedUsersCount = users.filter((u) => u.roleId === roleId).length;

    if (assignedUsersCount > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Cannot Delete Role',
        description: `This role currently has ${assignedUsersCount} active user(s) assigned. You must reassign or remove all users before deleting this role, or deactivate it instead.`,
        confirmLabel: 'Understood',
        variant: 'primary',
        onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Delete "${role.name}" Role?`,
      description: `Are you sure you want to permanently delete this role? This action cannot be undone.`,
      confirmLabel: 'Delete Role',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await roleService.deleteRole(companyId, roleId);
          setRoles((prev) => prev.filter((r) => r.id !== roleId && r.roleId !== roleId));
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`✓ Role "${role.name}" was permanently deleted.`);
        } catch (err) {
          console.error('Error deleting role:', err);
          showToast(err.message || 'Failed to delete role.', 'danger');
        }
      },
    });
  };

  // User Assignment Actions
  const handleOpenAssignUserModal = (targetRole = null) => {
    setEditingUserRole(null);
    setDefaultRoleForAssignment(targetRole ? (targetRole.id || targetRole.roleId) : (roles[0]?.id || roles[0]?.roleId));
    setIsAssignModalOpen(true);
  };

  const handleOpenChangeUserRoleModal = (user) => {
    setEditingUserRole(user);
    setDefaultRoleForAssignment(user.roleId);
    setIsAssignModalOpen(true);
  };

  const handleAssignUserSubmit = async ({ userId, roleId, status, userObject }) => {
    setIsAssignModalOpen(false);
    const targetRole = roles.find((r) => r.id === roleId || r.roleId === roleId);
    const roleName = targetRole ? targetRole.name : 'Custom Role';

    try {
      const payload = {
        name: userObject.name,
        email: userObject.email,
        employeeId: userObject.employeeId || '',
        roleId,
        roleName,
        department: userObject.department || 'General',
        status: status || 'Active',
      };

      const result = await roleService.assignUser(companyId, payload);

      setUsers((prev) => {
        const existingIdx = prev.findIndex((u) => u.email === userObject.email);
        if (existingIdx !== -1) {
          const clone = [...prev];
          clone[existingIdx] = result;
          return clone;
        }
        return [result, ...prev];
      });

      // Refresh roles to update usersCount
      setRoles((prev) =>
        prev.map((r) => {
          const rId = r.id || r.roleId;
          const count = (rId === roleId) ? (r.usersCount || 0) + 1 : r.usersCount;
          return { ...r, usersCount: count };
        })
      );

      showToast(`✓ User ${userObject.name} assigned to "${roleName}" role.`);
    } catch (err) {
      console.error('Error assigning user:', err);
      showToast(err.message || 'Failed to assign user to role.', 'danger');
    }
  };

  const handleToggleUserStatus = (user) => {
    const isDeactivating = user.status === 'Active' || user.status === 'active';
    const newStatus = isDeactivating ? 'Inactive' : 'Active';

    setConfirmDialog({
      isOpen: true,
      title: isDeactivating ? `Deactivate User "${user.name}"?` : `Activate User "${user.name}"?`,
      description: isDeactivating
        ? `This user will no longer be permitted to log in or access permission-protected modules.`
        : `This user will regain access according to their assigned role "${user.roleName}".`,
      confirmLabel: isDeactivating ? 'Deactivate User' : 'Activate User',
      variant: isDeactivating ? 'warning' : 'primary',
      onConfirm: async () => {
        try {
          const updated = await roleService.assignUser(companyId, {
            ...user,
            status: newStatus,
          });
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id || u.userId === user.id ? { ...u, status: newStatus } : u))
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`✓ User ${user.name} is now ${newStatus}.`);
        } catch (err) {
          console.error('Error toggling user status:', err);
          showToast(err.message || 'Failed to update user status.', 'danger');
        }
      },
    });
  };

  const handleRemoveUserFromRole = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove User Assignment?`,
      description: `Are you sure you want to remove "${user.name}" from the "${user.roleName}" role?`,
      confirmLabel: 'Remove Assignment',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const userId = user.id || user.userId;
          await roleService.removeUser(companyId, userId);
          setUsers((prev) => prev.filter((u) => u.id !== userId && u.userId !== userId));
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`✓ Removed user assignment for ${user.name}.`);
        } catch (err) {
          console.error('Error removing user:', err);
          showToast(err.message || 'Failed to remove user assignment.', 'danger');
        }
      },
    });
  };

  // Card click filter handler
  const handleCardFilterClick = (filterType) => {
    setCardFilter(filterType);
    if (filterType === 'users') {
      setActiveTab('users');
    } else {
      setActiveTab('roles');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb Bar */}
        <div className={styles.topBar}>
          <div className={styles.breadcrumb}>
            <span>{isFromOrgSettings ? 'Organization Settings' : 'System'}</span>
            <span className={styles.crumbDivider}>/</span>
            <span className={styles.currentCrumb}>
              {viewMode === 'permissions' ? 'Permission Matrix' : 'Role & Permissions'}
            </span>
          </div>

          {viewMode === 'permissions' && (
            <button
              onClick={() => setViewMode('roles')}
              className={styles.backBtn}
            >
              <RotateCcw size={16} />
              <span>Back to Roles</span>
            </button>
          )}
        </div>

        {/* Dynamic View: Roles View or Permission Matrix */}
        {viewMode === 'permissions' ? (
          <div className={styles.matrixWrapper}>
            <PermissionMatrix
              roles={roles}
              initialSelectedRoleId={selectedRoleForPermissions ? (selectedRoleForPermissions.id || selectedRoleForPermissions.roleId) : roles[0]?.id}
              onSavePermissions={handleSavePermissions}
              onBack={() => setViewMode('roles')}
            />
          </div>
        ) : (
          <div className={styles.rolesMainView}>
            {/* Page Header */}
            <header className={styles.header}>
              <div className={styles.headerTitleArea}>
                <div className={styles.headerBadge}>Access Control</div>
                <h1 className={styles.title}>Role & Permissions</h1>
                <p className={styles.description}>
                  Configure system roles, fine-grained module permissions and user assignments for{' '}
                  <strong>{activeCompany?.name || 'RR Security'}</strong>.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button
                  onClick={() => {
                    setSelectedRoleForPermissions(roles[0]);
                    setViewMode('permissions');
                  }}
                  className={styles.matrixBtn}
                >
                  <KeyRound size={16} />
                  <span>Permission Matrix</span>
                </button>

                <button
                  onClick={handleOpenCreateRole}
                  className={styles.createBtn}
                >
                  <Plus size={16} />
                  <span>Add New Role</span>
                </button>
              </div>
            </header>

            {/* Role Summary Statistics Cards */}
            <RoleSummaryCards
              roles={roles}
              users={users}
              activeFilter={cardFilter}
              onCardClick={handleCardFilterClick}
            />

            {/* Navigation Tabs (Roles List vs User Assignments) */}
            <div className={styles.tabsRow}>
              <div className={styles.tabsGroup}>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'roles' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('roles')}
                >
                  <Shield size={16} />
                  <span>Configured Roles</span>
                  <span className={styles.tabBadge}>{roles.length}</span>
                </button>

                <button
                  className={`${styles.tabBtn} ${activeTab === 'users' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  <Users size={16} />
                  <span>Assigned Users</span>
                  <span className={styles.tabBadge}>{users.length}</span>
                </button>
              </div>

              <div className={styles.tabsActionWrap}>
                {activeTab === 'roles' ? (
                  <button
                    onClick={handleOpenCreateRole}
                    className={styles.secondaryActionBtn}
                  >
                    <Plus size={14} />
                    <span>Create Custom Role</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAssignUserModal(null)}
                    className={styles.secondaryActionBtn}
                  >
                    <Plus size={14} />
                    <span>Assign User to Role</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Content: Roles Table vs Assigned Users Table */}
            {activeTab === 'roles' ? (
              <RolesTable
                roles={roles}
                users={users}
                onViewRole={handleViewRole}
                onEditPermissions={handleEditPermissions}
                onEditRoleInfo={handleOpenEditRoleInfo}
                onDuplicateRole={handleOpenDuplicateRole}
                onToggleStatus={handleToggleRoleStatus}
                onDeleteRole={handleDeleteRole}
                onAssignUsers={handleOpenAssignUserModal}
              />
            ) : (
              <AssignedUsersTable
                users={users}
                roles={roles}
                onAssignUser={() => handleOpenAssignUserModal(null)}
                onChangeRole={handleOpenChangeUserRoleModal}
                onToggleStatus={handleToggleUserStatus}
                onRemoveUser={handleRemoveUserFromRole}
              />
            )}
          </div>
        )}

        {/* Modals & Drawers */}
        <RoleFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormModalSubmit}
          initialRole={editingRole}
          isEditing={Boolean(editingRole && !isDuplicateRole)}
          isDuplicate={isDuplicateRole}
          existingRoles={roles}
        />

        <RoleDetailsDrawer
          isOpen={isDetailsDrawerOpen}
          role={selectedRoleForDetails}
          users={users}
          onClose={() => setIsDetailsDrawerOpen(false)}
          onEditPermissions={handleEditPermissions}
          onEditRoleInfo={handleOpenEditRoleInfo}
          onAssignUser={(targetRole) => {
            setIsDetailsDrawerOpen(false);
            handleOpenAssignUserModal(targetRole);
          }}
          onChangeUserRole={(targetUser) => {
            setIsDetailsDrawerOpen(false);
            handleOpenChangeUserRoleModal(targetUser);
          }}
          onRemoveUserFromRole={handleRemoveUserFromRole}
        />

        <AssignUserModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSubmit={handleAssignUserSubmit}
          roles={roles}
          user={editingUserRole}
          defaultRoleId={defaultRoleForAssignment}
          mockDirectoryUsers={mockDirectoryUsers}
        />

        {/* Generic Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Toast Feedback */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      </div>
    </AdminLayout>
  );
}

export default RolePermissions;
