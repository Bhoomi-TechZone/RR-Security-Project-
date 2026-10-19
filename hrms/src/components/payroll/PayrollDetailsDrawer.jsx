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

  const monthLabel = record.monthLabel || record.payrollMonth || 'Current Month';

  // Earnings Resolution
  const earnings = record.earnings || {};
  const basic = earnings.basic ?? record.basicSalary ?? record.basic ?? 0;
  const vda = earnings.vda ?? record.vda ?? 0;
  const hra = earnings.hra ?? record.hra ?? 0;
  const conveyance = earnings.conveyance ?? record.conveyance ?? record.transportAllowance ?? 0;
  const specialAllowance = earnings.specialAllowance ?? record.specialAllowance ?? 0;
  const otherAllowance = earnings.otherAllowance ?? record.otherAllowance ?? 0;
  const bonus = earnings.bonus ?? record.bonus ?? 0;
  const overtime = earnings.overtime ?? record.overtimeAmount ?? record.overtimePay ?? 0;
  const arrears = earnings.arrears ?? record.arrears ?? 0;
  const grossSalary = earnings.totalGross ?? record.grossSalary ?? (basic + vda + hra + conveyance + specialAllowance + otherAllowance + bonus + overtime + arrears);

  // Deductions Resolution
  const deductions = record.deductions || {};
  const pf = deductions.pfEmployee ?? record.pf ?? 0;
  const esi = deductions.esiEmployee ?? record.esi ?? 0;
  const pt = deductions.pt ?? 0;
  const tds = deductions.tds ?? 0;
  const lwf = deductions.lwf ?? 0;
  const advances = deductions.advances ?? record.advanceAdjustment ?? 0;
  const loanEmi = deductions.loanEmi ?? 0;
  const otherDeductions = deductions.otherDeductions ?? record.otherDeduction ?? 0;
  const totalDeductions = deductions.totalDeductions ?? record.totalDeductions ?? (pf + esi + pt + tds + lwf + advances + loanEmi + otherDeductions);
  const netSalary = record.netSalary ?? Math.max(0, grossSalary - totalDeductions);

  const workingDays = record.totalDaysInMonth ?? record.workingDays ?? 30;
  const presentDays = record.presentDays ?? (record.hasAttendance ? record.paidDays : 0);
  const absentDays = record.lopDays ?? record.absentDays ?? (record.hasAttendance ? Math.max(0, workingDays - (record.paidDays ?? 0)) : workingDays);
  const leaveDays = record.leaveDays ?? 0;
  const paidDays = record.paidDays ?? 0;

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
                <strong className={styles.attValue}>{workingDays}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attPresent}`}>
                <span className={styles.attLabel}>Present</span>
                <strong className={styles.attValue}>{presentDays}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attAbsent}`}>
                <span className={styles.attLabel}>LOP / Absent</span>
                <strong className={styles.attValue}>{absentDays}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attLeave}`}>
                <span className={styles.attLabel}>Leave</span>
                <strong className={styles.attValue}>{leaveDays}</strong>
              </div>
              <div className={`${styles.attCard} ${styles.attPaid}`}>
                <span className={styles.attLabel}>Paid Days</span>
                <strong className={styles.attValue}>{paidDays}</strong>
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
                <strong className={styles.otAmountText}>{formatRupee(overtime)}</strong>
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
                <span>{formatRupee(basic)}</span>
              </div>
              {vda > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Variable DA (VDA)</span>
                  <span>{formatRupee(vda)}</span>
                </div>
              )}
              {hra > 0 && (
                <div className={styles.ledgerRow}>
                  <span>HRA</span>
                  <span>{formatRupee(hra)}</span>
                </div>
              )}
              {conveyance > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Transport / Conveyance</span>
                  <span>{formatRupee(conveyance)}</span>
                </div>
              )}
              {specialAllowance > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Special Allowance</span>
                  <span>{formatRupee(specialAllowance)}</span>
                </div>
              )}
              {bonus > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Statutory Bonus</span>
                  <span style={{ color: '#16a34a' }}>+{formatRupee(bonus)}</span>
                </div>
              )}
              {arrears > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Arrears</span>
                  <span style={{ color: '#16a34a' }}>+{formatRupee(arrears)}</span>
                </div>
              )}
              {overtime > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Overtime Pay</span>
                  <span>{formatRupee(overtime)}</span>
                </div>
              )}
              {otherAllowance > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Other Allowance</span>
                  <span>{formatRupee(otherAllowance)}</span>
                </div>
              )}
              <div className={`${styles.ledgerRow} ${styles.ledgerTotalRow}`}>
                <strong>Gross Salary</strong>
                <strong className={styles.grossText}>{formatRupee(grossSalary)}</strong>
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
                <span className={styles.deductText}>-{formatRupee(pf)}</span>
              </div>
              <div className={styles.ledgerRow}>
                <span>ESI (State Insurance)</span>
                <span className={styles.deductText}>-{formatRupee(esi)}</span>
              </div>
              {pt > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Professional Tax (PT)</span>
                  <span className={styles.deductText}>-{formatRupee(pt)}</span>
                </div>
              )}
              {tds > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Tax Deducted at Source (TDS)</span>
                  <span className={styles.deductText}>-{formatRupee(tds)}</span>
                </div>
              )}
              {lwf > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Labour Welfare Fund (LWF)</span>
                  <span className={styles.deductText}>-{formatRupee(lwf)}</span>
                </div>
              )}
              {advances > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Advance Adjustment</span>
                  <span className={styles.deductText}>-{formatRupee(advances)}</span>
                </div>
              )}
              {loanEmi > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Loan Recovery / EMI</span>
                  <span className={styles.deductText}>-{formatRupee(loanEmi)}</span>
                </div>
              )}
              {otherDeductions > 0 && (
                <div className={styles.ledgerRow}>
                  <span>Other Deduction</span>
                  <span className={styles.deductText}>-{formatRupee(otherDeductions)}</span>
                </div>
              )}
              <div className={`${styles.ledgerRow} ${styles.ledgerTotalRow}`}>
                <strong>Total Deductions</strong>
                <strong className={styles.deductTotalText}>-{formatRupee(totalDeductions)}</strong>
              </div>
            </div>
          </section>

          {/* Section 5: Net Salary Summary Box */}
          <div className={styles.netSummaryBox}>
            <div className={styles.netSummaryRow}>
              <span>Gross Salary</span>
              <strong>{formatRupee(grossSalary)}</strong>
            </div>
            <div className={styles.netSummaryRow}>
              <span>Total Deductions</span>
              <strong className={styles.deductText}>-{formatRupee(totalDeductions)}</strong>
            </div>
            <div className={`${styles.netSummaryRow} ${styles.netHighlightRow}`}>
              <div>
                <span className={styles.netLabel}>Net Take-Home Pay</span>
                <small className={styles.netSub}>Direct Bank Disbursement</small>
              </div>
              <strong className={styles.netValue}>{formatRupee(netSalary)}</strong>
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
