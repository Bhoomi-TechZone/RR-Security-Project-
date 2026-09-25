import React from 'react';
import { X, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './ApprovePayrollModal.module.css';

export default function ApprovePayrollModal({
  isOpen,
  record,
  onClose,
  onConfirm
}) {
  if (!isOpen || !record) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <CheckCircle size={22} className={styles.checkIcon} />
            <h2>Approve Payroll?</h2>
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

        <div className={styles.body}>
          <p className={styles.message}>
            Are you sure you want to approve <strong>{record.employeeName}</strong>&apos;s payroll for August 2026?
          </p>

          <div className={styles.detailsCard}>
            <div className={styles.detailRow}>
              <span>Employee ID</span>
              <strong>{record.employeeId}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Client</span>
              <span>{record.clientName}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Days Worked</span>
              <span>{record.presentDays} / {record.workingDays}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Gross Salary</span>
              <span>{formatRupee(record.grossSalary)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Total Deductions</span>
              <span className={styles.textRed}>-{formatRupee(record.totalDeductions)}</span>
            </div>
            <div className={`${styles.detailRow} ${styles.netRow}`}>
              <strong>Net Disbursement</strong>
              <strong className={styles.netAmount}>{formatRupee(record.netSalary)}</strong>
            </div>
          </div>

          <div className={styles.notice}>
            <ShieldAlert size={16} />
            <span>Approved payroll will be ready for final disbursement and salary slip generation.</span>
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
            type="button"
            className={styles.approveBtn}
            onClick={() => onConfirm(record)}
          >
            Approve Payroll
          </button>
        </div>
      </div>
    </div>
  );
}
