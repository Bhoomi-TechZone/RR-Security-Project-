import React, { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
import styles from './PayGroupModal.module.css';

function PayCycleModal({
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
          frequency: 'Monthly',
          cycleStartDay: 1,
          cycleEndDay: 31,
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
    if (!formData.name?.trim()) newErrors.name = 'Pay Cycle Name is required.';
    if (!formData.frequency) newErrors.frequency = 'Frequency is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cycle-form-title">
      <div ref={modalRef} tabIndex="-1" className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}><Clock size={20} /></div>
            <div>
              <h2 id="cycle-form-title" className={styles.title}>
                {isEdit ? 'Edit Pay Cycle' : 'Add Pay Cycle'}
              </h2>
              <p className={styles.subtitle}>Configure attendance and payroll period cutoff bounds</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Pay Cycle Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. Standard Monthly (1st to 31st)"
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
              <label className={styles.label}>Frequency <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={formData.frequency || 'Monthly'}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Cycle Bounds (Start & End)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className={styles.input}
                  placeholder="Start Day"
                  value={formData.cycleStartDay ?? 1}
                  onChange={(e) => setFormData({ ...formData, cycleStartDay: parseInt(e.target.value, 10) || 1 })}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>to</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className={styles.input}
                  placeholder="End Day"
                  value={formData.cycleEndDay ?? 31}
                  onChange={(e) => setFormData({ ...formData, cycleEndDay: parseInt(e.target.value, 10) || 31 })}
                />
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              rows="3"
              placeholder="Describe cycle cutoff rules and shift verification window..."
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
            <button type="submit" className={styles.submitBtn}>{isEdit ? 'Save Changes' : 'Create Cycle'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default PayCycleModal;
