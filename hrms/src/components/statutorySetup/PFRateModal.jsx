import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Info } from 'lucide-react';
import styles from './PFRateModal.module.css';

function PFRateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null
}) {
  const [formData, setFormData] = useState({
    enabled: true,
    effectiveDate: new Date().toISOString().split('T')[0],
    employeeRate: 0,
    seniorEmployeeRate: 0,
    employerRate: 0,
    seniorEmployerRate: 0,
    pensionRate: 0,
    seniorPensionRate: 0,
    edliAdminRate: 0,
    wageCeiling: 0,
    seniorAge: 58
  });

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          enabled: editingItem.enabled !== undefined ? editingItem.enabled : true,
          effectiveDate: editingItem.effectiveDate || new Date().toISOString().split('T')[0],
          employeeRate: editingItem.employeeRate ?? 0,
          seniorEmployeeRate: editingItem.seniorEmployeeRate ?? editingItem.employeeRate ?? 0,
          employerRate: editingItem.employerRate ?? 0,
          seniorEmployerRate: editingItem.seniorEmployerRate ?? editingItem.employerRate ?? 0,
          pensionRate: editingItem.pensionRate ?? 0,
          seniorPensionRate: editingItem.seniorPensionRate ?? editingItem.pensionRate ?? 0,
          edliAdminRate: editingItem.edliAdminRate ?? 0,
          wageCeiling: editingItem.wageCeiling ?? 0,
          seniorAge: editingItem.seniorAge ?? 58
        });
      } else {
        setFormData({
          enabled: true,
          effectiveDate: new Date().toISOString().split('T')[0],
          employeeRate: 0,
          seniorEmployeeRate: 0,
          employerRate: 0,
          seniorEmployerRate: 0,
          pensionRate: 0,
          seniorPensionRate: 0,
          edliAdminRate: 0,
          wageCeiling: 0,
          seniorAge: 58
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: editingItem?.id || `rate-${Date.now()}`
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
            {/* Toggle: Enable PF Deduction */}
            <div className={styles.toggleRow}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => handleChange('enabled', e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleLabel}>Enable PF Deduction</span>
            </div>

            {/* Effective From */}
            <div className={styles.effectiveRow}>
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

            {/* Column Headers: Non-Senior & Senior */}
            <div className={styles.columnHeadersRow}>
              <div></div>
              <div className={styles.colHeader}>Non-Senior</div>
              <div className={styles.colHeader}>Senior</div>
            </div>

            {/* Employee PF Rate */}
            <div className={styles.rateRow}>
              <label className={styles.fieldLabel}>Employee PF Rate</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.employeeRate}
                  onChange={(e) => handleChange('employeeRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.seniorEmployeeRate}
                  onChange={(e) => handleChange('seniorEmployeeRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* Employer PF Rate */}
            <div className={styles.rateRow}>
              <label className={styles.fieldLabel}>Employer PF Rate</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.employerRate}
                  onChange={(e) => handleChange('employerRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.seniorEmployerRate}
                  onChange={(e) => handleChange('seniorEmployerRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* Pension Rate */}
            <div className={styles.rateRow}>
              <label className={styles.fieldLabel}>Pension Rate</label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.pensionRate}
                  onChange={(e) => handleChange('pensionRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.seniorPensionRate}
                  onChange={(e) => handleChange('seniorPensionRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* EDLI & Admin */}
            <div className={styles.singleInputRow}>
              <label className={styles.singleInputLabel}>
                EDLI &amp; Admin
                <span className={styles.infoIcon} title="EDLI and administrative charges percentage">
                  <Info size={14} />
                </span>
              </label>
              <div className={styles.inputWithUnit}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.edliAdminRate}
                  onChange={(e) => handleChange('edliAdminRate', Number(e.target.value))}
                />
                <span className={styles.unitText}>%</span>
              </div>
            </div>

            {/* Wage Ceiling */}
            <div className={styles.singleInputRow}>
              <label className={styles.singleInputLabel}>
                Wage Ceiling
                <span className={styles.infoIcon} title="Maximum wage limit for statutory calculations">
                  <Info size={14} />
                </span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="0"
                  className={styles.rateInput}
                  value={formData.wageCeiling}
                  onChange={(e) => handleChange('wageCeiling', Number(e.target.value))}
                />
                <span className={styles.hintText}>Enter &apos;0&apos; for no limit</span>
              </div>
            </div>

            {/* Age for Seniors */}
            <div className={styles.singleInputRow}>
              <label className={styles.singleInputLabel}>Age for Seniors</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={styles.rateInput}
                  value={formData.seniorAge}
                  onChange={(e) => handleChange('seniorAge', Number(e.target.value))}
                />
                <span className={styles.hintText}>Years</span>
              </div>
            </div>

            {/* Info Callout */}
            <div className={styles.infoCallout}>
              <div className={styles.calloutIcon}>
                <Info size={16} />
              </div>
              <p className={styles.calloutText}>
                Deduction and Contribution above ceiling can be enabled at employee level. Open employee record and go to &apos;Salary&apos; to configure.
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

export default PFRateModal;

