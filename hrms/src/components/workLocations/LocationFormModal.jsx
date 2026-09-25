import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import FormInput from '../common/FormInput';
import styles from './LocationFormModal.module.css';

/**
 * LocationFormModal Component
 * Modal for adding or editing work locations
 */
function LocationFormModal({ isOpen, onClose, onSubmit, editingLocation = null }) {
  const [formData, setFormData] = useState({
    locationName: '',
    locationType: 'branch',
    address: '',
    state: '',
    city: '',
    pinCode: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  const isEdit = !!editingLocation;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editingLocation) {
        setFormData({ ...editingLocation });
      } else {
        setFormData({
          locationName: '',
          locationType: 'branch',
          address: '',
          state: '',
          city: '',
          pinCode: '',
          status: 'active'
        });
      }
    }
  }, [isOpen, editingLocation]);

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

    if (!formData.locationName?.trim()) {
      newErrors.locationName = 'Location name is required.';
    }

    if (!formData.locationType) {
      newErrors.locationType = 'Location type is required.';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required.';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required.';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required.';
    }

    if (!formData.pinCode?.trim()) {
      newErrors.pinCode = 'PIN code is required.';
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'Invalid PIN code format (6 digits required).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 className={styles.title} id="location-form-title">
            {isEdit ? 'Edit Work Location' : 'Add Work Location'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formBody}>
            <FormInput
              id="locationName"
              name="locationName"
              label="Location Name *"
              type="text"
              placeholder="e.g. Noida Branch"
              value={formData.locationName}
              onChange={handleChange}
              error={errors.locationName}
            />

            <div className={styles.fieldGroup}>
              <label htmlFor="locationType" className={styles.label}>
                Location Type *
              </label>
              <select
                id="locationType"
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                className={`${styles.select} ${errors.locationType ? styles.selectError : ''}`}
              >
                <option value="head-office">Head Office</option>
                <option value="branch">Branch</option>
                <option value="office">Office</option>
              </select>
              {errors.locationType && (
                <span className={styles.errorText}>{errors.locationType}</span>
              )}
            </div>

            <FormInput
              id="address"
              name="address"
              label="Address *"
              type="text"
              placeholder="e.g. Sector 62, Noida"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
            />

            <div className={styles.formRow}>
              <FormInput
                id="state"
                name="state"
                label="State *"
                type="text"
                placeholder="Select state"
                value={formData.state}
                onChange={handleChange}
                error={errors.state}
              />

              <FormInput
                id="city"
                name="city"
                label="City *"
                type="text"
                placeholder="Select city"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
              />
            </div>

            <div className={styles.formRow}>
              <FormInput
                id="pinCode"
                name="pinCode"
                label="PIN Code *"
                type="text"
                placeholder="e.g. 201301"
                value={formData.pinCode}
                onChange={handleChange}
                error={errors.pinCode}
                maxLength="6"
              />

              <div className={styles.fieldGroup}>
                <label htmlFor="status" className={styles.label}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
            >
              {isEdit ? 'Update Location' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LocationFormModal;
