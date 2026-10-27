import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Info } from 'lucide-react';
import styles from './ESIRateModal.module.css';

function ESIRateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null
}) {
  const [formData, setFormData] = useState({
    enabled: true,
    effectiveDate: new Date().toISOString().split('T')[0],
    employeeContribution: 0.75,
    employerContribution: 3.25,
    eligibilityWageCeiling: 21000,
    deductionWageCeiling: 0
  });

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          enabled: editingItem.enabled !== undefined ? editingItem.enabled : true,
          effectiveDate: editingItem.effectiveDate || new Date().toISOString().split('T')[0],
          employeeContribution: editingItem.employeeContribution ?? 0.75,
          employerContribution: editingItem.employerContribution ?? 3.25,
          eligibilityWageCeiling: editingItem.eligibilityWageCeiling ?? 21000,
          deductionWageCeiling: editingItem.deductionWageCeiling ?? 0
        });
      } else {
        setFormData({
          enabled: true,
          effectiveDate: new Date().toISOString().split('T')[0],
          employeeContribution: 0.75,
          employerContribution: 3.25,
          eligibilityWageCeiling: 21000,
          deductionWageCeiling: 0
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

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: editingItem?.id || `esi-rate-${Date.now()}`
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.closeIconBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Toggle: Enabled */}
            <div className={styles.toggleRow}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleLabel}>Enabled</span>
            </div>

            {/* Effective From */}
            <div className={styles.formRow}>
              <label className={styles.fieldLabel}>Effective From</label>
              <div className={styles.dateInputWrapper}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={formData.effectiveDate}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Employee Contribution */}
            <div className={styles.formRow}>
              <label className={styles.fieldLabel}>Employee Contribution</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.numberInput}
                  value={formData.employeeContribution}
                  onChange={(e) => handleChange('employeeContribution', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* Employer Contribution */}
            <div className={styles.formRow}>
              <label className={styles.fieldLabel}>Employer Contribution</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.numberInput}
                  value={formData.employerContribution}
                  onChange={(e) => handleChange('employerContribution', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* Eligibility Wage Ceiling */}
            <div className={styles.formRow}>
              <label className={styles.fieldLabel}>
                Eligibility Wage Ceiling
                <span className={styles.infoIcon} title="Maximum gross salary eligibility limit (Default ₹21,000)">
                  <Info size={14} />
                </span>
              </label>
              <div className={styles.ceilingInputWrapper}>
                <input
                  type="number"
                  min="0"
                  className={styles.ceilingInput}
                  value={formData.eligibilityWageCeiling}
                  onChange={(e) => handleChange('eligibilityWageCeiling', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Deduction Wage Ceiling */}
            <div className={styles.formRow}>
              <label className={styles.fieldLabel}>
                Deduction Wage Ceiling
                <span className={styles.infoIcon} title="Wage limit for ESI deduction. Set to 0 for no limit.">
                  <Info size={14} />
                </span>
              </label>
              <div className={styles.ceilingInputWrapper}>
                <input
                  type="number"
                  min="0"
                  className={styles.ceilingInput}
                  value={formData.deductionWageCeiling}
                  onChange={(e) => handleChange('deductionWageCeiling', Number(e.target.value))}
                />
                <span className={styles.hintText}>Enter &apos;0&apos; for no limit</span>
              </div>
            </div>

            {/* Info Callout */}
            <div className={styles.infoCallout}>
              <div className={styles.calloutIcon}>
                <Info size={16} />
              </div>
              <p className={styles.calloutText}>
                Deduction above ceiling can be enabled at employee level. Open an employee record, go to Salary, and edit any salary revision to configure.
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
            >
              <Save size={15} />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ESIRateModal;

