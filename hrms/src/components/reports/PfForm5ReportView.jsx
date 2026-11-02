import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  Users,
  Filter
} from 'lucide-react';
import {
  downloadPfForm5Pdf,
  downloadPfForm5Excel,
  downloadPfForm5Csv
} from '../../utils/pfForm5Export';
import styles from './PfForm5ReportView.module.css';

/**
 * Statutory EPFO PF Form 5 Report View
 * Return of Employees qualifying for membership of the Employees' Provident Fund,
 * Employees' Pension Fund & EDLI for the first time during the month.
 *
 * Statutory reference:
 * [Paragraph 36(2)(a) of EPF Scheme, 1952 & Paragraph 20(4) of EPS, 1995]
 */
export default function PfForm5ReportView({
  reportData = {},
  filters = {},
  onScopeChange
}) {
  const comp = reportData.companyInfo || {};
  const allRecords = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'May 2026';
  const generatedDate = reportData.generatedDate || '13 Sep, 2026';
  const hasMonthJoiners = Boolean(reportData.hasMonthJoiners);

  // Local filter for viewing Month New Joinees vs All PF members
  const [scope, setScope] = useState('auto'); // 'auto' | 'newOnly' | 'all'

  const displayedRecords = React.useMemo(() => {
    if (scope === 'newOnly') {
      return allRecords.filter(r => r.isNewJoinee);
    }
    if (scope === 'all') {
      return allRecords;
    }
    // Auto: if hasMonthJoiners and records exist, show them; otherwise all
    return allRecords;
  }, [allRecords, scope]);

  const estName = comp.name || comp.companyName || '';
  const estAddress = comp.address || '';
  const estCode = comp.establishmentCode || comp.employerPfCode || comp.employerPfCode || comp.pfNo || '';

  const handleDownloadPdf = () => {
    downloadPfForm5Pdf({
      ...reportData,
      records: displayedRecords
    }, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadPfForm5Pdf({
      ...reportData,
      records: displayedRecords
    }, { mode: 'print' });
  };

  const handleExportExcel = () => {
    downloadPfForm5Excel({
      ...reportData,
      records: displayedRecords
    });
  };

  const handleExportCsv = () => {
    downloadPfForm5Csv({
      ...reportData,
      records: displayedRecords
    });
  };

  return (
    <div className={styles.container}>
      

      {/* Official Form 5 Printable Paper Container */}
      <div className={styles.paperWrap}>
        <div className={styles.paper}>
          {/* 1. Centered Header Box: FORM 5 */}
          <div className={styles.formHeaderBox}>
            <h1 className={styles.formHeaderTitle}>FORM 5</h1>
          </div>

          {/* 2. Organisation & Scheme Subtitles */}
          <h2 className={styles.orgTitle}>Employees' Provident Fund Organisation</h2>
          <div className={styles.schemeSubtitle}>
            THE EMPLOYEES' PROVIDENT FUND SCHEME, 1952 [Paragraph 36(2)(a)] AND THE EMPLOYEES' PENSION SCHEME, 1995 [Paragraph 20(4)]
          </div>

          {/* 3. Statutory Return Declaration Statement */}
          <p className={styles.returnStatement}>
            Return of Employees' qualifying for membership of the Employees' Provident Fund, Employees' Pension Fund &amp; Employees' Deposit Linked Insurance Fund for the first time during the month of&nbsp;&nbsp;
            <span className={styles.monthHighlight}>{monthLabel}</span>
          </p>

          {/* 4. Factory / Establishment Metadata */}
          <div className={styles.metaGrid}>
            <div className={styles.metaLeft}>
              <div className={styles.metaLabel}>Name and Address of the Factory / Estt:</div>
              <div className={styles.metaValue}>
                <div className={styles.esttName}>{estName}</div>
                <div className={styles.esttAddress}>
                  {estAddress.split(',').map((part, i) => (
                    <div key={i}>{part.trim()}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.metaRight}>
              <span className={styles.metaLabel}>CODE NO. of the Factory/ Estt:</span>
              <span className={styles.metaCode}>{estCode}</span>
            </div>
          </div>

          {/* 5. 9-Column Statutory Table */}
          <div className={styles.tableWrap}>
            <table className={styles.statutoryTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Sl<br />No</th>
                  <th style={{ width: '150px' }}>Account No</th>
                  <th style={{ width: '160px' }}>Name of Employee</th>
                  <th style={{ width: '180px' }}>
                    Father's Name (or<br />Husband's Name<br />in case of married woman)
                  </th>
                  <th style={{ width: '95px' }}>Date of Birth</th>
                  <th style={{ width: '45px' }}>Sex</th>
                  <th style={{ width: '95px' }}>Date of<br />joining the Fund</th>
                  <th style={{ width: '160px' }}>
                    Total period of previous<br />service as on the date<br />of joining the Fund<br />(Enclose scheme certificate if<br />applicable)
                  </th>
                  <th style={{ width: '120px' }}>Remarks</th>
                </tr>
                <tr className={styles.numRow}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                  <th>9</th>
                </tr>
              </thead>
              <tbody>
                {displayedRecords.length > 0 ? (
                  displayedRecords.map((r, idx) => (
                    <tr key={r.employeeId || idx}>
                      <td className={styles.cellCenter}>{r.slNo || idx + 1}</td>
                      <td className={`${styles.cellLeft} ${styles.accountCell}`}>{r.accountNo || '—'}</td>
                      <td className={`${styles.cellLeft} ${styles.empNameCell}`}>{r.name || '—'}</td>
                      <td className={styles.cellLeft}>{r.fatherHusbandName || '—'}</td>
                      <td className={styles.cellCenter}>{r.dob || '—'}</td>
                      <td className={styles.cellCenter}>{r.sex || 'M'}</td>
                      <td className={styles.cellCenter}>{r.dateOfJoiningFund || ''}</td>
                      <td className={styles.cellCenter}>{r.previousService || ''}</td>
                      <td className={`${styles.cellLeft} ${styles.remarksCell}`}>{r.remarks || ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className={styles.nilRow}>
                      NIL Return: No employees qualifying for membership of EPF, EPS &amp; EDLI for the first time during the month of {monthLabel}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 6. Statutory Signatures Footer */}
          <div className={styles.formFooter}>
            <div className={styles.footerLeft}>
              Date :&nbsp;&nbsp;&nbsp;{generatedDate}
            </div>
            <div className={styles.footerCenter}>
              Stamp of the Factory / Estt.
            </div>
            <div className={styles.footerRight}>
              Signature of the Employer or other Authorised Officer of the Factory / Establishment
            </div>
          </div>

          <div className={styles.pageNumberRow}>
            Page 1 of 1
          </div>
        </div>
      </div>
    </div>
  );
}
