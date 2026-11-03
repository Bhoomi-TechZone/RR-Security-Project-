import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  UserCheck,
  Building2,
  Shirt,
  ShieldCheck,
  Sparkles,
  Loader2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import {
  getStoredCandidates,
  updateCandidateStatus,
  JOB_CATEGORIES
} from '../../data/recruitmentData';
import {
  generateNextOnboardingId,
  addOnboardingCandidate,
  UNIFORM_SHIRT_SIZES,
  UNIFORM_TROUSER_SIZES,
  BOOT_SIZES
} from '../../data/onboardingData';
import styles from './AddOnboarding.module.css';

const SHIFT_OPTIONS = [
  'Day Shift (08:00 AM - 08:00 PM)',
  'Night Shift (08:00 PM - 08:00 AM)',
  'Rotational 8hr Shift (A/B/C)',
  'General Shift (09:30 AM - 06:30 PM)',
];

export default function AddOnboarding() {
  const navigate = useNavigate();
  const autoOnboardingId = useMemo(() => generateNextOnboardingId(), []);

  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Load candidates eligible for onboarding (selected or applied)
  useEffect(() => {
    const list = getStoredCandidates();
    const eligible = list.filter((c) => c.status === 'selected' || c.status === 'applied');
    setCandidates(eligible);
  }, []);

  const [formData, setFormData] = useState({
    id: autoOnboardingId,
    candidateId: 'DIRECT-WALKIN',
    candidateName: '',
    mobile: '',
    email: '',
    jobCategory: 'Security',
    appliedFor: 'Security Guard',
    offeredSalary: '19000',
    proposedJoiningDate: new Date().toISOString().split('T')[0],
    assignedClient: 'DLF CyberCity Tech Park',
    assignedSite: 'Main Gate Pedestrian Post',
    assignedShift: 'Day Shift (08:00 AM - 08:00 PM)',
    shirtSize: 'M (40)',
    trouserSize: '32',
    bootSize: '8',
    capIssued: true,
    badgeIssued: true,
    whistleIssued: true,
    torchIssued: false,
    aadhaarNumber: '',
    panNumber: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    policeVerificationStatus: 'Slip Submitted',
    notes: ''
  });

  // When user selects a candidate from Recruitment
  const handleCandidateSelect = (candId) => {
    setSelectedCandidateId(candId);
    if (!candId) {
      setFormData((prev) => ({
        ...prev,
        candidateId: 'DIRECT-WALKIN',
        candidateName: '',
        mobile: '',
        email: '',
        appliedFor: 'Security Guard'
      }));
      return;
    }

    const cand = candidates.find((c) => c.id === candId);
    if (cand) {
      setFormData((prev) => ({
        ...prev,
        candidateId: cand.id,
        candidateName: cand.name || '',
        mobile: cand.mobile || '',
        email: cand.email || '',
        jobCategory: cand.jobCategory || 'Security',
        appliedFor: cand.appliedFor || 'Security Guard',
        offeredSalary: String(cand.expectedSalary || cand.lastSalary || 19000),
        notes: `Imported from recruitment: ${cand.id}. ${cand.remarks || ''}`
      }));
      showToast(`Selected "${cand.name}" details loaded!`, 'info');
    }
  };

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
    if (!formData.assignedClient.trim()) newErrors.assignedClient = 'Assigned client is required.';
    if (!formData.offeredSalary) newErrors.offeredSalary = 'Offered salary is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix highlighted errors before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = addOnboardingCandidate(formData);

      // If imported from recruitment, update status in recruitment
      if (selectedCandidateId) {
        updateCandidateStatus(selectedCandidateId, 'moved_to_onboarding');
      }

      showToast(`Candidate "${created.candidateName}" added to Onboarding!`, 'success');
      setTimeout(() => {
        navigate('/admin/onboarding');
      }, 700);
    } catch (err) {
      console.error('Error adding onboarding:', err);
      showToast('Failed to save onboarding record.', 'error');
      setIsSubmitting(false);
    }
  };

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
          <span className={styles.crumbActive}>New Onboard</span>
        </nav>

        {/* Main Card */}
        <div className={styles.pageContainer}>
          <div className={styles.pageCard}>
            {/* Header */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>New Candidate Onboarding</h1>
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

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className={styles.allSectionsWrapper}>

                {/* ========================================================
                    CARD 1: Candidate Information
                    ======================================================== */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <UserCheck size={18} style={{ color: '#2563eb' }} />
                      Candidate Identification & Source
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Onboarding ID (Auto Generated) */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Onboarding ID</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={formData.id}
                        readOnly
                        style={{ fontWeight: 700, fontFamily: 'monospace' }}
                      />
                      <span className={styles.fieldHint}>Auto-generated onboarding reference ID.</span>
                    </div>

                    {/* Import from Recruitment Dropdown */}
                    <div className={`${styles.formGroup} ${styles.span2}`}>
                      <label className={styles.label}>
                        <span>Select Candidate from Recruitment (Optional)</span>
                        <span className={styles.fieldHint}>Auto-fills profile</span>
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          className={styles.select}
                          value={selectedCandidateId}
                          onChange={(e) => handleCandidateSelect(e.target.value)}
                        >
                          <option value="">— Direct Entry / Walk-in (Fill manually) —</option>
                          {candidates.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.id}) • {c.appliedFor} • Status: {c.status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Candidate Name */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Candidate Full Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        name="candidateName"
                        className={`${styles.input} ${errors.candidateName ? styles.inputError : ''}`}
                        placeholder="e.g. Ramesh Kumar Sharma"
                        value={formData.candidateName}
                        onChange={handleChange}
                        required
                      />
                      {errors.candidateName && <span className={styles.errorText}>{errors.candidateName}</span>}
                    </div>

                    {/* Mobile Number */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Primary Mobile Number <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        maxLength={10}
                        className={`${styles.input} ${errors.mobile ? styles.inputError : ''}`}
                        placeholder="10-digit primary mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                      />
                      {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}
                    </div>

                    {/* Email */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email ID</label>
                      <input
                        type="email"
                        name="email"
                        className={styles.input}
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Job Category */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Job Category</label>
                      <div className={styles.selectWrapper}>
                        <select
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

                    {/* Designation */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Designation / Role</label>
                      <input
                        type="text"
                        name="appliedFor"
                        className={styles.input}
                        placeholder="e.g. Security Guard / Armed Guard"
                        value={formData.appliedFor}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Offered Salary */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Offered Gross Salary (₹) <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        name="offeredSalary"
                        min="0"
                        className={`${styles.input} ${errors.offeredSalary ? styles.inputError : ''}`}
                        placeholder="e.g. 19000"
                        value={formData.offeredSalary}
                        onChange={handleChange}
                        required
                      />
                      {errors.offeredSalary && <span className={styles.errorText}>{errors.offeredSalary}</span>}
                    </div>
                  </div>
                </div>

                {/* ========================================================
                    CARD 2: Client Deployment & Shift Assignment
                    ======================================================== */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Building2 size={18} style={{ color: '#2563eb' }} />
                      Client Site Deployment & Joining Details
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Assigned Client */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Assigned Client Company <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        name="assignedClient"
                        className={`${styles.input} ${errors.assignedClient ? styles.inputError : ''}`}
                        placeholder="e.g. DLF CyberCity Tech Park"
                        value={formData.assignedClient}
                        onChange={handleChange}
                        required
                      />
                      {errors.assignedClient && <span className={styles.errorText}>{errors.assignedClient}</span>}
                    </div>

                    {/* Deployment Site / Post */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Deployment Site / Post</label>
                      <input
                        type="text"
                        name="assignedSite"
                        className={styles.input}
                        placeholder="e.g. Gate 1 Turnstile / Tower 4"
                        value={formData.assignedSite}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Shift Duty */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Assigned Shift Duty</label>
                      <div className={styles.selectWrapper}>
                        <select
                          name="assignedShift"
                          className={styles.select}
                          value={formData.assignedShift}
                          onChange={handleChange}
                        >
                          {SHIFT_OPTIONS.map((sh) => (
                            <option key={sh} value={sh}>{sh}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Proposed Joining Date */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Proposed Joining Date</label>
                      <input
                        type="date"
                        name="proposedJoiningDate"
                        className={styles.input}
                        value={formData.proposedJoiningDate}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Police Verification */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Police Verification Status</label>
                      <div className={styles.selectWrapper}>
                        <select
                          name="policeVerificationStatus"
                          className={styles.select}
                          value={formData.policeVerificationStatus}
                          onChange={handleChange}
                        >
                          <option value="Slip Submitted">Receipt / Slip Submitted</option>
                          <option value="Verified">✓ Cleared & Verified</option>
                          <option value="Pending">Pending Application</option>
                        </select>
                      </div>
                    </div>

                    {/* Bank Name */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        className={styles.input}
                        placeholder="e.g. HDFC Bank / SBI"
                        value={formData.bankName}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Bank Account Number */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Bank Account Number</label>
                      <input
                        type="text"
                        name="bankAccount"
                        className={styles.input}
                        placeholder="e.g. 501002918271"
                        value={formData.bankAccount}
                        onChange={handleChange}
                      />
                    </div>

                    {/* Bank IFSC */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Bank IFSC Code</label>
                      <input
                        type="text"
                        name="bankIfsc"
                        className={styles.input}
                        placeholder="e.g. HDFC0001824"
                        value={formData.bankIfsc}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* ========================================================
                    CARD 3: Uniform Sizing & Kit Allocation
                    ======================================================== */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Shirt size={18} style={{ color: '#2563eb' }} />
                      Uniform Sizing & Security Equipment Kit
                    </h3>
                  </div>

                  <div className={styles.grid}>
                    {/* Uniform Shirt Size */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Uniform Shirt Size</label>
                      <div className={styles.selectWrapper}>
                        <select
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

                    {/* Trouser Waist Size */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Trouser Waist Size</label>
                      <div className={styles.selectWrapper}>
                        <select
                          name="trouserSize"
                          className={styles.select}
                          value={formData.trouserSize}
                          onChange={handleChange}
                        >
                          {UNIFORM_TROUSER_SIZES.map((sz) => (
                            <option key={sz} value={sz}>{sz} Inches</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Boot Size */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Safety DMS Boots Size</label>
                      <div className={styles.selectWrapper}>
                        <select
                          name="bootSize"
                          className={styles.select}
                          value={formData.bootSize}
                          onChange={handleChange}
                        >
                          {BOOT_SIZES.map((sz) => (
                            <option key={sz} value={sz}>Size {sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kit Checkboxes */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>Equipment Kit Issuance Checklist</label>
                      <div className={styles.checkboxGrid}>
                        <label className={styles.checkItem}>
                          <input
                            type="checkbox"
                            name="capIssued"
                            checked={formData.capIssued}
                            onChange={handleChange}
                          />
                          <span>Security Beret / Peak Cap</span>
                        </label>

                        <label className={styles.checkItem}>
                          <input
                            type="checkbox"
                            name="badgeIssued"
                            checked={formData.badgeIssued}
                            onChange={handleChange}
                          />
                          <span>Chest Badge & Name Plate</span>
                        </label>

                        <label className={styles.checkItem}>
                          <input
                            type="checkbox"
                            name="whistleIssued"
                            checked={formData.whistleIssued}
                            onChange={handleChange}
                          />
                          <span>Whistle & Lanyard Cord</span>
                        </label>

                        <label className={styles.checkItem}>
                          <input
                            type="checkbox"
                            name="torchIssued"
                            checked={formData.torchIssued}
                            onChange={handleChange}
                          />
                          <span>Night Baton / Torch</span>
                        </label>
                      </div>
                    </div>

                    {/* Remarks / Notes */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label className={styles.label}>Joining Notes / Remarks</label>
                      <textarea
                        name="notes"
                        rows="3"
                        className={styles.textarea}
                        placeholder="Enter onboarding remarks, site instructions, or document verification notes..."
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
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Saving Onboarding...</span>
                      </>
                    ) : (
                      'Save & Onboard Candidate'
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

