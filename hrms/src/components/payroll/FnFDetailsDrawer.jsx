import React from 'react';
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
  AlertTriangle
} from 'lucide-react';
import styles from './RateRevisionDetailsDrawer.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function FnFDetailsDrawer({
  isOpen,
  onClose,
  record,
  onApprove,
  onMarkSettled
}) {
  if (!isOpen || !record) return null;

  const fnf = record;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className={styles.title}>{fnf.settlementId}</h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '12px',
                background: fnf.settlementStatus === 'Settled' ? '#ecfdf5' : '#eff6ff',
                color: fnf.settlementStatus === 'Settled' ? '#059669' : '#1d4ed8',
                border: `1px solid ${fnf.settlementStatus === 'Settled' ? '#a7f3d0' : '#bfdbfe'}`
              }}>
                {fnf.settlementStatus}
              </span>
            </div>
            <p className={styles.subtitle}>
              Full &amp; Final Settlement Statement • Last Working Day: <strong>{fnf.lastWorkingDay}</strong>
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* 1. Employee Details */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <User size={15} />
              <span>Separating Employee Identity</span>
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
                <span className={styles.infoValue}>{fnf.employeeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Designation / Role</span>
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
                <span className={styles.infoLabel}>Last Working Day (LWD)</span>
                <span className={styles.infoValue} style={{ color: '#059669', fontWeight: 700 }}>
                  {fnf.lastWorkingDay}
                </span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>Separation Category &amp; Reason</span>
                <span className={styles.infoValue}>{fnf.separationReason}</span>
              </div>
            </div>
          </section>

          {/* 2. Earnings & Accruals Breakdown */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ color: '#059669' }}>
              <IndianRupee size={15} />
              <span>A. Earnings &amp; Final Accruals</span>
            </h3>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      Earned Days Unpaid Salary ({fnf.unpaidWorkDays} days @ {formatINR(fnf.perDayWage)}/day)
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                      {formatINR(fnf.unpaidSalary)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      Leave Encashment Balance ({fnf.leaveBalanceDays || 0} EL days)
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                      {formatINR(fnf.leaveEncashment)}
                    </td>
                  </tr>
                  {fnf.gratuityAmount > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>
                        Gratuity Benefit ({fnf.tenureYears || 5}+ years continuous service)
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                        {formatINR(fnf.gratuityAmount)}
                      </td>
                    </tr>
                  )}
                  {fnf.bonusOrArrears > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>
                        Accrued Festival Bonus / Arrears
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {formatINR(fnf.bonusOrArrears)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                    <td style={{ padding: '9px 12px', color: '#0f172a' }}>Total Gross Payable (A)</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#0f172a' }}>
                      {formatINR(fnf.totalEarnings)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Deductions & Recoveries Breakdown */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ color: '#dc2626' }}>
              <ShieldCheck size={15} />
              <span>B. Deductions &amp; Asset Recoveries</span>
            </h3>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      Notice Period Shortfall Recovery ({fnf.noticePeriodRequiredDays - (fnf.noticePeriodServedDays || 0)} days)
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: fnf.noticePayRecovery > 0 ? '#dc2626' : '#64748b' }}>
                      {fnf.noticePayRecovery > 0 ? `-${formatINR(fnf.noticePayRecovery)}` : '₹0'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      Uniform Kit / Equipment Damage or Missing Charges
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: fnf.assetDamageRecovery > 0 ? '#dc2626' : '#64748b' }}>
                      {fnf.assetDamageRecovery > 0 ? `-${formatINR(fnf.assetDamageRecovery)}` : '₹0'}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>
                      Outstanding Salary Advance / Loan Adjustment
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: fnf.loanAdvanceDeduction > 0 ? '#dc2626' : '#64748b' }}>
                      {fnf.loanAdvanceDeduction > 0 ? `-${formatINR(fnf.loanAdvanceDeduction)}` : '₹0'}
                    </td>
                  </tr>
                  <tr style={{ background: '#fef2f2', fontWeight: 700 }}>
                    <td style={{ padding: '9px 12px', color: '#dc2626' }}>Total Deductions (B)</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#dc2626' }}>
                      {fnf.totalDeductions > 0 ? `-${formatINR(fnf.totalDeductions)}` : '₹0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Net Settlement Highlight Card */}
          <div style={{
            background: '#ecfdf5',
            border: '2px solid #a7f3d0',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: '#047857' }}>
                Net Payable Settlement Amount (A - B)
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#065f46', marginTop: 2 }}>
                {formatINR(fnf.netSettlementAmount)}
              </div>
              <div style={{ fontSize: '11.5px', color: '#047857', marginTop: 2 }}>
                Mode: {fnf.paymentMode || 'Bank Transfer (NEFT)'}
              </div>
            </div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#d1fae5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <IndianRupee size={26} />
            </div>
          </div>

          {/* 5. Departmental No-Dues Checklist */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FileCheck2 size={15} />
              <span>Departmental No-Dues &amp; Handover Checklist</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Operations / Site</span>
                <strong style={{ color: '#059669' }}>✓ Handover Cleared</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Uniform &amp; Store</span>
                <strong style={{ color: fnf.assetClearanceStatus === 'Cleared' ? '#059669' : '#d97706' }}>
                  {fnf.assetClearanceStatus === 'Cleared' ? '✓ Items Cleared' : '⏳ Store Pending'}
                </strong>
              </div>
              <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Finance &amp; Accounts</span>
                <strong style={{ color: '#059669' }}>✓ Dues Adjusted</strong>
              </div>
            </div>
          </section>

          {/* 6. Remarks */}
          {fnf.remarks && (
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>HR Settlement Remarks:</span>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#1e293b' }}>{fnf.remarks}</p>
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
            <span>Print Voucher</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {fnf.settlementStatus === 'Calculation Ready' && onApprove && (
              <button
                type="button"
                onClick={() => {
                  onApprove(fnf);
                  onClose();
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
                <span>Approve Settlement</span>
              </button>
            )}

            {fnf.settlementStatus === 'Approved' && onMarkSettled && (
              <button
                type="button"
                onClick={() => {
                  onMarkSettled(fnf);
                  onClose();
                }}
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
                <span>Confirm Disbursed</span>
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

