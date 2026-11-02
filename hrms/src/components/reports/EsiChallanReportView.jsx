import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import {
  downloadEsiChallanPdf,
  downloadEsiChallanExcel,
  downloadEsiChallanCsv,
} from '../../utils/esiChallanExport';
import styles from './EsiChallanReportView.module.css';

/**
 * Statutory ESI Challan Component
 * E. S. I. C. Pay-in-Slip for Contribution (SBI Account No. 1)
 * Matches the exact statutory bank pay-in slip layout from reference image:
 * - Top E. S. I. C. heading & Blue Banner (ORIGINAL / CHALLAN NO)
 * - Bank Details, Particulars Box with Cash/Cheque details
 * - Amount in Words & statutory legal clause
 * - Establishment details & Employer Code No
 * - Breakdown: No. of Employees, Total Wages, Employee's Contribution (0.75%), Employer's Contribution (3.25%), Total
 * - Dashed separator line
 * - Bank Acknowledgement receipt section (to be filled by depositor)
 * - Interactive Copy switcher & Employee contribution breakdown drawer
 */
export default function EsiChallanReportView({
  reportData = {},
  filters = {},
}) {
  const [selectedCopy, setSelectedCopy] = useState('original');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const totals = reportData?.totals || {};
  const comp = reportData?.companyInfo || {};
  const client = reportData?.clientInfo || {};
  const records = reportData?.records || [];

  const monthName = reportData?.monthName || (filters?.month ? `FOR ${filters.month}` : 'CURRENT MONTH');
  const [challanNo, setChallanNo] = useState(reportData?.challanNo || '20001853160000999');
  const [chequeNo, setChequeNo] = useState(reportData?.chequeNo || '');
  const [station, setStation] = useState(reportData?.station || 'NEW DELHI');
  const [depositDate, setDepositDate] = useState(reportData?.date || new Date().toLocaleDateString('en-GB'));

  const totalEmployeeCount = totals?.employeeCount ?? records.length;
  const totalWages = totals?.totalWages ?? records.reduce((s, r) => s + (Number(r.grossWages) || 0), 0);
  const employeeContrib = totals?.employeeContribution ?? records.reduce((s, r) => s + (Number(r.employeeShare) || 0), 0);
  const employerContrib = totals?.employerContribution ?? records.reduce((s, r) => s + (Number(r.employerShare) || 0), 0);
  const totalContrib = totals?.totalContribution ?? (employeeContrib + employerContrib);
  const amountWords = totals?.totalAmountWords || 'Rupees Zero Only';

  const formatCurr = (val) => {
    const n = Number(val) || 0;
    return n.toFixed(2);
  };

  const copyLabels = {
    original: { label: 'ORIGINAL', desc: 'For Bank' },
    duplicate: { label: 'DUPLICATE', desc: 'To be sent by the Bank to Regional Office of the Corporation' },
    triplicate: { label: 'TRIPLICATE', desc: 'To be returned to the Depositor for employer records' },
    quadruplicate: { label: 'QUADRUPLICATE', desc: 'To be returned to Depositor for his own record' },
  };

  const activeCopyInfo = copyLabels[selectedCopy] || copyLabels.original;

  // Prepare full data payload for exporters
  const exportPayload = {
    ...reportData,
    challanNo,
    chequeNo,
    station,
    date: depositDate,
    totals: {
      ...totals,
      employeeCount: totalEmployeeCount,
      totalWages,
      employeeContribution: employeeContrib,
      employerContribution: employerContrib,
      totalContribution: totalContrib,
      totalAmountWords: amountWords,
    },
  };

  const handleDownloadPdf = () => {
    downloadEsiChallanPdf(exportPayload, {
      copyType: selectedCopy,
      copyTypeDesc: activeCopyInfo.desc,
      mode: 'download'
    });
  };

  const handlePrint = () => {
    downloadEsiChallanPdf(exportPayload, {
      copyType: selectedCopy,
      copyTypeDesc: activeCopyInfo.desc,
      mode: 'print'
    });
  };

  const handleDownloadExcel = () => {
    downloadEsiChallanExcel(exportPayload, { format: 'xlsx' });
  };

  const handleDownloadCsv = () => {
    downloadEsiChallanCsv(exportPayload, { format: 'csv' });
  };

  return (
    <div className={styles.container}>
      {/* Paper Preview Card matching Image 2 */}
      <div className={styles.paperWrapper}>
        <div className={styles.challanCard}>
          {/* Top Title */}
          <div className={styles.esicTitle}>E. S. I. C.</div>

          {/* Blue Banner Bar */}
          <div className={styles.blueBanner}>
            <span>{activeCopyInfo.label}</span>
            <span>CHALLAN NO &nbsp; {challanNo}</span>
          </div>

          {/* Sub Header for Copy Type & Bank Account */}
          <div className={styles.copySub}>{activeCopyInfo.desc}</div>

          <div className={styles.bankHeaderBlock}>
            <div className={styles.fundAccountTitle}>Employee's State Insurance Fund Account No. 1</div>
            <div className={styles.slipSubtitle}>Pay-in-Slip for Contribution</div>
            <div className={styles.bankNameText}>{reportData?.bankName || 'State Bank of India'}</div>
          </div>

          {/* Particulars Box matching Image 2 */}
          <div className={styles.particularsBox}>
            {/* Left Column: Cash / Cheque & Total */}
            <div className={styles.boxLeftCol}>
              <div className={styles.boxLeftHead}>
                <span>Particulars of Cash / Cheque No.</span>
                <span>Amount</span>
              </div>
              <div className={styles.boxLeftBody}>
                <span>{chequeNo ? `Cheque No. ${chequeNo}` : ''}</span>
                <span>{formatCurr(totalContrib)}</span>
              </div>
              <div className={styles.boxLeftFooter}>
                <span>Total</span>
                <span>{formatCurr(totalContrib)}</span>
              </div>
            </div>

            {/* Right Column: Station, Dated, Account No. */}
            <div className={styles.boxRightCol}>
              <div className={styles.boxRightRow}>
                <span>Station :</span>
                <strong>{station}</strong>
              </div>
              <div className={styles.boxRightRow}>
                <span>Dated &nbsp; :</span>
                <strong>{depositDate}</strong>
              </div>
              <div style={{ marginTop: '4px' }}>Paid in to the credit of the Fund</div>
              <div className={styles.boxRightRow}>
                <span>Account No. 1 Rs.</span>
                <strong>{formatCurr(totalContrib)}</strong>
              </div>
            </div>
          </div>

          {/* Amount In Words & Statutory Statement */}
          <div className={styles.inWordsLine}>({amountWords})</div>
          <div className={styles.statutoryNote}>
            in Cash/by Cheque (on realisation) for Payment of contributions as per details given below under the Employee's State Insurance Act 1948
          </div>

          {/* Month Line and Depositor */}
          <div className={styles.monthAndDepositor}>
            <div className={styles.monthText}>
              For the month of &nbsp; {monthName}
            </div>
            <div className={styles.depositorBlock}>
              <div>Deposited by</div>
              <div><strong>For {comp?.name || comp?.companyName || ''}</strong></div>
            </div>
          </div>

          {/* Employer Code and Factory Name / Address */}
          <div className={styles.establishmentSection}>
            <div className={styles.employerCodeLine}>
              Employer's Code No : &nbsp; {comp?.employerEsiCode || comp?.esiNo || comp?.employerCode || ''}
            </div>
            <div className={styles.factoryLabel}>Name &amp; Address of Factory/Establishment</div>
            <div className={styles.companyNameLine}>
              <span>{comp?.name || comp?.companyName || ''}</span>
              <span style={{ fontWeight: 'normal', color: '#475569' }}>(Signatory)</span>
            </div>
            <div className={styles.addressLine}>
              {comp?.address || ''}
            </div>
          </div>

          {/* Contribution Summary Grid matching Image 2 */}
          <table className={styles.statutorySummaryTable}>
            <tbody>
              <tr>
                <td className={styles.labelCol}>No. of Employee's</td>
                <td className={styles.currCol}></td>
                <td className={styles.valueCol}>{totalEmployeeCount}</td>
              </tr>
              <tr>
                <td className={styles.labelCol}>Total Wages</td>
                <td className={styles.currCol}>Rs.</td>
                <td className={styles.valueCol}>{formatCurr(totalWages)}</td>
              </tr>
              <tr>
                <td className={styles.labelCol}>Employee's Contribution</td>
                <td className={styles.currCol}>Rs.</td>
                <td className={styles.valueCol}>{formatCurr(employeeContrib)}</td>
              </tr>
              <tr>
                <td className={styles.labelCol}>Employer's Contribution</td>
                <td className={styles.currCol}>Rs.</td>
                <td className={styles.valueCol}>{formatCurr(employerContrib)}</td>
              </tr>
              <tr className={styles.totalRow}>
                <td className={styles.labelCol}>Total</td>
                <td className={styles.currCol}>Rs.</td>
                <td className={styles.valueCol}>{formatCurr(totalContrib)}</td>
              </tr>
            </tbody>
          </table>

          {/* Dashed Separator matching Image 2 */}
          <div className={styles.dashedDivider}></div>

          {/* Bank Acknowledgement Section matching Image 2 */}
          <div className={styles.ackSection}>
            <div className={styles.bankUseLabel}>(for use in Bank)</div>

            <div className={styles.ackHeader}>
              <div className={styles.ackTitle}>ACKNOWLEDGEMENT</div>
              <div className={styles.ackSubtitle}>(to be filled by Depositor)</div>
            </div>

            <div className={styles.ackRow}>
              <span>Received Payment with Cash/Cheque/Draft No. {chequeNo || '___________________'}</span>
              <span>Dated &nbsp; {depositDate}</span>
            </div>

            <div className={styles.ackAmountLine}>
              For Rs. {formatCurr(totalContrib)}, {amountWords}
            </div>

            <div style={{ marginBottom: '8px' }}>Drawn on ,</div>
            <div style={{ marginBottom: '12px' }}>(Bank in favour of Employee's State Insurance Fund Account No. 1)</div>

            <div className={styles.bankScrollLine}>
              <span>S. No. in Bank Scroll</span>
              <span>Dated : &nbsp; {depositDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insured Employees Breakdown Accordion */}
      {records.length > 0 && (
        <div className={styles.breakdownSection}>
          <div
            className={styles.breakdownHeader}
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            <div className={styles.breakdownTitle}>
              <Users size={16} />
              <span>Insured Employee Contribution Details ({records.length} Employees)</span>
            </div>
            {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {showBreakdown && (
            <div className={styles.breakdownTableWrapper}>
              <table className={styles.breakdownTable}>
                <thead>
                  <tr>
                    <th>Sl</th>
                    <th>Emp ID</th>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>ESIC IP No.</th>
                    <th>Dispensary</th>
                    <th style={{ textAlign: 'right' }}>Days</th>
                    <th style={{ textAlign: 'right' }}>Gross Wages</th>
                    <th style={{ textAlign: 'right' }}>Employee (0.75%)</th>
                    <th style={{ textAlign: 'right' }}>Employer (3.25%)</th>
                    <th style={{ textAlign: 'right' }}>Total (4.00%)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td>{r.srNo || i + 1}</td>
                      <td>{r.employeeId || '—'}</td>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.designation || '—'}</td>
                      <td><code>{r.insuranceNo || '—'}</code></td>
                      <td>{r.dispensary || '—'}</td>
                      <td style={{ textAlign: 'right' }}>{r.daysWorked || 0}</td>
                      <td style={{ textAlign: 'right' }}>₹{formatCurr(r.grossWages)}</td>
                      <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>₹{formatCurr(r.employeeShare)}</td>
                      <td style={{ textAlign: 'right', color: '#ea580c', fontWeight: 600 }}>₹{formatCurr(r.employerShare)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{formatCurr(r.totalShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
