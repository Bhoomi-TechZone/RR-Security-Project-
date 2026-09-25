import React, { useEffect, useRef } from 'react';
import { X, Printer, Download, Zap, Building2, User, Calendar, ShieldCheck } from 'lucide-react';
import { formatRupee, numberToIndianWords } from '../../utils/payrollUtils';
import styles from './SalarySlipPreview.module.css';

export default function SalarySlipPreview({
  isOpen,
  slip,
  onClose,
  onDownload
}) {
  const printRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const amountInWords = numberToIndianWords(slip.netSalary);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Modal Top Actions Toolbar (Hidden on Print) */}
        <div className={styles.modalToolbar}>
          <div className={styles.toolbarLeft}>
            <span className={styles.slipIdBadge}>{slip.slipNumber || 'SALARY SLIP'}</span>
            <span className={styles.monthBadge}>{slip.salaryMonth || 'August 2026'}</span>
          </div>

          <div className={styles.toolbarRight}>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={handlePrint}
              title="Print Payslip"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
            <button
              type="button"
              className={styles.toolbarPrimaryBtn}
              onClick={() => onDownload(slip)}
              title="Download Payslip"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close payslip"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div className={styles.payslipContainer} ref={printRef}>
          <div className={styles.payslipPaper}>
            {/* Header */}
            <div className={styles.payslipHeader}>
              <div className={styles.brandRow}>
                <div className={styles.brandLogo}>
                  <Zap size={22} className={styles.brandIcon} />
                  <div>
                    <h1 className={styles.companyName}>RR Security HRMS</h1>
                    <p className={styles.companyTagline}>Enterprise Workforce &amp; Payroll Solutions</p>
                  </div>
                </div>
                <div className={styles.payslipTitleBadge}>
                  <h2>SALARY SLIP</h2>
                  <span>{slip.salaryMonth || 'August 2026'}</span>
                </div>
              </div>
            </div>

            {/* Employee Information Section */}
            <div className={styles.sectionBox}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCol}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Employee Name</span>
                    <strong className={styles.infoVal}>{slip.employeeName}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Employee ID</span>
                    <span className={styles.infoCode}>{slip.employeeId}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Designation</span>
                    <span className={styles.infoVal}>{slip.designation}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Department</span>
                    <span className={styles.infoVal}>{slip.department}</span>
                  </div>
                </div>

                <div className={styles.infoCol}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Client</span>
                    <span className={styles.infoVal}>{slip.clientName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Bank Name</span>
                    <span className={styles.infoVal}>{slip.bankDetails?.bank || 'State Bank of India'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Bank A/C No</span>
                    <span className={styles.infoVal}>{slip.bankDetails?.accountNumber || 'XXXX XXXX 4521'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>UAN / PF No</span>
                    <span className={styles.infoVal}>{slip.uan || '100904582194'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Summary Bar */}
            <div className={styles.attendanceStrip}>
              <div className={styles.attItem}>
                <span>Working Days</span>
                <strong>{slip.workingDays || 31}</strong>
              </div>
              <div className={styles.attItem}>
                <span>Present</span>
                <strong>{slip.presentDays || 26}</strong>
              </div>
              <div className={styles.attItem}>
                <span>Leave</span>
                <strong>{slip.leaveDays || 3}</strong>
              </div>
              <div className={styles.attItem}>
                <span>Absent</span>
                <strong>{slip.absentDays || 2}</strong>
              </div>
              <div className={`${styles.attItem} ${styles.attPaid}`}>
                <span>Paid Days</span>
                <strong>{slip.paidDays || 29}</strong>
              </div>
            </div>

            {/* Ledger Tables (Earnings vs Deductions) */}
            <div className={styles.ledgerContainer}>
              {/* Earnings Table */}
              <div className={styles.ledgerCol}>
                <div className={styles.ledgerHeader}>
                  <span>Earnings</span>
                  <span>Amount (₹)</span>
                </div>
                <div className={styles.ledgerBody}>
                  <div className={styles.ledgerLine}>
                    <span>Basic Salary</span>
                    <span>{formatRupee(slip.earnings?.basicSalary || 20000)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>HRA</span>
                    <span>{formatRupee(slip.earnings?.hra || 8000)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>Transport Allowance</span>
                    <span>{formatRupee(slip.earnings?.transportAllowance || 2000)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>Other Allowance</span>
                    <span>{formatRupee(slip.earnings?.otherAllowance || 2000)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>Overtime</span>
                    <span>{formatRupee(slip.earnings?.overtime || 4500)}</span>
                  </div>
                </div>
                <div className={styles.ledgerTotal}>
                  <strong>Gross Salary</strong>
                  <strong className={styles.grossText}>{formatRupee(slip.earnings?.grossSalary || 36500)}</strong>
                </div>
              </div>

              {/* Deductions Table */}
              <div className={styles.ledgerCol}>
                <div className={styles.ledgerHeader}>
                  <span>Deductions</span>
                  <span>Amount (₹)</span>
                </div>
                <div className={styles.ledgerBody}>
                  <div className={styles.ledgerLine}>
                    <span>PF (Provident Fund)</span>
                    <span>{formatRupee(slip.deductions?.pf || 2400)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>ESI (State Insurance)</span>
                    <span>{formatRupee(slip.deductions?.esi || 550)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>Advance Adjustment</span>
                    <span>{formatRupee(slip.deductions?.advanceAdjustment || 1000)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>Other Deduction</span>
                    <span>{formatRupee(slip.deductions?.otherDeduction || 250)}</span>
                  </div>
                  <div className={`${styles.ledgerLine} ${styles.emptyLine}`}>
                    <span>&nbsp;</span>
                    <span>&nbsp;</span>
                  </div>
                </div>
                <div className={styles.ledgerTotal}>
                  <strong>Total Deductions</strong>
                  <strong className={styles.deductText}>-{formatRupee(slip.deductions?.totalDeductions || 4200)}</strong>
                </div>
              </div>
            </div>

            {/* Net Pay Highlight Section */}
            <div className={styles.netPayCard}>
              <div className={styles.netPayTop}>
                <div>
                  <span className={styles.netPayTag}>NET PAY</span>
                  <div className={styles.netWordsRow}>
                    <span className={styles.wordsLabel}>Amount in Words:</span>
                    <strong className={styles.wordsVal}>{amountInWords}</strong>
                  </div>
                </div>
                <div className={styles.netAmountWrap}>
                  <span className={styles.currencySymbol}>₹</span>
                  <span className={styles.netAmountBig}>
                    {slip.netSalary?.toLocaleString('en-IN') || '32,300'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payslip Footer */}
            <div className={styles.payslipFooter}>
              <div className={styles.footerNote}>
                <ShieldCheck size={14} className={styles.footerIcon} />
                <span>This is a system-generated salary slip. Generated by RR Security HRMS.</span>
              </div>
              <div className={styles.footerSign}>
                <div className={styles.signLine} />
                <span>Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
