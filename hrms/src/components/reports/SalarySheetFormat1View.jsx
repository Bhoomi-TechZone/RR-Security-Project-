import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  Calendar,
  Users,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadSalarySheetFormat1Pdf,
  downloadSalarySheetFormat1Excel,
  downloadSalarySheetFormat1Csv,
} from '../../utils/salarySheetFormat1Export';
import { numberToIndianWords } from '../../utils/payrollUtils';
import styles from './SalarySheetFormat1View.module.css';

/**
 * Statutory Wage/Salary Register (Salary Sheet Format 1) View
 * Matches exact format from user's reference images (Images 2 & 3).
 * Fully dynamic rendering powered by live MongoDB calculations.
 */
export default function SalarySheetFormat1View({
  records = [],
  companyInfo = {},
  clientInfo = {},
  establishmentInfo = {},
  period = {},
  totals = {},
  pfSummary = {},
  esiSummary = {},
  ptSummary = {},
  earningSummary = {},
  deductionSummary = {},
  filters = {},
}) {
  // Resolve configured company statutory codes strictly from Company Setup
  let savedSetup = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_company_setup') : null;
    if (raw) savedSetup = JSON.parse(raw);
  } catch (e) {}

  let adminCompanies = [];
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('novaspark_admin_companies') : null;
    if (raw) adminCompanies = JSON.parse(raw);
  } catch (e) {}
  const localDefaultComp = adminCompanies.find(c => c.isDefault) || adminCompanies[0] || {};

  const companyName =
    companyInfo?.name ||
    companyInfo?.companyName ||
    savedSetup?.companyName ||
    localDefaultComp?.name ||
    'RR Security & Facilities';

  const companyAddress =
    (companyInfo?.address && companyInfo.address !== '—' ? companyInfo.address : null) ||
    (savedSetup?.address && savedSetup.address !== '—' ? savedSetup.address : null) ||
    (localDefaultComp?.address && localDefaultComp.address !== '—' ? localDefaultComp.address : null) ||
    'G-75/A, GROUND FLOOR, BLOCK-G, M.B. EXTN., BADARPUR, NEW DELHI, 110044';

  const cleanPf = [
    companyInfo?.employerPfCode,
    companyInfo?.pfCode,
    companyInfo?.pfNo,
    companyInfo?.epfNo,
    savedSetup?.employerPfCode,
    savedSetup?.pfCode,
    localDefaultComp?.employerPfCode,
    localDefaultComp?.pfCode,
  ].find((v) => v && typeof v === 'string' && !['—', '-', '–', 'null', 'undefined', 'N/A', 'NA', ''].includes(v.trim()));
  const pfNo = cleanPf || '—';

  const cleanEsi = [
    companyInfo?.employerEsiCode,
    companyInfo?.esiCode,
    companyInfo?.esicNo,
    companyInfo?.esiNo,
    savedSetup?.employerEsiCode,
    savedSetup?.esiCode,
    localDefaultComp?.employerEsiCode,
    localDefaultComp?.esiCode,
  ].find((v) => v && typeof v === 'string' && !['—', '-', '–', 'null', 'undefined', 'N/A', 'NA', ''].includes(v.trim()));
  const esiNo = cleanEsi || '—';
  const monthLabel = period?.monthLabel || period?.month || filters?.month || '';
  const toDate = period?.toDate || new Date().toISOString().slice(0, 10);

  const clientName =
    clientInfo?.name ||
    clientInfo?.clientName ||
    establishmentInfo?.establishmentName ||
    (filters?.company && filters.company !== 'All Companies' ? filters.company : null) ||
    records[0]?.clientName ||
    records[0]?.site ||
    '';

  // Dynamic sums fallback from records if totals not fully provided
  const grandGross = totals?.grandGross ?? records.reduce((s, r) => s + (Number(r.grossSalary) || 0), 0);
  const grandDeductions = totals?.grandDeductions ?? records.reduce((s, r) => s + (Number(r.grossDeduct) || 0), 0);
  const grandNet = totals?.grandNet ?? records.reduce((s, r) => s + (Number(r.netPayableNumber ?? r.netPayable) || 0), 0);

  // Exporters
  const handleDownloadPdf = () => {
    downloadSalarySheetFormat1Pdf(
      records,
      companyInfo,
      period,
      totals,
      pfSummary,
      esiSummary,
      ptSummary,
      earningSummary,
      deductionSummary,
      { mode: 'download', clientInfo, filters }
    );
  };

  const handlePrint = () => {
    downloadSalarySheetFormat1Pdf(
      records,
      companyInfo,
      period,
      totals,
      pfSummary,
      esiSummary,
      ptSummary,
      earningSummary,
      deductionSummary,
      { mode: 'print', clientInfo, filters }
    );
  };

  const handleDownloadExcel = () => {
    downloadSalarySheetFormat1Excel(
      records,
      companyInfo,
      period,
      totals,
      pfSummary,
      esiSummary,
      ptSummary,
      earningSummary,
      deductionSummary,
      { format: 'xlsx', clientInfo, filters }
    );
  };

  const handleDownloadCsv = () => {
    downloadSalarySheetFormat1Csv(
      records,
      companyInfo,
      period,
      totals,
      pfSummary,
      esiSummary,
      ptSummary,
      earningSummary,
      deductionSummary,
      { clientInfo, filters }
    );
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar (Web UI only - excluded from document print/download) */}
      <div className={`${styles.toolbar} no-print`} data-no-print="true" data-html2canvas-ignore="true">
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={15} />
            Statutory Wage/Salary Register (Salary Sheet Format 1)
          </span>
          <span className={styles.metaText}>
            Period: <strong>{monthLabel}</strong>
          </span>
          <span className={styles.metaText}>
            Establishment: <strong>{companyName}</strong>
          </span>
          {clientName && (
            <span className={styles.metaText}>
              Client / Site: <strong>{clientName}</strong>
            </span>
          )}
          <span className={styles.metaText}>
            Records: <strong>{records.length} Employees</strong>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleDownloadPdf}
            title="Download Official PDF Report"
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
            title="Download CSV"
          >
            <FileText size={14} /> CSV
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Official Document"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (Web UI only - excluded from official report document) */}
      <div className={`${styles.kpiBar} no-print`} data-no-print="true" data-html2canvas-ignore="true">
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Employees</span>
          <span className={`${styles.kpiValue} ${styles.kpiBlue}`}>{records.length}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Gross Salary</span>
          <span className={styles.kpiValue}>₹{grandGross.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Deductions</span>
          <span className={`${styles.kpiValue} ${styles.kpiPurple}`}>₹{grandDeductions.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Net Payable</span>
          <span className={`${styles.kpiValue} ${styles.kpiGreen}`}>₹{grandNet.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Official Statutory Document Sheet Layout (Multi-page Container) */}
      <div className={styles.printableReportContainer} data-report-sheet="true">
        {/* Page 1: Detailed Employee Register Sheet */}
        <div className={styles.paper} data-page="1">
          {/* Document Header matching Image 2 */}
          <div className={styles.docHeader}>
          <div className={styles.docCompanyInfo}>
            <h1 className={styles.docCompanyName}>{companyName}</h1>
            <p className={styles.docCompanyAddress}>{companyAddress}</p>
          </div>
          <div className={styles.statutoryRulesBlock}>
            <div>(1) Form under Rule - 6 of Equal Remuneration Rules 1976.</div>
            <div>(2) Form under Rule - 21(4),25(2),26(1) and 26(2) of Gujarat Minimum Wages Rules 1961</div>
            <div>(3) Form under Rule - 6 of Payment of Wages Gujarat Rules, 1963.</div>
            <div>(4) Form 17 under Rule - 78 of Contract Labour (Regulation &amp; Abolition) Gujarat, Rules 1972</div>
            <div>(5) Form under Rule - 52(2) of Inter State Migrant Workers (Gujarat) Rules 1981</div>
          </div>
        </div>

        {/* Sub Meta Bar */}
        <div className={styles.subMetaBar}>
          <div className={styles.metaColLeft}>
            <div>PF No :- {pfNo}</div>
            <div>ESI No :- {esiNo}</div>
            <div style={{ marginTop: '2px', fontWeight: 'normal', fontSize: '0.72rem' }}>
              Date of Payment :- {toDate}
            </div>
          </div>
          <div className={styles.metaColCenter}>
            Wage/Salary Register
          </div>
          <div className={styles.metaColRight}>
            <div>For The Month Of &nbsp;{monthLabel}</div>
            {clientName && <div style={{ fontSize: '0.72rem', marginTop: '2px', fontWeight: 600 }}>Client: {clientName}</div>}
          </div>
        </div>

        {/* Multi-Tier Salary Register Table */}
        <div className={styles.tableWrap}>
          <table className={styles.salaryTable}>
            <thead>
              <tr>
                <th rowSpan="2" style={{ width: '28px' }}>Sr.<br />No.</th>
                <th rowSpan="2" style={{ minWidth: '150px' }}>
                  Employee Name<br />
                  <span style={{ fontWeight: 'normal', fontSize: '0.68rem' }}>Designation<br />Department</span>
                </th>
                <th rowSpan="2" style={{ width: '55px' }}>Emp. ID</th>
                <th rowSpan="2" style={{ minWidth: '95px' }}>
                  Details<br />of<br />Attendance
                </th>
                <th rowSpan="2" style={{ minWidth: '95px' }}>
                  Rate of<br />Wages
                </th>
                <th colSpan="4" className={styles.groupHeader}>Earnings</th>
                <th rowSpan="2" style={{ minWidth: '75px' }}>
                  Gross<br />Salary
                </th>
                <th colSpan="4" className={styles.groupHeader}>Deduction</th>
                <th rowSpan="2" style={{ minWidth: '65px' }}>
                  Gross<br />Deduct.
                </th>
                <th rowSpan="2" style={{ minWidth: '80px' }}>
                  Net<br />Payable
                </th>
                <th rowSpan="2" style={{ minWidth: '120px' }}>
                  Signature
                </th>
              </tr>
              <tr>
                {/* Earnings Sub-columns */}
                <th className={styles.subHeader}>BASIC<br />DA</th>
                <th className={styles.subHeader}>HRA<br />OTH.All</th>
                <th className={styles.subHeader}>CONV</th>
                <th className={styles.subHeader}>SP.All<br />OT/PIB</th>

                {/* Deductions Sub-columns */}
                <th className={styles.subHeader}>P.F<br />ESI</th>
                <th className={styles.subHeader}>P.T.<br />I.T. / LWF</th>
                <th className={styles.subHeader}>Advance<br />Loan / Food</th>
                <th className={styles.subHeader}>Oth.Ded<br />E/Mbill</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, idx) => {
                const att = row.attendance || {};
                const rate = row.rateOfWages || {};
                const earn = row.earnings || {};
                const ded = row.deductions || {};

                return (
                  <tr key={row.employeeId ? `${row.employeeId}-${idx}` : `salary-row-${idx}`}>
                    {/* 1. Sr. No. */}
                    <td className={styles.center} style={{ fontWeight: 700 }}>
                      {row.srNo || idx + 1}
                    </td>

                    {/* 2. Employee Details */}
                    <td>
                      <div className={styles.empNameMain}>{row.name}</div>
                      <div className={styles.empSub}>{row.designation}</div>
                      <div className={styles.empSub} style={{ fontWeight: 600 }}>{row.department}</div>
                      <div className={styles.empSub}>UAN No:{row.uan || ''}</div>
                      <div className={styles.empSub}>PF.No {row.pfNo || ''}</div>
                      <div className={styles.empSub}>ESI No:{row.esiNo || ''}</div>
                    </td>

                    {/* 3. Emp. ID */}
                    <td className={styles.center} style={{ fontWeight: 700 }}>
                      {row.employeeId}
                    </td>

                    {/* 4. Details of Attendance */}
                    <td>
                      <div className={styles.metricList}>
                        <div className={styles.metricRow}><span>WD</span><span>{att.wd || '30.00'}</span></div>
                        <div className={styles.metricRow}><span>WO</span><span>{att.wo || '0.00'}</span></div>
                        <div className={styles.metricRow}><span>PH</span><span>{att.ph || '0.00'}</span></div>
                        <div className={styles.metricRow}><span>PD</span><span>{att.pd || '0.00'}</span></div>
                        <div className={styles.metricRow}><span>PL</span><span>{att.pl || '0.00'}</span></div>
                        <div className={styles.metricRow}><span>CL</span><span>{att.cl || '0.00'}</span></div>
                        <div className={styles.metricRow}><span>S.L.</span><span>{att.sl || '0.00'}</span></div>
                        <div className={styles.metricRow}><span>ML/Adj</span><span>{att.mlAdj || '0.00'}</span></div>
                        <div className={styles.metricTotalRow}>
                          <span>TOT</span><span>{att.tot || '0.00'}</span>
                        </div>
                      </div>
                    </td>

                    {/* 5. Rate of Wages */}
                    <td>
                      <div className={styles.metricList}>
                        <div className={styles.metricRow}><span>BASIC</span><span>{rate.basic || 0}</span></div>
                        <div className={styles.metricRow}><span>DA</span><span>{rate.da || 0}</span></div>
                        <div className={styles.metricRow}><span>HRA</span><span>{rate.hra || 0}</span></div>
                        <div className={styles.metricRow}><span>CONV</span><span>{rate.conv || 0}</span></div>
                        <div className={styles.metricRow}><span>SP.All</span><span>{rate.spAll || 0}</span></div>
                        <div className={styles.metricRow}><span>OTH.All</span><span>{rate.othAll || 0}</span></div>
                        <div className={styles.metricTotalRow}>
                          <span>Total</span><span>{rate.total || 0}</span>
                        </div>
                      </div>
                    </td>

                    {/* 6. Earnings - BASIC / DA */}
                    <td className={styles.stackedCell}>
                      <div>{earn.basic || 0}</div>
                      <div className={styles.stackedCellSecondary}>{earn.da || 0}</div>
                    </td>

                    {/* 7. Earnings - HRA / OTH.All */}
                    <td className={styles.stackedCell}>
                      <div>{earn.hra || 0}</div>
                      <div className={styles.stackedCellSecondary}>{earn.othAll || 0}</div>
                    </td>

                    {/* 8. Earnings - CONV */}
                    <td className={styles.stackedCell}>
                      <div>{earn.conv || 0}</div>
                    </td>

                    {/* 9. Earnings - SP.All / OT/PIB */}
                    <td className={styles.stackedCell}>
                      <div>{earn.spAll || 0}</div>
                      <div className={styles.stackedCellSecondary}>{earn.otPib || 0}</div>
                    </td>

                    {/* 10. Gross Salary (Gross, P: pfWage, E: esiWage) */}
                    <td className={styles.grossCell}>
                      <div>{(row.grossSalary || 0).toLocaleString('en-IN')}</div>
                      {row.pfWage > 0 && <div className={styles.peBase}>P {row.pfWage.toLocaleString('en-IN')}</div>}
                      {row.esiWage > 0 && <div className={styles.peBase}>E {row.esiWage.toLocaleString('en-IN')}</div>}
                    </td>

                    {/* 11. Deduction - P.F / ESI */}
                    <td className={styles.stackedCell}>
                      <div>{ded.pf || 0}</div>
                      <div className={styles.stackedCellSecondary}>{ded.esi || 0}</div>
                    </td>

                    {/* 12. Deduction - P.T. / I.T. / LWF */}
                    <td className={styles.stackedCell}>
                      <div>{ded.pt || 0}</div>
                      <div className={styles.stackedCellSecondary}>{ded.it || 0}</div>
                      <div className={styles.stackedCellSecondary}>{ded.lwf || 0}</div>
                    </td>

                    {/* 13. Deduction - Advance / LOAN / Food */}
                    <td className={styles.stackedCell}>
                      <div>{ded.advance || 0}</div>
                      <div className={styles.stackedCellSecondary}>{ded.loan || 0}</div>
                      <div className={styles.stackedCellSecondary}>{ded.food || 0}</div>
                    </td>

                    {/* 14. Deduction - Oth.Ded / E/Mbill */}
                    <td className={styles.stackedCell}>
                      <div>{ded.othDed || 0}</div>
                      <div className={styles.stackedCellSecondary}>{ded.eMbill || 0}</div>
                    </td>

                    {/* 15. Gross Deduct. */}
                    <td className={styles.right} style={{ fontWeight: 700 }}>
                      {(row.grossDeduct || 0).toLocaleString('en-IN')}
                    </td>

                    {/* 16. Net Payable */}
                    <td className={styles.netPayCell}>
                      {(row.netPayable || 0).toLocaleString('en-IN')}
                    </td>

                    {/* 17. Signature / Bank */}
                    <td className={styles.bankCell}>
                      <div style={{ color: '#475569' }}>Bank</div>
                      <div className={styles.bankName}>{row.bankName || '—'}</div>
                      <div className={styles.bankAc}>{row.bankAccountNo || '—'}</div>
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row matching Image 2 */}
              {records.length > 0 && (
                <tr className={styles.grandTotalRow}>
                  <td colSpan="3" className={styles.center} style={{ fontSize: '0.85rem' }}>
                    Grand Total
                  </td>

                  {/* Attendance Totals */}
                  <td>
                    <div className={styles.metricList}>
                      <div className={styles.metricRow}><span>Total WO</span><span>{(totals.totalWo || 0).toFixed(2)}</span></div>
                      <div className={styles.metricRow}><span>Total PH</span><span>{(totals.totalPh || 0).toFixed(2)}</span></div>
                      <div className={styles.metricRow}><span>Total PD</span><span>{(totals.totalPd || 0).toFixed(2)}</span></div>
                      <div className={styles.metricRow}><span>Total PL</span><span>{(totals.totalPl || 0).toFixed(2)}</span></div>
                      <div className={styles.metricRow}><span>Total CL</span><span>{(totals.totalCl || 0).toFixed(2)}</span></div>
                      <div className={styles.metricRow}><span>Total S.L.</span><span>{(totals.totalSl || 0).toFixed(2)}</span></div>
                      <div className={styles.metricRow}><span>ML/Adj</span><span>{(totals.totalMlAdj || 0).toFixed(2)}</span></div>
                    </div>
                  </td>

                  {/* Rate Totals */}
                  <td className={styles.right}>
                    {totals.totalRateTotal ? totals.totalRateTotal.toLocaleString('en-IN') : ''}
                  </td>

                  {/* Earnings Totals */}
                  <td className={styles.stackedCell}>
                    <div>{totals.grandBasic || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandDa || 0}</div>
                  </td>
                  <td className={styles.stackedCell}>
                    <div>{totals.grandHra || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandOthAll || 0}</div>
                  </td>
                  <td className={styles.stackedCell}>
                    <div>{totals.grandConv || 0}</div>
                  </td>
                  <td className={styles.stackedCell}>
                    <div>{totals.grandSpAll || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandOtPib || 0}</div>
                  </td>

                  {/* Gross Total */}
                  <td className={styles.right} style={{ fontSize: '0.82rem' }}>
                    {(totals.grandGross || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Deductions Totals */}
                  <td className={styles.stackedCell}>
                    <div>{totals.grandPf || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandEsi || 0}</div>
                  </td>
                  <td className={styles.stackedCell}>
                    <div>{totals.grandPt || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandIt || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandLwf || 0}</div>
                  </td>
                  <td className={styles.stackedCell}>
                    <div>{totals.grandAdvance || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandLoan || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandFood || 0}</div>
                  </td>
                  <td className={styles.stackedCell}>
                    <div>{totals.grandOthDed || 0}</div>
                    <div className={styles.stackedCellSecondary}>{totals.grandEMbill || 0}</div>
                  </td>

                  {/* Gross Deductions Total */}
                  <td className={styles.right} style={{ fontSize: '0.82rem' }}>
                    {(totals.grandDeductions || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Net Payable Total */}
                  <td className={styles.right} style={{ fontSize: '0.88rem', color: '#166534' }}>
                    {(totals.grandNet || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Signature Total */}
                  <td className={styles.center} style={{ fontSize: '0.75rem' }}>
                    For {companyName}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page 2: Dedicated Statutory Summary & Reconciliation Sheet (Separate Document Sheet) */}
      <div className={`${styles.paper} ${styles.summaryPageSheet}`} data-page="2">
        {/* Summary Page Document Header */}
        <div className={styles.summaryDocHeader}>
            <div className={styles.summaryDocHeaderLeft}>
              <h2 className={styles.summaryDocCompanyName}>{companyName}</h2>
              <p className={styles.summaryDocCompanyAddress}>{companyAddress}</p>
              <div className={styles.summaryDocMetaRow}>
                <span><strong>PF No:</strong> {pfNo}</span>
                <span><strong>ESI No:</strong> {esiNo}</span>
                <span><strong>Date of Payment:</strong> {toDate}</span>
              </div>
            </div>
            <div className={styles.summaryDocHeaderRight}>
              <div className={styles.summaryDocTitle}>WAGE / SALARY REGISTER</div>
              <div className={styles.summaryDocBadge}>STATUTORY RECONCILIATION &amp; SUMMARY STATEMENT</div>
              <div className={styles.summaryDocMonth}>
                For The Month Of: <strong>{monthLabel}</strong>
              </div>
              {clientName && (
                <div className={styles.summaryDocClient}>
                  Client / Site: <strong>{clientName}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Spacious 2-Column Summary Grid */}
          <div className={styles.summaryGridWrap}>
            {/* Left Column: PF, ESI, PT Summaries & Strength */}
            <div className={styles.summaryColLeft}>
              {/* 1. PF SUMMARY */}
              <div className={styles.summaryBox}>
                <div className={styles.summaryBoxHeader}>
                  <span className={styles.summaryTitle}>PF SUMMARY STATEMENT</span>
                  <span className={styles.summarySubtitle}>Employees' Provident Fund Act, 1952</span>
                </div>
                <table className={styles.summaryTable}>
                  <thead>
                    <tr>
                      <th>PF Wages</th>
                      <th>Strn.</th>
                      <th>EE (12%)</th>
                      <th>ER (Diff)</th>
                      <th>A/C - 1</th>
                      <th>A/C 10</th>
                      <th>A/C 2</th>
                      <th>A/C - 21</th>
                      <th>A/C - 22</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{(pfSummary.pfWages || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'center' }}>{pfSummary.strn || 0}</td>
                      <td>{(pfSummary.ee || 0).toLocaleString('en-IN')}</td>
                      <td>{(pfSummary.erDiff || 0).toLocaleString('en-IN')}</td>
                      <td>{(pfSummary.ac1 || 0).toLocaleString('en-IN')}</td>
                      <td>{(pfSummary.ac10 || 0).toLocaleString('en-IN')}</td>
                      <td>{(pfSummary.ac2 || 0).toLocaleString('en-IN')}</td>
                      <td>{(pfSummary.ac21 || 0).toLocaleString('en-IN')}</td>
                      <td>{(pfSummary.ac22 || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 800, background: '#f8fafc' }}>
                        {(pfSummary.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className={styles.reconciliationRow}>
                      <td>{(pfSummary.pfWages || 0).toLocaleString('en-IN')}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td>{(pfSummary.pfWages || 0).toLocaleString('en-IN')}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. ESI & PT Summary */}
              <div className={styles.ptSummaryWrap}>
                {/* ESI Summary */}
                <div className={styles.summaryBox} style={{ flex: 1.4 }}>
                  <div className={styles.summaryBoxHeader}>
                    <span className={styles.summaryTitle}>ESI SUMMARY</span>
                    <span className={styles.summarySubtitle}>ESIC Act, 1948</span>
                  </div>
                  <table className={styles.summaryTable}>
                    <thead>
                      <tr>
                        <th>ESI Wages</th>
                        <th>Strn</th>
                        <th>EE Share (0.75%)</th>
                        <th>ER.Share (3.25%)</th>
                        <th>Total ESI (4%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{(esiSummary.esiWages || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'center' }}>{esiSummary.strn || 0}</td>
                        <td>{(esiSummary.eeShare || 0).toLocaleString('en-IN')}</td>
                        <td>{(esiSummary.erShare || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 800, background: '#f8fafc' }}>
                          {(esiSummary.totalEsi || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PT Summary */}
                <div className={styles.summaryBox} style={{ flex: 0.9 }}>
                  <div className={styles.summaryBoxHeader}>
                    <span className={styles.summaryTitle}>P.T. SUMMARY</span>
                    <span className={styles.summarySubtitle}>Professional Tax</span>
                  </div>
                  <table className={styles.summaryTable}>
                    <thead>
                      <tr>
                        <th>P.T. Head</th>
                        <th>Count</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', fontWeight: 600 }}>PT Deducted</td>
                        <td style={{ textAlign: 'center' }}>{ptSummary.ptCount || 0}</td>
                        <td style={{ fontWeight: 700 }}>₹{(ptSummary.ptAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', fontWeight: 600 }}>PT Total</td>
                        <td style={{ textAlign: 'center' }}>{ptSummary.ptCount || 0}</td>
                        <td style={{ fontWeight: 800, background: '#f8fafc' }}>
                          ₹{(ptSummary.ptAmount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Workforce Strength Indicators */}
              <div className={styles.emplStrengthCard}>
                <div className={styles.strengthItem}>
                  <span className={styles.strengthLabel}>Total Strength:</span>
                  <strong className={styles.strengthValue}>{records.length} Employees</strong>
                </div>
                <div className={styles.strengthItem}>
                  <span className={styles.strengthLabel}>Active Workforce:</span>
                  <span className={styles.strengthValue}>
                    {records.filter((r) => r.status !== 'Inactive').length || records.length}
                  </span>
                </div>
                <div className={styles.strengthItem}>
                  <span className={styles.strengthLabel}>Excluded Strength:</span>
                  <span className={styles.strengthValue}>0</span>
                </div>
              </div>
            </div>

            {/* Right Column: Earning & Deduction Summary + Net Pay Card */}
            <div className={styles.summaryColRight}>
              <div className={styles.summaryBox}>
                <div className={styles.summaryBoxHeader}>
                  <span className={styles.summaryTitle}>EARNING &amp; DEDUCTION STATEMENT</span>
                  <span className={styles.summarySubtitle}>Consolidated Monthly Breakup</span>
                </div>
                <table className={styles.sideBySideTable}>
                  <thead>
                    <tr>
                      <th colSpan="2" className={styles.earningColHeader}>EARNING SUMMARY (₹)</th>
                      <th colSpan="2" className={styles.deductionColHeader}>DEDUCTION SUMMARY (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.headLabel}>BASIC</td>
                      <td className={styles.right}>{(earningSummary.basic ?? totals.grandBasic ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>P.F</td>
                      <td className={styles.right}>{(deductionSummary.pf ?? totals.grandPf ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>DA</td>
                      <td className={styles.right}>{(earningSummary.da ?? totals.grandDa ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>ESI</td>
                      <td className={styles.right}>{(deductionSummary.esi ?? totals.grandEsi ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>HRA</td>
                      <td className={styles.right}>{(earningSummary.hra ?? totals.grandHra ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>P.T.</td>
                      <td className={styles.right}>{(deductionSummary.pt ?? totals.grandPt ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>CONV</td>
                      <td className={styles.right}>{(earningSummary.conv ?? totals.grandConv ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>I.T. (TDS)</td>
                      <td className={styles.right}>{(deductionSummary.it ?? totals.grandIt ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>SP.All</td>
                      <td className={styles.right}>{(earningSummary.spAll ?? totals.grandSpAll ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>LOAN</td>
                      <td className={styles.right}>{(deductionSummary.loan ?? totals.grandLoan ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>OTH.All</td>
                      <td className={styles.right}>{(earningSummary.othAll ?? totals.grandOthAll ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>Advance</td>
                      <td className={styles.right}>{(deductionSummary.advance ?? totals.grandAdvance ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>OT/PIB</td>
                      <td className={styles.right}>{(earningSummary.otPib ?? totals.grandOtPib ?? 0).toLocaleString('en-IN')}</td>
                      <td className={styles.headLabel}>LWF</td>
                      <td className={styles.right}>{(deductionSummary.lwf ?? totals.grandLwf ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>—</td>
                      <td className={styles.right}>—</td>
                      <td className={styles.headLabel}>Oth.Ded</td>
                      <td className={styles.right}>{(deductionSummary.othDed ?? totals.grandOthDed ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>—</td>
                      <td className={styles.right}>—</td>
                      <td className={styles.headLabel}>Food</td>
                      <td className={styles.right}>{(deductionSummary.food ?? totals.grandFood ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className={styles.headLabel}>—</td>
                      <td className={styles.right}>—</td>
                      <td className={styles.headLabel}>E/Mbill</td>
                      <td className={styles.right}>{(deductionSummary.eMbill ?? totals.grandEMbill ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className={styles.subTotalRow}>
                      <td><strong>Gross Salary</strong></td>
                      <td className={styles.right}>
                        <strong>₹{(earningSummary.grossSalary ?? totals.grandGross ?? 0).toLocaleString('en-IN')}</strong>
                      </td>
                      <td><strong>Gross Ded.</strong></td>
                      <td className={styles.right}>
                        <strong>₹{(deductionSummary.grossDed ?? totals.grandDeductions ?? 0).toLocaleString('en-IN')}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Pay Highlight Box */}
              <div className={styles.netPayHighlightBox}>
                <div className={styles.netPayHighlightText}>
                  <span className={styles.netPayHighlightLabel}>TOTAL NET SALARY DISBURSED</span>
                  <div className={styles.netPayWords}>
                    ({numberToIndianWords(totals.grandNet ?? grandNet ?? 0)})
                  </div>
                </div>
                <div className={styles.netPayHighlightValue}>
                  ₹{(totals.grandNet ?? grandNet ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Three-Column Statutory Signatory Verification Block */}
          <div className={styles.summarySignSection}>
            <div className={styles.signatoryCard}>
              <div className={styles.signatoryRole}>PREPARED BY</div>
              <div className={styles.signatoryPlaceholder}></div>
              <div className={styles.signatoryTitle}>HR / Payroll Executive</div>
            </div>
            <div className={styles.signatoryCard}>
              <div className={styles.signatoryRole}>CHECKED &amp; VERIFIED BY</div>
              <div className={styles.signatoryPlaceholder}></div>
              <div className={styles.signatoryTitle}>Finance &amp; Accounts Officer</div>
            </div>
            <div className={styles.signatoryCard}>
              <div className={styles.signatoryRole}>FOR {companyName.toUpperCase()}</div>
              <div className={styles.signatoryPlaceholder}></div>
              <div className={styles.signatoryTitle}>Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
