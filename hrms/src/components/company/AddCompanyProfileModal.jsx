import React, { useState } from 'react';
import {
  Building2, X, Plus, CheckCircle2, Shield, MapPin, FileText,
  Phone, Mail, KeyRound, Lock, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import styles from './AddCompanyProfileModal.module.css';

function AddCompanyProfileModal({ isOpen, onClose, onSuccess }) {
  const { addCompanyProfile } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    industry: 'Security & Facility Management',
    adminEmail: '',
    adminPassword: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    gstin: '',
    pan: '',
    tan: '',
    employerPfCode: '',
    employerEsiCode: ''
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

    setFormData(prev => {
      const currentCode = prev.code || generatedCode;
      return {
        ...prev,
        name: val,
        code: currentCode,
        adminEmail: prev.adminEmail ? prev.adminEmail : (currentCode ? `admin@${currentCode.toLowerCase()}security.com` : '')
      };
    });
    if (error) setError('');
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, adminPassword: pass }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Company Name is required.');
      return;
    }
    if (!formData.adminEmail.trim()) {
      setError('Admin Email is required for company login access.');
      return;
    }
    if (!formData.adminPassword.trim()) {
      setError('Admin Password is required for company login access.');
      return;
    }
    if (formData.adminPassword.trim().length < 6) {
      setError('Admin Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        email: formData.email.trim() || formData.adminEmail.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        password: formData.adminPassword.trim(),
        adminPassword: formData.adminPassword.trim()
      };

      const created = await addCompanyProfile(payload);
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
                Create an isolated company workspace with separate admin login credentials and records.
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

            {/* Admin Login Credentials Section */}
            <div className={styles.sectionGroup}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                  <KeyRound size={14} color="#2563eb" /> Admin Login Credentials
                </h3>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <Sparkles size={13} />
                  <span>Generate Password</span>
                </button>
              </div>

              <div
                style={{
                  padding: '9px 12px',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  fontSize: '12px',
                  color: '#1e40af',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Lock size={14} style={{ flexShrink: 0 }} />
                <span>
                  The company administrator can immediately log in to the HRMS portal using this email and password.
                </span>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formField}>
                  <label className={styles.label}>Admin Email (Login Username) *</label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    placeholder="e.g. admin@apexsecurity.com"
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Admin Login Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className={styles.input}
                      style={{ paddingRight: '40px' }}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
                  <label className={styles.label}>Official Company Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@company.com (defaults to admin email)"
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
                <div className={styles.formField}>
                  <label className={styles.label}>Employer PF Code</label>
                  <input
                    type="text"
                    name="employerPfCode"
                    value={formData.employerPfCode}
                    onChange={handleChange}
                    placeholder="DLCPM0012345000"
                    className={styles.input}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Employer ESI Code</label>
                  <input
                    type="text"
                    name="employerEsiCode"
                    value={formData.employerEsiCode}
                    onChange={handleChange}
                    placeholder="31000123450000101"
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
              {isSubmitting ? 'Creating Profile & Admin Account...' : 'Create Company & Admin Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCompanyProfileModal;
