import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import styles from './AdminUserManagement.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import UserSummaryCards from '../../components/users/UserSummaryCards';
import UsersTable from '../../components/users/UsersTable';
import UserFormModal from '../../components/users/UserFormModal';
import UserDetailsDrawer from '../../components/users/UserDetailsDrawer';
import ChangeRoleModal from '../../components/users/ChangeRoleModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/common/Toast';

import { INITIAL_ADMIN_USERS } from '../../data/adminUsersData';
import { INITIAL_ROLES } from '../../data/rolesPermissionsData';

function AdminUserManagement() {
  const navigate = useNavigate();

  // Users State with LocalStorage Persistence
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('novaspark_admin_users_data');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
  });

  // Roles State (pulled from roles & permissions storage or initial, cleanses any legacy dashboard key)
  const [roles] = useState(() => {
    const savedRoles = localStorage.getItem('novaspark_roles_data');
    const rawRoles = savedRoles ? JSON.parse(savedRoles) : INITIAL_ROLES;
    return rawRoles.map(r => {
      if (r.permissions && r.permissions.dashboard) {
        const { dashboard, ...cleanPerms } = r.permissions;
        return { ...r, permissions: cleanPerms };
      }
      return r;
    });
  });

  // Sync users to LocalStorage
  useEffect(() => {
    localStorage.setItem('novaspark_admin_users_data', JSON.stringify(users));
  }, [users]);

  // Card filter state
  const [cardFilter, setCardFilter] = useState('all');

  // Modals & Drawers State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState(null);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    onConfirm: null
  });

  // Toast feedback
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleFormModalSubmit = (userData) => {
    setIsFormModalOpen(false);

    if (editingUser) {
      // Update existing user
      setUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          return { ...u, ...userData };
        }
        return u;
      }));

      // Update selected drawer user if open
      if (selectedUserForDetails && selectedUserForDetails.id === editingUser.id) {
        setSelectedUserForDetails(prev => ({ ...prev, ...userData }));
      }

      showToast(`User ${userData.name} updated successfully.`);
    } else {
      // Create new user
      const nextUserNum = users.length + 1;
      const formattedUserId = `USR${String(nextUserNum).padStart(3, '0')}`;
      const initials = userData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const today = new Date().toISOString().split('T')[0];

      const newUser = {
        id: `usr-${Date.now()}`,
        userId: formattedUserId,
        name: userData.name,
        initials,
        email: userData.email,
        mobile: userData.mobile,
        username: userData.username,
        roleId: userData.roleId,
        roleName: userData.roleName,
        status: userData.status || 'Active',
        createdOn: today,
        lastLogin: null,
        avatarTone: 'primary'
      };

      setUsers(prev => [newUser, ...prev]);
      showToast(`User ${userData.name} (${formattedUserId}) created successfully.`);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUserForDetails(user);
    setIsDetailsDrawerOpen(true);
  };

  const handleOpenChangeRole = (user) => {
    setSelectedUserForRoleChange(user);
    setIsChangeRoleModalOpen(true);
  };

  const handleChangeRoleSubmit = ({ userId, roleId, roleName }) => {
    setIsChangeRoleModalOpen(false);

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          roleId,
          roleName
        };
      }
      return u;
    }));

    if (selectedUserForDetails && selectedUserForDetails.id === userId) {
      setSelectedUserForDetails(prev => ({ ...prev, roleId, roleName }));
    }

    showToast(`Role updated to "${roleName}" for user.`);
  };

  const handleToggleUserStatus = (user) => {
    const isDeactivating = user.status === 'Active';

    setConfirmDialog({
      isOpen: true,
      title: isDeactivating ? `Deactivate ${user.name}?` : `Activate ${user.name}?`,
      description: isDeactivating
        ? `This user will no longer be allowed to log into the HRMS portal until re-activated.`
        : `This user will regain access to log in with their assigned role (${user.roleName}).`,
      confirmLabel: isDeactivating ? 'Deactivate User' : 'Activate User',
      variant: isDeactivating ? 'warning' : 'primary',
      onConfirm: () => {
        const newStatus = isDeactivating ? 'Inactive' : 'Active';
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        if (selectedUserForDetails && selectedUserForDetails.id === user.id) {
          setSelectedUserForDetails(prev => ({ ...prev, status: newStatus }));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(`User account ${user.name} is now ${newStatus}.`);
      }
    });
  };

  const handleSuspendUser = (user) => {
    const isSuspended = user.status === 'Suspended';

    setConfirmDialog({
      isOpen: true,
      title: isSuspended ? `Unsuspend ${user.name}?` : `Suspend User ${user.name}?`,
      description: isSuspended
        ? `This user will be restored to Active status.`
        : `This user account will be temporarily suspended and blocked from logging in.`,
      confirmLabel: isSuspended ? 'Unsuspend User' : 'Suspend User',
      variant: isSuspended ? 'primary' : 'danger',
      onConfirm: () => {
        const newStatus = isSuspended ? 'Active' : 'Suspended';
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        if (selectedUserForDetails && selectedUserForDetails.id === user.id) {
          setSelectedUserForDetails(prev => ({ ...prev, status: newStatus }));
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(`User ${user.name} is now ${newStatus}.`);
      }
    });
  };

  const handleResetAccess = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: `Reset Login Access for ${user.name}?`,
      description: `This will invalidate active login sessions and generate new access credentials for ${user.email}.`,
      confirmLabel: 'Reset Access',
      variant: 'primary',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(`Login access credentials reset for ${user.name}.`);
      }
    });
  };

  const handleNavigateToRoles = () => {
    navigate('/admin/roles-permissions');
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Page Header */}
          <header className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>User Management</h1>
              <p className={styles.pageDescription}>
                Manage HRMS login users, assign roles and control account access.
              </p>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.btnAddUser}
                onClick={handleOpenAddUser}
                id="add-user-btn"
              >
                <UserPlus size={16} strokeWidth={2.5} />
                <span>Add User</span>
              </button>
            </div>
          </header>

          {/* Summary Metrics Cards */}
          <UserSummaryCards
            users={users}
            roles={roles}
            activeFilter={cardFilter}
            onCardClick={(filter) => setCardFilter(filter)}
          />

          {/* Main Users Table Section */}
          <section className={styles.tableSection}>
            <UsersTable
              users={users}
              roles={roles}
              onViewUser={handleViewUser}
              onEditUser={handleOpenEditUser}
              onChangeRole={handleOpenChangeRole}
              onToggleStatus={handleToggleUserStatus}
              onSuspendUser={handleSuspendUser}
              onResetAccess={handleResetAccess}
              onAddUser={handleOpenAddUser}
            />
          </section>
        </div>

        {/* Modals & Drawers */}
        <UserFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleFormModalSubmit}
          initialUser={editingUser}
          isEditing={Boolean(editingUser)}
          roles={roles}
          onNavigateToRoles={handleNavigateToRoles}
        />

        <UserDetailsDrawer
          isOpen={isDetailsDrawerOpen}
          user={selectedUserForDetails}
          roles={roles}
          onClose={() => setIsDetailsDrawerOpen(false)}
          onEditUser={handleOpenEditUser}
          onChangeRole={handleOpenChangeRole}
          onToggleStatus={handleToggleUserStatus}
          onManagePermissions={handleNavigateToRoles}
        />

        <ChangeRoleModal
          isOpen={isChangeRoleModalOpen}
          user={selectedUserForRoleChange}
          roles={roles}
          onClose={() => setIsChangeRoleModalOpen(false)}
          onSubmit={handleChangeRoleSubmit}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Toast Notification */}
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

export default AdminUserManagement;
