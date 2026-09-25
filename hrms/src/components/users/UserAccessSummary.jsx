import React from 'react';
import {
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Check,
  X,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';
import styles from './UserAccessSummary.module.css';
import { PERMISSION_MODULES } from '../../data/rolesPermissionsData';

function UserAccessSummary({
  role,
  onManagePermissions,
  isCompact = false
}) {
  if (!role) {
    return (
      <div className={styles.noRoleBox}>
        <Lock size={16} />
        <span>No role assigned. This user has no module access.</span>
      </div>
    );
  }

  const permissions = role.permissions || {};
  const isSystem = role.type === 'system';

  // Group modules by category
  const categories = Array.from(new Set(PERMISSION_MODULES.map(m => m.category)));

  return (
    <div className={`${styles.container} ${isCompact ? styles.compact : ''}`}>
      {/* Header Banner */}
      <div className={styles.header}>
        <div className={styles.roleInfo}>
          <div className={`${styles.roleIconBadge} ${isSystem ? styles.systemIcon : styles.customIcon}`}>
            {isSystem ? <Shield size={16} /> : <KeyRound size={16} />}
          </div>
          <div>
            <div className={styles.roleTitleRow}>
              <strong className={styles.roleName}>{role.name}</strong>
              <span className={`${styles.typeBadge} ${isSystem ? styles.badgeSystem : styles.badgeCustom}`}>
                {isSystem ? 'System' : 'Custom'}
              </span>
            </div>
            <p className={styles.roleNotice}>
              User inherits these permissions directly from the <strong>{role.name}</strong> role.
            </p>
          </div>
        </div>

        {onManagePermissions && (
          <button
            type="button"
            className={styles.btnManagePermissions}
            onClick={() => onManagePermissions(role)}
            title="Configure permissions for this role in Role & Permissions"
          >
            <span>Manage Role Permissions</span>
            <ExternalLink size={13} />
          </button>
        )}
      </div>

      {/* Categorized Modules Breakdown */}
      <div className={styles.modulesGrid}>
        {categories.map(cat => {
          const catModules = PERMISSION_MODULES.filter(m => m.category === cat);

          return (
            <div key={cat} className={styles.categorySection}>
              <h4 className={styles.categoryTitle}>{cat}</h4>
              <div className={styles.moduleCardsList}>
                {catModules.map(mod => {
                  const grantedActionKeys = permissions[mod.key] || [];
                  const isEnabled = grantedActionKeys.length > 0;

                  return (
                    <div
                      key={mod.key}
                      className={`${styles.moduleCard} ${isEnabled ? styles.cardActive : styles.cardDisabled}`}
                    >
                      <div className={styles.moduleCardTop}>
                        <strong className={styles.moduleName}>{mod.name}</strong>
                        <span className={`${styles.statusPill} ${isEnabled ? styles.pillGranted : styles.pillDenied}`}>
                          {isEnabled ? `${grantedActionKeys.length} Actions` : 'No Access'}
                        </span>
                      </div>

                      {isEnabled ? (
                        <div className={styles.actionsList}>
                          {mod.actions.map(act => {
                            const isGranted = grantedActionKeys.includes(act.key);
                            return (
                              <span
                                key={act.key}
                                className={`${styles.actionTag} ${isGranted ? styles.tagGranted : styles.tagDenied}`}
                              >
                                {isGranted ? <Check size={11} strokeWidth={2.5} /> : <X size={11} />}
                                <span>{act.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className={styles.noAccessDesc}>Access disabled for this role</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UserAccessSummary;
