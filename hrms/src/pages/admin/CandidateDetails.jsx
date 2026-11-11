import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  IndianRupee,
  Shield,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Award,
  Sparkles,
  UserCheck,
  Edit2,
  Loader2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import {
  getStoredCandidates,
  updateCandidateStatus,
  CANDIDATE_STATUSES
} from '../../data/recruitmentData';
import candidateService from '../../services/candidateService';
import { transferCandidateToOnboarding } from '../../data/onboardingData';
import styles from './CandidateDetails.module.css';

const formatINR = (val) => {
  if (!val && val !== 0) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [candidate, setCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'salary'
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isMoving, setIsMoving] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadCandidate = useCallback(async () => {
    const list = getStoredCandidates(currentCompanyId);
    const found = list.find((c) => c.id === id);
    if (found) {
      setCandidate(found);
    }
    try {
      const live = await candidateService.getCandidateById(id, currentCompanyId);
      if (live) {
        setCandidate(live);
      }
    } catch (_) {}
  }, [id, currentCompanyId]);

  useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  if (!candidate) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h2>Candidate Not Found</h2>
            <p style={{ color: 'var(--text-secondary)' }}>The requested candidate record "{id}" does not exist for this company profile.</p>
            <Link to="/admin/recruitment" className={styles.secondaryActionBtn} style={{ marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to Recruitment
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Direct Status Update Handler
  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'moved_to_onboarding') {
        await handleMoveToOnboard();
        return;
      }
      const updated = await updateCandidateStatus(candidate.id, newStatus, currentCompanyId);
      if (updated) {
        setCandidate(updated);
        const label = CANDIDATE_STATUSES.find((s) => s.id === newStatus)?.label || newStatus;
        showToast(`Candidate status updated to "${label}"`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Move to Onboarding
  const handleMoveToOnboard = async () => {
    try {
      setIsMoving(true);
      const liveOnboarding = await transferCandidateToOnboarding(
        candidate,
        {
          offeredSalary: candidate.expectedSalary,
          offeredDesignation: candidate.appliedFor
        },
        currentCompanyId
      );
      const updated = await updateCandidateStatus(candidate.id, 'moved_to_onboarding', currentCompanyId);
      if (updated) setCandidate(updated);

      const meta = liveOnboarding?._meta;
      const candidateEmail = (candidate.email || liveOnboarding?.email || '').trim();

      if (meta?.emailSent) {
        showToast(`✓ ${candidate.name} moved to Onboarding! Document verification email sent to ${candidateEmail}.`, 'success');
      } else if (!candidateEmail) {
        showToast(`${candidate.name} moved to Onboarding. (Notice: No email address on candidate profile)`, 'info');
      } else {
        showToast(`${candidate.name} moved to Onboarding. (Email notice: ${meta?.emailError || 'Configure SMTP in Company Preferences'})`, 'warning');
      }

      setTimeout(() => {
        navigate('/admin/onboarding');
      }, 750);
    } catch (err) {
      showToast(err.message || 'Failed to transfer candidate to onboarding', 'error');
      setIsMoving(false);
    }
  };

  const isSelected = candidate.status === 'selected';
  const isMoved = candidate.status === 'moved_to_onboarding';

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin/dashboard" className={styles.crumbLink}>Home</Link>
          <span className={styles.separator}>/</span>
          <Link to="/admin/recruitment" className={styles.crumbLink}>Recruitment</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>{candidate.name}</span>
        </div>

        {/* Hero Profile Card */}
        <div className={styles.profileHeroCard}>
          <div className={styles.heroMain}>
            <div className={styles.heroLeft}>
              {candidate.photo ? (
                <img src={candidate.photo} alt={candidate.name} className={styles.heroAvatar} />
              ) : (
                <div className={styles.heroAvatarFallback}>
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.heroBio}>
                <div className={styles.heroNameRow}>
                  <h1 className={styles.heroName}>{candidate.name}</h1>
                  <span className={styles.heroIdBadge}>{candidate.id}</span>

                  {/* Interactive Status Selector directly on Candidate Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Status:</span>
                    <select
                      value={candidate.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      style={{
                        height: 32,
                        padding: '0 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid #cbd5e1',
                        background:
                          candidate.status === 'selected'
                            ? '#ecfdf5'
                            : candidate.status === 'moved_to_onboarding'
                            ? '#ecfeff'
                            : candidate.status === 'rejected'
                            ? '#fef2f2'
                            : candidate.status === 'on_hold'
                            ? '#fdf2f8'
                            : '#eff6ff',
                        color:
                          candidate.status === 'selected'
                            ? '#059669'
                            : candidate.status === 'moved_to_onboarding'
                            ? '#0891b2'
                            : candidate.status === 'rejected'
                            ? '#dc2626'
                            : candidate.status === 'on_hold'
                            ? '#db2777'
                            : '#2563eb'
                      }}
                    >
                      <option value="applied">Applied</option>
                      <option value="selected">Selected</option>
                      <option value="on_hold">On Hold</option>
                      <option value="rejected">Rejected</option>
                      <option value="moved_to_onboarding">Moved to Onboarding</option>
                    </select>
                  </div>
                </div>

                <div className={styles.heroRole}>
                  <span>{candidate.appliedFor || candidate.jobCategory}</span>
                  <span>•</span>
                  <span>{Array.isArray(candidate.jobCategory) ? candidate.jobCategory.join(', ') : candidate.jobCategory}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>Source: {candidate.source || 'Walk-in'}</span>
                </div>

                <div className={styles.heroContactRow}>
                  <div className={styles.contactItem}>
                    <Phone size={14} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 600 }}>{candidate.mobile || '—'}</span>
                  </div>
                  {candidate.whatsapp && (
                    <a
                      href={`https://wa.me/91${candidate.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.contactItem}
                      style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </a>
                  )}
                  {candidate.email && (
                    <div className={styles.contactItem}>
                      <Mail size={14} style={{ color: '#64748b' }} />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  <div className={styles.contactItem}>
                    <MapPin size={14} style={{ color: '#64748b' }} />
                    <span>{candidate.city ? `${candidate.city}, ${candidate.state || ''}` : 'Location —'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Action Buttons */}
            <div className={styles.heroRight}>
              {/* If status is selected, allow 1-click move to onboard */}
              {isSelected && (
                <button
                  className={styles.primaryActionBtn}
                  onClick={handleMoveToOnboard}
                  disabled={isMoving}
                >
                  {isMoving ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      <span>Moving to Onboarding...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Move to Onboarding</span>
                    </>
                  )}
                </button>
              )}

              {isMoved && (
                <Link to="/admin/onboarding" className={styles.primaryActionBtn} style={{ background: '#0891b2' }}>
                  <UserCheck size={16} />
                  View in Onboarding Pipeline
                </Link>
              )}

              <Link to={`/admin/recruitment/${candidate.id}/edit`} className={styles.secondaryActionBtn}>
                <Edit2 size={16} />
                Edit Profile
              </Link>

              <Link to="/admin/recruitment" className={styles.secondaryActionBtn}>
                <ArrowLeft size={16} />
                Back to Candidates
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className={styles.metricsBar}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Expected Salary Band</span>
              <span className={styles.metricVal} style={{ color: '#0f172a' }}>
                {formatINR(candidate.expectedSalary)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Min: {formatINR(candidate.minExpectedSalary)} • Max: {formatINR(candidate.maxExpectedSalary)}
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Total Experience</span>
              <span className={styles.metricVal}>
                {candidate.experience === 'Fresher'
                  ? 'Fresher'
                  : `${candidate.totalExperienceYears || 0} Years`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Last: {candidate.lastCompany || 'None'}
              </span>
            </div>

            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Preferred Job Location</span>
              <span className={styles.metricVal} style={{ fontSize: 14 }}>
                {candidate.preferredLocation || 'Any Location'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Registered on {candidate.registrationDate || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <User size={16} />
            Candidate Bio & Profile
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'salary' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            <IndianRupee size={16} />
            Salary Alignment & Fitment
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className={styles.contentGrid}>
            <div>
              {/* Personal & Contact Details */}
              <div className={styles.cardBox}>
                <h3 className={styles.cardBoxTitle}>
                  <User size={18} style={{ color: '#2563eb' }} />
                  Contact & Residential Information
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Full Legal Name</span>
                    <span className={styles.infoVal}>{candidate.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Primary Mobile</span>
                    <span className={styles.infoVal}>{candidate.mobile || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Alternate Mobile</span>
                    <span className={styles.infoVal}>{candidate.altMobile || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>WhatsApp Number</span>
                    <span className={styles.infoVal}>{candidate.whatsapp || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email ID</span>
                    <span className={styles.infoVal}>{candidate.email || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Present Street Address</span>
                    <span className={styles.infoVal}>{candidate.address || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>City & State</span>
                    <span className={styles.infoVal}>{candidate.city}, {candidate.state}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Registration Date</span>
                    <span className={styles.infoVal}>{candidate.registrationDate || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Past Employment & Experience */}
              <div className={styles.cardBox}>
                <h3 className={styles.cardBoxTitle}>
                  <Briefcase size={18} style={{ color: '#2563eb' }} />
                  Previous Experience & Employer Details
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Experience Type</span>
                    <span className={styles.infoVal}>{candidate.experience}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Experience</span>
                    <span className={styles.infoVal}>
                      {candidate.experience === 'Fresher'
                        ? 'Fresher (No Prior Work)'
                        : `${candidate.totalExperienceYears} Years`}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Last Company / Agency</span>
                    <span className={styles.infoVal}>{candidate.lastCompany || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Last Drawn Salary</span>
                    <span className={styles.infoVal}>{formatINR(candidate.lastSalary)} / month</span>
                  </div>
                </div>
              </div>

              {/* Salary Expectations & Location */}
              <div className={styles.cardBox}>
                <h3 className={styles.cardBoxTitle}>
                  <IndianRupee size={18} style={{ color: '#2563eb' }} />
                  Salary Expectations & Job Location
                </h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Expected Salary</span>
                    <span className={styles.infoVal} style={{ color: '#2563eb' }}>{formatINR(candidate.expectedSalary)} / month</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Preferred Job Location</span>
                    <span className={styles.infoVal}>{candidate.preferredLocation || 'Any Location'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Minimum Expected Salary</span>
                    <span className={styles.infoVal}>{formatINR(candidate.minExpectedSalary)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Maximum Expected Salary</span>
                    <span className={styles.infoVal}>{formatINR(candidate.maxExpectedSalary)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Resume & Skills */}
            <div>
              {/* Resume Download / View */}
              <div className={styles.cardBox}>
                <h3 className={styles.cardBoxTitle}>
                  <FileText size={18} style={{ color: '#2563eb' }} />
                  Resume Document
                </h3>
                {candidate.resumeUrl ? (
                  <div className={styles.resumeDownloadCard}>
                    <div className={styles.resumeInfo}>
                      <div className={styles.resumeIconWrap}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                          {candidate.resumeUrl}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {candidate.resumeSize || 'Document File'}
                        </div>
                      </div>
                    </div>
                    <button
                      className={styles.resumeDownloadBtn}
                      onClick={() => showToast(`Opening ${candidate.resumeUrl}...`, 'info')}
                    >
                      <Download size={13} />
                      View
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                    No resume document uploaded for this candidate.
                  </p>
                )}
              </div>

              {/* Skills Card */}
              <div className={styles.cardBox}>
                <h3 className={styles.cardBoxTitle}>
                  <Award size={18} style={{ color: '#2563eb' }} />
                  Skills & Certifications
                </h3>
                <div className={styles.skillsContainer}>
                  {(candidate.skills || []).length > 0 ? (
                    candidate.skills.map((s) => (
                      <span key={s} className={styles.skillBadge}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No skills tagged</span>
                  )}
                </div>
              </div>

              {/* HR Remarks */}
              <div className={styles.cardBox}>
                <h3 className={styles.cardBoxTitle}>
                  <FileText size={18} style={{ color: '#2563eb' }} />
                  Remarks (HR Notes)
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                  {candidate.remarks || 'No remarks recorded.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALARY FITMENT & ALIGNMENT */}
        {activeTab === 'salary' && (
          <div className={styles.cardBox}>
            <h3 className={styles.cardBoxTitle}>
              <IndianRupee size={18} style={{ color: '#2563eb' }} />
              Salary Expectation vs Onboarding Fitment
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
              Evaluate candidate salary band against company guard/staff budget and past compensation.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Last Drawn Salary
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {formatINR(candidate.lastSalary)}
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>At {candidate.lastCompany || 'Previous Firm'}</span>
              </div>

              <div style={{ background: '#eff6ff', padding: 18, borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                  Target Expected Salary
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', marginTop: 4 }}>
                  {formatINR(candidate.expectedSalary)}
                </div>
                <span style={{ fontSize: 11, color: '#3b82f6' }}>Desired compensation</span>
              </div>

              <div style={{ background: '#fefce8', padding: 18, borderRadius: 10, border: '1px solid #fef08a' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>
                  Minimum Acceptable
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#a16207', marginTop: 4 }}>
                  {formatINR(candidate.minExpectedSalary)}
                </div>
                <span style={{ fontSize: 11, color: '#ca8a04' }}>Lowest floor</span>
              </div>

              <div style={{ background: '#fdf2f8', padding: 18, borderRadius: 10, border: '1px solid #fbcfe8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9d174d', textTransform: 'uppercase' }}>
                  Maximum Ceiling
                </span>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#be185d', marginTop: 4 }}>
                  {formatINR(candidate.maxExpectedSalary)}
                </div>
                <span style={{ fontSize: 11, color: '#db2777' }}>Upper ceiling</span>
              </div>
            </div>

            <div style={{ marginTop: 24, padding: 18, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#166534' }}>
                    Current Status: {candidate.status.toUpperCase()}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#15803d' }}>
                    {isSelected
                      ? 'Candidate is Selected. You can directly proceed to Onboard.'
                      : 'Update status to Selected / Shortlisted to process candidate for Onboarding.'}
                  </p>
                </div>
                {isSelected && (
                  <button
                    className={styles.primaryActionBtn}
                    onClick={handleMoveToOnboard}
                    disabled={isMoving}
                  >
                    {isMoving ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Moving to Onboarding...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Move to Onboarding</span>
                      </>
                    )}
                  </button>
                )}
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

        {/* Professional Moving-to-Onboarding Overlay */}
        {isMoving && candidate && (
          <div className={styles.movingOverlay}>
            <div className={styles.movingCard}>
              <div className={styles.spinnerWrapper}>
                <div className={styles.pulseRing}></div>
                <Loader2 className={styles.largeSpinner} size={36} />
              </div>
              <h3 className={styles.movingTitle}>Transferring to Onboarding</h3>
              <p className={styles.movingSubtitle}>
                Generating onboarding dossier for <strong>{candidate.name}</strong> ({candidate.id})
              </p>
              <div className={styles.movingProgressText}>
                <span className={styles.progressDot}></span>
                <span>Preparing digital verification form & dispatching email...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
