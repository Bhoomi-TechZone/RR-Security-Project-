import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './PTRateModal.module.css';

export const ALL_INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

const MONTHS = [
  'All Months',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const GENDERS = [
  'All Genders',
  'Male',
  'Female',
  'Other'
];

function PTRateModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem = null,
  selectedState = ''
}) {
  const [formData, setFormData] = useState({
    state: '',
    startDate: new Date().toISOString().split('T')[0],
    salaryAbove: 0,
    month: 'All Months',
    gender: 'All Genders',
    taxAmount: 0
  });

  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          state: editingItem.state || selectedState || 'Bihar',
          startDate: editingItem.startDate || editingItem.effectiveFrom || new Date().toISOString().split('T')[0],
          salaryAbove: editingItem.salaryAbove ?? editingItem.minSalary ?? 0,
          month: editingItem.month || 'All Months',
          gender: editingItem.gender || 'All Genders',
          taxAmount: editingItem.taxAmount ?? 0
        });
      } else {
        setFormData({
          state: selectedState && selectedState !== '- Select State -' ? selectedState : '',
          startDate: new Date().toISOString().split('T')[0],
          salaryAbove: 0,
          month: 'All Months',
          gender: 'All Genders',
          taxAmount: 0
        });
      }
    }
  }, [isOpen, editingItem, selectedState]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.state) {
      alert('Please select a state');
      return;
    }
    onSubmit({
      ...formData,
      id: editingItem?.id || `pt-${Date.now()}`
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
        {/* Top bar with cleanly positioned Close Icon (no overlap with dropdown) */}
        <div className={styles.modalTopBar}>
          <button
            type="button"
            className={styles.closeIconBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* State */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                State <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={styles.select}
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  required
                >
                  <option value="">- Select State -</option>
                  {ALL_INDIAN_STATES_AND_UTS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Start Date <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Salary Above */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Salary Above <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  className={`${styles.input} ${styles.numberInput}`}
                  value={formData.salaryAbove}
                  onChange={(e) => handleChange('salaryAbove', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Month */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Month <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={styles.select}
                  value={formData.month}
                  onChange={(e) => handleChange('month', e.target.value)}
                  required
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gender */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Gender <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <select
                  className={styles.select}
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  required
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tax Amount */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Tax Amount <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  min="0"
                  className={`${styles.input} ${styles.numberInput}`}
                  value={formData.taxAmount}
                  onChange={(e) => handleChange('taxAmount', Number(e.target.value))}
                  required
                />
              </div>
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PTRateModal;
