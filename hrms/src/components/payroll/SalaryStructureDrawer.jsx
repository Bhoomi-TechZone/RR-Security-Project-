import React, { useEffect } from 'react';
import { X, Edit3, ShieldCheck } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './SalaryStructureDrawer.module.css';

export default function SalaryStructureDrawer({
  record,
  onClose,
  onEdit
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const totalAllowances = (record.transportAllowance || 0) + (record.otherAllowance || 0);
  const fixedGross = (record.basicSalary || 0) + (record.hra || 0) + totalAllowances;
  const fixedDeductions = (record.pf || 0) + (record.esi || 0) + (record.otherDeduction || 0);
  const fixedNet = fixedGross - fixedDeductions;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} aria-label="Salary Structure Details">
        <div className={styles.header}>
          <div>
            <span className={styles.headerTag}>Salary Structure</span>
            <div className={styles.empHeaderRow}>
              <Avatar initials={record.initials} name={record.employeeName} size="md" />
              <div>
                <h2 className={styles.empName}>{record.employeeName}</h2>
                <span className={styles.empId}>{record.employeeId} • {record.designation}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Earnings Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Fixed Earnings Components</h3>
            <div className={styles.ledger}>
              <div className={styles.ledgerRow}>
                <span>Basic Salary</span>
                <strong>{formatRupee(record.basicSalary)}</strong>
              </div>
              <div className={styles.ledgerRow}>
                <span>HRA</span>
                <strong>{formatRupee(record.hra)}</strong>
              </div>
              <div className={styles.ledgerRow}>
                <span>Transport Allowance</span>
                <strong>{formatRupee(record.transportAllowance)}</strong>
              </div>
              <div className={styles.ledgerRow}>
                <span>Other Allowance</span>
                <strong>{formatRupee(record.otherAllowance)}</strong>
              </div>
              <div className={`${styles.ledgerRow} ${styles.grossRow}`}>
                <strong>Gross Salary (Base)</strong>
                <strong className={styles.grossText}>{formatRupee(fixedGross)}</strong>
              </div>
            </div>
          </section>

          {/* Deductions Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Standard Deductions</h3>
            <div className={styles.ledger}>
              <div className={styles.ledgerRow}>
                <span>PF (Provident Fund)</span>
                <span className={styles.deductText}>-{formatRupee(record.pf)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>ESI (State Insurance)</span>
                <span className={styles.deductText}>-{formatRupee(record.esi)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>Other Regular Deductions</span>
                <span className={styles.deductText}>-{formatRupee(record.otherDeduction)}</span>
              </div>
              <div className={`${styles.ledgerRow} ${styles.grossRow}`}>
                <strong>Total Standard Deductions</strong>
                <strong className={styles.deductText}>-{formatRupee(fixedDeductions)}</strong>
              </div>
            </div>
          </section>

          {/* Net Highlight */}
          <div className={styles.netBox}>
            <div className={styles.netRow}>
              <div>
                <span className={styles.netTitle}>Monthly Base Take-Home</span>
                <small className={styles.netSub}>Excludes variable attendance/OT</small>
              </div>
              <strong className={styles.netValue}>{formatRupee(fixedNet)}</strong>
            </div>
          </div>

          <div className={styles.complianceNote}>
            <ShieldCheck size={18} className={styles.compIcon} />
            <p>
              Statutory PF and ESI rates follow standard labour law contribution standards.
              Attendance and overtime adjustments are calculated during active payroll runs.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => {
              onClose();
              onEdit(record);
            }}
          >
            <Edit3 size={16} />
            <span>Edit Salary Structure</span>
          </button>
        </div>
      </aside>
    </>
  );
}
