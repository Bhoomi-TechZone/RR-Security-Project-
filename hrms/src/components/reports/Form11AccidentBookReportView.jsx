import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Building,
} from 'lucide-react';
import {
  downloadForm11AccidentBookPdf,
  downloadForm11AccidentBookExcel,
  downloadForm11AccidentBookCsv,
} from '../../utils/form11AccidentBookExport';
import styles from './Form11AccidentBookReportView.module.css';

/**
 * =========================================================================
 * FORM 11 - ACCIDENT BOOK VIEW (ESIC REGULATION 66)
 *
 * Exact statutory reproduction matching official ESIC Form 11:
 * - Header: FORM 11 / ACCIDENT BOOK / EMPLOYEES' STATE INSURANCE CORPORATION / (Regulation 66)
 * - 18 Columns:
 *    1. Sl.No
 *    2. Date of Notice
 *    3. Time of Notice
 *    4. Name and Address of Injured Person
 *    5. Sex
 *    6. Age
 *    7. Insurance No.
 *    8. Shift, department and Occupation of the employee
 *    9-13. Details of Injury (Cause, Nature, Date, Time, Place)
 *    14. What exactly was the injured person doing at the time of accident
 *    15. Name, occupation, address and signature or the thumb impression of the person(s) giving notice
 *    16. Signature and designation of the person who makes the entry in the Accident Book
 *    17. Signature and designation of the person who makes the entry in the Accident Book
 *    18. Remarks, if any
 * - Row 3: Statutory column numbers 1 to 18
 * - Dynamic statutory NIL row: "No Accident in the Month of <Month Year>"
 * - Right aligned: "Signature of the Employer"
 * =========================================================================
 */
