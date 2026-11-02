import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

const toDateInputValue = (val) => {
  if (!val) return new Date().toISOString().split('T')[0];
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes('T')) return s.split('T')[0];

  const parts = s.split(/[-/ ]/);
  if (parts.length === 3) {
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const mStr = parts[1]?.toLowerCase();
    if (months[mStr]) {
      const dd = parts[0].padStart(2, '0');
      const mm = months[mStr];
      const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return new Date().toISOString().split('T')[0];
};

function GratuityRateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null
}) {
  const [formData, setFormData] = useState({
    enabled: true,
    effectiveDate: new Date().toISOString().split('T')[0],
    eligibilityYears: 5,
    calculationBasis: 'Basic + DA',
    workingDaysPerMonth: 26,
    gratuityDaysPerYear: 15,
    maximumTaxExemptionLimit: 2000000,
    monthlyAccrualRate: 4.81,
    serviceRounding: '6+ months counts as 1 full year',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          enabled: editingItem.enabled !== undefined ? Boolean(editingItem.enabled) : true,
          effectiveDate: toDateInputValue(editingItem.effectiveDate || editingItem.displayDate),
          eligibilityYears: editingItem.eligibilityYears ?? 5,
          calculationBasis: editingItem.calculationBasis || 'Basic + DA',
          workingDaysPerMonth: editingItem.workingDaysPerMonth ?? 26,
          gratuityDaysPerYear: editingItem.gratuityDaysPerYear ?? 15,
          maximumTaxExemptionLimit: editingItem.maximumTaxExemptionLimit ?? 2000000,
          monthlyAccrualRate: editingItem.monthlyAccrualRate ?? 4.81,
          serviceRounding: editingItem.serviceRounding || '6+ months counts as 1 full year',
          description: editingItem.description || ''
        });
      } else {
        setFormData({
          enabled: true,
          effectiveDate: new Date().toISOString().split('T')[0],
          eligibilityYears: 5,
          calculationBasis: 'Basic + DA',
          workingDaysPerMonth: 26,
          gratuityDaysPerYear: 15,
          maximumTaxExemptionLimit: 2000000,
          monthlyAccrualRate: 4.81,
          serviceRounding: '6+ months counts as 1 full year',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, editingItem]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const eligYrs = parseFloat(formData.eligibilityYears);
    if (isNaN(eligYrs) || eligYrs < 1) {
      newErrors.eligibilityYears = 'Eligibility period must be at least 1 year (Statutory standard is 5)';
    }

    const maxLimit = parseFloat(formData.maximumTaxExemptionLimit);
    if (isNaN(maxLimit) || maxLimit < 100000) {
      newErrors.maximumTaxExemptionLimit = 'Tax exemption ceiling must be at least ₹1,00,000';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      eligibilityYears: eligYrs,
      workingDaysPerMonth: Number(formData.workingDaysPerMonth) || 26,
      gratuityDaysPerYear: Number(formData.gratuityDaysPerYear) || 15,
      maximumTaxExemptionLimit: maxLimit,
      monthlyAccrualRate: Number(formData.monthlyAccrualRate) || 4.81
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Clean Title Only */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            {editingItem ? 'Edit Gratuity Rule' : 'Add Gratuity Rule'}
          </h3>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.body}>
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
              <span className={styles.toggleLabel}>
                {formData.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Grid Row 1: Effective Date & Eligibility Years */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Effective From <span className={styles.required}>*</span>
                </label>
                <input 
                  type="date" 
                  className={styles.input}
                  value={formData.effectiveDate}
                  onChange={(e) => handleChange('effectiveDate', e.target.value)}
                  required
                />
                <span className={styles.hint}>Effective implementation date</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Eligibility Period (Years) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  className={styles.input}
                  value={formData.eligibilityYears}
                  onChange={(e) => handleChange('eligibilityYears', e.target.value)}
                  required
                />
                {errors.eligibilityYears ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.eligibilityYears}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Sec 4(1): Mandatory 5 continuous years
                  </span>
                )}
              </div>
            </div>

            {/* Grid Row 2: Calculation Basis & Max Tax Exemption */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Calculation Basis <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.calculationBasis}
                  onChange={(e) => handleChange('calculationBasis', e.target.value)}
                >
                  <option value="Basic + DA">Basic Salary + Dearness Allowance (DA)</option>
                  <option value="Basic Salary">Basic Salary Only</option>
                  <option value="Gross Salary">Gross Salary (Excl. Bonus)</option>
                </select>
                <span className={styles.hint}>Statutory wage base for gratuity payout</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Max Tax Exemption (₹) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="100000"
                  step="50000"
                  className={styles.input}
                  value={formData.maximumTaxExemptionLimit}
                  onChange={(e) => handleChange('maximumTaxExemptionLimit', e.target.value)}
                  required
                />
                {errors.maximumTaxExemptionLimit ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.maximumTaxExemptionLimit}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Section 10(10) ceiling: ₹20,00,000 (20 Lakhs)
                  </span>
                )}
              </div>
            </div>

            {/* Grid Row 3: Gratuity Days per Year & Working Days per Month */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Gratuity Days per Year <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="7"
                  max="30"
                  className={styles.input}
                  value={formData.gratuityDaysPerYear}
                  onChange={(e) => handleChange('gratuityDaysPerYear', e.target.value)}
                  required
                />
                <span className={styles.hint}>
                  Statutory formula: 15 days of last drawn wage
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Working Days per Month <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="20"
                  max="31"
                  className={styles.input}
                  value={formData.workingDaysPerMonth}
                  onChange={(e) => handleChange('workingDaysPerMonth', e.target.value)}
                  required
                />
                <span className={styles.hint}>
                  Statutory divisor: 26 working days (excl. Sundays)
                </span>
              </div>
            </div>

            {/* Grid Row 4: Monthly Accrual Rate & Rounding */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Monthly Provisioning Accrual (%)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="1" 
                  max="10"
                  className={styles.input}
                  value={formData.monthlyAccrualRate}
                  onChange={(e) => handleChange('monthlyAccrualRate', e.target.value)}
                />
                <span className={styles.hint}>Monthly payroll accrual: 15/(26×12) = 4.81%</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Service Rounding Rule</label>
                <select
                  className={styles.select}
                  value={formData.serviceRounding}
                  onChange={(e) => handleChange('serviceRounding', e.target.value)}
                >
                  <option value="6+ months counts as 1 full year">6+ months counts as 1 full year (Statutory)</option>
                  <option value="Exact completed years only">Exact completed years only (Floor)</option>
                </select>
                <span className={styles.hint}>Fraction of year in excess of 6 months</span>
              </div>
            </div>

            {/* Row 5: Notes */}
            <div className={styles.field}>
              <label className={styles.label}>Notes</label>
              <input 
                type="text" 
                className={styles.input}
                placeholder="e.g. Standard 15/26 formula under Payment of Gratuity Act 1972"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <span className={styles.hint}>Optional internal compliance remarks</span>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.saveBtn}
            >
              <Save size={15} />
              <span>{editingItem ? 'Update Rule' : 'Save Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GratuityRateModal;

