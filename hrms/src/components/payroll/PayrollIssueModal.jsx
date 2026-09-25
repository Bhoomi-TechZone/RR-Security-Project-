import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, FileCheck } from 'lucide-react';
import styles from './PayrollIssueModal.module.css';

export default function PayrollIssueModal({
  isOpen,
  record,
  onClose,
  onResolve
}) {
  const [resolutionAction, setResolutionAction] = useState('override');
  const [notes, setNotes] = useState('');

  if (!isOpen || !record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onResolve(record, { resolutionAction, notes });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <h2>Resolve Payroll Issue</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close issue modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            <div className={styles.empBox}>
              <strong>{record.employeeName}</strong>
              <span>{record.employeeId} • {record.clientName} • {record.department}</span>
            </div>

            <div className={styles.issueAlert}>
              <span className={styles.issueLabel}>Identified Block / Discrepancy:</span>
              <p className={styles.issueReason}>{record.holdReason || 'Discrepancy detected during validation.'}</p>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Resolution Action</label>
              <select
                className={styles.select}
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
              >
                <option value="override">Accept supervisor correction &amp; recalculate salary</option>
                <option value="recalculate">Apply standard monthly roster defaults</option>
                <option value="verify">Mark verified with employee consent</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Resolution Remarks / Audit Note</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Enter audit remarks for HR compliance ledger..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.resolveBtn}
            >
              <CheckCircle2 size={16} />
              <span>Resolve &amp; Calculate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
