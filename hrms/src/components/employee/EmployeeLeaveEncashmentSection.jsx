import React, { useState } from 'react';
import {
  Coins,
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  FileText
} from 'lucide-react';
import {
  getStoredEncashments,
  saveStoredEncashments,
  calculateEncashmentAmount,
  ENCASHMENT_POLICY_DEFAULTS
} from '../../data/leaveEncashmentData';
import styles from './EmployeeLeaveEncashmentSection.module.css';

const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function EmployeeLeaveEncashmentSection({
  employee = {},
  onNotify
}) {
  const [encashments, setEncashments] = useState(() => getStoredEncashments());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const employeeName = employee.name || employee.employeeName || 'Rajeshwar Dayal Singh';
  const employeeCode = employee.employeeCode || employee.code || 'RR-SEC-0104';
  const currentELBalance = 24; // Standard EL balance
  const basicSalary = employee.basicSalary || employee.salary?.basic || 18000;

  // Filter employee's personal requests
  const myRequests = encashments.filter(
    (r) => r.employeeCode === employeeCode || r.employeeName?.toLowerCase() === employeeName.toLowerCase()
  );

  // Form State
  const [encashDays, setEncashDays] = useState(10);
  const [payoutMonth, setPayoutMonth] = useState('April 2026');
  const [remarks, setRemarks] = useState('');

  // Calculations
  const maxEncashableDays = Math.max(0, currentELBalance - ENCASHMENT_POLICY_DEFAULTS.minBalanceRetain);
  const liveCalculation = calculateEncashmentAmount(basicSalary, encashDays, 0);
  const balanceAfter = Math.max(0, currentELBalance - encashDays);

  const handleApply = (e) => {
    e.preventDefault();

    if (encashDays > maxEncashableDays) {
      alert(`Policy Limit: You must retain at least ${ENCASHMENT_POLICY_DEFAULTS.minBalanceRetain} EL days. Max encashable is ${maxEncashableDays} days.`);
      return;
    }

    const nextId = `ENC-2026-${String(encashments.length + 1).padStart(3, '0')}`;
    const newRecord = {
      id: `enc_${Date.now()}`,
      encashmentId: nextId,
      employeeId: employee.id || 'EMP-0104',
      employeeCode,
      employeeName,
      designation: employee.designation || 'Senior Security Supervisor',
      department: employee.department || 'Operations',
      clientName: employee.clientName || 'DLF CyberCity Tech Park',
      applyDate: new Date().toISOString().slice(0, 10),
      leaveType: 'EL (Earned Leave)',
      balanceBefore: currentELBalance,
      encashDays,
      balanceAfter,
      basicSalary,
      grossSalary: basicSalary * 1.5,
      dailyWageRate: liveCalculation.dailyWageRate,
      grossEncashmentAmount: liveCalculation.grossEncashment,
      tdsDeducted: liveCalculation.tdsDeducted,
      netPayableAmount: liveCalculation.netPayable,
      taxExemptSection10: true,
      status: 'Pending HR Approval',
      payoutPayrollMonth: payoutMonth,
      remarks: remarks || 'Self-service encashment application.',
      approvedBy: '—',
      approvalDate: ''
    };

    const nextList = [newRecord, ...encashments];
    setEncashments(nextList);
    saveStoredEncashments(nextList);
    setIsModalOpen(false);

    if (onNotify) {
      onNotify(`✓ Encashment request (${newRecord.encashmentId}) for ${encashDays} days submitted to HR for approval!`, 'success');
    }
  };

  return (
    <div className={styles.container}>
      {/* Policy Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Earned Leave (EL) Balance</div>
          <div className={styles.cardVal} style={{ color: '#2563eb' }}>{currentELBalance} Days</div>
          <div className={styles.cardSub}>Accrued privilege balance</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Max Encashable Now</div>
          <div className={styles.cardVal} style={{ color: '#16a34a' }}>{maxEncashableDays} Days</div>
          <div className={styles.cardSub}>Retains min 12 mandatory days</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Per Day Rate (Basic/26)</div>
          <div className={styles.cardVal}>{formatINR(basicSalary / 26)}</div>
          <div className={styles.cardSub}>Based on basic salary ₹{basicSalary.toLocaleString()}</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Tax Exemption Limit</div>
          <div className={styles.cardVal} style={{ color: '#7c3aed' }}>₹25 Lakhs</div>
          <div className={styles.cardSub}>100% Tax-Free u/s 10(10AA)</div>
        </div>
      </div>

      {/* Statutory Policy Banner */}
      <div className={styles.policyBanner}>
        <div className={styles.policyText}>
          <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
          <div>
            <strong>Company Leave Encashment Policy:</strong> Employees can encash up to <strong>15 days</strong> of Earned Leave (EL) per year. A minimum balance of <strong>12 EL days</strong> must remain in your quota. Formula: <code>(Basic Salary / 26 days) × Encashed Days</code>.
          </div>
        </div>
        <span className={styles.policyTag}>Section 10(10AA) Compliant</span>
      </div>

      {/* History Ledger Card */}
      <div className={styles.historyCard}>
        <div className={styles.historyHeader}>
          <div>
            <h3 className={styles.historyTitle}>My Leave Encashment Requests</h3>
            <p className={styles.historySub}>
              Track status of your submitted encashment applications and payout disbursements.
            </p>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Apply Leave Encashment</span>
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Applied Date</th>
                <th>Encashed Days</th>
                <th>Daily Rate</th>
                <th>Estimated Payout</th>
                <th>Payroll Month</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No leave encashment requests found. Click "Apply Leave Encashment" to submit.
                  </td>
                </tr>
              ) : (
                myRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.encashmentId}</strong>
                    </td>
                    <td>{r.applyDate}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>{r.encashDays} EL Days</span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Rem: {r.balanceAfter} d</div>
                    </td>
                    <td>{formatINR(r.dailyWageRate)}</td>
                    <td>
                      <strong style={{ color: '#16a34a', fontSize: '14px' }}>
                        {formatINR(r.netPayableAmount || r.grossEncashmentAmount)}
                      </strong>
                    </td>
                    <td>{r.payoutPayrollMonth || 'Exit / Cycle'}</td>
                    <td>
                      {r.status.includes('Disbursed') || r.status.includes('Settled') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: '11.5px', fontWeight: 600 }}>
                          <CheckCircle2 size={12} /> Disbursed
                        </span>
                      ) : r.status.includes('Approved') ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 600 }}>
                          <CheckCircle2 size={12} /> Approved
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, background: '#fef3c7', color: '#b45309', fontSize: '11.5px', fontWeight: 600 }}>
                          <Clock size={12} /> Pending HR
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "+ Apply Leave Encashment" Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Apply for Leave Encashment</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApply}>
              <div className={styles.modalBody}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Days to Encash (Max Eligible: {maxEncashableDays} Days)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="range"
                      min="1"
                      max={Math.max(1, maxEncashableDays)}
                      value={encashDays}
                      onChange={(e) => setEncashDays(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      min="1"
                      max={maxEncashableDays}
                      value={encashDays}
                      onChange={(e) => setEncashDays(Number(e.target.value))}
                      style={{ width: '70px', height: '36px', textAlign: 'center', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div className={styles.calcPreview}>
                  <div className={styles.previewRow}>
                    <span>Current EL Balance:</span>
                    <strong>{currentELBalance} Days</strong>
                  </div>
                  <div className={styles.previewRow}>
                    <span>Balance Retained (Min 12 required):</span>
                    <strong style={{ color: balanceAfter >= 12 ? '#16a34a' : '#dc2626' }}>
                      {balanceAfter} Days {balanceAfter >= 12 ? '✓ Policy Compliant' : '✕ Violation'}
                    </strong>
                  </div>
                  <div className={styles.previewRow}>
                    <span>Formula Applied:</span>
                    <code>(₹{basicSalary.toLocaleString()} / 26) × {encashDays} days</code>
                  </div>
                  <div className={styles.previewTotal}>
                    <span>Estimated Net Encashment:</span>
                    <span>{formatINR(liveCalculation.netPayable)}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Target Payroll Month for Disbursement
                  </label>
                  <select
                    value={payoutMonth}
                    onChange={(e) => setPayoutMonth(e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
                  >
                    <option value="April 2026">April 2026 Cycle</option>
                    <option value="May 2026">May 2026 Cycle</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Reason / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Festival expenditure, personal obligation"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ width: '100%', height: '38px', borderRadius: 6, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={encashDays > maxEncashableDays}
                >
                  Submit Encashment Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

