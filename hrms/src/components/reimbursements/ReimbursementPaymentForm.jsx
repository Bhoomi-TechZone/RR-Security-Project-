import React, { useState } from 'react';
import { X, CheckCheck } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';
import { PAYMENT_MODES, REIMBURSEMENT_HEADS } from '../../data/reimbursementData';

export default function ReimbursementPaymentForm({ claim, onClose, onProcess }) {
  const maxPayable = claim.approvedAmount || claim.amount;

  const [paidAmt, setPaidAmt] = useState(maxPayable);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [txnNumber, setTxnNumber] = useState('');
  const [payWithSalary, setPayWithSalary] = useState(claim.payrollIncluded ?? false);
  const [payrollMonth, setPayrollMonth] = useState(claim.payrollMonth || '2026-03');
  const [reimbursementHead, setReimbursementHead] = useState(claim.reimbursementHead || REIMBURSEMENT_HEADS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(paidAmt) > Number(maxPayable)) {
      alert(`Paid amount cannot exceed the approved amount of ₹${maxPayable.toLocaleString()}.`);
      return;
    }
    if ((paymentMode === 'Bank Transfer' || paymentMode === 'UPI') && !txnNumber.trim()) {
      alert('Transaction / UTR number is required for digital bank payments.');
      return;
    }

    onProcess(claim.id, {
      paidAmount: Number(paidAmt),
      paymentDate,
      paymentMode,
      transactionNumber: txnNumber,
      payrollIncluded: payWithSalary,
      payrollMonth,
      reimbursementHead
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Process Payment — {claim.claimId}
          </h3>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Beneficiary</span>
                <span className={styles.infoVal}>{claim.employeeName} ({claim.employeeCode})</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Approved Payable</span>
                <span className={styles.infoVal} style={{ color: '#16a34a', fontSize: '15px' }}>
                  ₹{maxPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Disbursed Amount (₹) <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  min={1}
                  max={maxPayable}
                  value={paidAmt}
                  onChange={(e) => setPaidAmt(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Payment Date <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.input}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Mode</label>
                <select
                  className={styles.select}
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  UTR / Reference No. {(paymentMode === 'Bank Transfer' || paymentMode === 'UPI') && <span className={styles.requiredStar}>*</span>}
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. UTR9832104921 / Cheque #881"
                  value={txnNumber}
                  onChange={(e) => setTxnNumber(e.target.value)}
                  required={paymentMode === 'Bank Transfer' || paymentMode === 'UPI'}
                />
              </div>
            </div>

            {/* Payroll sync switch */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={payWithSalary}
                  onChange={(e) => setPayWithSalary(e.target.checked)}
                />
                Include in Payroll Register &amp; Salary Slip
              </label>

              {payWithSalary && (
                <div className={styles.formGrid} style={{ marginTop: '6px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Payroll Month</label>
                    <input
                      type="month"
                      className={styles.input}
                      value={payrollMonth}
                      onChange={(e) => setPayrollMonth(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Salary Head</label>
                    <select
                      className={styles.select}
                      value={reimbursementHead}
                      onChange={(e) => setReimbursementHead(e.target.value)}
                    >
                      {REIMBURSEMENT_HEADS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              <CheckCheck size={15} />
              <span>Record Payment Settlement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
