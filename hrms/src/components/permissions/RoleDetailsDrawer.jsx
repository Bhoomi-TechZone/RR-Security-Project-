import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Edit2,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import styles from './RoleDetailsDrawer.module.css';
import Avatar from '../common/Avatar';
import {
  PERMISSION_MODULES,
  countRolePermissions,
  getEnabledModulesCount,
  getActionCounts
} from '../../data/rolesPermissionsData';

function RoleDetailsDrawer({
  isOpen,
  role,
  users = [],
  onClose,
  onEditPermissions,
  onEditRoleInfo,
  onAssignUser,
  onChangeUserRole,
  onRemoveUserFromRole
}) {
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' | 'users'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !role) return null;

  const isSystem = role.type === 'system';
  const isActive = role.status === 'Active';
  const totalPerms = countRolePermissions(role);
  const enabledMods = getEnabledModulesCount(role);
  const actionCounts = getActionCounts(role);
  const assignedUsers = users.filter(u => u.roleId === role.id);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="drawer-role-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      
      <div className={styles.drawer}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.headerTop}>
            <div className={styles.badgesRow}>
              <span className={`${styles.typeBadge} ${isSystem ? styles.badgeSystem : styles.badgeCustom}`}>
                {isSystem ? 'System Role' : 'Custom Role'}
              </span>
              <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                {role.status}
              </span>
              {isSystem && (
                <span className={styles.protectedBadge}>
                  <Lock size={12} /> Protected
                </span>
              )}
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.roleIdentity}>
            <div className={`${styles.roleIcon} ${isSystem ? styles.systemIcon : styles.customIcon}`}>
              {isSystem ? <Shield size={24} /> : <KeyRound size={24} />}
            </div>
            <div>
              <h2 id="drawer-role-title" className={styles.roleTitle}>{role.name}</h2>
              <p className={styles.roleDesc}>{role.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className={styles.metricsBar}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Assigned Users</span>
              <strong className={styles.metricValue}>{assignedUsers.length}</strong>
            </div>
            <div className={styles.metricDivider} />
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Total Permissions</span>
              <strong className={styles.metricValue}>{totalPerms}</strong>
            </div>
            <div className={styles.metricDivider} />
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Enabled Modules</span>
              <strong className={styles.metricValue}>{enabledMods} / {PERMISSION_MODULES.length}</strong>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => {
                onClose();
                onEditPermissions(role);
              }}
            >
              <KeyRound size={15} />
              <span>Configure Permissions</span>
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => onAssignUser(role)}
            >
              <UserPlus size={15} />
              <span>Assign User</span>
            </button>

            {!isSystem && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => onEditRoleInfo(role)}
                title="Edit role title and description"
              >
                <Edit2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'permissions' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions Breakdown ({totalPerms})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Assigned Users ({assignedUsers.length})
          </button>
        </div>

        {/* Drawer Content */}
        <div className={styles.drawerBody}>
          {activeTab === 'permissions' && (
            <div className={styles.permissionsTabContent}>
              {/* Actions breakdown pills */}
              <div className={styles.actionPillsRow}>
                <span className={styles.pill}>View: <b>{actionCounts.view}</b></span>
                <span className={styles.pill}>Add: <b>{actionCounts.add}</b></span>
                <span className={styles.pill}>Edit: <b>{actionCounts.edit}</b></span>
                <span className={styles.pill}>Delete: <b>{actionCounts.delete}</b></span>
                <span className={styles.pill}>Approve: <b>{actionCounts.approve}</b></span>
                {actionCounts.other > 0 && (
                  <span className={styles.pill}>Special: <b>{actionCounts.other}</b></span>
                )}
              </div>

              {/* Module Cards List */}
              <div className={styles.modulesList}>
                {PERMISSION_MODULES.map((mod) => {
                  const assignedActions = role.permissions?.[mod.key] || [];
                  const isEnabled = assignedActions.length > 0;

                  return (
                    <div
                      key={mod.key}
                      className={`${styles.moduleCard} ${isEnabled ? styles.moduleCardActive : styles.moduleCardDisabled}`}
                    >
                      <div className={styles.moduleCardHeader}>
                        <div>
                          <span className={styles.moduleCategory}>{mod.category}</span>
                          <h4 className={styles.moduleName}>{mod.name}</h4>
                        </div>
                        <span className={`${styles.moduleStatusTag} ${isEnabled ? styles.tagEnabled : styles.tagDisabled}`}>
                          {isEnabled ? `${assignedActions.length} Actions` : 'No Access'}
                        </span>
                      </div>

                      <p className={styles.moduleDesc}>{mod.description}</p>

                      {isEnabled ? (
                        <div className={styles.actionsTagsList}>
                          {mod.actions.map(act => {
                            const hasAction = assignedActions.includes(act.key);
                            return (
                              <span
                                key={act.key}
                                className={`${styles.actionTag} ${hasAction ? styles.actionGranted : styles.actionDenied}`}
                              >
                                {hasAction ? <Check size={12} /> : <X size={12} />}
                                <span>{act.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={styles.noAccessText}>Access to this module is turned off for this role.</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className={styles.usersTabContent}>
              {assignedUsers.length === 0 ? (
                <div className={styles.emptyUsersState}>
                  <Users size={32} className={styles.emptyUsersIcon} />
                  <h4>No users assigned</h4>
                  <p>There are currently no users assigned to the "{role.name}" role.</p>
                  <button
                    type="button"
                    className={styles.btnAssignFirstUser}
                    onClick={() => onAssignUser(role)}
                  >
                    <UserPlus size={14} />
                    <span>Assign First User</span>
                  </button>
                </div>
              ) : (
                <div className={styles.usersList}>
                  {assignedUsers.map(user => (
                    <div key={user.id} className={styles.userCard}>
                      <div className={styles.userCardInfo}>
                        <Avatar
                          initials={user.initials}
                          name={user.name}
                          size="md"
                        />
                        <div>
                          <div className={styles.userNameRow}>
                            <strong className={styles.userName}>{user.name}</strong>
                            <span className={`${styles.userStatusBadge} ${user.status === 'Active' ? styles.userActive : styles.userInactive}`}>
                              {user.status}
                            </span>
                          </div>
                          <span className={styles.userEmail}>{user.email}</span>
                          <span className={styles.userMeta}>
                            {user.employeeId} • {user.company}
                          </span>
                        </div>
                      </div>

                      <div className={styles.userActions}>
                        <button
                          type="button"
                          className={styles.btnChangeRole}
                          onClick={() => onChangeUserRole(user)}
                        >
                          Change Role
                        </button>
                        <button
                          type="button"
                          className={styles.btnRemoveUser}
                          onClick={() => onRemoveUserFromRole(user)}
                          title="Unassign user from this role"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Metadata */}
        <div className={styles.drawerFooter}>
          <div className={styles.metadataText}>
            <span><Calendar size={13} /> Created: <b>{role.createdOn || '—'}</b></span>
            <span><Clock size={13} /> Updated: <b>{role.lastUpdated || role.createdOn || '—'}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleDetailsDrawer;
