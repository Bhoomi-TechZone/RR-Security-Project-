import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  IndianRupee,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  downloadBonusRegisterExcel,
  downloadBonusRegisterPdf,
} from '../../utils/bonusRegisterExport';
import styles from './BonusRegisterFormCView.module.css';

/**
 * Statutory Bonus Register (Form C) Interactive View
 * [See rule 4(c) of Payment of Bonus Rules, 1975]
 * Matches exact structure and headers shown in Image 1.
 */
export default function BonusRegisterFormCView({
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  filters = {},
}) {
  const accountingYear =
    period?.accountingYear ||
    `April - ${new Date().getFullYear() - 1} to March - ${new Date().getFullYear()}`;

  // Fallback calculation for totals if not supplied
  const sumWages =
    totals?.grandTotalWages !== undefined
      ? totals.grandTotalWages
      : records.reduce((acc, r) => acc + (Number(r.totalWages) || 0), 0);

  const sumBonus =
    totals?.grandTotalBonusPayable !== undefined
      ? totals.grandTotalBonusPayable
      : records.reduce((acc, r) => acc + (Number(r.bonusPayable) || 0), 0);

  const sumCol9 =
    totals?.grandTotalCol9 !== undefined
      ? totals.grandTotalCol9
      : records.reduce((acc, r) => acc + (Number(r.pujaBonusDeduction) || 0), 0);

  const sumCol10 =
    totals?.grandTotalCol10 !== undefined
      ? totals.grandTotalCol10
      : records.reduce((acc, r) => acc + (Number(r.interimBonusAdvance) || 0), 0);

  const sumCol10A =
    totals?.grandTotalCol10A !== undefined
      ? totals.grandTotalCol10A
      : records.reduce((acc, r) => acc + (Number(r.taxDeducted) || 0), 0);

  const sumCol11 =
    totals?.grandTotalCol11 !== undefined
      ? totals.grandTotalCol11
      : records.reduce((acc, r) => acc + (Number(r.financialLossMisconduct) || 0), 0);

  const sumDeduct =
    totals?.grandTotalDeductions !== undefined
      ? totals.grandTotalDeductions
      : records.reduce((acc, r) => acc + (Number(r.totalDeductions) || 0), 0);

  const sumNet =
    totals?.grandTotalNetPayable !== undefined
      ? totals.grandTotalNetPayable
      : records.reduce((acc, r) => acc + (Number(r.netPayable) || 0), 0);

  const sumPaid =
    totals?.grandTotalAmountPaid !== undefined
      ? totals.grandTotalAmountPaid
      : records.reduce((acc, r) => acc + (Number(r.amountPaid) || 0), 0);

  const handleExportExcel = () => {
    downloadBonusRegisterExcel(records, companyInfo, period, totals);
  };

  const handleExportPdf = () => {
    downloadBonusRegisterPdf(records, companyInfo, period, totals);
  };

  const handlePrint = () => {
    downloadBonusRegisterPdf(records, companyInfo, period, totals, { mode: 'print' });
  };

  if (!records || records.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileSpreadsheet size={40} color="#94a3b8" style={{ marginBottom: '10px' }} />
        <h4 className={styles.emptyTitle}>No Bonus Register Records Found</h4>
        <p className={styles.emptyText}>
          No employee records match your selected filters (Company:{' '}
          {filters?.company || 'All Companies'}, Department:{' '}
          {filters?.department || 'All Departments'}).
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. Summary KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Eligible Employees</span>
            <span className={styles.kpiValue}>{records.length}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <IndianRupee size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Annual Wages</span>
            <span className={styles.kpiValue}>₹{sumWages.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Bonus Payable (8.33%)</span>
            <span className={styles.kpiValue}>₹{sumBonus.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Net Disbursed</span>
            <span className={styles.kpiValue}>₹{sumPaid.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeEmployees}>
            {records.length} {records.length === 1 ? 'Employee' : 'Employees'}
          </span>
          <span className={styles.accountingYearBadge}>
            Accounting Year: {accountingYear}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Form C as formatted Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            Download Excel
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Form C as printable PDF (.pdf)"
          >
            <FileText size={15} />
            Download PDF
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Direct print preview of Form C"
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      </div>

      {/* 3. Sheet Paper View (Matching Image 2) */}
      <div className={styles.paperCard}>
        {/* Header Block */}
        <div className={styles.officialTitleBlock}>
          <h2 className={styles.formCTitle}>FORM C</h2>
          <div className={styles.ruleSubtitle}>[See Rule 4(C)]</div>
          <div className={styles.yearHeading}>
            Bonus paid to employees for the accounting year ending on the{' '}
            {period?.accountingYearEnding ||
              (period?.endYear ? `31 Mar ${period.endYear}` : '31 Mar 2026')}
          </div>

          <div className={styles.establishmentHeader}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Name of the establishment:</span>
              <span className={styles.metaValue}>
                {companyInfo?.name || 'RR SECURITY & FACILITIES'}{' '}
                {companyInfo?.address ? `${companyInfo.address}` : 'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044'}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>No. of working days in the year:</span>
              <span className={styles.metaValue}>
                {period?.workingDaysInYear || companyInfo?.workingDaysInYear || 365}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className={styles.tableResponsive}>
          <table className={styles.statutoryTable}>
            <thead>
              {/* Row 1: Primary Header Row with Grouped Deductions */}
              <tr className={styles.headerNamesRow}>
                <th rowSpan="2" style={{ width: '45px' }}>SL. NO</th>
                <th rowSpan="2" style={{ minWidth: '220px' }}>Name of the employee</th>
                <th rowSpan="2" style={{ minWidth: '150px' }}>Father's Name</th>
                <th rowSpan="2" style={{ width: '140px' }}>
                  Whether he has completed 15 years of age at the beginning of the financial
                </th>
                <th rowSpan="2" style={{ width: '130px' }}>Designation</th>
                <th rowSpan="2" style={{ width: '90px' }}>No. of days worked in the year</th>
                <th rowSpan="2" style={{ width: '130px' }}>
                  Total salary wage in respect of the accounting year
                </th>
                <th rowSpan="2" style={{ width: '130px' }}>
                  Amount of bonus payable under Section 10 or Section 11, as the case may be
                </th>
                <th colSpan="4" className={styles.deductionsGroupHeader}>
                  Deductions
                </th>
                <th rowSpan="2" style={{ width: '120px' }}>
                  Total sum deducted under Columns 9, 10,10-A and 11
                </th>
                <th rowSpan="2" style={{ width: '120px' }}>
                  Net amount payable (column 8 minus Column 12)
                </th>
                <th rowSpan="2" style={{ width: '110px' }}>Amount actually paid</th>
                <th rowSpan="2" style={{ width: '110px' }}>Due on which paid</th>
                <th rowSpan="2" style={{ minWidth: '160px' }}>
                  Signature/Thumb impression of the employee
                </th>
              </tr>

              {/* Row 2: Sub-headers under Deductions */}
              <tr className={styles.headerSubRow}>
                <th style={{ width: '110px' }}>
                  Puja bonus or other customary bonus paid during the accounting
                </th>
                <th style={{ width: '110px' }}>
                  Interim bonus or bonus paid in advance
                </th>
                <th style={{ width: '110px' }}>
                  Amount of income tax deducted
                </th>
                <th style={{ width: '130px' }}>
                  Deduction on account of financial loss if any, caused by misconduct
                </th>
              </tr>

              {/* Row 3: Numbering Row matching Image 2 */}
              <tr className={styles.headerNumbersRow}>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
                <th>6</th>
                <th>7</th>
                <th>8</th>
                <th>9</th>
                <th>10</th>
                <th>10-A</th>
                <th>11</th>
                <th>12</th>
                <th>13</th>
                <th>14</th>
                <th>15</th>
                <th>16</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r, idx) => {
                const srNo = r.srNo || idx + 1;
                const empDisplayName =
                  r.displayName ||
                  (r.employeeCode
                    ? `${r.name} (${r.employeeCode})`
                    : r.employeeId
                    ? `${r.name} (${r.employeeId})`
                    : r.name || '');
                const fatherName = r.fatherName || '';
                const completed15 = (r.completed15Years || 'YES').toUpperCase();
                const designation = r.designation || 'Staff';
                const daysWorked = Number(r.daysWorked) || 0;
                const totalWages = Number(r.totalWages) || 0;
                const bonusPayable = Number(r.bonusPayable) || 0;
                const col9 = Number(r.pujaBonusDeduction) || 0;
                const col10 = Number(r.interimBonusAdvance) || 0;
                const col10A = Number(r.taxDeducted) || 0;
                const col11 = Number(r.financialLossMisconduct) || 0;
                const totalDeduct = Number(r.totalDeductions) || 0;
                const netPayable = Number(r.netPayable) || Math.max(0, bonusPayable - totalDeduct);
                const amountPaid = Number(r.amountPaid) || netPayable;
                const paymentDate = r.paymentDate || `31-Mar-${period.endYear || new Date().getFullYear()}`;

                return (
                  <tr key={r.employeeId ? `${r.employeeId}-${idx}` : `form-c-${idx}`} className={styles.dataRow}>
                    <td className={styles.colCenter}>{srNo}</td>
                    <td className={`${styles.colLeft} ${styles.empNameCell}`}>{empDisplayName}</td>
                    <td className={styles.colLeft}>{fatherName}</td>
                    <td className={styles.colCenter}>{completed15}</td>
                    <td className={styles.colLeft}>{designation}</td>
                    <td className={styles.colRight}>{daysWorked.toFixed(2)}</td>
                    <td className={styles.colRight}>{totalWages.toFixed(2)}</td>
                    <td className={styles.colRight}>{bonusPayable.toFixed(2)}</td>
                    <td className={styles.colRight}>{col9.toFixed(2)}</td>
                    <td className={styles.colRight}>{col10.toFixed(2)}</td>
                    <td className={styles.colRight}>{col10A.toFixed(2)}</td>
                    <td className={styles.colRight}>{col11.toFixed(2)}</td>
                    <td className={styles.colRight}>{totalDeduct.toFixed(2)}</td>
                    <td className={styles.colRight}>{netPayable.toFixed(2)}</td>
                    <td className={styles.colRight}>{amountPaid.toFixed(2)}</td>
                    <td className={styles.colCenter}>{paymentDate}</td>
                    <td className={styles.colCenter}></td>
                  </tr>
                );
              })}

              {/* Grand Total Row matching Image 2 */}
              <tr className={styles.grandTotalRow}>
                <td colSpan={5} className={styles.grandTotalLabel}>
                  Grand Total
                </td>
                <td className={styles.colRight}>
                  {(totals?.grandTotalDaysWorked ?? records.reduce((acc, r) => acc + (Number(r.daysWorked) || 0), 0)).toFixed(2)}
                </td>
                <td className={styles.colRight}>{sumWages.toFixed(2)}</td>
                <td className={styles.colRight}>{sumBonus.toFixed(2)}</td>
                <td className={styles.colRight}>{sumCol9.toFixed(2)}</td>
                <td className={styles.colRight}>{sumCol10.toFixed(2)}</td>
                <td className={styles.colRight}>{sumCol10A.toFixed(2)}</td>
                <td className={styles.colRight}>{sumCol11.toFixed(2)}</td>
                <td className={styles.colRight}>{sumDeduct.toFixed(2)}</td>
                <td className={styles.colRight}>{sumNet.toFixed(2)}</td>
                <td className={styles.colRight}>{sumPaid.toFixed(2)}</td>
                <td className={styles.colCenter}>—</td>
                <td className={styles.colCenter}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
