import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
} from 'lucide-react';
import {
  downloadEsiForm7Option2Excel,
  downloadEsiForm7Option2Csv,
  downloadEsiForm7Option2Pdf,
} from '../../utils/esiForm7Option2Export';
import styles from './EsiForm7Option2ReportView.module.css';

/**
 * Statutory ESI - Form 7 - Half Yearly Report (Option-2) Component
 * FORM 7 [REGULATION 32] - REGISTER OF EMPLOYEES
 * Replicates the exact statutory branch/dot-matrix ledger format:
 * - Centered headers: Form 7, REGISTER OF EMPLOYEES, (REGULATION 32), Contribution Period
 * - Dual-line employee row format (Line 1: Name + Month 1-6 columns + Total; Line 2: Insurance No + Dispensary)
 * - Numbered column reference row (1, 4 to 24, Daily Wages, Rem)
 * - Statutory bottom summary rows: Total, Employer's Share of Contribution, Total Value of Contribution (Rounded Off), Challan No & Date
 */
export default function EsiForm7Option2ReportView({
  records = [],
  companyInfo = {},
  clientInfo = {},
  establishmentInfo = {},
  period = {},
  totals = {},
  monthlySummaries = [],
  filters = {},
}) {
  const months = period?.months || [
    { name: 'April' },
    { name: 'May' },
    { name: 'June' },
    { name: 'July' },
    { name: 'August' },
    { name: 'September' },
  ];

  const firstMonth = months[0]?.name?.toUpperCase() || 'APRIL';
  const lastMonth = months[5]?.name?.toUpperCase() || 'SEPTEMBER';

  let startYear = '';
  let endYear = '';

  if (period?.fromDate && period?.toDate) {
    startYear = period.fromDate.slice(0, 4);
    endYear = period.toDate.slice(0, 4);
  } else if (months[0]?.monthStr && months[5]?.monthStr) {
    startYear = months[0].monthStr.slice(0, 4);
    endYear = months[5].monthStr.slice(0, 4);
  } else {
    const y = new Date().getFullYear();
    startYear = String(y);
    endYear = String(y);
  }

  const periodHeader = `Contribution Period From ${firstMonth} ${startYear} To ${lastMonth} ${endYear}`;
  const clientName = clientInfo?.name || filters?.company || 'All Clients';

  // Format month headers (e.g. Apr, 2025)
  const mHeaders = months.map((m) => {
    const namePart = (m.name || '').slice(0, 3);
    const yrPart = (m.monthStr || '').slice(0, 4);
    return yrPart ? `${namePart}, ${yrPart}` : (m.name || 'Month');
  });

  // Calculate monthly aggregates
  const sumDays = [0, 0, 0, 0, 0, 0];
  const sumWages = [0, 0, 0, 0, 0, 0];
  const sumEmpEsi = [0, 0, 0, 0, 0, 0];
  const sumEmprEsi = [0, 0, 0, 0, 0, 0];

  records.forEach((r) => {
    const m = r.months || [];
    for (let i = 0; i < 6; i++) {
      sumDays[i] += Number(m[i]?.days) || 0;
      sumWages[i] += Number(m[i]?.wages) || 0;
      sumEmpEsi[i] += Number(m[i]?.employeeShare) || 0;
      sumEmprEsi[i] += Number(m[i]?.employerShare) || Math.round((Number(m[i]?.wages) || 0) * 0.0325);
    }
  });

  const grandDays = totals?.grandTotalDays ?? sumDays.reduce((a, b) => a + b, 0);
  const grandWages = totals?.grandTotalWages ?? sumWages.reduce((a, b) => a + b, 0);
  const grandEmpEsi = totals?.grandTotalEmployeeContribution ?? sumEmpEsi.reduce((a, b) => a + b, 0);
  const grandEmprEsi = totals?.grandTotalEmployerContribution ?? sumEmprEsi.reduce((a, b) => a + b, 0);
  const grandTotalContrib = grandEmpEsi + grandEmprEsi;

  const fmtCurr = (val) => {
    const n = Number(val) || 0;
    return n.toFixed(2);
  };

  const fmtDays = (val) => {
    const n = Number(val) || 0;
    return n.toFixed(2);
  };

  const todayStr = new Date().toLocaleDateString('en-GB');

  // Exporters
  const handleDownloadPdf = () => {
    downloadEsiForm7Option2Pdf(records, companyInfo, period, totals, monthlySummaries, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadEsiForm7Option2Pdf(records, companyInfo, period, totals, monthlySummaries, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsiForm7Option2Excel(records, companyInfo, period, totals, monthlySummaries, { format: 'xlsx' });
  };

  const handleDownloadCsv = () => {
    downloadEsiForm7Option2Csv(records, companyInfo, period, totals, monthlySummaries, { format: 'csv' });
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={15} />
            FORM 7 [Regulation 32] - Option 2
          </span>
          <span className={styles.metaText}>
            Contribution Period: <strong>{periodHeader}</strong>
          </span>
          {clientName && clientName !== 'All Companies' && (
            <span className={styles.metaText}>
              Client / Site: <strong>{clientName}</strong>
            </span>
          )}
          <span className={styles.metaText}>
            Insured: <strong>{records.length} Employees</strong>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleDownloadPdf}
            title="Download Official PDF"
          >
            <Download size={14} /> PDF
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleDownloadExcel}
            title="Download Excel Workbook (.xlsx)"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnCsv}`}
            onClick={handleDownloadCsv}
            title="Download CSV Spreadsheet (.csv)"
          >
            <FileText size={14} /> CSV
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Statutory Register"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiCardBlue}`}>
          <span className={styles.kpiLabel}>Insured Employees</span>
          <span className={styles.kpiValue}>{records.length} Employees</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
          <span className={styles.kpiLabel}>Total Wages (Half-Year)</span>
          <span className={styles.kpiValue}>₹{grandWages.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardPurple}`}>
          <span className={styles.kpiLabel}>Employees Share (0.75%)</span>
          <span className={styles.kpiValue}>₹{grandEmpEsi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardOrange}`}>
          <span className={styles.kpiLabel}>Employers Share (3.25%)</span>
          <span className={styles.kpiValue}>₹{grandEmprEsi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Main Statutory Paper Sheet */}
      <div className={styles.sheetCard}>
        {/* Statutory Heading */}
        <div className={styles.statutoryHeader}>
          <div className={styles.statutoryTitle}>Form 7</div>
          <div className={styles.statutorySubtitle}>REGISTER OF EMPLOYEES</div>
          <div className={styles.statutoryRule}>(REGULATION 32)</div>
          <div className={styles.statutoryPeriod}>{periodHeader}</div>
        </div>

        {/* Table Structure matching Image 1 */}
        <div className={styles.tableWrapper}>
          <table className={styles.statutoryTable}>
            <thead>
              {/* Row 1: Main Column Headers */}
              <tr>
                <th rowSpan={2} style={{ width: '40px' }}>Sl.<br />No.</th>
                <th rowSpan={2} style={{ minWidth: '220px', textAlign: 'left' }}>
                  Name Of Insured Person (2)<br />
                  <span style={{ fontWeight: 'normal', fontSize: '10px' }}>Insurance (3) &nbsp; Dispensary (3A)</span>
                </th>
                {mHeaders.map((mName, idx) => (
                  <th key={idx} colSpan={3}>{mName}</th>
                ))}
                <th colSpan={3}>Total</th>
                <th rowSpan={2} style={{ width: '75px' }}>Daily<br />Wages</th>
                <th rowSpan={2} style={{ width: '50px' }}>Rem.</th>
              </tr>

              {/* Row 2: Sub-headers for Months & Total */}
              <tr>
                {/* 6 Months */}
                {Array.from({ length: 6 }).map((_, mIdx) => (
                  <React.Fragment key={mIdx}>
                    <th style={{ width: '55px' }}>No.Of<br />Days</th>
                    <th style={{ width: '70px' }}>Wages<br />Paid</th>
                    <th style={{ width: '65px' }}>Empl.<br />E.S.I.</th>
                  </React.Fragment>
                ))}
                {/* Total */}
                <th style={{ width: '55px' }}>No.Of<br />Days</th>
                <th style={{ width: '75px' }}>Wages<br />Paid</th>
                <th style={{ width: '65px' }}>Empl.<br />E.S.I.</th>
              </tr>

              {/* Row 3: Statutory Numbering Row matching Image 1 */}
              <tr className={styles.colNumberRow}>
                <th>1</th>
                <th></th>
                {/* Month 1: 4, 5, 6 */}
                <th>4</th><th>5</th><th>6</th>
                {/* Month 2: 7, 8, 9 */}
                <th>7</th><th>8</th><th>9</th>
                {/* Month 3: 10, 11, 12 */}
                <th>10</th><th>11</th><th>12</th>
                {/* Month 4: 13, 14, 15 */}
                <th>13</th><th>14</th><th>15</th>
                {/* Month 5: 16, 17, 18 */}
                <th>16</th><th>17</th><th>18</th>
                {/* Month 6: 19, 20, 21 */}
                <th>19</th><th>20</th><th>21</th>
                {/* Total: 22, 23, 24 */}
                <th>22</th><th>23</th><th>24</th>
                <th></th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={25} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No insured employee records found for the selected contribution period and filters.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => {
                  const m = r.months || [];
                  return (
                    <React.Fragment key={idx}>
                      {/* Line 1: Sl No, Name, Months 1..6, Total, Daily Wages, Rem */}
                      <tr className={styles.empNameRow}>
                        <td className={styles.alignCenter}>{r.srNo || idx + 1}</td>
                        <td className={`${styles.alignLeft} ${styles.empNameText}`}>
                          {r.name ? String(r.name).toUpperCase() : '—'}
                        </td>
                        {/* Month 1 to 6 */}
                        {Array.from({ length: 6 }).map((_, mIdx) => (
                          <React.Fragment key={mIdx}>
                            <td className={styles.alignRight}>{fmtDays(m[mIdx]?.days)}</td>
                            <td className={styles.alignRight}>{fmtCurr(m[mIdx]?.wages)}</td>
                            <td className={styles.alignRight}>{fmtCurr(m[mIdx]?.employeeShare)}</td>
                          </React.Fragment>
                        ))}
                        {/* Total Block */}
                        <td className={`${styles.alignRight} ${styles.empNameText}`}>{fmtDays(r.totalDays)}</td>
                        <td className={`${styles.alignRight} ${styles.empNameText}`}>{fmtCurr(r.totalWages)}</td>
                        <td className={`${styles.alignRight} ${styles.empNameText}`}>{fmtCurr(r.totalEmployeeContribution)}</td>
                        {/* Daily Wage */}
                        <td className={styles.alignRight}>{fmtCurr(r.dailyWage)}</td>
                        {/* Remarks */}
                        <td className={styles.alignCenter}>{r.remarks || ''}</td>
                      </tr>

                      {/* Line 2: Empty under Sl No, Insurance No + Dispensary under Name, empty under rest */}
                      <tr className={styles.empSubRow}>
                        <td></td>
                        <td className={styles.alignLeft}>
                          <span className={styles.insuranceText}>{r.insuranceNo || '—'}</span>
                          <span className={styles.dispensaryText}>{r.dispensaryRemarks || ''}</span>
                        </td>
                        {/* Empty cells for months and total */}
                        {Array.from({ length: 23 }).map((_, cIdx) => (
                          <td key={cIdx}></td>
                        ))}
                      </tr>
                    </React.Fragment>
                  );
                })
              )}

              {/* Bottom Summary Rows matching Image 1 */}
              {records.length > 0 && (
                <>
                  {/* Row 1: Total : */}
                  <tr className={styles.totalRow}>
                    <td></td>
                    <td className={styles.alignLeft}>Total :</td>
                    {Array.from({ length: 6 }).map((_, mIdx) => (
                      <React.Fragment key={mIdx}>
                        <td className={styles.alignRight}>{fmtDays(sumDays[mIdx])}</td>
                        <td className={styles.alignRight}>{fmtCurr(sumWages[mIdx])}</td>
                        <td className={styles.alignRight}>{fmtCurr(sumEmpEsi[mIdx])}</td>
                      </React.Fragment>
                    ))}
                    <td className={styles.alignRight}>{fmtDays(grandDays)}</td>
                    <td className={styles.alignRight}>{fmtCurr(grandWages)}</td>
                    <td className={styles.alignRight}>{fmtCurr(grandEmpEsi)}</td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* Row 2: Employer's Share of Contribution : */}
                  <tr className={styles.employerRow}>
                    <td></td>
                    <td className={styles.alignLeft}>Employer's Share of Contribution :</td>
                    {Array.from({ length: 6 }).map((_, mIdx) => (
                      <React.Fragment key={mIdx}>
                        <td></td>
                        <td></td>
                        <td className={styles.alignRight}>{fmtCurr(sumEmprEsi[mIdx])}</td>
                      </React.Fragment>
                    ))}
                    <td></td>
                    <td></td>
                    <td className={styles.alignRight}>{fmtCurr(grandEmprEsi)}</td>
                    <td></td>
                    <td></td>
                  </tr>

                  {/* Row 3: Total Value Of Contribution : ( Rounded Off ) */}
                  <tr className={styles.totalContribRow}>
                    <td></td>
                    <td className={styles.alignLeft}>
                      Total Value Of Contribution :<br />
                      <span style={{ fontWeight: 'normal', fontSize: '10px' }}>( Rounded Off )</span>
                    </td>
                    {Array.from({ length: 6 }).map((_, mIdx) => (
                      <React.Fragment key={mIdx}>
                        <td></td>
                        <td></td>
                        <td className={styles.alignRight}>{fmtCurr(sumEmpEsi[mIdx] + sumEmprEsi[mIdx])}</td>
                      </React.Fragment>
                    ))}
                    <td></td>
                    <td></td>
                    <td className={styles.alignRight}>{fmtCurr(grandTotalContrib)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Challan Section matching Image 1 */}
        <div className={styles.challanSection}>
          <div className={styles.challanRow}>
            <span className={styles.challanLabel}>Paid Challan No. :</span>
            <span className={styles.challanValue}></span>
          </div>
          <div className={styles.challanRow}>
            <span className={styles.challanLabel}>Date             :</span>
            <span className={styles.challanValue}>{todayStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
