import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Shirt,
  Calendar,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Save,
  AlertCircle,
  FileText,
  BadgeCheck,
  Clock,
  MapPin,
  Check,
  Eye,
  Copy,
  ExternalLink,
  X,
  User,
  CreditCard
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import {
  getStoredOnboarding,
  updateOnboardingCandidate,
  convertToEmployee,
  ONBOARDING_STAGES
} from '../../data/onboardingData';
import onboardingService from '../../services/onboardingService';
import styles from './OnboardingDetails.module.css';

const formatINR = (val) => {
  if (!val && val !== 0) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export default function OnboardingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [candidate, setCandidate] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadData = useCallback(async () => {
    const list = getStoredOnboarding(currentCompanyId);
    const found = list.find((item) =>
      (item._id && String(item._id) === String(id)) ||
      item.id === id ||
      item.candidateId === id
    );
    if (found) {
      setCandidate(found);
    }
    try {
      const live = await onboardingService.getOnboardingById(id, currentCompanyId);
      if (live) {
        setCandidate(live);
      }
    } catch (_) {}
  }, [id, currentCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!candidate) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2>Onboarding Record Not Found</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No onboarding dossier found for reference ID "{id}".</p>
            <Link to="/admin/onboarding" className={styles.backBtn} style={{ marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to Onboarding Pipeline
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Update a single document's status
  const handleDocStatusChange = async (docKey, newStatus) => {
    const updatedDocs = {
      ...candidate.documents,
      [docKey]: {
        ...candidate.documents[docKey],
        status: newStatus
      }
    };
    try {
      const docName = candidate.documents?.[docKey]?.documentName || docKey;
      await updateOnboardingCandidate(candidate.id, { documents: updatedDocs }, currentCompanyId);
      setCandidate((prev) => ({ ...prev, documents: updatedDocs }));
      const label = newStatus === 'Verified' ? 'Approved' : newStatus;
      showToast(`Document "${docName}" marked as ${label}.`, 'success');
    } catch (err) {
      showToast('Failed to update document status', 'error');
    }
  };

  // Convert to permanent Employee
  const handleConvertEmployee = async () => {
    try {
      const res = await convertToEmployee(candidate.id, null, currentCompanyId);
      const code = res?.employee?.employeeId || res?.employeeCode || 'RR-XXX';
      if (res?.onboarding) {
        setCandidate(res.onboarding);
      } else {
        await loadData();
      }
      showToast(
        `Candidate successfully converted to permanent Employee record (${code})!`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Failed to convert to employee', 'error');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/onboard/${candidate.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      showToast('✓ Candidate self-onboarding link copied to clipboard!', 'success');
    } else {
      showToast(`Link: ${link}`, 'info');
    }
  };

  const handleSendEmail = async () => {
    if (!candidate.email) {
      showToast('Candidate does not have an email address specified.', 'error');
      return;
    }
    setIsSendingEmail(true);
    try {
      await onboardingService.sendOnboardingInvite(candidate.id, candidate.email, currentCompanyId);
      showToast(`✓ Onboarding invitation email sent successfully to ${candidate.email}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send invitation email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Only show documents that the candidate actually uploaded from the onboarding form
  const docEntries = Object.entries(candidate.documents || {}).filter(([key, doc]) => {
    if (!doc) return false;
    const hasProof = Boolean(doc.photo || doc.photoFront || doc.photoBack || doc.fileUrl);
    const hasData = Boolean(doc.number && String(doc.number).trim());
    const isSubmitted = doc.status === 'Uploaded' || doc.status === 'Verified' || doc.status === 'Approved' || doc.status === 'Rejected';
    return hasProof || (hasData && isSubmitted);
  });

  const verifiedCount = docEntries.filter(([_, doc]) => doc?.status === 'Verified' || doc?.status === 'Approved').length;
  const isAllDocsVerified = docEntries.length > 0 && verifiedCount === docEntries.length;

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin/dashboard" className={styles.crumbLink}>Home</Link>
          <span className={styles.separator}>/</span>
          <Link to="/admin/onboarding" className={styles.crumbLink}>Onboarding</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>{candidate.candidateName}</span>
        </div>

        {/* Hero Card */}
        <div className={styles.heroCard}>
          <div className={styles.heroMain}>
            <div className={styles.heroLeft}>
              {candidate.photo ? (
                <img src={candidate.photo} alt={candidate.candidateName} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>
                  {(candidate.candidateName || 'C').charAt(0).toUpperCase()}
                </div>
              )}

              <div className={styles.heroBio}>
                <div className={styles.heroNameRow}>
                  <h1 className={styles.heroName}>{candidate.candidateName}</h1>
                  <span className={styles.idBadge}>{candidate.id}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Recruitment Ref: {candidate.candidateId}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} style={{ color: '#2563eb' }} />
                    {candidate.mobile || '—'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={13} style={{ color: '#64748b' }} />
                    {candidate.email || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.heroActions}>
              {!candidate.isConvertedToEmployee ? (
                <button
                  type="button"
                  className={styles.convertBtn}
                  onClick={handleConvertEmployee}
                  title="Convert candidate to permanent Employee record"
                >
                  <Sparkles size={16} />
                  Complete Onboarding & Create Employee
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ecfdf5', padding: '8px 16px', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                  <BadgeCheck size={20} color="#059669" />
                  <span style={{ fontWeight: 800, color: '#065f46', fontSize: 14 }}>
                    Employee Code: {candidate.createdEmployeeCode}
                  </span>
                </div>
              )}

              <Link to="/admin/onboarding" className={styles.backBtn}>
                <ArrowLeft size={16} />
                Pipeline
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className={styles.metricsBar}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Proposed Joining Date</span>
              <span className={styles.metricVal} style={{ color: '#059669' }}>
                {candidate.proposedJoiningDate || 'TBD'}
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Offered Gross Salary</span>
              <span className={styles.metricVal}>
                {formatINR(candidate.offeredSalary)}
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Document Verification</span>
              <span className={styles.metricVal} style={{ color: isAllDocsVerified ? '#059669' : '#d97706' }}>
                {docEntries.length > 0 ? `${verifiedCount} / ${docEntries.length} Approved` : 'Awaiting Uploads'}
              </span>
            </div>
          </div>
        </div>

        {/* Dossier Grid Layout */}
        <div className={styles.dossierGrid}>
          <div>
            {/* Section 1: Document Verification Checklist */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck2 size={18} style={{ color: '#2563eb' }} />
                  <span>Uploaded Candidate Documents Verification</span>
                </div>
                {docEntries.length > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isAllDocsVerified ? '#059669' : '#d97706',
                      background: isAllDocsVerified ? '#ecfdf5' : '#fffbeb',
                      padding: '2px 10px',
                      borderRadius: 12
                    }}
                  >
                    {verifiedCount} of {docEntries.length} Approved
                  </span>
                )}
              </div>

              {docEntries.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                  <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 700, color: '#334155' }}>
                    No Documents Uploaded Yet
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                    The candidate has not submitted documents via the self-onboarding portal yet. Once submitted, their uploaded documents will appear here for your verification, approval, or rejection.
                  </p>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 10 }}>
                    <button
                      type="button"
                      className={styles.copyLinkBtn}
                      onClick={handleCopyLink}
                      style={{ padding: '7px 16px', fontSize: 12.5 }}
                    >
                      <Copy size={13} /> Copy Onboarding Link
                    </button>
                    <button
                      type="button"
                      className={styles.shareWhatsAppBtn}
                      onClick={handleSendEmail}
                      disabled={isSendingEmail}
                      style={{ padding: '7px 16px', fontSize: 12.5, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                    >
                      <Mail size={13} /> {isSendingEmail ? 'Sending...' : 'Email Onboarding Link'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.docsList}>
                  {docEntries.map(([key, doc]) => {
                    const isVerified = doc.status === 'Verified' || doc.status === 'Approved';
                    const isRejected = doc.status === 'Rejected';
                    const isUploaded = !isVerified && !isRejected;

                    let statusColor = '#2563eb';
                    let statusBg = '#eff6ff';
                    if (isVerified) {
                      statusColor = '#059669';
                      statusBg = '#ecfdf5';
                    } else if (isRejected) {
                      statusColor = '#dc2626';
                      statusBg = '#fef2f2';
                    }

                    const hasProof = Boolean(doc.photo || doc.photoFront || doc.photoBack || doc.fileUrl);

                    return (
                      <div key={key} className={styles.docRow} style={{ padding: '14px 16px' }}>
                        <div className={styles.docInfo}>
                          <div className={styles.docIconWrap} style={{ background: statusBg, color: statusColor }}>
                            {isVerified ? <Check size={18} /> : isRejected ? <X size={18} /> : <FileText size={18} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className={styles.docName} style={{ margin: 0 }}>{doc.documentName || key}</div>
                              {/* Uploaded badge */}
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '1px 8px',
                                  borderRadius: 4,
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe'
                                }}
                              >
                                Uploaded
                              </span>
                            </div>
                            <div className={styles.docMeta} style={{ marginTop: 4 }}>
                              {doc.number && `Number: ${doc.number} • `}
                              {doc.photoFront && doc.photoBack && 'Front & Back Photos • '}
                              {doc.fileSize && `Size: ${doc.fileSize} • `}
                              Status: <strong style={{ color: statusColor }}>{isVerified ? 'Approved' : isRejected ? 'Rejected' : 'Uploaded (Pending Verification)'}</strong>
                            </div>
                          </div>
                        </div>

                        <div className={styles.docStatusControls} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {hasProof && (
                            <button
                              type="button"
                              className={styles.previewDocBtn}
                              onClick={() => setPreviewDoc({
                                key,
                                name: doc.documentName || key,
                                doc,
                                status: doc.status
                              })}
                              title="Inspect candidate uploaded proof"
                            >
                              <Eye size={13} />
                              <span>View Uploaded Proof</span>
                            </button>
                          )}

                          {/* Approve Button */}
                          <button
                            type="button"
                            onClick={() => handleDocStatusChange(key, 'Verified')}
                            disabled={isVerified}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 14px',
                              background: isVerified ? '#d1fae5' : '#059669',
                              color: isVerified ? '#065f46' : '#ffffff',
                              border: isVerified ? '1px solid #a7f3d0' : 'none',
                              borderRadius: 6,
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: isVerified ? 'default' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={isVerified ? 'Document is already approved' : 'Approve this document'}
                          >
                            <Check size={14} /> {isVerified ? 'Approved' : 'Approve'}
                          </button>

                          {/* Reject Button */}
                          <button
                            type="button"
                            onClick={() => handleDocStatusChange(key, 'Rejected')}
                            disabled={isRejected}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '6px 14px',
                              background: isRejected ? '#fee2e2' : '#ffffff',
                              color: isRejected ? '#991b1b' : '#dc2626',
                              border: isRejected ? '1px solid #fecaca' : '1px solid #fca5a5',
                              borderRadius: 6,
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: isRejected ? 'default' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title={isRejected ? 'Document is marked rejected' : 'Reject this document'}
                          >
                            <X size={14} /> {isRejected ? 'Rejected' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Candidate Personal Profile & Deployment */}
          <div>
            {/* Candidate Personal & Self-Declared Info */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} style={{ color: '#2563eb' }} />
                  <span>Personal & Compliance Profile</span>
                </div>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                  {candidate.selfSubmitted ? '✓ Self-Declared' : 'Awaiting Details'}
                </span>
              </div>

              <div className={styles.personalGrid}>
                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Father / Husband</span>
                  <span className={styles.personalValue}>
                    {candidate.fatherHusbandName || candidate.fatherName || '—'} {candidate.fatherHusbandRelation ? `(${candidate.fatherHusbandRelation})` : ''}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Date of Birth</span>
                  <span className={styles.personalValue}>{candidate.dob || '—'}</span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Gender & Blood Group</span>
                  <span className={styles.personalValue}>
                    {candidate.gender || 'Male'} • <strong style={{ color: '#dc2626' }}>{candidate.bloodGroup || '—'}</strong>
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Marital Status</span>
                  <span className={styles.personalValue}>
                    {candidate.maritalStatus || 'Single'} {candidate.spouseName ? `(Spouse: ${candidate.spouseName})` : ''}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Religion & Nationality</span>
                  <span className={styles.personalValue}>
                    {candidate.religion || 'Hindu'} • {candidate.nationality || 'Indian'}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Emergency Contact</span>
                  <span className={styles.personalValue} style={{ color: '#2563eb' }}>
                    {candidate.emergencyMobile || '—'}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Highest Qualification</span>
                  <span className={styles.personalValue}>
                    {candidate.qualification || '10th Pass'}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Technical Skill / Drill</span>
                  <span className={styles.personalValue}>
                    {candidate.technicalQualification || 'Standard Staff'}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Prior Experience & Lang</span>
                  <span className={styles.personalValue}>
                    {candidate.previousExperience || 'Fresher'} • {candidate.language || 'Hindi'}
                  </span>
                </div>

                <div className={styles.personalField}>
                  <span className={styles.personalLabel}>Statutory UAN & ESIC</span>
                  <span className={styles.personalValue} style={{ fontSize: 12 }}>
                    UAN: {candidate.uan || '—'} • ESIC: {candidate.esicNo || '—'}
                  </span>
                </div>

                <div className={styles.personalField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.personalLabel}>EPF / Insurance Nominee</span>
                  <span className={styles.personalValue} style={{ color: '#059669' }}>
                    {candidate.familyMemberName ? `${candidate.familyMemberName} (${candidate.relation || 'Nominee'}, ${candidate.dobAge || ''}) - 100% Share` : '—'}
                  </span>
                </div>

                {candidate.licenseType && candidate.licenseType !== 'None' && (
                  <div className={styles.personalField} style={{ gridColumn: 'span 2' }}>
                    <span className={styles.personalLabel}>Special License Held</span>
                    <span className={styles.personalValue} style={{ color: '#d97706' }}>
                      {candidate.licenseType} (No: {candidate.drivingLicenseNo || '—'})
                    </span>
                  </div>
                )}

                <div className={styles.personalField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.personalLabel}>Present Address</span>
                  <span className={styles.personalValue} style={{ fontSize: 12 }}>
                    {candidate.presentAddress || candidate.address || '—'}
                  </span>
                </div>

                <div className={styles.personalField} style={{ gridColumn: 'span 2' }}>
                  <span className={styles.personalLabel}>Permanent Address</span>
                  <span className={styles.personalValue} style={{ fontSize: 12 }}>
                    {candidate.permanentAddress || candidate.address || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div className={styles.modalBackdrop} onClick={() => setPreviewDoc(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck2 size={20} color="#2563eb" />
                  <h3 className={styles.modalTitle}>{previewDoc.name} — Candidate Uploaded Proof</h3>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setPreviewDoc(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Document metadata box */}
                <div className={styles.modalMetaBox}>
                  <div><strong>Candidate Name:</strong> {candidate.candidateName}</div>
                  {previewDoc.doc?.number && <div><strong>Document Number:</strong> {previewDoc.doc.number}</div>}
                  {previewDoc.doc?.bankName && (
                    <div>
                      <strong>Bank:</strong> {previewDoc.doc.bankName} | <strong>A/C:</strong> {previewDoc.doc.accountNumber} | <strong>IFSC:</strong> {previewDoc.doc.ifsc}
                    </div>
                  )}
                  {previewDoc.doc?.refNo && <div><strong>Challan / Ref No:</strong> {previewDoc.doc.refNo}</div>}
                  {previewDoc.doc?.clearanceDate && <div><strong>Clearance Date:</strong> {previewDoc.doc.clearanceDate}</div>}
                  <div style={{ marginTop: 4 }}>
                    <strong>Verification Status:</strong>{' '}
                    <span style={{ fontWeight: 700, color: previewDoc.doc?.status === 'Verified' ? '#059669' : '#2563eb' }}>
                      {previewDoc.doc?.status}
                    </span>
                  </div>
                </div>

                {/* Photos */}
                {previewDoc.doc?.photo && (
                  <div className={styles.docImageWrap}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                      Uploaded Proof / Slip
                    </div>
                    <img src={previewDoc.doc.photo} alt="Document Proof" className={styles.docImage} />
                  </div>
                )}

                {previewDoc.doc?.photoFront && (
                  <div className={styles.docImageWrap}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                      Front Side
                    </div>
                    <img src={previewDoc.doc.photoFront} alt="Front Side" className={styles.docImage} />
                  </div>
                )}

                {previewDoc.doc?.photoBack && (
                  <div className={styles.docImageWrap}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                      Back Side (Address Proof)
                    </div>
                    <img src={previewDoc.doc.photoBack} alt="Back Side" className={styles.docImage} />
                  </div>
                )}

                {previewDoc.doc?.fileUrl && !previewDoc.doc?.photo && !previewDoc.doc?.photoFront && (
                  <div className={styles.docImageWrap}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                      Uploaded Document File / Proof
                    </div>
                    {previewDoc.doc.fileUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|webp)($|\?)/i.test(previewDoc.doc.fileUrl) ? (
                      <img src={previewDoc.doc.fileUrl} alt="Document Proof" className={styles.docImage} />
                    ) : (
                      <a href={previewDoc.doc.fileUrl} target="_blank" rel="noreferrer" className={styles.previewDocBtn} style={{ display: 'inline-flex', padding: '10px 18px', fontSize: 13 }}>
                        <ExternalLink size={16} /> View Uploaded File
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalRejectBtn}
                  onClick={() => {
                    handleDocStatusChange(previewDoc.key, 'Rejected');
                    setPreviewDoc(null);
                  }}
                >
                  ✕ Mark as Rejected
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    style={{ height: 36 }}
                    onClick={() => setPreviewDoc(null)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className={styles.modalVerifyBtn}
                    onClick={() => {
                      handleDocStatusChange(previewDoc.key, 'Verified');
                      setPreviewDoc(null);
                    }}
                  >
                    <Check size={16} /> Mark as Verified
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.message && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'success' })}
          />
        )}
      </div>
    </AdminLayout>
  );
}
