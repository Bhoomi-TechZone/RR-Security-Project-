import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Info,
  ShieldCheck,
  IndianRupee,
  Users,
  AlertTriangle,
} from 'lucide-react';
import {
  downloadFormIFinesPdf,
  downloadFormIFinesExcel,
  downloadFormIFinesCsv,
} from '../../utils/finesFormIExport';
import styles from './FinesFormIReportView.module.css';

/**
 * Statutory Form-I [Rule-21(4)]
 * Register of Fines
 * Salary Reports Module
 * Minimum Wages Central Rules, 1950 - Form I [Rule 21(4)]
 * Matches exact 11-column table and headers from user's reference format.
 */
export default function FinesFormIReportView({
  records = [],
  employer = '',
  employerInfo = {},
  period = {},
  totals = {},
  hasFines = false,
  emptyMessage = '',
  filters = {},
}) {
  const employerName =
    employer ||
    employerInfo?.name ||
    (filters?.company && filters.company !== 'All Companies' ? filters.company : null) ||
    '—';

  const periodLabel = period?.monthLabel || period?.month || filters?.month || 'Current Month';

  const handleDownloadPdf = () => {
    downloadFormIFinesPdf(records, employerName, period, totals, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadFormIFinesPdf(records, employerName, period, totals, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadFormIFinesExcel(records, employerName, period, totals, { format: 'xlsx' });
  };

  const handleDownloadCsv = () => {
    downloadFormIFinesCsv(records, employerName, period, totals, { format: 'csv' });
  };

  const totalFines = totals?.totalFinesImposed ?? records.reduce((s, r) => s + (Number(r.fineAmount) || 0), 0);
  const totalRealised = totals?.totalRealised ?? records.reduce((s, r) => s + (Number(r.realisedAmount) || 0), 0);
  const totalPending = totals?.totalPending ?? Math.max(0, totalFines - totalRealised);

  // Template minimum rows for authentic statutory register rendering
  const minRows = Math.max(records.length, 5);
  const displayRows = [];
  for (let i = 0; i < minRows; i++) {
    if (i < records.length) {
      displayRows.push({ isReal: true, data: records[i], index: i });
    } else {
      displayRows.push({
        isReal: false,
        symbol: i < 5 ? String(i + 1) : i === 5 ? '*' : i === 6 ? '**' : i === 7 ? '**' : '*',
        index: i,
      });
    }
  }

  return (
    <div className={styles.container}>
      {/* Action Toolbar */}
      

      {/* Official Form-I Document Frame */}
      <div className={styles.documentFrame}>
        {/* Header Section matching Image 1 */}
        <div className={styles.docHeaderCenter}>
          <div className={styles.titleForm}>FORM-I</div>
          <div className={styles.ruleSub}>[Rule-21(4)]</div>
          <div className={styles.titleStatutory}>Register of Fines</div>
          <div className={styles.employerLine}>
            Employer &nbsp;<u>{employerName}</u>
          </div>
        </div>

        {/* Empty Banner when no fines recorded */}
        {(!hasFines || records.length === 0) && (
          <div className={styles.nilBanner}>
            {emptyMessage || `NIL / NO FINES RECORDED IN ${periodLabel.toUpperCase()}`}
          </div>
        )}

        {/* 11-Column Table */}
        <div className={styles.tableWrap}>
          <table className={styles.formTable}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>S.<br />No.</th>
                <th style={{ minWidth: '130px' }}>Name</th>
                <th style={{ minWidth: '130px' }}>Father's/<br />Husband's<br />Name</th>
                <th style={{ width: '60px' }}>Sex</th>
                <th style={{ minWidth: '100px' }}>Department</th>
                <th style={{ minWidth: '170px' }}>Nature and<br />date of the<br />offence for<br />which fine<br />imposed</th>
                <th style={{ minWidth: '160px' }}>Whether<br />workman<br />showed<br />cause<br />against fine<br />or not, if<br />so, enter<br />date</th>
                <th style={{ minWidth: '110px' }}>Rate<br />of<br />Wages</th>
                <th style={{ minWidth: '110px' }}>Date and<br />amount<br />of fine<br />imposed</th>
                <th style={{ minWidth: '110px' }}>Date on<br />which<br />fine<br />realised</th>
                <th style={{ minWidth: '100px' }}>Remarks</th>
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
                <th>10</th>
                <th>11</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((item, idx) => {
                if (item.isReal) {
                  const r = item.data;
                  return (
                    <tr key={r.id || `row-${idx}`}>
                      <td className={styles.colCenter}>{r.srNo || idx + 1}</td>
                      <td className={styles.bold}>{r.name}</td>
                      <td>{r.fatherHusbandName || '—'}</td>
                      <td className={styles.colCenter}>{r.sex || 'Male'}</td>
                      <td>{r.department || '—'}</td>
                      <td>{r.natureAndDate}</td>
                      <td>{r.showedCauseWithDate}</td>
                      <td>{r.rateOfWages || '—'}</td>
                      <td className={styles.bold}>{r.dateAndAmountFine || '—'}</td>
                      <td>{r.dateFineRealised || '—'}</td>
                      <td>{r.remarks || '—'}</td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={`empty-${idx}`}>
                      <td className={styles.colCenter} style={{ color: '#64748b' }}>
                        {item.symbol}
                      </td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  );
                }
              })}

              {/* Total Row if records present */}
              {records.length > 0 && (
                <tr className={styles.totalRow}>
                  <td className={styles.colCenter}>Total</td>
                  <td colSpan="7" style={{ fontWeight: 700 }}>
                    {records.length} Employee(s)
                  </td>
                  <td className={styles.bold}>
                    ₹{totalFines.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.bold}>
                    ₹{totalRealised.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Authorised Signatory */}
        <div className={styles.signatoryFooter}>
          <div className={styles.signatoryWrap}>
            Authorised Signatory
          </div>
        </div>
      </div>
    </div>
  );
}
