import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  UserCheck,
  Building2,
  Shirt,
  ShieldCheck,
  Sparkles,
  Loader2,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import {
  getStoredOnboarding,
  updateOnboardingCandidate,
  ONBOARDING_STAGES,
  UNIFORM_SHIRT_SIZES,
  UNIFORM_TROUSER_SIZES,
  BOOT_SIZES
} from '../../data/onboardingData';
import onboardingService from '../../services/onboardingService';
import { JOB_CATEGORIES } from '../../data/recruitmentData';
import styles from './AddOnboarding.module.css';

const SHIFT_OPTIONS = [
  'Day Shift (08:00 AM - 08:00 PM)',
  'Night Shift (08:00 PM - 08:00 AM)',
  'Rotational 8hr Shift (A/B/C)',
  'General Shift (09:30 AM - 06:30 PM)',
];

export default function EditOnboarding() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  const [formData, setFormData] = useState({
    id: '',
    candidateId: '',
    candidateName: '',
    mobile: '',
    email: '',
    jobCategory: 'Security',
    appliedFor: 'Security Guard',
    offeredSalary: '19000',
    proposedJoiningDate: '',
    assignedClient: '',
    assignedSite: '',
    assignedShift: 'Day Shift (08:00 AM - 08:00 PM)',
    shirtSize: 'M (40)',
    trouserSize: '32',
    bootSize: '8',
    capIssued: false,
    badgeIssued: false,
    whistleIssued: false,
    torchIssued: false,
    stage: 'offer_accepted',
    notes: ''
  });

  useEffect(() => {
    let isMounted = true;
    const populate = (found) => {
      if (!isMounted || !found) return;
      setCandidate(found);
      setFormData({
        id: found.id || id,
        candidateId: found.candidateId || '',
        candidateName: found.candidateName || found.name || '',
        mobile: found.mobile || '',
        email: found.email || '',
        jobCategory: found.jobCategory || 'Security',
        appliedFor: found.appliedFor || found.offeredDesignation || 'Security Guard',
        offeredSalary: String(found.offeredSalary !== undefined ? found.offeredSalary : 19000),
        proposedJoiningDate: found.proposedJoiningDate || '',
        assignedClient: found.assignedClient || '',
        assignedSite: found.assignedSite || '',
        assignedShift: found.assignedShift || 'Day Shift (08:00 AM - 08:00 PM)',
        shirtSize: found.uniformKit?.shirtSize || 'M (40)',
        trouserSize: found.uniformKit?.trouserSize || '32',
        bootSize: found.uniformKit?.bootSize || '8',
        capIssued: Boolean(found.uniformKit?.capIssued),
        badgeIssued: Boolean(found.uniformKit?.badgeIssued),
        whistleIssued: Boolean(found.uniformKit?.whistleIssued),
        torchIssued: Boolean(found.uniformKit?.torchIssued),
        stage: found.stage || 'offer_accepted',
        notes: found.notes || ''
      });
      setLoading(false);
    };

    const list = getStoredOnboarding(currentCompanyId);
    const cached = list.find((item) => item.id === id);
    if (cached) populate(cached);

    onboardingService.getOnboardingById(id, currentCompanyId)
      .then((live) => {
        if (live) populate(live);
      })
      .catch(() => {
        if (!cached && isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [id, currentCompanyId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.candidateName.trim()) newErrors.candidateName = 'Candidate name is required.';
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required.';
    if (!formData.appliedFor.trim()) newErrors.appliedFor = 'Designation/Role is required.';
    if (!formData.offeredSalary) newErrors.offeredSalary = 'Offered salary is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix highlighted errors before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedFields = {
        candidateName: formData.candidateName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        jobCategory: formData.jobCategory,
        appliedFor: formData.appliedFor.trim(),
        offeredDesignation: formData.appliedFor.trim(),
        offeredSalary: Number(formData.offeredSalary || 0),
        proposedJoiningDate: formData.proposedJoiningDate,
        assignedClient: formData.assignedClient.trim(),
        assignedSite: formData.assignedSite.trim(),
        assignedShift: formData.assignedShift.trim(),
        stage: formData.stage,
        notes: formData.notes.trim(),
        uniformKit: {
          ...(candidate?.uniformKit || {}),
          shirtSize: formData.shirtSize,
          trouserSize: formData.trouserSize,
          bootSize: formData.bootSize,
          capIssued: formData.capIssued,
          badgeIssued: formData.badgeIssued,
          whistleIssued: formData.whistleIssued,
          torchIssued: formData.torchIssued
        }
      };

      await updateOnboardingCandidate(id, updatedFields, currentCompanyId);
      showToast(`Onboarding record for "${formData.candidateName}" updated successfully!`, 'success');
      setTimeout(() => {
        navigate('/admin/onboarding');
      }, 700);
    } catch (err) {
      console.error('Error updating onboarding:', err);
      showToast('Failed to update onboarding record.', 'error');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.container} style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader2 size={32} className={styles.spinner} style={{ color: 'var(--primary, #2563eb)' }} />
          <p style={{ marginTop: '12px', color: '#64748b' }}>Loading onboarding details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!candidate) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2>Onboarding Record Not Found</h2>
            <p style={{ color: 'var(--text-secondary, #64748b)' }}>
              No onboarding record found for reference ID "{id}".
            </p>
            <Link
              to="/admin/onboarding"
              className={styles.pageBackBtn}
              style={{ display: 'inline-flex', marginTop: '16px' }}
            >
              <ChevronLeft size={16} />
              <span>Back to Onboarding Pipeline</span>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'success' })}
          />
        )}

        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/admin/dashboard" className={styles.crumbLink}>Dashboard</Link>
          <span className={styles.separator}>/</span>
          <Link to="/admin/onboarding" className={styles.crumbLink}>Onboarding</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Edit Onboarding</span>
        </nav>

        {/* Main Card */}
        <div className={styles.pageContainer}>
          <div className={styles.pageCard}>
            {/* Header */}
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Edit Onboarding Details</h1>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                  {formData.candidateName} • Ref ID: <strong style={{ color: '#0f172a' }}>{formData.id}</strong>
                  {formData.candidateId ? ` • Recruitment Ref: ${formData.candidateId}` : ''}
                </p>
              </div>
              <div className={styles.pageHeaderActions}>
                <button
                  type="button"
                  className={styles.pageBackBtn}
                  onClick={() => navigate('/admin/onboarding')}
                  disabled={isSubmitting}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className={styles.allSectionsWrapper}>

                {/* Section 1: Candidate Identity & Contact */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <UserCheck size={18} style={{ color: '#2563eb' }} />
                      <span>Candidate Identity & Contact</span>
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Onboarding ID */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Onboarding Ref ID</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.id}
                        readOnly
                        style={{ backgroundColor: 'var(--surface-alt, #f8fafc)', fontWeight: 700, fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Candidate Name */}
                    <div className={styles.formGroup}>
                      <label htmlFor="candidateName" className={styles.label}>
                        Candidate Name
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="candidateName"
                        name="candidateName"
                        type="text"
                        className={`${styles.input} ${errors.candidateName ? styles.inputError : ''}`}
                        value={formData.candidateName}
                        onChange={handleChange}
                        required
                      />
                      {errors.candidateName && <span className={styles.errorText}>{errors.candidateName}</span>}
                    </div>

                    {/* Contact Mobile */}
                    <div className={styles.formGroup}>
                      <label htmlFor="mobile" className={styles.label}>
                        Contact Mobile
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        maxLength={10}
                        className={`${styles.input} ${errors.mobile ? styles.inputError : ''}`}
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                      {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}
                    </div>

                    {/* Email ID */}
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>Email ID</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className={styles.input}
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Job Category */}
                    <div className={styles.formGroup}>
                      <label htmlFor="jobCategory" className={styles.label}>Job Category</label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="jobCategory"
                          name="jobCategory"
                          className={styles.select}
                          value={formData.jobCategory}
                          onChange={handleChange}
                        >
                          {JOB_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Designation / Role */}
                    <div className={styles.formGroup}>
                      <label htmlFor="appliedFor" className={styles.label}>
                        Designation / Role
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="appliedFor"
                        name="appliedFor"
                        type="text"
                        className={`${styles.input} ${errors.appliedFor ? styles.inputError : ''}`}
                        value={formData.appliedFor}
                        onChange={handleChange}
                        required
                      />
                      {errors.appliedFor && <span className={styles.errorText}>{errors.appliedFor}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Deployment & Compensation */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Building2 size={18} style={{ color: '#059669' }} />
                      <span>Deployment, Client & Compensation</span>
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Assigned Client */}
                    <div className={styles.formGroup}>
                      <label htmlFor="assignedClient" className={styles.label}>
                        Assigned Client
                      </label>
                      <input
                        id="assignedClient"
                        name="assignedClient"
                        type="text"
                        className={styles.input}
                        placeholder="e.g. DLF CyberCity Tech Park"
                        value={formData.assignedClient}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Assigned Site */}
                    <div className={styles.formGroup}>
                      <label htmlFor="assignedSite" className={styles.label}>
                        Assigned Site
                      </label>
                      <input
                        id="assignedSite"
                        name="assignedSite"
                        type="text"
                        className={styles.input}
                        placeholder="e.g. Tower 4 Central Gate Post"
                        value={formData.assignedSite}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Assigned Shift */}
                    <div className={styles.formGroup}>
                      <label htmlFor="assignedShift" className={styles.label}>
                        Assigned Shift
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="assignedShift"
                          name="assignedShift"
                          className={styles.select}
                          value={formData.assignedShift}
                          onChange={handleChange}
                        >
                          {SHIFT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Proposed Joining Date */}
                    <div className={styles.formGroup}>
                      <label htmlFor="proposedJoiningDate" className={styles.label}>
                        Proposed Joining Date
                      </label>
                      <input
                        id="proposedJoiningDate"
                        name="proposedJoiningDate"
                        type="date"
                        className={styles.input}
                        value={formData.proposedJoiningDate}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Offered Salary */}
                    <div className={styles.formGroup}>
                      <label htmlFor="offeredSalary" className={styles.label}>
                        Offered Salary (₹ / Month)
                        <span className={styles.required}>*</span>
                      </label>
                      <input
                        id="offeredSalary"
                        name="offeredSalary"
                        type="number"
                        min="0"
                        className={`${styles.input} ${errors.offeredSalary ? styles.inputError : ''}`}
                        value={formData.offeredSalary}
                        onChange={handleChange}
                        required
                      />
                      {errors.offeredSalary && <span className={styles.errorText}>{errors.offeredSalary}</span>}
                    </div>

                    {/* Onboarding Stage */}
                    <div className={styles.formGroup}>
                      <label htmlFor="stage" className={styles.label}>
                        Current Stage
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="stage"
                          name="stage"
                          className={styles.select}
                          value={formData.stage}
                          onChange={handleChange}
                        >
                          {ONBOARDING_STAGES.filter((s) => s.id !== 'all').map((st) => (
                            <option key={st.id} value={st.id}>{st.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Uniform Kit & Sizing */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Shirt size={18} style={{ color: '#d97706' }} />
                      <span>Uniform Kit & Sizing</span>
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Shirt Size */}
                    <div className={styles.formGroup}>
                      <label htmlFor="shirtSize" className={styles.label}>Shirt Size</label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="shirtSize"
                          name="shirtSize"
                          className={styles.select}
                          value={formData.shirtSize}
                          onChange={handleChange}
                        >
                          {UNIFORM_SHIRT_SIZES.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Trouser Size */}
                    <div className={styles.formGroup}>
                      <label htmlFor="trouserSize" className={styles.label}>Trouser Size</label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="trouserSize"
                          name="trouserSize"
                          className={styles.select}
                          value={formData.trouserSize}
                          onChange={handleChange}
                        >
                          {UNIFORM_TROUSER_SIZES.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Boot Size */}
                    <div className={styles.formGroup}>
                      <label htmlFor="bootSize" className={styles.label}>Boot Size</label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="bootSize"
                          name="bootSize"
                          className={styles.select}
                          value={formData.bootSize}
                          onChange={handleChange}
                        >
                          {BOOT_SIZES.map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kit Issued Checkboxes */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>Kit Items Issued</label>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            name="capIssued"
                            checked={formData.capIssued}
                            onChange={handleChange}
                            style={{ width: 16, height: 16, accentColor: 'var(--primary, #2563eb)' }}
                          />
                          <span>Cap Issued</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            name="badgeIssued"
                            checked={formData.badgeIssued}
                            onChange={handleChange}
                            style={{ width: 16, height: 16, accentColor: 'var(--primary, #2563eb)' }}
                          />
                          <span>Badge Issued</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            name="whistleIssued"
                            checked={formData.whistleIssued}
                            onChange={handleChange}
                            style={{ width: 16, height: 16, accentColor: 'var(--primary, #2563eb)' }}
                          />
                          <span>Whistle Issued</span>
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                          <input
                            type="checkbox"
                            name="torchIssued"
                            checked={formData.torchIssued}
                            onChange={handleChange}
                            style={{ width: 16, height: 16, accentColor: 'var(--primary, #2563eb)' }}
                          />
                          <span>Torch Issued</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Notes & Remarks */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <ShieldCheck size={18} style={{ color: '#475569' }} />
                      <span>Internal Notes & Remarks</span>
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="notes" className={styles.label}>HR Remarks & Notes</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        className={styles.textarea}
                        placeholder="Enter internal HR notes regarding deployment, document verification, or uniforms..."
                        value={formData.notes}
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
                    onClick={() => navigate('/admin/onboarding')}
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
                      'Save Changes'
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

