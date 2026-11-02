import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

/**
 * BonusRulesModal Component
 * Dedicated modal to configure organizational Statutory Bonus workflow, 
 * eligibility criteria, disbursement deadlines, and Payment of Bonus Act compliance.
 */
function BonusRulesModal({
  isOpen,
  onClose,
  initialSettings,
  onSave,
  isSaving = false,
  lastUpdatedDate = '',
  lastUpdatedBy = ''
}) {
  const [formData, setFormData] = useState({
    calculationMethod: 'Percentage of Basic + DA',
    bonusPercentage: 8.33,
    maximumBonusPercentage: 20.0,
    statutoryWageCeiling: 7000,
    eligibilityWageCeiling: 21000,
    minimumServiceDays: 30,
    disbursementSchedule: 'Annual (Diwali / Puja Festival)',
    disbursementDeadline: '',
    proRataApplicable: true,
    effectiveDate: ''
  });

  useEffect(() => {
    if (isOpen && initialSettings) {
      setFormData({
        calculationMethod: initialSettings.calculationMethod || 'Percentage of Basic + DA',
        bonusPercentage: initialSettings.bonusPercentage ?? 8.33,
        maximumBonusPercentage: initialSettings.maximumBonusPercentage ?? 20.0,
        statutoryWageCeiling: initialSettings.statutoryWageCeiling ?? 7000,
        eligibilityWageCeiling: initialSettings.eligibilityWageCeiling ?? 21000,
        minimumServiceDays: initialSettings.minimumServiceDays ?? 30,
        disbursementSchedule: initialSettings.disbursementSchedule || 'Annual (Diwali / Puja Festival)',
        disbursementDeadline: initialSettings.disbursementDeadline || '',
        proRataApplicable: initialSettings.proRataApplicable ?? true,
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
          <h3 className={styles.title}>Bonus Rules &amp; Settings</h3>
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
              {/* Calculation Method */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Calculation Method <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.calculationMethod}
                  onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value })}
                >
                  <option value="Percentage of Basic + DA">Percentage of Basic + DA (Statutory Standard)</option>
                  <option value="Fixed Amount">Fixed Amount per Eligible Employee</option>
                  <option value="Configured Amount by Grade">Configured Amount by Grade / Pay Group</option>
                </select>
                <span className={styles.hint}>Statutory wage base for bonus computation</span>
              </div>

              {/* Disbursement Schedule */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Disbursement Schedule <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.disbursementSchedule}
                  onChange={(e) => setFormData({ ...formData, disbursementSchedule: e.target.value })}
                >
                  <option value="Annual (Diwali / Puja Festival)">Annual (Diwali / Puja Festival)</option>
                  <option value="Half-Yearly (April & October)">Half-Yearly (April &amp; October)</option>
                  <option value="Monthly Accrual / Disbursement">Monthly Accrual / Disbursement</option>
                  <option value="Year-End Accounting Close (March)">Year-End Accounting Close (March)</option>
                </select>
                <span className={styles.hint}>When bonus payouts are credited in payroll</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Minimum Statutory Bonus Rate */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Min Statutory Rate (%) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="8.33"
                  max="20"
                  className={styles.input}
                  value={formData.bonusPercentage}
                  onChange={(e) => setFormData({ ...formData, bonusPercentage: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Sec 10: Mandatory floor is 8.33% (1 month basic)</span>
              </div>

              {/* Maximum Statutory Bonus Rate */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Max Statutory Rate (%) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="8.33"
                  max="20"
                  className={styles.input}
                  value={formData.maximumBonusPercentage}
                  onChange={(e) => setFormData({ ...formData, maximumBonusPercentage: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Sec 11: Ceiling limit is 20.0% of earned wages</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Statutory Computation Ceiling */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Statutory Computation Ceiling (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  className={styles.input}
                  value={formData.statutoryWageCeiling}
                  onChange={(e) => setFormData({ ...formData, statutoryWageCeiling: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Sec 12: ₹7,000 or State minimum wage (whichever higher)</span>
              </div>

              {/* Eligibility Wage Ceiling */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Eligibility Wage Ceiling (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  className={styles.input}
                  value={formData.eligibilityWageCeiling}
                  onChange={(e) => setFormData({ ...formData, eligibilityWageCeiling: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Employees earning up to ₹21,000/mo qualify</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Minimum Working Days */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Minimum Working Days <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  className={styles.input}
                  value={formData.minimumServiceDays}
                  onChange={(e) => setFormData({ ...formData, minimumServiceDays: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Sec 8: Minimum 30 working days required</span>
              </div>

              {/* Disbursement Cutoff Deadline */}
              <div className={styles.field}>
                <label className={styles.label}>Statutory Payment Deadline</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.disbursementDeadline}
                  onChange={(e) => setFormData({ ...formData, disbursementDeadline: e.target.value })}
                />
                <span className={styles.hint}>Sec 19: Within 8 months from accounting year close (30 Nov)</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Pro-rata Calculation - Toggle Switch */}
              <div className={styles.field}>
                <label className={styles.label}>Pro-rata for Mid-year Joinees</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.proRataApplicable}
                      onChange={(e) => setFormData({ ...formData, proRataApplicable: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.proRataApplicable ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Sec 13: Proportionate reduction for working days &lt; full year</span>
              </div>

              {/* Effective From Date */}
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

          {/* Footer Actions */}
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
              <span>{isSaving ? 'Saving...' : 'Save Bonus Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BonusRulesModal;
