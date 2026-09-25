import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Shield,
  ArrowRight,
  AlertTriangle,
  Check,
  Building2,
  Lock,
  Layers
} from 'lucide-react';
import styles from './ChangeRoleModal.module.css';
import Avatar from '../common/Avatar';
import { getRolePermissionsOverview } from '../../data/adminUsersData';

function ChangeRoleModal({
  isOpen,
  user,
  roles = [],
  onClose,
  onSubmit
}) {
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      // Default to user's current role or first available role
      setSelectedRoleId(user.roleId || (roles[0]?.id || ''));
    }
  }, [isOpen, user, roles]);

  if (!isOpen || !user) return null;

  const currentRole = roles.find(r => r.id === user.roleId || r.name === user.roleName);
  const newRole = roles.find(r => r.id === selectedRoleId);

  const currentPermsOverview = currentRole ? getRolePermissionsOverview(currentRole) : [];
  const newPermsOverview = newRole ? getRolePermissionsOverview(newRole) : [];

  const currentEnabled = currentPermsOverview.filter(m => m.isEnabled);
  const newEnabled = newPermsOverview.filter(m => m.isEnabled);

  const isSameRole = currentRole?.id === newRole?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newRole) return;

    onSubmit({
      userId: user.id,
      roleId: newRole.id,
      roleName: newRole.name
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="change-role-title">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              <KeyRound size={20} />
            </div>
            <div>
              <h2 id="change-role-title" className={styles.modalTitle}>Change User Role</h2>
              <p className={styles.modalSubtitle}>Reassign HRMS access permissions for {user.name}</p>
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
          {/* User Info Card */}
          <div className={styles.userCard}>
            <Avatar initials={user.initials} name={user.name} size="md" />
            <div className={styles.userInfo}>
              <strong className={styles.userName}>{user.name}</strong>
              <span className={styles.userEmail}>{user.email}</span>
              <span className={styles.userMeta}>{user.userId} • {user.companyName}</span>
            </div>
          </div>

          {/* Role Selection Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="new-role-select" className={styles.label}>
              Select New Assigned Role
            </label>
            <select
              id="new-role-select"
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

          {/* Permissions Comparison Preview */}
          <div className={styles.comparisonBox}>
            <div className={styles.comparisonColumn}>
              <span className={styles.columnLabel}>Current Role: <b>{currentRole?.name || 'None'}</b></span>
              <div className={styles.modulesBadgeList}>
                {currentEnabled.slice(0, 4).map(m => (
                  <span key={m.moduleKey} className={styles.moduleTagCurrent}>
                    {m.moduleName}
                  </span>
                ))}
                {currentEnabled.length > 4 && (
                  <span className={styles.moreTag}>+{currentEnabled.length - 4} more</span>
                )}
              </div>
            </div>

            <div className={styles.comparisonArrow}>
              <ArrowRight size={18} />
            </div>

            <div className={styles.comparisonColumn}>
              <span className={styles.columnLabel}>New Role: <b>{newRole?.name || 'Selected Role'}</b></span>
              <div className={styles.modulesBadgeList}>
                {newEnabled.slice(0, 4).map(m => (
                  <span key={m.moduleKey} className={styles.moduleTagNew}>
                    {m.moduleName}
                  </span>
                ))}
                {newEnabled.length > 4 && (
                  <span className={styles.moreTag}>+{newEnabled.length - 4} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Impact Warning */}
          <div className={styles.warningNote}>
            <AlertTriangle size={15} className={styles.warningIcon} />
            <span>
              Updating this role will modify <strong>{user.name}</strong>'s access permissions to match the <strong>{newRole?.name}</strong> permission set.
            </span>
          </div>

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
              disabled={isSameRole}
            >
              <Check size={16} />
              <span>Confirm Role Change</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangeRoleModal;
