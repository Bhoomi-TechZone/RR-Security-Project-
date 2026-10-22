import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Users,
  Calendar,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadEsiSummaryEmployeePdf,
  downloadEsiSummaryEmployeeExcel,
  downloadEsiSummaryEmployeeCsv,
} from '../../utils/esiSummaryEmployeeExport';
import styles from './EsiSummaryEmployeeReportView.module.css';

/**
 * =========================================================================
 * EMPLOYEE WISE MONTHLY ESI REPORT VIEW
 * Statutory component matching the exact template in Image 1:
 * - 3-Row Bordered Header: Company/Client Name, EMPLOYEE WISE MONTHLY ESI REPORT, FOR THE MONTH OF :M,YYYY
 * - Columns: Sr#, Code, ESI Code, Employee Name, Days, ESI Wages, Employee ESI@ 0.75%, EXEMPTED EMPLYOEES WAGES :
 * - Total Row: Total :Count, Days, ESI Wages, Employee ESI, Exempted Wages
 * - 6-Row Summary Block:
 *   - TOTAL EARNING                  :
 *   - EXEEMPTED EMPLYOEES WAGES :
 *   - ESI WAGES                      :
 *   - EMPLOYEES CONTRIBUTION  : 0.75%
 *   - EMPLOYERS CONTRIBUTION  : 3.25%
 *   - TOTAL CONTRIBUTION      : 4%
 * =========================================================================
 */
