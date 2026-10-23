import React from 'react';
import {
  Download,
  Printer,
  ShieldCheck,
  Calendar,
  Users
} from 'lucide-react';
import { downloadPfForm12APdf } from '../../utils/pfForm12AExport';
import styles from './PfForm12AReportView.module.css';

/**
 * Statutory EPFO PF Form 12A (Revised) Component (PDF ONLY format per explicit user request)
 * Monthly statement of EPF, EPS, and EDLI payments & subscribers movement
 *
 * Statutory References:
 * - EMPLOYEES' PROVIDENT FUND AND MISC. PRO. ACT 1952
 * - EMPLOYEES' PENSION SCHEME 1995 [PARA 20(4)]
 */
export default function PfForm12AReportView({
  reportData = {},
  filters = {}
}) {
  const comp = reportData.companyInfo || {};
  const monthLabel = reportData.monthLabel || 'May 2026';
  const currencyPeriod = reportData.currencyPeriod || '01 April 2026 to 31 March 2027';
  const statutoryRate = reportData.statutoryRate || '12%';
  const accountRows = reportData.accountRows || [];
  const subscribersMovement = reportData.subscribersMovement || [];
  const employeeCounts = reportData.employeeCounts || { contract: 0, rest: 0, total: 0 };
  const bankInfo = reportData.bankInfo || { name: 'State Bank of India', address: 'EPFO Collection Account, Main Branch' };
  const summaryCards = reportData.summaryCards || [];

  const estName = comp.name || 'RR Security & Facilities';
  const estAddress = comp.address || 'G-75/a, Gali No. 04 Block G Molarband Extn. Badarpur, SOUTH DELHI - 110044';
  const estCode = comp.establishmentCode || comp.employerPfCode || 'PFNOTAVAILABLE';

  const handleDownloadPdf = () => {
    downloadPfForm12APdf(reportData, { mode: 'download' });
  };

  const handlePrint = () => {
    downloadPfForm12APdf(reportData, { mode: 'print' });
  };

  const formatVal = (v) => {
    if (v === null || v === undefined) return '-Nil-';
    if (typeof v === 'string') return v;
    return Number(v).toFixed(2);
  };

  const formatInt = (v) => {
    if (v === null || v === undefined) return '0';
    return String(v);
  };

  return (
    <div className={styles.container}>
      {/* Top Action Toolbar (PDF ONLY format per explicit user instruction) */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.badge}>
            <ShieldCheck size={16} />
            <span>EPFO Statutory Form 12-A (Revised)</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeSuccess}`}>
            <Calendar size={15} />
            <span>{monthLabel}</span>
          </span>

          <span className={`${styles.badge} ${styles.badgeInfo}`}>
            <Users size={15} />
            <span>{employeeCounts.total || 0} Total Subscribers</span>
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.primaryBtn}`}
            onClick={handleDownloadPdf}
            title="Download Official Form 12A PDF"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={handlePrint}
            title="Print Form 12A Document"
          >
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {summaryCards.length > 0 && (
        <div className={styles.summaryGrid}>
          {summaryCards.map((card, idx) => (
            <div key={idx} className={`${styles.summaryCard} ${styles[card.tone] || ''}`}>
              <div className={styles.cardLabel}>{card.label}</div>
              <div className={styles.cardValue}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Statutory Desk & Paper Render */}
      <div className={styles.deskWrapper}>
        <div className={styles.paper}>
          {/* Top Right Notice */}
          <div className={styles.topNotice}>
            ( ONLY FOR ESTABLISHMENT )
          </div>

          {/* Centered Headers */}
          <div className={styles.headerTitle}>
            <h1 className={styles.orgTitle}>EMPLOYEES' PROVIDENT FUND ORGANISATION</h1>
            <h2 className={styles.formMainTitle}>FORM 12-A (REVISED)</h2>
            <p className={styles.statutorySub}>
              EMPLOYEES' PROVIDENT FUND AND MISC. PRO. ACT 1952 - EMPLOYEES' PENSION SCHEME 1995 [PARA 20(4)]
            </p>
          </div>

          {/* 3-Column Meta Section */}
          <div className={styles.metaGrid}>
            {/* Col 1: Establishment */}
            <div className={styles.metaColLeft}>
              <span className={styles.label}>Name and Address of the Establishment</span>
              <span className={styles.estName}>{estName}</span>
              <span className={styles.estAddress}>{estAddress}</span>
              <div className={styles.codeNo}>
                Code No. <span>{estCode}</span>
              </div>
            </div>

            {/* Col 2: Currency & Contribution Info */}
            <div className={styles.metaColMid}>
              <div className={styles.metaItem}>
                Currency period from <strong>{currencyPeriod}</strong>
              </div>
              <div className={styles.metaItem}>
                Statement of contribution for the month of <strong>{monthLabel}</strong>
              </div>
              <div className={styles.metaItem}>
                Statutory rate of contribution: <strong>{statutoryRate}</strong>
              </div>
            </div>

            {/* Col 3: EPFO Office Area */}
            <div className={styles.metaColRight}>
              <div className={styles.metaItem}>( To be filled by EPFO)</div>
              <div className={styles.metaItem}>Group Code</div>
              <div className={styles.metaItem}>Establishment Status</div>
            </div>
          </div>

          {/* Table 1: Account Particulars & Remittance */}
          <div className={styles.tableContainer}>
            <table className={styles.formTable}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '13%' }}>Particulars</th>
                  <th rowSpan={2} style={{ width: '12%' }}>
                    Wages on which<br />contributions<br />are payable
                  </th>
                  <th colSpan={2} style={{ width: '17%' }}>Amount of contribution</th>
                  <th colSpan={3} style={{ width: '25%' }}>Amount of contribution remitted</th>
                  <th rowSpan={2} style={{ width: '11%' }}>
                    Amount of<br />administrative<br />charges due
                  </th>
                  <th rowSpan={2} style={{ width: '11%' }}>
                    Amount of<br />administrative<br />charges<br />remitted
                  </th>
                  <th rowSpan={2} style={{ width: '11%' }}>
                    Date of remittance<br />(Enclose triple<br />copies<br />of challans)
                  </th>
                </tr>
                <tr className={styles.subColRow}>
                  <th>Recovered<br />from the<br />Employees</th>
                  <th>Payable<br />by the<br />Employer</th>
                  <th>Employees'<br />contribution</th>
                  <th>VPF</th>
                  <th>Employer's<br />contribution</th>
                </tr>
                <tr className={styles.numRow}>
                  <th>1</th>
                  <th>2</th>
                  <th colSpan={2}>3</th>
                  <th colSpan={3}>4</th>
                  <th>5</th>
                  <th>6</th>
                  <th>7</th>
                </tr>
              </thead>
              <tbody>
                {accountRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className={styles.accountNameCell}>{row.accountName}</td>
                    <td className={styles.textRight}>
                      {row.wages > 0 ? Number(row.wages).toFixed(2) : (row.wages === 0 ? '0.00' : '-Nil-')}
                    </td>
                    <td className={styles.textCenter}>{formatVal(row.recoveredFromEmployees)}</td>
                    <td className={styles.textCenter}>{formatVal(row.payableByEmployer)}</td>
                    <td className={styles.textCenter}>{formatVal(row.remittedEmployees)}</td>
                    <td className={styles.textCenter}>{formatVal(row.vpf)}</td>
                    <td className={styles.textCenter}>{formatVal(row.remittedEmployer)}</td>
                    <td className={styles.textCenter}>{formatVal(row.adminChargesDue)}</td>
                    <td className={styles.textCenter}>{formatVal(row.adminChargesRemitted)}</td>
                    <td className={styles.textCenter}>{row.dateOfRemittance || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Middle Info: Employee Counts & Bank Details */}
          <div className={styles.middleInfoGrid}>
            <div className={styles.empCountsBox}>
              <div className={styles.empCountRow}>
                <span className={styles.empCountLabel}>Total No. of Employees</span>
                <span className={styles.empCountVal}>{employeeCounts.total || 0}</span>
              </div>
              <div className={styles.empCountRow}>
                <span className={styles.empCountLabel}>(a) Contract</span>
                <span className={styles.empCountVal}>{employeeCounts.contract || 0}</span>
              </div>
              <div className={styles.empCountRow}>
                <span className={styles.empCountLabel}>(b) Rest</span>
                <span className={styles.empCountVal}>{employeeCounts.rest || 0}</span>
              </div>
              <div className={styles.empCountRow}>
                <span className={styles.empCountLabel}>(c) Total</span>
                <span className={styles.empCountVal}>{employeeCounts.total || 0}</span>
              </div>
            </div>

            <div className={styles.bankInfoBox}>
              <div className={styles.bankLabel}>
                Name and Address of the<br />
                bank in which the amount<br />
                is remitted
              </div>
              <div className={styles.bankDetails}>
                <div>{bankInfo.name}</div>
                <div style={{ fontWeight: 400, fontSize: '11.5px', marginTop: '2px' }}>{bankInfo.address}</div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Table 2 (Subscribers Movement) & Signature */}
          <div className={styles.bottomSection}>
            <div className={styles.subscribersTableWrapper}>
              <table className={styles.subscribersTable}>
                <thead>
                  <tr>
                    <th>Details of Subscribers</th>
                    <th>EPF</th>
                    <th>EPS</th>
                    <th>EDLI</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribersMovement.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.particulars}</td>
                      <td className={styles.textCenter}>{formatInt(row.epf)}</td>
                      <td className={styles.textCenter}>{formatInt(row.eps)}</td>
                      <td className={styles.textCenter}>{formatInt(row.edli)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.signatureBox}>
              <div className={styles.signLine}>Signature of the Employer</div>
              <div className={styles.signSub}>(with office seal)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
