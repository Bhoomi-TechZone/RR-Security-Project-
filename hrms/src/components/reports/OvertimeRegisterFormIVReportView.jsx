import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  ShieldCheck,
  IndianRupee,
  Clock,
  Info,
} from 'lucide-react';
import {
  downloadFormIVOvertimeExcel,
  downloadFormIVOvertimeCsv,
  downloadFormIVOvertimePdf,
} from '../../utils/formIVOvertimeExport';
import styles from './OvertimeRegisterFormIVReportView.module.css';

/**
 * Statutory Register of Overtime for Workers — Form IV [Rules 25 (2)]
 * Salary Reports Module
 * Matches exact structure, header fields, and 12-column layout shown in statutory reference image:
 * FORM IV
 * [Rules 25 (2)]
 * Overtime register for workers
 */
export default function OvertimeRegisterFormIVReportView({
  records = [],
  companyInfo = {},
  establishmentInfo = {},
  contractor = {},
  establishment = {},
  period = {},
  totals = {},
  emptyMessage = '',
  hasOvertime = false,
  filters = {},
}) {
  // Resolve Contractor details (Image 1 Header)
  const cData = contractor?.name ? contractor : companyInfo || {};
  const contractorName = cData.name || '—';
  const regdOffice = cData.regdOffice || cData.address || '—';
  const contractorDisplay = `${contractorName}, RegdOffice :- ${regdOffice}`;

  // Resolve Establishment & Principal Employer (Image 1 Header)
  const eData = establishment?.name ? establishment : establishmentInfo || {};
  const establishmentName = eData.name || (filters.company && filters.company !== 'All Companies' ? filters.company : '—');
  const establishmentCarriedOn = eData.carriedOn || eData.address || '—';
  const principalEmployerName = eData.principalEmployer || '—';
  const principalEmployerAddress = eData.principalEmployerAddress || '';
  const natureAndLocation = eData.natureAndLocationOfWork || '—';

  // Period label
  const monthUpper = period?.monthNameUpper || 'OCT';
  const yearNum = period?.year || new Date().getFullYear();
  const monthBanner = emptyMessage || `NO OVERTIME IN THE MONTH OF ${monthUpper} ${yearNum}`;

  // Metrics
  const totalWorkmen = totals?.totalWorkmen !== undefined ? totals.totalWorkmen : records.length;
  const totalOtHours = totals?.totalOvertimeHours !== undefined
    ? totals.totalOvertimeHours
    : records.reduce((s, r) => s + (Number(r.totalOvertimeHours) || 0), 0);
  const totalOtEarnings = totals?.totalOvertimeEarnings !== undefined
    ? totals.totalOvertimeEarnings
    : records.reduce((s, r) => s + (Number(r.overtimeEarnings) || 0), 0);

  // Export Handlers
  const handleExportExcel = () =>
    downloadFormIVOvertimeExcel(records, cData, eData, period, totals, { format: 'xlsx' });
  const handleExportCsv = () =>
    downloadFormIVOvertimeCsv(records, cData, eData, period, totals, { format: 'csv' });
  const handleDownloadPdf = () =>
    downloadFormIVOvertimePdf(records, cData, eData, period, totals, { mode: 'download' });
  const handlePrint = () =>
    downloadFormIVOvertimePdf(records, cData, eData, period, totals, { mode: 'print' });

  return (
    <div className={styles.container}>
      {/* Statutory Act Banner */}
      <div className={styles.actBanner}>
        <Info size={15} />
        <span>
          <strong>FORM IV</strong>&nbsp;[Rules 25 (2)] — Statutory Overtime Register for Workers (Salary Reports). Period:{' '}
          <strong>{period?.monthLabel || `${monthUpper} ${yearNum}`}</strong>
        </span>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Clock size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Overtime Hours</span>
            <span className={styles.kpiValue}>{totalOtHours} Hours</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Workmen with Overtime</span>
            <span className={styles.kpiValue}>{totalWorkmen} Workmen</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <IndianRupee size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Overtime Wages</span>
            <span className={styles.kpiValue}>₹{totalOtEarnings.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Compliance</span>
            <span className={styles.kpiValue}>Form IV [Rules 25(2)]</span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeForm}>FORM IV</span>
          <div>
            <div className={styles.toolbarTitle}>Overtime Register for Workers</div>
            <div className={styles.toolbarSubtitle}>Rules 25 (2) • Salary Reports Module</div>
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <button type="button" className={styles.btnSecondary} onClick={handleExportExcel} title="Download Excel">
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleExportCsv} title="Download CSV">
            <FileText size={14} />
            <span>CSV</span>
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleDownloadPdf} title="Download PDF">
            <FileText size={14} />
            <span>PDF</span>
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handlePrint} title="Print Register">
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Statutory Form IV Sheet (Exact match to Image 1) */}
      <div className={styles.sheetCard} id="form-iv-overtime-sheet">
        {/* Top Header Block */}
        <div className={styles.sheetHeaderBlock}>
          <div className={styles.formTitle}>FORM IV</div>
          <div className={styles.formRule}>[Rules 25 (2)]</div>
          <div className={styles.registerTitle}>Overtime register for workers</div>
        </div>

        {/* 2-Column Header Metadata Grid matching Image 1 */}
        <div className={styles.headerFieldsGrid}>
          {/* Left Column */}
          <div className={styles.fieldLeftCol}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabelBold}>Name &amp; address of Contractor_</span>
              <span className={styles.fieldValueText}>{contractorName}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabelBold}>RegdOffice :-</span>
              <span className={styles.fieldValueText}>{regdOffice}</span>
            </div>
            <div className={styles.fieldRow} style={{ marginTop: '4px' }}>
              <span className={styles.fieldLabelBold}>Nature and location of work ___</span>
              <span className={styles.fieldValueText}>{natureAndLocation}___</span>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.fieldRightCol}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabelBold}>
                Name and address of Establishment in/ under which contract is carried on _
              </span>
              <span className={styles.fieldValueText}>{establishmentCarriedOn}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabelBold}>
                Name and address of Principle Employer_____________
              </span>
              <span className={styles.fieldValueText}>
                {principalEmployerName}
                {principalEmployerAddress ? `, ${principalEmployerAddress}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* 12-Column Statutory Table matching Image 1 */}
        <div className={styles.tableWrapper}>
          <table className={styles.formIVTable}>
            <thead>
              {/* Header Titles */}
              <tr>
                <th className={styles.thHeader} style={{ width: '4%' }}>Sl. No.</th>
                <th className={styles.thHeader} style={{ width: '12%' }}>Name of<br />Workman</th>
                <th className={styles.thHeader} style={{ width: '11%' }}>Father's/<br />Husband's<br />Name</th>
                <th className={styles.thHeader} style={{ width: '5%' }}>Sex</th>
                <th className={styles.thHeader} style={{ width: '10%' }}>Designation /<br />Nature of<br />employment</th>
                <th className={styles.thHeader} style={{ width: '9%' }}>Dates on<br />which<br />over time<br />worked</th>
                <th className={styles.thHeader} style={{ width: '10%' }}>Total<br />overtime<br />worked or<br />production<br />in case of<br />piece rated</th>
                <th className={styles.thHeader} style={{ width: '9%' }}>Normal<br />rate of<br />wages</th>
                <th className={styles.thHeader} style={{ width: '8%' }}>Overtime<br />rate of<br />wages</th>
                <th className={styles.thHeader} style={{ width: '8%' }}>Date and<br />amount<br />of each<br />installment<br />re-paid</th>
                <th className={styles.thHeader} style={{ width: '7%' }}>Date on<br />which<br />overtime<br />wages<br />paid</th>
                <th className={styles.thHeader} style={{ width: '7%' }}>Remarks</th>
              </tr>
              {/* Column Numbers 1 to 12 matching Image 1 */}
              <tr>
                <th className={styles.thNum}>1</th>
                <th className={styles.thNum}>2</th>
                <th className={styles.thNum}>3</th>
                <th className={styles.thNum}>4</th>
                <th className={styles.thNum}>5</th>
                <th className={styles.thNum}>6</th>
                <th className={styles.thNum}>7</th>
                <th className={styles.thNum}>8</th>
                <th className={styles.thNum}>9</th>
                <th className={styles.thNum}>10</th>
                <th className={styles.thNum}>11</th>
                <th className={styles.thNum}>12</th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((row, idx) => (
                  <tr key={row.overtimeId || `ot-iv-row-${idx}`}>
                    <td className={styles.textCenter}>{row.srNo || idx + 1}</td>
                    <td className={styles.textLeft}>{row.nameOfWorkman || row.name || '—'}</td>
                    <td className={styles.textLeft}>{row.fatherHusbandName || row.fatherName || '—'}</td>
                    <td className={styles.textCenter}>{row.sex || 'Male'}</td>
                    <td className={styles.textLeft}>{row.designation || 'Workman'}</td>
                    <td className={styles.textCenter}>{row.datesOnWhichOvertimeWorked || '—'}</td>
                    <td className={`${styles.textCenter} ${styles.boldValue}`}>
                      {row.totalOvertimeWorked || `${row.totalOvertimeHours || 0} hrs`}
                    </td>
                    <td className={styles.textCenter}>{row.normalRateOfWages || '—'}</td>
                    <td className={`${styles.textCenter} ${styles.boldValue}`}>{row.overtimeRateOfWages || '—'}</td>
                    <td className={styles.textCenter}>{row.dateAndAmountOfInstallmentRepaid || '—'}</td>
                    <td className={styles.textCenter}>{row.dateOnWhichOvertimeWagesPaid || '—'}</td>
                    <td className={styles.textLeft}>{row.remarks || '—'}</td>
                  </tr>
                ))
              ) : (
                <>
                  {/* Empty Spacer Rows before Banner */}
                  <tr className={styles.emptySpacerRow}>
                    {Array.from({ length: 12 }).map((_, c) => (
                      <td key={`spacer-top-${c}`}>&nbsp;</td>
                    ))}
                  </tr>
                  <tr className={styles.emptySpacerRow}>
                    {Array.from({ length: 12 }).map((_, c) => (
                      <td key={`spacer-top2-${c}`}>&nbsp;</td>
                    ))}
                  </tr>

                  {/* Dynamic Full-Width Banner matching Image 1 */}
                  <tr>
                    <td colSpan={12} className={styles.emptyBannerCell}>
                      <span className={styles.emptyBannerContent}>
                        {monthBanner}
                      </span>
                    </td>
                  </tr>

                  {/* Empty Spacer Rows after Banner matching Image 1 */}
                  <tr className={styles.emptySpacerRow}>
                    {Array.from({ length: 12 }).map((_, c) => (
                      <td key={`spacer-bottom-${c}`}>&nbsp;</td>
                    ))}
                  </tr>
                  <tr className={styles.emptySpacerRow}>
                    {Array.from({ length: 12 }).map((_, c) => (
                      <td key={`spacer-bottom2-${c}`}>&nbsp;</td>
                    ))}
                  </tr>
                  <tr className={styles.emptySpacerRow}>
                    {Array.from({ length: 12 }).map((_, c) => (
                      <td key={`spacer-bottom3-${c}`}>&nbsp;</td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
            {records && records.length > 0 && (
              <tfoot>
                <tr className={styles.tableTotalRow}>
                  <td colSpan={6} style={{ textAlign: 'right', fontWeight: 800 }}>
                    Total:
                  </td>
                  <td className={styles.textCenter} style={{ color: '#2563eb', fontWeight: 800 }}>
                    {totalOtHours} hrs
                  </td>
                  <td></td>
                  <td className={styles.textCenter} style={{ color: '#ea580c', fontWeight: 800 }}>
                    ₹{totalOtEarnings.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className={styles.statutoryNote}>
          * Per <strong>Minimum Wages (Central) Rules / Contract Labour Rules</strong> — Form IV [Rules 25(2)].
        </div>
      </div>
    </div>
  );
}
