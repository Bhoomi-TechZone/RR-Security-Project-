import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronLeft, Image, ChevronDown, Search, Check } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import clientService from '../../services/clientService';
import masterService from '../../services/masterService';
import styles from './CompanyForm.module.css';

/**
 * CompanyForm component
 * Supports both full-page mode (isPageMode=true) and modal dialog mode.
 */
function CompanyForm({
  isOpen,
  isPageMode = false,
  onClose,
  onSubmit,
  company = null // if present, we are in EDIT mode
}) {
  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id;
  const [autoClientId, setAutoClientId] = useState('CLI-001');
  const [availableServices, setAvailableServices] = useState([]);
  const shouldShow = isPageMode || isOpen;

  // Multi-select dropdown state
  const serviceDropdownRef = useRef(null);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    logo: null,
    gstin: '',
    contactPerson: '',
    contactNumber: '',
    contractStartDate: '',
    contractEndDate: '',
    status: 'active',
    address: '',
    typeOfService: [],
    document: null,
    overtimeType: '',
    overtimeBasis: '',
    compliance: {
      pf: null,
      esi: null,
      lwf: null,
      tds: null,
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!company && shouldShow && currentCompanyId) {
      clientService.getNextClientId(currentCompanyId)
        .then((nextId) => {
          if (isMounted && nextId) {
            setAutoClientId(nextId);
            setFormData((prev) => ({ ...prev, clientId: nextId }));
          }
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [company, shouldShow, currentCompanyId]);

  useEffect(() => {
    let isMounted = true;
    const loadServices = async () => {
      if (!currentCompanyId) return;
      try {
        const services = await masterService.getMasters('client-services', currentCompanyId, true);
        if (isMounted && Array.isArray(services) && services.length > 0) {
          setAvailableServices(services);
          return;
        }
      } catch (e) {
        console.error('Failed to load client services in form:', e);
      }
      if (isMounted) {
        try {
          const cached = localStorage.getItem(`novaspark_client_services_${currentCompanyId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAvailableServices(parsed);
              return;
            }
          }
        } catch (e) {}
        setAvailableServices([
          { id: 'cs_1', name: 'Security Guard Services', status: 'active' },
          { id: 'cs_2', name: 'Security Supervisor Services', status: 'active' },
          { id: 'cs_3', name: 'Armed Security Services', status: 'active' },
          { id: 'cs_4', name: 'CCTV Surveillance & Monitoring', status: 'active' },
          { id: 'cs_5', name: 'Housekeeping Services', status: 'active' },
          { id: 'cs_6', name: 'Facility Management Services', status: 'active' },
          { id: 'cs_7', name: 'Bouncer & Event Security', status: 'active' },
          { id: 'cs_8', name: 'Driver & Transport Staff', status: 'active' }
        ]);
      }
    };

    loadServices();

    const handleServicesUpdated = () => {
      loadServices();
    };

    window.addEventListener('client-services-updated', handleServicesUpdated);
    window.addEventListener('masters-updated', handleServicesUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('client-services-updated', handleServicesUpdated);
      window.removeEventListener('masters-updated', handleServicesUpdated);
    };
  }, [currentCompanyId]);

  useEffect(() => {
    if (company) {
      const parseServices = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
      };

      setFormData({
        clientId: company.clientId || 'CLI-001',
        name: company.name || '',
        logo: company.logo || null,
        gstin: company.gstin || '',
        contactPerson: company.contactPerson || '',
        contactNumber: company.contactNumber || '',
        contractStartDate: company.contractStartDate || '',
        contractEndDate: company.contractEndDate || '',
        status: company.status || 'active',
        address: company.address || '',
        typeOfService: parseServices(company.typeOfService || company.servicesRequired || company.services),
        document: company.document || null,
        overtimeType: company.overtimeType || company.compliance?.overtimeType || '',
        overtimeBasis: company.overtimeBasis || company.compliance?.overtimeBasis || '',
        compliance: {
          pf: company.compliance?.pf ?? null,
          esi: company.compliance?.esi ?? null,
          lwf: company.compliance?.lwf ?? null,
          tds: company.compliance?.tds ?? null,
        }
      });
    } else {
      setFormData({
        clientId: autoClientId,
        name: '',
        logo: null,
        gstin: '',
        contactPerson: '',
        contactNumber: '',
        contractStartDate: '',
        contractEndDate: '',
        status: 'active',
        address: '',
        typeOfService: [],
        document: null,
        overtimeType: '',
        overtimeBasis: '',
        compliance: {
          pf: null,
          esi: null,
          lwf: null,
          tds: null,
        }
      });
    }
    setErrors({});
  }, [company, shouldShow, autoClientId]);

  // Click outside to close dropdown
  useEffect(() => {
    if (!isServiceDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
        setIsServiceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isServiceDropdownOpen]);

  // Escape key closes modal (only when modal mode)
  useEffect(() => {
    if (!isOpen || isPageMode) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPageMode, onClose]);

  if (!shouldShow) return null;

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          document: {
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
      if (errors.document) {
        setErrors((prev) => ({ ...prev, document: '' }));
      }
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, logo: 'Please select an image file (PNG, JPG, SVG, WebP).' }));
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, logo: 'Logo file size must be less than 3MB.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
      if (errors.logo) {
        setErrors((prev) => ({ ...prev, logo: '' }));
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null }));
  };

  const handleServiceToggle = (serviceName) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.typeOfService)
        ? prev.typeOfService
        : (prev.typeOfService ? [prev.typeOfService] : []);
      const exists = current.includes(serviceName);
      const next = exists
        ? current.filter((s) => s !== serviceName)
        : [...current, serviceName];
      return { ...prev, typeOfService: next };
    });
    if (errors.typeOfService) {
      setErrors((prev) => ({ ...prev, typeOfService: '' }));
    }
  };

  const handleSelectAllServices = () => {
    const allNames = availableServices
      .filter((s) => !s.status || s.status.toLowerCase() === 'active')
      .map((s) => s.name || s);
    setFormData((prev) => ({ ...prev, typeOfService: allNames }));
    if (errors.typeOfService) {
      setErrors((prev) => ({ ...prev, typeOfService: '' }));
    }
  };

  const handleClearAllServices = () => {
    setFormData((prev) => ({ ...prev, typeOfService: [] }));
  };

  const handleRemoveSingleService = (e, serviceName) => {
    e.stopPropagation();
    handleServiceToggle(serviceName);
  };

  const handleTriggerClear = (e) => {
    e.stopPropagation();
    handleClearAllServices();
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

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
        docPayload = formData.document.data || formData.document.name || null;
      }
    }

    const serviceArray = Array.isArray(formData.typeOfService)
      ? formData.typeOfService
      : (formData.typeOfService ? [formData.typeOfService] : []);
    const typeOfServiceStr = serviceArray.join(', ');

    const dataToSubmit = {
      ...formData,
      clientId: formData.clientId || (company ? company.clientId : autoClientId),
      document: docPayload,
      typeOfService: typeOfServiceStr,
      servicesRequired: serviceArray,
      services: serviceArray,
      logo: formData.logo || null,
      initials,
      gstin: (formData.gstin || '').toUpperCase()
    };

    try {
      setIsSubmitting(true);
      await onSubmit(dataToSubmit);
    } catch (err) {
      console.error('Error saving client:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicDetailsFields = () => {
    const selectedServices = Array.isArray(formData.typeOfService)
      ? formData.typeOfService
      : (formData.typeOfService ? [formData.typeOfService] : []);

    const activeServicesList = availableServices.filter(
      (s) => !s.status || s.status.toLowerCase() === 'active'
    );

    const filteredServices = activeServicesList.filter((service) => {
      const name = (service.name || service || '').toLowerCase();
      return name.includes((serviceSearchTerm || '').toLowerCase().trim());
    });

    return (
      <>
        {/* Row 1 Col 1: Client ID (Auto-Generated & Unique per Company) */}
        <div className={styles.formGroup}>
          <label htmlFor="clientId" className={styles.label}>
            Client ID
          </label>
          <input
            id="clientId"
            name="clientId"
            type="text"
            className={styles.input}
            style={{ backgroundColor: 'var(--surface-alt, #f8fafc)', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.5px' }}
            value={formData.clientId || autoClientId}
            readOnly
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginTop: '2px', display: 'block' }}>
            Auto-generated unique ID for this company profile.
          </span>
        </div>

        {/* Row 1 Col 2: Client Name */}
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

        {/* Row 1 Col 3: GSTIN */}
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

        {/* Row 2 Col 1: Contact Person */}
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

        {/* Row 2 Col 2: Contact Number */}
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

        {/* Row 2 Col 3: Contract Start Date */}
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

        {/* Row 3 Col 1: Contract End Date */}
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

        {/* Row 3 Col 2: Status */}
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

        {/* Row 3 Col 3: Type of Service (Multi-Select Dropdown) */}
        <div className={styles.formGroup} ref={serviceDropdownRef}>
          <label htmlFor="typeOfServiceTrigger" className={styles.label}>
            Type of Service
            {selectedServices.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--primary, #2563eb)', marginLeft: '6px', fontWeight: 600 }}>
                ({selectedServices.length} selected)
              </span>
            )}
          </label>
          
          <div className={styles.multiSelectContainer}>
            <div
              id="typeOfServiceTrigger"
              tabIndex={0}
              role="combobox"
              aria-expanded={isServiceDropdownOpen}
              aria-haspopup="listbox"
              className={`${styles.multiSelectTrigger} ${isServiceDropdownOpen ? styles.multiSelectTriggerOpen : ''}`}
              onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsServiceDropdownOpen((prev) => !prev);
                }
              }}
            >
              <div className={styles.multiSelectValuesWrap}>
                {selectedServices.length === 0 ? (
                  <span className={styles.multiSelectPlaceholder}>Select service types...</span>
                ) : (
                  <>
                    {selectedServices.slice(0, 2).map((srv) => (
                      <span key={srv} className={styles.multiSelectTag} title={srv}>
                        <span>{srv}</span>
                        <button
                          type="button"
                          className={styles.multiSelectTagRemove}
                          onClick={(e) => handleRemoveSingleService(e, srv)}
                          aria-label={`Remove ${srv}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {selectedServices.length > 2 && (
                      <span className={styles.multiSelectMoreBadge}>
                        +{selectedServices.length - 2} more
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className={styles.multiSelectActionsRight}>
                {selectedServices.length > 0 && (
                  <button
                    type="button"
                    className={styles.multiSelectClearBtn}
                    onClick={handleTriggerClear}
                    title="Clear all selected"
                    aria-label="Clear all services"
                  >
                    <X size={13} />
                  </button>
                )}
                <ChevronDown
                  size={16}
                  className={isServiceDropdownOpen ? styles.chevronRotated : styles.chevron}
                />
              </div>
            </div>

            {/* Dropdown Menu Popover */}
            {isServiceDropdownOpen && (
              <div className={styles.multiSelectDropdownMenu}>
                {/* Filter Search Input */}
                <div className={styles.dropdownSearchWrap}>
                  <Search size={14} color="#94a3b8" />
                  <input
                    type="text"
                    className={styles.dropdownSearchInput}
                    placeholder="Filter services..."
                    value={serviceSearchTerm}
                    onChange={(e) => setServiceSearchTerm(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {serviceSearchTerm && (
                    <button
                      type="button"
                      className={styles.clearSearchBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setServiceSearchTerm('');
                      }}
                      title="Clear filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Control Bar: Count + Select/Clear All */}
                <div className={styles.dropdownControlBar}>
                  <span className={styles.dropdownSelectedCount}>
                    {selectedServices.length} of {activeServicesList.length} selected
                  </span>
                  <div className={styles.dropdownControlActions}>
                    <button
                      type="button"
                      className={styles.dropdownQuickBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllServices();
                      }}
                    >
                      Select All
                    </button>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <button
                      type="button"
                      className={styles.dropdownQuickBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearAllServices();
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Scrollable Checkbox List */}
                <div className={styles.dropdownList}>
                  {filteredServices.length === 0 ? (
                    <div className={styles.noServicesFound}>
                      No services found matching "{serviceSearchTerm}"
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const serviceName = service.name || service;
                      const isChecked = selectedServices.includes(serviceName);
                      return (
                        <div
                          key={service.id || service._id || serviceName}
                          className={`${styles.dropdownOption} ${isChecked ? styles.dropdownOptionSelected : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceToggle(serviceName);
                          }}
                        >
                          <input
                            type="checkbox"
                            className={styles.dropdownCheckbox}
                            checked={isChecked}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            onChangeCapture={() => handleServiceToggle(serviceName)}
                          />
                          <span className={styles.dropdownOptionText}>{serviceName}</span>
                          {isChecked && (
                            <Check size={14} color="#2563eb" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer with Done button */}
                <div className={styles.dropdownFooter}>
                  <button
                    type="button"
                    className={styles.dropdownDoneBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsServiceDropdownOpen(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
          {errors.typeOfService && (
            <span className={styles.errorText}>{errors.typeOfService}</span>
          )}
        </div>

        {/* Row 4 Col 1: Upload Document */}
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

        {/* Row 4 Col 2: Client Logo */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Client Logo
          </label>
          <div className={styles.logoUploadRow}>
            {formData.logo ? (
              <div className={styles.logoPreviewContainer}>
                <img
                  src={formData.logo}
                  alt="Client Logo"
                  className={styles.logoPreviewImage}
                />
                <button
                  type="button"
                  className={styles.logoRemoveBtn}
                  onClick={handleRemoveLogo}
                  title="Remove Logo"
                  aria-label="Remove logo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className={styles.logoUploadBox}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  className={styles.hiddenFileInput}
                  onChange={handleLogoChange}
                />
                <Image size={15} color="#2563eb" />
                <span>Choose Logo</span>
              </label>
            )}
            <span className={styles.fileHint}>
              PNG, JPG, SVG up to 3MB
            </span>
          </div>
          {errors.logo && <span className={styles.errorText}>{errors.logo}</span>}
        </div>

        {/* Row 5: Address (Full Width) */}
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
      </>
    );
  };

  const renderComplianceFields = () => (
    <>
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
    </>
  );

  if (isPageMode) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageCard}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>
                {company ? 'Edit Client' : 'Add Client'}
              </h1>
              <p className={styles.pageSubtitle}>
                {company
                  ? 'Modify client details across sections below'
                  : 'Fill out all client details below across sections'}
              </p>
            </div>
            <div className={styles.pageHeaderActions}>
              {onClose && (
                <button
                  type="button"
                  className={styles.pageBackBtn}
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className={styles.allSectionsWrapper}>
              {/* Section 01: Basic Details */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={styles.sectionNumber}>01</div>
                    <div>
                      <h3 className={styles.sectionTitle}>Basic Details</h3>
                      <p className={styles.sectionSubtitle}>
                        Client identity, contact information, service details, and address
                      </p>
                    </div>
                  </div>
                </div>
                <div className={styles.grid}>
                  {renderBasicDetailsFields()}
                </div>
              </div>

              {/* Section 02: Statutory & Compliance */}
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderLeft}>
                    <div className={styles.sectionNumber}>02</div>
                    <div>
                      <h3 className={styles.sectionTitle}>Statutory & Compliance</h3>
                      <p className={styles.sectionSubtitle}>
                        PF, ESI, LWF, TDS and Overtime setup for this client
                      </p>
                    </div>
                  </div>
                </div>
                <div className={styles.complianceContainer}>
                  <div className={styles.complianceGrid}>
                    {renderComplianceFields()}
                  </div>
                </div>
              </div>

              {/* Section Footer */}
              <div className={styles.sectionFooter}>
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
                  {isSubmitting ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className={styles.spinner} />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    company ? 'Save Changes' : 'Add Client'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={isSubmitting ? undefined : onClose}>
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
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close form" disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {renderBasicDetailsFields()}
          </div>

          <div className={styles.complianceContainer}>
            <div className={styles.complianceGrid}>
              {renderComplianceFields()}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>Saving...</span>
                </span>
              ) : (
                company ? 'Update Client' : 'Add Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyForm;