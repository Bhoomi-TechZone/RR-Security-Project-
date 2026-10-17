import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Mail, Upload, X, FileText, 
  Calendar, UserCheck, Sparkles, Hash, SlidersHorizontal, ShieldCheck,
  Search, ArrowRight, ArrowLeft, Layers
} from 'lucide-react';
import styles from './CompanySetup.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import FormInput from '../../components/common/FormInput';
import PrimaryButton from '../../components/common/PrimaryButton';
import Toast from '../../components/common/Toast';

import { useCompany } from '../../context/CompanyContext';
import { 
  SEPARATOR_OPTIONS, 
  YEAR_FORMAT_OPTIONS, 
  MONTH_FORMAT_OPTIONS, 
  PADDING_OPTIONS, 
  RESET_FREQUENCY_OPTIONS, 
  generateSeriesPreview, 
  mockNumberSeriesList 
} from '../../data/numberSeriesData';

const SETUP_CATEGORIES = [
  { id: 'all', label: 'All Setup Modules' },
  { id: 'company-profile', label: 'Company Profile' },
  { id: 'branch', label: 'Branch' },
  { id: 'departments', label: 'Departments' },
  { id: 'designations', label: 'Designations' },
  { id: 'employee-code', label: 'Employee Code' },
  { id: 'pf-code', label: 'PF Code' }
];

const SETUP_MODULES = [
  {
    id: 'company-profile',
    title: 'Company Profile',
    desc: 'Manage corporate identity, logo, addresses, contacts, PAN/GST and regional settings.',
    category: 'company-profile',
    icon: Building2,
    badge: 'Identity',
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    route: '/admin/company-setup?section=company-profile',
    isExternal: false
  },
  {
    id: 'branch',
    title: 'Branch',
    desc: 'Manage branch offices, operational facilities, and physical work locations.',
    category: 'branch',
    icon: MapPin,
    badge: 'Locations',
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    route: '/admin/work-locations',
    isExternal: true
  },
  {
    id: 'departments',
    title: 'Departments',
    desc: 'Configure company departments, divisions, and department head assignments.',
    category: 'departments',
    icon: Layers,
    badge: 'Masters',
    iconBg: '#f5f3ff',
    iconColor: '#7c3aed',
    route: '/admin/masters?tab=departments',
    isExternal: true
  },
  {
    id: 'designations',
    title: 'Designations',
    desc: 'Define employee job designations, corporate roles, and grading structures.',
    category: 'designations',
    icon: UserCheck,
    badge: 'Masters',
    iconBg: '#fffbeb',
    iconColor: '#d97706',
    route: '/admin/masters?tab=designations',
    isExternal: true
  },
  {
    id: 'employee-code',
    title: 'Employee Code Configuration',
    desc: 'Configure automatic employee code numbering, prefix format, and sequence rules.',
    category: 'employee-code',
    icon: Hash,
    badge: 'Series',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    route: '/admin/company-setup?section=employee-code',
    isExternal: false
  },
  {
    id: 'pf-code',
    title: 'PF Code Configuration',
    desc: 'Configure Provident Fund establishment numbering, office prefix, and sequence rules.',
    category: 'pf-code',
    icon: ShieldCheck,
    badge: 'EPFO',
    iconBg: '#fff1f2',
    iconColor: '#e11d48',
    route: '/admin/company-setup?section=pf-code',
    isExternal: false
  }
];

function CompanySetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeCompany, updateCompanyProfile } = useCompany();

  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;
  const rawSection = searchParams.get('section');
  const isExplorerView = !rawSection;
  const activeSection = rawSection || 'company-profile';

  const [catalogSearch, setCatalogSearch] = useState('');
  const [explorerCategory, setExplorerCategory] = useState('all');

  const filteredCatalog = useMemo(() => {
    return SETUP_MODULES.filter((item) => {
      const matchesCategory =
        explorerCategory === 'all' || item.category === explorerCategory;

      const query = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.desc.toLowerCase().includes(query) ||
        item.badge.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [explorerCategory, catalogSearch]);

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return SETUP_MODULES.length;
    return SETUP_MODULES.filter((m) => m.category === categoryId).length;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Form state initialized dynamically from active company
  const [formData, setFormData] = useState({
    companyName: activeCompany?.name || '',
    logo: activeCompany?.logo || null,
    address: activeCompany?.address || '',
    state: activeCompany?.state || '',
    city: activeCompany?.city || '',
    pinCode: activeCompany?.pinCode || '',
    primaryContact: activeCompany?.phone || '',
    alternateContact: activeCompany?.alternateContact || activeCompany?.alternatePhone || '',
    email: activeCompany?.email || '',
    pan: activeCompany?.pan || '',
    tan: activeCompany?.tan || '',
    gstin: activeCompany?.gstin || '',
    dateFormat: activeCompany?.dateFormat || 'DD/MM/YYYY',
    timeZone: activeCompany?.timeZone || 'Asia/Kolkata (IST +05:30)',
    currency: activeCompany?.currency || 'INR (₹)',
  });

  // Keep synced when activeCompany changes
  useEffect(() => {
    if (activeCompany) {
      setFormData(prev => ({
        ...prev,
        companyName: activeCompany.name || '',
        logo: activeCompany.logo || null,
        address: activeCompany.address || '',
        state: activeCompany.state || '',
        city: activeCompany.city || '',
        pinCode: activeCompany.pinCode || '',
        primaryContact: activeCompany.phone || '',
        alternateContact: activeCompany.alternateContact || activeCompany.alternatePhone || '',
        email: activeCompany.email || '',
        pan: activeCompany.pan || '',
        tan: activeCompany.tan || '',
        gstin: activeCompany.gstin || '',
        dateFormat: activeCompany.dateFormat || 'DD/MM/YYYY',
        timeZone: activeCompany.timeZone || 'Asia/Kolkata (IST +05:30)',
        currency: activeCompany.currency || 'INR (₹)',
      }));

      if (activeCompany.logo) {
        setLogoPreview(activeCompany.logo);
      }

      // Sync employee code series configuration for active company
      if (activeCompany.employeeCodeSeries) {
        const compSeries = { ...activeCompany.employeeCodeSeries };
        if (compSeries.currentNumber === 1042) {
          compSeries.currentNumber = compSeries.startingNumber || 1;
        }
        setEmpCodeSeries(compSeries);
      } else {
        const compId = activeCompany.companyId || activeCompany.id;
        const savedCompSeries = compId ? localStorage.getItem(`novaspark_number_series_${compId}`) : null;
        if (savedCompSeries) {
          try {
            const parsed = JSON.parse(savedCompSeries);
            if (parsed.currentNumber === 1042) {
              parsed.currentNumber = parsed.startingNumber || 1;
            }
            setEmpCodeSeries(parsed);
          } catch (e) {}
        } else if (activeCompany.code) {
          setEmpCodeSeries(prev => ({
            ...prev,
            prefix: activeCompany.code,
            startingNumber: 1,
            currentNumber: 1
          }));
        }
      }

      // Sync PF code series configuration for active company
      if (activeCompany.pfCodeSeries) {
        setPfCodeSeries({ ...activeCompany.pfCodeSeries });
      } else {
        const compId = activeCompany.companyId || activeCompany.id;
        const savedPfSeries = compId ? localStorage.getItem(`novaspark_pf_number_series_${compId}`) : null;
        if (savedPfSeries) {
          try {
            setPfCodeSeries(JSON.parse(savedPfSeries));
          } catch (e) {}
        }
      }
    }
  }, [activeCompany]);

  // Employee Code Series State
  const [empCodeSeries, setEmpCodeSeries] = useState(() => {
    if (activeCompany?.employeeCodeSeries) {
      const compSeries = { ...activeCompany.employeeCodeSeries };
      if (compSeries.currentNumber === 1042) {
        compSeries.currentNumber = compSeries.startingNumber || 1;
      }
      return compSeries;
    }
    const compId = activeCompany?.companyId || activeCompany?.id;
    const savedComp = compId ? localStorage.getItem(`novaspark_number_series_${compId}`) : null;
    if (savedComp) {
      try {
        const parsed = JSON.parse(savedComp);
        if (parsed.currentNumber === 1042) {
          parsed.currentNumber = parsed.startingNumber || 1;
        }
        return parsed;
      } catch (e) {}
    }
    const savedList = localStorage.getItem('novaspark_number_series');
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        const empSeries = parsed.find(s => s.id === 'employee-code');
        if (empSeries) {
          if (empSeries.currentNumber === 1042) {
            empSeries.currentNumber = empSeries.startingNumber || 1;
          }
          return {
            ...empSeries,
            prefix: activeCompany?.code || empSeries.prefix || 'EMP',
            startingNumber: empSeries.startingNumber || 1,
            currentNumber: empSeries.currentNumber || 1
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      id: 'employee-code',
      name: 'Employee Code',
      code: 'SERIES-EMP',
      moduleTarget: 'Employee Management',
      prefix: activeCompany?.code || 'EMP',
      startingNumber: 1,
      currentNumber: 1,
      lastUsedNumber: 0,
      padding: 3,
      separator: '-',
      yearFormat: 'None',
      monthFormat: 'None',
      resetFrequency: 'Never',
      description: 'Unique workforce identification number automatically assigned upon candidate onboard registration.',
      status: 'Active',
      lastUpdated: '2026-03-01 10:30 AM'
    };
  });

  // PF Code Series State
  const [pfCodeSeries, setPfCodeSeries] = useState(() => {
    if (activeCompany?.pfCodeSeries) {
      return { ...activeCompany.pfCodeSeries };
    }
    const compId = activeCompany?.companyId || activeCompany?.id;
    const savedComp = compId ? localStorage.getItem(`novaspark_pf_number_series_${compId}`) : null;
    if (savedComp) {
      try {
        const parsed = JSON.parse(savedComp);
        return parsed;
      } catch (e) {}
    }
    const savedList = localStorage.getItem('novaspark_number_series');
    if (savedList) {
      try {
        const parsed = JSON.parse(savedList);
        const pfSeries = parsed.find(s => s.id === 'pf-code');
        if (pfSeries) {
          return {
            ...pfSeries,
            prefix: pfSeries.prefix || 'PF',
            startingNumber: pfSeries.startingNumber || 1,
            currentNumber: pfSeries.currentNumber || 1
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      id: 'pf-code',
      name: 'PF Member Code / Number',
      code: 'SERIES-PF',
      moduleTarget: 'Statutory & PF Compliance',
      prefix: 'PF',
      startingNumber: 1,
      currentNumber: 1,
      lastUsedNumber: 0,
      padding: 5,
      separator: '-',
      yearFormat: 'None',
      monthFormat: 'None',
      resetFrequency: 'Never',
      description: 'Provident Fund member number / series automatically assigned to PF-eligible employees.',
      status: 'Active',
      lastUpdated: '2026-03-01 10:30 AM'
    };
  });

  // Logo preview state
  const [logoPreview, setLogoPreview] = useState(() => {
    return activeCompany?.logo || localStorage.getItem('novaspark_company_logo_preview') || null;
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
    setEmpCodeSeries(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'startingNumber') {
        updated.currentNumber = value;
      }
      return updated;
    });
  };

  const empCodePreview = useMemo(() => {
    return generateSeriesPreview(empCodeSeries);
  }, [empCodeSeries]);

  const handlePfCodeSeriesChange = (field, value) => {
    setPfCodeSeries(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'startingNumber') {
        updated.currentNumber = value;
      }
      return updated;
    });
  };

  const pfCodePreview = useMemo(() => {
    return generateSeriesPreview(pfCodeSeries);
  }, [pfCodeSeries]);

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

      // Create preview & update logo in formData
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData(prev => ({ ...prev, logo: reader.result }));
        localStorage.setItem('novaspark_company_logo_preview', reader.result);
        if (activeCompany) {
          const compId = activeCompany.companyId || activeCompany.id;
          localStorage.setItem(`novaspark_company_logo_${compId}`, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    setLogoPreview(null);
    localStorage.removeItem('novaspark_company_logo_preview');
    if (activeCompany) {
      const compId = activeCompany.companyId || activeCompany.id;
      localStorage.removeItem(`novaspark_company_logo_${compId}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedEmpSeries = {
        ...empCodeSeries,
        lastUpdated: new Date().toLocaleString()
      };

      const updatedPfSeries = {
        ...pfCodeSeries,
        lastUpdated: new Date().toLocaleString()
      };

      // 1. Update company profile & employeeCodeSeries / pfCodeSeries in backend database & CompanyContext
      if (activeCompany) {
        const compId = activeCompany.companyId || activeCompany.id;
        await updateCompanyProfile(compId, {
          name: formData.companyName,
          code: updatedEmpSeries.prefix || activeCompany.code || 'EMP',
          email: formData.email,
          phone: formData.primaryContact,
          alternateContact: formData.alternateContact,
          alternatePhone: formData.alternateContact,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          pan: formData.pan,
          tan: formData.tan,
          gstin: formData.gstin,
          logo: formData.logo || logoPreview || null,
          dateFormat: formData.dateFormat,
          timeZone: formData.timeZone,
          currency: formData.currency,
          employeeCodeSeries: updatedEmpSeries,
          pfCodeSeries: updatedPfSeries,
        });

        localStorage.setItem(`novaspark_number_series_${compId}`, JSON.stringify(updatedEmpSeries));
        localStorage.setItem(`novaspark_pf_number_series_${compId}`, JSON.stringify(updatedPfSeries));
      }

      // 2. Persist local cache
      localStorage.setItem('novaspark_company_setup', JSON.stringify(formData));
      
      // Also persist and sync Employee Code Series and PF Code Series to global number series
      const savedSeriesList = localStorage.getItem('novaspark_number_series');
      let allSeries = savedSeriesList ? JSON.parse(savedSeriesList) : mockNumberSeriesList;
      allSeries = allSeries.map(s => s.id === 'employee-code' ? updatedEmpSeries : s);
      const hasPf = allSeries.some(s => s.id === 'pf-code');
      if (hasPf) {
        allSeries = allSeries.map(s => s.id === 'pf-code' ? updatedPfSeries : s);
      } else {
        allSeries.push(updatedPfSeries);
      }
      localStorage.setItem('novaspark_number_series', JSON.stringify(allSeries));

      setIsSaving(false);
      showToast('✓ Company profile, prefix & settings saved successfully to database', 'success');
    } catch (err) {
      setIsSaving(false);
      showToast(err.message || 'Failed to save company settings', 'error');
    }
  };

  const handleCancel = () => {
    navigate('/admin/company-setup');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const isEmployeeCodeSection = activeSection === 'employee-code';
  const isPfCodeSection = activeSection === 'pf-code';

  const SECTION_TITLES = {
    'company-profile': 'Company Profile',
    'logo': 'Company Logo',
    'employee-code': 'Employee Code Configuration',
    'pf-code': 'PF Code Configuration',
    'address': 'Address Details',
    'contact-details': 'Contact Details',
    'pan-tan-gst': 'Statutory Information (PAN / TAN / GST)',
    'regional-settings': 'Regional Settings & Date Format',
    'date-format': 'Regional Settings & Date Format'
  };

  const SECTION_DESCRIPTIONS = {
    'company-profile': 'Manage registered company identity and corporate profile details.',
    'logo': 'Upload and manage official company logo for documents, payslips and reports.',
    'employee-code': 'Configure automatic employee code generation, prefix, sequence formatting and reset rules.',
    'pf-code': 'Configure automatic Provident Fund (PF) member number / code series formatting and sequence rules.',
    'address': 'Manage company registered office and branch address details.',
    'contact-details': 'Official primary telephone, alternate contact numbers and corporate email.',
    'pan-tan-gst': 'Statutory registration numbers for PAN, TAN, and Goods & Services Tax (GSTIN).',
    'regional-settings': 'Configure default system date format, time zone and currency.',
    'date-format': 'Configure default system date format, time zone and currency.'
  };

  // Check if specifically targeted to a single section (e.g. from Organisation Settings modal or individual section deep link)
  const isSpecificSectionMode = isFromOrgSettings || [
    'logo',
    'address',
    'contact-details',
    'pan-tan-gst',
    'regional-settings',
    'date-format'
  ].includes(activeSection);

  // Auto-scroll when specific section anchor is specified (e.g. from modal or deep-link)
  useEffect(() => {
    if (activeSection && activeSection !== 'company-profile' && activeSection !== 'employee-code' && activeSection !== 'pf-code') {
      const timer = setTimeout(() => {
        const el = document.getElementById(activeSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeSection]);

  const shouldShow = (sectionKey) => {
    // 1. When coming from Organisation Settings modal or specific sub-section link, show ONLY that clicked section
    if (isSpecificSectionMode) {
      if (activeSection === sectionKey) return true;
      if (
        (sectionKey === 'regional-settings' || sectionKey === 'date-format') &&
        (activeSection === 'regional-settings' || activeSection === 'date-format')
      ) {
        return true;
      }
      return false;
    }

    // 2. Default sidebar navigation:
    if (sectionKey === 'employee-code') {
      return isEmployeeCodeSection;
    }

    if (sectionKey === 'pf-code') {
      return isPfCodeSection;
    }

    // When opening Company Profile from sidebar, show company-profile, logo, address, contact-details, pan-tan-gst and regional-settings all together
    return !isEmployeeCodeSection && !isPfCodeSection;
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

        {isExplorerView ? (
          <>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <span
                className={styles.crumbLink}
                onClick={() => navigate('/admin/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                Dashboard
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive}>Company Setup</span>
            </div>

            {/* Page Header */}
            <header className={styles.header} style={{ marginBottom: '16px' }}>
              <div className={styles.titleArea}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={24} color="#2563eb" />
                  <h1 className={styles.title} style={{ fontSize: '22px' }}>Company Setup</h1>
                </div>
                <p className={styles.description} style={{ marginTop: '6px' }}>
                  Configure your organization profile, branch locations, departments, designations, employee code numbering, and PF code compliance.
                </p>
              </div>
            </header>

            {/* 2-Column Setup Explorer */}
            <div className={styles.setupExplorerLayout}>
              {/* Left Sidebar Filter Panel */}
              <aside className={styles.explorerSidebar}>
                <div className={styles.explorerSearchWrap}>
                  <input
                    type="text"
                    className={styles.explorerSearchInput}
                    placeholder="Search Setup Modules"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                  {catalogSearch ? (
                    <button
                      type="button"
                      className={styles.explorerClearBtn}
                      onClick={() => setCatalogSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <span style={{ position: 'absolute', right: 10, color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
                      <Search size={14} />
                    </span>
                  )}
                </div>

                <ul className={styles.categoryList}>
                  {SETUP_CATEGORIES.map((cat) => {
                    const count = getCategoryCount(cat.id);
                    const isActive = explorerCategory === cat.id;
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                          onClick={() => setExplorerCategory(cat.id)}
                        >
                          <span className={isActive ? styles.sidebarActiveDot : styles.sidebarDot} />
                          <span>{cat.label}</span>
                          <span className={styles.categoryBadge}>{count}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>

              {/* Right Grid of Setup Cards */}
              <main style={{ minWidth: 0 }}>
                {filteredCatalog.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>No setup modules found matching "{catalogSearch}".</p>
                    <button
                      type="button"
                      className={styles.emptyResetBtn}
                      onClick={() => { setCatalogSearch(''); setExplorerCategory('all'); }}
                    >
                      Show All Setup Modules
                    </button>
                  </div>
                ) : (
                  <div className={styles.explorerCardsGrid}>
                    {filteredCatalog.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <div key={item.id} className={styles.referenceModuleCard}>
                          <div>
                            <div className={styles.cardHeaderTop}>
                              <div
                                className={styles.cardIconWrap}
                                style={{ background: item.iconBg, color: item.iconColor }}
                              >
                                <ItemIcon size={19} />
                              </div>
                              <span className={styles.moduleBadge}>{item.badge}</span>
                            </div>
                            <div className={styles.cardBody}>
                              <h4 className={styles.cardTitle}>{item.title}</h4>
                              <p className={styles.cardDesc}>{item.desc}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.cardOpenBtn}
                            onClick={() => navigate(item.route)}
                          >
                            Configure <ArrowRight size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </main>
            </div>
          </>
        ) : (
          <>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
              <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
                Dashboard
              </span>
              <span className={styles.separator}>/</span>
              <span
                className={styles.crumbLink}
                onClick={() => navigate('/admin/company-setup')}
                style={{ cursor: 'pointer', color: 'var(--primary, #2563eb)', fontWeight: 500 }}
              >
                Company Setup
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive}>
                {isSpecificSectionMode
                  ? (SECTION_TITLES[activeSection] || 'Settings')
                  : (isEmployeeCodeSection
                      ? 'Employee Code'
                      : isPfCodeSection
                      ? 'PF Code'
                      : 'Company Profile')}
              </span>
            </div>

            {/* Page Header */}
            <header className={styles.header}>
              <div className={styles.titleArea}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/company-setup')}
                    className={styles.backBtn}
                  >
                    <ArrowLeft size={15} /> Back to Company Setup
                  </button>
                  <h1 className={styles.title} style={{ margin: 0, fontSize: '22px' }}>
                    {isSpecificSectionMode
                      ? (SECTION_TITLES[activeSection] || 'Company Setup')
                      : (isEmployeeCodeSection
                          ? 'Employee Code Configuration'
                          : isPfCodeSection
                          ? 'PF Code Configuration'
                          : 'Company Profile')}
                  </h1>
                </div>
                <p className={styles.description} style={{ marginTop: '6px' }}>
                  {isSpecificSectionMode
                    ? (SECTION_DESCRIPTIONS[activeSection] || 'Manage company setup details.')
                    : (isEmployeeCodeSection
                        ? 'Configure automatic employee code generation, prefix, sequence formatting and reset rules.'
                        : isPfCodeSection
                        ? 'Configure automatic Provident Fund (PF) member number / code series formatting and sequence rules.'
                        : 'Manage your company profile, logo, address, contact details, statutory information (PAN / TAN / GST) and regional settings.')}
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

          {/* 3.1 PF Code Number Series Section */}
          {shouldShow('pf-code') && (
            <section id="pf-code" className={styles.card}>
              <div className={styles.cardHeader}>
                <ShieldCheck size={20} className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>PF Code Configuration</h2>
              </div>
              <div className={styles.cardBody}>
                {/* Format Preview Banner */}
                <div className={styles.previewBanner}>
                  <div className={styles.previewInfo}>
                    <span className={styles.previewLabel}>Active Sample Preview</span>
                    <span className={styles.previewCode}>{pfCodePreview}</span>
                  </div>
                  <div className={styles.previewBadge}>
                    <Sparkles size={14} />
                    <span>Auto-Sequenced PF Code</span>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div>
                    <label className={styles.label}>Prefix Code</label>
                    <FormInput
                      id="pfPrefix"
                      name="pfPrefix"
                      type="text"
                      placeholder="e.g. PF or DL-CPM"
                      value={pfCodeSeries.prefix || ''}
                      onChange={(e) => handlePfCodeSeriesChange('prefix', e.target.value.toUpperCase())}
                      icon={Hash}
                    />
                    <span className={styles.inputHelper}>Provident Fund region or establishment prefix</span>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Separator</label>
                    <div className={styles.selectContainer}>
                      <SlidersHorizontal size={17} className={styles.selectIcon} />
                      <select
                        value={pfCodeSeries.separator !== undefined ? pfCodeSeries.separator : '-'}
                        onChange={(e) => handlePfCodeSeriesChange('separator', e.target.value)}
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
                        value={pfCodeSeries.yearFormat || 'None'}
                        onChange={(e) => handlePfCodeSeriesChange('yearFormat', e.target.value)}
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
                        value={pfCodeSeries.monthFormat || 'None'}
                        onChange={(e) => handlePfCodeSeriesChange('monthFormat', e.target.value)}
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
                        value={pfCodeSeries.padding || 5}
                        onChange={(e) => handlePfCodeSeriesChange('padding', Number(e.target.value))}
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
                      id="pfStartingNumber"
                      name="pfStartingNumber"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={pfCodeSeries.startingNumber || 1}
                      onChange={(e) => handlePfCodeSeriesChange('startingNumber', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <span className={styles.inputHelper}>Initial sequence value</span>
                  </div>

                  <div className={styles.selectWrapper}>
                    <label className={styles.label}>Reset Frequency</label>
                    <div className={styles.selectContainer}>
                      <SlidersHorizontal size={17} className={styles.selectIcon} />
                      <select
                        value={pfCodeSeries.resetFrequency || 'Never'}
                        onChange={(e) => handlePfCodeSeriesChange('resetFrequency', e.target.value)}
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
                      <ShieldCheck size={17} className={styles.selectIcon} />
                      <select
                        value={pfCodeSeries.status || 'Active'}
                        onChange={(e) => handlePfCodeSeriesChange('status', e.target.value)}
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
      </>
    )}
  </div>
</AdminLayout>
  );
}

export default CompanySetup;
