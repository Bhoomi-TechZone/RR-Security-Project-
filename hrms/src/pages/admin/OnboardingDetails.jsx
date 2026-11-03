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
  Check
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import {
  getStoredOnboarding,
  updateOnboardingCandidate,
  convertToEmployee,
  UNIFORM_SHIRT_SIZES,
  UNIFORM_TROUSER_SIZES,
  BOOT_SIZES,
  ONBOARDING_STAGES
} from '../../data/onboardingData';
import styles from './OnboardingDetails.module.css';

const formatINR = (val) => {
  if (!val && val !== 0) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export default function OnboardingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadData = useCallback(() => {
    const list = getStoredOnboarding();
    const found = list.find((item) => item.id === id);
    if (found) {
      setCandidate(found);
    }
  }, [id]);

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
  const handleDocStatusChange = (docKey, newStatus) => {
    const updatedDocs = {
      ...candidate.documents,
      [docKey]: {
        ...candidate.documents[docKey],
        status: newStatus
      }
    };
    updateOnboardingCandidate(candidate.id, { documents: updatedDocs });
    setCandidate((prev) => ({ ...prev, documents: updatedDocs }));
    showToast(`Updated ${docKey} verification status to ${newStatus}.`, 'success');
  };

  // Update uniform sizing
  const handleUniformChange = (field, value) => {
    const updatedKit = {
      ...candidate.uniformKit,
      [field]: value
    };
    updateOnboardingCandidate(candidate.id, { uniformKit: updatedKit });
    setCandidate((prev) => ({ ...prev, uniformKit: updatedKit }));
  };

  // Convert to permanent Employee
  const handleConvertEmployee = () => {
    const generatedEmpCode = `RR-${Math.floor(100 + Math.random() * 900)}`;
    const converted = convertToEmployee(candidate.id, generatedEmpCode);
    setCandidate(converted);
    showToast(
      `Candidate successfully converted to permanent Employee record (${generatedEmpCode})!`,
      'success'
    );
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
                  {candidate.candidateName.charAt(0).toUpperCase()}
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
                <button className={styles.convertBtn} onClick={handleConvertEmployee}>
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
                            {doc.bankName && `Bank: ${doc.bankName} • `}
                            Status: <strong style={{ color: statusColor }}>{doc.status}</strong>
                          </div>
                        </div>
                      </div>

                      <div className={styles.docStatusControls}>
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
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {candidate.uniformKit?.badgeIssued ? 'Kit Issued' : 'Kit Pending'}
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

          {/* Right Column: Deployment & Offer Terms */}
          <div>
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
                      updateOnboardingCandidate(candidate.id, { assignedClient: val });
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
                      updateOnboardingCandidate(candidate.id, { assignedSite: val });
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
                      updateOnboardingCandidate(candidate.id, { assignedShift: val });
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
                      updateOnboardingCandidate(candidate.id, { proposedJoiningDate: val });
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

