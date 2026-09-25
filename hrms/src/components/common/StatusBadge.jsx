import React from 'react';
import styles from './StatusBadge.module.css';

/**
 * StatusBadge Component
 * Displays a colorful status label with customizable styles.
 */
function StatusBadge({ status, children }) {
  const rawStatus = status || children || '';
  const normalizedStatus = rawStatus.toLowerCase().replace(/\s+/g, '');

  let statusClass = styles.pending;

  if (['approved', 'success', 'active', 'present'].includes(normalizedStatus)) {
    statusClass = styles.approved;
  } else if (['rejected', 'danger', 'error', 'inactive', 'absent'].includes(normalizedStatus)) {
    statusClass = styles.rejected;
  } else if (normalizedStatus === 'halfday' || normalizedStatus === 'half day') {
    statusClass = styles.halfDay;
  } else if (normalizedStatus === 'leave') {
    statusClass = styles.leave;
  } else if (normalizedStatus === 'late') {
    statusClass = styles.late;
  } else if (normalizedStatus === 'earlyout' || normalizedStatus === 'early out') {
    statusClass = styles.earlyOut;
  } else if (normalizedStatus === 'pendingcorrection' || normalizedStatus === 'pending correction') {
    statusClass = styles.pendingCorrection;
  }

  return (
    <span className={`${styles.badge} ${statusClass}`}>
      {children || status}
    </span>
  );
}

export default StatusBadge;
