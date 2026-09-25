import React from 'react';
import { Shield, CheckCircle2, Layers, KeyRound, Eye, Plus, Edit3, Trash2, CheckSquare } from 'lucide-react';
import styles from './PermissionSummary.module.css';
import { PERMISSION_MODULES, getActionCounts } from '../../data/rolesPermissionsData';

function PermissionSummary({ role, permissions = {} }) {
  const tempRole = { ...role, permissions };
  const actionCounts = getActionCounts(tempRole);
  const totalModules = PERMISSION_MODULES.length;
  const enabledModules = Object.values(permissions).filter(actions => Array.isArray(actions) && actions.length > 0).length;
  const totalPossiblePerms = PERMISSION_MODULES.reduce((sum, mod) => sum + mod.actions.length, 0);
  const percentage = Math.round((actionCounts.total / totalPossiblePerms) * 100) || 0;

  return (
    <div className={styles.summaryCard}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <KeyRound size={16} className={styles.headerIcon} />
          <span>Permission Summary</span>
        </div>
        <span className={styles.coverageBadge}>
          {percentage}% Coverage
        </span>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Enabled Modules</span>
          <div className={styles.statValueRow}>
            <strong className={styles.statValue}>{enabledModules}</strong>
            <span className={styles.statTotal}>/ {totalModules}</span>
          </div>
        </div>

        <div className={styles.statBox}>
          <span className={styles.statLabel}>Total Granted</span>
          <div className={styles.statValueRow}>
            <strong className={styles.statValue}>{actionCounts.total}</strong>
            <span className={styles.statTotal}>/ {totalPossiblePerms}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      {/* Action Breakdown Grid */}
      <div className={styles.breakdownGrid}>
        <div className={styles.actionItem}>
          <span className={`${styles.actionDot} ${styles.dotView}`} />
          <span className={styles.actionName}>View</span>
          <b className={styles.actionCount}>{actionCounts.view}</b>
        </div>

        <div className={styles.actionItem}>
          <span className={`${styles.actionDot} ${styles.dotAdd}`} />
          <span className={styles.actionName}>Add / Create</span>
          <b className={styles.actionCount}>{actionCounts.add}</b>
        </div>

        <div className={styles.actionItem}>
          <span className={`${styles.actionDot} ${styles.dotEdit}`} />
          <span className={styles.actionName}>Edit / Update</span>
          <b className={styles.actionCount}>{actionCounts.edit}</b>
        </div>

        <div className={styles.actionItem}>
          <span className={`${styles.actionDot} ${styles.dotDelete}`} />
          <span className={styles.actionName}>Delete</span>
          <b className={styles.actionCount}>{actionCounts.delete}</b>
        </div>

        <div className={styles.actionItem}>
          <span className={`${styles.actionDot} ${styles.dotApprove}`} />
          <span className={styles.actionName}>Approve</span>
          <b className={styles.actionCount}>{actionCounts.approve}</b>
        </div>

        {actionCounts.other > 0 && (
          <div className={styles.actionItem}>
            <span className={`${styles.actionDot} ${styles.dotOther}`} />
            <span className={styles.actionName}>Special Actions</span>
            <b className={styles.actionCount}>{actionCounts.other}</b>
          </div>
        )}
      </div>
    </div>
  );
}

export default PermissionSummary;
