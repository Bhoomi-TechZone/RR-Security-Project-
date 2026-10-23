import React, { useState } from 'react';
import {
  Download,
  Printer,
  ShieldCheck,
  UserX,
  Filter
} from 'lucide-react';
import { downloadPfForm10Pdf } from '../../utils/pfForm10Export';
import styles from './PfForm10ReportView.module.css';

/**
 * Statutory EPFO PF Form 10 Component (PDF ONLY format per explicit user instruction)
 * Return of members leaving service during the month
 *
 * Statutory References:
 * - THE EMPLOYEES' PROVIDENT FUNDS SCHEME, 1952 [Paragraph 36(2)(a) & (b)]
 * - THE EMPLOYEES' PENSION SCHEME, 1995 [Paragraph 20(2)]
 */
export default function PfForm10ReportView({
  reportData = {},
  filters = {},
  onScopeChange
}) {
  const comp = reportData.companyInfo || {};
  const allRecords = reportData.records || [];
  const monthLabel = reportData.monthLabel || 'May 2026';
  const generatedDate = reportData.generatedDate || '13-Sep-2026';
  const hasMonthExited = Boolean(reportData.hasMonthExited);

  // Local filter: Month leaving members vs All relieved members
  const [scope, setScope] = useState('auto'); // 'auto' | 'monthOnly' | 'all'

  const displayedRecords = React.useMemo(() => {
    if (scope === 'monthOnly') {
      return allRecords.filter(r => r.isMonthExited);
    }
    return allRecords;
  }, [allRecords, scope]);

  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur, SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  const handleDownloadPdf = () => {
    downloadPfForm10Pdf({
      ...reportData,
      records: displayedRecords
    }, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadPfForm10Pdf({
      ...reportData,
      records: displayedRecords
    }, { mode: 'print' });
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar (PDF ONLY format) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            <span>EPFO Statutory Form 10</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            <UserX size={15} />
            <span>{displayedRecords.length} Leaving Member{displayedRecords.length === 1 ? '' : 's'}</span>
          </span>

          {allRecords.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <select
                className={styles.scopeSelect}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                aria-label="Filter Scope"
              >
                <option value="auto">
                  {hasMonthExited ? `Left in ${monthLabel} (${reportData.monthExitedCount || displayedRecords.length})` : 'All Exited Members'}
                </option>
                <option value="monthOnly">Only Exited in {monthLabel} ({reportData.monthExitedCount || 0})</option>
                <option value="all">All Relieved &amp; Exited Staff ({reportData.allExitedCount || allRecords.length})</option>
              </select>
            </div>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.primaryBtn}`}
            onClick={handleDownloadPdf}
            title="Download Official Form 10 PDF"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handlePrint}
            title="Print Official Form 10"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Official Form 10 Printable Paper Container */}
      <div className={styles.paperWrap}>
        <div className={styles.paper}>
          {/* 1. Centered Header Box: FORM 10 */}
          <div className={styles.formHeaderBox}>
            <h1 className={styles.formHeaderTitle}>FORM 10</h1>
          </div>

          {/* 2. Organisation & Scheme Subtitles */}
          <h2 className={styles.orgTitle}>Employees Provident Fund Organization</h2>
          <div className={styles.schemeSubtitle}>
            THE EMPLOYEES' PROVIDENT FUNDS SCHEME, 1952 [Paragraph 36(2)(a) &amp; (b)]&nbsp;&nbsp;AND THE EMPLOYEES' PENSION SCHEME, 1995
          </div>
          <div className={styles.schemeSubtitleSecond}>
            [Paragraph 20(2)]
          </div>

          {/* 3. Statutory Return Declaration Statement */}
          <p className={styles.returnStatement}>
            Return of the members leaving service during the month of&nbsp;&nbsp;
            <span className={styles.monthHighlight}>{monthLabel}</span>
          </p>

          {/* 4. Factory / Establishment Metadata */}
          <div className={styles.metaGrid}>
            <div className={styles.metaLeft}>
              <span className={styles.metaLabel}>Name and Address of the Factory / </span>
              <span className={styles.esttNameAndAddress}>
                <strong className={styles.esttNameBold}>{estName}</strong> , {estAddress.replace(/[\r\n]+/g, ', ')}
              </span>
            </div>

            <div className={styles.metaRight}>
              <span className={styles.metaLabel}>CODE No. of the Factory/ Estt:</span>
              <span className={styles.metaCode}>{estCode}</span>
            </div>
          </div>

          {/* 5. 7-Column Statutory Table */}
          <div className={styles.tableWrap}>
            <table className={styles.statutoryTable}>
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>Sl.No</th>
                  <th style={{ width: '160px' }}>Account No</th>
                  <th style={{ width: '170px' }}>Name of the Member</th>
                  <th style={{ width: '190px' }}>
                    Father's Name or Husband's<br />Name (in case of married<br />woman)
                  </th>
                  <th style={{ width: '130px' }}>Date of Leaving Service</th>
                  <th style={{ width: '140px' }}>Reason for Leaving<br />Service</th>
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
                </tr>
              </thead>
              <tbody>
                {displayedRecords.length > 0 ? (
                  displayedRecords.map((r, idx) => (
                    <tr key={r.employeeId || idx}>
                      <td className={styles.cellCenter}>{r.slNo || idx + 1}</td>
                      <td className={`${styles.cellLeft} ${styles.accountNo}`}>{r.accountNo || '—'}</td>
                      <td className={`${styles.cellLeft} ${styles.memberName}`}>{r.name || '—'}</td>
                      <td className={styles.cellLeft}>{r.fatherHusbandName || ''}</td>
                      <td className={styles.cellCenter}>{r.dateOfLeaving || '—'}</td>
                      <td className={`${styles.cellLeft} ${styles.reasonCell}`}>{r.reasonForLeaving || 'RESIGNED - C'}</td>
                      <td className={`${styles.cellLeft} ${styles.remarksCell}`}>{r.remarks || ''}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className={styles.nilRow}>
                      NIL Return: No members left service during the month of {monthLabel}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 6. Signatures Line */}
          <div className={styles.formFooter}>
            <div className={styles.footerLeft}>
              Date :&nbsp;&nbsp;&nbsp;{generatedDate}
            </div>
            <div className={styles.footerCenter}>
              Stamp of Factory / Estt.
            </div>
            <div className={styles.footerRight}>
              Signature of the Employeer or other Authorised<br />Officer
            </div>
          </div>

          {/* 7. Statutory Footnotes */}
          <div className={styles.footnoteBlock}>
            <p className={styles.footnoteItem}>
              *Please state whether the member is (a) retiring according to para (69) (1) (a) or (b) of the scheme (b) leaving India for permanent settlement abroad (c) retrenchment (d) Pt. &amp; total disablement due to employment injury (e) discharged (f) resigning from or leaving service (g) taking up employment elsewhere (The name and address of the Employers should be stated) (h) death  (i) attained the age of 58 years
            </p>
            <p className={styles.footnoteItem}>
              Certified that the member mentioned at Serial No..................................................Shri...........................................................................................................was paid / not paid retrenchment compensation of Rs. ...................................................................................under the Industrial Dispute Act, 1947.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
