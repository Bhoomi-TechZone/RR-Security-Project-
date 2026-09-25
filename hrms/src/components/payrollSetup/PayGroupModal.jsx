import React, { useState, useEffect, useRef } from 'react';
import { X, Check, DollarSign } from 'lucide-react';
import styles from './PayGroupModal.module.css';

/**
 * PayGroupModal Component
 * Add / Edit Pay Group with multi-select Salary Components selection.
 */
function PayGroupModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null,
  schedules = [],
  cycles = [],
  payDays = [],
  calculationMethods = [],
  salaryComponents = []
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  const isEdit = !!editingItem;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editingItem) {
        setFormData({ ...editingItem });
      } else {
        setFormData({
          name: '',
          code: '',
          paySchedule: schedules.length > 0 ? schedules[0].name : 'Monthly Payroll',
          payCycle: cycles.length > 0 ? cycles[0].name : 'Standard Monthly (1st to End of Month)',
          payDay: payDays.length > 0 ? payDays[0].name : '7th of Every Month',
          salaryCalculationMethod: calculationMethods.length > 0 ? calculationMethods[0].name : 'Calendar Days Basis',
          salaryComponentIds: ['sal-1', 'sal-2', 'sal-3', 'sal-4', 'sal-6'],
          description: '',
          status: 'active'
        });
      }
    }
  }, [isOpen, editingItem, schedules, cycles, payDays, calculationMethods]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = 'Pay Group Name is required.';
    if (!formData.code?.trim()) newErrors.code = 'Pay Group Code is required.';
    if (!formData.paySchedule) newErrors.paySchedule = 'Pay Schedule is required.';
    if (!formData.payCycle) newErrors.payCycle = 'Pay Cycle is required.';
    if (!formData.payDay) newErrors.payDay = 'Pay Day is required.';
    if (!formData.salaryCalculationMethod) newErrors.salaryCalculationMethod = 'Salary Calculation Method is required.';

    if (!formData.salaryComponentIds || formData.salaryComponentIds.length === 0) {
      newErrors.salaryComponentIds = 'Select at least one Salary Component for this Pay Group.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleComponentToggle = (compId) => {
    const current = formData.salaryComponentIds || [];
    if (current.includes(compId)) {
      setFormData({
        ...formData,
        salaryComponentIds: current.filter(id => id !== compId)
      });
    } else {
      setFormData({
        ...formData,
        salaryComponentIds: [...current, compId]
      });
    }
    if (errors.salaryComponentIds) {
      setErrors({ ...errors, salaryComponentIds: null });
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="paygroup-form-title">
      <div 
        ref={modalRef}
        tabIndex="-1"
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}>
              <DollarSign size={20} />
            </div>
            <div>
              <h2 id="paygroup-form-title" className={styles.title}>
                {isEdit ? 'Edit Pay Group' : 'Create New Pay Group'}
              </h2>
              <p className={styles.subtitle}>Configure pay rules, schedule mappings, and salary components</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                Pay Group Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                placeholder="e.g. Monthly Security Staff"
                value={formData.name || ''}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Pay Group Code <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`${styles.input} ${errors.code ? styles.inputError : ''}`}
                placeholder="e.g. PG-SEC-01"
                value={formData.code || ''}
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value.toUpperCase() });
                  if (errors.code) setErrors({ ...errors, code: null });
                }}
              />
              {errors.code && <span className={styles.errorText}>{errors.code}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                Pay Schedule <span className={styles.required}>*</span>
              </label>
              <select
                className={`${styles.select} ${errors.paySchedule ? styles.inputError : ''}`}
                value={formData.paySchedule || ''}
                onChange={(e) => {
                  setFormData({ ...formData, paySchedule: e.target.value });
                  if (errors.paySchedule) setErrors({ ...errors, paySchedule: null });
                }}
              >
                <option value="">Select Pay Schedule</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
              {errors.paySchedule && <span className={styles.errorText}>{errors.paySchedule}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Pay Cycle <span className={styles.required}>*</span>
              </label>
              <select
                className={`${styles.select} ${errors.payCycle ? styles.inputError : ''}`}
                value={formData.payCycle || ''}
                onChange={(e) => {
                  setFormData({ ...formData, payCycle: e.target.value });
                  if (errors.payCycle) setErrors({ ...errors, payCycle: null });
                }}
              >
                <option value="">Select Pay Cycle</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.frequency})</option>
                ))}
              </select>
              {errors.payCycle && <span className={styles.errorText}>{errors.payCycle}</span>}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>
                Pay Day <span className={styles.required}>*</span>
              </label>
              <select
                className={`${styles.select} ${errors.payDay ? styles.inputError : ''}`}
                value={formData.payDay || ''}
                onChange={(e) => {
                  setFormData({ ...formData, payDay: e.target.value });
                  if (errors.payDay) setErrors({ ...errors, payDay: null });
                }}
              >
                <option value="">Select Pay Day Rule</option>
                {payDays.map((pd) => (
                  <option key={pd.id} value={pd.name}>{pd.name}</option>
                ))}
              </select>
              {errors.payDay && <span className={styles.errorText}>{errors.payDay}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Salary Calculation Method <span className={styles.required}>*</span>
              </label>
              <select
                className={`${styles.select} ${errors.salaryCalculationMethod ? styles.inputError : ''}`}
                value={formData.salaryCalculationMethod || ''}
                onChange={(e) => {
                  setFormData({ ...formData, salaryCalculationMethod: e.target.value });
                  if (errors.salaryCalculationMethod) setErrors({ ...errors, salaryCalculationMethod: null });
                }}
              >
                <option value="">Select Calculation Method</option>
                {calculationMethods.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              {errors.salaryCalculationMethod && <span className={styles.errorText}>{errors.salaryCalculationMethod}</span>}
            </div>
          </div>

          {/* SALARY COMPONENTS MULTI-SELECT CHECKLIST */}
          <div className={styles.field}>
            <div className={styles.componentsHeader}>
              <label className={styles.label}>
                Applicable Salary Components <span className={styles.required}>*</span>
              </label>
              <span className={styles.compSelectedCount}>
                {(formData.salaryComponentIds || []).length} of {salaryComponents.length} selected
              </span>
            </div>
            <p className={styles.fieldHelper}>
              Select earnings and deductions from Masters to include in this Pay Group's salary structure:
            </p>

            <div className={styles.componentsList}>
              {salaryComponents.map((comp) => {
                const isSelected = (formData.salaryComponentIds || []).includes(comp.id);
                return (
                  <label 
                    key={comp.id} 
                    className={`${styles.compItem} ${isSelected ? styles.compItemSelected : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.compCheckbox}
                      checked={isSelected}
                      onChange={() => handleComponentToggle(comp.id)}
                    />
                    <div className={styles.compInfo}>
                      <div className={styles.compMain}>
                        <span className={styles.compName}>{comp.name}</span>
                        <span className={styles.compCode}>({comp.code})</span>
                      </div>
                      <div className={styles.compBadges}>
                        <span className={`${styles.typeBadge} ${comp.type === 'earning' ? styles.earningBadge : styles.deductionBadge}`}>
                          {comp.type === 'earning' ? '+ Earning' : '- Deduction'}
                        </span>
                        <span className={styles.taxBadge}>
                          {comp.taxable === 'taxable' ? 'Taxable' : 'Exempt'}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.salaryComponentIds && <span className={styles.errorText}>{errors.salaryComponentIds}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              rows="2"
              placeholder="Operational notes, covered designations, or client deployment specifics..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={() => setFormData({ ...formData, status: 'active' })}
                />
                <span>Active</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={() => setFormData({ ...formData, status: 'inactive' })}
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>

          <footer className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              {isEdit ? 'Update Pay Group' : 'Save Pay Group'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default PayGroupModal;
