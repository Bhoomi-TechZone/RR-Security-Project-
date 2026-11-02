import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Gift, Info } from 'lucide-react';
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

function BonusRateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null
}) {
  const [formData, setFormData] = useState({
    enabled: true,
    financialYear: 'FY 2026-2027',
    effectiveDate: new Date().toISOString().split('T')[0],
    bonusPercentage: 8.33,
    statutoryWageCeiling: 7000,
    eligibilityWageCeiling: 21000,
    calculationMethod: 'Percentage of Basic + DA',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          enabled: editingItem.enabled !== undefined ? Boolean(editingItem.enabled) : true,
          financialYear: editingItem.financialYear || 'FY 2026-2027',
          effectiveDate: toDateInputValue(editingItem.effectiveDate || editingItem.displayDate),
          bonusPercentage: editingItem.bonusPercentage ?? 8.33,
          statutoryWageCeiling: editingItem.statutoryWageCeiling ?? 7000,
          eligibilityWageCeiling: editingItem.eligibilityWageCeiling ?? 21000,
          calculationMethod: editingItem.calculationMethod || 'Percentage of Basic + DA',
          description: editingItem.description || ''
        });
      } else {
        setFormData({
          enabled: true,
          financialYear: 'FY 2026-2027',
          effectiveDate: new Date().toISOString().split('T')[0],
          bonusPercentage: 8.33,
          statutoryWageCeiling: 7000,
          eligibilityWageCeiling: 21000,
          calculationMethod: 'Percentage of Basic + DA',
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

    const pct = parseFloat(formData.bonusPercentage);
    if (isNaN(pct) || pct < 8.33 || pct > 20) {
      newErrors.bonusPercentage = 'Bonus rate must be between 8.33% and 20.0%';
    }

    const ceiling = parseFloat(formData.statutoryWageCeiling);
    if (isNaN(ceiling) || ceiling < 1000) {
      newErrors.statutoryWageCeiling = 'Statutory ceiling must be at least ₹1,000';
    }

    const elig = parseFloat(formData.eligibilityWageCeiling);
    if (isNaN(elig) || elig < ceiling) {
      newErrors.eligibilityWageCeiling = 'Eligibility limit must be greater than computation ceiling';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      bonusPercentage: pct,
      statutoryWageCeiling: ceiling,
      eligibilityWageCeiling: elig
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
        {/* Header - Only Title and Close button */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            {editingItem ? 'Edit Statutory Bonus Rule' : 'Add Statutory Bonus Rule'}
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
            {/* Toggle: Enabled (matching ESI / PF) */}
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

            {/* Grid Row 1: Financial Year & Effective Date */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Financial Year <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.financialYear}
                  onChange={(e) => handleChange('financialYear', e.target.value)}
                >
                  <option value="FY 2026-2027">FY 2026-2027 (Current)</option>
                  <option value="FY 2025-2026">FY 2025-2026</option>
                  <option value="FY 2024-2025">FY 2024-2025</option>
                </select>
                <span className={styles.hint}>Applicable accounting year</span>
              </div>

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
                <span className={styles.hint}>Start date for calculation</span>
              </div>
            </div>

            {/* Grid Row 2: Bonus Rate (%) & Computation Ceiling */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Bonus Rate (%) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="8.33" 
                  max="20"
                  className={styles.input}
                  value={formData.bonusPercentage}
                  onChange={(e) => handleChange('bonusPercentage', e.target.value)}
                  required
                />
                {errors.bonusPercentage ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.bonusPercentage}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Min 8.33% (1 month basic) to Max 20.0%
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Computation Ceiling (₹) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="1000"
                  step="500"
                  className={styles.input}
                  value={formData.statutoryWageCeiling}
                  onChange={(e) => handleChange('statutoryWageCeiling', e.target.value)}
                  required
                />
                {errors.statutoryWageCeiling ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.statutoryWageCeiling}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Statutory base ceiling (₹7,000 or State Min Wage)
                  </span>
                )}
              </div>
            </div>

            {/* Grid Row 3: Eligibility Limit & Calculation Method */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Eligibility Limit (₹) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="1000"
                  step="1000"
                  className={styles.input}
                  value={formData.eligibilityWageCeiling}
                  onChange={(e) => handleChange('eligibilityWageCeiling', e.target.value)}
                  required
                />
                {errors.eligibilityWageCeiling ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.eligibilityWageCeiling}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Employees earning up to ₹21,000/mo qualify
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Calculation Method</label>
                <select
                  className={styles.select}
                  value={formData.calculationMethod}
                  onChange={(e) => handleChange('calculationMethod', e.target.value)}
                >
                  <option value="Percentage of Basic + DA">Percentage of Basic + DA (Statutory)</option>
                  <option value="Fixed Amount">Fixed Amount per Employee</option>
                  <option value="Prorated by Attendance">Prorated by Attendance Days</option>
                </select>
                <span className={styles.hint}>Basis for wage calculation</span>
              </div>
            </div>

            {/* Row 4: Notes */}
            <div className={styles.field}>
              <label className={styles.label}>Notes</label>
              <input 
                type="text" 
                className={styles.input}
                placeholder="e.g. Standard 8.33% on ₹7,000 ceiling"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <span className={styles.hint}>Optional internal remarks</span>
            </div>
          </div>

          {/* Footer matching TDS Modal */}
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

export default BonusRateModal;
