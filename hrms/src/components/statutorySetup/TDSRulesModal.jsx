import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

/**
 * TDSRulesModal Component
 * Dedicated modal to configure organizational TDS Rules, standard deductions, 
 * and investment declaration cutoff workflows.
 */
function TDSRulesModal({
  isOpen,
  onClose,
  initialSettings,
  onSave,
  isSaving = false,
  lastUpdatedDate = '',
  lastUpdatedBy = ''
}) {
  const [formData, setFormData] = useState({
    defaultTaxRegime: 'New Regime',
    effectiveFinancialYear: '2026-2027',
    standardDeductionNewRegime: 75000,
    standardDeductionOldRegime: 50000,
    allowEmployeeRegimeSwitch: true,
    investmentDeclarationRequired: true,
    proofSubmissionDeadline: '',
    healthAndEduCessRate: 4,
    monthlyTDSThreshold: 500000,
    calculateOn: 'Annual Projected Income'
  });

  useEffect(() => {
    if (isOpen && initialSettings) {
      setFormData({
        defaultTaxRegime: initialSettings.defaultTaxRegime || 'New Regime',
        effectiveFinancialYear: initialSettings.effectiveFinancialYear || '2026-2027',
        standardDeductionNewRegime: initialSettings.standardDeductionNewRegime ?? 75000,
        standardDeductionOldRegime: initialSettings.standardDeductionOldRegime ?? 50000,
        allowEmployeeRegimeSwitch: initialSettings.allowEmployeeRegimeSwitch ?? true,
        investmentDeclarationRequired: initialSettings.investmentDeclarationRequired ?? true,
        proofSubmissionDeadline: initialSettings.proofSubmissionDeadline || '',
        healthAndEduCessRate: initialSettings.healthAndEduCessRate ?? 4,
        monthlyTDSThreshold: initialSettings.monthlyTDSThreshold ?? 500000,
        calculateOn: initialSettings.calculateOn || 'Annual Projected Income'
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
          <h3 className={styles.title}>TDS Rules &amp; Declaration Workflow</h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.body}>
            <div className={styles.grid2}>
              {/* Default Organization Regime */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Default Organization Regime <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.defaultTaxRegime}
                  onChange={(e) => setFormData({ ...formData, defaultTaxRegime: e.target.value })}
                >
                  <option value="New Regime">New Tax Regime (Section 115BAC - Default)</option>
                  <option value="Old Regime">Old Tax Regime (Chapter VI-A Deductions)</option>
                </select>
                <span className={styles.hint}>Applied when employee has not chosen a regime</span>
              </div>

              {/* Effective Financial Year */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Effective Financial Year <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.effectiveFinancialYear}
                  onChange={(e) => setFormData({ ...formData, effectiveFinancialYear: e.target.value })}
                >
                  <option value="2026-2027">FY 2026-2027 (AY 2027-2028)</option>
                  <option value="2025-2026">FY 2025-2026 (AY 2026-2027)</option>
                </select>
                <span className={styles.hint}>Current statutory tax assessment year</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Standard Deduction - New Regime */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Standard Deduction - New (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={styles.input}
                  value={formData.standardDeductionNewRegime}
                  onChange={(e) => setFormData({ ...formData, standardDeductionNewRegime: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Budget 2024 revision: ₹75,000</span>
              </div>

              {/* Standard Deduction - Old Regime */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Standard Deduction - Old (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={styles.input}
                  value={formData.standardDeductionOldRegime}
                  onChange={(e) => setFormData({ ...formData, standardDeductionOldRegime: Number(e.target.value) })}
                  required
                />
                <span className={styles.hint}>Old regime fixed deduction: ₹50,000</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Allow Employee to Switch - Toggle Switch */}
              <div className={styles.field}>
                <label className={styles.label}>Allow Employee to Switch Regime</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.allowEmployeeRegimeSwitch}
                      onChange={(e) => setFormData({ ...formData, allowEmployeeRegimeSwitch: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.allowEmployeeRegimeSwitch ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Permits employees to toggle New / Old regime</span>
              </div>

              {/* Require Investment Declarations - Toggle Switch */}
              <div className={styles.field}>
                <label className={styles.label}>Require Investment Declarations</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.investmentDeclarationRequired}
                      onChange={(e) => setFormData({ ...formData, investmentDeclarationRequired: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.investmentDeclarationRequired ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <span className={styles.hint}>Tax proof submissions workflow</span>
              </div>
            </div>

            <div className={styles.grid2}>
              {/* Proof Deadline */}
              <div className={styles.field}>
                <label className={styles.label}>Declaration Proof Deadline</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.proofSubmissionDeadline}
                  onChange={(e) => setFormData({ ...formData, proofSubmissionDeadline: e.target.value })}
                />
                <span className={styles.hint}>Cutoff date for final proof verification</span>
              </div>

              {/* Health & Education Cess */}
              <div className={styles.field}>
                <label className={styles.label}>Health &amp; Education Cess (%)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  className={styles.input}
                  value={formData.healthAndEduCessRate}
                  onChange={(e) => setFormData({ ...formData, healthAndEduCessRate: Number(e.target.value) })}
                />
                <span className={styles.hint}>Statutory standard cess is 4%</span>
              </div>
            </div>

            {/* Audit log bar */}
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
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TDSRulesModal;
