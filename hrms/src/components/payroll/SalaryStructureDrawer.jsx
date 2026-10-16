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

  const basic = record.basicSalary ?? record.basic ?? record.earnings?.basic ?? 0;
  const hra = record.hra ?? record.earnings?.hra ?? 0;
  const vda = record.vda ?? record.earnings?.vda ?? 0;
  const transportAllowance = record.transportAllowance ?? record.conveyance ?? record.earnings?.conveyance ?? 0;
  const specialAllowance = record.specialAllowance ?? record.earnings?.specialAllowance ?? 0;
  const otherAllowance = record.otherAllowance ?? record.earnings?.otherAllowance ?? 0;
  const totalAllowances = hra + vda + transportAllowance + specialAllowance + otherAllowance;
  const fixedGross = record.grossSalary ?? record.earnings?.totalGross ?? (basic + totalAllowances);
  const pf = record.pf ?? record.deductions?.pfEmployee ?? 0;
  const esi = record.esi ?? record.deductions?.esiEmployee ?? 0;
  const otherDeduction = record.otherDeduction ?? record.deductions?.otherDeductions ?? ((record.deductions?.pt || 0) + (record.deductions?.tds || 0));
  const fixedDeductions = record.totalDeductions ?? record.deductions?.totalDeductions ?? (pf + esi + otherDeduction);
  const fixedNet = record.netSalary ?? Math.max(0, fixedGross - fixedDeductions);

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
                <strong>{formatRupee(basic)}</strong>
              </div>
              <div className={styles.ledgerRow}>
                <span>HRA</span>
                <strong>{formatRupee(hra)}</strong>
              </div>
              {vda > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Variable DA (VDA)</span>
                  <strong>{formatRupee(vda)}</strong>
                </div>
              )}
              <div className={styles.ledgerRow}>
                <span>Transport / Conveyance</span>
                <strong>{formatRupee(transportAllowance)}</strong>
              </div>
              {specialAllowance > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Special Allowance</span>
                  <strong>{formatRupee(specialAllowance)}</strong>
                </div>
              )}
              <div className={styles.ledgerRow}>
                <span>Other Allowance</span>
                <strong>{formatRupee(otherAllowance)}</strong>
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
                <span className={styles.deductText}>-{formatRupee(pf)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>ESI (State Insurance)</span>
                <span className={styles.deductText}>-{formatRupee(esi)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>Other Regular Deductions</span>
                <span className={styles.deductText}>-{formatRupee(otherDeduction)}</span>
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
