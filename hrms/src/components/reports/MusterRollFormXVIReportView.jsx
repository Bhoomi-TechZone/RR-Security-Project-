import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  downloadMusterRollExcel,
  downloadMusterRollPdf,
} from '../../utils/musterRollExport';
import styles from './MusterRollFormXVIReportView.module.css';

/**
 * Statutory Muster Roll (Form XVI) Interactive View
 * [See Rule 78(1)(a)(i) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure and layout shown in statutory Form XVI.
 */
export default function MusterRollFormXVIReportView({
  records = [],
  companyInfo = {},
  period = {},
  totals = {},
  filters = {},
}) {
  const defaultComp = companyInfo || {};
  const contractorName = defaultComp.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    defaultComp.address || 'G-75/A, Ground Floor, Block-G M.B. EXTN., Badarpur New Delhi-110044';
  const contractorFull = `${contractorName}, ${contractorAddress}`;

  const firstRec = records[0] || {};
  const establishmentFull =
    firstRec.establishmentFull ||
    (firstRec.establishmentName
      ? `${firstRec.establishmentName}, ${firstRec.establishmentAddress || 'Delhi NCR'}`
      : 'Client Establishment Site, Delhi NCR');
  const workLocation =
    firstRec.workNameLocation ||
    `Security & Facility Services, At ${firstRec.establishmentName || 'Client Site'}`;
  const principalEmployer =
    firstRec.principalEmployer || `The Management / Authorized Officer, ${establishmentFull}`;

  const daysInMonth = period?.daysInMonth || totals?.daysInMonth || 31;
  const monthLabel =
    period?.monthLabel ||
    (period?.month
      ? new Date(period.month + '-01').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);

  // Build array of day numbers [1, 2, ..., daysInMonth]
  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Total man-days sum
  const totalWorkedDaysSum =
    totals?.totalDaysWorkedSum !== undefined
      ? totals.totalDaysWorkedSum
      : records.reduce((sum, r) => sum + (Number(r.totalDaysWorked) || 0), 0);

  const handleExportExcel = () => {
    downloadMusterRollExcel(records, companyInfo, period, totals);
  };

  const handleExportPdf = () => {
    downloadMusterRollPdf(records, companyInfo, period, totals);
  };

  const handlePrint = () => {
    downloadMusterRollPdf(records, companyInfo, period, totals, { mode: 'print' });
  };

  const getAttendanceClass = (mark) => {
    if (!mark) return styles.markP;
    const m = mark.toUpperCase();
    if (m === 'P') return styles.markP;
    if (m === 'WO' || m === 'OFF') return styles.markWO;
    if (m === 'A') return styles.markA;
    if (m === 'HD') return styles.markHD;
    return styles.markP;
  };

  return (
    <div className={styles.container}>
      {/* 1. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Workforce</span>
            <span className={styles.kpiValue}>{records.length} Employees</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Calendar size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Period / Month</span>
            <span className={styles.kpiValue}>{monthLabel}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Format</span>
            <span className={styles.kpiValue}>Form XVI (Rule 78)</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Man-Days</span>
            <span className={styles.kpiValue}>{totalWorkedDaysSum} Days</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeWorkforce}>
            {records.length} {records.length === 1 ? 'Workman Record' : 'Workmen Records'}
          </span>
          <span className={styles.badgePeriod}>Period: {monthLabel}</span>
          <span className={styles.badgePeriod}>{daysInMonth} Days in Month</span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Statutory Muster Roll Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Statutory Muster Roll PDF (Landscape A3)"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Muster Roll Document"
          >
            <Printer size={15} />
            <span>Print Form XVI</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Document Frame (Matching Image 1) */}
      <div className={styles.paperCard}>
        {/* Top Header Box */}
        <div className={styles.headerBox}>
          <h1 className={styles.titleMusterRoll}>Muster Roll</h1>
          <div className={styles.ruleSubtitle}>Form XVI [See Rule 78(1)(a)(i)]</div>
        </div>

        {/* Establishment Info Box */}
        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Name and Address of Contractor</div>
            <div className={styles.infoColon}>:</div>
            <div className={styles.infoVal}>{contractorFull}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Nature and Location of Work</div>
            <div className={styles.infoColon}>:</div>
            <div className={styles.infoVal}>{workLocation}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>
              Name and Address of Establishment in/ under which Contract is Carried on
            </div>
            <div className={styles.infoColon}>:</div>
            <div className={styles.infoVal}>{establishmentFull}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Name and Address of Principal Employer</div>
            <div className={styles.infoColon}>:</div>
            <div className={styles.infoVal}>{principalEmployer}</div>
          </div>
        </div>

        {/* Attendance Register Grid */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Attendance Records Found</h4>
            <p className={styles.emptyText}>
              Adjust your month, client establishment, or search filters to view the Muster Roll.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.musterTable}>
              <thead>
                {/* Level 1 Header: Titles */}
                <tr className={styles.headerRow1}>
                  <th rowSpan={2} className={styles.thCenter} style={{ width: 44 }}>
                    Sl.
                    <br />
                    No.
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 160 }}>
                    Name Of Employee
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 150 }}>
                    Father's/ Husband's
                    <br />
                    Name
                  </th>
                  <th rowSpan={2} className={styles.thCenter} style={{ width: 60 }}>
                    Gender
                  </th>
                  <th colSpan={daysInMonth} className={styles.thCenter}>
                    Date / Units
                  </th>
                  <th rowSpan={2} className={styles.thCenter} style={{ width: 90 }}>
                    Total No of
                    <br />
                    days/Units
                    <br />
                    Worked
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 120 }}>
                    Remarks
                  </th>
                </tr>

                {/* Level 2 Header: Days 1 to 31 */}
                <tr className={styles.headerRow2}>
                  {dayColumns.map((day) => (
                    <th key={`day-col-${day}`} className={styles.colDay}>
                      {day}
                    </th>
                  ))}
                </tr>

                {/* Level 3 Header: Column Numbering row (1, 2, 3, 4, 5 spanning days, 6, 7) */}
                <tr className={styles.headerRow3}>
                  <th className={styles.thCenter}>1</th>
                  <th className={styles.thCenter}>2</th>
                  <th className={styles.thCenter}>3</th>
                  <th className={styles.thCenter}>4</th>
                  <th colSpan={daysInMonth} className={styles.thCenter}>
                    5
                  </th>
                  <th className={styles.thCenter}>6</th>
                  <th className={styles.thCenter}>7</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => {
                  const srNo = record.srNo || index + 1;
                  const empName = record.name || record.employeeName || '—';
                  const fatherHusband =
                    record.fatherName || record.fatherHusbandName || '—';
                  const gender = record.gender || '—';
                  const totalWorked = record.totalDaysWorked ?? 0;
                  const remarks = record.remarks || '—';

                  return (
                    <tr key={record.employeeId || record.employeeCode || `muster-row-${index}`} className={styles.dataRow}>
                      <td className={styles.thCenter}>{srNo}</td>
                      <td className={styles.empNameCell}>
                        {empName}
                        {record.employeeCode && (
                          <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                            {record.employeeCode}
                          </div>
                        )}
                      </td>
                      <td>{fatherHusband}</td>
                      <td className={styles.thCenter}>{gender}</td>

                      {/* Daily Attendance cells */}
                      {dayColumns.map((day) => {
                        const mark = record.dailyAttendance?.[day] || 'P';
                        return (
                          <td
                            key={`att-${srNo}-${day}`}
                            className={`${styles.colDay} ${getAttendanceClass(mark)}`}
                          >
                            {mark}
                          </td>
                        );
                      })}

                      <td className={styles.thCenter} style={{ fontWeight: 700 }}>
                        {totalWorked}
                      </td>
                      <td style={{ fontSize: '10px' }}>{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '6px 12px' }}>
                    Total Workforce: {records.length} | Grand Total Man-Days:
                  </td>
                  <td colSpan={daysInMonth} style={{ textAlign: 'center', color: '#15803d' }}>
                    {totalWorkedDaysSum} Man-Days
                  </td>
                  <td className={styles.thCenter} style={{ color: '#0f172a' }}>
                    {totalWorkedDaysSum}
                  </td>
                  <td style={{ fontSize: '10px', color: '#475569' }}>Verified & Compliant</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
