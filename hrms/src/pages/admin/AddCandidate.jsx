import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Loader2,
  FileText,
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import {
  generateNextCandidateId,
  addCandidate,
  updateCandidate,
  getStoredCandidates
} from '../../data/recruitmentData';
import styles from './AddCandidate.module.css';

// Default Job Categories (with fallback to Masters setup)
const DEFAULT_JOB_CATEGORIES = [
  'Security Guard',
  'Armed Guard / Gunman',
  'Field Supervisor',
  'CCTV / Control Room Operator',
  'Housekeeping Executive',
  'Bouncer / VIP Security',
  'Driver / Chauffeur',
  'Office Staff',
  'Other'
];

// Exact Sources from user's table
const RECRUITMENT_SOURCES = [
  'Walk-in',
  'WhatsApp',
  'Email',
  'Website',
  'Reference',
  'Job Portal',
  'Other'
];

// Common Skill Options
const COMMON_SKILLS = [
  'Security Operations',
  'CCTV Monitoring',
  'Access Control & Frisking',
  'Fire Safety & Drill',
  'First Aid',
  'Crowd Management',
  'Visitor Register Maintenance',
  'Housekeeping & Cleaning',
  'Floor Machine Handling',
  'Basic Computer & Excel',
  'English Communication',
  'Driving License'
];

const INDIAN_STATES = [
  'Uttar Pradesh', 'Delhi NCR', 'Haryana', 'Rajasthan', 'Madhya Pradesh',
  'Bihar', 'Punjab', 'Maharashtra', 'Gujarat', 'Uttarakhand', 'West Bengal',
  'Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'Other'
];

const parseJobCategories = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