export default function EsiSummaryEmployeeReportView({
  reportData = {},
  filters = {},
}) {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const totals = safeData.totals || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const monthLabel = period.monthLabel || `FOR THE MONTH OF :${period.monthNum || ''},${period.year || ''}`;

  const handleDownloadPdf = () => {
    downloadEsiSummaryEmployeePdf(safeData, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadEsiSummaryEmployeePdf(safeData, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsiSummaryEmployeeExcel(safeData);
  };

  const handleDownloadCsv = () => {
    downloadEsiSummaryEmployeeCsv(safeData);
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={15} />
            ESI SUMMARY EMPLOYEE WISE
          </span>
          <span className={styles.monthTag}>
            <Calendar size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px' }} />
            {monthLabel}
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
            title="Download Excel Spreadsheet"
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
            title="Print Official Report"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiCardBlue}`}>
          <span className={styles.kpiLabel}>Total Employees</span>
          <span className={styles.kpiValue}>{totals.count ?? records.length} Employees</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardPurple}`}>
          <span className={styles.kpiLabel}>Total Working Days</span>
          <span className={styles.kpiValue}>{totals.days ?? 0} Days</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardGreen}`}>
          <span className={styles.kpiLabel}>Total ESI Wages</span>
          <span className={styles.kpiValue}>₹{Number(totals.esiWages || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardOrange}`}>
          <span className={styles.kpiLabel}>Exempted Wages</span>
          <span className={styles.kpiValue}>₹{Number(totals.exemptedWages || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className={`${styles.kpiCard} ${styles.kpiCardIndigo}`}>
          <span className={styles.kpiLabel}>Total Contribution (4%)</span>
          <span className={styles.kpiValue}>₹{Number(totals.totalContribution || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Main Statutory Paper Sheet */}
      <div className={styles.paperWrapper}>
        <div className={styles.paperSheet}>
          {/* Header Box with Exact 3 Rows */}
          <div className={styles.headerBox}>
            <div className={`${styles.headerRow} ${styles.companyTitle}`}>
              {headerCompanyName}
            </div>
            <div className={`${styles.headerRow} ${styles.reportSubTitle}`}>
              EMPLOYEE WISE MONTHLY ESI REPORT
            </div>
            <div className={`${styles.headerRow} ${styles.monthTitle}`}>
              {monthLabel}
            </div>
          </div>

          {/* Main Report Table */}
          <table className={styles.reportTable}>
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '27%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={styles.textCenter}>Sr#</th>
                <th className={styles.textCenter}>Code</th>
                <th className={styles.textCenter}>ESI Code</th>
                <th className={styles.textLeft}>Employee Name</th>
                <th className={styles.textCenter}>Days</th>
                <th className={styles.textRight}>ESI Wages</th>
                <th className={styles.textRight}>Employee ESI@ 0.75%</th>
                <th className={styles.textRight}>EXEMPTED EMPLYOEES WAGES :</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.textCenter} style={{ padding: '24px', color: '#64748b' }}>
                    No ESI records found for the selected period and filters.
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr key={r.employeeCode || i}>
                    <td className={styles.textCenter}>{r.srNo || i + 1}</td>
                    <td className={styles.textCenter} style={{ fontWeight: 600 }}>{r.employeeCode || '—'}</td>
                    <td className={styles.textCenter} style={{ fontFamily: 'monospace' }}>{r.esiCode || '—'}</td>
                    <td className={styles.textLeft} style={{ fontWeight: 700 }}>{r.employeeName || '—'}</td>
                    <td className={styles.textCenter}>{r.days ?? 0}</td>
                    <td className={styles.textRight}>{Number(r.esiWages || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>{Number(r.employeeEsi || 0).toLocaleString('en-IN')}</td>
                    <td className={styles.textRight}>{Number(r.exemptedWages || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}

              {/* Total Row */}
              <tr className={styles.totalRow}>
                <td colSpan={4} className={styles.textLeft} style={{ fontWeight: 800 }}>
                  Total :{totals.count ?? records.length}
                </td>
                <td className={styles.textCenter} style={{ fontWeight: 800 }}>{totals.days ?? 0}</td>
                <td className={styles.textRight} style={{ fontWeight: 800 }}>{Number(totals.esiWages || 0).toLocaleString('en-IN')}</td>
                <td className={styles.textRight} style={{ fontWeight: 800 }}>{Number(totals.employeeEsi || 0).toLocaleString('en-IN')}</td>
                <td className={styles.textRight} style={{ fontWeight: 800 }}>{Number(totals.exemptedWages || 0).toLocaleString('en-IN')}</td>
              </tr>

              {/* 6-Row Summary Block Matching Image 1 */}
              <tr className={styles.summaryRow}>
                <td colSpan={4} className={styles.emptyCell}></td>
                <td colSpan={2} className={styles.summaryLabelCell}>TOTAL EARNING &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;:</td>
                <td colSpan={1} className={styles.summaryValCell}>{Number(totals.totalEarning || 0).toLocaleString('en-IN')}</td>
                <td className={styles.emptyCell}></td>
              </tr>
              <tr className={styles.summaryRow}>
                <td colSpan={4} className={styles.emptyCell}></td>
                <td colSpan={2} className={styles.summaryLabelCell}>EXEEMPTED EMPLYOEES WAGES :</td>
                <td colSpan={1} className={styles.summaryValCell}>{Number(totals.exemptedWages || 0).toLocaleString('en-IN')}</td>
                <td className={styles.emptyCell}></td>
              </tr>
              <tr className={styles.summaryRow}>
                <td colSpan={4} className={styles.emptyCell}></td>
                <td colSpan={2} className={styles.summaryLabelCell}>ESI WAGES &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; :</td>
                <td colSpan={1} className={styles.summaryValCell}>{Number(totals.esiWages || 0).toLocaleString('en-IN')}</td>
                <td className={styles.emptyCell}></td>
              </tr>
              <tr className={styles.summaryRow}>
                <td colSpan={4} className={styles.emptyCell}></td>
                <td colSpan={2} className={styles.summaryLabelCell}>EMPLOYEES CONTRIBUTION &nbsp;: 0.75%</td>
                <td colSpan={1} className={styles.summaryValCell}>{Number(totals.employeeEsi || 0).toLocaleString('en-IN')}</td>
                <td className={styles.emptyCell}></td>
              </tr>
              <tr className={styles.summaryRow}>
                <td colSpan={4} className={styles.emptyCell}></td>
                <td colSpan={2} className={styles.summaryLabelCell}>EMPLOYERS CONTRIBUTION &nbsp;: 3.25%</td>
                <td colSpan={1} className={styles.summaryValCell}>{Number(totals.employerEsi || 0).toLocaleString('en-IN')}</td>
                <td className={styles.emptyCell}></td>
              </tr>
              <tr className={styles.summaryRow}>
                <td colSpan={4} className={styles.emptyCell}></td>
                <td colSpan={2} className={styles.summaryLabelCell}>TOTAL CONTRIBUTION &nbsp; &nbsp; &nbsp;: 4%</td>
                <td colSpan={1} className={styles.summaryValCell}>{Number(totals.totalContribution || 0).toLocaleString('en-IN')}</td>
                <td className={styles.emptyCell}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
