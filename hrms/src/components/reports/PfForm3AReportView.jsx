import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { downloadPfForm3APdf, downloadPfForm3AExcel } from '../../utils/pfForm3AExport';
import styles from './PfForm3AReportView.module.css';

/**
 * Statutory EPFO PF Form 3A (Revised) View Component
 * (Annual Contribution Card)
 * Rules:
 * 1. STRICTLY WITHOUT LOGO (Per explicit user instruction)
 * 2. Uses Admin Company Name & Address in Establishment Details
 * 3. Exact statutory reproduction of Form 3A (Revised)
 */
export default function PfForm3AReportView({
  reportData = {},
  filters = {},
  onSelectEmployee,
}) {
  const cards = reportData.cards || (reportData.activeCard ? [reportData.activeCard] : []);
  const initialActive = reportData.activeCard || cards[0] || {};
  const [selectedEmpId, setSelectedEmpId] = useState(initialActive.employeeId || '');
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'allMembers'

  // Determine active card based on selectedEmpId
  const activeCard = useMemo(() => {
    if (!selectedEmpId) return cards[0] || {};
    return cards.find((c) => c.employeeId === selectedEmpId) || cards[0] || {};
  }, [cards, selectedEmpId]);

  const comp = reportData.companyInfo || {};
  const currencyPeriod = reportData.currencyPeriod || { label: '01 Apr 2025 to 31 Mar 2026' };
  const summaryCards = reportData.summaryCards || [];

  const adminName = (activeCard.establishmentName || comp.name || 'RR SECURITY & FACILITIES').toUpperCase();
  const adminAddress = activeCard.establishmentAddress || comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur SOUTH DELHI';
  const statutoryRate = activeCard.statutoryRate || '12%';

  const handleDownloadPdf = (scope = 'single') => {
    downloadPfForm3APdf(
      {
        ...reportData,
        activeCard,
        cards,
      },
      { mode: 'download', scope }
    );
  };

  const handlePrint = () => {
    downloadPfForm3APdf(
      {
        ...reportData,
        activeCard,
      },
      { mode: 'print', scope: 'single' }
    );
  };

  const handleExportExcel = () => {
    downloadPfForm3AExcel({
      ...reportData,
      activeCard,
      cards,
    });
  };

  const handleMemberChange = (e) => {
    const id = e.target.value;
    setSelectedEmpId(id);
    if (onSelectEmployee) {
      onSelectEmployee(id);
    }
  };

  const formatAmt = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const rawRows = activeCard.monthlyRows || [];
  const totals = activeCard.totals || {};
  const totalBothRemitted = Math.round(totals.totalBothShares || ((totals.eePf || 0) + (totals.erPf || 0)));
  const totalEpsRemitted = Math.round(totals.erEps || 0);

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '-');

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            PF FORM - 3A (REVISED)
          </span>

          {cards.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Select Member:</span>
              <select
                className={styles.memberSelect}
                value={activeCard.employeeId || ''}
                onChange={handleMemberChange}
              >
                {cards.map((c) => (
                  <option key={c.employeeId} value={c.employeeId}>
                    {c.name} ({c.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnPrimary}`}
            onClick={() => handleDownloadPdf('single')}
            title="Download Statutory Form 3A PDF for active member (without logo)"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          {cards.length > 1 && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.btnSecondary}`}
              onClick={() => handleDownloadPdf('all')}
              title={`Download all ${cards.length} members Form 3A in one PDF`}
            >
              <Users size={15} />
              <span>Download All ({cards.length})</span>
            </button>
          )}

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handlePrint}
            title="Print Form 3A Contribution Card"
          >
            <Printer size={15} />
            <span>Print Card</span>
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.btnSecondary}`}
            onClick={handleExportExcel}
            title="Export Excel with Form 3A & All Members Summary"
          >
            <FileSpreadsheet size={15} color="#16a34a" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summaryCards.length > 0 && (
        <div className={styles.statsRow}>
          {summaryCards.map((card, idx) => (
            <div key={idx} className={styles.statCard}>
              <span className={styles.statLabel}>{card.label}</span>
              <span className={styles.statValue}>
                {card.label === 'Active Member Selected' ? activeCard.name || card.value : card.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* View Tabs */}
      <div className={styles.viewTabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'card' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('card')}
        >
          Form 3A Contribution Card ({activeCard.name || 'Member'})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'allMembers' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('allMembers')}
        >
          All Covered Members List ({cards.length})
        </button>
      </div>

      {/* TAB 1: FORM 3A STATUTORY SLIP */}
      {activeTab === 'card' && (
        <div className={styles.sheetContainer}>
          <div className={styles.form3aSheet}>
            {/* Top Right Box */}
            <div className={styles.topBox}>
              <div>Form - 3A</div>
              <div style={{ fontSize: '0.75rem' }}>(Revised)</div>
            </div>

            {/* Top Disclaimer */}
            <div className={styles.topDisclaimer}>
              ( For Unexempted Establishments Only )
            </div>

            {/* Main Headings (Strictly NO LOGO) */}
            <div className={styles.mainHeading}>
              EMPLOYEES' PROVIDENT FUND ORGANISATION
            </div>
            <div className={styles.schemeHeading}>
              THE EMPLOYEES' PROVIDENT FUND SCHEME, 1952 [Paras 35 & 42 ]
            </div>
            <div className={styles.schemeHeading}>
              AND THE EMPLOYEES' PENSION SCHEME, 1995 [Para 19]
            </div>

            <div className={styles.periodHeading}>
              Contribution Card for currency period from {currencyPeriod.label}
            </div>

            {/* Metadata Grid (Two Columns matching the statutory sheet) */}
            <div className={styles.metaGrid}>
              {/* Left Column */}
              <div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>1.  Account No.</span>
                  <span className={styles.metaVal}>:  <strong>{activeCard.accountNo}</strong></span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>2.  Name / Surname</span>
                  <span className={styles.metaVal}>:  <strong>{(activeCard.name || '').toUpperCase()}</strong></span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>3.  Father's / Husband's name.</span>
                  <span className={styles.metaVal}>:  {activeCard.fatherHusbandName || '-'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>4.  Name and Address of the</span>
                  <span className={styles.metaVal}></span>
                </div>
                <div style={{ paddingLeft: '1.25rem', marginTop: '-0.2rem' }}>
                  <div style={{ fontWeight: 700 }}>Factory / Establishment : {adminName}</div>
                  <div className={styles.estAddr}>{adminAddress}</div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>5.  Statutory Rate of Contribution</span>
                  <span className={styles.metaVal}>:  {statutoryRate}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>6.  Voluntary Higher Rate of</span>
                  <span className={styles.metaVal}></span>
                </div>
                <div style={{ paddingLeft: '1.25rem', marginTop: '-0.2rem' }}>
                  <div>Employees' Contribution if any :  Nil</div>
                </div>
                <div className={styles.metaRow} style={{ marginTop: '0.35rem' }}>
                  <span className={styles.metaLabel}>7.  Employees' Contribution on</span>
                  <span className={styles.metaVal}></span>
                </div>
                <div style={{ paddingLeft: '1.25rem', marginTop: '-0.2rem' }}>
                  <div>higher wages to EPF :  Yes/<strong>No</strong></div>
                </div>
                <div className={styles.metaRow} style={{ marginTop: '0.35rem' }}>
                  <span className={styles.metaLabel}>8.  Voluntary Contribution to</span>
                  <span className={styles.metaVal}></span>
                </div>
                <div style={{ paddingLeft: '1.25rem', marginTop: '-0.2rem' }}>
                  <div>Pension Fund on higher wages :  Yes/<strong>No</strong></div>
                </div>
              </div>
            </div>

            {/* 8-Column Statutory Contributions Table */}
            <table className={styles.statutoryTable}>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2}>Month</th>
                  <th colSpan={2}>MEMBER'S SHARE</th>
                  <th colSpan={2}>EMPLOYER'S SHARE</th>
                  <th rowSpan={2}>Ref. of Advance</th>
                  <th rowSpan={2}>Period of non contributory service (if any) No of days</th>
                  <th rowSpan={2}>Remarks</th>
                </tr>
                <tr>
                  <th>Amount of Wages</th>
                  <th>E.P.F</th>
                  <th>E.P.F Contribution</th>
                  <th>Pension Fund Contribution 8 1/3 %</th>
                </tr>
                <tr className={styles.colNums}>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                  <th>8</th>
                </tr>
              </thead>
              <tbody>
                {rawRows.map((r, rIdx) => {
                  let remarkText = '';
                  if (rIdx === 3 || rIdx === 4) {
                    remarkText = activeCard.exitDate
                      ? `a) Date of Leaving: ${activeCard.exitDate}`
                      : 'a) Date of Leaving Service if any';
                  } else if (rIdx === 7 || rIdx === 8) {
                    remarkText = activeCard.exitReason
                      ? `b) Reason: ${activeCard.exitReason}`
                      : 'b) Reasons for Leaving Service if any';
                  }

                  return (
                    <tr key={rIdx}>
                      <td className={styles.monthCell}>{r.month}</td>
                      <td className={styles.numCell}>{formatAmt(r.wages)}</td>
                      <td className={styles.numCell}>{formatAmt(r.eePf)}</td>
                      <td className={styles.numCell}>{formatAmt(r.erPf)}</td>
                      <td className={styles.numCell}>{formatAmt(r.erEps)}</td>
                      <td className={styles.centerCell}>{r.refAdvance || ''}</td>
                      <td className={styles.centerCell}>{r.ncpDays ?? 0}</td>
                      <td className={styles.remarksCell}>{remarkText}</td>
                    </tr>
                  );
                })}

                {/* Grand Total Row */}
                <tr className={styles.totalRow}>
                  <td></td>
                  <td className={styles.numCell}>{formatAmt(totals.wages)}</td>
                  <td className={styles.numCell}>{formatAmt(totals.eePf)}</td>
                  <td className={styles.numCell}>{formatAmt(totals.erPf)}</td>
                  <td className={styles.numCell}>{formatAmt(totals.erEps)}</td>
                  <td></td>
                  <td className={styles.centerCell}>{totals.ncpDays ?? 0}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Certifications & Notes Section */}
            <div className={styles.certSection}>
              <div className={styles.certPara}>
                Certified that the total amount of contribution (both shares) indicated in this card i.e., Rs. <strong>{totalBothRemitted.toLocaleString('en-IN')}</strong> has already been remitted in full in E.P.F A/c No. 1 and Pension Fund A/c No. 10 Rs. <strong>{totalEpsRemitted.toLocaleString('en-IN')}</strong>
              </div>

              <div className={styles.certPara}>
                Certified that the difference between the total of contribution shown under Cols. 3 & 4 of the above table and that arrived at on the total wages shown in Column 2 at the prescribed rate is solely due to rounding off of the contributions to the nearest rupee under the rules.
              </div>

              <div className={styles.noteBlock}>
                <div className={styles.noteTitle}>NOTE:</div>
                <div className={styles.noteLine}>
                  <span>1</span>
                  <span>In respect of the Form3-A sent to the Regional Office during the course of the currency period for the purpose of the final settlement of the accounts of the member who has left service, details of date and reasons for leaving service should be furnished under Co.7(a) & (b).</span>
                </div>
                <div className={styles.noteLine}>
                  <span>2</span>
                  <span>In respect of the members who are not members of the Pension Fund, the employer's share of contribution to Employees' Provident Fund is to be shown under Co, 4(a)</span>
                </div>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className={styles.sheetFooter}>
              <div>
                <span>Date : </span>
                <span style={{ fontWeight: 600 }}>{currentDateStr}</span>
              </div>
              <div className={styles.signText}>
                Signature of Employer with Office Seal
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL COVERED MEMBERS LIST */}
      {activeTab === 'allMembers' && (
        <div className={styles.summaryTableCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              All Covered Members Annual Summary ({cards.length})
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Currency Period: <strong>{currencyPeriod.label}</strong>
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee ID</th>
                  <th>Member Name</th>
                  <th>Father's Name</th>
                  <th>Account No.</th>
                  <th>Total Wages</th>
                  <th>Member EPF (Cols 3)</th>
                  <th>Employer EPF (Cols 4)</th>
                  <th>Pension Fund (Cols 5)</th>
                  <th>Total Remitted</th>
                  <th>NCP Days</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c, i) => (
                  <tr key={c.employeeId || i}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.employeeId}</td>
                    <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{c.name}</td>
                    <td>{c.fatherHusbandName || '-'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{c.accountNo}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {formatAmt(c.totals?.wages)}</td>
                    <td style={{ textAlign: 'right', color: '#15803d', fontWeight: 600 }}>Rs. {formatAmt(c.totals?.eePf)}</td>
                    <td style={{ textAlign: 'right', color: '#c2410c', fontWeight: 600 }}>Rs. {formatAmt(c.totals?.erPf)}</td>
                    <td style={{ textAlign: 'right', color: '#7e22ce', fontWeight: 600 }}>Rs. {formatAmt(c.totals?.erEps)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      Rs. {Math.round(c.totals?.totalBothShares || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>{c.totals?.ncpDays ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewBtn}
                        onClick={() => {
                          setSelectedEmpId(c.employeeId);
                          setActiveTab('card');
                        }}
                      >
                        View Form 3A
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
