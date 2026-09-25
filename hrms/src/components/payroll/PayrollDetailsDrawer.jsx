import React, { useEffect } from 'react';
import { X, Info, Calculator, CheckCircle2, FileText, AlertTriangle, Download, Clock } from 'lucide-react';
import Avatar from '../common/Avatar';
import { formatRupee } from '../../utils/payrollUtils';
import styles from './PayrollDetailsDrawer.module.css';

export default function PayrollDetailsDrawer({
  record,
  onClose,
  onCalculateSalary,
  onApprovePayroll,
  onViewSlip,
  onDownloadSlip,
  onResolveIssue,
  isCalculating = false
}) {
  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const monthLabel = record.payrollMonth === '2026-08' ? 'August 2026' : record.payrollMonth || 'August 2026';

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Drawer Panel */}
      <aside className={styles.drawer} aria-label="Payroll Details Drawer">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.headerTag}>Payroll Details</span>
            <div className={styles.empHeaderRow}>
              <Avatar initials={record.initials} name={record.employeeName} size="md" />
              <div>
                <h2 className={styles.empName}>{record.employeeName}</h2>
                <div className={styles.empSub}>
                  <span className={styles.empId}>{record.employeeId}</span>
                  <span>•</span>
                  <span>{record.designation}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.monthBadge}>{monthLabel}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className={styles.body}>
          {/* On hold reason alert if applicable */}
          {(record.status === 'on_hold' || record.status === 'on hold') && record.holdReason && (
            <div className={styles.alertHold}>
              <AlertTriangle size={18} className={styles.alertIcon} />
              <div className={styles.alertContent}>
                <strong>Payroll On Hold</strong>
                <p>{record.holdReason}</p>
              </div>
            </div>
          )}

          {/* Section 1: Attendance Summary */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Attendance Summary</h3>
              <span className={styles.sectionSub}>Month of {monthLabel}</span>
            </div>
            <div className={styles.attGrid}>
              <div className={styles.attCard}>
                <span className={styles.attLabel}>Working Days</span>
                <strong className={styles.attValue}>{record.workingDays || 31}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attPresent}`}>
                <span className={styles.attLabel}>Present</span>
                <strong className={styles.attValue}>{record.presentDays || 26}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attAbsent}`}>
                <span className={styles.attLabel}>Absent</span>
                <strong className={styles.attValue}>{record.absentDays || 2}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attLeave}`}>
                <span className={styles.attLabel}>Leave</span>
                <strong className={styles.attValue}>{record.leaveDays || 3}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attPaid}`}>
                <span className={styles.attLabel}>Paid Days</span>
                <strong className={styles.attValue}>{record.paidDays || 29}</strong>
              </div>
            </div>
          </section>

          {/* Section 2: Overtime Summary */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Overtime</h3>
              <span className={styles.sectionSub}>Approved OT Hours</span>
            </div>
            <div className={styles.otGrid}>
              <div className={styles.otCard}>
                <div className={styles.otCardLeft}>
                  <Clock size={16} className={styles.otIcon} />
                  <span>Overtime Hours</span>
                </div>
                <strong>{record.overtimeHours || 0} hrs</strong>
              </div>
              <div className={styles.otCard}>
                <div className={styles.otCardLeft}>
                  <span>Overtime Amount</span>
                </div>
                <strong className={styles.otAmountText}>{formatRupee(record.overtimeAmount)}</strong>
              </div>
            </div>
          </section>

          {/* Section 3: Earnings Breakdown */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Earnings</h3>
              <span className={styles.sectionSub}>Salary Components</span>
            </div>
            <div className={styles.ledger}>
              <div className={styles.ledgerRow}>
                <span>Basic Salary</span>
                <span>{formatRupee(record.basicSalary)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>HRA</span>
                <span>{formatRupee(record.hra)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>Transport Allowance</span>
                <span>{formatRupee(record.transportAllowance)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>Other Allowance</span>
                <span>{formatRupee(record.otherAllowance)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>Overtime</span>
                <span>{formatRupee(record.overtimeAmount)}</span>
              </div>
              <div className={`${styles.ledgerRow} ${styles.ledgerTotalRow}`}>
                <strong>Gross Salary</strong>
                <strong className={styles.grossText}>{formatRupee(record.grossSalary)}</strong>
              </div>
            </div>
          </section>

          {/* Section 4: Deductions Breakdown */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Deductions</h3>
              <span className={styles.sectionSub}>Statutory &amp; Adjustments</span>
            </div>
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
                <span>Advance Adjustment</span>
                <span className={styles.deductText}>-{formatRupee(record.advanceAdjustment)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>Other Deduction</span>
                <span className={styles.deductText}>-{formatRupee(record.otherDeduction)}</span>
              </div>
              <div className={`${styles.ledgerRow} ${styles.ledgerTotalRow}`}>
                <strong>Total Deductions</strong>
                <strong className={styles.deductTotalText}>-{formatRupee(record.totalDeductions)}</strong>
              </div>
            </div>
          </section>

          {/* Section 5: Net Salary Summary Box */}
          <div className={styles.netSummaryBox}>
            <div className={styles.netSummaryRow}>
              <span>Gross Salary</span>
              <strong>{formatRupee(record.grossSalary)}</strong>
            </div>
            <div className={styles.netSummaryRow}>
              <span>Total Deductions</span>
              <strong className={styles.deductText}>-{formatRupee(record.totalDeductions)}</strong>
            </div>
            <div className={`${styles.netSummaryRow} ${styles.netHighlightRow}`}>
              <div>
                <span className={styles.netLabel}>Net Take-Home Pay</span>
                <small className={styles.netSub}>Direct Bank Disbursement</small>
              </div>
              <strong className={styles.netValue}>{formatRupee(record.netSalary)}</strong>
            </div>
          </div>

          {/* Section 6: Info note */}
          <div className={styles.infoBox}>
            <Info size={18} className={styles.infoIcon} />
            <p>
              Salary calculation is based on attendance, overtime, advances and applicable deductions.
              Actual payroll calculations will be handled by the backend payroll engine.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className={styles.footer}>
          {record.status === 'pending' && (
            <button
              type="button"
              className={styles.btnCalculate}
              onClick={() => onCalculateSalary(record)}
              disabled={isCalculating}
            >
              <Calculator size={16} />
              <span>{isCalculating ? 'Calculating salary...' : 'Calculate Salary'}</span>
            </button>
          )}

          {record.status === 'calculated' && (
            <button
              type="button"
              className={styles.btnApprove}
              onClick={() => onApprovePayroll(record)}
            >
              <CheckCircle2 size={16} />
              <span>Approve Payroll</span>
            </button>
          )}

          {record.status === 'processed' && (
            <div className={styles.processedActions}>
              <button
                type="button"
                className={styles.btnOutline}
                onClick={() => onDownloadSlip(record)}
              >
                <Download size={16} />
                <span>Download Slip</span>
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => onViewSlip(record)}
              >
                <FileText size={16} />
                <span>View Slip</span>
              </button>
            </div>
          )}

          {(record.status === 'on_hold' || record.status === 'on hold') && (
            <button
              type="button"
              className={styles.btnWarning}
              onClick={() => onResolveIssue(record)}
            >
              <AlertTriangle size={16} />
              <span>Resolve Issue</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
