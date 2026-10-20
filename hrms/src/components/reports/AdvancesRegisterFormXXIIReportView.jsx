import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  Calendar,
  ShieldCheck,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import {
  downloadAdvancesRegisterExcel,
  downloadAdvancesRegisterPdf,
} from '../../utils/advancesRegisterExport';
import styles from './AdvancesRegisterFormXXIIReportView.module.css';

/**
 * Statutory Register of Advances (Form XXII) Interactive View
 * [See Rule 78(1)(a)(ii) of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure and layout shown in statutory Form XXII.
 */
export default function AdvancesRegisterFormXXIIReportView({
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

  const monthLabel =
    period?.monthLabel ||
    (period?.month
      ? new Date(period.month + '-01').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : `${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);

  const totalAdv =
    totals?.totalAdvanceDisbursed !== undefined
      ? totals.totalAdvanceDisbursed
      : records.reduce((sum, r) => sum + (Number(r.advanceAmount) || 0), 0);

  const totalRec =
    totals?.totalRecovered !== undefined
      ? totals.totalRecovered
      : records.reduce((sum, r) => sum + (Number(r.recoveredAmount) || 0), 0);

  const totalBal =
    totals?.totalPending !== undefined
      ? totals.totalPending
      : records.reduce((sum, r) => sum + (Number(r.remainingAmount) || 0), 0);

  const handleExportExcel = () => {
    downloadAdvancesRegisterExcel(records, companyInfo, period, totals);
  };

  const handleExportPdf = () => {
    downloadAdvancesRegisterPdf(records, companyInfo, period, totals);
  };

  const handlePrint = () => {
    downloadAdvancesRegisterPdf(records, companyInfo, period, totals, { mode: 'print' });
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
            <span className={styles.kpiLabel}>Total Advances Disbursed</span>
            <span className={styles.kpiValue}>₹{totalAdv.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <Users size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Workforce</span>
            <span className={styles.kpiValue}>{records.length} Workmen</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Amount Recovered</span>
            <span className={styles.kpiValue}>₹{totalRec.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Format</span>
            <span className={styles.kpiValue}>Form XXII (Rule 78)</span>
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
          <span className={styles.badgePeriod}>Outstanding Balance: ₹{totalBal.toLocaleString('en-IN')}</span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Statutory Register of Advances Excel"
          >
            <FileSpreadsheet size={15} />
            <span>Download Excel</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Statutory Register of Advances PDF"
          >
            <FileText size={15} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Form XXII Document"
          >
            <Printer size={15} />
            <span>Print Form XXII</span>
          </button>
        </div>
      </div>

      {/* 3. Statutory Document Frame (Matching Image 1) */}
      <div className={styles.paperCard}>
        {/* Top Header Box */}
        <div className={styles.headerBox}>
          <h1 className={styles.titleAdvancesRegister}>REGISTER OF ADVANCES</h1>
          <div className={styles.ruleSubtitle}>FORM XXII. See Rule-78 (1) (a) (ii)</div>
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

        {/* Advances Register Grid */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Advances Records Found</h4>
            <p className={styles.emptyText}>
              Adjust your month, client establishment, or search filters to view the Register of Advances.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.advancesTable}>
              <thead>
                {/* Level 1 Header: Titles matching Image 1 */}
                <tr className={styles.headerRow1}>
                  <th className={styles.thCenter} style={{ width: 44 }}>
                    Sl.No
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 150 }}>
                    Name Of the Employee
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 140 }}>
                    Father's/ Husband's Name
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 130 }}>
                    Designation/Nature of Employment
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 130 }}>
                    Wage Period and Wages Payable
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 130 }}>
                    Date and Amount of Advance Given
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 140 }}>
                    Purpose(s) for Which Advance made
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 120 }}>
                    No of Instalments by which Advance to be Repaid
                  </th>
                  <th className={styles.thLeft} style={{ minWidth: 150 }}>
                    Date and Amount of Each Instalment was Paid
                  </th>
                  <th className={styles.thCenter} style={{ minWidth: 120 }}>
                    Date on which Last Instalment Was Repaid
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
                  const wagePeriodAndWages = record.wagePeriodAndWages || 'Monthly';
                  const dateAndAmount = record.dateAndAmountOfAdvance || '—';
                  const purpose = record.purpose || '—';
                  const noOfInst = record.noOfInstallments || '—';
                  const dateAmountEach = record.dateAndAmountOfEachInstallment || '—';
                  const dateLastInst = record.dateOnWhichLastInstallmentRepaid || '—';
                  const remarks = record.remarks || '—';

                  return (
                    <tr
                      key={record.employeeId || record.employeeCode || `adv-row-${index}`}
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
                      <td>{wagePeriodAndWages}</td>
                      <td className={styles.thCenter} style={{ fontWeight: 600 }}>
                        {dateAndAmount}
                      </td>
                      <td>{purpose}</td>
                      <td className={styles.thCenter}>{noOfInst}</td>
                      <td style={{ fontSize: '10.5px' }}>{dateAmountEach}</td>
                      <td className={styles.thCenter} style={{ fontSize: '10.5px' }}>
                        {dateLastInst}
                      </td>
                      <td style={{ fontSize: '10.5px' }}>{remarks}</td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={4} style={{ textAlign: 'right', padding: '6px 12px' }}>
                    Total Workforce: {records.length} | Total Advance Disbursed:
                  </td>
                  <td style={{ color: '#2563eb' }}>Totals</td>
                  <td className={styles.thCenter} style={{ color: '#dc2626' }}>
                    ₹{totalAdv.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={2} style={{ textAlign: 'right' }}>
                    Total Recovered:
                  </td>
                  <td style={{ color: '#15803d' }}>
                    ₹{totalRec.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.thCenter} style={{ color: '#d97706', fontSize: '10.5px' }}>
                    Bal: ₹{totalBal.toLocaleString('en-IN')}
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
