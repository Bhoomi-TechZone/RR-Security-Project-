import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  Users,
  CreditCard,
  FileCheck2
} from 'lucide-react';
import {
  downloadPfForm6APdf,
  downloadPfForm6AExcel,
  downloadPfForm6ACsv
} from '../../utils/pfForm6AExport';
import styles from './PfForm6AReportView.module.css';

/**
 * Statutory EPFO PF Form 6A (Revised) Component
 * Consolidated Annual Statement of Contribution for the Currency Period
 *
 * Statutory References:
 * - EMPLOYEES' PROVIDENT FUND SCHEME, 1952 (PARAGRAPH 43)
 * - THE EMPLOYEES' PENSION SCHEME, 1995 [PARAGRAPH 20(4)]
 */
export default function PfForm6AReportView({
  reportData = {},
  filters = {}
}) {
  const comp = reportData.companyInfo || {};
  const members = reportData.members || reportData.records || [];
  const period = reportData.period || { label: '01-May-2026 To 30-Apr-2027' };
  const statutoryRate = reportData.statutoryRate || '12%';
  const totals = reportData.totals || {};
  const remittances = reportData.remittances || [];
  const remittanceTotals = reportData.remittanceTotals || {};
  const cert = reportData.certification || {};

  // View switch: 'all' | 'statement' | 'remittance'
  const [activeView, setActiveView] = useState('all');

  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  const formatRupee = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleDownloadPdf = () => {
    downloadPfForm6APdf(reportData, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadPfForm6APdf(reportData, { mode: 'print' });
  };

  const handleExportExcel = () => {
    downloadPfForm6AExcel(reportData);
  };

  const handleExportCsv = () => {
    downloadPfForm6ACsv(reportData);
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            <span>Form 6A REVISED</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            <Users size={15} />
            <span>{members.length} Enclosed Cards</span>
          </span>

          <span className={`${styles.badge} ${styles.badgePurple}`}>
            <CreditCard size={15} />
            <span>Aggregate Costs: ₹{formatRupee(totals.aggregateCosts || 0)}</span>
          </span>

          <div className={styles.tabPills}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeView === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveView('all')}
            >
              Full Return
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeView === 'statement' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveView('statement')}
            >
              Member Statement
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeView === 'remittance' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveView('remittance')}
            >
              Remittance Reconciliation
            </button>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.primaryBtn}`}
            onClick={handleDownloadPdf}
            title="Download Official Statutory PDF"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportExcel}
            title="Download Multi-Sheet Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleExportCsv}
            title="Download CSV"
          >
            <FileText size={14} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handlePrint}
            title="Print Official Form 6A"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Official Form 6A Desk Backdrop */}
      <div className={styles.paperWrap}>
        {/* =========================================================
            SHEET 1: MEMBER CONTRIBUTIONS STATEMENT (PAGE 1)
           ========================================================= */}
        {(activeView === 'all' || activeView === 'statement') && (
          <div className={styles.paper}>
            {/* Top Right Box: Form - 6A REVISED */}
            <div className={styles.headerTopRow}>
              <div className={styles.formBox}>
                <div className={styles.formBoxTitle}>Form - 6A</div>
                <div className={styles.formBoxSubtitle}>REVISED</div>
              </div>
            </div>

            {/* Centered Act Headings */}
            <div className={styles.titleCenter}>
              <h1 className={styles.mainActTitle}>EMPLOYEES' PROVIDENT FUND SCHEME, 1952 (PARAGRAPH 43)</h1>
              <div className={styles.andWord}>AND</div>
              <h2 className={styles.subActTitle}>THE EMPLOYEES' PENSION SCHEME, 1995 [PARAGRAPH 20(4)]</h2>
            </div>

            {/* Currency Period & Statutory Rate */}
            <div className={styles.metaTopBar}>
              <div>
                <span className={styles.currencyLabel}>Annual Statement of Contribution for the Currency period from</span>
                <span className={styles.currencyValue}>{period.label || '01-May-2026 To 30-Apr-2027'}</span>
              </div>
              <div className={styles.statRate}>
                <strong>Statutory Rate of Contribution: {statutoryRate}</strong>
              </div>
            </div>

            {/* Establishment Details */}
            <div className={styles.esttBlock}>
              <div className={styles.esttRow}>
                <div className={styles.esttRowLabel}>Name and Address of the Establishment :</div>
                <div>
                  <div className={styles.esttName}>{estName}</div>
                  {estAddress.split(',').map((part, i) => (
                    <div key={i} className={styles.esttAddressLine}>{part.trim()}</div>
                  ))}
                </div>
              </div>

              <div className={styles.esttRow}>
                <div className={styles.esttRowLabel}>Code No. of the Establishment :</div>
                <div className={styles.esttCode}>{estCode}</div>
              </div>
            </div>

            {/* 9-Column Member Statement Table with Sub-columns a, b, c */}
            <div className={styles.tableWrap}>
              <table className={styles.statTable}>
                <thead>
                  <tr>
                    <th rowSpan="2" style={{ width: '30px' }}>Sl No</th>
                    <th rowSpan="2" style={{ width: '130px' }}>Account.<br />No.</th>
                    <th rowSpan="2" style={{ width: '145px' }}>Name of the Member</th>
                    <th rowSpan="2" style={{ width: '110px' }}>
                      Wages retaining,<br />allowance(if any)<br />and D.A.<br />including<br />Cash values of<br />food concession<br />paid during the<br />currency period
                    </th>
                    <th colSpan="3">
                      Amount of Worker's Contributions<br />deducted from the Wages
                    </th>
                    <th colSpan="3">
                      Employer's Contributions
                    </th>
                    <th rowSpan="2" style={{ width: '65px' }}>Refund<br />of<br />Advance</th>
                    <th rowSpan="2" style={{ width: '85px' }}>Rate of  Higher<br />Voluntary<br />Contribution  if<br />any</th>
                    <th rowSpan="2" style={{ width: '100px' }}>Remarks</th>
                  </tr>
                  <tr>
                    <th style={{ width: '55px' }}>EPF<br />a</th>
                    <th style={{ width: '50px' }}>EPS<br />b</th>
                    <th style={{ width: '55px' }}>Total<br />c</th>
                    <th style={{ width: '55px' }}>EPF<br />a</th>
                    <th style={{ width: '55px' }}>EPS<br />b</th>
                    <th style={{ width: '55px' }}>Total<br />c</th>
                  </tr>
                  <tr className={styles.numRow}>
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                    <th colSpan="3">5</th>
                    <th colSpan="3">6</th>
                    <th>7</th>
                    <th>8</th>
                    <th>9</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => (
                    <tr key={m.employeeId || idx}>
                      <td className={styles.cellCenter}>{m.slNo || idx + 1}</td>
                      <td className={`${styles.cellLeft} ${styles.accountNo}`}>{m.accountNo || '—'}</td>
                      <td className={`${styles.cellLeft} ${styles.memberName}`}>{m.name || '—'}</td>
                      <td className={styles.cellRight}>{formatRupee(m.wages)}</td>
                      <td className={styles.cellRight}>{formatRupee(m.workerContribution?.epf)}</td>
                      <td className={styles.cellRight}>{formatRupee(m.workerContribution?.eps)}</td>
                      <td className={`${styles.cellRight}`} style={{ fontWeight: 600 }}>{formatRupee(m.workerContribution?.total)}</td>
                      <td className={styles.cellRight}>{formatRupee(m.employerContribution?.epf)}</td>
                      <td className={styles.cellRight}>{formatRupee(m.employerContribution?.eps)}</td>
                      <td className={`${styles.cellRight}`} style={{ fontWeight: 600 }}>{formatRupee(m.employerContribution?.total)}</td>
                      <td className={styles.cellRight}>{m.refundOfAdvance ? formatRupee(m.refundOfAdvance) : ''}</td>
                      <td className={styles.cellCenter}>{m.voluntaryRate || ''}</td>
                      <td className={styles.cellLeft} style={{ fontSize: '9px' }}>{m.remarks || ''}</td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr className={styles.totalRow}>
                    <td colSpan="3" className={styles.cellRight} style={{ fontWeight: 700 }}>Total</td>
                    <td className={styles.cellRight}>{formatRupee(totals.wages)}</td>
                    <td className={styles.cellRight}>{formatRupee(totals.workerEpf)}</td>
                    <td className={styles.cellRight}>{formatRupee(totals.workerEps)}</td>
                    <td className={styles.cellRight}>{formatRupee(totals.workerTotal)}</td>
                    <td className={styles.cellRight}>{formatRupee(totals.employerEpf)}</td>
                    <td className={styles.cellRight}>{formatRupee(totals.employerEps)}</td>
                    <td className={styles.cellRight}>{formatRupee(totals.employerTotal)}</td>
                    <td className={styles.cellRight}>{totals.refundOfAdvance ? formatRupee(totals.refundOfAdvance) : ''}</td>
                    <td className={styles.cellCenter}></td>
                    <td className={styles.cellLeft}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            SHEET 2: RECONCILIATION OF REMITTANCES & CERTIFICATION (PAGE 2)
           ========================================================= */}
        {(activeView === 'all' || activeView === 'remittance') && (
          <div className={styles.paper}>
            <div className={styles.part2Container}>
              {/* Left Side: Reconciliation of Remittances Table */}
              <div className={styles.remittanceSection}>
                <table className={styles.remittanceTable}>
                  <thead>
                    <tr>
                      <th colSpan="2" style={{ fontSize: '9.5px' }}>Reconciliation of Remittances</th>
                      <th colSpan="3" style={{ fontSize: '8.5px' }}>
                        Total Rs.<br />(Admn. Charges Rs.<br />at 0.5% of wages )
                      </th>
                      <th colSpan="3" style={{ fontSize: '8.5px' }}>
                        Contributions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Rs.<br />
                        Aggregate&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;)
                      </th>
                    </tr>
                    <tr>
                      <th style={{ width: '22px' }}>No</th>
                      <th style={{ width: '85px' }}>Month</th>
                      <th style={{ width: '75px' }}>
                        EPF contribution<br />including refund<br />of advances<br />A/c No. 1<br />(Rs.)
                      </th>
                      <th style={{ width: '70px' }}>
                        Pension Fund<br />contributions<br />A/c. No 10<br />(Rs.)
                      </th>
                      <th style={{ width: '60px' }}>
                        EDLI<br />contribution<br />A/c. No 21<br />(Rs.)
                      </th>
                      <th style={{ width: '60px' }}>
                        Admn.<br />charges<br />A/c No 2<br />(Rs.)
                      </th>
                      <th style={{ width: '60px' }}>
                        EDLI ADM<br />charges<br />0.01%<br />(Rs.)
                      </th>
                      <th style={{ width: '85px' }}>Date of<br />Remittances</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remittances.map((r, i) => (
                      <tr key={i}>
                        <td className={styles.cellCenter}>{r.no}</td>
                        <td className={styles.cellLeft}>{r.month}</td>
                        <td className={styles.cellRight}>{r.month.includes('Supplementary') && !r.ac1 ? '' : formatRupee(r.ac1)}</td>
                        <td className={styles.cellRight}>{r.month.includes('Supplementary') && !r.ac10 ? '' : formatRupee(r.ac10)}</td>
                        <td className={styles.cellRight}>{r.month.includes('Supplementary') && !r.ac21 ? '' : formatRupee(r.ac21)}</td>
                        <td className={styles.cellRight}>{r.month.includes('Supplementary') && !r.ac2 ? '' : formatRupee(r.ac2)}</td>
                        <td className={styles.cellRight}>{r.month.includes('Supplementary') && !r.ac22 ? '' : formatRupee(r.ac22)}</td>
                        <td className={styles.cellCenter}>{r.dateOfRemittance || ''}</td>
                      </tr>
                    ))}

                    {/* Total Remittances Row */}
                    <tr className={styles.totalRow}>
                      <td></td>
                      <td className={styles.cellRight} style={{ fontWeight: 700 }}>Total</td>
                      <td className={styles.cellRight}>{formatRupee(remittanceTotals.totalAc1)}</td>
                      <td className={styles.cellRight}>{formatRupee(remittanceTotals.totalAc10)}</td>
                      <td className={styles.cellRight}>{formatRupee(remittanceTotals.totalAc21)}</td>
                      <td className={styles.cellRight}>{formatRupee(remittanceTotals.totalAc2)}</td>
                      <td className={styles.cellRight}>{formatRupee(remittanceTotals.totalAc22)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Side: Statutory Certification Block */}
              <div className={styles.certificationSection}>
                <div className={styles.certCostHeader}>
                  Aggregate of total costs 5 + 6 + 7 Rs. {formatRupee(cert.aggregateTotalCosts || totals.aggregateCosts)}
                </div>

                <div className={styles.certPoints}>
                  <div>
                    <strong>i) Total number of contribution cards enclosed [Form 3A (Revised)]:</strong>&nbsp;{cert.totalCardsEnclosed || members.length}
                  </div>
                  <div>
                    <strong>ii)</strong> Certified that Form 3A duly completed of all the members listed in this statement are enclosed., except those already sent during the course of the currency period for the final settlement of the concerned member's account vide 'Remarks' furnished against the names of the respective members above.
                  </div>
                </div>

                <div className={styles.certSignBlock}>
                  <div className={styles.signLine}>Signature of Employer</div>
                  <div className={styles.signSub}>(with office seal)</div>
                </div>
              </div>
            </div>

            {/* Bottom Statutory Notes */}
            <div className={styles.notesSection}>
              <div className={styles.notesTitle}>Note :</div>
              <div className={styles.noteItem}>
                i) The names of all members, including those who had left the services during the currency period , should be included in this statement. Where the Form 3A in respect of such member had left the service were already sent to the Regional Office for the purpose of final settlement of their accounts,the fact should be stated against the members in the 'Remarks column above thus "Form 3A already sent in the month of ...............200 ".
              </div>
              <div className={styles.noteItem}>
                ii) In case of substantial variation in the wages/contribution of any members as compared to those shown in previous months statement, the reason should be explained adquately in the 'Remarks' column.
              </div>
              <div className={styles.noteItem}>
                iii) In respect of those members who have not opted for Pension Fund their entire employers contribution @ 8 1/3% or 10% as the case may be should be shown under column No. 6.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
