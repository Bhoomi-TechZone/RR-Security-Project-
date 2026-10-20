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
  downloadDeductionsDamageExcel,
  downloadDeductionsDamagePdf,
} from '../../utils/deductionsDamageExport';
import styles from './DeductionsDamageFormXXReportView.module.css';

/**
 * Statutory Register of Deduction for Damage or Loss (Form XX) Interactive View
 * [FORM XX ,See Rule- 78 (1) (a) (ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure and layout shown in statutory Form XX (User uploaded format).
 */
export default function DeductionsDamageFormXXReportView({
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
    totals?.totalDeductionsImposed !== undefined
      ? totals.totalDeductionsImposed
      : records.reduce((sum, r) => sum + (Number(r.amountDeductionImposed) || 0), 0);

  const totalRec =
    totals?.totalRecovered !== undefined
      ? totals.totalRecovered
      : records.reduce((sum, r) => sum + (Number(r.recoveredAmount) || 0), 0);

  const totalPending =
    totals?.totalPending !== undefined
      ? totals.totalPending
      : Math.max(0, totalImposed - totalRec);

  const handleExportExcel = () => {
    downloadDeductionsDamageExcel(records, companyInfo, period, totals);
  };

  const handleExportPdf = () => {
    downloadDeductionsDamagePdf(records, companyInfo, period, totals);
  };

  const handlePrint = () => {
    downloadDeductionsDamagePdf(records, companyInfo, period, totals, { mode: 'print' });
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
            <span className={styles.kpiLabel}>Total Deductions Imposed</span>
            <span className={styles.kpiValue}>₹{totalImposed.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Affected Workmen</span>
            <span className={styles.kpiValue}>{records.length} Workmen</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Recovered</span>
            <span className={styles.kpiValue}>₹{totalRec.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Format</span>
            <span className={styles.kpiValue}>Form XX [Rule 78(1)(a)(ii)]</span>
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
              Pending Recovery: ₹{totalPending.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Statutory Register of Deductions for Damage or Loss Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Statutory Register of Deductions for Damage or Loss PDF"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Form XX Document"
          >
            <Printer size={15} />
            <span>Print Form XX</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Document Frame (Matching Image 1) */}
      <div className={styles.paperCard}>
        {/* Top Header Box */}
        <div className={styles.headerBox}>
          <h1 className={styles.titleFormXX}>Register of Deduction for Damage or Loss</h1>
          <div className={styles.ruleSubtitle}>FORM XX ,See Rule- 78 (1) (a) (ii)</div>
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

        {/* Form XX Deductions Grid */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertTriangle size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Deductions for Damage or Loss Recorded</h4>
            <p className={styles.emptyText}>
              There are no damage or loss deduction records for the selected month and establishment filters.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.damageTable}>
              <thead>
                {/* Level 1 Header: Titles matching Image 1 */}
                <tr className={styles.headerRow1}>
                  <th rowSpan={2} className={styles.thCenter} style={{ width: 44 }}>
                    Sl.No.
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 150 }}>
                    Name of Employee
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 140 }}>
                    Father's/ Husband's Name
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 140 }}>
                    Nature of Employment/Designation
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 160 }}>
                    Particulars of Damage or Loss
                  </th>
                  <th rowSpan={2} className={styles.thCenter} style={{ minWidth: 100 }}>
                    Date of Damage or Loss
                  </th>
                  <th rowSpan={2} className={styles.thCenter} style={{ minWidth: 130 }}>
                    Whether Workman Showed Cause Against Deduction
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 160 }}>
                    Name of Person in whose Presence Employee's Explanation was Heard
                  </th>
                  <th rowSpan={2} className={styles.thCenter} style={{ minWidth: 110 }}>
                    Amount of Deduction Imposed
                  </th>
                  <th rowSpan={2} className={styles.thCenter} style={{ minWidth: 90 }}>
                    No. of Instalments
                  </th>
                  <th colSpan={2} className={styles.thCenter}>
                    Date of Recovery
                  </th>
                  <th rowSpan={2} className={styles.thLeft} style={{ minWidth: 120 }}>
                    Remarks
                  </th>
                </tr>

                {/* Level 2 Header: Recovery Instalment Sub-columns */}
                <tr className={styles.headerRow2}>
                  <th className={styles.thCenter} style={{ minWidth: 100 }}>
                    First Instalment
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 100 }}>
                    Last Instalment
                  </th>
                </tr>

                {/* Level 3 Header: Statutory Column Numbers 1 to 13 */}
                <tr className={styles.headerRow3}>
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
                  <th className={styles.thCenter}>13</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record, index) => {
                  const srNo = record.srNo || index + 1;
                  const empName = record.name || record.employeeName || '—';
                  const fatherHusband =
                    record.fatherName || record.fatherHusbandName || '—';
                  const designation = record.designation || 'Staff';
                  const particulars = record.particularsOfDamageOrLoss || '—';
                  const dateOfDamage = record.dateOfDamageOrLoss || '—';
                  const showedCause = record.showedCause || 'Yes';
                  const explanationHeardBy = record.explanationHeardBy || '—';
                  const amount = Number(record.amountDeductionImposed || 0);
                  const installments = record.noOfInstallments || 1;
                  const firstInst = record.firstInstalmentDate || '—';
                  const lastInst = record.lastInstalmentDate || '—';
                  const remarks = record.remarks || '—';

                  return (
                    <tr
                      key={record.deductionId || record.employeeId || `dmg-row-${index}`}
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
                      <td>{particulars}</td>
                      <td className={styles.thCenter}>{dateOfDamage}</td>
                      <td className={styles.thCenter} style={{ fontWeight: 600 }}>
                        {showedCause}
                      </td>
                      <td>{explanationHeardBy}</td>
                      <td className={styles.thCenter} style={{ fontWeight: 700, color: '#dc2626' }}>
                        ₹{amount.toLocaleString('en-IN')}
                      </td>
                      <td className={styles.thCenter}>{installments}</td>
                      <td className={styles.thCenter}>{firstInst}</td>
                      <td className={styles.thCenter}>{lastInst}</td>
                      <td>{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={5} style={{ textAlign: 'right', padding: '6px 12px' }}>
                    Total Affected Workmen: {records.length}
                  </td>
                  <td colSpan={3} style={{ textAlign: 'right' }}>
                    Total Deduction Imposed:
                  </td>
                  <td className={styles.thCenter} style={{ color: '#dc2626' }}>
                    ₹{totalImposed.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.thCenter}>
                    Rec: ₹{totalRec.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} className={styles.thCenter} style={{ color: '#d97706', fontSize: '10.5px' }}>
                    Pending: ₹{totalPending.toLocaleString('en-IN')}
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
