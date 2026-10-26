import React from 'react';
import styles from './StatusBadge.module.css';

/**
 * StatusBadge Component
 * Displays a colorful status label with customizable styles.
 */
function StatusBadge({ status, children }) {
  const rawStatus = status || children || '';
  const normalizedStatus = String(rawStatus).toLowerCase().replace(/[\s_-]+/g, '');

  let statusClass = styles.pending;

  if (['approved', 'success', 'active', 'present'].includes(normalizedStatus)) {
    statusClass = styles.approved;
  } else if (['rejected', 'danger', 'error', 'inactive', 'absent'].includes(normalizedStatus)) {
    statusClass = styles.rejected;
  } else if (normalizedStatus === 'halfday') {
    statusClass = styles.halfDay;
  } else if (['leave', 'onleave'].includes(normalizedStatus)) {
    statusClass = styles.leave;
  } else if (normalizedStatus === 'late') {
    statusClass = styles.late;
  } else if (normalizedStatus === 'earlyout') {
    statusClass = styles.earlyOut;
  } else if (normalizedStatus === 'pendingcorrection') {
    statusClass = styles.pendingCorrection;
  } else if (['weekoff', 'wo'].includes(normalizedStatus)) {
    statusClass = styles.weekOff;
  } else if (['holiday', 'h', 'publicholiday'].includes(normalizedStatus)) {
    statusClass = styles.holiday;
  }

  return (
    <span className={`${styles.badge} ${statusClass}`}>
      {children || status}
    </span>
  );
}

export default StatusBadge;
