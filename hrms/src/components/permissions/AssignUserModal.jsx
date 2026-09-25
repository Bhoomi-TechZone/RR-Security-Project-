import React, { useState, useEffect } from 'react';
import { X, UserPlus, KeyRound, AlertCircle, Check, Users, Building2, ShieldAlert } from 'lucide-react';
import styles from './AssignUserModal.module.css';
import Avatar from '../common/Avatar';

function AssignUserModal({
  isOpen,
  onClose,
  onSubmit,
  roles = [],
  user = null, // if provided, we are in 'Change Role' mode for this specific user
  defaultRoleId = '',
  mockDirectoryUsers = []
}) {
  const isChangeRoleMode = Boolean(user);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(defaultRoleId || '');
  const [userStatus, setUserStatus] = useState('Active');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setSelectedUserId(user.id);
        setSelectedRoleId(user.roleId || '');
        setUserStatus(user.status || 'Active');
      } else {
        setSelectedUserId(mockDirectoryUsers[0]?.id || '');
        setSelectedRoleId(defaultRoleId || roles[0]?.id || '');
        setUserStatus('Active');
      }
      setError(null);
    }
  }, [isOpen, user, defaultRoleId, roles, mockDirectoryUsers]);

  if (!isOpen) return null;

  const selectedRoleObj = roles.find(r => r.id === selectedRoleId);
  const isSelectedRoleInactive = selectedRoleObj?.status === 'Inactive';

  const selectedDirectoryUser = isChangeRoleMode 
    ? user 
    : mockDirectoryUsers.find(u => u.id === selectedUserId);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedRoleId) {
      setError('Please select a valid role to assign.');
      return;
    }

    if (!isChangeRoleMode && !selectedUserId) {
      setError('Please select a user from the directory.');
      return;
    }

    onSubmit({
      userId: isChangeRoleMode ? user.id : selectedUserId,
      roleId: selectedRoleId,
      status: userStatus,
      userObject: selectedDirectoryUser
    });
  };

  const title = isChangeRoleMode ? 'Change User Role' : 'Assign Role to User';
  const subtitle = isChangeRoleMode 
    ? `Update role permissions for ${user?.name}`
    : 'Grant role-based module permissions to an employee';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="assign-user-title">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              {isChangeRoleMode ? <KeyRound size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 id="assign-user-title" className={styles.modalTitle}>{title}</h2>
              <p className={styles.modalSubtitle}>{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* User Selector or User Info Card */}
          {isChangeRoleMode ? (
            <div className={styles.selectedUserCard}>
              <Avatar initials={user.initials} name={user.name} size="md" />
              <div className={styles.selectedUserInfo}>
                <strong className={styles.selectedUserName}>{user.name}</strong>
                <span className={styles.selectedUserEmail}>{user.email}</span>
                <span className={styles.selectedUserMeta}>
                  {user.employeeId} • {user.company}
                </span>
                <div className={styles.currentRoleTag}>
                  Current Role: <b>{user.roleName}</b>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.fieldGroup}>
              <label htmlFor="select-user" className={styles.label}>
                Select Employee / User <span className={styles.required}>*</span>
              </label>
              <select
                id="select-user"
                className={styles.select}
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {mockDirectoryUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employeeId}) — {u.company} [{u.designation || 'Staff'}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role Selector */}
          <div className={styles.fieldGroup}>
            <label htmlFor="select-role" className={styles.label}>
              Select Role to Assign <span className={styles.required}>*</span>
            </label>
            <select
              id="select-role"
              className={styles.select}
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type === 'system' ? 'System Role' : 'Custom Role'}) — {r.status}
                </option>
              ))}
            </select>
          </div>

          {/* Inactive Role Warning */}
          {isSelectedRoleInactive && (
            <div className={styles.warningBox}>
              <ShieldAlert size={16} className={styles.warningIcon} />
              <div>
                <strong>Notice:</strong> This role is currently marked as <b>Inactive</b>. Users assigned to an inactive role cannot access protected modules until the role is activated.
              </div>
            </div>
          )}

          {/* User Status */}
          <div className={styles.fieldGroup}>
            <label htmlFor="user-status" className={styles.label}>
              User Account Status
            </label>
            <select
              id="user-status"
              className={styles.select}
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value)}
            >
              <option value="Active">Active (Granted system access)</option>
              <option value="Inactive">Inactive (Suspended)</option>
            </select>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
            >
              <Check size={16} />
              <span>{isChangeRoleMode ? 'Update Role Assignment' : 'Assign Role'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignUserModal;
