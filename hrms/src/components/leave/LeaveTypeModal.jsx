import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import styles from './LeaveTypeModal.module.css';

export default function LeaveTypeModal({
  isOpen,
  mode = 'add', // 'add' | 'edit' | 'view'
  initialData = null,
  onClose,
  onSave
}) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Paid',
    annualQuota: 12,
    carryForward: 'No',
    maxAccumulation: 0,
    encashment: 'No',
    status: 'Active',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        category: initialData.category || 'Paid',
        annualQuota: initialData.annualQuota ?? 12,
        carryForward: initialData.carryForward || 'No',
        maxAccumulation: initialData.maxAccumulation ?? 0,
        encashment: initialData.encashment || 'No',
        status: initialData.status || 'Active',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'Paid',
        annualQuota: 12,
        carryForward: 'No',
        maxAccumulation: 0,
        encashment: 'No',
        status: 'Active',
        description: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly) {
      onClose();
      return;
    }

    const errs = {};
    if (!formData.code.trim()) errs.code = 'Leave code is required (e.g. CL, SL, EL)';
    if (!formData.name.trim()) errs.name = 'Leave name is required';

    if (formData.category === 'Paid' && (formData.annualQuota === '' || Number(formData.annualQuota) < 0)) {
      errs.annualQuota = 'Valid quota is required for paid leaves';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      ...formData,
      annualQuota: Number(formData.annualQuota || 0),
      maxAccumulation: Number(formData.maxAccumulation || 0)
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className={styles.title}>
                {mode === 'add' ? 'Add New Leave Type' : mode === 'edit' ? 'Edit Leave Configuration' : 'Leave Type Details'}
              </h2>
              <p className={styles.subtitle}>Configure statutory quota, carry forward rules, and payroll impact parameters</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form id="leaveTypeForm" onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Leave Code <span className={styles.req}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CL, SL, EL, LWP"
                className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                disabled={isViewOnly || (mode === 'edit' && initialData?.code)}
              />
              {errors.code && <span className={styles.errorText}>{errors.code}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Leave Name <span className={styles.req}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Casual Leave"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isViewOnly}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Paid / Unpaid <span className={styles.req}>*</span>
              </label>
              <select
                className={styles.select}
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                disabled={isViewOnly}
              >
                <option value="Paid">Paid (No Salary Deduction)</option>
                <option value="Unpaid">Unpaid / LWP (Salary Deduction)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Annual Quota (Days)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 12"
                className={`${styles.input} ${errors.annualQuota ? styles.inputError : ''}`}
                value={formData.annualQuota}
                onChange={(e) => handleChange('annualQuota', e.target.value)}
                disabled={isViewOnly}
              />
              {errors.annualQuota && <span className={styles.errorText}>{errors.annualQuota}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.select}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isViewOnly}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Carry Forward</label>
              <select
                className={styles.select}
                value={formData.carryForward}
                onChange={(e) => handleChange('carryForward', e.target.value)}
                disabled={isViewOnly}
              >
                <option value="No">No (Lapses at year end)</option>
                <option value="Yes">Yes (Carried to next year)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Maximum Accumulation (Days)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 30 (0 for no cap)"
                className={styles.input}
                value={formData.maxAccumulation}
                onChange={(e) => handleChange('maxAccumulation', e.target.value)}
                disabled={isViewOnly || formData.carryForward === 'No'}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Encashment Allowed</label>
              <select
                className={styles.select}
                value={formData.encashment}
                onChange={(e) => handleChange('encashment', e.target.value)}
                disabled={isViewOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes (Payable at separation/yearly)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description / Policy Remarks</label>
            <textarea
              rows="3"
              placeholder="Provide policy notes or usage criteria..."
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isViewOnly}
            />
          </div>

          {formData.category === 'Unpaid' && (
            <div className={styles.infoAlert}>
              <AlertCircle size={16} />
              <span>
                <strong>Payroll Impact Note:</strong> This unpaid leave type will automatically trigger salary deduction in monthly payroll calculation based on recorded attendance days.
              </span>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            {isViewOnly ? 'Close' : 'Cancel'}
          </button>
          {!isViewOnly && (
            <button type="submit" form="leaveTypeForm" className={styles.saveBtn}>
              {mode === 'add' ? 'Save Leave Type' : 'Update Configuration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
