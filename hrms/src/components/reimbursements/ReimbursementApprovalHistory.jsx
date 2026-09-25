import React from 'react';
import styles from '../../pages/admin/Reimbursements.module.css';

export default function ReimbursementApprovalHistory({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>
        No approval actions logged yet.
      </div>
    );
  }

  return (
    <div className={styles.historyTimeline}>
      {history.map((step, idx) => (
        <div key={idx} className={styles.historyEntry}>
          <div className={styles.historyTop}>
            <span className={styles.historyAction}>
              {step.action} by {step.person} ({step.role})
            </span>
            <span className={styles.historyDate}>{step.date} • {step.time}</span>
          </div>
          {step.comment && (
            <div className={styles.historyComment}>{step.comment}</div>
          )}
        </div>
      ))}
    </div>
  );
}
