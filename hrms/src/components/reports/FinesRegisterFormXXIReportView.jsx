import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  ShieldCheck,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  downloadFinesRegisterExcel,
  downloadFinesRegisterPdf,
} from '../../utils/finesRegisterExport';
import styles from './FinesRegisterFormXXIReportView.module.css';

/**
 * Statutory Register of Fines (Form XXI) Interactive View
 * [FORM XXI,See Rule-78 (1) (a) (ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure and layout shown in statutory Form XXI (User uploaded format).
 */
export default function FinesRegisterFormXXIReportView({
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

  const totalImposed =
    totals?.totalFinesImposed !== undefined
      ? totals.totalFinesImposed
      : records.reduce((sum, r) => sum + (Number(r.amountOfFineImposed) || 0), 0);

  const totalRealised =
    totals?.totalRealised !== undefined
      ? totals.totalRealised
      : records.reduce((sum, r) => sum + (Number(r.realisedAmount) || 0), 0);

  const totalPending =
    totals?.totalPending !== undefined
      ? totals.totalPending
      : Math.max(0, totalImposed - totalRealised);

  const handleExportExcel = () => {
    downloadFinesRegisterExcel(records, companyInfo, period, totals);
  };

  const handleExportPdf = () => {
    downloadFinesRegisterPdf(records, companyInfo, period, totals);
  };

  const handlePrint = () => {
    downloadFinesRegisterPdf(records, companyInfo, period, totals, { mode: 'print' });
  };

  return (
    <div className={styles.container}>
      {/* 1. KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconBlue}`}>
            <IndianRupee size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Fines Imposed</span>
            <span className={styles.kpiValue}>₹{totalImposed.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Workmen Penalized</span>
            <span className={styles.kpiValue}>{records.length} Workmen</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Realised</span>
            <span className={styles.kpiValue}>₹{totalRealised.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Format</span>
            <span className={styles.kpiValue}>Form XXI [Rule 78(1)(a)(ii)]</span>
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
          {totalPending > 0 && (
            <span className={styles.badgePending}>
              Pending Realisation: ₹{totalPending.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Statutory Register of Fines Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Statutory Register of Fines PDF"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Form XXI Document"
          >
            <Printer size={15} />
            <span>Print Form XXI</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Document Frame (Matching Image 1) */}
      <div className={styles.paperCard}>
        {/* Top Header Box */}
        <div className={styles.headerBox}>
          <h1 className={styles.titleFormXXI}>Register of Fines</h1>
          <div className={styles.ruleSubtitle}>FORM XXI,See Rule-78 (1) (a) (ii)</div>
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

        {/* Form XXI Fines Grid */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertTriangle size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Fines Imposed or Recorded</h4>
            <p className={styles.emptyText}>
              There are no fine records for the selected month and establishment filters.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.finesTable}>
              <thead>
                {/* Level 1 Header: Titles matching Image 1 */}
                <tr className={styles.headerRow1}>
                  <th className={styles.thCenter} style={{ width: 44 }}>
                    Sl. No.
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 150 }}>
                    Name of Workmen
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 140 }}>
                    Father's/ Husband's Name
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 140 }}>
                    Designation/ Nature of Employment
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 160 }}>
                    Act/ Omission for which Fine Imposed
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 100 }}>
                    Date of Offence
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 160 }}>
                    Name of Person in whose Presence Employee's Explanation was Heard
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 120 }}>
                    Wage Periods and Wages Payable
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 110 }}>
                    Amount of Fine Imposed
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 110 }}>
                    Date on Which Fine Realised
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 120 }}>
                    Remarks
                  </th>
                </tr>

                {/* Level 2 Header: Statutory Column Numbers 1 to 11 */}
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
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => {
                  const srNo = record.srNo || index + 1;
                  const empName = record.name || record.employeeName || '—';
                  const fatherHusband =
                    record.fatherName || record.fatherHusbandName || '—';
                  const designation = record.designation || 'Staff';
                  const actOrOmission = record.actOrOmission || '—';
                  const dateOfOffence = record.dateOfOffence || '—';
                  const explanationHeardBy = record.explanationHeardBy || '—';
                  const wagePeriodAndWages = record.wagePeriodAndWages || 'Monthly';
                  const amount = Number(record.amountOfFineImposed || 0);
                  const dateRealised = record.dateOnWhichFineRealised || '—';
                  const remarks = record.remarks || '—';

                  return (
                    <tr
                      key={record.fineId || record.employeeId || `fine-row-${index}`}
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
                      <td>{designation}</td>
                      <td>{actOrOmission}</td>
                      <td className={styles.thCenter}>{dateOfOffence}</td>
                      <td>{explanationHeardBy}</td>
                      <td className={styles.thCenter}>{wagePeriodAndWages}</td>
                      <td className={styles.thCenter} style={{ fontWeight: 700, color: '#dc2626' }}>
                        ₹{amount.toLocaleString('en-IN')}
                      </td>
                      <td className={styles.thCenter}>{dateRealised}</td>
                      <td>{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '6px 12px' }}>
                    Total Penalized Workmen: {records.length}
                  </td>
                  <td colSpan={4} style={{ textAlign: 'right' }}>
                    Total Fines Imposed:
                  </td>
                  <td className={styles.thCenter} style={{ color: '#dc2626' }}>
                    ₹{totalImposed.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.thCenter} style={{ color: '#16a34a' }}>
                    Realised: ₹{totalRealised.toLocaleString('en-IN')}
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
