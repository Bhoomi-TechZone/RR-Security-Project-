import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  Clock,
  Calendar,
  Edit2,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import styles from './UserDetailsDrawer.module.css';
import Avatar from '../common/Avatar';
import UserAccessSummary from './UserAccessSummary';

function UserDetailsDrawer({
  isOpen,
  user,
  roles = [],
  onClose,
  onEditUser,
  onChangeRole,
  onToggleStatus,
  onManagePermissions
}) {
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const roleObj = roles.find(r => r.id === user.roleId || r.name === user.roleName);
  const isSystemRole = roleObj?.type === 'system';
  const isActive = user.status === 'Active';
  const isSuspended = user.status === 'Suspended';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="drawer-user-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div className={styles.drawer}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.headerTop}>
            <div className={styles.badgesRow}>
              <span className={`${styles.statusBadge} ${
                isActive ? styles.statusActive : isSuspended ? styles.statusSuspended : styles.statusInactive
              }`}>
                {user.status}
              </span>
              <span className={styles.idBadge}>{user.userId}</span>
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close drawer">
              <X size={18} />
            </button>
          </div>

          {/* User Identity Banner */}
          <div className={styles.userIdentity}>
            <Avatar initials={user.initials} name={user.name} size="lg" />
            <div className={styles.userIdentityText}>
              <h2 id="drawer-user-title" className={styles.userName}>{user.name}</h2>
              <span className={styles.userUsername}>@{user.username || user.userId.toLowerCase()}</span>
              <div className={styles.roleTagRow}>
                <span className={`${styles.roleTag} ${isSystemRole ? styles.badgeSystemRole : styles.badgeCustomRole}`}>
                  {isSystemRole ? <Shield size={12} /> : <KeyRound size={12} />}
                  <span>{user.roleName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => { onClose(); onEditUser(user); }}
            >
              <Edit2 size={14} />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => { onClose(); onChangeRole(user); }}
            >
              <KeyRound size={14} />
              <span>Change Role</span>
            </button>

            <button
              type="button"
              className={`${styles.btnSecondary} ${isActive ? styles.btnMuted : styles.btnSuccess}`}
              onClick={() => onToggleStatus(user)}
              title={isActive ? 'Deactivate account' : 'Activate account'}
            >
              {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            User Details
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'access' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('access')}
          >
            Access & Permissions
          </button>
        </div>

        {/* Drawer Body */}
        <div className={styles.drawerBody}>
          {activeTab === 'profile' && (
            <div className={styles.profileTabContent}>
              <div className={styles.infoCard}>
                <h4 className={styles.infoCardTitle}>Account Information</h4>
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Full Name</span>
                    <strong className={styles.detailValue}>{user.name}</strong>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>User ID</span>
                    <span className={styles.detailCode}>{user.userId}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Username</span>
                    <span className={styles.detailValue}>@{user.username || user.userId.toLowerCase()}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email Address</span>
                    <a href={`mailto:${user.email}`} className={styles.detailLink}>{user.email}</a>
                  </div>
                  {user.mobile && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Mobile Number</span>
                      <span className={styles.detailValue}>{user.mobile}</span>
                    </div>
                  )}
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Assigned Role</span>
                    <span className={styles.detailValue}>
                      <strong>{user.roleName}</strong> ({isSystemRole ? 'System Role' : 'Custom Role'})
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Account Status</span>
                    <span className={`${styles.statusBadgeSmall} ${
                      isActive ? styles.statusActive : isSuspended ? styles.statusSuspended : styles.statusInactive
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h4 className={styles.infoCardTitle}>Activity History</h4>
                <div className={styles.detailsList}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Account Created</span>
                    <span className={styles.detailValue}>{user.createdOn || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Last Login Session</span>
                    <span className={styles.detailValue}>{user.lastLogin || 'Never logged in'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Authentication Method</span>
                    <span className={styles.detailValue}>Role-Based Session Credentials</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className={styles.accessTabContent}>
              <UserAccessSummary
                role={roleObj}
                onManagePermissions={(r) => {
                  onClose();
                  onManagePermissions(r);
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <div className={styles.metadataText}>
            <span><Calendar size={13} /> Created: <b>{user.createdOn || '—'}</b></span>
            <span><Clock size={13} /> Last Activity: <b>{user.lastLogin || '—'}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailsDrawer;
