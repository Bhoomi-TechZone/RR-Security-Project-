import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Info,
  ShieldCheck,
  IndianRupee,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  downloadFormIIDeductionsDamagePdf,
  downloadFormIIDeductionsDamageExcel,
  downloadFormIIDeductionsDamageCsv,
} from '../../utils/deductionsDamageFormIIExport';
import styles from './DeductionsDamageFormIIReportView.module.css';

/**
 * Statutory Form-II [Rules 21 (4)]
 * REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS CAUSED TO THE EMPLOYER
 * BY THE NEGLECT OR DEFAULT OF THE EMPLOYED PERSONS
 * Salary Reports Module
 * Matches exact 11-column table and headers from reference format.
 */
export default function DeductionsDamageFormIIReportView({
  records = [],
  employer = '',
  employerInfo = {},
  period = {},
  totals = {},
  hasDamage = false,
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
    downloadFormIIDeductionsDamagePdf(records, employerName, period, totals, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadFormIIDeductionsDamagePdf(records, employerName, period, totals, { mode: 'print' });
  };

  const handleDownloadExcel = () => {
    downloadFormIIDeductionsDamageExcel(records, employerName, period, totals, { format: 'xlsx' });
  };

  const handleDownloadCsv = () => {
    downloadFormIIDeductionsDamageCsv(records, employerName, period, totals, { format: 'csv' });
  };

  const totalDeductions = totals?.totalDeductionsImposed ?? records.reduce((s, r) => s + (Number(r.deductionAmount) || 0), 0);
  const totalFines = totals?.totalFinesImposed ?? records.reduce((s, r) => s + (Number(r.fineAmount) || 0), 0);
  const totalRealised = totals?.totalRealised ?? records.reduce((s, r) => s + (Number(r.recoveredAmount) || 0), 0);
  const totalPending = totals?.totalPending ?? Math.max(0, totalDeductions + totalFines - totalRealised);

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
      

      {/* Official Form-II Document Frame */}
      <div className={styles.documentFrame}>
        {/* Header Section */}
        <div className={styles.docHeaderCenter}>
          <div className={styles.titleForm}>FORM-II</div>
          <div className={styles.ruleSub}>[Rules 21 (4)]</div>
          <div className={styles.titleStatutory}>
            REGISTER OF DEDUCTIONS FOR DAMAGE OR LOSS CAUSED TO THE EMPLOYER<br />
            BY THE NEGLECT OR DEFAULT OF THE EMPLOYED PERSONS
          </div>
          <div className={styles.employerLine}>
            Employer &nbsp;<u>{employerName}</u>
          </div>
        </div>

        {/* Empty Banner when no records in month */}
        {(!hasDamage || records.length === 0) && (
          <div className={styles.nilBanner}>
            {emptyMessage || `NIL / NO DEDUCTIONS FOR DAMAGE OR LOSS RECORDED IN ${periodLabel.toUpperCase()}`}
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
                <th style={{ minWidth: '160px' }}>Damage or<br />loss caused<br />with date</th>
                <th style={{ minWidth: '160px' }}>Whether worker<br />showed cause<br />against deductions,<br />if so, enter date</th>
                <th style={{ minWidth: '120px' }}>Date and<br />amount of<br />deductions<br />imposed</th>
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
                      <td>{r.damageLossWithDate}</td>
                      <td>{r.showedCauseWithDate}</td>
                      <td className={styles.bold}>{r.dateAndAmountDeduction}</td>
                      <td>{r.dateAndAmountFine || '—'}</td>
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
                  <td colSpan="6" style={{ fontWeight: 700 }}>
                    {records.length} Employee(s)
                  </td>
                  <td className={styles.bold}>
                    ₹{totalDeductions.toLocaleString('en-IN')}
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
