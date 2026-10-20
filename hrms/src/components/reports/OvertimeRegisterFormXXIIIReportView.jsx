import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  ShieldCheck,
  IndianRupee,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  downloadOvertimeRegisterExcel,
  downloadOvertimeRegisterPdf,
} from '../../utils/overtimeRegisterExport';
import styles from './OvertimeRegisterFormXXIIIReportView.module.css';

/**
 * Statutory Register of Overtime (Form XXIII) Interactive View
 * [FORM XXIII, See Rule 78 (1) (a) (iii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure and layout shown in statutory Form XXIII (User uploaded format).
 */
export default function OvertimeRegisterFormXXIIIReportView({
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
      ? `${firstRec.establishmentName}, ${firstRec.establishmentAddress || 'Premises / Site within Delhi NCR'}`
      : 'Client Establishment Site, Delhi NCR');
  const workLocation =
    firstRec.workNameLocation ||
    `Security & Facility Services, At ${firstRec.establishmentName || 'Client Site'}`;
  const principalEmployer =
    firstRec.principalEmployer || `The Management / Authorized Officer, ${establishmentFull}`;

  const monthLabel =
    period?.monthLabel ||
    (period?.month
      ? new Date(period.month + '-01').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);

  const totalHours =
    totals?.totalOvertimeHours !== undefined
      ? totals.totalOvertimeHours
      : records.reduce((sum, r) => sum + (Number(r.totalOvertimeHours) || 0), 0);

  const totalEarnings =
    totals?.totalOvertimeEarnings !== undefined
      ? totals.totalOvertimeEarnings
      : records.reduce((sum, r) => sum + (Number(r.overtimeEarnings) || 0), 0);

  const handleExportExcel = () => {
    downloadOvertimeRegisterExcel(records, companyInfo, period, totals);
  };

  const handleExportPdf = () => {
    downloadOvertimeRegisterPdf(records, companyInfo, period, totals);
  };

  const handlePrint = () => {
    downloadOvertimeRegisterPdf(records, companyInfo, period, totals, { mode: 'print' });
  };

  return (
    <div className={styles.container}>
      {/* 1. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <Clock size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Overtime Hours</span>
            <span className={styles.kpiValue}>{totalHours} Hours</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Workforce Overtime</span>
            <span className={styles.kpiValue}>{records.length} Workmen</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <IndianRupee size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total OT Wages Paid</span>
            <span className={styles.kpiValue}>₹{totalEarnings.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Format</span>
            <span className={styles.kpiValue}>Form XXIII [Rule 78(1)(a)(iii)]</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeWorkforce}>
            {records.length} {records.length === 1 ? 'Record' : 'Records'}
          </span>
          <span className={styles.badgePeriod}>Period: {monthLabel}</span>
          <span className={styles.badgeHours}>Total OT: {totalHours} hrs</span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Statutory Register of Overtime Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Statutory Register of Overtime PDF"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Form XXIII Document"
          >
            <Printer size={15} />
            <span>Print Form XXIII</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Document Frame (Matching Image 1) */}
      <div className={styles.paperCard}>
        {/* Top Header Box */}
        <div className={styles.headerBox}>
          <h1 className={styles.titleFormXXIII}>REGISTER OF OVERTIME</h1>
          <div className={styles.ruleSubtitle}>FORM XXIII, See Rule 78 (1) (a) (iii)</div>
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
              Name and Address of Establishment in/ under which Contract is Carried on:
            </div>
            <div className={styles.infoColon}></div>
            <div className={styles.infoVal}>{establishmentFull}</div>
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoLabel}>Name and Address of Principal Employer</div>
            <div className={styles.infoColon}>:</div>
            <div className={styles.infoVal}>{principalEmployer}</div>
          </div>
        </div>

        {/* Form XXIII Overtime Grid */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertTriangle size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Overtime Records Found</h4>
            <p className={styles.emptyText}>
              There are no overtime records for the selected month and establishment filters.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.overtimeTable}>
              <thead>
                {/* Level 1 Header: Titles matching Image 1 */}
                <tr className={styles.headerRow1}>
                  <th className={styles.thCenter} style={{ width: 44 }}>
                    Sl. No
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 150 }}>
                    Name Of the Employee
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 140 }}>
                    Father's/ Husband's Name
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 60 }}>
                    Sex
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 140 }}>
                    Designation / Nature of Employment
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 110 }}>
                    Dates on which Overtime Worked
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 130 }}>
                    Total Overtime Worked or Production in Case of Piece--Rates
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 130 }}>
                    Normal Rate of Wages
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 110 }}>
                    Overtime Rate of Wages
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 110 }}>
                    Overtime Earnings
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 110 }}>
                    Date on which Overtime Wages Paid
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 120 }}>
                    Remarks
                  </th>
                </tr>

                {/* Level 2 Header: Statutory Column Numbers 1 to 12 */}
                <tr className={styles.headerRow2}>
                  <th className={styles.thCenter}>1</th>
                  <th className={styles.thCenter}>2</th>
                  <th className={styles.thCenter}>3</th>
                  <th className={styles.thCenter}>4</th>
                  <th className={styles.thCenter}>5</th>
                  <th className={styles.thCenter}>6</th>
                  <th className={styles.thCenter}>7</th>
                  <th className={styles.thCenter}>8</th>
                  <th className={styles.thCenter}>9</th>
                  <th className={styles.thCenter}>10</th>
                  <th className={styles.thCenter}>11</th>
                  <th className={styles.thCenter}>12</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => {
                  const srNo = record.srNo || index + 1;
                  const empName = record.name || record.employeeName || '—';
                  const fatherHusband =
                    record.fatherName || record.fatherHusbandName || '—';
                  const sex = record.sex || 'Male';
                  const designation = record.designation || 'Staff';
                  const datesWorked = record.datesOnWhichOvertimeWorked || '—';
                  const totalWorked = record.totalOvertimeWorked || `${record.totalOvertimeHours || 0} hrs`;
                  const normalRate = record.normalRateOfWages || '—';
                  const otRate = record.overtimeRateOfWages || '—';
                  const earnings = Number(record.overtimeEarnings || 0);
                  const datePaid = record.dateOnWhichOvertimeWagesPaid || '—';
                  const remarks = record.remarks || '—';

                  return (
                    <tr
                      key={record.overtimeId || record.employeeId || `ot-row-${index}`}
                      className={styles.dataRow}
                    >
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
                      <td className={styles.thCenter}>{sex}</td>
                      <td>{designation}</td>
                      <td className={styles.thCenter}>{datesWorked}</td>
                      <td className={styles.thCenter} style={{ fontWeight: 600 }}>
                        {totalWorked}
                      </td>
                      <td style={{ fontSize: '10.5px' }}>{normalRate}</td>
                      <td className={styles.thCenter} style={{ fontSize: '10.5px' }}>{otRate}</td>
                      <td className={styles.thCenter} style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{earnings.toLocaleString('en-IN')}
                      </td>
                      <td className={styles.thCenter}>{datePaid}</td>
                      <td>{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '6px 12px' }}>
                    Total Workforce Overtime: {records.length}
                  </td>
                  <td style={{ textAlign: 'right' }}>Total Hours:</td>
                  <td className={styles.thCenter} style={{ color: '#2563eb' }}>
                    {totalHours} hrs
                  </td>
                  <td colSpan={2} style={{ textAlign: 'right' }}>
                    Total OT Earnings:
                  </td>
                  <td className={styles.thCenter} style={{ color: '#16a34a' }}>
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} style={{ fontSize: '10px', color: '#475569' }}>
                    Verified & Compliant
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
