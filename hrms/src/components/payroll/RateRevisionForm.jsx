import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, Calculator, ArrowRight, AlertCircle } from 'lucide-react';
import styles from './RateRevisionForm.module.css';
import { REVISION_REASONS } from '../../data/rateRevisionData';

export default function RateRevisionForm({
  isOpen,
  onClose,
  onSave,
  editingRevision,
  employees = []
}) {
  if (!isOpen) return null;

  const [selectedEmpId, setSelectedEmpId] = useState(editingRevision?.employeeId || employees[0]?.id || '');
  const [effectiveFrom, setEffectiveFrom] = useState(editingRevision?.effectiveFrom || new Date().toISOString().split('T')[0]);
  const [newRate, setNewRate] = useState(editingRevision?.newRate || '');
  const [revisionReason, setRevisionReason] = useState(editingRevision?.revisionReason || REVISION_REASONS[0]);
  const [remarks, setRemarks] = useState(editingRevision?.remarks || '');
  const [status, setStatus] = useState(editingRevision?.status || 'Pending Approval');

  // Active Employee lookup
  const activeEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [selectedEmpId, employees]);

  // Current / Old Rate from employee
  const oldRate = useMemo(() => {
    if (editingRevision) return editingRevision.oldRate;
    return activeEmployee?.grossSalary || activeEmployee?.basic || 20000;
  }, [editingRevision, activeEmployee]);

  // Old Salary Components breakdown
  const oldBasic = useMemo(() => activeEmployee?.basic || Math.round(oldRate * 0.6), [activeEmployee, oldRate]);
  const oldVda = useMemo(() => activeEmployee?.vda || Math.round(oldRate * 0.1), [activeEmployee, oldRate]);
  const oldHra = useMemo(() => activeEmployee?.hra || Math.round(oldRate * 0.2), [activeEmployee, oldRate]);
  const oldOther = useMemo(() => activeEmployee?.otherAllowance || (oldRate - (oldBasic + oldVda + oldHra)), [activeEmployee, oldRate, oldBasic, oldVda, oldHra]);
  const oldOtRate = useMemo(() => activeEmployee?.overtimeRate || Math.round((oldBasic + oldVda) / 100), [activeEmployee, oldBasic, oldVda]);

  // Live Component calculations based on new rate
  const numNewRate = Number(newRate) || 0;
  const rateDifference = numNewRate - oldRate;

  // Derive revised components proportionally
  const newBasic = Math.round(numNewRate * 0.6);
  const newVda = Math.round(numNewRate * 0.1);
  const newHra = Math.round(numNewRate * 0.2);
  const newOther = Math.max(0, numNewRate - (newBasic + newVda + newHra));
  const newOtRate = Math.round((newBasic + newVda) / 100);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numNewRate || numNewRate <= 0) {
      alert('Please enter a valid new rate.');
      return;
    }

    const payload = {
      ...(editingRevision || {}),
      employeeId: activeEmployee.id,
      employeeCode: activeEmployee.employeeCode,
      employeeName: activeEmployee.name,
      client: activeEmployee.companyName || 'ABC Security Services',
      site: activeEmployee.siteLocation || activeEmployee.joiningLocation || 'Main Site',
      designation: activeEmployee.designation || 'Staff',
      effectiveFrom,
      oldRate,
      newRate: numNewRate,
      rateDifference,
      oldBasic,
      oldVda,
      oldHra,
      oldOtherAllowance: oldOther,
      oldOtRate,
      oldGross: oldRate,
      newBasic,
      newVda,
      newHra,
      newOtherAllowance: newOther,
      newOtRate,
      newGross: numNewRate,
      revisionReason,
      status,
      remarks
    };

    onSave(payload);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {editingRevision ? `Edit Rate Revision (${editingRevision.revisionId})` : 'Create Rate Revision'}
            </h2>
            <p className={styles.subtitle}>
              Adjust compensation rates, salary component breakdown, and effective dates.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {/* Employee Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Employee <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setNewRate('');
                }}
                disabled={!!editingRevision}
                required
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} — {emp.name} ({emp.department} • {emp.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Meta Summary */}
            <div style={{ background: 'var(--surface-hover, #f8fafc)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Client</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{activeEmployee?.companyName || 'ABC Security'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Site / Post</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{activeEmployee?.siteLocation || 'Main Gate'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Designation</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{activeEmployee?.designation || 'Staff'}</div>
              </div>
            </div>

            {/* Rate Difference Live Preview */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #4f46e5', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Current Rate</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', fontFamily: 'Consolas, monospace' }}>
                  ₹{oldRate.toLocaleString()}
                </div>
              </div>

              <ArrowRight size={20} color="#94a3b8" />

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Revised Rate</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#4f46e5', fontFamily: 'Consolas, monospace' }}>
                  {numNewRate > 0 ? `₹${numNewRate.toLocaleString()}` : '—'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Difference</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: rateDifference >= 0 ? '#16a34a' : '#dc2626', fontFamily: 'Consolas, monospace' }}>
                  {numNewRate > 0 ? `${rateDifference >= 0 ? '+' : ''}₹${rateDifference.toLocaleString()}` : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Effective From Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.input}
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  New Monthly Rate (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  min={1}
                  placeholder="e.g. 23000"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Component Breakdown Breakdown */}
            {numNewRate > 0 && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Revised Salary Components Breakdown
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Basic (60%)</span>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>₹{newBasic.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>VDA (10%)</span>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>₹{newVda.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>HRA (20%)</span>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>₹{newHra.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Other Allowance</span>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>₹{newOther.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Revision Reason</label>
                <select
                  className={styles.select}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                >
                  {REVISION_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Initial Status</label>
                <select
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Remarks / Business Justification</label>
              <textarea
                className={styles.textarea}
                placeholder="Provide context, performance review notes or client approval reference..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Fixed Modal Footer */}
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              <Check size={16} />
              <span>{editingRevision ? 'Save Changes' : 'Create Rate Revision'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
