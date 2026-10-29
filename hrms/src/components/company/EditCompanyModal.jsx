import React, { useState, useEffect } from 'react';
import { Building2, X, Save, Shield, MapPin, FileText, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import styles from './AddCompanyProfileModal.module.css';

function EditCompanyModal({ isOpen, onClose, company, onSuccess }) {
  const { updateCompanyProfile } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    industry: 'Security & Facility Management',
    adminEmail: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    gstin: '',
    pan: '',
    tan: '',
    employerPfCode: '',
    employerEsiCode: '',
    status: 'Active'
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        code: company.code || '',
        industry: company.industry || 'Security & Facility Management',
        adminEmail: company.adminEmail || company.email || '',
        email: company.email || '',
        phone: company.phone || '',
        alternatePhone: company.alternatePhone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        pinCode: company.pinCode || '',
        gstin: company.gstin || '',
        pan: company.pan || '',
        tan: company.tan || '',
        employerPfCode: company.employerPfCode || '',
        employerEsiCode: company.employerEsiCode || '',
        status: company.status || 'Active'
      });
      setError('');
    }
  }, [company]);

  if (!isOpen || !company) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const companyId = company.companyId || company.id;
      const updated = await updateCompanyProfile(companyId, formData);
      setIsSubmitting(false);
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to update company profile.');
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
              <h2 className={styles.title}>Edit Company Profile</h2>
              <p className={styles.subtitle}>
                Update details for {company.name} ({company.companyId || company.id})
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
              <div className={styles.errorBanner}>
                <span>{error}</span>
              </div>
            )}

            {/* General Information */}
            <div className={styles.sectionHeader}>
              <Shield size={16} />
              <span>General Information</span>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Company Name <span className={styles.req}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. Acme Security Services"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Company Code <span className={styles.req}>*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. ACME"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Industry / Domain</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. Security & Facility Management"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className={styles.sectionHeader}>
              <Phone size={16} />
              <span>Contact & Communication</span>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Admin Login Email</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="admin@company.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Official Company Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="official@company.com"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Primary Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            {/* Address */}
            <div className={styles.sectionHeader}>
              <MapPin size={16} />
              <span>Registered Office Address</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={styles.input}
                placeholder="Suite, Building, Street"
              />
            </div>

            <div className={styles.rowThree}>
              <div className={styles.formGroup}>
                <label className={styles.label}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="City"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="State"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>PIN Code</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Postal Code"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Statutory Compliance IDs */}
            <div className={styles.sectionHeader}>
              <FileText size={16} />
              <span>Statutory Compliance Numbers</span>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>GSTIN Number</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="09ABCDE1234F1Z5"
                  maxLength={15}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>PAN Card Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Employer PF Code</label>
                <input
                  type="text"
                  name="employerPfCode"
                  value={formData.employerPfCode}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. DLCPM0012345000"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Employer ESI Code</label>
                <input
                  type="text"
                  name="employerEsiCode"
                  value={formData.employerEsiCode}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. 31000123450000101"
                />
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCompanyModal;
