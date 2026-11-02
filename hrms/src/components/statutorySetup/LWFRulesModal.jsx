import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

/**
 * LWFRulesModal Component
 * Dedicated modal to configure organizational Labour Welfare Fund (LWF)
 * payroll deduction cycles, employer matching contribution ratios, and state compliance workflows.
 */
function LWFRulesModal({
  isOpen,
  onClose,
  initialSettings,
  onSave,
  isSaving = false,
  lastUpdatedDate = '',
  lastUpdatedBy = ''
}) {
  const [formData, setFormData] = useState({
    deductionSchedule: 'Half-Yearly (June & December)',
    employerRatio: '1:3 (MH Standard)',
    autoDeductPayroll: true,
    prorateOnExit: true,
    defaultState: 'Maharashtra',
    effectiveDate: ''
  });

  useEffect(() => {
    if (isOpen && initialSettings) {
      setFormData({
        deductionSchedule: initialSettings.deductionSchedule || 'Half-Yearly (June & December)',
        employerRatio: initialSettings.employerRatio || '1:3 (MH Standard)',
        autoDeductPayroll: initialSettings.autoDeductPayroll !== undefined ? Boolean(initialSettings.autoDeductPayroll) : true,
        prorateOnExit: initialSettings.prorateOnExit !== undefined ? Boolean(initialSettings.prorateOnExit) : true,
        defaultState: initialSettings.defaultState || 'Maharashtra',
        effectiveDate: initialSettings.effectiveDate || ''
      });
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header - Only Title and Close button */}
        <div className={styles.header}>
          <h3 className={styles.title}>LWF Rules &amp; Settings</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.body}>
            <div className={styles.grid2}>
              {/* Deduction Processing Schedule */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Deduction Schedule <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.deductionSchedule}
                  onChange={(e) => setFormData({ ...formData, deductionSchedule: e.target.value })}
                >
                  <option value="Half-Yearly (June & December)">Half-Yearly (June &amp; December - Standard)</option>
                  <option value="Annual Close (December)">Annual Close (December Only)</option>
                  <option value="Monthly with Payroll">Monthly with Payroll</option>
                  <option value="Quarterly">Quarterly (March, June, Sept, Dec)</option>
                </select>
                <span className={styles.hint}>When LWF deductions trigger in payroll cycles</span>
              </div>

              {/* Employer Contribution Ratio */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Employer Contribution Ratio <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.employerRatio}
                  onChange={(e) => setFormData({ ...formData, employerRatio: e.target.value })}
                >
                  <option value="1:3 (MH Standard)">1:3 (MH Standard - Employer pays 3x)</option>
                  <option value="1:2 (KA & HR Standard)">1:2 (KA &amp; HR Standard - Employer pays 2x)</option>
                  <option value="1:1 (Equal Share)">1:1 (Equal Contribution Share)</option>
                  <option value="1:5 (WB Standard)">1:5 (WB Standard - Employer pays 5x)</option>
                </select>
                <span className={styles.hint}>Standard employer matching multiplier</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Auto Deduct Toggle */}
              <div className={styles.field}>
                <label className={styles.label}>Auto-deduct in Payroll Cycle</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.autoDeductPayroll}
                      onChange={(e) => setFormData({ ...formData, autoDeductPayroll: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.autoDeductPayroll ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Automatically process LWF deductions in salary slip</span>
              </div>

              {/* Prorate on Exit Toggle */}
              <div className={styles.field}>
                <label className={styles.label}>Prorate on Mid-Year Exit</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.prorateOnExit}
                      onChange={(e) => setFormData({ ...formData, prorateOnExit: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.prorateOnExit ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Deduct full or proportionate cycle amount on exit</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Default State */}
              <div className={styles.field}>
                <label className={styles.label}>Primary Organization State</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.defaultState}
                  onChange={(e) => setFormData({ ...formData, defaultState: e.target.value })}
                />
                <span className={styles.hint}>Registered head office establishment state</span>
              </div>

              {/* Effective Date */}
              <div className={styles.field}>
                <label className={styles.label}>Effective From Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
                <span className={styles.hint}>Date from which rules take effect</span>
              </div>
            </div>

            {/* Audit info */}
            {lastUpdatedDate && (
              <div className={styles.auditBar}>
                Last updated: <strong>{lastUpdatedDate}</strong> {lastUpdatedBy ? `by ${lastUpdatedBy}` : ''}
              </div>
            )}
          </div>

          {/* Footer Actions with Standard #c14436 Save Button */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSaving}
            >
              <Save size={15} />
              <span>{isSaving ? 'Saving...' : 'Save LWF Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LWFRulesModal;

