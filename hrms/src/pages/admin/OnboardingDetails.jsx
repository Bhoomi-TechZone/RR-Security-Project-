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
  MessageCircle,
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
  UNIFORM_SHIRT_SIZES,
  UNIFORM_TROUSER_SIZES,
  BOOT_SIZES,
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
    const found = list.find((item) => item.id === id);
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
      await updateOnboardingCandidate(candidate.id, { documents: updatedDocs }, currentCompanyId);
      setCandidate((prev) => ({ ...prev, documents: updatedDocs }));
      showToast(`Updated ${docKey} verification status to ${newStatus}.`, 'success');
    } catch (err) {
      showToast('Failed to update document status', 'error');
    }
  };

  // Update uniform sizing
  const handleUniformChange = async (field, value) => {
    const updatedKit = {
      ...candidate.uniformKit,
      [field]: value
    };
    try {
      await updateOnboardingCandidate(candidate.id, { uniformKit: updatedKit }, currentCompanyId);
      setCandidate((prev) => ({ ...prev, uniformKit: updatedKit }));
    } catch (err) {
      showToast('Failed to update uniform kit', 'error');
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

  const handleOpenWhatsApp = () => {
    const link = `${window.location.origin}/onboard/${candidate.id}`;
    const cleanMobile = (candidate.mobile || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${candidate.candidateName},\n\nWelcome to RR Security & Facilities! Please complete your digital onboarding & document verification using your official self-onboarding link below:\n\n🔗 ${link}\n\nPlease keep your Aadhaar, bank passbook/cheque, and uniform size ready.\n\nThank you,\nHR Department`
    );
    window.open(`https://wa.me/91${cleanMobile}?text=${text}`, '_blank');
  };

  const docEntries = Object.entries(candidate.documents || {});
  const verifiedCount = docEntries.filter(([_, doc]) => doc?.status === 'Verified').length;
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

                <div className={styles.heroRole}>
                  <span>{candidate.appliedFor}</span>
                  <span>•</span>
                  <span style={{ color: '#2563eb', fontWeight: 700 }}>{candidate.assignedClient}</span>
                  <span>•</span>
                  <span>{candidate.assignedSite}</span>
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

          {/* Candidate Self-Onboarding Share Strip */}
          <div className={styles.shareStrip}>
            <div className={styles.shareStripLeft}>
              {candidate.selfSubmitted ? (
                <span className={styles.selfSubmittedBadge}>
                  <CheckCircle2 size={15} /> Candidate Self-Onboarding Completed ({candidate.selfSubmittedAt ? new Date(candidate.selfSubmittedAt).toLocaleDateString('en-IN') : 'Submitted'})
                </span>
              ) : (
                <span className={styles.pendingSubmitBadge}>
                  <Clock size={15} /> Self-Onboarding Link Active (Awaiting Candidate Submission)
                </span>
              )}
              <span className={styles.shareStripUrl}>{`${window.location.origin}/onboard/${candidate.id}`}</span>
            </div>

            <div className={styles.shareStripActions}>
              <button
                type="button"
                className={styles.shareWhatsAppBtn}
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                title="Send official onboarding invitation email with link"
                style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
              >
                <Mail size={15} />
                <span>{isSendingEmail ? 'Sending...' : 'Email Link'}</span>
              </button>

              <button
                type="button"
                className={styles.shareWhatsAppBtn}
                onClick={handleOpenWhatsApp}
                title="Send self-onboarding link via WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp Link</span>
              </button>

              <button
                type="button"
                className={styles.copyLinkBtn}
                onClick={handleCopyLink}
                title="Copy link to clipboard"
              >
                <Copy size={15} />
                <span>Copy Link</span>
              </button>

              <a
                href={`/onboard/${candidate.id}`}
                target="_blank"
                rel="noreferrer"
                className={styles.previewLinkBtn}
                title="Preview candidate form in new tab"
              >
                <ExternalLink size={15} />
                <span>Candidate Portal</span>
              </a>
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
                {verifiedCount} / {docEntries.length} Cleared
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Uniform Sizing</span>
              <span className={styles.metricVal}>
                Shirt: {candidate.uniformKit?.shirtSize} | Boot: {candidate.uniformKit?.bootSize}
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
                  <span>Mandatory Document Verification Checklist</span>
                </div>
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
                  {verifiedCount} of {docEntries.length} Verified
                </span>
              </div>

              <div className={styles.docsList}>
                {docEntries.map(([key, doc]) => {
                  const isVerified = doc.status === 'Verified';
                  const isPending = doc.status === 'Pending';
                  const isUploaded = doc.status === 'Uploaded';

                  let statusColor = '#64748b';
                  let statusBg = '#f1f5f9';
                  if (isVerified) {
                    statusColor = '#059669';
                    statusBg = '#ecfdf5';
                  } else if (isUploaded) {
                    statusColor = '#2563eb';
                    statusBg = '#eff6ff';
                  } else if (isPending) {
                    statusColor = '#d97706';
                    statusBg = '#fffbeb';
                  }

                  const hasProof = Boolean(doc.photo || doc.photoFront || doc.photoBack);

                  return (
                    <div key={key} className={styles.docRow}>
                      <div className={styles.docInfo}>
                        <div className={styles.docIconWrap} style={{ background: statusBg, color: statusColor }}>
                          {isVerified ? <Check size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <div className={styles.docName}>{doc.documentName || key}</div>
                          <div className={styles.docMeta}>
                            {doc.number && `Number: ${doc.number} • `}
                            {doc.refNo && `Ref: ${doc.refNo} • `}
                            {doc.bankName && `Bank: ${doc.bankName} (A/C: ${doc.accountNumber || '—'}, IFSC: ${doc.ifsc || '—'}) • `}
                            Status: <strong style={{ color: statusColor }}>{doc.status}</strong>
                          </div>
                        </div>
                      </div>

                      <div className={styles.docStatusControls}>
                        {hasProof ? (
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
                        ) : (
                          <span className={styles.noDocBadge}>No Upload</span>
                        )}

                        <select
                          className={styles.docStatusSelect}
                          value={doc.status}
                          onChange={(e) => handleDocStatusChange(key, e.target.value)}
                        >
                          <option value="Verified">✓ Mark Verified</option>
                          <option value="Uploaded">Uploaded (Pending Verification)</option>
                          <option value="Pending">Pending Submission</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Uniform & Kit Allocation */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shirt size={18} style={{ color: '#2563eb' }} />
                  <span>Uniform Sizing & Security Equipment Kit</span>
                </div>
                <span style={{ fontSize: 12, color: candidate.uniformKit?.badgeIssued ? '#059669' : '#d97706', fontWeight: 600 }}>
                  {candidate.uniformKit?.badgeIssued ? '✓ Kit Issued' : '⏳ Kit Pending'}
                </span>
              </div>

              <div className={styles.uniformGrid}>
                <div className={styles.uniformItem}>
                  <label className={styles.itemLabel}>Uniform Shirt / Bush Shirt</label>
                  <select
                    className={styles.fieldInput}
                    value={candidate.uniformKit?.shirtSize || 'M (40)'}
                    onChange={(e) => handleUniformChange('shirtSize', e.target.value)}
                  >
                    {UNIFORM_SHIRT_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.uniformItem}>
                  <label className={styles.itemLabel}>Trouser Waist Size</label>
                  <select
                    className={styles.fieldInput}
                    value={candidate.uniformKit?.trouserSize || '32'}
                    onChange={(e) => handleUniformChange('trouserSize', e.target.value)}
                  >
                    {UNIFORM_TROUSER_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz} Inches</option>
                    ))}
                  </select>
                </div>

                <div className={styles.uniformItem}>
                  <label className={styles.itemLabel}>Safety DMS Boots / Shoes</label>
                  <select
                    className={styles.fieldInput}
                    value={candidate.uniformKit?.bootSize || '8'}
                    onChange={(e) => handleUniformChange('bootSize', e.target.value)}
                  >
                    {BOOT_SIZES.map((sz) => (
                      <option key={sz} value={sz}>Size {sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kit Items Checkboxes */}
              <div className={styles.kitChecklist}>
                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={Boolean(candidate.uniformKit?.capIssued)}
                    onChange={(e) => handleUniformChange('capIssued', e.target.checked)}
                  />
                  <span>Security Beret / Peak Cap Issued</span>
                </label>

                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={Boolean(candidate.uniformKit?.badgeIssued)}
                    onChange={(e) => handleUniformChange('badgeIssued', e.target.checked)}
                  />
                  <span>Chest Badge & Name Plate Issued</span>
                </label>

                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={Boolean(candidate.uniformKit?.whistleIssued)}
                    onChange={(e) => handleUniformChange('whistleIssued', e.target.checked)}
                  />
                  <span>Whistle & Lanyard Cord</span>
                </label>

                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={Boolean(candidate.uniformKit?.torchIssued)}
                    onChange={(e) => handleUniformChange('torchIssued', e.target.checked)}
                  />
                  <span>Rechargeable Night Baton / Torch</span>
                </label>

                <label className={styles.checkItem}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={Boolean(candidate.uniformKit?.idCardGenerated)}
                    onChange={(e) => handleUniformChange('idCardGenerated', e.target.checked)}
                  />
                  <span>Employee Security ID Card Printed</span>
                </label>
              </div>
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

            {/* Deployment Assignment */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} style={{ color: '#2563eb' }} />
                  <span>Client Site Deployment</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className={styles.infoField}>
                  <label className={styles.fieldLabel}>Assigned Client</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={candidate.assignedClient || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateOnboardingCandidate(candidate.id, { assignedClient: val }, currentCompanyId);
                      setCandidate((p) => ({ ...p, assignedClient: val }));
                    }}
                  />
                </div>

                <div className={styles.infoField}>
                  <label className={styles.fieldLabel}>Deployment Site / Post</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={candidate.assignedSite || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateOnboardingCandidate(candidate.id, { assignedSite: val }, currentCompanyId);
                      setCandidate((p) => ({ ...p, assignedSite: val }));
                    }}
                  />
                </div>

                <div className={styles.infoField}>
                  <label className={styles.fieldLabel}>Assigned Shift Duty</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={candidate.assignedShift || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateOnboardingCandidate(candidate.id, { assignedShift: val }, currentCompanyId);
                      setCandidate((p) => ({ ...p, assignedShift: val }));
                    }}
                  />
                </div>

                <div className={styles.infoField}>
                  <label className={styles.fieldLabel}>Proposed Joining Date</label>
                  <input
                    type="date"
                    className={styles.fieldInput}
                    value={candidate.proposedJoiningDate || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateOnboardingCandidate(candidate.id, { proposedJoiningDate: val }, currentCompanyId);
                      setCandidate((p) => ({ ...p, proposedJoiningDate: val }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Offer Summary Card */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} style={{ color: '#059669' }} />
                  <span>Agreed Compensation</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Offered Gross Salary:</span>
                  <strong style={{ color: '#0f172a' }}>{formatINR(candidate.offeredSalary)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>PF & ESI Compliance:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Applicable</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Uniform Allowance:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Included</span>
                </div>

                <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
                  {candidate.notes || 'Candidate cleared for joining subject to uniform issue.'}
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
