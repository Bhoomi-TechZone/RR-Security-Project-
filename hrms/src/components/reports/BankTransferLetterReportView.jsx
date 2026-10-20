import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Building,
  CreditCard,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  downloadBankTransferLetterPdf,
  downloadBankTransferLetterExcel,
  downloadBankTransferLetterWord,
} from '../../utils/bankTransferLetterExport';
import styles from './BankTransferLetterReportView.module.css';

/**
 * Format currency with Indian comma separators
 */
function formatINR(val) {
  const num = Math.round(Number(val) || 0);
  return num.toLocaleString('en-IN');
}

/**
 * Interactive View Component for Bank Transfer Letter (Salary Disbursement)
 * Matches Image 1 layout with editable cheque, date, and bank controls,
 * plus attached beneficiary schedule.
 */
export default function BankTransferLetterReportView({
  records = [],
  letterInfo = {},
  companyInfo = {},
  period = {},
  totals = {},
  filters = {},
}) {
  const comp = companyInfo || {};
  const baseInfo = letterInfo || {};

  // Interactive letter configuration state
  const [letterDate, setLetterDate] = useState(baseInfo.letterDate || '07/10/2026');
  const [chequeNo, setChequeNo] = useState(baseInfo.chequeNo || '000040');
  const [chequeDate, setChequeDate] = useState(baseInfo.chequeDate || '07/10/2026');
  const [bankName, setBankName] = useState(baseInfo.bankName || 'HDFC BANK');
  const [bankBranch, setBankBranch] = useState(baseInfo.bankBranch || 'Mohan Estate New Delhi');
  const [showSchedule, setShowSchedule] = useState(true);

  // Sync state if baseInfo updates
  useEffect(() => {
    if (baseInfo.letterDate) setLetterDate(baseInfo.letterDate);
    if (baseInfo.chequeNo) setChequeNo(baseInfo.chequeNo);
    if (baseInfo.chequeDate) setChequeDate(baseInfo.chequeDate);
    if (baseInfo.bankName) setBankName(baseInfo.bankName);
    if (baseInfo.bankBranch) setBankBranch(baseInfo.bankBranch);
  }, [baseInfo.letterDate, baseInfo.chequeNo, baseInfo.chequeDate, baseInfo.bankName, baseInfo.bankBranch]);

  const companyName = (baseInfo.companyName || comp.name || 'RR SECURITY AND FACILITIES').toUpperCase();
  const companyAddress = comp.address || 'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';

  const totalAmount = totals?.totalAmount ?? records.reduce((acc, r) => acc + (Number(r.netSalary) || 0), 0);
  const totalAmountWords = baseInfo.totalAmountWords || 'Zero Only';
  const salaryMonth = baseInfo.salaryMonth || period?.salaryMonth || '9-2026';
  const salaryMonthLabel = baseInfo.salaryMonthLabel || period?.monthLabel || 'September 2026';

  const activeLetterData = {
    ...baseInfo,
    letterDate,
    chequeNo,
    chequeDate,
    bankName,
    bankBranch,
    companyName,
    totalAmount,
    totalAmountFormatted: `Rs.${totalAmount}`,
    totalAmountWords,
    salaryMonth,
    salaryMonthLabel,
  };

  const handleExportPdf = () => {
    downloadBankTransferLetterPdf(activeLetterData, records, comp, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadBankTransferLetterPdf(activeLetterData, records, comp, { mode: 'print' });
  };

  const handleExportWord = () => {
    downloadBankTransferLetterWord(activeLetterData, records, comp);
  };

  const handleExportExcel = () => {
    downloadBankTransferLetterExcel(activeLetterData, records, comp);
  };

  return (
    <div className={styles.container}>
      {/* 1. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <CreditCard size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Disbursement</span>
            <span className={styles.kpiValue}>₹{formatINR(totalAmount)}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Beneficiary Accounts</span>
            <span className={styles.kpiValue}>{records.length} Employees</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Cheque Reference</span>
            <span className={styles.kpiValue}>#{chequeNo} ({chequeDate})</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconAmber}`}>
            <Building size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Disbursement Bank</span>
            <span className={styles.kpiValue}>{bankName}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Letter Config Bar (Customize details before printing) */}
      <div className={styles.configCard}>
        <div className={styles.configCardHeader}>
          <span className={styles.configTitle}>
            <Layers size={15} /> Customize Bank & Cheque Advice Details
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Live preview updates as you type
          </span>
        </div>
        <div className={styles.configGrid}>
          <div className={styles.configField}>
            <label>Letter Date</label>
            <input
              type="text"
              value={letterDate}
              onChange={(e) => setLetterDate(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className={styles.configField}>
            <label>Cheque Number</label>
            <input
              type="text"
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              placeholder="e.g. 000040"
            />
          </div>
          <div className={styles.configField}>
            <label>Cheque Date</label>
            <input
              type="text"
              value={chequeDate}
              onChange={(e) => setChequeDate(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>
          <div className={styles.configField}>
            <label>Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC BANK"
            />
          </div>
          <div className={styles.configField}>
            <label>Branch / City</label>
            <input
              type="text"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              placeholder="e.g. Mohan Estate New Delhi"
            />
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeInfo}>
            Salary Month: {salaryMonth} ({salaryMonthLabel})
          </span>
          <span className={styles.badgePeriod}>
            Total Net Transfer: ₹{formatINR(totalAmount)}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Bank Transfer Letter PDF"
          >
            <FileText size={15} /> Export PDF
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Bank Transfer Letter"
          >
            <Printer size={15} /> Print Letter
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnWord}`}
            onClick={handleExportWord}
            title="Download Word Document (.doc)"
          >
            <FileText size={15} /> Export Word
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Bank Disbursement Spreadsheet (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnToggle}`}
            onClick={() => setShowSchedule(!showSchedule)}
          >
            {showSchedule ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showSchedule ? 'Hide Schedule' : 'View Schedule'}
          </button>
        </div>
      </div>

      {/* 4. Realistic Letter Paper Document matching Image 1 */}
      <div className={styles.paperLetter}>
        {/* Letterhead */}
        <div className={styles.letterhead}>
          <h2 className={styles.letterheadCompanyName}>{companyName}</h2>
          <p className={styles.letterheadAddress}>{companyAddress}</p>
        </div>

        {/* Date */}
        <div className={styles.letterDateRow}>
          Date {letterDate}
        </div>

        {/* Recipient */}
        <div className={styles.recipientBlock}>
          <div>To,</div>
          <div>The Manager</div>
          <div className={styles.recipientBank}>{bankName}</div>
          <div>{bankBranch}</div>
        </div>

        {/* Subject */}
        <div className={styles.subjectBlock}>
          SUB : TRANSFER OF FUNDS TO SALARY ACCOUNT
        </div>

        {/* Salutation */}
        <div className={styles.salutation}>
          Dear Sir,
        </div>

        {/* Body Line 1 */}
        <div className={styles.letterBodyText}>
          We are enclosing herewith our Cheque No.
          <span className={styles.boldAmount}> {chequeNo}</span> dt.{' '}
          <span className={styles.boldAmount}>{chequeDate}</span> for{' '}
          <span className={styles.boldAmount}>Rs.{totalAmount}</span>
        </div>

        {/* Amount in words */}
        <div className={styles.wordsBlock}>
          ( Rupees <span className={styles.boldAmount}>{totalAmountWords}</span> )
        </div>

        {/* Body Line 2 */}
        <div className={styles.salaryMonthBlock}>
          Salary for the month of{' '}
          <span className={styles.boldAmount}>{salaryMonth}</span> Please credit the saving accounts as per list
        </div>

        <div className={styles.enclosedWord}>
          Enclosed
        </div>

        {/* Complimentary Close */}
        <div className={styles.complimentaryBlock}>
          <div>Thanking you,</div>
          <div style={{ marginTop: '12px' }}>Yours faithfully,</div>
          <div className={styles.signatoryCompany} style={{ marginTop: '12px' }}>
            For {companyName}
          </div>
        </div>

        {/* Authorised Signatory */}
        <div className={styles.signatoryTitle}>
          AUTHORISED SIGNATORY
        </div>

        {/* Enclosures */}
        <div className={styles.enclosuresBlock}>
          <div>Encls:</div>
          <div style={{ marginLeft: '12px' }}>1) Cheque</div>
          <div style={{ marginLeft: '12px' }}>2) List of Account Holders</div>
        </div>
      </div>

      {/* 5. Attached Annexure Schedule (List of Account Holders) */}
      {showSchedule && records.length > 0 && (
        <div className={styles.annexureSection}>
          <div className={styles.annexureHeader}>
            <div>
              <h3 className={styles.annexureTitle}>
                ANNEXURE — LIST OF BENEFICIARY ACCOUNT HOLDERS (SALARY DISBURSEMENT)
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Bank: {bankName} | Cheque No: #{chequeNo} dt. {chequeDate} | Month: {salaryMonthLabel}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className={styles.badgeInfo}>
                {records.length} Employees
              </span>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.scheduleTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>Sr.</th>
                  <th style={{ width: '90px' }}>Emp ID</th>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Bank Name</th>
                  <th style={{ textAlign: 'center' }}>Saving A/c No.</th>
                  <th style={{ textAlign: 'center' }}>IFSC Code</th>
                  <th style={{ textAlign: 'right' }}>Net Salary (₹)</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.employeeId ? `${r.employeeId}-${idx}` : `acc-${idx}`}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {r.employeeCode || r.employeeId}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {r.employeeName}
                    </td>
                    <td>{r.bankName || bankName}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }}>
                      {r.accountNumber || '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', textAlign: 'center' }}>
                      {r.ifsc || '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#166534' }}>
                      ₹{formatINR(r.netSalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan={7} style={{ textAlign: 'right' }}>
                    GRAND TOTAL
                  </td>
                  <td style={{ textAlign: 'right', color: '#166534' }}>
                    ₹{formatINR(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className={styles.emptyCard}>
          <CheckCircle2 size={36} color="#94a3b8" style={{ margin: '0 auto' }} />
          <h4 className={styles.emptyTitle}>No Payroll Disbursement Records Found</h4>
          <p className={styles.emptyDesc}>
            No salary records available for the selected month ({salaryMonth}). Please select a different month or process payroll.
          </p>
        </div>
      )}
    </div>
  );
}