export default function Form11AccidentBookReportView({
  reportData = {},
  filters = {},
}) {
  const safeData = reportData || {};
  const records = safeData.records || [];
  const company = safeData.company || {};
  const monthLabel = safeData.monthLabel || filters.month || 'May 2026';
  const nilStatement = safeData.nilStatement || `No Accident in the Month of ${monthLabel}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.statutoryTag}>
            <ShieldCheck size={16} color="#2563eb" />
            ESIC Form 11 (Regulation 66)
          </span>
          <span className={styles.statutoryTag}>
            <Calendar size={16} color="#059669" />
            {monthLabel}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={() => downloadForm11AccidentBookPdf(safeData)}
            title="Download Statutory Landscape PDF"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={() => downloadForm11AccidentBookExcel(safeData)}
            title="Export Excel (XLSX)"
          >
            <FileSpreadsheet size={15} color="#16a34a" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={() => downloadForm11AccidentBookCsv(safeData)}
            title="Export CSV"
          >
            <FileText size={15} color="#475569" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handlePrint}
            title="Print Form 11"
          >
            <Printer size={15} color="#2563eb" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Accidents Logged</span>
            <span className={styles.kpiValue}>{records.length}</span>
          </div>
          <div className={`${styles.kpiIcon} ${records.length === 0 ? styles.iconGreen : styles.iconOrange}`}>
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Statutory Status</span>
            <span className={styles.kpiValue}>
              {records.length === 0 ? 'NIL Accident Recorded' : `${records.length} Incidents Filed`}
            </span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Reporting Month</span>
            <span className={styles.kpiValue}>{monthLabel}</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>
            <Calendar size={20} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Compliance Regulation</span>
            <span className={styles.kpiValue}>Regulation 66 Compliant</span>
          </div>
          <div className={`${styles.kpiIcon} ${styles.iconIndigo}`}>
            <Building size={20} />
          </div>
        </div>
      </div>

      {/* Statutory Document Paper Sheet */}
      <div className={styles.paperSheet}>
        {/* Document Header */}
        <div className={styles.docHeader}>
          <h2 className={styles.formMainTitle}>FORM 11</h2>
          <h3 className={styles.formSubTitle}>ACCIDENT BOOK</h3>
          <h4 className={styles.corpTitle}>EMPLOYEES' STATE INSURANCE CORPORATION</h4>
          <p className={styles.regText}>(Regulation 66)</p>
        </div>

        {/* Establishment Info Strip */}
        <div className={styles.infoStrip}>
          <div className={styles.infoItem}>
            <span className={styles.infoTitle}>Name & Address of Factory / Establishment</span>
            <span className={styles.infoValue}>
              {company.name || 'RR SECURITY & FACILITIES'}{' '}
              {company.address ? `— ${company.address}` : ''}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoTitle}>ESIC Registration Code No.</span>
            <span className={styles.infoValue}>{company.esiCode || '—'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoTitle}>Register Month & Year</span>
            <span className={styles.infoValue}>{monthLabel}</span>
          </div>
        </div>

        {/* 18-Column Statutory Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.statutoryTable}>
            <thead>
              {/* Header Tier 1 */}
              <tr className={styles.headerRow}>
                <th rowSpan={2} style={{ width: '28px' }}>Sl.No</th>
                <th rowSpan={2} style={{ width: '56px' }}>Date of<br />Notice</th>
                <th rowSpan={2} style={{ width: '50px' }}>Time of<br />Notice</th>
                <th rowSpan={2} style={{ minWidth: '120px' }}>Name and<br />Address of<br />Injured<br />Person</th>
                <th rowSpan={2} style={{ width: '36px' }}>Sex</th>
                <th rowSpan={2} style={{ width: '32px' }}>Age</th>
                <th rowSpan={2} style={{ minWidth: '80px' }}>Insurance<br />No.</th>
                <th rowSpan={2} style={{ minWidth: '110px' }}>Shift,<br />department<br />and<br />Occupation<br />of the<br />employee</th>
                <th colSpan={5}>Details of Injury</th>
                <th rowSpan={2} style={{ minWidth: '100px' }}>What<br />exactly<br />was the<br />injured<br />person<br />doing at<br />the time<br />of<br />accident</th>
                <th rowSpan={2} style={{ minWidth: '110px' }}>Name,<br />occupation,<br />address<br />and<br />signature<br />or the<br />thumb<br />impressio<br />n of the<br />person(s)<br />giving<br />notice</th>
                <th rowSpan={2} style={{ minWidth: '95px' }}>Signature<br />and<br />designati<br />on of the<br />person<br />who<br />makes the<br />entry in<br />the<br />Accident<br />Book</th>
                <th rowSpan={2} style={{ minWidth: '95px' }}>Signature<br />and<br />designati<br />on of the<br />person<br />who<br />makes the<br />entry in<br />the<br />Accident<br />Book</th>
                <th rowSpan={2} style={{ minWidth: '70px' }}>Remarks,<br />if any</th>
              </tr>
              {/* Header Tier 2 */}
              <tr className={styles.headerRow}>
                <th style={{ minWidth: '70px' }}>Cause</th>
                <th style={{ minWidth: '70px' }}>Nature</th>
                <th style={{ minWidth: '55px' }}>Date</th>
                <th style={{ minWidth: '50px' }}>Time</th>
                <th style={{ minWidth: '65px' }}>Place</th>
              </tr>
              {/* Header Tier 3: Numbers 1 to 18 */}
              <tr className={styles.colNumRow}>
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
                <th>13</th>
                <th>14</th>
                <th>15</th>
                <th>16</th>
                <th>17</th>
                <th>18</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                /* Dynamic NIL Statement row matching reference image */
                <tr>
                  <td colSpan={18} className={styles.nilCell}>
                    {nilStatement}
                  </td>
                </tr>
              ) : (
                records.map((row, idx) => (
                  <tr key={row._id || row.id || idx}>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.slNo || idx + 1}</td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.noticeDate || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.noticeTime || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>
                      <strong>{row.injuredPersonName || '—'}</strong>
                      {row.injuredPersonAddress && row.injuredPersonAddress !== '—' && (
                        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                          {row.injuredPersonAddress}
                        </div>
                      )}
                    </td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.gender || row.sex || 'Male'}</td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.age || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.insuranceNumber || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.shiftDeptOccupation || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.causeOfInjury || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.natureOfInjury || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.accidentDate || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textCenter}`}>{row.accidentTime || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.accidentPlace || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.activityAtAccidentTime || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.noticeGiverDetails || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.entryMakerDetails || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.witnessOrCertifierDetails || row.entryMakerDetails || '—'}</td>
                    <td className={`${styles.dataCell} ${styles.textLeft}`}>{row.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Signature of the Employer */}
        <div className={styles.docFooter}>
          <div className={styles.signatureBox}>
            <div className={styles.signatureSpace} />
            <span className={styles.signatureTitle}>Signature of the Employer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
