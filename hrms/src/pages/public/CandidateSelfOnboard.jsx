import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  CreditCard,
  FileText,
  FileCheck,
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
  saveCandidateSelfOnboarding
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
  const [activeDocTypes, setActiveDocTypes] = useState([]);
  const [dynamicDocValues, setDynamicDocValues] = useState({});
  const [fileErrors, setFileErrors] = useState({});

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

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
      let docTypes = [];
      try {
        const live = await onboardingService.getPublicOnboardingById(id);
        if (live) {
          found = live;
          docTypes = live.activeDocumentTypes || [];
        }
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
        // Resolve company active document types from local storage if API didn't return any
        if ((!docTypes || docTypes.length === 0) && found.companyId) {
          try {
            const cached = localStorage.getItem(`novaspark_masters_${found.companyId}_document-types`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                docTypes = parsed.filter(d => (d.status || '').toLowerCase() === 'active');
              }
            }
          } catch (e) {}
        }

        // If company has not configured custom document types yet, fallback to single Aadhar Card (as in Image 1)
        if (!docTypes || docTypes.length === 0) {
          docTypes = [
            { name: 'Aadhar Card', code: 'DC-AADHAR', requiredType: 'required', status: 'Active' }
          ];
        }

        setActiveDocTypes(docTypes);

        // Prepopulate dynamic document fields from found.documents
        const initialDynamic = {};
        docTypes.forEach((doc) => {
          const key = doc.code || doc.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const isAadhaar = doc.name.toLowerCase().includes('aadhaar') || doc.name.toLowerCase().includes('aadhar') || (doc.code || '').toUpperCase().includes('AADHAR');
          const isPan = doc.name.toLowerCase().includes('pan') || (doc.code || '').toUpperCase().includes('PAN');

          const existingDoc = found.documents?.[key] ||
            (isAadhaar ? found.documents?.aadhaar : null) ||
            (isPan ? found.documents?.pan : null);

          initialDynamic[key] = {
            name: doc.name,
            code: doc.code,
            required: doc.requiredType === 'required',
            number: existingDoc?.number || (isAadhaar ? found.aadhaar : '') || (isPan ? found.pan : '') || '',
            fileUrl: existingDoc?.fileUrl || existingDoc?.photo || '',
            photoFront: existingDoc?.photoFront || (isAadhaar ? found.documents?.aadhaar?.photoFront : '') || '',
            photoBack: existingDoc?.photoBack || (isAadhaar ? found.documents?.aadhaar?.photoBack : '') || '',
            fileName: existingDoc?.fileName || '',
            fileSize: existingDoc?.fileSize || ''
          };
        });
        setDynamicDocValues(initialDynamic);
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

  // Upload handler with strict 4MB max size enforcement
  const handleFileUpload = (field, file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileErrors((prev) => ({
        ...prev,
        [field]: `File size exceeds 4MB limit (${actualMb} MB). Please upload a file smaller than 4MB.`
      }));
      return;
    }

    setFileErrors((prev) => ({ ...prev, [field]: null }));

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        [field]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Dynamic document upload handler with strict 4MB max size enforcement
  const handleDynamicDocUpload = (docKey, file, subField = 'fileUrl') => {
    if (!file) return;
    const errorKey = `${docKey}_${subField}`;

    if (file.size > MAX_FILE_SIZE) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileErrors((prev) => ({
        ...prev,
        [errorKey]: `File size exceeds 4MB limit (${actualMb} MB). Please upload a file smaller than 4MB.`
      }));
      return;
    }

    setFileErrors((prev) => ({ ...prev, [errorKey]: null }));

    const reader = new FileReader();
    reader.onload = () => {
      const resultUrl = reader.result;
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setDynamicDocValues((prev) => {
        const cur = prev[docKey] || {};
        return {
          ...prev,
          [docKey]: {
            ...cur,
            [subField]: resultUrl,
            fileName: file.name,
            fileSize: formattedSize
          }
        };
      });

      // Sync to root legacy formData
      const keyLower = docKey.toLowerCase();
      if (keyLower.includes('aadhaar') || keyLower.includes('aadhar')) {
        if (subField === 'photoFront') setFormData(p => ({ ...p, aadhaarFrontPhoto: resultUrl }));
        if (subField === 'photoBack') setFormData(p => ({ ...p, aadhaarBackPhoto: resultUrl }));
        if (subField === 'fileUrl') setFormData(p => ({ ...p, aadhaarFrontPhoto: resultUrl }));
      } else if (keyLower.includes('pan')) {
        setFormData(p => ({ ...p, panPhoto: resultUrl }));
      }
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

    // Dynamic Active Document Types Validation
    if (activeDocTypes && activeDocTypes.length > 0) {
      activeDocTypes.forEach((doc) => {
        const isMandatory = doc.requiredType === 'required';
        const key = doc.code || doc.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const val = dynamicDocValues[key] || {};
        const isAadhaar = doc.name.toLowerCase().includes('aadhaar') || doc.name.toLowerCase().includes('aadhar') || (doc.code || '').toUpperCase().includes('AADHAR');
        const isPan = doc.name.toLowerCase().includes('pan') || (doc.code || '').toUpperCase().includes('PAN');

        if (isAadhaar) {
          if (isMandatory && !formData.aadhaar.trim() && !val.number?.trim()) {
            errs.aadhaar = `${doc.name} number is required`;
          }
          if (isMandatory && !formData.aadhaarFrontPhoto && !val.photoFront && !val.fileUrl) {
            errs[`${key}_photoFront`] = `Please upload ${doc.name} front photo (Max 4MB)`;
          }
        } else if (isPan) {
          if (isMandatory && !formData.pan.trim() && !val.number?.trim()) {
            errs.pan = `${doc.name} number is required`;
          }
          if (isMandatory && !formData.panPhoto && !val.fileUrl) {
            errs[`${key}_fileUrl`] = `Please upload ${doc.name} photo (Max 4MB)`;
          }
        } else {
          if (isMandatory && !val.fileUrl) {
            errs[`${key}_fileUrl`] = `Please upload ${doc.name} (Max 4MB)`;
          }
        }
      });
    }

    // Block submission if any file size exceeds 4MB
    if (Object.values(fileErrors).some(Boolean)) {
      errs.fileUpload = 'Please resolve file size errors (maximum 4MB per file).';
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
      dynamicDocs: dynamicDocValues,
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
              <li>HR will verify your uploaded documents and bank details for salary credit.</li>
              <li>Your verification dossier will be completed and your official Employee ID card will be prepared.</li>
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

          {/* Section 2: Document Verification */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                <FileCheck size={20} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>2. Document Verification</h2>
                <p className={styles.sectionSub}>Upload clear photos or scanned copies of your active documents for HR verification (Max size: 4MB)</p>
              </div>
            </div>

            {/* Dynamic Active Document Types configured for this Isolated Company */}
            {activeDocTypes && activeDocTypes.length > 0 ? (
              <div>
                {activeDocTypes.map((doc, idx) => {
                  const key = doc.code || doc.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const docVal = dynamicDocValues[key] || {};
                  const isMandatory = doc.requiredType === 'required';
                  const docNameLower = (doc.name || '').toLowerCase();
                  const docCodeUpper = (doc.code || '').toUpperCase();
                  const isAadhaar = docNameLower.includes('aadhaar') || docNameLower.includes('aadhar') || docCodeUpper.includes('AADHAR');
                  const isPan = docNameLower.includes('pan') || docCodeUpper.includes('PAN');
                  const isPhoto = docNameLower.includes('photo') || docNameLower.includes('selfie') || docCodeUpper.includes('PHOTO');
                  const isBankDoc = docNameLower.includes('passbook') || docNameLower.includes('cheque') || docCodeUpper.includes('PASSBOOK') || docCodeUpper.includes('CHEQUE');

                  return (
                    <div
                      key={key || idx}
                      style={{
                        marginBottom: 20,
                        paddingTop: idx > 0 ? 18 : 0,
                        borderTop: idx > 0 ? '1px solid #e2e8f0' : 'none'
                      }}
                    >
                      {/* Document Title & Mandatory Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              background: isAadhaar ? '#eff6ff' : isPan ? '#ecfdf5' : isPhoto ? '#fdf4ff' : '#f8fafc',
                              color: isAadhaar ? '#2563eb' : isPan ? '#059669' : isPhoto ? '#a855f7' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            {isAadhaar ? <FileText size={16} /> : isPan ? <CreditCard size={16} /> : isPhoto ? <Camera size={16} /> : <FileCheck size={16} />}
                          </div>
                          <div>
                            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                              {doc.name} {isMandatory && <span className={styles.req} style={{ color: '#dc2626' }}>*</span>}
                            </h3>
                            {doc.code && (
                              <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                                Code: {doc.code}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 12,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            background: isMandatory ? '#fef2f2' : '#f1f5f9',
                            color: isMandatory ? '#dc2626' : '#64748b',
                            border: isMandatory ? '1px solid #fecaca' : '1px solid #e2e8f0'
                          }}
                        >
                          {isMandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>

                      {doc.description && (
                        <p style={{ fontSize: 12, color: '#64748b', margin: '-4px 0 12px 38px' }}>
                          {doc.description}
                        </p>
                      )}

                      {/* Aadhaar Card View: Number + Front Photo & Back Photo */}
                      {isAadhaar ? (
                        <div>
                          <div className={styles.formGroup} style={{ maxWidth: 380, marginBottom: 12 }}>
                            <label className={styles.label}>
                              {doc.name} Number {isMandatory && <span className={styles.req}>*</span>}
                            </label>
                            <input
                              type="text"
                              className={`${styles.input} ${errors.aadhaar ? styles.inputError : ''}`}
                              value={formData.aadhaar || docVal.number || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setFormData(p => ({ ...p, aadhaar: v }));
                                setDynamicDocValues(p => ({ ...p, [key]: { ...(p[key] || {}), number: v } }));
                              }}
                              placeholder="12-digit Aadhaar number (e.g. 1234 5678 9012)"
                              maxLength={14}
                            />
                            {errors.aadhaar && <span className={styles.errorText}>{errors.aadhaar}</span>}
                          </div>

                          <div className={styles.uploadCardsGrid}>
                            {/* Front Photo */}
                            <div className={styles.uploadCard}>
                              <div className={styles.uploadCardHeader}>
                                <FileText size={16} color="#2563eb" />
                                <span>{doc.name} Front Photo {isMandatory && <span className={styles.req}>*</span>}</span>
                              </div>
                              <label className={styles.dropZone}>
                                <Upload size={22} className={styles.dropIcon} />
                                <span className={styles.dropText}>
                                  {formData.aadhaarFrontPhoto || docVal.photoFront ? '✓ Front Photo Uploaded' : `Upload ${doc.name} Front`}
                                </span>
                                <span className={styles.dropHint}>Click to upload JPG / PNG (Max 4MB)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className={styles.hiddenInput}
                                  onChange={(e) => handleDynamicDocUpload(key, e.target.files?.[0], 'photoFront')}
                                />
                              </label>
                              {fileErrors[`${key}_photoFront`] && (
                                <span className={styles.errorText} style={{ marginTop: 6 }}>
                                  {fileErrors[`${key}_photoFront`]}
                                </span>
                              )}
                              {errors[`${key}_photoFront`] && (
                                <span className={styles.errorText} style={{ marginTop: 6 }}>
                                  {errors[`${key}_photoFront`]}
                                </span>
                              )}
                            </div>

                            {/* Back Photo */}
                            <div className={styles.uploadCard}>
                              <div className={styles.uploadCardHeader}>
                                <FileText size={16} color="#2563eb" />
                                <span>{doc.name} Back Photo (Address)</span>
                              </div>
                              <label className={styles.dropZone}>
                                <Upload size={22} className={styles.dropIcon} />
                                <span className={styles.dropText}>
                                  {formData.aadhaarBackPhoto || docVal.photoBack ? '✓ Back Photo Uploaded' : `Upload ${doc.name} Back`}
                                </span>
                                <span className={styles.dropHint}>Click to upload JPG / PNG (Max 4MB)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className={styles.hiddenInput}
                                  onChange={(e) => handleDynamicDocUpload(key, e.target.files?.[0], 'photoBack')}
                                />
                              </label>
                              {fileErrors[`${key}_photoBack`] && (
                                <span className={styles.errorText} style={{ marginTop: 6 }}>
                                  {fileErrors[`${key}_photoBack`]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : isPan ? (
                        /* PAN Card View: Number + PAN Photo */
                        <div className={styles.grid2}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              {doc.name} Number {isMandatory && <span className={styles.req}>*</span>}
                            </label>
                            <input
                              type="text"
                              className={`${styles.input} ${errors.pan ? styles.inputError : ''}`}
                              value={formData.pan || docVal.number || ''}
                              onChange={(e) => {
                                const v = e.target.value.toUpperCase();
                                setFormData(p => ({ ...p, pan: v }));
                                setDynamicDocValues(p => ({ ...p, [key]: { ...(p[key] || {}), number: v } }));
                              }}
                              placeholder="10-digit PAN (e.g. ABCDE1234F)"
                              maxLength={10}
                            />
                            {errors.pan && <span className={styles.errorText}>{errors.pan}</span>}
                          </div>

                          <div className={styles.uploadCard} style={{ margin: 0 }}>
                            <div className={styles.uploadCardHeader}>
                              <CreditCard size={16} color="#059669" />
                              <span>{doc.name} Photo {isMandatory && <span className={styles.req}>*</span>}</span>
                            </div>
                            <label className={styles.dropZone} style={{ padding: '12px' }}>
                              <Upload size={20} className={styles.dropIcon} />
                              <span className={styles.dropText}>
                                {formData.panPhoto || docVal.fileUrl ? '✓ PAN Uploaded' : `Upload ${doc.name}`}
                              </span>
                              <span className={styles.dropHint}>Max size: 4MB (JPG, PNG)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className={styles.hiddenInput}
                                onChange={(e) => handleDynamicDocUpload(key, e.target.files?.[0], 'fileUrl')}
                              />
                            </label>
                            {fileErrors[`${key}_fileUrl`] && (
                              <span className={styles.errorText} style={{ marginTop: 6 }}>
                                {fileErrors[`${key}_fileUrl`]}
                              </span>
                            )}
                            {errors[`${key}_fileUrl`] && (
                              <span className={styles.errorText} style={{ marginTop: 6 }}>
                                {errors[`${key}_fileUrl`]}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isPhoto ? (
                        /* Passport Photo / Selfie (if configured in Master) */
                        <div className={styles.uploadCard} style={{ margin: 0, maxWidth: 420 }}>
                          <div className={styles.uploadCardHeader}>
                            <Camera size={16} color="#a855f7" />
                            <span>Upload {doc.name} {isMandatory && <span className={styles.req}>*</span>}</span>
                          </div>
                          <label className={styles.dropZone} style={{ padding: '14px' }}>
                            <Upload size={20} className={styles.dropIcon} />
                            <span className={styles.dropText}>
                              {docVal.fileUrl ? (
                                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Check size={14} /> {docVal.fileName || '✓ Photo Uploaded'}
                                </span>
                              ) : (
                                `Click to Upload ${doc.name}`
                              )}
                            </span>
                            <span className={styles.dropHint}>Clear front-facing photo (Max 4MB JPG, PNG)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className={styles.hiddenInput}
                              onChange={(e) => {
                                handleDynamicDocUpload(key, e.target.files?.[0], 'fileUrl');
                                handleFileUpload('employeePhoto', e.target.files?.[0]);
                              }}
                            />
                          </label>
                          {fileErrors[`${key}_fileUrl`] && (
                            <span className={styles.errorText} style={{ marginTop: 6 }}>
                              {fileErrors[`${key}_fileUrl`]}
                            </span>
                          )}
                          {errors[`${key}_fileUrl`] && (
                            <span className={styles.errorText} style={{ marginTop: 6 }}>
                              {errors[`${key}_fileUrl`]}
                            </span>
                          )}
                        </div>
                      ) : isBankDoc ? (
                        /* Bank Passbook / Cheque (if configured in Master) */
                        <div className={styles.uploadCard} style={{ margin: 0, maxWidth: 420 }}>
                          <div className={styles.uploadCardHeader}>
                            <Building2 size={16} color="#d97706" />
                            <span>Upload {doc.name} {isMandatory && <span className={styles.req}>*</span>}</span>
                          </div>
                          <label className={styles.dropZone} style={{ padding: '14px' }}>
                            <Upload size={20} className={styles.dropIcon} />
                            <span className={styles.dropText}>
                              {docVal.fileUrl ? (
                                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Check size={14} /> {docVal.fileName || '✓ Passbook Uploaded'}
                                </span>
                              ) : (
                                `Click to Upload ${doc.name}`
                              )}
                            </span>
                            <span className={styles.dropHint}>Passbook or cancelled cheque (Max 4MB JPG, PNG, PDF)</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className={styles.hiddenInput}
                              onChange={(e) => {
                                handleDynamicDocUpload(key, e.target.files?.[0], 'fileUrl');
                                handleFileUpload('bankPassbookPhoto', e.target.files?.[0]);
                              }}
                            />
                          </label>
                          {fileErrors[`${key}_fileUrl`] && (
                            <span className={styles.errorText} style={{ marginTop: 6 }}>
                              {fileErrors[`${key}_fileUrl`]}
                            </span>
                          )}
                          {errors[`${key}_fileUrl`] && (
                            <span className={styles.errorText} style={{ marginTop: 6 }}>
                              {errors[`${key}_fileUrl`]}
                            </span>
                          )}
                        </div>
                      ) : (
                        /* Any Other Configured Active Document Type */
                        <div className={styles.grid2}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              {doc.name} Number / Ref ID {isMandatory && <span className={styles.req}>*</span>}
                            </label>
                            <input
                              type="text"
                              className={styles.input}
                              value={docVal.number || ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDynamicDocValues(p => ({ ...p, [key]: { ...(p[key] || {}), number: v } }));
                              }}
                              placeholder={`Enter ${doc.name} ID / Reference number`}
                            />
                          </div>

                          <div className={styles.uploadCard} style={{ margin: 0 }}>
                            <div className={styles.uploadCardHeader}>
                              <FileCheck size={16} color="#2563eb" />
                              <span>Upload {doc.name} {isMandatory && <span className={styles.req}>*</span>}</span>
                            </div>
                            <label className={styles.dropZone} style={{ padding: '12px' }}>
                              <Upload size={20} className={styles.dropIcon} />
                              <span className={styles.dropText}>
                                {docVal.fileUrl ? (
                                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Check size={14} /> {docVal.fileName || '✓ File Uploaded'}
                                    {docVal.fileSize && <span style={{ fontSize: 11, color: '#64748b' }}>({docVal.fileSize})</span>}
                                  </span>
                                ) : (
                                  `Click to Upload ${doc.name}`
                                )}
                              </span>
                              <span className={styles.dropHint}>Max size: 4MB (JPG, PNG, PDF)</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className={styles.hiddenInput}
                                onChange={(e) => handleDynamicDocUpload(key, e.target.files?.[0], 'fileUrl')}
                              />
                            </label>
                            {fileErrors[`${key}_fileUrl`] && (
                              <span className={styles.errorText} style={{ marginTop: 6 }}>
                                {fileErrors[`${key}_fileUrl`]}
                              </span>
                            )}
                            {errors[`${key}_fileUrl`] && (
                              <span className={styles.errorText} style={{ marginTop: 6 }}>
                                {errors[`${key}_fileUrl`]}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 13, marginBottom: 20 }}>
                No active document types configured by HR for this organization.
              </div>
            )}
          </section>

          {/* Section 3: Salary Bank Account Details */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Building2 size={20} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>3. Salary Bank Account Details</h2>
                <p className={styles.sectionSub}>Enter bank account details for direct salary transfer</p>
              </div>
            </div>

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
