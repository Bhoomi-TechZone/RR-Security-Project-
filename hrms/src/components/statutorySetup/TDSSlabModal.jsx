import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import styles from './TDSRulesModal.module.css';

/**
 * TDSSlabModal Component
 * Modal to Add or Edit Income Tax Slabs for New Regime and Old Regime.
 */
function TDSSlabModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null,
  activeRegime = 'New Regime'
}) {
  const [formData, setFormData] = useState({
    id: '',
    regime: activeRegime || 'New Regime',
    minIncome: 0,
    maxIncome: 300000,
    isAbove: false,
    taxRate: 0,
    cessRate: 4,
    rebateApplicable: false,
    description: '',
    enabled: true,
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        const isAboveVal = Number(editingItem.maxIncome) >= 99999999 || editingItem.isAbove === true;
        const isEnabledVal = editingItem.enabled !== undefined 
          ? Boolean(editingItem.enabled) 
          : (editingItem.status !== 'inactive');
        setFormData({
          id: editingItem.id || editingItem._id || `tds-slab-${Date.now()}`,
          regime: editingItem.regime || activeRegime || 'New Regime',
          minIncome: editingItem.minIncome ?? 0,
          maxIncome: isAboveVal ? '' : (editingItem.maxIncome ?? 0),
          isAbove: isAboveVal,
          taxRate: editingItem.taxRate ?? 0,
          cessRate: editingItem.cessRate ?? 4,
          rebateApplicable: Boolean(editingItem.rebateApplicable),
          description: editingItem.description || '',
          enabled: isEnabledVal,
          status: isEnabledVal ? 'active' : 'inactive'
        });
      } else {
        setFormData({
          id: `tds-slab-${Date.now()}`,
          regime: activeRegime || 'New Regime',
          minIncome: 0,
          maxIncome: 300000,
          isAbove: false,
          taxRate: 0,
          cessRate: 4,
          rebateApplicable: false,
          description: '',
          enabled: true,
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, editingItem, activeRegime]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const minVal = Number(formData.minIncome);
    const maxVal = Number(formData.maxIncome);

    if (isNaN(minVal) || minVal < 0) {
      newErrors.minIncome = 'Minimum income cannot be negative.';
    }
    if (!formData.isAbove && (isNaN(maxVal) || maxVal <= minVal)) {
      newErrors.maxIncome = 'Maximum income must be greater than minimum income.';
    }
    const rateVal = Number(formData.taxRate);
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
      newErrors.taxRate = 'Tax rate must be between 0% and 100%.';
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
      minIncome: minVal,
      maxIncome: formData.isAbove ? 99999999 : maxVal,
      taxRate: rateVal,
      cessRate: Number(formData.cessRate) || 0
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Only Title and Close button */}
        <div className={styles.header}>
          <h3 className={styles.title}>
            {editingItem ? 'Edit Income Tax Slab' : 'Add Income Tax Slab'}
          </h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.body}>
            {/* Toggle: Status (matching ESI / PF) */}
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

            {/* Grid Row 1: Tax Regime & Min Income */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Tax Regime <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.regime}
                  onChange={(e) => setFormData({ ...formData, regime: e.target.value })}
                >
                  <option value="New Regime">New Tax Regime (Section 115BAC)</option>
                  <option value="Old Regime">Old Tax Regime (Chapter VI-A)</option>
                </select>
                <span className={styles.hint}>Target statutory regime</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Min Income (₹) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={styles.input}
                  value={formData.minIncome}
                  onChange={(e) => setFormData({ ...formData, minIncome: e.target.value })}
                  required
                />
                {errors.minIncome ? (
                  <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.minIncome}</span>
                ) : (
                  <span className={styles.hint}>Lower slab boundary (e.g. 0, 300000)</span>
                )}
              </div>
            </div>

            {/* Grid Row 2: Max Income & Tax Rate */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Max Income (₹) {!formData.isAbove && <span className={styles.required}>*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={styles.input}
                  value={formData.isAbove ? '' : formData.maxIncome}
                  onChange={(e) => setFormData({ ...formData, maxIncome: e.target.value })}
                  disabled={formData.isAbove}
                  placeholder={formData.isAbove ? 'No Upper Limit (Above)' : 'e.g. 700000'}
                  required={!formData.isAbove}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isAbove}
                      onChange={(e) => setFormData({ ...formData, isAbove: e.target.checked })}
                      style={{ width: '14px', height: '14px', accentColor: '#2563eb' }}
                    />
                    <span>No upper ceiling (Above)</span>
                  </label>
                </div>
                {errors.maxIncome && (
                  <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.maxIncome}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Tax Rate (%) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className={styles.input}
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  required
                />
                {errors.taxRate ? (
                  <span style={{ color: '#dc2626', fontSize: '11px' }}>{errors.taxRate}</span>
                ) : (
                  <span className={styles.hint}>Statutory slab tax rate (0% to 30%)</span>
                )}
              </div>
            </div>

            {/* Grid Row 3: Cess Rate & Section 87A Rebate Toggle */}
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Health &amp; Edu Cess (%)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  className={styles.input}
                  value={formData.cessRate}
                  onChange={(e) => setFormData({ ...formData, cessRate: e.target.value })}
                />
                <span className={styles.hint}>Standard statutory cess is 4%</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Section 87A Rebate</label>
                <div className={styles.toggleRow} style={{ marginTop: '6px' }}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.rebateApplicable}
                      onChange={(e) => setFormData({ ...formData, rebateApplicable: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>
                    {formData.rebateApplicable ? 'Rebate Applicable' : 'Not Applicable'}
                  </span>
                </div>
                <span className={styles.hint}>Full tax rebate for income up to ₹7L (New Regime)</span>
              </div>
            </div>

            {/* Description / Notes */}
            <div className={styles.field}>
              <label className={styles.label}>Notes / Description</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. 5% tax rate (Sec 87A rebate applies up to ₹7L)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <span className={styles.hint}>Display label shown in the slabs table</span>
            </div>
          </div>

          {/* Footer matching TDS Modal */}
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              <Save size={15} />
              <span>{editingItem ? 'Update Slab' : 'Save Slab'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TDSSlabModal;
