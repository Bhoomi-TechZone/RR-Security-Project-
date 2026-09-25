import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './CompanyForm.module.css';

/**
 * CompanyForm Modal component
 * Handles both Add and Edit actions depending on company prop.
 */
function CompanyForm({
  isOpen,
  onClose,
  onSubmit,
  company = null // if present, we are in EDIT mode
}) {
  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    contactPerson: '',
    contactNumber: '',
    contractStartDate: '',
    contractEndDate: '',
    status: 'active',
    address: '',
    typeOfService: '',
    document: null,
    overtimeType: '',
    overtimeBasis: '',
    compliance: {
      pf: null,
      esi: null,
      lwf: null,
      tds: null,
      // bonus: null,
      // gratuity: null
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        gstin: company.gstin || '',
        contactPerson: company.contactPerson || '',
        contactNumber: company.contactNumber || '',
        contractStartDate: company.contractStartDate || '',
        contractEndDate: company.contractEndDate || '',
        status: company.status || 'active',
        address: company.address || '',
        typeOfService: company.typeOfService || '',
        document: company.document || null,
        overtimeType: company.overtimeType || company.compliance?.overtimeType || '',
        overtimeBasis: company.overtimeBasis || company.compliance?.overtimeBasis || '',
        compliance: {
          pf: company.compliance?.pf ?? null,
          esi: company.compliance?.esi ?? null,
          lwf: company.compliance?.lwf ?? null,
          tds: company.compliance?.tds ?? null,
          // bonus: company.compliance?.bonus ?? null,
          // gratuity: company.compliance?.gratuity ?? null
        }
      });
    } else {
      setFormData({
        name: '',
        gstin: '',
        contactPerson: '',
        contactNumber: '',
        contractStartDate: '',
        contractEndDate: '',
        status: 'active',
        address: '',
        typeOfService: '',
        document: null,
        overtimeType: '',
        overtimeBasis: '',
        compliance: {
          pf: null,
          esi: null,
          lwf: null,
          tds: null,
          // bonus: null,
          // gratuity: null
        }
      });
    }
    setErrors({});
  }, [company, isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, document: file }));
      if (errors.document) {
        setErrors((prev) => ({ ...prev, document: '' }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const initials = formData.name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

    let docPayload = null;
    if (formData.document) {
      if (typeof formData.document === 'string') {
        docPayload = formData.document;
      } else if (typeof formData.document === 'object') {
        docPayload = formData.document.name || null;
      }
    }

    const dataToSubmit = {
      ...formData,
      document: docPayload,
      initials,
      gstin: (formData.gstin || '').toUpperCase()
    };

    onSubmit(dataToSubmit);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {company ? 'Edit Client' : 'Add Client'}
            </h2>
            <p className={styles.subtitle}>
              {company 
                ? 'Modify the details of this client company.' 
                : 'Add a new client company to your organization.'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close form">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {/* Company Name */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Client Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                placeholder="Enter client name"
                value={formData.name || ''}
                onChange={handleChange}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            {/* GSTIN */}
            <div className={styles.formGroup}>
              <label htmlFor="gstin" className={styles.label}>GSTIN</label>
              <input
                id="gstin"
                name="gstin"
                type="text"
                className={`${styles.input} ${errors.gstin ? styles.inputError : ''}`}
                placeholder="Enter GSTIN (e.g. 09ABCDE1234F1Z5)"
                value={formData.gstin || ''}
                onChange={handleChange}
              />
              {errors.gstin && <span className={styles.errorText}>{errors.gstin}</span>}
            </div>

            {/* Contact Person */}
            <div className={styles.formGroup}>
              <label htmlFor="contactPerson" className={styles.label}>Contact Person</label>
              <input
                id="contactPerson"
                name="contactPerson"
                type="text"
                className={styles.input}
                placeholder="Enter contact person name"
                value={formData.contactPerson || ''}
                onChange={handleChange}
              />
            </div>

            {/* Contact Number */}
            <div className={styles.formGroup}>
              <label htmlFor="contactNumber" className={styles.label}>Contact Number</label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="text"
                className={styles.input}
                placeholder="Enter contact number"
                value={formData.contactNumber || ''}
                onChange={handleChange}
              />
            </div>

            {/* Contract Start Date */}
            <div className={styles.formGroup}>
              <label htmlFor="contractStartDate" className={styles.label}>
                Contract Start Date
              </label>
              <input
                id="contractStartDate"
                name="contractStartDate"
                type="date"
                className={`${styles.input} ${errors.contractStartDate ? styles.inputError : ''}`}
                value={formData.contractStartDate || ''}
                onChange={handleChange}
              />
              {errors.contractStartDate && (
                <span className={styles.errorText}>{errors.contractStartDate}</span>
              )}
            </div>

            {/* Contract End Date */}
            <div className={styles.formGroup}>
              <label htmlFor="contractEndDate" className={styles.label}>
                Contract End Date
              </label>
              <input
                id="contractEndDate"
                name="contractEndDate"
                type="date"
                className={`${styles.input} ${errors.contractEndDate ? styles.inputError : ''}`}
                value={formData.contractEndDate || ''}
                onChange={handleChange}
              />
              {errors.contractEndDate && (
                <span className={styles.errorText}>{errors.contractEndDate}</span>
              )}
            </div>

            {/* Status */}
            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>Status</label>
              <div className={styles.selectWrapper}>
                <select
                  id="status"
                  name="status"
                  className={styles.select}
                  value={formData.status || 'active'}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Type of Service */}
            <div className={styles.formGroup}>
              <label htmlFor="typeOfService" className={styles.label}>
                Type of Service
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="typeOfService"
                  name="typeOfService"
                  className={styles.select}
                  value={formData.typeOfService}
                  onChange={handleChange}
                >
                  <option value="">Select service type</option>
                  <option value="SecurityGuard">Security Guard</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="UnarmedSecurity">Unarmed Security</option>
                  <option value="ArmedSecurity">Armed Security</option>
                  <option value="Finance">Finance</option>
                  <option value="Retail">Retail</option>
                  <option value="Construction">Construction</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.typeOfService && (
                <span className={styles.errorText}>{errors.typeOfService}</span>
              )}
            </div>

            {/* Upload Document */}
            <div className={styles.formGroup}>
              <label htmlFor="document" className={styles.label}>
                Upload Document
              </label>
              <input
                id="document"
                name="document"
                type="file"
                className={styles.fileInput}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {formData.document && (
                <span className={styles.fileName}>{formData.document.name}</span>
              )}
              {errors.document && <span className={styles.errorText}>{errors.document}</span>}
            </div>

            {/* Address */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="address" className={styles.label}>
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows="2"
                className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                placeholder="Enter company address"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <span className={styles.errorText}>{errors.address}</span>}
            </div>
          </div>

          {/* Compliance Checkboxes Section */}
          <div className={styles.complianceContainer}>
            <div className={styles.complianceGrid}>
              {/* PF */}
              <div className={styles.complianceItem}>
                <div className={styles.complianceLabel}>PF (Provident Fund)</div>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="pf-yes"
                      className={styles.checkbox}
                      checked={formData.compliance?.pf === true}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), pf: true }
                          }));
                        }
                      }}
                    />
                    <span>YES</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="pf-no"
                      className={styles.checkbox}
                      checked={formData.compliance?.pf === false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), pf: false }
                          }));
                        }
                      }}
                    />
                    <span>NO</span>
                  </label>
                </div>
              </div>

              {/* ESI */}
              <div className={styles.complianceItem}>
                <div className={styles.complianceLabel}>ESI (Employee State Insurance)</div>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="esi-yes"
                      className={styles.checkbox}
                      checked={formData.compliance?.esi === true}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), esi: true }
                          }));
                        }
                      }}
                    />
                    <span>YES</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="esi-no"
                      className={styles.checkbox}
                      checked={formData.compliance?.esi === false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), esi: false }
                          }));
                        }
                      }}
                    />
                    <span>NO</span>
                  </label>
                </div>
              </div>

              {/* LWF */}
              <div className={styles.complianceItem}>
                <div className={styles.complianceLabel}>LWF (Labour Welfare Fund)</div>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="lwf-yes"
                      className={styles.checkbox}
                      checked={formData.compliance?.lwf === true}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), lwf: true }
                          }));
                        }
                      }}
                    />
                    <span>YES</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="lwf-no"
                      className={styles.checkbox}
                      checked={formData.compliance?.lwf === false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), lwf: false }
                          }));
                        }
                      }}
                    />
                    <span>NO</span>
                  </label>
                </div>
              </div>

              {/* TDS */}
              <div className={styles.complianceItem}>
                <div className={styles.complianceLabel}>TDS (Tax Deducted at Source)</div>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="tds-yes"
                      className={styles.checkbox}
                      checked={formData.compliance?.tds === true}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), tds: true }
                          }));
                        }
                      }}
                    />
                    <span>YES</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="tds-no"
                      className={styles.checkbox}
                      checked={formData.compliance?.tds === false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), tds: false }
                          }));
                        }
                      }}
                    />
                    <span>NO</span>
                  </label>
                </div>
              </div>

              {/* BONUS - Commented out */}
              {/*
              <div className={styles.complianceItem}>
                <div className={styles.complianceLabel}>BONUS</div>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="bonus-yes"
                      className={styles.checkbox}
                      checked={formData.compliance?.bonus === true}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), bonus: true }
                          }));
                        }
                      }}
                    />
                    <span>YES</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="bonus-no"
                      className={styles.checkbox}
                      checked={formData.compliance?.bonus === false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), bonus: false }
                          }));
                        }
                      }}
                    />
                    <span>NO</span>
                  </label>
                </div>
              </div>
              */}

              {/* GRATUITY - Commented out */}
              {/*
              <div className={styles.complianceItem}>
                <div className={styles.complianceLabel}>GRATUITY</div>
                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="gratuity-yes"
                      className={styles.checkbox}
                      checked={formData.compliance?.gratuity === true}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), gratuity: true }
                          }));
                        }
                      }}
                    />
                    <span>YES</span>
                  </label>
                  <label className={styles.checkboxOption}>
                    <input
                      type="checkbox"
                      name="gratuity-no"
                      className={styles.checkbox}
                      checked={formData.compliance?.gratuity === false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            compliance: { ...(prev.compliance || {}), gratuity: false }
                          }));
                        }
                      }}
                    />
                    <span>NO</span>
                  </label>
                </div>
              </div>
              */}

              {/* Overtime (Single / Double) */}
              <div className={styles.formGroup}>
                <label htmlFor="overtimeType" className={styles.label}>
                  Overtime
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="overtimeType"
                    name="overtimeType"
                    className={styles.select}
                    value={formData.overtimeType || ''}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                  </select>
                </div>
              </div>

              {/* Overtime (Hours / Day / Both) */}
              <div className={styles.formGroup}>
                <label htmlFor="overtimeBasis" className={styles.label}>
                  Overtime Type
                </label>
                <div className={styles.selectWrapper}>
                  <select
                    id="overtimeBasis"
                    name="overtimeBasis"
                    className={styles.select}
                    value={formData.overtimeBasis || ''}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Hours">Hours</option>
                    <option value="Day">Day</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              {company ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyForm;
