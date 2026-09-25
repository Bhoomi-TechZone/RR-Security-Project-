import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar } from 'lucide-react';
import styles from './PayGroupModal.module.css';

function PayScheduleModal({
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
    if (!formData.name?.trim()) newErrors.name = 'Pay Schedule Name is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="schedule-form-title">
      <div ref={modalRef} tabIndex="-1" className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}><Calendar size={20} /></div>
            <div>
              <h2 id="schedule-form-title" className={styles.title}>
                {isEdit ? 'Edit Pay Schedule' : 'Add Pay Schedule'}
              </h2>
              <p className={styles.subtitle}>Define payroll frequency and timeline configurations</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Schedule Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="e.g. Monthly Payroll, Weekly Payroll"
              value={formData.name || ''}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              rows="3"
              placeholder="Describe schedule timing and target employee categories..."
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
            <button type="submit" className={styles.submitBtn}>{isEdit ? 'Save Changes' : 'Create Schedule'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default PayScheduleModal;
