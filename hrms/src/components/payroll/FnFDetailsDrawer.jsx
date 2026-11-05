import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Check,
  Printer,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  Building2,
  Clock,
  Layers,
  Send,
  FileText,
  CreditCard,
  Download,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import styles from './RateRevisionDetailsDrawer.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

// Number to Words in Indian Rupees
function inWordsINR(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Rupees Only';
  if (n < 0) return 'Negative ' + inWordsINR(-n);

  function convertSection(v) {
    if (v === 0) return '';
    if (v < 20) return a[v] + ' ';
    if (v < 100) return b[Math.floor(v / 10)] + (v % 10 !== 0 ? ' ' + a[v % 10] : '') + ' ';
    return a[Math.floor(v / 100)] + ' Hundred ' + (v % 100 !== 0 ? convertSection(v % 100) : '');
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) words += convertSection(crore) + 'Crore ';
  if (lakh > 0) words += convertSection(lakh) + 'Lakh ';
  if (thousand > 0) words += convertSection(thousand) + 'Thousand ';
  if (remainder > 0) words += convertSection(remainder);

  return (words.trim() + ' Rupees Only');
}

export default function FnFDetailsDrawer({
  isOpen,
  onClose,
  record,
  onApproveStage,
  onDisburse,
  onUpdateClearance,
  onGenerateLetter
}) {
  const [showDisburseForm, setShowDisburseForm] = useState(false);
  const [payoutData, setPayoutData] = useState({
    mode: 'Bank Transfer (NEFT)',
    paymentDate: new Date().toISOString().slice(0, 10),
    utrNo: `CMS${Date.now().toString().slice(-8)}`
  });

  if (!isOpen || !record) return null;

  const fnf = record;

  // Earnings calculations
  const pendingSalary = Number(fnf.salaryDues?.pendingSalary ?? fnf.unpaidSalary ?? 0);
  const otPay = Number(fnf.salaryDues?.overtimePay ?? 0);
  const incentives = Number(fnf.salaryDues?.incentives ?? 0);
  const arrears = Number(fnf.salaryDues?.arrears ?? 0);
  const bonus = Number(fnf.salaryDues?.bonus ?? fnf.bonusOrArrears ?? 0);
  const leaveEncashment = Number(fnf.statutoryBenefits?.leaveEncashment ?? fnf.leaveEncashment ?? 0);
  const gratuity = Number(fnf.statutoryBenefits?.gratuityAmount ?? fnf.gratuityAmount ?? 0);

  const totalEarnings =
    pendingSalary + otPay + incentives + arrears + bonus + leaveEncashment + gratuity;

  // Deductions calculations
  const noticeRecovery = Number(fnf.deductions?.noticeRecovery ?? fnf.noticePayRecovery ?? 0);
  const advanceRecovery = Number(fnf.deductions?.advanceRecovery ?? fnf.loanAdvanceDeduction ?? 0);
  const loanRecovery = Number(fnf.deductions?.loanRecovery ?? 0);
  const uniformPenalty = Number(fnf.deductions?.uniformPenalty ?? fnf.assetDamageRecovery ?? 0);
  const otherDeductions = Number(fnf.deductions?.otherDeductions ?? 0);
  const pfDeduction = Number(fnf.statutoryBenefits?.employeePf ?? 0);
  const esiDeduction = Number(fnf.statutoryBenefits?.employeeEsi ?? 0);

  const totalDeductions =
    noticeRecovery + advanceRecovery + loanRecovery + uniformPenalty + otherDeductions + pfDeduction + esiDeduction;

  const netPayable = Math.max(0, totalEarnings - totalDeductions);

  // Clearance Departments
  const clearances = fnf.clearances || {};
  const depts = [
    { key: 'hr', name: 'HR Department', desc: 'ID Card & credentials surrender' },
    { key: 'operations', name: 'Operations / Site', desc: 'Guard post & duty register handover' },
    { key: 'accounts', name: 'Accounts & Finance', desc: 'Petty cash & advance clearance' },
    { key: 'admin', name: 'Admin & Facilities', desc: 'Biometric access revoked, locker keys' },
    { key: 'inventory', name: 'Inventory & Store', desc: 'Uniform kit & gear returned' },
    { key: 'client', name: 'Client Site Clearance', desc: 'Client site manager sign-off' }
  ];

  // 4-Stage Approval Workflow
  const stages = [
    { key: 'hr_review', label: '1. HR Manager', role: 'HR Verification' },
    { key: 'ops_review', label: '2. Operations Manager', role: 'Site Handover' },
    { key: 'accounts_review', label: '3. Accounts Manager', role: 'Accounts Verification' },
    { key: 'final_approval', label: '4. Final Approver', role: 'Director Payout Sign-off' }
  ];
  const stageData = fnf.approvalWorkflow?.stages || {};
  const currentStage = fnf.approvalWorkflow?.currentStage || 'hr_review';
  const isFullyApproved = Boolean(fnf.approvalWorkflow?.isFullyApproved);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDisbursement = () => {
    if (onDisburse) {
      onDisburse(fnf, payoutData);
      setShowDisburseForm(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '840px', maxWidth: '96vw' }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 className={styles.title} style={{ fontFamily: 'monospace' }}>
                {fnf.settlementId}
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0369a1',
                border: '1px solid #bae6fd'
              }}>
                {fnf.exitType || 'Resignation'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: fnf.settlementStatus === 'Settled / Disbursed' ? '#ecfdf5' : '#eff6ff',
                color: fnf.settlementStatus === 'Settled / Disbursed' ? '#059669' : '#1d4ed8',
                border: `1px solid ${fnf.settlementStatus === 'Settled / Disbursed' ? '#a7f3d0' : '#bfdbfe'}`
              }}>
                {fnf.settlementStatus}
              </span>
            </div>
            <p className={styles.subtitle}>
              Full &amp; Final Settlement Statement Voucher • Last Working Day:{' '}
              <strong style={{ color: '#0f172a' }}>{fnf.lastWorkingDay}</strong>
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.body} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 1. Employee Identity & Exit Profile (Steps 1 & 2) */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <User size={15} />
              <span>Step 1 &amp; 2: Separating Employee &amp; Exit Timeline</span>
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Code</span>
                <span className={styles.infoValue} style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {fnf.employeeCode}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Employee Name</span>
                <span className={styles.infoValue} style={{ fontWeight: 600 }}>{fnf.employeeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Role / Designation</span>
                <span className={styles.infoValue}>{fnf.designation}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Client &amp; Site</span>
                <span className={styles.infoValue}>{fnf.client} ({fnf.site || 'Main'})</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Date of Joining</span>
                <span className={styles.infoValue}>{fnf.dateOfJoining || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Service Tenure</span>
                <span className={styles.infoValue}>{fnf.tenureYears || 1} Years</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Resignation Tendered</span>
                <span className={styles.infoValue}>{fnf.resignationDate || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Last Working Day (LWD)</span>
                <span className={styles.infoValue} style={{ color: '#059669', fontWeight: 700 }}>
                  {fnf.lastWorkingDay}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Notice Required / Served</span>
                <span className={styles.infoValue}>
                  {fnf.noticePeriodRequiredDays || 30}d required / {fnf.noticePeriodServedDays || 30}d served
                  {fnf.noticeShortfallDays > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 4 }}>
                      ({fnf.noticeShortfallDays}d shortfall)
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: 'span 2' }}>
                <span className={styles.infoLabel}>Separation Category &amp; Reason</span>
                <span className={styles.infoValue}>{fnf.separationReason}</span>
              </div>
            </div>
          </section>

          {/* 2. 6-Department Clearance Dossier (Step 3) */}
          <section className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <FileCheck2 size={15} />
                <span>Step 3: 6-Department No-Dues &amp; Clearance Verification</span>
              </h3>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                All 6 departments signed off
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {depts.map((d) => {
                const c = clearances[d.key] || { status: 'Pending', clearedBy: '—', remarks: '' };
                const isCleared = c.status === 'Cleared' || c.status === 'Waived';
                return (
                  <div
                    key={d.key}
                    style={{
                      background: isCleared ? '#f0fdf4' : '#fffbeb',
                      border: `1px solid ${isCleared ? '#bbf7d0' : '#fde68a'}`,
                      padding: 10,
                      borderRadius: 6,
                      fontSize: '11.5px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#0f172a' }}>{d.name}</strong>
                      <span style={{
                        color: isCleared ? '#16a34a' : '#b45309',
                        fontWeight: 700,
                        fontSize: '10.5px'
                      }}>
                        {isCleared ? '✓ Cleared' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '10.5px', marginTop: 2 }}>{d.desc}</div>
                    <div style={{ marginTop: 4, fontSize: '10.5px', color: '#334155' }}>
                      By: <strong>{c.clearedBy || 'Assigned Lead'}</strong>
                    </div>
                    {c.remarks && (
                      <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic', marginTop: 1 }}>
                        "{c.remarks}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Attendance & Service Verification (Step 4) */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={15} />
              <span>Step 4: Attendance &amp; Leave Verification</span>
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 14px',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Present Days</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{fnf.attendance?.presentDays ?? fnf.unpaidWorkDays ?? 15}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Absent Days</span>
                <strong style={{ fontSize: '15px', color: '#dc2626' }}>{fnf.attendance?.absentDays ?? 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Overtime Hours</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{fnf.attendance?.overtimeHours ?? 0} hrs</strong>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Weekly Offs</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{fnf.attendance?.weeklyOffs ?? 4}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Paid Holidays</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{fnf.attendance?.holidays ?? 1}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>EL Leave Balance</span>
                <strong style={{ fontSize: '15px', color: '#059669' }}>{fnf.attendance?.leaveBalance ?? fnf.leaveBalanceDays ?? 0} d</strong>
              </div>
            </div>
          </section>

          {/* 4. Financial Settlement Ledger: Earnings vs Deductions (Steps 5, 6 & 7) */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <IndianRupee size={15} />
              <span>Step 5, 6 &amp; 7: Financial Accounting Ledger</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {/* Table A: Earnings */}
              <div style={{ border: '1px solid #bbf7d0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', fontWeight: 700, fontSize: '12px', color: '#166534' }}>
                  A. Earnings &amp; Accruals
                </div>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Earned Pending Salary</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>{formatINR(pendingSalary)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Overtime Allowance</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>{formatINR(otPay)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Leave Encashment (EL)</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>{formatINR(leaveEncashment)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Gratuity Benefit</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: gratuity > 0 ? '#059669' : '#64748b' }}>
                        {formatINR(gratuity)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Arrears &amp; Incentives</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>{formatINR(arrears + incentives)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Bonus / Ex-Gratia</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>{formatINR(bonus)}</td>
                    </tr>
                    <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
                      <td style={{ padding: '8px 12px', color: '#166534' }}>Total Earnings (A)</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#166534' }}>{formatINR(totalEarnings)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table B: Deductions */}
              <div style={{ border: '1px solid #fecaca', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontWeight: 700, fontSize: '12px', color: '#991b1b' }}>
                  B. Deductions &amp; Recoveries
                </div>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Notice Shortfall Pay</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: noticeRecovery > 0 ? '#dc2626' : '#64748b' }}>
                        {noticeRecovery > 0 ? `-${formatINR(noticeRecovery)}` : '₹0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Salary Advance Recovery</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: advanceRecovery > 0 ? '#dc2626' : '#64748b' }}>
                        {advanceRecovery > 0 ? `-${formatINR(advanceRecovery)}` : '₹0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Outstanding Loan Adjustment</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: loanRecovery > 0 ? '#dc2626' : '#64748b' }}>
                        {loanRecovery > 0 ? `-${formatINR(loanRecovery)}` : '₹0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Uniform / Kit Penalty</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: uniformPenalty > 0 ? '#dc2626' : '#64748b' }}>
                        {uniformPenalty > 0 ? `-${formatINR(uniformPenalty)}` : '₹0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Statutory PF &amp; ESI</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: (pfDeduction + esiDeduction) > 0 ? '#dc2626' : '#64748b' }}>
                        {(pfDeduction + esiDeduction) > 0 ? `-${formatINR(pfDeduction + esiDeduction)}` : '₹0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px', color: '#475569' }}>Other Authorized Recoveries</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: otherDeductions > 0 ? '#dc2626' : '#64748b' }}>
                        {otherDeductions > 0 ? `-${formatINR(otherDeductions)}` : '₹0'}
                      </td>
                    </tr>
                    <tr style={{ background: '#fef2f2', fontWeight: 700 }}>
                      <td style={{ padding: '8px 12px', color: '#991b1b' }}>Total Deductions (B)</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#991b1b' }}>
                        {totalDeductions > 0 ? `-${formatINR(totalDeductions)}` : '₹0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. Net Payable Statement Box (Step 8) */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            border: '2px solid #059669',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, color: '#047857' }}>
                Step 8: Final Net Settlement Amount Payable (A - B)
              </span>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#065f46', marginTop: 2 }}>
                {formatINR(netPayable)}
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#047857', marginTop: 2 }}>
                Amount in Words: <em>{inWordsINR(netPayable)}</em>
              </div>
            </div>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <IndianRupee size={28} />
            </div>
          </div>

          {/* 6. 4-Tier Approval Workflow Audit (Step 9) */}
          <section className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <Layers size={15} />
                <span>Step 9: 4-Tier Approval Workflow Audit</span>
              </h3>
              {isFullyApproved ? (
                <span style={{ color: '#059669', fontWeight: 700, fontSize: '12px' }}>✓ Final Approved</span>
              ) : (
                <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '12px' }}>
                  Current Stage: {currentStage.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {stages.map((st) => {
                const s = stageData[st.key] || {};
                const isDone = s.status === 'Approved';
                const isCurrent = !isDone && currentStage === st.key;

                return (
                  <div
                    key={st.key}
                    style={{
                      background: isDone ? '#f0fdf4' : isCurrent ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${isDone ? '#86efac' : isCurrent ? '#93c5fd' : '#cbd5e1'}`,
                      padding: 10,
                      borderRadius: 6,
                      fontSize: '11.5px'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isDone ? '#15803d' : isCurrent ? '#1d4ed8' : '#64748b' }}>
                      {st.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: 1 }}>{st.role}</div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 10,
                        fontSize: '10px',
                        fontWeight: 700,
                        background: isDone ? '#dcfce7' : isCurrent ? '#dbeafe' : '#f1f5f9',
                        color: isDone ? '#166534' : isCurrent ? '#1e40af' : '#64748b'
                      }}>
                        {isDone ? '✓ Approved' : isCurrent ? 'Under Review' : 'Pending'}
                      </span>
                    </div>
                    {s.approver && (
                      <div style={{ fontSize: '10px', color: '#334155', marginTop: 3 }}>
                        By: {s.approver} ({s.date || 'Signed'})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 7. Payment Processing & Disbursement Record (Step 10) */}
          <section className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <CreditCard size={15} />
                <span>Step 10: Payment Processing &amp; Disbursement</span>
              </h3>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                background: fnf.settlementStatus === 'Settled / Disbursed' ? '#dcfce7' : '#fffbeb',
                color: fnf.settlementStatus === 'Settled / Disbursed' ? '#15803d' : '#b45309',
                border: `1px solid ${fnf.settlementStatus === 'Settled / Disbursed' ? '#86efac' : '#fde68a'}`
              }}>
                {fnf.settlementStatus === 'Settled / Disbursed' ? '✓ Disbursed' : 'Awaiting Payout'}
              </span>
            </div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Payment Mode</span>
                  <strong>{fnf.payment?.mode || fnf.paymentMode || 'Bank Transfer (NEFT)'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Bank Name</span>
                  <strong>{fnf.payment?.bankName || 'HDFC Bank'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Account / IFSC</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {fnf.payment?.accountNo || '50100482910482'} / {fnf.payment?.ifsc || 'HDFC0001248'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>UTR / Reference No</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: fnf.payment?.utrNo ? '#059669' : '#64748b' }}>
                    {fnf.payment?.utrNo || fnf.settlementDate || 'Pending payout'}
                  </span>
                </div>
              </div>

              {/* Inline Disburse Form */}
              {showDisburseForm && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 8 }}>
                    Record Payout Transaction:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#475569' }}>Disbursement Date</label>
                      <input
                        type="date"
                        value={payoutData.paymentDate}
                        onChange={(e) => setPayoutData((p) => ({ ...p, paymentDate: e.target.value }))}
                        style={{ width: '100%', height: 32, borderRadius: 5, border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#475569' }}>Payment Mode</label>
                      <select
                        value={payoutData.mode}
                        onChange={(e) => setPayoutData((p) => ({ ...p, mode: e.target.value }))}
                        style={{ width: '100%', height: 32, borderRadius: 5, border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '12px' }}
                      >
                        <option value="Bank Transfer (NEFT)">Bank Transfer (NEFT)</option>
                        <option value="Bank Transfer (RTGS)">Bank Transfer (RTGS)</option>
                        <option value="Company Cheque">Company Cheque</option>
                        <option value="Cash Voucher">Cash Voucher</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#475569' }}>Bank UTR / Cheque No.</label>
                      <input
                        type="text"
                        value={payoutData.utrNo}
                        onChange={(e) => setPayoutData((p) => ({ ...p, utrNo: e.target.value }))}
                        placeholder="e.g. CMS2026110294821"
                        style={{ width: '100%', height: 32, borderRadius: 5, border: '1px solid #cbd5e1', padding: '0 6px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowDisburseForm(false)}
                      style={{ padding: '6px 12px', borderRadius: 5, border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDisbursement}
                      style={{ padding: '6px 16px', borderRadius: 5, border: 'none', background: '#059669', color: '#ffffff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Confirm Disbursement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 8. Final Documents & Exit Closure (Step 11) */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FileText size={15} />
              <span>Step 11: Final Documents &amp; Closure Artifacts</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {/* Voucher Statement */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>1. F&amp;F Statement Voucher</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Complete stamped accounting statement</span>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#2563eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Printer size={13} /> Print Voucher
                </button>
              </div>

              {/* Settlement / Relieving Letter */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>2. Relieving &amp; Experience Letter</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Official service certification</span>
                <button
                  type="button"
                  onClick={() => onGenerateLetter && onGenerateLetter(fnf)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    border: '1px solid #fed7aa',
                    background: '#fff7ed',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#ea580c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <ExternalLink size={13} /> Generate Letter
                </button>
              </div>

              {/* Exit Payslip */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>3. Exit Month Payslip</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Final broken month salary receipt</span>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0f172a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Download size={13} /> Download Slip
                </button>
              </div>
            </div>
          </section>

          {/* Remarks */}
          {fnf.remarks && (
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>HR Exit Notes &amp; Handover Remarks:</span>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1e293b' }}>{fnf.remarks}</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#334155'
            }}
          >
            <Printer size={15} />
            <span>Print Official Voucher</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Advance Approval Stage Button */}
            {!isFullyApproved && onApproveStage && (
              <button
                type="button"
                onClick={() => {
                  onApproveStage(fnf);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Check size={15} />
                <span>Sign-off Stage ({currentStage.replace('_', ' ').toUpperCase()})</span>
              </button>
            )}

            {/* Disburse Button */}
            {isFullyApproved && fnf.settlementStatus !== 'Settled / Disbursed' && (
              <button
                type="button"
                onClick={() => setShowDisburseForm(!showDisburseForm)}
                style={{
                  padding: '8px 16px',
                  background: '#059669',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Sparkles size={15} />
                <span>Disburse Settlement</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              Close
            </button>
          </div>
        </div>

      </aside>
    </div>
  );
}
