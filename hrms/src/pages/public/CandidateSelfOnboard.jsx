import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  CreditCard,
  FileText,
  Shirt,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Phone,
  Building2,
  Calendar,
  Lock,
  Loader2,
  MapPin,
  Check
} from 'lucide-react';
import {
  getOnboardingCandidateById,
  saveCandidateSelfOnboarding,
  UNIFORM_SHIRT_SIZES,
  BOOT_SIZES
} from '../../data/onboardingData';
import { getStoredCandidates } from '../../data/recruitmentData';
import onboardingService from '../../services/onboardingService';
import styles from './CandidateSelfOnboard.module.css';

const GENDERS = ['Male', 'Female', 'Other'];

export default function CandidateSelfOnboard() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiredInfo, setExpiredInfo] = useState({ candidateName: '', id: '' });
  const [errors, setErrors] = useState({});

  // Clean, focused 2-section state
  const [formData, setFormData] = useState({
    // Section 1: Basic Information
    name: '',
    fatherHusbandName: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    presentAddress: '',

    // Section 2: Documents & Bank Verification
    aadhaar: '',
    aadhaarFrontPhoto: '',
    aadhaarBackPhoto: '',
    pan: '',
    panPhoto: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    bankPassbookPhoto: '',
    employeePhoto: '',
    policeRefNo: '',
    policeSlipPhoto: '',
    shirtSize: 'M (40)',
    bootSize: '8',

    // Declaration
    declarationAccepted: false
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadCandidateData = async () => {
      let found = null;
      try {
        const live = await onboardingService.getPublicOnboardingById(id);
        if (live) found = live;
      } catch (err) {
        if (err.expired) {
          if (isMounted) {
            setIsExpired(true);
            setExpiredInfo({
              candidateName: err.candidateName || '',
              id: err.id || id
            });
            setLoading(false);
          }
          return;
        }
        // Fallback to local cache if offline or backend route unavailable
      }

      if (!found) {
        found = getOnboardingCandidateById(id);
      }

      if (found?.linkExpiresAt && new Date() > new Date(found.linkExpiresAt)) {
        if (isMounted) {
          setIsExpired(true);
          setExpiredInfo({
            candidateName: found.candidateName || found.name || '',
            id: found.id || id
          });
          setLoading(false);
        }
        return;
      }

      if (found && isMounted) {
        // Format address from candidate registration if presentAddress is not yet set
        let resolvedAddress = found.presentAddress || found.address || '';
        if (!resolvedAddress) {
          try {
            const candidates = getStoredCandidates();
            const cand = candidates.find(
              (c) => c.id === found.candidateId || c.name === (found.candidateName || found.name)
            );
            if (cand) {
              resolvedAddress =
                cand.presentAddress ||
                [cand.address, cand.city, cand.state ? `${cand.state}${cand.pincode ? ` - ${cand.pincode}` : ''}` : '']
                  .filter(Boolean)
                  .join(', ') ||
                cand.address ||
                '';
            }
          } catch (e) {
            // fallback ignore
          }
        }

        setCandidate(found);
        setFormData((prev) => ({
          ...prev,
          name: found.candidateName || found.name || '',
          fatherHusbandName: found.fatherHusbandName || found.fatherName || '',
          dob: found.dob || '',
          gender: found.gender || 'Male',
          mobile: found.mobile || '',
          presentAddress: resolvedAddress,

          aadhaar: found.aadhaar || found.documents?.aadhaar?.number || '',
          aadhaarFrontPhoto: found.documents?.aadhaar?.photoFront || '',
          aadhaarBackPhoto: found.documents?.aadhaar?.photoBack || '',
          pan: found.pan || found.documents?.pan?.number || '',
          panPhoto: found.documents?.pan?.photo || '',

          bankName: found.bankName || found.documents?.bankProof?.bankName || '',
          accountNumber: found.accountNumber || found.documents?.bankProof?.accountNumber || '',
          confirmAccountNumber: found.accountNumber || found.documents?.bankProof?.accountNumber || '',
          ifsc: found.ifsc || found.documents?.bankProof?.ifsc || '',
          bankPassbookPhoto: found.documents?.bankProof?.photo || '',

          employeePhoto: found.employeePhoto || found.photo || '',
          policeRefNo: found.documents?.policeVerification?.refNo || '',
          policeSlipPhoto: found.documents?.policeVerification?.photo || '',

          shirtSize: found.uniformKit?.shirtSize || 'M (40)',
          bootSize: found.uniformKit?.bootSize || '8'
        }));

        if (found.selfSubmitted) {
          setIsSubmittedSuccess(true);
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    loadCandidateData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        [field]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (!formData.fatherHusbandName.trim()) errs.fatherHusbandName = "Father's or husband's name is required";
    if (!formData.dob) errs.dob = 'Date of birth is required';
    if (!formData.presentAddress.trim()) errs.presentAddress = 'Current address is required';

    // Bank Validation
    if (!formData.accountNumber.trim()) {
      errs.accountNumber = 'Bank account number is required for salary credit';
    }
    if (formData.accountNumber && formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber) {
      errs.confirmAccountNumber = 'Account numbers do not match';
    }
    if (!formData.ifsc.trim()) {
      errs.ifsc = 'Bank IFSC code is required';
    }

    // Aadhaar Validation
    if (!formData.aadhaar.trim()) {
      errs.aadhaar = '12-digit Aadhaar number is required';
    }

    if (!formData.declarationAccepted) {
      errs.declarationAccepted = 'Please accept the declaration to proceed';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 220, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const submissionPayload = {
      ...formData,
      accountHolder: formData.name,
      permanentAddress: formData.presentAddress
    };

    try {
      await onboardingService.submitPublicOnboarding(candidate.id || id, submissionPayload);
    } catch (apiErr) {
      if (apiErr.expired) {
        setIsSubmitting(false);
        setIsExpired(true);
        setExpiredInfo({
          candidateName: candidate.candidateName || candidate.name || '',
          id: candidate.id || id
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      console.warn('Backend public submission error, saving locally:', apiErr.message);
    }

    saveCandidateSelfOnboarding(candidate.id || id, submissionPayload);
    setIsSubmitting(false);
    setIsSubmittedSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 size={32} className={styles.spin} />
        <p>Loading your onboarding verification portal...</p>
      </div>
    );
  }

  // Dedicated 24-Hour Expiration Screen
  if (isExpired) {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorCard} style={{ maxWidth: 520, padding: '36px 32px' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: '#fff1f2',
            border: '2px solid #fecdd3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Clock size={36} color="#e11d48" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Onboarding Link Expired
          </h2>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            {expiredInfo.candidateName ? (
              <>Dear <strong>{expiredInfo.candidateName}</strong>, this </>
            ) : (
              'This '
            )}
            onboarding verification link was valid for <strong>24 hours</strong> and has now expired for your data privacy and security.
          </p>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '14px 18px',
            textAlign: 'left',
            marginBottom: 24,
            fontSize: 13
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#64748b' }}>Reference ID:</span>
              <strong style={{ color: '#0f172a' }}>{expiredInfo.id || id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Security Policy:</span>
              <span style={{ color: '#e11d48', fontWeight: 600 }}>24-Hour Expiry Exceeded</span>
            </div>
          </div>

          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5, marginBottom: 20 }}>
            To generate a new secure verification link, please contact your HR representative or recruiting coordinator.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/login" className={styles.backHomeBtn}>
              Back to HRMS
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorCard}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 12px' }} />
          <h2>Invalid or Expired Onboarding Link</h2>
          <p>We could not find an active induction dossier matching reference ID "{id}".</p>
          <Link to="/login" className={styles.backHomeBtn} style={{ marginTop: 16 }}>
            Go to HRMS Home
          </Link>
        </div>
      </div>
    );
  }

  // Submitted Success Screen
  if (isSubmittedSuccess) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successCard}>
          <div className={styles.successIconWrap}>
            <CheckCircle2 size={56} color="#16a34a" />
          </div>
          <h1 className={styles.successTitle}>Documents Submitted Successfully!</h1>
          <p className={styles.successSubtitle}>
            Thank you, <strong>{formData.name || candidate.candidateName}</strong>. Your basic details and verification documents have been received by the HR team for inspection.
          </p>

          <div className={styles.summaryBox}>
            <div className={styles.summaryItem}>
              <span>Candidate ID:</span>
              <strong>{candidate.id}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Selected Role:</span>
              <strong>{candidate.appliedFor || candidate.jobCategory}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Assigned Site:</span>
              <strong>{candidate.assignedClient || 'Headquarters'}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Joining Date:</span>
              <strong style={{ color: '#059669' }}>{candidate.proposedJoiningDate || 'Upcoming'}</strong>
            </div>
          </div>

          <div className={styles.nextStepsBox}>
            <h4>What happens next?</h4>
            <ul>
              <li>HR will verify your uploaded Aadhaar, PAN, and Bank passbook documents.</li>
              <li>Your uniform kit (Shirt: {formData.shirtSize}, Boot: {formData.bootSize}) and Security ID card will be prepared.</li>
              <li>You will receive duty confirmation and shift reporting details on your mobile number.</li>
            </ul>
          </div>

          <p style={{ fontSize: 13, color: '#64748b', marginTop: 20 }}>
            In case of any query, contact HR Helpdesk at <strong>+91 98765 43210</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>

      {/* Hero Welcome Card */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <span className={styles.welcomePill}>Welcome to the Team</span>
          <h1 className={styles.heroHeading} style={{ color: '#ffffff' }}>Hello, {candidate.candidateName}</h1>
          <p className={styles.heroDesc}>
            Please fill in your basic information and upload your identification documents below for quick verification.
          </p>

          <div className={styles.heroMetaRow}>
            <div className={styles.metaBadge}>
              <Building2 size={14} />
              <span>Role: <strong>{candidate.appliedFor || candidate.jobCategory}</strong></span>
            </div>
            <div className={styles.metaBadge}>
              <Calendar size={14} />
              <span>Joining Date: <strong>{candidate.proposedJoiningDate || 'Upcoming'}</strong></span>
            </div>
            <div className={styles.metaBadge}>
              <FileText size={14} />
              <span>Ref ID: <strong>{candidate.id}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form - Only 2 Clean Sections */}
      <main className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.mainForm}>

          {/* Section 1: Basic Information */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <User size={20} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>1. Basic Information</h2>
                <p className={styles.sectionSub}>Your personal identity details for the company records</p>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Candidate Full Name <span className={styles.req}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={`${styles.input} ${styles.readOnlyInput} ${errors.name ? styles.inputError : ''}`}
                  value={formData.name}
                  readOnly
                  tabIndex={-1}
                  placeholder="Full name as in Aadhaar card"
                />
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Father's / Husband's Name <span className={styles.req}>*</span>
                </label>
                <input
                  type="text"
                  name="fatherHusbandName"
                  className={`${styles.input} ${errors.fatherHusbandName ? styles.inputError : ''}`}
                  value={formData.fatherHusbandName}
                  onChange={handleChange}
                  placeholder="Enter father or husband full name"
                />
                {errors.fatherHusbandName && <span className={styles.errorText}>{errors.fatherHusbandName}</span>}
              </div>
            </div>

            <div className={styles.grid3} style={{ marginTop: 14 }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Date of Birth <span className={styles.req}>*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  className={`${styles.input} ${errors.dob ? styles.inputError : ''}`}
                  value={formData.dob}
                  onChange={handleChange}
                />
                {errors.dob && <span className={styles.errorText}>{errors.dob}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Gender</label>
                <select name="gender" className={styles.select} value={formData.gender} onChange={handleChange}>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Mobile Number <span className={styles.req}>*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  className={`${styles.input} ${styles.readOnlyInput} ${errors.mobile ? styles.inputError : ''}`}
                  value={formData.mobile}
                  readOnly
                  tabIndex={-1}
                  placeholder="10-digit mobile number"
                />
                {errors.mobile && <span className={styles.errorText}>{errors.mobile}</span>}
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginTop: 14 }}>
              <label className={styles.label}>
                Current Residential Address <span className={styles.req}>*</span>
              </label>
              <textarea
                name="presentAddress"
                className={`${styles.textarea} ${styles.readOnlyTextarea} ${errors.presentAddress ? styles.inputError : ''}`}
                value={formData.presentAddress}
                readOnly
                tabIndex={-1}
                placeholder="House No., Street/Village, Post Office, District, City, Pincode"
                rows={2}
              />
              {errors.presentAddress && <span className={styles.errorText}>{errors.presentAddress}</span>}
            </div>
          </section>

          {/* Section 2: Document Verification & Bank Details */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                <CreditCard size={20} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>2. Documents & Bank Verification</h2>
                <p className={styles.sectionSub}>Upload clear photos of your documents for HR verification & salary credit</p>
              </div>
            </div>

            {/* 1. Aadhaar Card */}
            <div style={{ marginBottom: 20 }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Aadhaar Card Number <span className={styles.req}>*</span>
                </label>
                <input
                  type="text"
                  name="aadhaar"
                  className={`${styles.input} ${errors.aadhaar ? styles.inputError : ''}`}
                  value={formData.aadhaar}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar number (e.g. 1234 5678 9012)"
                  maxLength={14}
                  style={{ maxWidth: 380 }}
                />
                {errors.aadhaar && <span className={styles.errorText}>{errors.aadhaar}</span>}
              </div>

              <div className={styles.uploadCardsGrid}>
                <div className={styles.uploadCard}>
                  <div className={styles.uploadCardHeader}>
                    <FileText size={16} color="#2563eb" />
                    <span>Aadhaar Front Photo</span>
                  </div>
                  <label className={styles.dropZone}>
                    <Upload size={22} className={styles.dropIcon} />
                    <span className={styles.dropText}>
                      {formData.aadhaarFrontPhoto ? '✓ Front Photo Uploaded' : 'Upload Aadhaar Front'}
                    </span>
                    <span className={styles.dropHint}>Click to upload JPG / PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={(e) => handleFileUpload('aadhaarFrontPhoto', e.target.files?.[0])}
                    />
                  </label>
                </div>

                <div className={styles.uploadCard}>
                  <div className={styles.uploadCardHeader}>
                    <FileText size={16} color="#2563eb" />
                    <span>Aadhaar Back Photo (Address)</span>
                  </div>
                  <label className={styles.dropZone}>
                    <Upload size={22} className={styles.dropIcon} />
                    <span className={styles.dropText}>
                      {formData.aadhaarBackPhoto ? '✓ Back Photo Uploaded' : 'Upload Aadhaar Back'}
                    </span>
                    <span className={styles.dropHint}>Click to upload JPG / PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={(e) => handleFileUpload('aadhaarBackPhoto', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 2. PAN Card */}
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>PAN Card Number</label>
                  <input
                    type="text"
                    name="pan"
                    className={styles.input}
                    value={formData.pan}
                    onChange={(e) => setFormData(p => ({ ...p, pan: e.target.value.toUpperCase() }))}
                    placeholder="10-digit PAN (e.g. ABCDE1234F)"
                    maxLength={10}
                  />
                </div>

                <div className={styles.uploadCard} style={{ margin: 0 }}>
                  <div className={styles.uploadCardHeader}>
                    <CreditCard size={16} color="#059669" />
                    <span>PAN Card Photo</span>
                  </div>
                  <label className={styles.dropZone} style={{ padding: '12px' }}>
                    <Upload size={20} className={styles.dropIcon} />
                    <span className={styles.dropText}>
                      {formData.panPhoto ? '✓ PAN Uploaded' : 'Upload PAN Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={(e) => handleFileUpload('panPhoto', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Bank Account for Salary */}
            <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>
                Salary Bank Account Details
              </h3>

              <div className={styles.grid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Bank Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    className={styles.input}
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g. SBI, HDFC, PNB, BOB"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Account Number <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    className={`${styles.input} ${errors.accountNumber ? styles.inputError : ''}`}
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Bank account number"
                  />
                  {errors.accountNumber && <span className={styles.errorText}>{errors.accountNumber}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Bank IFSC Code <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    name="ifsc"
                    className={`${styles.input} ${errors.ifsc ? styles.inputError : ''}`}
                    value={formData.ifsc}
                    onChange={(e) => setFormData(p => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                    placeholder="e.g. SBIN0001234"
                    maxLength={11}
                  />
                  {errors.ifsc && <span className={styles.errorText}>{errors.ifsc}</span>}
                </div>
              </div>

              <div className={styles.uploadCard} style={{ maxWidth: 360, marginTop: 14 }}>
                <div className={styles.uploadCardHeader}>
                  <Building2 size={16} color="#d97706" />
                  <span>Bank Passbook / Cancelled Cheque Photo</span>
                </div>
                <label className={styles.dropZone}>
                  <Upload size={22} className={styles.dropIcon} />
                  <span className={styles.dropText}>
                    {formData.bankPassbookPhoto ? '✓ Passbook Uploaded' : 'Upload Passbook / Cheque'}
                  </span>
                  <span className={styles.dropHint}>Passbook page or cheque with printed account & IFSC</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={(e) => handleFileUpload('bankPassbookPhoto', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* 4. Photo, Police Slip & Uniform Sizing */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div className={styles.uploadCardsGrid}>
                {/* Selfie / Photo */}
                <div className={styles.uploadCard}>
                  <div className={styles.uploadCardHeader}>
                    <Camera size={16} color="#059669" />
                    <span>Passport Photo / Selfie (for ID Card)</span>
                  </div>
                  <label className={styles.dropZone}>
                    <Upload size={22} className={styles.dropIcon} />
                    <span className={styles.dropText}>
                      {formData.employeePhoto ? '✓ Photo Uploaded' : 'Upload Live Photo / Selfie'}
                    </span>
                    <span className={styles.dropHint}>Clear front-facing photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={(e) => handleFileUpload('employeePhoto', e.target.files?.[0])}
                    />
                  </label>
                </div>

                {/* Police Receipt */}
                <div className={styles.uploadCard}>
                  <div className={styles.uploadCardHeader}>
                    <ShieldCheck size={16} color="#2563eb" />
                    <span>Police Verification Slip (Optional)</span>
                  </div>
                  <label className={styles.dropZone}>
                    <Upload size={22} className={styles.dropIcon} />
                    <span className={styles.dropText}>
                      {formData.policeSlipPhoto ? '✓ Police Slip Uploaded' : 'Upload Police Slip (If Available)'}
                    </span>
                    <span className={styles.dropHint}>Station receipt or online challan</span>
                    <input
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={(e) => handleFileUpload('policeSlipPhoto', e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {/* Quick Uniform Sizing (Optional) */}
              <div className={styles.grid2} style={{ marginTop: 16 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Uniform Bush-Shirt Size</label>
                  <select name="shirtSize" className={styles.select} value={formData.shirtSize} onChange={handleChange}>
                    {UNIFORM_SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Safety DMS Boots Size</label>
                  <select name="bootSize" className={styles.select} value={formData.bootSize} onChange={handleChange}>
                    {BOOT_SIZES.map(b => <option key={b} value={b}>Size {b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Declaration & Submit */}
          <section className={styles.declarationCard}>
            <div className={`${styles.declarationBox} ${formData.declarationAccepted ? styles.declarationBoxChecked : ''}`}>
              <label className={styles.declarationLabel} htmlFor="declarationAccepted">
                <input
                  type="checkbox"
                  name="declarationAccepted"
                  id="declarationAccepted"
                  className={styles.declarationCheckbox}
                  checked={formData.declarationAccepted}
                  onChange={handleChange}
                  style={{ marginRight: 10 }}
                />
                <span className={styles.declarationText}>
                  I declare that the information and identification documents uploaded above are genuine and belong to me.
                </span>
              </label>
              {errors.declarationAccepted && (
                <div className={styles.errorText} style={{ marginTop: 8, paddingLeft: 30 }}>
                  {errors.declarationAccepted}
                </div>
              )}
            </div>

            <div className={styles.submitBar}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className={styles.spin} />
                    <span>Submitting Documents...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Submit Documents for Verification</span>
                  </>
                )}
              </button>
            </div>
          </section>

        </form>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} RR Security & Facility Management Services. All Rights Reserved.</p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
          Protected by 256-bit encryption. Data used solely for employee registration and government verification.
        </p>
      </footer>
    </div>
  );
}
