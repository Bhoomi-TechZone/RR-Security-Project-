import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  CreditCard,
  Users,
  Building,
  CheckCircle2,
  DollarSign,
  Download,
} from 'lucide-react';
import {
  downloadBankTransferReportExcel,
  downloadBankTransferReportCsv,
  downloadBankTransferReportPdf,
} from '../../utils/bankTransferReportExport';
import styles from './BankTransferReportView.module.css';

/**
 * Format currency with Indian comma separators
 */
function formatINR(val) {
  const num = Math.round(Number(val) || 0);
  return num.toLocaleString('en-IN');
}

/**
 * Interactive View Component for Bank Transfer Report (Corporate Bulk Disbursement / CMS Format)
 * Matches Image 1 layout:
 * Remitter_Account_No | Remitter_Name | IFSC_Code | Amount | Bank_Account_Number | Beneficiary_Name | Beneficiary LEI Code
 */
export default function BankTransferReportView({
  records = [],
  remitterInfo = {},
  companyInfo = {},
  period = {},
  totals = {},
  filters = {},
}) {
  const comp = companyInfo || {};
  const baseRemitter = remitterInfo || {};

  const [remitterAccountNo, setRemitterAccountNo] = useState(
    baseRemitter.remitterAccountNo || '50200094608378'
  );
  const [remitterName, setRemitterName] = useState(
    (baseRemitter.remitterName || comp.name || 'RR SECURITY AND FACILITIES').toUpperCase()
  );

  useEffect(() => {
    if (baseRemitter.remitterAccountNo) {
      setRemitterAccountNo(baseRemitter.remitterAccountNo);
    }
    if (baseRemitter.remitterName) {
      setRemitterName(baseRemitter.remitterName.toUpperCase());
    }
  }, [baseRemitter.remitterAccountNo, baseRemitter.remitterName]);

  const totalAmount = totals?.totalAmount ?? records.reduce((acc, r) => acc + (Number(r.amount || r.netSalary) || 0), 0);
  const salaryMonth = period?.salaryMonth || '9-2026';
  const salaryMonthLabel = period?.monthLabel || 'September 2026';

  const activeRemitter = {
    ...baseRemitter,
    remitterAccountNo,
    remitterName,
  };

  const handleExportExcel = () => {
    downloadBankTransferReportExcel(activeRemitter, records, period);
  };

  const handleExportCsv = () => {
    downloadBankTransferReportCsv(activeRemitter, records, period);
  };

  const handleExportPdf = () => {
    downloadBankTransferReportPdf(activeRemitter, records, period, totals, comp, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadBankTransferReportPdf(activeRemitter, records, period, totals, comp, { mode: 'print' });
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
            <span className={styles.kpiLabel}>Beneficiaries Count</span>
            <span className={styles.kpiValue}>{records.length} Accounts</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <Building size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Remitter Account</span>
            <span className={styles.kpiValue}>{remitterAccountNo}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconAmber}`}>
            <DollarSign size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Remitter Name</span>
            <span className={styles.kpiValue}>{remitterName}</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar & Remitter Account Control */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Remitter A/c No:</label>
            <input
              type="text"
              className={styles.remitterInput}
              value={remitterAccountNo}
              onChange={(e) => setRemitterAccountNo(e.target.value)}
              placeholder="e.g. 50200094608378"
            />
          </div>

          <span className={styles.badgePeriod}>
            Salary Month: {salaryMonth} ({salaryMonthLabel})
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download exact Bank Transfer Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnCsv}`}
            onClick={handleExportCsv}
            title="Download CSV for Corporate Banking upload (.csv)"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Bank Transfer Report PDF (.pdf)"
          >
            <FileText size={15} /> Export PDF
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Bank Transfer Report"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* 3. Sheet Table Frame matching Image 1 */}
      {records.length > 0 ? (
        <div className={styles.sheetPaper}>
          <div className={styles.sheetHeader}>
            <div>
              <h3 className={styles.sheetTitle}>
                BANK TRANSFER REPORT — SALARY DISBURSEMENT STATEMENT
              </h3>
              <p className={styles.sheetSub}>
                Corporate Bulk NEFT / RTGS / CMS Upload Format | Remitter: {remitterName} ({remitterAccountNo})
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>
              Total: ₹{formatINR(totalAmount)} ({records.length} Beneficiaries)
            </span>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.bankTable}>
              <thead>
                <tr>
                  <th style={{ width: '170px' }}>Remitter_Account_No</th>
                  <th style={{ minWidth: '220px' }}>Remitter_Name</th>
                  <th style={{ width: '130px' }}>IFSC_Code</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '180px' }}>Bank_Account_Number</th>
                  <th style={{ minWidth: '200px' }}>Beneficiary_Name</th>
                  <th className={styles.colRed} style={{ width: '160px' }}>
                    Beneficiary LEI Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.employeeId ? `${r.employeeId}-${idx}` : `btr-${idx}`}>
                    <td className={`${styles.monoCell} ${styles.boldCell}`}>
                      {r.remitterAccountNo || remitterAccountNo}
                    </td>
                    <td>{r.remitterName || remitterName}</td>
                    <td className={`${styles.monoCell} ${styles.boldCell}`}>
                      {(r.ifscCode || r.ifsc || '—').toUpperCase()}
                    </td>
                    <td className={styles.amountCell}>
                      {Math.round(Number(r.amount || r.netSalary || 0))}
                    </td>
                    <td className={`${styles.monoCell} ${styles.boldCell}`}>
                      {r.bankAccountNumber || r.accountNumber || '—'}
                    </td>
                    <td className={styles.boldCell}>
                      {(r.beneficiaryName || r.employeeName || '—').toUpperCase()}
                    </td>
                    <td>{r.beneficiaryLeiCode || r.leiCode || ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td colSpan={3} style={{ textAlign: 'right' }}>
                    TOTAL DISBURSEMENT AMOUNT:
                  </td>
                  <td style={{ textAlign: 'right', color: '#166534' }}>
                    ₹{formatINR(totalAmount)}
                  </td>
                  <td colSpan={3} style={{ textAlign: 'left', paddingLeft: '16px' }}>
                    {records.length} BENEFICIARY ACCOUNTS
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className={styles.emptyCard}>
          <CheckCircle2 size={36} color="#94a3b8" style={{ margin: '0 auto' }} />
          <h4 className={styles.emptyTitle}>No Bank Transfer Records Found</h4>
          <p className={styles.emptyDesc}>
            No salary records available for the selected month ({salaryMonth}). Please choose a different month or process payroll.
          </p>
        </div>
      )}
    </div>
  );
}
