import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Mail, Upload, X, FileText, 
  Calendar, UserCheck, Sparkles, Hash, SlidersHorizontal 
} from 'lucide-react';
import styles from './CompanySetup.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import FormInput from '../../components/common/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import Toast from '../../components/common/Toast';

import { 
  SEPARATOR_OPTIONS, 
  YEAR_FORMAT_OPTIONS, 
  MONTH_FORMAT_OPTIONS, 
  PADDING_OPTIONS, 
  RESET_FREQUENCY_OPTIONS, 
  generateSeriesPreview, 
  mockNumberSeriesList 
} from '../../data/numberSeriesData';

function CompanySetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;
  const activeSection = searchParams.get('section') || 'company-profile';

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Form state
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('novaspark_company_setup');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      companyName: 'NovaSpark HRMS Pvt Ltd',
      logo: null,
      address: '123, Tech Park, Electronic City',
      state: 'Karnataka',
      city: 'Bangalore',
      pinCode: '560100',
      primaryContact: '+91 9876543210',
      alternateContact: '+91 9876543211',
      email: 'admin@novaspark.com',
      pan: 'ABCDE1234F',
      tan: 'BLRA12345D',
      gstin: '29ABCDE1234F1Z5',
      dateFormat: 'DD/MM/YYYY',
    };
  });

  // Employee Code Series State
  const [empCodeSeries, setEmpCodeSeries] = useState(() => {
    const savedList = localStorage.getItem('novaspark_number_series');
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        const empSeries = parsed.find(s => s.id === 'employee-code');
        if (empSeries) return empSeries;
      } catch {
        // fallback
      }
    }
    return mockNumberSeriesList.find(s => s.id === 'employee-code') || {
      id: 'employee-code',
      name: 'Employee Code',
      code: 'SERIES-EMP',
      moduleTarget: 'Employee Management',
      prefix: 'EMP',
      startingNumber: 1,
      currentNumber: 1042,
      lastUsedNumber: 1041,
      padding: 5,
      separator: '-',
      yearFormat: 'None',
      monthFormat: 'None',
      resetFrequency: 'Never',
      description: 'Unique workforce identification number automatically assigned upon candidate onboard registration.',
      status: 'Active',
      lastUpdated: '2026-03-01 10:30 AM'
    };
  });

  // Logo preview state
  const [logoPreview, setLogoPreview] = useState(() => {
    return localStorage.getItem('novaspark_company_logo_preview') || null;
  });

  useEffect(() => {
    if (!isFromOrgSettings && activeSection) {
      const el = document.getElementById(activeSection);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [isFromOrgSettings, activeSection]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmpCodeSeriesChange = (field, value) => {
    setEmpCodeSeries(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const empCodePreview = useMemo(() => {
    return generateSeriesPreview(empCodeSeries);
  }, [empCodeSeries]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please upload a valid image file', 'error');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
      }

      setFormData(prev => ({ ...prev, logo: file.name }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        localStorage.setItem('novaspark_company_logo_preview', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
    localStorage.removeItem('novaspark_company_logo_preview');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Persist company setup data
    try {
      localStorage.setItem('novaspark_company_setup', JSON.stringify(formData));
      
      // Also persist and sync Employee Code Series to global number series
      const savedSeriesList = localStorage.getItem('novaspark_number_series');
      let allSeries = savedSeriesList ? JSON.parse(savedSeriesList) : mockNumberSeriesList;
      const updatedEmpSeries = {
        ...empCodeSeries,
        lastUpdated: new Date().toLocaleString()
      };
      allSeries = allSeries.map(s => s.id === 'employee-code' ? updatedEmpSeries : s);
      localStorage.setItem('novaspark_number_series', JSON.stringify(allSeries));
    } catch {
      // ignore
    }

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      showToast('✓ Company settings saved successfully', 'success');
    }, 600);
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hasSectionParam = Boolean(searchParams.get('section'));

  // Auto-scroll when section is specified in query param
  useEffect(() => {
    if (activeSection) {
      const timer = setTimeout(() => {
        const el = document.getElementById(activeSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSection]);

  const shouldShow = (sectionKey) => {
    if (!isFromOrgSettings && !hasSectionParam) return true;
    if (activeSection === sectionKey) return true;
    if (
      (sectionKey === 'regional-settings' || sectionKey === 'date-format') &&
      (activeSection === 'regional-settings' || activeSection === 'date-format')
    ) {
      return true;
    }
    return false;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Company Setup</span>
        </div>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>Company Setup</h1>
            <p className={styles.description}>
              Manage your company profile, employee code numbering, contact information, statutory details and regional settings.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          {/* 1. Company Profile Section */}
          {shouldShow('company-profile') && (
            <section id="company-profile" className={styles.card}>
              <div className={styles.cardHeader}>
                <Building2 size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Company Profile</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <div className={styles.fullWidth}>
                    <FormInput
                      id="companyName"
                      name="companyName"
                      label="Company Name *"
                      type="text"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={handleChange}
                      icon={Building2}
                      required
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 2. Logo Upload Section */}
          {shouldShow('logo') && (
            <section id="logo" className={styles.card}>
              <div className={styles.cardHeader}>
                <Upload size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Company Logo</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.logoSection}>
                  {logoPreview ? (
                    <div className={styles.logoPreview}>
                      <img src={logoPreview} alt="Company Logo" className={styles.logoImage} />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className={styles.logoRemove}
                        aria-label="Remove logo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.logoEmpty}>
                      <Upload size={24} className={styles.uploadIcon} />
                      <p className={styles.uploadText}>No logo uploaded</p>
                    </div>
                  )}

                  <div className={styles.logoActions}>
                    <input
                      type="file"
                      id="logoUpload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className={styles.fileInput}
                    />
                    <label htmlFor="logoUpload" className={styles.uploadBtn}>
                      <Upload size={16} />
                      {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                    </label>
                    <p className={styles.uploadHint}>
                      Supported formats: PNG, JPG, SVG (max 2MB)
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. Employee Code Number Series Section */}
          {shouldShow('employee-code') && (
            <section id="employee-code" className={styles.card}>
              <div className={styles.cardHeader}>
                <UserCheck size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Employee Code Configuration</h2>
              </div>
              <div className={styles.cardBody}>
                {/* Format Preview Banner */}
                <div className={styles.previewBanner}>
                  <div className={styles.previewInfo}>
                    <span className={styles.previewLabel}>Active Sample Preview</span>
                    <span className={styles.previewCode}>{empCodePreview}</span>
                  </div>
                  <div className={styles.previewBadge}>
                    <Sparkles size={14} />
                    <span>Auto-Sequenced Code</span>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div>
                    <label className={styles.label}>Prefix Code</label>
                    <FormInput
                      id="empPrefix"
                      name="prefix"
                      type="text"
                      placeholder="e.g. EMP"
                      value={empCodeSeries.prefix || ''}
                      onChange={(e) => handleEmpCodeSeriesChange('prefix', e.target.value.toUpperCase())}
                      icon={Hash}
                    />
                    <span className={styles.inputHelper}>Short code prepended to employee ID</span>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Separator</label>
                    <div className={styles.selectContainer}>
                      <SlidersHorizontal size={17} className={styles.selectIcon} />
                      <select
                        value={empCodeSeries.separator !== undefined ? empCodeSeries.separator : '-'}
                        onChange={(e) => handleEmpCodeSeriesChange('separator', e.target.value)}
                        className={styles.select}
                      >
                        {SEPARATOR_OPTIONS.map(opt => (
                          <option key={opt.label} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <span className={styles.inputHelper}>Character dividing prefix, date & digits</span>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Year Token</label>
                    <div className={styles.selectContainer}>
                      <Calendar size={17} className={styles.selectIcon} />
                      <select
                        value={empCodeSeries.yearFormat || 'None'}
                        onChange={(e) => handleEmpCodeSeriesChange('yearFormat', e.target.value)}
                        className={styles.select}
                      >
                        {YEAR_FORMAT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Month Token</label>
                    <div className={styles.selectContainer}>
                      <Calendar size={17} className={styles.selectIcon} />
                      <select
                        value={empCodeSeries.monthFormat || 'None'}
                        onChange={(e) => handleEmpCodeSeriesChange('monthFormat', e.target.value)}
                        className={styles.select}
                      >
                        {MONTH_FORMAT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Sequence Digits (Padding)</label>
                    <div className={styles.selectContainer}>
                      <Hash size={17} className={styles.selectIcon} />
                      <select
                        value={empCodeSeries.padding || 5}
                        onChange={(e) => handleEmpCodeSeriesChange('padding', Number(e.target.value))}
                        className={styles.select}
                      >
                        {PADDING_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <span className={styles.inputHelper}>Zero-padding digits for sequence count</span>
                  </div>

                  <div>
                    <label className={styles.label}>Starting Sequence Number</label>
                    <FormInput
                      id="startingNumber"
                      name="startingNumber"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={empCodeSeries.startingNumber || 1}
                      onChange={(e) => handleEmpCodeSeriesChange('startingNumber', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <span className={styles.inputHelper}>Initial sequence value</span>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Reset Frequency</label>
                    <div className={styles.selectContainer}>
                      <SlidersHorizontal size={17} className={styles.selectIcon} />
                      <select
                        value={empCodeSeries.resetFrequency || 'Never'}
                        onChange={(e) => handleEmpCodeSeriesChange('resetFrequency', e.target.value)}
                        className={styles.select}
                      >
                        {RESET_FREQUENCY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Series Status</label>
                    <div className={styles.selectContainer}>
                      <UserCheck size={17} className={styles.selectIcon} />
                      <select
                        value={empCodeSeries.status || 'Active'}
                        onChange={(e) => handleEmpCodeSeriesChange('status', e.target.value)}
                        className={styles.select}
                      >
                        <option value="Active">Active (Auto-Generating)</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. Address Section */}
          {shouldShow('address') && (
            <section id="address" className={styles.card}>
              <div className={styles.cardHeader}>
                <MapPin size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Address Details</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <div className={styles.fullWidth}>
                    <FormInput
                      id="address"
                      name="address"
                      label="Address *"
                      type="text"
                      placeholder="Enter complete address"
                      value={formData.address}
                      onChange={handleChange}
                      icon={MapPin}
                      required
                    />
                  </div>

                  <FormInput
                    id="state"
                    name="state"
                    label="State"
                    type="text"
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={handleChange}
                  />

                  <FormInput
                    id="city"
                    name="city"
                    label="City"
                    type="text"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleChange}
                  />

                  <FormInput
                    id="pinCode"
                    name="pinCode"
                    label="PIN Code"
                    type="text"
                    placeholder="Enter PIN code"
                    value={formData.pinCode}
                    onChange={handleChange}
                    maxLength="6"
                  />
                </div>
              </div>
            </section>
          )}

          {/* 5. Contact Details Section */}
          {shouldShow('contact-details') && (
            <section id="contact-details" className={styles.card}>
              <div className={styles.cardHeader}>
                <Phone size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Contact Details</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <FormInput
                    id="primaryContact"
                    name="primaryContact"
                    label="Primary Contact Number *"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={formData.primaryContact}
                    onChange={handleChange}
                    icon={Phone}
                    required
                  />

                  <FormInput
                    id="alternateContact"
                    name="alternateContact"
                    label="Alternate Contact Number"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={formData.alternateContact}
                    onChange={handleChange}
                    icon={Phone}
                  />

                  <FormInput
                    id="email"
                    name="email"
                    label="Official Email *"
                    type="email"
                    placeholder="company@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Mail}
                    required
                  />
                </div>
              </div>
            </section>
          )}

          {/* 6. Statutory Information Section (PAN / TAN / GST) */}
          {shouldShow('pan-tan-gst') && (
            <section id="pan-tan-gst" className={styles.card}>
              <div className={styles.cardHeader}>
                <FileText size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Statutory Information (PAN / TAN / GST)</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <FormInput
                    id="pan"
                    name="pan"
                    label="PAN"
                    type="text"
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={handleChange}
                    icon={FileText}
                    maxLength="10"
                    style={{ textTransform: 'uppercase' }}
                  />

                  <FormInput
                    id="tan"
                    name="tan"
                    label="TAN"
                    type="text"
                    placeholder="BLRA12345D"
                    value={formData.tan}
                    onChange={handleChange}
                    icon={FileText}
                    maxLength="10"
                    style={{ textTransform: 'uppercase' }}
                  />

                  <FormInput
                    id="gstin"
                    name="gstin"
                    label="GSTIN"
                    type="text"
                    placeholder="29ABCDE1234F1Z5"
                    value={formData.gstin}
                    onChange={handleChange}
                    icon={FileText}
                    maxLength="15"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* 7. Regional Settings & Date Format Section */}
          {(shouldShow('regional-settings') || shouldShow('date-format')) && (
            <section id="regional-settings" className={styles.card}>
              <div className={styles.cardHeader}>
                <Calendar size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Regional Settings & Date Format</h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <div className={styles.selectWrapper}>
                    <label htmlFor="dateFormat" className={styles.label}>
                      Date Format
                    </label>
                    <div className={styles.selectContainer}>
                      <Calendar size={17} className={styles.selectIcon} />
                      <select
                        id="dateFormat"
                        name="dateFormat"
                        value={formData.dateFormat}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelBtn}
              disabled={isSaving}
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              loading={isSaving}
              loadingText="Saving..."
              disabled={isSaving}
            >
              Save Changes
            </PrimaryButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export default CompanySetup;
