import React, { useState } from 'react';
import { Building2, X, Plus, CheckCircle2, Shield, MapPin, FileText, Phone, Mail } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import styles from './AddCompanyProfileModal.module.css';

function AddCompanyProfileModal({ isOpen, onClose, onSuccess }) {
  const { addCompanyProfile } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    industry: 'Security & Facility Management',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    gstin: '',
    pan: '',
    tan: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const generatedCode = val
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .substring(0, 4)
      .toUpperCase();

    setFormData(prev => ({
      ...prev,
      name: val,
      code: prev.code ? prev.code : generatedCode
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company Name is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await addCompanyProfile(formData);
      setIsSubmitting(false);
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to create company profile.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconWrap}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Setup New Company Profile</h2>
              <p className={styles.subtitle}>
                Create an isolated company workspace with separate workforce and records.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.body}>
            {error && (
              <div className={styles.infoBanner} style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <div className={styles.infoBanner}>
              <Shield size={16} />
              <span>
                All employee records, attendance, clients, shifts, and payroll will be strictly isolated to this company profile.
              </span>
            </div>

            {/* Basic Info */}
            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionTitle}>
                <Building2 size={14} /> Basic Company Information
              </h3>
              <div className={styles.grid2}>
                <div className={styles.formField}>
                  <label className={styles.label}>Company Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Apex Facility Solutions"
                    className={styles.input}
                    required
                    autoFocus
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Company Code / Prefix *</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. AFS"
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
                <div className={styles.fullWidth}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Industry Category</label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className={styles.select}
                    >
                      <option value="Security & Facility Management">Security & Facility Management</option>
                      <option value="Security & Guarding Services">Security & Guarding Services</option>
                      <option value="Facility Management & Housekeeping">Facility Management & Housekeeping</option>
                      <option value="Manpower & Workforce Staffing">Manpower & Workforce Staffing</option>
                      <option value="Corporate Services">Corporate Services</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionTitle}>
                <Mail size={14} /> Contact Details
              </h3>
              <div className={styles.grid2}>
                <div className={styles.formField}>
                  <label className={styles.label}>Official Company Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@company.com"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Primary Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionTitle}>
                <MapPin size={14} /> Location & Address
              </h3>
              <div className={styles.grid3}>
                <div className={styles.fullWidth}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Registered Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street, Industrial Area / Sector"
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>PIN Code</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="PIN Code"
                    maxLength="6"
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Statutory Details */}
            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionTitle}>
                <FileText size={14} /> Statutory Identifiers
              </h3>
              <div className={styles.grid3}>
                <div className={styles.formField}>
                  <label className={styles.label}>GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="29ABCDE1234F1Z5"
                    maxLength="15"
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>PAN</label>
                  <input
                    type="text"
                    name="pan"
                    value={formData.pan}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    maxLength="10"
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>TAN</label>
                  <input
                    type="text"
                    name="tan"
                    value={formData.tan}
                    onChange={handleChange}
                    placeholder="BLRA12345D"
                    maxLength="10"
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              <Plus size={16} />
              {isSubmitting ? 'Creating Profile...' : 'Save & Set as Active Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCompanyProfileModal;
