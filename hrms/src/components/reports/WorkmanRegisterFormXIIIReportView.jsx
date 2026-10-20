import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  downloadWorkmanRegisterExcel,
  downloadWorkmanRegisterPdf,
} from '../../utils/workmanRegisterExport';
import styles from './WorkmanRegisterFormXIIIReportView.module.css';

/**
 * Statutory Register of Workmen Employed by Contractor (Form XIII) Interactive View
 * [FORM XIII, See Rule 75 of Contract Labour (Regulation & Abolition) Central Rules, 1971]
 * Matches exact structure and 12 columns shown in user-uploaded Form XIII image.
 */
export default function WorkmanRegisterFormXIIIReportView({
  records = [],
  companyInfo = {},
  establishmentInfo = {},
  period = {},
  totals = {},
  filters = {},
}) {
  const est = establishmentInfo || {};
  const contractorName = est.contractorName || companyInfo?.name || 'RR SECURITY & FACILITIES';
  const contractorAddress =
    est.contractorAddress ||
    companyInfo?.address ||
    'G-75/A, Ground Floor, Block-G, M.B. EXTN., Badarpur New Delhi-110044';
  const workLocation =
    est.natureAndLocationOfWork ||
    'Security & Facility Services, At STAR TRACK TERMINALS PVT. LTD. ICD DADRI TILPATA ROAD, DADRI GREATER NOIDA';
  const establishmentFull =
    est.establishmentFull ||
    (est.establishmentName && est.establishmentAddress
      ? `${est.establishmentName}, ${est.establishmentAddress}`
      : 'STAR TRACK TERMINALS PRIVATE LIMITED, ICD DADRI, TILPATA ROAD, DADRI GREATER NOIDA 201311');
  const principalEmployer = est.principalEmployer || 'STAR TRACK TERMINALS PRIVATE LIMITED';

  const totalCount = totals?.totalWorkmen ?? records.length;
  const activeCount = totals?.activeWorkmen ?? records.filter((r) => r.status === 'Active').length;
  const terminatedCount = totals?.terminatedWorkmen ?? records.filter((r) => r.status !== 'Active').length;

  const handleExportExcel = () => {
    downloadWorkmanRegisterExcel(records, companyInfo, period, totals, establishmentInfo);
  };

  const handleExportPdf = () => {
    downloadWorkmanRegisterPdf(records, companyInfo, period, totals, establishmentInfo);
  };

  const handlePrint = () => {
    downloadWorkmanRegisterPdf(records, companyInfo, period, totals, establishmentInfo, {
      mode: 'print',
    });
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
            <span className={styles.kpiLabel}>Total Contract Workmen</span>
            <span className={styles.kpiValue}>{totalCount} Enrolled</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconGreen}`}>
            <UserCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Active Workmen</span>
            <span className={styles.kpiValue}>{activeCount} On Duty</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconOrange}`}>
            <UserX size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Terminated / Exited</span>
            <span className={styles.kpiValue}>{terminatedCount} Exited</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrap} ${styles.kpiIconPurple}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Statutory Rule</span>
            <span className={styles.kpiValue}>Form XIII [Rule 75]</span>
          </div>
        </div>
      </div>

      {/* 2. Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badgeWorkforce}>
            {records.length} Workmen in Register
          </span>
          <span className={styles.badgeRule}>Contract Labour Central Rules, 1971</span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnExcel}`}
            onClick={handleExportExcel}
            title="Download Statutory Form XIII as Excel spreadsheet"
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPdf}`}
            onClick={handleExportPdf}
            title="Download Official Form XIII Printable PDF"
          >
            <FileText size={16} />
            Export PDF
          </button>
          <button
            type="button"
            className={`${styles.btnAction} ${styles.btnPrint}`}
            onClick={handlePrint}
            title="Print Form XIII Register of Workmen"
          >
            <Printer size={16} />
            Print Form XIII
          </button>
        </div>
      </div>

      {/* 3. Formal Paper Document Frame matching Image 1 */}
      <div className={styles.paperSheet}>
        {/* Title Box matching Image 1 */}
        <div className={styles.titleBox}>
          <div className={styles.formMainTitle}>
            Register of Workmen Employed by Contractor
          </div>
          <div className={styles.ruleSubtitle}>Form XIII &nbsp;[See Rule 75]</div>
        </div>

        {/* Establishment Meta Box matching Image 1 */}
        <div className={styles.establishmentBox}>
          <div className={styles.metaRow}>
            <div className={styles.metaLabel}>Name and Address of Contractor</div>
            <div className={styles.metaColon}>:</div>
            <div className={styles.metaValue}>
              <strong>{contractorName}</strong>, {contractorAddress}
            </div>
          </div>
          <div className={styles.metaRow}>
            <div className={styles.metaLabel}>Nature and Location of Work</div>
            <div className={styles.metaColon}>:</div>
            <div className={styles.metaValue}>{workLocation}</div>
          </div>
          <div className={styles.metaRow}>
            <div className={styles.metaLabel}>
              Name and Address of Establishment in/ under which Contract is Carried on:
            </div>
            <div className={styles.metaColon}></div>
            <div className={styles.metaValue}>{establishmentFull}</div>
          </div>
          <div className={styles.metaRow}>
            <div className={styles.metaLabel}>Name and Address of Principal Employer</div>
            <div className={styles.metaColon}>:</div>
            <div className={styles.metaValue}>{principalEmployer}</div>
          </div>
        </div>

        {/* Table Content */}
        {records.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertTriangle size={36} color="#94a3b8" />
            <h4 className={styles.emptyTitle}>No Workmen Records Found</h4>
            <p className={styles.emptyText}>
              There are no employee master records found for the selected establishment or search filters.
            </p>
          </div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.workmenTable}>
              <thead>
                {/* Level 1 Header matching Image 1 */}
                <tr>
                  <th style={{ width: 44 }}>Sl. No.</th>
                  <th style={{ minWidth: 160 }}>Name and Surname of Workmen</th>
                  <th style={{ minWidth: 90 }}>Age and Sex</th>
                  <th style={{ minWidth: 150 }}>Father's/ Husband's Name</th>
                  <th style={{ minWidth: 140 }}>Nature of Employment / Designation</th>
                  <th style={{ minWidth: 190 }}>
                    Permanent Home Address of Workmen (Village and Tahsil/ Taluk and District)
                  </th>
                  <th style={{ minWidth: 160 }}>Local Address</th>
                  <th style={{ minWidth: 100 }}>Date of Commencement of Employment</th>
                  <th style={{ minWidth: 110 }}>Signature or Thumb-Impression of Workmen</th>
                  <th style={{ minWidth: 100 }}>Date of Termination of Employment</th>
                  <th style={{ minWidth: 120 }}>Reasons for Termination</th>
                  <th style={{ minWidth: 110 }}>Remarks</th>
                </tr>

                {/* Level 2 Numbering Row (1 to 12) matching Image 1 */}
                <tr className={styles.headerNumbers}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                  <th>10</th>
                  <th>11</th>
                  <th>12</th>
                </tr>
              </thead>

              <tbody>
                {records.map((r, index) => (
                  <tr key={r.employeeId || `workman-row-${index}`} className={styles.dataRow}>
                    {/* 1. Sl. No */}
                    <td className={styles.textCenter}>{r.srNo || index + 1}</td>

                    {/* 2. Name & Surname */}
                    <td className={styles.workmanNameCell}>
                      {r.name}
                      {r.employeeCode && (
                        <div className={styles.empCodeSub}>
                          ID: {r.employeeCode}
                        </div>
                      )}
                    </td>

                    {/* 3. Age & Sex */}
                    <td className={styles.textCenter}>{r.ageAndSex}</td>

                    {/* 4. Father's / Husband's Name */}
                    <td>{r.fatherHusbandName}</td>

                    {/* 5. Nature of Employment / Designation */}
                    <td>{r.designation}</td>

                    {/* 6. Permanent Address */}
                    <td>{r.permanentAddress}</td>

                    {/* 7. Local Address */}
                    <td>{r.localAddress}</td>

                    {/* 8. Date of Commencement */}
                    <td className={styles.textCenter}>{r.dateOfCommencement}</td>

                    {/* 9. Signature Space */}
                    <td></td>

                    {/* 10. Date of Termination */}
                    <td className={styles.textCenter}>{r.dateOfTermination}</td>

                    {/* 11. Reasons for Termination */}
                    <td>{r.reasonsForTermination}</td>

                    {/* 12. Remarks */}
                    <td>{r.remarks}</td>
                  </tr>
                ))}

                {/* Summary Verification Row */}
                <tr className={styles.summaryRow}>
                  <td className={styles.textCenter}>Total</td>
                  <td colSpan={2}>
                    <strong>{records.length} Contract Workmen</strong>
                  </td>
                  <td colSpan={2}>
                    Active: {activeCount} &nbsp;|&nbsp; Terminated: {terminatedCount}
                  </td>
                  <td colSpan={6}></td>
                  <td className={styles.textCenter} style={{ fontSize: '10px' }}>
                    Statutory Verified
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
