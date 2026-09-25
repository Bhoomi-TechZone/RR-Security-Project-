import React from 'react';
import styles from '../../pages/admin/Reimbursements.module.css';

export default function ReimbursementPayrollSection({ claim }) {
  if (!claim) return null;

  return (
    <div className={styles.infoGrid}>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Pay with Salary</span>
        <span className={styles.infoVal}>
          {claim.payrollIncluded ? 'Yes (Combined Payout)' : 'No (Direct / Separate Payout)'}
        </span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Payroll Month</span>
        <span className={styles.infoVal}>{claim.payrollMonth || 'N/A'}</span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Reimbursement Salary Head</span>
        <span className={styles.infoVal}>{claim.reimbursementHead || 'Conveyance Reimbursement'}</span>
      </div>
      <div className={styles.infoItem}>
        <span className={styles.infoLabel}>Taxable Component</span>
        <span className={styles.infoVal}>
          {claim.taxable ? 'Yes (Tax Deductible)' : 'No (Tax Exempt Reimbursement)'}
        </span>
      </div>
    </div>
  );
}