export default function AddCandidate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const autoCandidateId = useMemo(() => generateNextCandidateId(), []);

  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'comp_rr_security';
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_JOB_CATEGORIES);

  // Multi-select dropdown state for Job Category
  const categoryDropdownRef = useRef(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Form state strictly holding user's specified fields
  const [formData, setFormData] = useState({
    // 1. Candidate ID (Auto Generated)
    id: autoCandidateId,

    // 2. Candidate Name (Full Name)
    name: '',

    // 3. Mobile Number (Primary & Alternate)
    mobile: '',
    altMobile: '',

    // 4. WhatsApp Number (Contact)
    whatsapp: '',

    // 5. Email ID (Email)
    email: '',

    // 6. Present Address (City / State / Full Address)
    address: '',
    city: 'Noida',
    state: 'Uttar Pradesh',

    // 7. Job Category (Multi-Select Array)
    jobCategory: ['Security Guard'],

    // 8. Applied For (Job Designation)
    appliedFor: 'Security Guard',

    // 9. Experience (Fresher / Experienced)
    experience: 'Experienced',

    // 10. Total Experience (Years)
    totalExperienceYears: 2,

    // 11. Last Company (Previous Employer)
    lastCompany: '',

    // 12. Last Salary (Previous Salary)
    lastSalary: '',

    // 13. Expected Salary
    expectedSalary: '',

    // 14. Minimum Expected Salary
    minExpectedSalary: '',

    // 15. Maximum Expected Salary
    maxExpectedSalary: '',

    // 16. Preferred Location (Job Location)
    preferredLocation: '',

    // 17. Photo (Candidate Photo - Upload JPG / PNG)
    photo: '',
    photoName: '',

    // 18. Resume Upload (Upload PDF / DOC)
    resumeUrl: '',
    resumeName: '',
    resumeSize: '',

    // 19. Skills (Multiple Skills)
    skills: ['Security Operations'],
    customSkill: '',

    // 20. Source (Walk-in / WhatsApp / Email / Website / Reference)
    source: 'Walk-in',

    // 21. Registration Date (Auto Date)
    registrationDate: new Date().toISOString().split('T')[0],

    // Candidate Status
    status: 'applied',

    // 22. Remarks (HR Notes)
    remarks: ''
  });

  // Dynamically load job categories from Masters setup
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        if (currentCompanyId) {
          const masters = await masterService.getMasters('job-categories', currentCompanyId, true);
          if (isMounted && Array.isArray(masters) && masters.length > 0) {
            const names = masters
              .filter((m) => !m.status || m.status.toLowerCase() === 'active')
              .map((m) => m.name || m);
            if (names.length > 0) {
              setAvailableCategories(names);
              return;
            }
          }
        }
      } catch (e) {
        console.error('Failed to load job categories:', e);
      }

      if (isMounted) {
        try {
          const cached = localStorage.getItem(`novaspark_job_categories_${currentCompanyId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const names = parsed
                .filter((m) => !m.status || m.status.toLowerCase() === 'active')
                .map((m) => m.name || m);
              if (names.length > 0) {
                setAvailableCategories(names);
                return;
              }
            }
          }
        } catch (e) {}
        setAvailableCategories(DEFAULT_JOB_CATEGORIES);
      }
    };

    loadCategories();

    const handleUpdate = () => loadCategories();
    window.addEventListener('masters-updated', handleUpdate);
    window.addEventListener('job-categories-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('masters-updated', handleUpdate);
      window.removeEventListener('job-categories-updated', handleUpdate);
    };
  }, [currentCompanyId]);

  // Click outside to close job category dropdown
  useEffect(() => {
    if (!isCategoryDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryDropdownOpen]);

  useEffect(() => {
    if (isEdit) {
      const candidates = getStoredCandidates();
      const existing = candidates.find((c) => c.id === id);
      if (existing) {
        setFormData({
          id: existing.id || id,
          name: existing.name || '',
          mobile: existing.mobile || '',
          altMobile: existing.altMobile || '',
          whatsapp: existing.whatsapp || '',
          email: existing.email || '',
          address: existing.address || '',
          city: existing.city || 'Noida',
          state: existing.state || 'Uttar Pradesh',
          jobCategory: parseJobCategories(existing.jobCategory || existing.jobCategories),
          appliedFor: existing.appliedFor || 'Security Guard',
          experience: existing.experience || 'Experienced',
          totalExperienceYears: existing.totalExperienceYears !== undefined ? existing.totalExperienceYears : 2,
          lastCompany: existing.lastCompany || '',
          lastSalary: existing.lastSalary !== undefined ? existing.lastSalary : '',
          expectedSalary: existing.expectedSalary !== undefined ? existing.expectedSalary : '',
          minExpectedSalary: existing.minExpectedSalary !== undefined ? existing.minExpectedSalary : '',
          maxExpectedSalary: existing.maxExpectedSalary !== undefined ? existing.maxExpectedSalary : '',
          preferredLocation: existing.preferredLocation || '',
          photo: existing.photo || '',
          photoName: existing.photoName || '',
          resumeUrl: existing.resumeUrl || '',
          resumeName: existing.resumeName || existing.resumeUrl || '',
          resumeSize: existing.resumeSize || '',
          skills: Array.isArray(existing.skills) ? existing.skills : [],
          customSkill: '',
          source: existing.source || 'Walk-in',
          registrationDate: existing.registrationDate || new Date().toISOString().split('T')[0],
          status: existing.status || 'applied',
          remarks: existing.remarks || ''
        });
      } else {
        showToast(`Candidate "${id}" not found`, 'error');
        setTimeout(() => navigate('/admin/recruitment'), 1500);
      }
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCopyMobileToWhatsApp = () => {
    if (formData.mobile) {
      setFormData((prev) => ({ ...prev, whatsapp: prev.mobile }));
      showToast('Copied Mobile Number to WhatsApp', 'info');
    }
  };

  const handleCategoryToggle = (catName) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.jobCategory)
        ? prev.jobCategory
        : (prev.jobCategory ? [prev.jobCategory] : []);
      const exists = current.includes(catName);
      const next = exists
        ? current.filter((c) => c !== catName)
        : [...current, catName];
      return { ...prev, jobCategory: next };
    });
    if (errors.jobCategory) {
      setErrors((prev) => ({ ...prev, jobCategory: '' }));
    }
  };

  const handleSelectAllCategories = () => {
    setFormData((prev) => ({ ...prev, jobCategory: [...availableCategories] }));
    if (errors.jobCategory) {
      setErrors((prev) => ({ ...prev, jobCategory: '' }));
    }
  };

  const handleClearAllCategories = () => {
    setFormData((prev) => ({ ...prev, jobCategory: [] }));
  };

  const handleRemoveSingleCategory = (e, catName) => {
    e.stopPropagation();
    handleCategoryToggle(catName);
  };

  const handleCategoryTriggerClear = (e) => {
    e.stopPropagation();
    handleClearAllCategories();
  };

  const handleToggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill]
      };
    });
  };

  const handleAddCustomSkill = (e) => {
    if (e.key && e.key !== 'Enter') return;
    if (e.preventDefault) e.preventDefault();
    const val = formData.customSkill.trim();
    if (!val) return;
    if (formData.skills.includes(val)) {
      showToast('Skill already added', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, val],
      customSkill: ''
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid JPG or PNG image.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        photo: event.target.result,
        photoName: file.name
      }));
      showToast('Candidate photo attached successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = (file.size / 1024).toFixed(0);
    const sizeStr = Number(sizeKb) > 1024 ? `${(Number(sizeKb) / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    setFormData((prev) => ({
      ...prev,
      resumeUrl: file.name,
      resumeName: file.name,
      resumeSize: sizeStr
    }));
    showToast(`Resume attached: ${file.name}`, 'success');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Candidate Name is required';
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Primary Mobile is required';
    }
    if (!formData.appliedFor.trim()) {
      newErrors.appliedFor = 'Applied Designation is required';
    }
    if (!formData.expectedSalary) {
      newErrors.expectedSalary = 'Expected Salary is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill out all mandatory fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    const categoryArray = Array.isArray(formData.jobCategory)
      ? formData.jobCategory
      : (formData.jobCategory ? [formData.jobCategory] : []);
    const categoryStr = categoryArray.join(', ');

    const payload = {
      id: formData.id,
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      altMobile: formData.altMobile.trim(),
      whatsapp: formData.whatsapp.trim() || formData.mobile.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state,

      jobCategory: categoryStr || (categoryArray[0] || ''),
      jobCategories: categoryArray,
      appliedFor: formData.appliedFor.trim(),
      preferredLocation: formData.preferredLocation.trim(),

      experience: formData.experience,
      totalExperienceYears: formData.experience === 'Fresher' ? 0 : Number(formData.totalExperienceYears || 0),
      lastCompany: formData.experience === 'Fresher' ? '' : formData.lastCompany.trim(),
      lastSalary: formData.experience === 'Fresher' ? 0 : Number(formData.lastSalary || 0),

      expectedSalary: Number(formData.expectedSalary || 0),
      minExpectedSalary: Number(formData.minExpectedSalary || formData.expectedSalary || 0),
      maxExpectedSalary: Number(formData.maxExpectedSalary || formData.expectedSalary || 0),

      skills: formData.skills,
      photo: formData.photo,
      resumeUrl: formData.resumeName || formData.resumeUrl || '',
      resumeSize: formData.resumeSize || '',
      source: formData.source,
      registrationDate: formData.registrationDate,
      remarks: formData.remarks.trim(),

      status: formData.status || 'applied',
      interviews: []
    };

    try {
      if (isEdit) {
        const updated = updateCandidate(id, payload);
        showToast(`Candidate "${updated?.name || payload.name}" updated successfully!`, 'success');
        setTimeout(() => {
          navigate('/admin/recruitment');
        }, 700);
        return;
      }
      const created = addCandidate(payload);
      showToast(`Candidate "${created.name}" (${created.id}) added successfully!`, 'success');
      setTimeout(() => {
        navigate(`/admin/recruitment/${created.id}`);
      }, 700);
    } catch (err) {
      showToast('Error adding candidate. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const selectedCategories = Array.isArray(formData.jobCategory)
    ? formData.jobCategory
    : (formData.jobCategory ? [formData.jobCategory] : []);

  const filteredCategories = availableCategories.filter((cat) =>
    (cat || '').toLowerCase().includes((categorySearchTerm || '').toLowerCase().trim())
  );

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Notification */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'success' })}
          />
        )}

        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/admin/dashboard" className={styles.crumbLink}>
            Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink}>Talent & Recruitment</span>
          <span className={styles.separator}>/</span>
          <Link to="/admin/recruitment" className={styles.crumbLink}>
            Recruitment
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>{isEdit ? 'Edit Candidate' : 'Add Candidate'}</span>
        </nav>

        {/* Full-Page Mode Card */}
        <div className={styles.pageContainer}>
          <div className={styles.pageCard}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>{isEdit ? 'Edit Candidate Profile' : 'Add New Candidate'}</h1>
              </div>
              <div className={styles.pageHeaderActions}>
                <button
                  type="button"
                  className={styles.pageBackBtn}
                  onClick={() => navigate('/admin/recruitment')}
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              </div>
            </div>

            {/* Form Wrapped in AllSectionsWrapper (3 Grouped Cards) */}
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className={styles.allSectionsWrapper}>
                
                {/* ========================================================
                    CARD 1: Basic Info (Combines Step 1 & Step 2)
                    ======================================================== */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Basic Info</h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Field: Candidate ID (Auto-Generated) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="id" className={styles.label}>
                        Candidate ID
                      </label>
                      <input
                        id="id"
                        name="id"
                        type="text"
                        className={styles.input}
                        style={{
                          backgroundColor: 'var(--surface-alt, #f8fafc)',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px'
                        }}
                        value={formData.id}
                        readOnly
                      />
                      <span className={styles.fieldHint}>
                        Auto-generated unique candidate ID.
                      </span>
                    </div>

                    {/* Field: Candidate Name (Full Name) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>
                        Candidate Name (Full Name)
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                        placeholder="Enter full name (e.g. Ramesh Kumar Sharma)"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                    </div>

                    {/* Field: Registration Date (Auto Date) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="registrationDate" className={styles.label}>
                        Registration Date
                      </label>
                      <input
                        id="registrationDate"
                        name="registrationDate"
                        type="date"
                        className={styles.input}
                        value={formData.registrationDate}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: Job Category (Multi-Select Dropdown) */}
                    <div className={styles.formGroup} ref={categoryDropdownRef}>
                      <label htmlFor="jobCategoryTrigger" className={styles.label}>
                        <span>Job Category</span>
                        {selectedCategories.length > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--primary, #2563eb)', fontWeight: 600 }}>
                            ({selectedCategories.length} selected)
                          </span>
                        )}
                      </label>

                      <div className={styles.multiSelectContainer}>
                        <div
                          id="jobCategoryTrigger"
                          tabIndex={0}
                          role="combobox"
                          aria-expanded={isCategoryDropdownOpen}
                          aria-haspopup="listbox"
                          className={`${styles.multiSelectTrigger} ${isCategoryDropdownOpen ? styles.multiSelectTriggerOpen : ''}`}
                          onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setIsCategoryDropdownOpen((prev) => !prev);
                            }
                          }}
                        >
                          <div className={styles.multiSelectValuesWrap}>
                            {selectedCategories.length === 0 ? (
                              <span className={styles.multiSelectPlaceholder}>Select job categories...</span>
                            ) : (
                              <>
                                {selectedCategories.slice(0, 2).map((cat) => (
                                  <span key={cat} className={styles.multiSelectTag} title={cat}>
                                    <span>{cat}</span>
                                    <button
                                      type="button"
                                      className={styles.multiSelectTagRemove}
                                      onClick={(e) => handleRemoveSingleCategory(e, cat)}
                                      aria-label={`Remove ${cat}`}
                                    >
                                      <X size={10} />
                                    </button>
                                  </span>
                                ))}
                                {selectedCategories.length > 2 && (
                                  <span className={styles.multiSelectMoreBadge}>
                                    +{selectedCategories.length - 2} more
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          <div className={styles.multiSelectActionsRight}>
                            {selectedCategories.length > 0 && (
                              <button
                                type="button"
                                className={styles.multiSelectClearBtn}
                                onClick={handleCategoryTriggerClear}
                                title="Clear all selected"
                                aria-label="Clear all categories"
                              >
                                <X size={13} />
                              </button>
                            )}
                            <ChevronDown
                              size={16}
                              className={isCategoryDropdownOpen ? styles.chevronRotated : styles.chevron}
                            />
                          </div>
                        </div>

                        {/* Dropdown Menu Popover */}
                        {isCategoryDropdownOpen && (
                          <div className={styles.multiSelectDropdownMenu}>
                            {/* Filter Search Input */}
                            <div className={styles.dropdownSearchWrap}>
                              <Search size={14} color="#94a3b8" />
                              <input
                                type="text"
                                className={styles.dropdownSearchInput}
                                placeholder="Filter job categories..."
                                value={categorySearchTerm}
                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              {categorySearchTerm && (
                                <button
                                  type="button"
                                  className={styles.clearSearchBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategorySearchTerm('');
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
                                {selectedCategories.length} of {availableCategories.length} selected
                              </span>
                              <div className={styles.dropdownControlActions}>
                                <button
                                  type="button"
                                  className={styles.dropdownQuickBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAllCategories();
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
                                    handleClearAllCategories();
                                  }}
                                >
                                  Clear All
                                </button>
                              </div>
                            </div>

                            {/* Scrollable Checkbox List */}
                            <div className={styles.dropdownList}>
                              {filteredCategories.length === 0 ? (
                                <div className={styles.noItemsFound}>
                                  No job categories matching "{categorySearchTerm}"
                                </div>
                              ) : (
                                filteredCategories.map((cat) => {
                                  const isChecked = selectedCategories.includes(cat);
                                  return (
                                    <div
                                      key={cat}
                                      className={`${styles.dropdownOption} ${isChecked ? styles.dropdownOptionSelected : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCategoryToggle(cat);
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        className={styles.dropdownCheckbox}
                                        checked={isChecked}
                                        onChange={() => {}}
                                        onClick={(e) => e.stopPropagation()}
                                        onChangeCapture={() => handleCategoryToggle(cat)}
                                      />
                                      <span className={styles.dropdownOptionText}>{cat}</span>
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
                                  setIsCategoryDropdownOpen(false);
                                }}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {errors.jobCategory && (
                        <span className={styles.errorText}>{errors.jobCategory}</span>
                      )}
                    </div>

                    {/* Field: Applied For (Job Designation) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="appliedFor" className={styles.label}>
                        Applied For (Job Designation)
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="appliedFor"
                        name="appliedFor"
                        type="text"
                        className={`${styles.input} ${errors.appliedFor ? styles.inputError : ''}`}
                        placeholder="e.g. Security Guard / Supervisor"
                        value={formData.appliedFor}
                        onChange={handleChange}
                        required
                      />
                      {errors.appliedFor && (
                        <span className={styles.errorText}>{errors.appliedFor}</span>
                      )}
                    </div>

                    {/* Field: Source */}
                    <div className={styles.formGroup}>
                      <label htmlFor="source" className={styles.label}>
                        Source
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="source"
                          name="source"
                          className={styles.select}
                          value={formData.source}
                          onChange={handleChange}
                        >
                          {RECRUITMENT_SOURCES.map((src) => (
                            <option key={src} value={src}>{src}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Field: Mobile Number (Primary) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="mobile" className={styles.label}>
                        Mobile Number (Primary)
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        maxLength={10}
                        className={`${styles.input} ${errors.mobile ? styles.inputError : ''}`}
                        placeholder="10-digit primary mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                      {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}
                    </div>

                    {/* Field: Mobile Number (Alternate) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="altMobile" className={styles.label}>
                        Alternate Mobile Number
                      </label>
                      <input
                        id="altMobile"
                        name="altMobile"
                        type="tel"
                        maxLength={10}
                        className={styles.input}
                        placeholder="Optional alternate mobile"
                        value={formData.altMobile}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: WhatsApp Number */}
                    <div className={styles.formGroup}>
                      <label htmlFor="whatsapp" className={styles.label}>
                        <span>WhatsApp Number</span>
                        <button
                          type="button"
                          onClick={handleCopyMobileToWhatsApp}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary, #2563eb)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Same as Mobile
                        </button>
                      </label>
                      <input
                        id="whatsapp"
                        name="whatsapp"
                        type="tel"
                        maxLength={10}
                        className={styles.input}
                        placeholder="WhatsApp contact"
                        value={formData.whatsapp}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: Email ID */}
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>
                        Email ID
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className={styles.input}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: Present Address */}
                    <div className={styles.formGroup}>
                      <label htmlFor="address" className={styles.label}>
                        Present Address (Street / Area)
                      </label>
                      <input
                        id="address"
                        name="address"
                        type="text"
                        className={styles.input}
                        placeholder="Enter house/street/area details"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: City */}
                    <div className={styles.formGroup}>
                      <label htmlFor="city" className={styles.label}>
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Noida / Gurugram"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: State */}
                    <div className={styles.formGroup}>
                      <label htmlFor="state" className={styles.label}>
                        State
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="state"
                          name="state"
                          className={styles.select}
                          value={formData.state}
                          onChange={handleChange}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Field: Preferred Location */}
                    <div className={styles.formGroup}>
                      <label htmlFor="preferredLocation" className={styles.label}>
                        Preferred Location (Job Location)
                      </label>
                      <input
                        id="preferredLocation"
                        name="preferredLocation"
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Noida Sector 62 / Greater Noida"
                        value={formData.preferredLocation}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: Candidate Status */}
                    <div className={styles.formGroup}>
                      <label htmlFor="status" className={styles.label}>
                        Candidate Status
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="status"
                          name="status"
                          className={styles.select}
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="applied">Applied</option>
                          <option value="selected">Selected</option>
                          <option value="on_hold">On Hold</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================
                    CARD 2: Experience & Salary Details (Combines Step 3 & Step 4)
                    ======================================================== */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Experience & Salary Details</h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Field: Experience (Fresher / Experienced) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="experience" className={styles.label}>
                        Experience Level
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="experience"
                          name="experience"
                          className={styles.select}
                          value={formData.experience}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Fresher') {
                              setFormData((p) => ({
                                ...p,
                                experience: 'Fresher',
                                totalExperienceYears: 0,
                                lastCompany: '',
                                lastSalary: ''
                              }));
                            } else {
                              setFormData((p) => ({ ...p, experience: 'Experienced' }));
                            }
                          }}
                        >
                          <option value="Experienced">Experienced</option>
                          <option value="Fresher">Fresher</option>
                        </select>
                      </div>
                    </div>

                    {/* Field: Total Experience (Years) */}
                    {formData.experience === 'Experienced' ? (
                      <>
                        <div className={styles.formGroup}>
                          <label htmlFor="totalExperienceYears" className={styles.label}>
                            Total Experience (Years)
                          </label>
                          <input
                            id="totalExperienceYears"
                            name="totalExperienceYears"
                            type="number"
                            min="0"
                            max="40"
                            className={styles.input}
                            placeholder="Years of experience"
                            value={formData.totalExperienceYears}
                            onChange={handleChange}
                          />
                        </div>

                        {/* Field: Last Company */}
                        <div className={styles.formGroup}>
                          <label htmlFor="lastCompany" className={styles.label}>
                            Last Company (Previous Employer)
                          </label>
                          <input
                            id="lastCompany"
                            name="lastCompany"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. G4S / SIS / Peregrine"
                            value={formData.lastCompany}
                            onChange={handleChange}
                          />
                        </div>

                        {/* Field: Last Salary */}
                        <div className={styles.formGroup}>
                          <label htmlFor="lastSalary" className={styles.label}>
                            Last Salary (Previous Salary ₹ / Month)
                          </label>
                          <input
                            id="lastSalary"
                            name="lastSalary"
                            type="number"
                            min="0"
                            className={styles.input}
                            placeholder="e.g. 16500"
                            value={formData.lastSalary}
                            onChange={handleChange}
                          />
                        </div>
                      </>
                    ) : (
                      <div className={`${styles.formGroup} ${styles.span2}`} style={{ justifyContent: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
                          Candidate is registered as Fresher (no previous employer required).
                        </span>
                      </div>
                    )}

                    {/* Field: Expected Salary */}
                    <div className={styles.formGroup}>
                      <label htmlFor="expectedSalary" className={styles.label}>
                        Expected Salary (₹ / Month)
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="expectedSalary"
                        name="expectedSalary"
                        type="number"
                        min="0"
                        className={`${styles.input} ${errors.expectedSalary ? styles.inputError : ''}`}
                        placeholder="e.g. 19000"
                        value={formData.expectedSalary}
                        onChange={handleChange}
                        required
                      />
                      {errors.expectedSalary && (
                        <span className={styles.errorText}>{errors.expectedSalary}</span>
                      )}
                    </div>

                    {/* Field: Minimum Expected Salary */}
                    <div className={styles.formGroup}>
                      <label htmlFor="minExpectedSalary" className={styles.label}>
                        <span>Minimum Expected Salary (₹)</span>
                        <span className={styles.fieldHint}>Lowest floor</span>
                      </label>
                      <input
                        id="minExpectedSalary"
                        name="minExpectedSalary"
                        type="number"
                        min="0"
                        className={styles.input}
                        placeholder="e.g. 17500"
                        value={formData.minExpectedSalary}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Field: Maximum Expected Salary */}
                    <div className={styles.formGroup}>
                      <label htmlFor="maxExpectedSalary" className={styles.label}>
                        <span>Maximum Expected Salary (₹)</span>
                        <span className={styles.fieldHint}>Upper ceiling</span>
                      </label>
                      <input
                        id="maxExpectedSalary"
                        name="maxExpectedSalary"
                        type="number"
                        min="0"
                        className={styles.input}
                        placeholder="e.g. 21000"
                        value={formData.maxExpectedSalary}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* ========================================================
                    CARD 3: Skills, Documents & Remarks (Combines Step 5, 6, 7)
                    ======================================================== */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Skills, Documents & Remarks</h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Skills (Multiple Skills) - Spans Full Width */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>Skills (Multiple Skills)</label>
                      <div className={styles.skillsContainer}>
                        <div className={styles.skillsPillsWrap}>
                          {COMMON_SKILLS.map((skill) => {
                            const isSelected = formData.skills.includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                className={`${styles.skillPill} ${isSelected ? styles.skillPillSelected : ''}`}
                                onClick={() => handleToggleSkill(skill)}
                              >
                                {isSelected && <Check size={13} />}
                                <span>{skill}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className={styles.addCustomSkillRow}>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Add other skill..."
                            name="customSkill"
                            value={formData.customSkill}
                            onChange={handleChange}
                            onKeyDown={handleAddCustomSkill}
                          />
                          <button
                            type="button"
                            className={styles.addSkillBtn}
                            onClick={handleAddCustomSkill}
                          >
                            Add Skill
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Field: Candidate Photo (JPG / PNG) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="photoUpload" className={styles.label}>
                        Candidate Photo (JPG / PNG)
                      </label>
                      <input
                        id="photoUpload"
                        name="photoUpload"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className={styles.fileInput}
                        onChange={handlePhotoUpload}
                      />
                      {formData.photo && (
                        <div className={styles.filePreviewRow}>
                          <img
                            src={formData.photo}
                            alt="Candidate"
                            className={styles.filePreviewThumb}
                          />
                          <span className={styles.fileName}>
                            {formData.photoName || 'Candidate_Photo.jpg'}
                          </span>
                          <button
                            type="button"
                            className={styles.removeFileBtn}
                            onClick={() => setFormData((p) => ({ ...p, photo: '', photoName: '' }))}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Field: Resume Upload (PDF / DOC) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="resumeUpload" className={styles.label}>
                        Resume Upload (PDF / DOC)
                      </label>
                      <input
                        id="resumeUpload"
                        name="resumeUpload"
                        type="file"
                        accept=".pdf, .doc, .docx"
                        className={styles.fileInput}
                        onChange={handleResumeUpload}
                      />
                      {formData.resumeName && (
                        <div className={styles.filePreviewRow}>
                          <FileText size={20} style={{ color: 'var(--primary, #2563eb)' }} />
                          <div>
                            <span className={styles.fileName} style={{ margin: 0, fontWeight: 600 }}>
                              {formData.resumeName}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                              {formData.resumeSize}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.removeFileBtn}
                            onClick={() => setFormData((p) => ({ ...p, resumeUrl: '', resumeName: '', resumeSize: '' }))}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Field: Remarks (HR Notes) */}
                    <div className={styles.formGroup}>
                      <label htmlFor="remarks" className={styles.label}>
                        Remarks (HR Notes)
                      </label>
                      <textarea
                        id="remarks"
                        name="remarks"
                        rows="3"
                        className={styles.textarea}
                        placeholder="Enter remarks / HR notes regarding the candidate..."
                        value={formData.remarks}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Section Footer */}
                <div className={styles.sectionFooter}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => navigate('/admin/recruitment')}
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
                      isEdit ? 'Save Changes' : 'Add Candidate'
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
