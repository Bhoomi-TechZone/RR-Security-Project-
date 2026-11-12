import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Users,
  FileCheck2,
  Shirt,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  Sparkles,
  ShieldCheck,
  Phone,
  MessageCircle,
  Mail,
  Edit2,
  Trash2
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useCompany } from '../../context/CompanyContext';
import masterService from '../../services/masterService';
import onboardingService from '../../services/onboardingService';
import {
  getStoredOnboarding,
  fetchCompanyOnboarding,
  convertToEmployee,
  deleteOnboardingCandidate,
  ONBOARDING_STAGES
} from '../../data/onboardingData';
import { JOB_CATEGORIES } from '../../data/recruitmentData';
import styles from './Onboarding.module.css';

const formatINR = (val) => {
  if (!val && val !== 0) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { activeCompany } = useCompany();
  const currentCompanyId = activeCompany?.companyId || activeCompany?.id || 'RRS8392014SEC';

  const [onboardingList, setOnboardingList] = useState([]);
  const [categoriesList, setCategoriesList] = useState(JOB_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState(() => searchParams.get('stage') || 'all');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, candidate: null });

  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadData = useCallback(async () => {
    if (!currentCompanyId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    const cached = getStoredOnboarding(currentCompanyId);
    setOnboardingList(cached);
    setIsLoading(true);
    try {
      const live = await fetchCompanyOnboarding(currentCompanyId);
      if (Array.isArray(live)) {
        setOnboardingList(live);
      }
    } catch (err) {
      console.warn('Error loading live onboarding candidates:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentCompanyId]);

  useEffect(() => {
    loadData();

    const handleUpdate = (e) => {
      if (!e.detail?.companyId || e.detail.companyId === currentCompanyId) {
        loadData();
      }
    };
    window.addEventListener('onboarding-data-updated', handleUpdate);
    return () => window.removeEventListener('onboarding-data-updated', handleUpdate);
  }, [loadData, currentCompanyId]);

  // Dynamically load company job categories from MongoDB
  useEffect(() => {
    let isMounted = true;
    masterService.getMasters('job-categories', currentCompanyId, true)
      .then((masters) => {
        if (isMounted && Array.isArray(masters) && masters.length > 0) {
          const names = masters
            .filter((m) => !m.status || m.status.toLowerCase() === 'active')
            .map((m) => m.name || m);
          if (names.length > 0) setCategoriesList(names);
        }
      })
      .catch(() => {});

    const handleCatsUpdated = () => {
      masterService.getMasters('job-categories', currentCompanyId, true)
        .then((masters) => {
          if (isMounted && Array.isArray(masters) && masters.length > 0) {
            const names = masters
              .filter((m) => !m.status || m.status.toLowerCase() === 'active')
              .map((m) => m.name || m);
            if (names.length > 0) setCategoriesList(names);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('job-categories-updated', handleCatsUpdated);
    window.addEventListener('masters-updated', handleCatsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('job-categories-updated', handleCatsUpdated);
      window.removeEventListener('masters-updated', handleCatsUpdated);
    };
  }, [currentCompanyId]);

  // Sync tab with URL
  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage) {
      setSelectedStage(stage);
    }
  }, [searchParams]);

  const handleStageChange = (stageId) => {
    setSelectedStage(stageId);
    if (stageId === 'all') {
      searchParams.delete('stage');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ stage: stageId });
    }
  };

  const handleDirectConvert = async (item) => {
    try {
      const res = await convertToEmployee(item.id, null, currentCompanyId);
      const code = res?.employee?.employeeId || res?.employeeCode || 'RR-XXX';
      showToast(
        `Congratulations! ${item.candidateName} is now officially converted to Employee (${code})!`,
        'success'
      );
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to convert to employee', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.candidate) return;
    try {
      await deleteOnboardingCandidate(deleteModal.candidate.id, currentCompanyId);
      showToast(`Candidate ${deleteModal.candidate.candidateName} removed from onboarding pipeline.`, 'success');
      setDeleteModal({ isOpen: false, candidate: null });
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to remove candidate', 'error');
    }
  };

  const [sendingEmailId, setSendingEmailId] = useState(null);
  const handleSendEmailInvite = async (item) => {
    if (!item.email) {
      showToast('Candidate does not have an email address specified.', 'error');
      return;
    }
    setSendingEmailId(item.id);
    try {
      await onboardingService.sendOnboardingInvite(item.id, item.email, currentCompanyId);
      showToast(`✓ Onboarding invitation email sent to ${item.email}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send invitation email', 'error');
    } finally {
      setSendingEmailId(null);
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const inPipeline = onboardingList.filter((item) => item.stage !== 'completed').length;
    const docVerification = onboardingList.filter((item) => item.stage === 'document_verification').length;
    const readyToDeploy = onboardingList.filter((item) => item.stage === 'ready_to_deploy').length;
    const completed = onboardingList.filter((item) => item.stage === 'completed').length;
    return { inPipeline, docVerification, readyToDeploy, completed };
  }, [onboardingList]);

  // Filtered Candidates
  const filteredList = useMemo(() => {
    return onboardingList.filter((item) => {
      // Stage filter
      if (selectedStage !== 'all' && item.stage !== selectedStage) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all') {
        const catStr = Array.isArray(item.jobCategory) ? item.jobCategory.join(', ') : (item.jobCategory || '');
        if (!catStr.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }
      // Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (item.candidateName || '').toLowerCase().includes(q);
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchCandidateId = (item.candidateId || '').toLowerCase().includes(q);
        const matchMobile = (item.mobile || '').includes(q);
        const matchRole = (item.appliedFor || '').toLowerCase().includes(q);
        const matchClient = (item.assignedClient || '').toLowerCase().includes(q);
        const matchSite = (item.assignedSite || '').toLowerCase().includes(q);
        const matchEmpCode = (item.createdEmployeeCode || '').toLowerCase().includes(q);
        if (
          !matchName &&
          !matchId &&
          !matchCandidateId &&
          !matchMobile &&
          !matchRole &&
          !matchClient &&
          !matchSite &&
          !matchEmpCode
        ) {
          return false;
        }
      }
      return true;
    });
  }, [onboardingList, selectedStage, selectedCategory, searchTerm]);

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'offer_accepted':
        return (
          <span className={styles.stageBadge} style={{ background: '#eff6ff', color: '#1d4ed8' }}>
            <Clock size={12} /> Offer Accepted
          </span>
        );
      case 'document_verification':
        return (
          <span className={styles.stageBadge} style={{ background: '#f5f3ff', color: '#6d28d9' }}>
            <FileCheck2 size={12} /> Doc Verification
          </span>
        );
      case 'uniform_allocation':
        return (
          <span className={styles.stageBadge} style={{ background: '#fffbeb', color: '#b45309' }}>
            <Shirt size={12} /> Uniform Allocation
          </span>
        );
      case 'ready_to_deploy':
        return (
          <span className={styles.stageBadge} style={{ background: '#ecfdf5', color: '#047857' }}>
            <ShieldCheck size={12} /> Ready for Deploy
          </span>
        );
      case 'completed':
        return (
          <span className={styles.stageBadge} style={{ background: '#ecfeff', color: '#0e7490' }}>
            <CheckCircle2 size={12} /> Converted to Staff
          </span>
        );
      default:
        return (
          <span className={styles.stageBadge} style={{ background: '#f1f5f9', color: '#475569' }}>
            {stage}
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/admin/dashboard" className={styles.crumbLink}>
            Home
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink}>Talent Acquisition</span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Onboarding</span>
        </nav>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>
              <UserCheck className={styles.titleIcon} size={28} />
              Workforce Onboarding Pipeline
            </h1>
            <p className={styles.description}>
              Document verification, uniform kit allocation, and site deployment pipeline.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link to="/admin/employees/add" className={styles.secondaryBtn}>
              <Sparkles size={16} />
              <span>Direct Add Employee</span>
            </Link>
            <Link to="/admin/onboarding/add" className={styles.primaryBtn}>
              <UserPlus size={16} />
              <span>New Onboard</span>
            </Link>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>In Onboarding</span>
              <span className={styles.metricValue}>{metrics.inPipeline}</span>
              <span className={styles.metricDesc}>Active in pipeline</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Document Verification</span>
              <span className={styles.metricValue}>{metrics.docVerification}</span>
              <span className={styles.metricDesc}>Aadhaar/Police checks</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <FileCheck2 size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Ready for Deploy</span>
              <span className={styles.metricValue}>{metrics.readyToDeploy}</span>
              <span className={styles.metricDesc}>Cleared & site assigned</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Converted to Staff</span>
              <span className={styles.metricValue}>{metrics.completed}</span>
              <span className={styles.metricDesc}>Officially joined</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#ecfeff', color: '#0891b2' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filter Controls */}
        <div className={styles.toolbarCard}>
          <div className={styles.filterControls}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search candidate name, ID, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Job Category Filter */}
            <select
              className={styles.filterSelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Job Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              className={styles.filterSelect}
              value={selectedStage}
              onChange={(e) => handleStageChange(e.target.value)}
            >
              <option value="all">All Stages ({onboardingList.length})</option>
              {ONBOARDING_STAGES.filter((s) => s.id !== 'all').map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>

            {(searchTerm || selectedCategory !== 'all' || selectedStage !== 'all') && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedStage('all');
                  navigate('/admin/onboarding');
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.onboardingTable}>
              <thead>
                <tr>
                  <th>Candidate & ID</th>
                  <th>Contact Details</th>
                  <th>Joining Date</th>
                  <th>Documents Status</th>
                  <th>Current Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <Users size={28} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>No candidates in onboarding</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                          No records match your selected filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const uploadedEntries = Object.entries(item.documents || {}).filter(([_, d]) => {
                      if (!d) return false;
                      return Boolean(d.photo || d.photoFront || d.photoBack || d.fileUrl || (d.number && d.status !== 'Pending'));
                    });
                    const uploadedCount = uploadedEntries.length;
                    const verifiedCount = uploadedEntries.filter(([_, d]) => d?.status === 'Verified' || d?.status === 'Approved').length;
                    const isAllDocsVerified = uploadedCount > 0 && verifiedCount === uploadedCount;

                    return (
                      <tr key={item.id} className={styles.tableRow}>
                        {/* Candidate & ID */}
                        <td>
                          <div className={styles.candidateCell}>
                            {item.photo ? (
                              <img src={item.photo} alt={item.candidateName} className={styles.avatar} />
                            ) : (
                              <div className={styles.avatarFallback}>
                                {(item.candidateName || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link to={`/admin/onboarding/${item._id || item.id}`} className={styles.candidateLink}>
                                {item.candidateName}
                              </Link>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={styles.badgeId}>{item.id}</span>
                                {item.appliedFor && (
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                                    • {item.appliedFor}
                                  </span>
                                )}
                                {item.candidateId && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    ({item.candidateId})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                              <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                              <span>{item.mobile || '—'}</span>
                              {item.mobile && (
                                <a
                                  href={`https://wa.me/91${item.mobile.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#16a34a', display: 'inline-flex' }}
                                  title="WhatsApp Candidate"
                                >
                                  <MessageCircle size={14} />
                                </a>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                              <span style={{ color: 'var(--text-muted)' }}>{item.email || '—'}</span>
                              {item.email && (
                                <button
                                  type="button"
                                  onClick={() => handleSendEmailInvite(item)}
                                  disabled={sendingEmailId === item.id}
                                  title="Send / Resend Onboarding Invitation Email with Verification Link"
                                  style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#2563eb',
                                    borderRadius: 4,
                                    padding: '1px 6px',
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3
                                  }}
                                >
                                  <Mail size={10} />
                                  <span>{sendingEmailId === item.id ? 'Sending...' : 'Invite'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Joining Date */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                            <Calendar size={14} style={{ color: '#059669' }} />
                            {item.proposedJoiningDate || 'TBD'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Offered: {formatINR(item.offeredSalary)}
                          </div>
                        </td>

                        {/* Documents Status */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                              className={styles.progressPill}
                              style={{
                                background: isAllDocsVerified ? '#ecfdf5' : '#fefce8',
                                color: isAllDocsVerified ? '#059669' : '#854d0e',
                                border: `1px solid ${isAllDocsVerified ? '#a7f3d0' : '#fef08a'}`
                              }}
                            >
                              <FileCheck2 size={13} />
                              {uploadedCount > 0 ? `${verifiedCount} of ${uploadedCount} Verified` : '0 Uploaded'}
                            </span>
                            {item.selfSubmitted ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle2 size={12} /> Docs Uploaded by Candidate
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> Awaiting Candidate Submission
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Current Stage */}
                        <td>{getStageBadge(item.stage)}</td>

                        {/* Actions */}
                        <td>
                          <div className={styles.actionCell}>
                            {item.stage !== 'completed' ? (
                              <button
                                className={styles.convertBtn}
                                onClick={() => handleDirectConvert(item)}
                                title="Convert to permanent Employee record"
                              >
                                <Sparkles size={13} />
                                <span>Convert to Employee</span>
                              </button>
                            ) : (
                              <span
                                className={styles.convertedTag}
                                title={`Permanent Employee Code: ${item.createdEmployeeCode}`}
                              >
                                <CheckCircle2 size={13} />
                                <span>{item.createdEmployeeCode}</span>
                              </span>
                            )}

                            <Link
                              to={`/admin/onboarding/${item._id || item.id}`}
                              className={styles.viewBtn}
                              title="Open Full Onboarding Dossier"
                            >
                              <Eye size={13} />
                              <span>Dossier</span>
                            </Link>

                            {/* Edit Action Button (Dedicated Edit Page) */}
                            <Link
                              to={`/admin/onboarding/${item._id || item.id}/edit`}
                              className={styles.editBtn}
                              title="Edit Onboarding Details"
                              aria-label="Edit onboarding details"
                            >
                              <Edit2 size={13} />
                            </Link>

                            {/* Delete Action Button (Protected if already converted) */}
                            {item.stage !== 'completed' ? (
                              <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={() => setDeleteModal({ isOpen: true, candidate: item })}
                                title="Remove from Onboarding Pipeline"
                                aria-label="Delete candidate from onboarding"
                              >
                                <Trash2 size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={styles.deleteBtnDisabled}
                                disabled
                                title="Converted to Employee (Cannot be deleted)"
                                aria-label="Delete disabled for converted employee"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Remove from Onboarding?"
          description={
            deleteModal.candidate
              ? `Are you sure you want to remove ${deleteModal.candidate.candidateName} (${deleteModal.candidate.id}) from the onboarding pipeline? This will cancel their onboarding.`
              : ''
          }
          confirmLabel="Delete Record"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, candidate: null })}
        />

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
