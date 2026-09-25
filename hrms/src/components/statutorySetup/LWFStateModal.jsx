import React, { useState, useEffect, useRef } from 'react';
import { X, Landmark } from 'lucide-react';
import styles from './StatutoryModal.module.css';

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Haryana', 'Delhi', 'West Bengal', 
  'Tamil Nadu', 'Gujarat', 'Madhya Pradesh', 'Telangana', 'Andhra Pradesh', 
  'Punjab', 'Kerala', 'Rajasthan', 'Uttar Pradesh'
];

function LWFStateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  const isEdit = !!editingItem;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          state: 'Maharashtra',
          employeeContribution: 12,
          employerContribution: 36,
          frequency: 'Half-Yearly',
          deductionMonths: 'June & December',
          effectiveDate: '2026-04-01',
          status: 'active'
        });
      }
    }
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.state) newErrors.state = 'State is required.';
    if (formData.employeeContribution === '' || formData.employeeContribution === undefined || Number(formData.employeeContribution) < 0) {
      newErrors.employeeContribution = 'Employee contribution cannot be negative.';
    }
    if (formData.employerContribution === '' || formData.employerContribution === undefined || Number(formData.employerContribution) < 0) {
      newErrors.employerContribution = 'Employer contribution cannot be negative.';
    }
    if (!formData.frequency) newErrors.frequency = 'Contribution frequency is required.';
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective date is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      employeeContribution: Number(formData.employeeContribution),
      employerContribution: Number(formData.employerContribution)
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="lwf-modal-title">
      <div ref={modalRef} tabIndex="-1" className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}><Landmark size={20} /></div>
            <div>
              <h2 id="lwf-modal-title" className={styles.title}>
                {isEdit ? 'Edit State LWF Rule' : 'Add State LWF Configuration'}
              </h2>
              <p className={styles.subtitle}>Configure Labour Welfare Fund statutory contributions by State</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>State <span className={styles.required}>*</span></label>
            <select
              className={`${styles.select} ${errors.state ? styles.inputError : ''}`}
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            {errors.state && <span className={styles.errorText}>{errors.state}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Employee Contribution (₹) <span className={styles.required}>*</span></label>
              <input
                type="number"
                min="0"
                step="0.25"
                className={`${styles.input} ${errors.employeeContribution ? styles.inputError : ''}`}
                placeholder="e.g. 12"
                value={formData.employeeContribution ?? ''}
                onChange={(e) => setFormData({ ...formData, employeeContribution: e.target.value })}
              />
              {errors.employeeContribution && <span className={styles.errorText}>{errors.employeeContribution}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Employer Contribution (₹) <span className={styles.required}>*</span></label>
              <input
                type="number"
                min="0"
                step="0.25"
                className={`${styles.input} ${errors.employerContribution ? styles.inputError : ''}`}
                placeholder="e.g. 36"
                value={formData.employerContribution ?? ''}
                onChange={(e) => setFormData({ ...formData, employerContribution: e.target.value })}
              />
              {errors.employerContribution && <span className={styles.errorText}>{errors.employerContribution}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Contribution Frequency <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={formData.frequency || 'Monthly'}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Deduction Month(s)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. June & December or Every Month"
                value={formData.deductionMonths || ''}
                onChange={(e) => setFormData({ ...formData, deductionMonths: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Effective Date <span className={styles.required}>*</span></label>
            <input
              type="date"
              className={`${styles.input} ${errors.effectiveDate ? styles.inputError : ''}`}
              value={formData.effectiveDate || ''}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            />
            {errors.effectiveDate && <span className={styles.errorText}>{errors.effectiveDate}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={() => setFormData({ ...formData, status: 'active' })}
                />
                <span>Active</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={() => setFormData({ ...formData, status: 'inactive' })}
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>{isEdit ? 'Save Changes' : 'Create LWF Rule'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default LWFStateModal;
