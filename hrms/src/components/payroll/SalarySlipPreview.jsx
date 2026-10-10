import React, { useEffect, useRef } from 'react';
import { X, Printer, Download, Building2, User, Calendar, ShieldCheck, Mail, Phone, Hash, FileCheck } from 'lucide-react';
import { formatRupee, numberToIndianWords } from '../../utils/payrollUtils';
import styles from './SalarySlipPreview.module.css';

export default function SalarySlipPreview({
  isOpen,
  slip,
  company = {},
  config = null,
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

  // Resolve dynamic company fields with fallbacks
  const companyName =
    slip.companyName ||
    company?.name ||
    slip.company ||
    slip.clientName ||
    'RR Security & Facilities';

  const companyAddress =
    slip.companyAddress ||
    [company?.address, company?.city, company?.state, company?.pinCode].filter(Boolean).join(', ') ||
    company?.address ||
    'Civil Lines, Bareilly, Uttar Pradesh 243001';

  const companyEmail = slip.companyEmail || company?.email || '';
  const companyPhone = slip.companyPhone || company?.phone || '';
  const companyGstin = slip.companyGstin || company?.gstin || '';
  const companyPan = slip.companyPan || company?.pan || '';
  const companyLogo = slip.companyLogo || company?.logo || null;

  // Visibility toggles from config (or default all true)
  const showLogo = config?.companyInfo?.showLogo !== false;
  const showCompanyName = config?.companyInfo?.showCompanyName !== false;
  const showAddress = config?.companyInfo?.showAddress !== false;
  const showContact = config?.companyInfo?.showContact !== false;
  const showGstPan = config?.companyInfo?.showGstPan !== false;

  const showName = config?.employeeInfo?.showName !== false;
  const showEmpCode = config?.employeeInfo?.showEmpCode !== false;
  const showDept = config?.employeeInfo?.showDepartment !== false;
  const showDesig = config?.employeeInfo?.showDesignation !== false;
  const showLocation = config?.employeeInfo?.showLocation !== false;
  const showBank = config?.employeeInfo?.showBankDetails !== false;
  const showUanPf = config?.employeeInfo?.showUanPf !== false;
  const showEsiNo = config?.employeeInfo?.showEsiNo !== false;

  const showNotes = config?.footerInfo?.showNotes !== false;
  const customNotes = config?.footerInfo?.customNotes || `This is an official system-generated salary slip issued by ${companyName}.`;
  const showSignatory = config?.footerInfo?.showAuthorizedSignatory !== false;
  const signatoryLabel = config?.footerInfo?.signatoryLabel || 'Authorized Signatory';

  // Normalize earnings
  const earnings = slip.earnings || slip.earningsBreakdown || {};
  const basic = earnings.basic || earnings.basicSalary || 0;
  const hra = earnings.hra || 0;
  const conveyance = earnings.conveyance || earnings.conveyanceAllowance || earnings.transportAllowance || 0;
  const vda = earnings.vda || 0;
  const specialAllowance = earnings.specialAllowance || 0;
  const otherAllowance = earnings.otherAllowance || 0;
  const overtime = earnings.overtime || 0;
  const grossSalary = earnings.totalGross || earnings.grossSalary || slip.grossSalary || (basic + hra + conveyance + vda + specialAllowance + otherAllowance + overtime);

  // Normalize deductions
  const deductions = slip.deductions || slip.deductionsBreakdown || {};
  const pf = deductions.pfEmployee || deductions.pf || deductions.providentFund || 0;
  const esi = deductions.esiEmployee || deductions.esi || deductions.esic || 0;
  const pt = deductions.pt || deductions.professionalTax || 0;
  const tds = deductions.tds || deductions.incomeTax || 0;
  const advance = deductions.advances || deductions.advanceAdjustment || deductions.loanEmi || 0;
  const otherDeductions = deductions.otherDeductions || deductions.otherDeduction || 0;
  const totalDeductions = deductions.totalDeductions || slip.totalDeductions || (pf + esi + pt + tds + advance + otherDeductions);

  const netSalary = slip.netSalary || Math.max(0, grossSalary - totalDeductions);
  const amountInWords = numberToIndianWords(netSalary);

  const initials = (companyName.split(' ').map((w) => w[0]).join('').substring(0, 3) || 'COR').toUpperCase();

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Modal Top Actions Toolbar (Hidden on Print) */}
        <div className={styles.modalToolbar}>
          <div className={styles.toolbarLeft}>
            <span className={styles.slipIdBadge}>{slip.slipNumber || 'SALARY SLIP'}</span>
            <span className={styles.monthBadge}>{slip.salaryMonth || slip.monthLabel || slip.month || 'Current Month'}</span>
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
              onClick={() => onDownload ? onDownload(slip) : handlePrint()}
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
            {/* Header with Dynamic Company Details */}
            <div className={styles.payslipHeader}>
              <div className={styles.brandRow}>
                <div className={styles.brandLogo}>
                  {showLogo && (
                    companyLogo ? (
                      <img src={companyLogo} alt={companyName} className={styles.companyLogoImg} />
                    ) : (
                      <div className={styles.companyLogoBadge}>
                        <span>{initials}</span>
                      </div>
                    )
                  )}
                  <div className={styles.companyMeta}>
                    {showCompanyName && <h1 className={styles.companyName}>{companyName}</h1>}
                    {showAddress && companyAddress && (
                      <p className={styles.companyAddressText}>{companyAddress}</p>
                    )}
                    {showContact && (companyEmail || companyPhone) && (
                      <div className={styles.contactRow}>
                        {companyEmail && <span><Mail size={11} /> {companyEmail}</span>}
                        {companyPhone && <span><Phone size={11} /> {companyPhone}</span>}
                      </div>
                    )}
                    {showGstPan && (companyGstin || companyPan) && (
                      <div className={styles.taxRow}>
                        {companyGstin && <span><strong>GSTIN:</strong> {companyGstin}</span>}
                        {companyPan && <span><strong>PAN:</strong> {companyPan}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.payslipTitleBadge}>
                  <div className={styles.payslipTag}>PAYSLIP</div>
                  <h3 className={styles.payslipMonthText}>{slip.salaryMonth || slip.monthLabel || slip.month}</h3>
                  <span className={styles.payslipSlipNo}>{slip.slipNumber || 'OFFICIAL SLIP'}</span>
                </div>
              </div>
            </div>

            {/* Employee Information Section */}
            <div className={styles.sectionBox}>
              <div className={styles.infoGrid}>
                <div className={styles.infoCol}>
                  {showName && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Employee Name:</span>
                      <strong className={styles.infoVal}>{slip.employeeName}</strong>
                    </div>
                  )}
                  {showEmpCode && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Employee ID:</span>
                      <span className={styles.infoCode}>{slip.employeeId || slip.employeeCode}</span>
                    </div>
                  )}
                  {showDesig && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Designation:</span>
                      <span className={styles.infoVal}>{slip.designation || 'Staff'}</span>
                    </div>
                  )}
                  {showDept && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Department:</span>
                      <span className={styles.infoVal}>{slip.department || 'Operations'}</span>
                    </div>
                  )}
                </div>

                <div className={styles.infoCol}>
                  {showLocation && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Client / Site:</span>
                      <span className={styles.infoVal}>{slip.clientName || slip.site || 'Corporate'}</span>
                    </div>
                  )}
                  {showBank && (
                    <>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Bank Name:</span>
                        <span className={styles.infoVal}>{slip.bankName || slip.bankDetails?.bank || 'State Bank of India'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Bank A/C No:</span>
                        <span className={styles.infoVal}>{slip.bankAccountNo || slip.bankAccount || slip.bankDetails?.accountNumber || 'XXXX XXXX 4521'}</span>
                      </div>
                    </>
                  )}
                  {showUanPf && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>UAN / PF No:</span>
                      <span className={styles.infoVal}>{slip.uan || slip.pfNo || slip.pfNumber || '—'}</span>
                    </div>
                  )}
                  {showEsiNo && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>ESIC No:</span>
                      <span className={styles.infoVal}>{slip.esicNo || slip.esiNumber || '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Summary Bar */}
            <div className={styles.attendanceStrip}>
              <div className={styles.attItem}>
                <span>Total Days</span>
                <strong>{slip.workingDays || slip.totalDaysInMonth || 30}</strong>
              </div>
              <div className={styles.attItem}>
                <span>Present</span>
                <strong>{slip.presentDays !== undefined ? slip.presentDays : (slip.paidDays || 26)}</strong>
              </div>
              <div className={styles.attItem}>
                <span>Leave</span>
                <strong>{slip.leaveDays !== undefined ? slip.leaveDays : 0}</strong>
              </div>
              <div className={styles.attItem}>
                <span>LOP / Absent</span>
                <strong>{slip.lopDays || slip.absentDays || 0}</strong>
              </div>
              {slip.overtimeHours ? (
                <div className={styles.attItem}>
                  <span>Overtime</span>
                  <strong>{slip.overtimeHours} hrs</strong>
                </div>
              ) : null}
              <div className={`${styles.attItem} ${styles.attPaid}`}>
                <span>Paid Days</span>
                <strong>{slip.paidDays || 30}</strong>
              </div>
            </div>

            {/* Ledger Tables (Earnings vs Deductions) */}
            <div className={styles.ledgerContainer}>
              {/* Earnings Table */}
              <div className={styles.ledgerCol}>
                <div className={styles.ledgerHeader}>
                  <span>Earnings Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className={styles.ledgerBody}>
                  <div className={styles.ledgerLine}>
                    <span>Basic Salary</span>
                    <span>{formatRupee(basic)}</span>
                  </div>
                  {hra > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>House Rent Allowance (HRA)</span>
                      <span>{formatRupee(hra)}</span>
                    </div>
                  )}
                  {vda > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Variable DA (VDA)</span>
                      <span>{formatRupee(vda)}</span>
                    </div>
                  )}
                  {conveyance > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Conveyance Allowance</span>
                      <span>{formatRupee(conveyance)}</span>
                    </div>
                  )}
                  {specialAllowance > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Special Allowance</span>
                      <span>{formatRupee(specialAllowance)}</span>
                    </div>
                  )}
                  {otherAllowance > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Other Allowance</span>
                      <span>{formatRupee(otherAllowance)}</span>
                    </div>
                  )}
                  {overtime > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Overtime Pay</span>
                      <span>{formatRupee(overtime)}</span>
                    </div>
                  )}
                </div>
                <div className={styles.ledgerTotal}>
                  <strong>Total Gross Salary</strong>
                  <strong className={styles.grossText}>{formatRupee(grossSalary)}</strong>
                </div>
              </div>

              {/* Deductions Table */}
              <div className={styles.ledgerCol}>
                <div className={styles.ledgerHeader}>
                  <span>Deductions Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className={styles.ledgerBody}>
                  <div className={styles.ledgerLine}>
                    <span>Provident Fund (EPF)</span>
                    <span>{formatRupee(pf)}</span>
                  </div>
                  <div className={styles.ledgerLine}>
                    <span>Employee State Insurance (ESIC)</span>
                    <span>{formatRupee(esi)}</span>
                  </div>
                  {pt > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Professional Tax (PT)</span>
                      <span>{formatRupee(pt)}</span>
                    </div>
                  )}
                  {tds > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Tax Deducted at Source (TDS)</span>
                      <span>{formatRupee(tds)}</span>
                    </div>
                  )}
                  {advance > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Advance / Loan Recovery</span>
                      <span>{formatRupee(advance)}</span>
                    </div>
                  )}
                  {otherDeductions > 0 && (
                    <div className={styles.ledgerLine}>
                      <span>Other Deductions</span>
                      <span>{formatRupee(otherDeductions)}</span>
                    </div>
                  )}
                </div>
                <div className={styles.ledgerTotal}>
                  <strong>Total Deductions</strong>
                  <strong className={styles.deductText}>-{formatRupee(totalDeductions)}</strong>
                </div>
              </div>
            </div>

            {/* Net Pay Highlight Section */}
            <div className={styles.netPayCard}>
              <div className={styles.netPayTop}>
                <div>
                  <span className={styles.netPayTag}>NET SALARY DISBURSED</span>
                  <div className={styles.netWordsRow}>
                    <span className={styles.wordsLabel}>Amount in Words:</span>
                    <strong className={styles.wordsVal}>{amountInWords}</strong>
                  </div>
                </div>
                <div className={styles.netAmountWrap}>
                  <span className={styles.currencySymbol}>₹</span>
                  <span className={styles.netAmountBig}>
                    {netSalary?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payslip Footer */}
            <div className={styles.payslipFooter}>
              <div className={styles.footerNote}>
                <ShieldCheck size={16} className={styles.footerIcon} />
                <span>
                  {showNotes
                    ? customNotes
                    : `This is a system-generated salary slip issued by ${companyName}.`}
                </span>
              </div>
              {showSignatory && (
                <div className={styles.footerSign}>
                  <div className={styles.signLine} />
                  <span>{signatoryLabel}</span>
                  <small className={styles.signSub}>{companyName}</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
