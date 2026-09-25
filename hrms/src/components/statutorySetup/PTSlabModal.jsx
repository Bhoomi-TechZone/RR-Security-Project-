import React, { useState, useEffect, useRef } from 'react';
import { X, Layers } from 'lucide-react';
import styles from './StatutoryModal.module.css';

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Gujarat', 
  'Madhya Pradesh', 'Tamil Nadu', 'West Bengal', 'Kerala', 'Odisha', 
  'Assam', 'Bihar', 'Delhi', 'Haryana', 'Punjab', 'Rajasthan', 'Uttar Pradesh'
];

function PTSlabModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null,
  selectedState = 'Maharashtra'
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
          state: selectedState || 'Maharashtra',
          minSalary: 0,
          maxSalary: 15000,
          taxAmount: 200,
          februaryTaxAmount: '',
          effectiveFrom: '2026-04-01',
          status: 'active'
        });
      }
    }
  }, [isOpen, editingItem, selectedState]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.state) newErrors.state = 'State is required.';
    if (formData.minSalary === '' || formData.minSalary === undefined || formData.minSalary < 0) {
      newErrors.minSalary = 'Minimum salary cannot be negative.';
    }
    if (formData.maxSalary === '' || formData.maxSalary === undefined || formData.maxSalary < 0) {
      newErrors.maxSalary = 'Maximum salary cannot be negative.';
    }
    if (Number(formData.maxSalary) < Number(formData.minSalary)) {
      newErrors.maxSalary = 'Max salary must be greater than Min salary.';
    }
    if (formData.taxAmount === '' || formData.taxAmount === undefined || formData.taxAmount < 0) {
      newErrors.taxAmount = 'Tax amount is required (min 0).';
    }
    if (!formData.effectiveFrom) newErrors.effectiveFrom = 'Effective date is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      minSalary: Number(formData.minSalary),
      maxSalary: Number(formData.maxSalary),
      taxAmount: Number(formData.taxAmount),
      februaryTaxAmount: formData.februaryTaxAmount ? Number(formData.februaryTaxAmount) : undefined
    });
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="pt-slab-title">
      <div ref={modalRef} tabIndex="-1" className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}><Layers size={20} /></div>
            <div>
              <h2 id="pt-slab-title" className={styles.title}>
                {isEdit ? 'Edit PT Slab' : 'Add Professional Tax Slab'}
              </h2>
              <p className={styles.subtitle}>Configure state-wise monthly wage slab and tax deduction</p>
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
              <label className={styles.label}>Salary Min (₹) <span className={styles.required}>*</span></label>
              <input
                type="number"
                min="0"
                className={`${styles.input} ${errors.minSalary ? styles.inputError : ''}`}
                placeholder="0"
                value={formData.minSalary ?? 0}
                onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
              />
              {errors.minSalary && <span className={styles.errorText}>{errors.minSalary}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Salary Max (₹) <span className={styles.required}>*</span></label>
              <input
                type="number"
                min="0"
                className={`${styles.input} ${errors.maxSalary ? styles.inputError : ''}`}
                placeholder="9999999 for Above"
                value={formData.maxSalary ?? 9999999}
                onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
              />
              {errors.maxSalary && <span className={styles.errorText}>{errors.maxSalary}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Monthly Tax Amount (₹) <span className={styles.required}>*</span></label>
              <input
                type="number"
                min="0"
                className={`${styles.input} ${errors.taxAmount ? styles.inputError : ''}`}
                placeholder="e.g. 200"
                value={formData.taxAmount ?? 0}
                onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
              />
              {errors.taxAmount && <span className={styles.errorText}>{errors.taxAmount}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>February Tax Amount (₹) (Optional)</label>
              <input
                type="number"
                min="0"
                className={styles.input}
                placeholder="e.g. 300 (For Maharashtra slab)"
                value={formData.februaryTaxAmount || ''}
                onChange={(e) => setFormData({ ...formData, februaryTaxAmount: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Effective From Date <span className={styles.required}>*</span></label>
            <input
              type="date"
              className={`${styles.input} ${errors.effectiveFrom ? styles.inputError : ''}`}
              value={formData.effectiveFrom || ''}
              onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
            />
            {errors.effectiveFrom && <span className={styles.errorText}>{errors.effectiveFrom}</span>}
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
            <button type="submit" className={styles.submitBtn}>{isEdit ? 'Save Changes' : 'Create Slab'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default PTSlabModal;
