import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  MapPin,
  Users,
  Calendar,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadEsiSummaryLocationPdf,
  downloadEsiSummaryLocationExcel,
  downloadEsiSummaryLocationCsv,
} from '../../utils/esiSummaryLocationExport';
import styles from './EsiSummaryLocationReportView.module.css';

/**
 * =========================================================================
 * LOCATION WISE ESI SUMMARY REPORT VIEW
 * Statutory component matching the exact layout in Image 1:
 * - Header: Company Name, ESI Summary Report From month: M.YYYY To M.YYYY, Page # 1
 * - Separators: Dashed lines (ASCII / Print style)
 * - Columns: SrNo | Location Name | Month | TotEmp | Atten. | ESI Wages | 0.75 % | 3.25 % | % | % | % | Total Amt | Year
 * - Grand Total Row
 * =========================================================================
 */
export default function EsiSummaryLocationReportView({
  reportData = {},
  filters = {},
}) {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const grandTotal = safeData.grandTotal || {};
  const companyInfo = safeData.companyInfo || {};
  const clientInfo = safeData.clientInfo || {};
  const period = safeData.period || {};

  const headerCompanyName = clientInfo?.name || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const periodStr = period.periodStr || `From month: ${period.fromMonthNum || 9}.${period.fromYear || 2026} To ${period.toMonthNum || 9}.${period.toYear || 2026}`;

  const handleDownloadPdf = () => {
    downloadEsiSummaryLocationPdf(safeData, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadEsiSummaryLocationPdf(safeData, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadEsiSummaryLocationExcel(safeData);
  };

  const handleDownloadCsv = () => {
    downloadEsiSummaryLocationCsv(safeData);
  };

  return (
    <div className={styles.container}>
      {/* 1. Quick KPI Summary Badges */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Locations</span>
            <span className={styles.kpiValue}>{records.length} Sites</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <MapPin size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Insured Staff</span>
            <span className={styles.kpiValue}>{grandTotal.totEmp || 0} Staff</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <Users size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Attendance</span>
            <span className={styles.kpiValue}>{Number(grandTotal.atten || 0).toFixed(2)} Days</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconIndigo}`}>
            <Calendar size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total ESI Wages</span>
            <span className={styles.kpiValue}>
              ₹{Number(grandTotal.esiWages || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>
            <Coins size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total ESI Contribution</span>
            <span className={styles.kpiValue}>
              ₹{Number(grandTotal.totalAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconOrange}`}>
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* 2. Export & Action Bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionTitle}>
          <FileText size={18} color="#2563eb" />
          <span>Location Wise ESI Summary Report</span>
        </div>
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleDownloadPdf}
            title="Download formatted statutory PDF"
          >
            <Download size={14} />
            Download PDF
          </button>
          <button
            type="button"
            className={styles.btnSuccess}
            onClick={handleDownloadExcel}
            title="Download Excel Workbook"
          >
            <FileSpreadsheet size={14} />
            Download Excel
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handleDownloadCsv}
            title="Download CSV file"
          >
            <Download size={14} />
            CSV
          </button>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={handlePrint}
            title="Print report"
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </div>

      {/* 3. Official Printable Paper Container */}
      <div className={styles.paperCard}>
        {/* Document Header */}
        <div className={styles.docHeader}>
          <div className={styles.docTitleBlock}>
            <div className={styles.companyName}>{headerCompanyName}</div>
            <div className={styles.reportSubTitle}>
              ESI Summary Report {periodStr}
            </div>
          </div>
          <div className={styles.pageNumber}>Page # 1</div>
        </div>

        {/* Table Matching Image 1 */}
        <div className={styles.tableWrapper}>
          <table className={styles.statutoryTable}>
            <thead>
              <tr>
                <th className={styles.textCenter} style={{ width: '4%' }}>SrNo</th>
                <th className={styles.textLeft} style={{ width: '24%' }}>Location Name</th>
                <th className={styles.textLeft} style={{ width: '10%' }}>Month</th>
                <th className={styles.textCenter} style={{ width: '6%' }}>TotEmp</th>
                <th className={styles.textRight} style={{ width: '8%' }}>Atten.</th>
                <th className={styles.textRight} style={{ width: '10%' }}>ESI Wages</th>
                <th className={styles.textRight} style={{ width: '7%' }}>0.75 %</th>
                <th className={styles.textRight} style={{ width: '7%' }}>3.25 %</th>
                <th className={styles.textRight} style={{ width: '4%' }}>%</th>
                <th className={styles.textRight} style={{ width: '4%' }}>%</th>
                <th className={styles.textRight} style={{ width: '4%' }}>%</th>
                <th className={styles.textRight} style={{ width: '8%' }}>Total Amt</th>
                <th className={styles.textCenter} style={{ width: '4%' }}>Year</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={13} className={styles.emptyState}>
                    No location records found for the selected period.
                  </td>
                </tr>
              ) : (
                records.map((r, idx) => (
                  <tr key={r.locationName ? `${r.locationName}-${idx}` : `loc-${idx}`}>
                    <td className={styles.textCenter}>{r.srNo || idx + 1}</td>
                    <td className={styles.textLeft}>{r.locationName}</td>
                    <td className={styles.textLeft}>{r.month || period.monthName || 'SEPTEMBER'}</td>
                    <td className={styles.textCenter}>{r.totEmp || 0}</td>
                    <td className={styles.textRight}>{Number(r.atten || 0).toFixed(2)}</td>
                    <td className={styles.textRight}>{Number(r.esiWages || 0).toFixed(2)}</td>
                    <td className={styles.textRight}>{Number(r.employeeEsi || 0).toFixed(2)}</td>
                    <td className={styles.textRight}>{Number(r.employerEsi || 0).toFixed(2)}</td>
                    <td className={styles.textRight}>0.00</td>
                    <td className={styles.textRight}>0.00</td>
                    <td className={styles.textRight}>0.00</td>
                    <td className={styles.textRight}>{Number(r.totalAmt || 0).toFixed(2)}</td>
                    <td className={styles.textCenter}>{r.year || period.fromYear || 2026}</td>
                  </tr>
                ))
              )}

              {/* Grand Total Row */}
              {records.length > 0 && (
                <tr className={styles.grandTotalRow}>
                  <td colSpan={3} className={styles.textLeft} style={{ paddingLeft: '16px' }}>
                    Grand Total
                  </td>
                  <td className={styles.textCenter}>{grandTotal.totEmp || 0}</td>
                  <td className={styles.textRight}>{Number(grandTotal.atten || 0).toFixed(2)}</td>
                  <td className={styles.textRight}>{Number(grandTotal.esiWages || 0).toFixed(2)}</td>
                  <td className={styles.textRight}>{Number(grandTotal.employeeEsi || 0).toFixed(2)}</td>
                  <td className={styles.textRight}>{Number(grandTotal.employerEsi || 0).toFixed(2)}</td>
                  <td className={styles.textRight}>0.00</td>
                  <td className={styles.textRight}>0.00</td>
                  <td className={styles.textRight}>0.00</td>
                  <td className={styles.textRight}>{Number(grandTotal.totalAmt || 0).toFixed(2)}</td>
                  <td className={styles.textCenter}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
