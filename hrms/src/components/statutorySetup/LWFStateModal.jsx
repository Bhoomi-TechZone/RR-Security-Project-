import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Haryana', 'Delhi', 'West Bengal', 
  'Tamil Nadu', 'Gujarat', 'Madhya Pradesh', 'Telangana', 'Andhra Pradesh', 
  'Punjab', 'Kerala', 'Rajasthan', 'Uttar Pradesh', 'Goa', 'Chhattisgarh'
];

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

function LWFStateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null,
  defaultState = 'Maharashtra'
}) {
  const [formData, setFormData] = useState({
    state: defaultState || 'Maharashtra',
    enabled: true,
    status: 'active',
    employeeContribution: 12,
    employerContribution: 36,
    frequency: 'Half-Yearly',
    deductionMonths: 'June & December',
    wageCeiling: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        const isEnabled = editingItem.enabled !== undefined ? Boolean(editingItem.enabled) : (editingItem.status !== 'inactive');
        setFormData({
          id: editingItem.id || editingItem._id,
          state: editingItem.state || defaultState || 'Maharashtra',
          enabled: isEnabled,
          status: isEnabled ? 'active' : 'inactive',
          employeeContribution: editingItem.employeeContribution ?? 12,
          employerContribution: editingItem.employerContribution ?? 36,
          frequency: editingItem.frequency || 'Half-Yearly',
          deductionMonths: editingItem.deductionMonths || 'June & December',
          wageCeiling: editingItem.wageCeiling ?? 0,
          effectiveDate: toDateInputValue(editingItem.effectiveDate),
          description: editingItem.description || ''
        });
      } else {
        setFormData({
          state: defaultState && defaultState !== 'All States' ? defaultState : 'Maharashtra',
          enabled: true,
          status: 'active',
          employeeContribution: 12,
          employerContribution: 36,
          frequency: 'Half-Yearly',
          deductionMonths: 'June & December',
          wageCeiling: 0,
          effectiveDate: new Date().toISOString().split('T')[0],
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, editingItem, defaultState]);

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

    const empVal = parseFloat(formData.employeeContribution);
    if (isNaN(empVal) || empVal < 0) {
      newErrors.employeeContribution = 'Employee contribution cannot be negative.';
    }

    const emprVal = parseFloat(formData.employerContribution);
    if (isNaN(emprVal) || emprVal < 0) {
      newErrors.employerContribution = 'Employer contribution cannot be negative.';
    }

    if (!formData.state) {
      newErrors.state = 'State is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isEnabled = Boolean(formData.enabled);
    onSubmit({
      ...formData,
      enabled: isEnabled,
      status: isEnabled ? 'active' : 'inactive',
      employeeContribution: empVal,
      employerContribution: emprVal,
      wageCeiling: Number(formData.wageCeiling) || 0
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
            {editingItem ? 'Edit State LWF Rule' : 'Add State LWF Rule'}
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
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      enabled: checked,
                      status: checked ? 'active' : 'inactive'
                    }));
                  }}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleLabel}>
                {formData.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Grid Row 1: State & Effective Date */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  State <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  required
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <span className={styles.hint}>Target State Labour Welfare Board</span>
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
                <span className={styles.hint}>Rule effective implementation date</span>
              </div>
            </div>

            {/* Grid Row 2: Employee Share & Employer Share */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Employee Share (₹) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  className={styles.input}
                  value={formData.employeeContribution}
                  onChange={(e) => handleChange('employeeContribution', e.target.value)}
                  required
                />
                {errors.employeeContribution ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.employeeContribution}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Employee deduction per cycle (e.g. ₹12 for MH)
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Employer Share (₹) <span className={styles.required}>*</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  className={styles.input}
                  value={formData.employerContribution}
                  onChange={(e) => handleChange('employerContribution', e.target.value)}
                  required
                />
                {errors.employerContribution ? (
                  <span style={{ fontSize: '11px', color: '#dc2626' }}>
                    {errors.employerContribution}
                  </span>
                ) : (
                  <span className={styles.hint}>
                    Company matching contribution (e.g. ₹36 for MH)
                  </span>
                )}
              </div>
            </div>

            {/* Grid Row 3: Contribution Frequency & Deduction Month(s) */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Contribution Frequency <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.frequency}
                  onChange={(e) => handleChange('frequency', e.target.value)}
                >
                  <option value="Half-Yearly">Half-Yearly (Statutory standard in MH, DL, GJ)</option>
                  <option value="Yearly">Yearly (Annual in KA, TN, AP, TS)</option>
                  <option value="Monthly">Monthly (Every Month in HR)</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
                <span className={styles.hint}>Remittance frequency to State Board</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Deduction Month(s)</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="e.g. June & December or Every Month"
                  value={formData.deductionMonths}
                  onChange={(e) => handleChange('deductionMonths', e.target.value)}
                />
                <span className={styles.hint}>Months in which payroll deduction runs</span>
              </div>
            </div>

            {/* Grid Row 4: Wage Ceiling & Notes */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Eligibility Wage Ceiling (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  step="500"
                  className={styles.input}
                  value={formData.wageCeiling}
                  onChange={(e) => handleChange('wageCeiling', e.target.value)}
                />
                <span className={styles.hint}>Enter '0' if all employees qualify without ceiling</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Notes / Reference</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="e.g. Standard MH Labour Welfare Board ratio 1:3"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                <span className={styles.hint}>Optional internal compliance remark</span>
              </div>
            </div>
          </div>

          {/* Footer with Standard #c14436 Save Button */}
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

export default LWFStateModal;
