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
  downloadEsiForm7Excel,
  downloadEsiForm7Csv,
  downloadEsiForm7Pdf,
} from '../../utils/esiForm7Export';
import styles from './EsiForm7ReportView.module.css';

/**
 * Statutory ESI - Form 7 - Half Yearly Report (Option 1) Component
 * FORM 7 [REGULATION - 32, APPENDIX - F]
 * REGISTER OF EMPLOYEES & HALF-YEARLY RETURN OF ESI CONTRIBUTIONS
 * Matches exact 29-column structure and bottom summary rows from statutory reference.
 */
export default function EsiForm7ReportView({
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

  const m1 = months[0]?.name || 'April';
  const m2 = months[1]?.name || 'May';
  const m3 = months[2]?.name || 'June';
  const m4 = months[3]?.name || 'July';
  const m5 = months[4]?.name || 'August';
  const m6 = months[5]?.name || 'September';

  const periodLabel = period?.label || '01 Apr 2026 To 30 Sep 2026';
  const clientName = clientInfo?.name || filters?.company || 'All Clients';

  const grandWages = totals?.grandTotalWages ?? records.reduce((s, r) => s + (Number(r.totalWages) || 0), 0);
  const grandEmpShare = totals?.grandTotalEmployeeContribution ?? records.reduce((s, r) => s + (Number(r.totalEmployeeContribution) || 0), 0);
  const grandEmployerShare = totals?.grandTotalEmployerContribution ?? Math.round(grandWages * 0.0325);
  const grandTotalPayable = grandEmpShare + grandEmployerShare;

  const summaries = monthlySummaries.length === 6 ? monthlySummaries : [
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
    { totalWages: 0, totalEmployeeShare: 0, contributingEmployeesCount: 0 },
  ];

  // Exporters
  const handleDownloadPdf = () => {
    downloadEsiForm7Pdf(records, companyInfo, period, totals, summaries, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadEsiForm7Pdf(records, companyInfo, period, totals, summaries, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsiForm7Excel(records, companyInfo, period, totals, summaries, { format: 'xlsx' });
  };

  const handleDownloadCsv = () => {
    downloadEsiForm7Csv(records, companyInfo, period, totals, summaries, { format: 'csv' });
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={15} />
            FORM 7 [Regulation - 32, Appendix - F]
          </span>
          <span className={styles.metaText}>
            Contribution Period: <strong>{periodLabel}</strong>
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

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Insured Employees</span>
          <span className={`${styles.kpiValue} ${styles.kpiBlue}`}>{records.length}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Wages (Half-Year)</span>
          <span className={styles.kpiValue}>₹{grandWages.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Employees Share (0.75%)</span>
          <span className={`${styles.kpiValue} ${styles.kpiPurple}`}>₹{grandEmpShare.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Employers Share (3.25%)</span>
          <span className={`${styles.kpiValue} ${styles.kpiOrange}`}>₹{grandEmployerShare.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Document Paper Layout matching Image 1 */}
      <div className={styles.paper}>
        {/* Top Statutory Header matching Image 1 */}
        <div className={styles.statutoryHeader}>
          <div className={styles.headerLeft}>
            FORM 7
          </div>
          <div className={styles.headerCenter}>
            <h1 className={styles.mainTitle}>REGISTER OF EMPLOYEES</h1>
            <div className={styles.subTitle}>REGULATION - 32 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; APPENDIX - F</div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.form6Line}>Form 6 Submitted on Date: ............................................</div>
            <div className={styles.contrYear}>Contribution for the Year &nbsp;{periodLabel}</div>
          </div>
        </div>

        {/* 29-Column Table matching Image 1 */}
        <div className={styles.tableWrap}>
          <table className={styles.statutoryTable}>
            <thead>
              {/* Level 1 Headers */}
              <tr>
                <th rowSpan={2} style={{ width: '28px' }}>Sl.<br />No</th>
                <th rowSpan={2} style={{ minWidth: '70px' }}>Insurance<br />No</th>
                <th rowSpan={2} style={{ minWidth: '130px', textAlign: 'left' }}>Name of<br />Insured<br />Person</th>
                <th rowSpan={2} style={{ minWidth: '70px' }}>Occupa-<br />tion</th>
                <th rowSpan={2} style={{ minWidth: '70px' }}>Dept<br />and<br />shift<br />if any</th>
                <th rowSpan={2} style={{ minWidth: '75px' }}>If appointed<br />during the<br />contr.<br />period<br />date of<br />Appt.</th>

                {/* 6 Monthly Group Headers */}
                <th colSpan={3} className={styles.monthHeaderGroup}>{m1}</th>
                <th colSpan={3} className={styles.monthHeaderGroup}>{m2}</th>
                <th colSpan={3} className={styles.monthHeaderGroup}>{m3}</th>
                <th colSpan={3} className={styles.monthHeaderGroup}>{m4}</th>
                <th colSpan={3} className={styles.monthHeaderGroup}>{m5}</th>
                <th colSpan={3} className={styles.monthHeaderGroup}>{m6}</th>

                <th rowSpan={2} style={{ minWidth: '70px' }}>Total No.<br />of days<br />in contri<br />bution<br />period<br />for which<br />wages<br />paid /<br />payable</th>
                <th rowSpan={2} style={{ minWidth: '75px' }}>Total<br />amount of<br />wages<br />paid/<br />payable in<br />the contri<br />bution<br />period</th>
                <th rowSpan={2} style={{ minWidth: '70px' }}>Total<br />employees<br />contri<br />bution in<br />the<br />contrib<br />ution<br />period</th>
                <th rowSpan={2} style={{ minWidth: '60px' }}>Daily<br />wages<br />Col.<br />26 / 25</th>
                <th rowSpan={2} style={{ minWidth: '85px' }}>Particulars<br />of E.S.I<br />Dispensary<br />Remarks</th>
              </tr>

              {/* Level 2 Headers for the 6 Months */}
              <tr>
                {/* Month 1 */}
                <th style={{ minWidth: '32px' }}>No<br />of<br />Days</th>
                <th style={{ minWidth: '55px' }}>Total<br />amt of<br />wages<br />paid/<br />payable</th>
                <th style={{ minWidth: '45px' }}>Empl.<br />share<br />of<br />contri<br />bution</th>

                {/* Month 2 */}
                <th style={{ minWidth: '32px' }}>No<br />of<br />Days</th>
                <th style={{ minWidth: '55px' }}>Total<br />amt of<br />wages<br />paid/<br />payable</th>
                <th style={{ minWidth: '45px' }}>Empl.<br />share<br />of<br />contri<br />bution</th>

                {/* Month 3 */}
                <th style={{ minWidth: '32px' }}>No<br />of<br />Days</th>
                <th style={{ minWidth: '55px' }}>Total<br />amt of<br />wages<br />paid/<br />payable</th>
                <th style={{ minWidth: '45px' }}>Empl.<br />share<br />of<br />contri<br />bution</th>

                {/* Month 4 */}
                <th style={{ minWidth: '32px' }}>No<br />of<br />Days</th>
                <th style={{ minWidth: '55px' }}>Total<br />amt of<br />wages<br />paid/<br />payable</th>
                <th style={{ minWidth: '45px' }}>Empl.<br />share<br />of<br />contri<br />bution</th>

                {/* Month 5 */}
                <th style={{ minWidth: '32px' }}>No<br />of<br />Days</th>
                <th style={{ minWidth: '55px' }}>Total<br />amt of<br />wages<br />paid/<br />payable</th>
                <th style={{ minWidth: '45px' }}>Empl.<br />share<br />of<br />contri<br />bution</th>

                {/* Month 6 */}
                <th style={{ minWidth: '32px' }}>No<br />of<br />Days</th>
                <th style={{ minWidth: '55px' }}>Total<br />amt of<br />wages<br />paid/<br />payable</th>
                <th style={{ minWidth: '45px' }}>Empl.<br />share<br />of<br />contri<br />bution</th>
              </tr>

              {/* Level 3 Numbered Row 1 to 29 matching Image 1 */}
              <tr className={styles.numRow}>
                <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th>
                <th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th>
                <th>13</th><th>14</th><th>15</th><th>16</th><th>17</th><th>18</th>
                <th>19</th><th>20</th><th>21</th><th>22</th><th>23</th><th>24</th>
                <th>25</th><th>26</th><th>27</th><th>28</th><th>29</th>
              </tr>
            </thead>

            <tbody>
              {records.length > 0 ? (
                records.map((row, idx) => {
                  const m = row.months || [];
                  return (
                    <tr key={row.employeeId || `emp-${idx}`}>
                      {/* 1. Sl. No */}
                      <td className={styles.colCenter}>{row.srNo || idx + 1}</td>

                      {/* 2. Insurance No */}
                      <td className={styles.colCenter} style={{ fontFamily: 'monospace' }}>{row.insuranceNo || '—'}</td>

                      {/* 3. Name of Insured Person */}
                      <td className={`${styles.colLeft} ${styles.nameCell}`}>{row.name}</td>

                      {/* 4. Occupation */}
                      <td className={styles.colLeft}>{row.occupation || '—'}</td>

                      {/* 5. Dept and shift if any */}
                      <td className={styles.colCenter}>{row.department || '—'}</td>

                      {/* 6. Date of Appt */}
                      <td className={styles.colCenter} style={{ fontSize: '0.64rem' }}>{row.dateOfAppointment || '—'}</td>

                      {/* Month 1 (Cols 7, 8, 9) */}
                      <td className={styles.colCenter}>{m[0]?.days ?? 0}</td>
                      <td className={styles.colRight}>{(m[0]?.wages ?? 0).toFixed(2)}</td>
                      <td className={styles.colRight}>{(m[0]?.employeeShare ?? 0).toFixed(2)}</td>

                      {/* Month 2 (Cols 10, 11, 12) */}
                      <td className={styles.colCenter}>{m[1]?.days ?? 0}</td>
                      <td className={styles.colRight}>{(m[1]?.wages ?? 0).toFixed(2)}</td>
                      <td className={styles.colRight}>{(m[1]?.employeeShare ?? 0).toFixed(2)}</td>

                      {/* Month 3 (Cols 13, 14, 15) */}
                      <td className={styles.colCenter}>{m[2]?.days ?? 0}</td>
                      <td className={styles.colRight}>{(m[2]?.wages ?? 0).toFixed(2)}</td>
                      <td className={styles.colRight}>{(m[2]?.employeeShare ?? 0).toFixed(2)}</td>

                      {/* Month 4 (Cols 16, 17, 18) */}
                      <td className={styles.colCenter}>{m[3]?.days ?? 0}</td>
                      <td className={styles.colRight}>{(m[3]?.wages ?? 0).toFixed(2)}</td>
                      <td className={styles.colRight}>{(m[3]?.employeeShare ?? 0).toFixed(2)}</td>

                      {/* Month 5 (Cols 19, 20, 21) */}
                      <td className={styles.colCenter}>{m[4]?.days ?? 0}</td>
                      <td className={styles.colRight}>{(m[4]?.wages ?? 0).toFixed(2)}</td>
                      <td className={styles.colRight}>{(m[4]?.employeeShare ?? 0).toFixed(2)}</td>

                      {/* Month 6 (Cols 22, 23, 24) */}
                      <td className={styles.colCenter}>{m[5]?.days ?? 0}</td>
                      <td className={styles.colRight}>{(m[5]?.wages ?? 0).toFixed(2)}</td>
                      <td className={styles.colRight}>{(m[5]?.employeeShare ?? 0).toFixed(2)}</td>

                      {/* 25. Total Days */}
                      <td className={styles.colCenter} style={{ fontWeight: 700 }}>{row.totalDays ?? 0}</td>

                      {/* 26. Total Wages */}
                      <td className={styles.colRight} style={{ fontWeight: 700 }}>{(row.totalWages ?? 0).toFixed(2)}</td>

                      {/* 27. Total Employee Contribution */}
                      <td className={styles.colRight} style={{ fontWeight: 700 }}>{(row.totalEmployeeContribution ?? 0).toFixed(2)}</td>

                      {/* 28. Daily Wages Col. 26 / 25 */}
                      <td className={styles.colRight}>{(row.dailyWage ?? 0).toFixed(2)}</td>

                      {/* 29. Dispensary Remarks */}
                      <td className={styles.colCenter}>{row.dispensaryRemarks || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={29} className={styles.emptyState}>
                    No insured employee records found for this period.
                  </td>
                </tr>
              )}

              {/* Bottom Summary Row 1: Grand Total of Wages and Employee's share of contribution 0.75% */}
              <tr className={styles.summaryRow}>
                <td colSpan={6} className={styles.summaryLabelCell}>
                  Grand Total of Wages and Employee's share of contribution 0.75%
                </td>
                <td className={styles.colCenter}></td>
                <td className={styles.totalHighlight}>{(summaries[0].totalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(summaries[0].totalEmployeeShare || 0).toFixed(2)}</td>

                <td className={styles.colCenter}></td>
                <td className={styles.totalHighlight}>{(summaries[1].totalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(summaries[1].totalEmployeeShare || 0).toFixed(2)}</td>

                <td className={styles.colCenter}></td>
                <td className={styles.totalHighlight}>{(summaries[2].totalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(summaries[2].totalEmployeeShare || 0).toFixed(2)}</td>

                <td className={styles.colCenter}></td>
                <td className={styles.totalHighlight}>{(summaries[3].totalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(summaries[3].totalEmployeeShare || 0).toFixed(2)}</td>

                <td className={styles.colCenter}></td>
                <td className={styles.totalHighlight}>{(summaries[4].totalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(summaries[4].totalEmployeeShare || 0).toFixed(2)}</td>

                <td className={styles.colCenter}></td>
                <td className={styles.totalHighlight}>{(summaries[5].totalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(summaries[5].totalEmployeeShare || 0).toFixed(2)}</td>

                <td className={styles.colCenter} style={{ fontWeight: 800 }}>{totals?.grandTotalDays || 0}</td>
                <td className={styles.totalHighlight} style={{ fontSize: '0.72rem' }}>{(totals?.grandTotalWages || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight} style={{ fontSize: '0.72rem' }}>{(totals?.grandTotalEmployeeContribution || 0).toFixed(2)}</td>
                <td className={styles.totalHighlight}>{(totals?.overallDailyWage || 0).toFixed(2)}</td>
                <td></td>
              </tr>

              {/* Bottom Summary Row 2: Total number of Employees who have contributed */}
              <tr className={styles.summaryRow}>
                <td colSpan={6} className={styles.summaryLabelCell}>
                  Total number of Employees who have contributed
                </td>
                <td colSpan={3} className={styles.colCenter} style={{ fontWeight: 800 }}>
                  {summaries[0].contributingEmployeesCount || 0}
                </td>
                <td colSpan={3} className={styles.colCenter} style={{ fontWeight: 800 }}>
                  {summaries[1].contributingEmployeesCount || 0}
                </td>
                <td colSpan={3} className={styles.colCenter} style={{ fontWeight: 800 }}>
                  {summaries[2].contributingEmployeesCount || 0}
                </td>
                <td colSpan={3} className={styles.colCenter} style={{ fontWeight: 800 }}>
                  {summaries[3].contributingEmployeesCount || 0}
                </td>
                <td colSpan={3} className={styles.colCenter} style={{ fontWeight: 800 }}>
                  {summaries[4].contributingEmployeesCount || 0}
                </td>
                <td colSpan={3} className={styles.colCenter} style={{ fontWeight: 800 }}>
                  {summaries[5].contributingEmployeesCount || 0}
                </td>
                <td colSpan={5}></td>
              </tr>

              {/* Bottom Summary Row 3: Total Employer's share of contribution 3.25% */}
              <tr className={styles.summaryRow}>
                <td colSpan={6} className={styles.summaryLabelCell}>
                  Total Employer's share of contribution 3.25%
                </td>
                <td colSpan={23} style={{ fontWeight: 800, paddingLeft: '8px' }}>
                  ₹{(grandEmployerShare || 0).toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Bottom Summary Row 4: Total Value of contribution paid : Challan Number and Date */}
              <tr className={styles.summaryRow}>
                <td colSpan={6} className={styles.summaryLabelCell}>
                  Total Value of contribution paid : Challan Number and Date
                </td>
                <td colSpan={23} style={{ fontWeight: 800, paddingLeft: '8px' }}>
                  ₹{(grandTotalPayable || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
