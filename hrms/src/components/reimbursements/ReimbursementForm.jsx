import React, { useState, useMemo } from 'react';
import { X, UploadCloud, FileText, Trash2, Check } from 'lucide-react';
import styles from '../../pages/admin/Reimbursements.module.css';
import { REIMBURSEMENT_HEADS } from '../../data/reimbursementData';

export default function ReimbursementForm({ isOpen, onClose, onSave, editingClaim, expenseTypes, employees }) {
  if (!isOpen) return null;

  const [selectedEmpId, setSelectedEmpId] = useState(editingClaim?.employeeId || employees[0]?.id || '');
  const [expenseDate, setExpenseDate] = useState(editingClaim?.expenseDate || new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType] = useState(editingClaim?.expenseType || expenseTypes[0]?.name || '');
  const [amount, setAmount] = useState(editingClaim?.amount || '');
  const [purpose, setPurpose] = useState(editingClaim?.purpose || '');
  
  // Payroll Options
  const [payWithSalary, setPayWithSalary] = useState(editingClaim?.payrollIncluded ?? true);
  const [payrollMonth, setPayrollMonth] = useState(editingClaim?.payrollMonth || '2026-03');
  const [reimbursementHead, setReimbursementHead] = useState(editingClaim?.reimbursementHead || REIMBURSEMENT_HEADS[0]);
  const [isTaxable, setIsTaxable] = useState(editingClaim?.taxable ?? false);

  // Receipt
  const [receiptFile, setReceiptFile] = useState(editingClaim?.receipt || null);

  const activeEmployee = useMemo(() => {
    return employees.find(e => (e.id === selectedEmpId || e._id === selectedEmpId || e.employeeId === selectedEmpId)) || employees[0] || {};
  }, [selectedEmpId, employees]);

  const activeExpenseMeta = useMemo(() => {
    return expenseTypes.find(t => t.name === expenseType) || expenseTypes[0] || {};
  }, [expenseType, expenseTypes]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (file) {
      setReceiptFile({
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        fileType: file.type || 'application/pdf',
        uploadedAt: new Date().toLocaleString(),
        previewUrl: ''
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid claim amount.');
      return;
    }

    const payload = {
      ...(editingClaim || {}),
      employeeId: activeEmployee._id || activeEmployee.id || activeEmployee.employeeId,
      employeeCode: activeEmployee.employeeId || activeEmployee.employeeCode || '',
      employeeName: activeEmployee.name || activeEmployee.employeeName || 'Employee',
      department: activeEmployee.department || 'Security',
      designation: activeEmployee.designation || 'Staff',
      client: activeEmployee.clientName || activeEmployee.companyName || 'RR Security',
      clientName: activeEmployee.clientName || activeEmployee.companyName || 'RR Security',
      site: activeEmployee.site || activeEmployee.siteLocation || activeEmployee.joiningLocation || 'Main Site',
      expenseDate,
      expenseType,
      claimedAmount: Number(amount),
      amount: Number(amount),
      description: purpose,
      purpose,
      receipt: receiptFile,
      payrollIncluded: payWithSalary,
      payrollMonth,
      reimbursementHead,
      taxable: isTaxable
    };

    onSave(payload);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editingClaim ? `Edit Claim ${editingClaim.claimId}` : 'Create New Reimbursement Claim'}
          </h3>
          <button type="button" className={styles.iconBtn} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className={styles.modalBody}>
            
            {/* Employee Selector */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Select Employee <span className={styles.requiredStar}>*</span>
              </label>
              <select
                className={styles.select}
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                required
              >
                {employees.map(emp => {
                  const empKey = emp._id || emp.id || emp.employeeId;
                  const empCode = emp.employeeId || emp.employeeCode || '';
                  const empName = emp.name || emp.employeeName || 'Employee';
                  return (
                    <option key={empKey} value={empKey}>
                      {empCode} — {empName} ({emp.department || 'General'} • {emp.designation || 'Staff'})
                    </option>
                  );
                })}
              </select>
              <span className={styles.helperText}>
                Site: <strong>{activeEmployee?.site || activeEmployee?.siteLocation || 'Main Site'}</strong> | Client: <strong>{activeEmployee?.clientName || activeEmployee?.companyName || 'RR Security'}</strong>
              </span>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Expense Date <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]}
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Expense Category <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  required
                >
                  {expenseTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name} (Cap: ₹{t.maxLimit})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Claim Amount (₹) <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  min={1}
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {activeExpenseMeta && (
                  <span className={styles.helperText}>
                    Policy Limit: <strong>₹{activeExpenseMeta.maxLimit.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Payroll Month</label>
                <input
                  type="month"
                  className={styles.input}
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Purpose / Reason for Expense</label>
              <textarea
                className={styles.textarea}
                placeholder="Explain the business context, route traveled or necessity for this expense..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            {/* Bill / Receipt Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Bill / Receipt Attachment {activeExpenseMeta?.requiresReceipt && <span className={styles.requiredStar}>*</span>}
              </label>
              
              {receiptFile ? (
                <div className={styles.receiptCard}>
                  <div className={styles.receiptLeft}>
                    <div className={styles.receiptIcon}>
                      <FileText size={20} />
                    </div>
                    <div className={styles.receiptMeta}>
                      <span className={styles.receiptName}>{receiptFile.fileName}</span>
                      <span className={styles.receiptSize}>{receiptFile.fileSize}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setReceiptFile(null)}
                    title="Remove Receipt"
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </button>
                </div>
              ) : (
                <label
                  className={styles.uploadDropzone}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  <UploadCloud size={28} className={styles.uploadIcon} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Click to browse or Drag &amp; Drop bill receipt
                  </span>
                  <span className={styles.uploadHint}>Supported formats: PDF, JPG, JPEG, PNG (Up to 10MB)</span>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileDrop}
                  />
                </label>
              )}
            </div>

            {/* Payroll Settings */}
            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                Payroll Integration Options
              </span>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={payWithSalary}
                    onChange={(e) => setPayWithSalary(e.target.checked)}
                  />
                  Pay along with regular Salary Slip
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isTaxable}
                    onChange={(e) => setIsTaxable(e.target.checked)}
                  />
                  Mark as Taxable Component
                </label>
              </div>
            </div>

          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              <Check size={15} />
              <span>{editingClaim ? 'Update Claim' : 'Submit Reimbursement'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
