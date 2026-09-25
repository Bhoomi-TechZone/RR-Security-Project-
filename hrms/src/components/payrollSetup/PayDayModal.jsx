import React, { useState, useEffect, useRef } from 'react';
import { X, CalendarDays } from 'lucide-react';
import styles from './PayGroupModal.module.css';

function PayDayModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null
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
          payDayType: 'Fixed Day',
          fixedDay: 7,
          description: '',
          status: 'active'
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

  const validate = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Pay Day Name is required.';
    if (formData.payDayType === 'Fixed Day') {
      if (!formData.fixedDay || formData.fixedDay < 1 || formData.fixedDay > 31) {
        newErrors.fixedDay = 'Fixed Day must be between 1 and 31.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="payday-form-title">
      <div ref={modalRef} tabIndex="-1" className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}><CalendarDays size={20} /></div>
            <div>
              <h2 id="payday-form-title" className={styles.title}>
                {isEdit ? 'Edit Pay Day Configuration' : 'Add Pay Day Rule'}
              </h2>
              <p className={styles.subtitle}>Define monthly salary disbursement timing rules</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Pay Day Rule Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. 7th of Every Month"
              value={formData.name || ''}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Pay Day Type <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={formData.payDayType || 'Fixed Day'}
                onChange={(e) => setFormData({ ...formData, payDayType: e.target.value })}
              >
                <option value="Fixed Day">Fixed Day of Month</option>
                <option value="Last Working Day">Last Working Day</option>
                <option value="Last Calendar Day">Last Calendar Day</option>
              </select>
            </div>

            {formData.payDayType === 'Fixed Day' && (
              <div className={styles.field}>
                <label className={styles.label}>Fixed Day (1–31) <span className={styles.required}>*</span></label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className={`${styles.input} ${errors.fixedDay ? styles.inputError : ''}`}
                  placeholder="e.g. 7"
                  value={formData.fixedDay ?? 7}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFormData({ ...formData, fixedDay: isNaN(val) ? '' : val });
                    if (errors.fixedDay) setErrors({ ...errors, fixedDay: null });
                  }}
                />
                {errors.fixedDay && <span className={styles.errorText}>{errors.fixedDay}</span>}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description / Holiday Adjustment Rule</label>
            <textarea
              className={styles.textarea}
              rows="3"
              placeholder="Specify fallback rules if the pay day falls on a Sunday or National Holiday..."
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
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>{isEdit ? 'Save Changes' : 'Create Pay Day Rule'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default PayDayModal;
