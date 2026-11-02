import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

/**
 * GratuityRulesModal Component
 * Dedicated modal to configure organizational Gratuity workflow, 
 * eligibility criteria, Payment of Gratuity Act 1972 statutory formula,
 * tax exemption ceilings, and monthly provisioning.
 */
function GratuityRulesModal({
  isOpen,
  onClose,
  initialSettings,
  onSave,
  isSaving = false,
  lastUpdatedDate = '',
  lastUpdatedBy = ''
}) {
  const [formData, setFormData] = useState({
    eligibilityYears: 5,
    calculationBasis: 'Basic + DA',
    formulaMethod: '15 Days × (Last Drawn Basic + DA) × Completed Years / 26',
    gratuityDaysPerYear: 15,
    workingDaysPerMonth: 26,
    maximumTaxExemptionLimit: 2000000,
    monthlyAccrualRate: 4.81,
    serviceRounding: true,
    deathDisablementWaiver: true,
    effectiveDate: ''
  });

  useEffect(() => {
    if (isOpen && initialSettings) {
      setFormData({
        eligibilityYears: initialSettings.eligibilityYears ?? 5,
        calculationBasis: initialSettings.calculationBasis || 'Basic + DA',
        formulaMethod: initialSettings.formulaMethod || '15 Days × (Last Drawn Basic + DA) × Completed Years / 26',
        gratuityDaysPerYear: initialSettings.gratuityDaysPerYear ?? 15,
        workingDaysPerMonth: initialSettings.workingDaysPerMonth ?? 26,
        maximumTaxExemptionLimit: initialSettings.maximumTaxExemptionLimit ?? 2000000,
        monthlyAccrualRate: initialSettings.monthlyAccrualRate ?? 4.81,
        serviceRounding: initialSettings.serviceRounding !== undefined ? Boolean(initialSettings.serviceRounding) : true,
        deathDisablementWaiver: initialSettings.deathDisablementWaiver !== undefined ? Boolean(initialSettings.deathDisablementWaiver) : true,
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
          <h3 className={styles.title}>Gratuity Rules &amp; Settings</h3>
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
              {/* Eligibility Period */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Eligibility Service Period (Years) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className={styles.input}
                  value={formData.eligibilityYears}
                  onChange={(e) => setFormData({ ...formData, eligibilityYears: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Sec 4(1): 5 continuous years of service mandatory</span>
              </div>

              {/* Calculation Basis */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Calculation Basis <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.calculationBasis}
                  onChange={(e) => setFormData({ ...formData, calculationBasis: e.target.value })}
                >
                  <option value="Basic + DA">Basic Salary + Dearness Allowance (DA) [Statutory]</option>
                  <option value="Basic Salary">Basic Salary Only</option>
                  <option value="Gross Salary">Gross Salary (Excl. Incentive & Bonus)</option>
                </select>
                <span className={styles.hint}>Statutory wage base for gratuity payout</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Gratuity Days per Service Year */}
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
                  onChange={(e) => setFormData({ ...formData, gratuityDaysPerYear: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>15 days of last drawn wage per completed year</span>
              </div>

              {/* Working Days in Month */}
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
                  onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>26 days per month (Sundays excluded)</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Max Tax Exemption Limit */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Maximum Tax Exemption (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="100000"
                  step="50000"
                  className={styles.input}
                  value={formData.maximumTaxExemptionLimit}
                  onChange={(e) => setFormData({ ...formData, maximumTaxExemptionLimit: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Section 10(10) statutory ceiling: ₹20,00,000 (20 Lakhs)</span>
              </div>

              {/* Monthly Provisioning Accrual */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Monthly Accrual Rate (%) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="10"
                  className={styles.input}
                  value={formData.monthlyAccrualRate}
                  onChange={(e) => setFormData({ ...formData, monthlyAccrualRate: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>15 / (26 × 12) = 4.81% monthly wage base accrual</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Service Rounding Toggle */}
              <div className={styles.field}>
                <label className={styles.label}>Round &gt; 6 Months to 1 Year</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.serviceRounding}
                      onChange={(e) => setFormData({ ...formData, serviceRounding: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.serviceRounding ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Service &gt; 6 months counts as 1 full year</span>
              </div>

              {/* Waiver for Death / Disablement Toggle */}
              <div className={styles.field}>
                <label className={styles.label}>Waiver for Death / Disablement</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.deathDisablementWaiver}
                      onChange={(e) => setFormData({ ...formData, deathDisablementWaiver: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.deathDisablementWaiver ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Sec 4(1) proviso: 5-year condition waived upon death</span>
              </div>
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
              <span>{isSaving ? 'Saving...' : 'Save Gratuity Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GratuityRulesModal;

