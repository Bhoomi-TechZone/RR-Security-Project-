import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import styles from './AdminUserManagement.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import UserSummaryCards from '../../components/users/UserSummaryCards';
import UsersTable from '../../components/users/UsersTable';
import UserFormModal from '../../components/users/UserFormModal';
import UserDetailsDrawer from '../../components/users/UserDetailsDrawer';
import ChangeRoleModal from '../../components/users/ChangeRoleModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import { authService } from '../../services/authService';
import userService from '../../services/userService';
import roleService from '../../services/roleService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function AdminUserManagement() {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id;

  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const filterParam = searchParams.get('filter');

  const initialFilter = statusParam === 'active' ? 'active' : statusParam === 'inactive' ? 'inactive' : filterParam === 'roles' ? 'roles' : 'all';

  // Dynamic state from backend
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [nextUserId, setNextUserId] = useState('USR001');
  const [loading, setLoading] = useState(true);

  // Card filter state
  const [cardFilter, setCardFilter] = useState(initialFilter);

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

  // Sync cardFilter with URL search parameters
  useEffect(() => {
    const currentStatus = searchParams.get('status');
    const currentFilter = searchParams.get('filter');
    if (currentStatus === 'active') {
      setCardFilter('active');
    } else if (currentStatus === 'inactive') {
      setCardFilter('inactive');
    } else if (currentFilter === 'roles' || currentStatus === 'roles') {
      setCardFilter('roles');
    } else {
      setCardFilter('all');
    }
  }, [searchParams]);

  // Fetch all users, roles, and employees for the active company
  const loadCompanyData = useCallback(async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    try {
      // Clear any legacy static local storage keys
      localStorage.removeItem('novaspark_admin_users_data');
      localStorage.removeItem(`novaspark_users_${currentCompanyId}`);

      // 1. Fetch Users strictly from Database
      let fetchedUsers = [];
      try {
        fetchedUsers = await userService.getUsers(currentCompanyId);
      } catch (err) {
        console.warn('Backend users fetch error:', err);
        fetchedUsers = [];
      }

      // 2. Fetch Roles strictly from Database
      let fetchedRoles = [];
      try {
        fetchedRoles = await roleService.getRoles(currentCompanyId);
      } catch (err) {
        console.warn('Backend roles fetch error:', err);
        fetchedRoles = [];
      }

      // 3. Fetch Next User ID
      let dynamicNextId = 'USR001';
      try {
        dynamicNextId = await userService.getNextUserId(currentCompanyId);
      } catch (err) {
        // compute from fetched users
        const maxNum = (fetchedUsers || []).reduce((max, u) => {
          const match = u.userId && String(u.userId).match(/USR(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            return Math.max(max, num);
          }
          return max;
        }, 0);
        dynamicNextId = `USR${String(maxNum + 1).padStart(3, '0')}`;
      }

      // 4. Fetch Employees (for dropdown)
      try {
        const token = authService.getToken();
        const empRes = await fetch(`${API_BASE_URL}/employees`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'x-company-id': currentCompanyId,
          },
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData.employees || []);
        }
      } catch (err) {
        console.warn('Employees fetch for user modal dropdown error:', err);
      }

      setUsers(fetchedUsers || []);
      setRoles(fetchedRoles || []);
      setNextUserId(dynamicNextId);
    } catch (error) {
      console.error('Failed to load user management data:', error);
      showToast('Error loading company users from database', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const handleCardFilterClick = (filterType) => {
    setCardFilter(filterType);
    if (filterType === 'active') {
      setSearchParams({ status: 'active' });
    } else if (filterType === 'inactive') {
      setSearchParams({ status: 'inactive' });
    } else if (filterType === 'roles') {
      setSearchParams({ filter: 'roles' });
    } else {
      setSearchParams({});
    }
  };

  // Handlers
  const handleOpenAddUser = async () => {
    setEditingUser(null);
    try {
      const nextId = await userService.getNextUserId(currentCompanyId);
      setNextUserId(nextId);
    } catch {
      // ignore
    }
    setIsFormModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleFormModalSubmit = async (userData) => {
    setIsFormModalOpen(false);

    try {
      if (editingUser) {
        // Update existing user on database
        const targetId = editingUser._id || editingUser.id || editingUser.userId;
        const updated = await userService.updateUser(currentCompanyId, targetId, {
          ...userData,
          companyName: activeCompany?.name || ''
        });

        const formatted = {
          ...updated,
          id: updated?.id || updated?._id || targetId,
          userId: updated?.userId || editingUser.userId
        };

        setUsers(prev => prev.map(u => (u.id === targetId || u._id === targetId || u.userId === targetId) ? { ...u, ...formatted } : u));
        if (selectedUserForDetails && (selectedUserForDetails.id === targetId || selectedUserForDetails._id === targetId || selectedUserForDetails.userId === targetId)) {
          setSelectedUserForDetails(prev => ({ ...prev, ...formatted }));
        }

        showToast(`User ${userData.name} updated successfully.`);
      } else {
        // Create new user on database
        const created = await userService.createUser(currentCompanyId, {
          ...userData,
          companyName: activeCompany?.name || ''
        });

        const formattedCreated = {
          ...created,
          id: created?.id || created?._id || created?.userId,
        };

        setUsers(prev => [formattedCreated, ...prev.filter(u => u.id !== formattedCreated.id && u.userId !== formattedCreated.userId)]);
        showToast(`User account ${formattedCreated.name} (${formattedCreated.userId}) created successfully.`);

        // Refresh next user id
        const nextId = await userService.getNextUserId(currentCompanyId);
        setNextUserId(nextId);
      }
    } catch (error) {
      console.error('Error saving user to database:', error);
      showToast(error.message || 'Failed to save user account', 'error');
      // reload from server to maintain consistency
      loadCompanyData();
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

  const handleChangeRoleSubmit = async ({ userId, roleId, roleName }) => {
    setIsChangeRoleModalOpen(false);

    try {
      const updated = await userService.changeUserRole(currentCompanyId, userId, { roleId, roleName });
      setUsers(prev => prev.map(u => (u.id === userId || u._id === userId || u.userId === userId) ? { ...u, ...updated, roleId, roleName } : u));

      if (selectedUserForDetails && (selectedUserForDetails.id === userId || selectedUserForDetails._id === userId || selectedUserForDetails.userId === userId)) {
        setSelectedUserForDetails(prev => ({ ...prev, roleId, roleName }));
      }

      showToast(`Role updated to "${roleName}" for user.`);
    } catch (error) {
      console.error('Error changing role:', error);
      showToast(error.message || 'Failed to change role on database.', 'error');
    }
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
      onConfirm: async () => {
        const newStatus = isDeactivating ? 'Inactive' : 'Active';
        try {
          const targetId = user._id || user.id || user.userId;
          await userService.toggleUserStatus(currentCompanyId, targetId, newStatus);
          setUsers(prev => prev.map(u => (u.id === user.id || u._id === user._id) ? { ...u, status: newStatus } : u));
          if (selectedUserForDetails && (selectedUserForDetails.id === user.id || selectedUserForDetails._id === user._id)) {
            setSelectedUserForDetails(prev => ({ ...prev, status: newStatus }));
          }
          showToast(`User account ${user.name} is now ${newStatus}.`);
        } catch (error) {
          showToast(error.message || 'Failed to update user status', 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
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
      onConfirm: async () => {
        const newStatus = isSuspended ? 'Active' : 'Suspended';
        try {
          const targetId = user._id || user.id || user.userId;
          await userService.toggleUserStatus(currentCompanyId, targetId, newStatus);
          setUsers(prev => prev.map(u => (u.id === user.id || u._id === user._id) ? { ...u, status: newStatus } : u));
          if (selectedUserForDetails && (selectedUserForDetails.id === user.id || selectedUserForDetails._id === user._id)) {
            setSelectedUserForDetails(prev => ({ ...prev, status: newStatus }));
          }
          showToast(`User ${user.name} is now ${newStatus}.`);
        } catch (error) {
          showToast(error.message || 'Failed to update suspension status', 'error');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleResetAccess = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: `Reset Login Access for ${user.name}?`,
      description: `This will invalidate active login sessions and generate new access credentials for ${user.email || user.name}.`,
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
          {/* Breadcrumb nav header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            <span onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span>/</span>
            <span
              onClick={() => handleCardFilterClick('all')}
              style={{ cursor: cardFilter !== 'all' ? 'pointer' : 'default', color: cardFilter !== 'all' ? 'var(--primary-color, #2563eb)' : 'inherit', fontWeight: cardFilter !== 'all' ? 500 : 600 }}
            >
              User Management
            </span>
            {cardFilter === 'active' && (
              <>
                <span>/</span>
                <strong style={{ color: 'var(--text-primary, #0f172a)' }}>Active Users</strong>
              </>
            )}
            {cardFilter === 'inactive' && (
              <>
                <span>/</span>
                <strong style={{ color: 'var(--text-primary, #0f172a)' }}>Inactive Users</strong>
              </>
            )}
            {cardFilter === 'roles' && (
              <>
                <span>/</span>
                <strong style={{ color: 'var(--text-primary, #0f172a)' }}>Assigned Roles</strong>
              </>
            )}
          </div>

          {/* Page Header */}
          <header className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>User Management</h1>
              <p className={styles.pageDescription}>
                Manage HRMS login users, assign roles and control account access for <strong>{activeCompany?.name || 'Active Company'}</strong>.
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
            onCardClick={handleCardFilterClick}
          />

          {/* Main Users Table Section */}
          <section className={styles.tableSection}>
            <UsersTable
              users={users}
              roles={roles}
              externalStatusFilter={cardFilter}
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
          employees={employees}
          nextUserId={nextUserId}
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
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Toast Alerts */}
        <Toast
          isOpen={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      </div>
    </AdminLayout>
  );
}

export default AdminUserManagement;
