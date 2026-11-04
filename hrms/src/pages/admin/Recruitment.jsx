import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Sparkles,
  UserCheck
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  getStoredCandidates,
  updateCandidateStatus,
  deleteCandidate,
  CANDIDATE_STATUSES,
  JOB_CATEGORIES
} from '../../data/recruitmentData';
import { transferCandidateToOnboarding } from '../../data/onboardingData';
import styles from './Recruitment.module.css';

const formatINR = (val) => {
  if (!val && val !== 0) return '—';
  return `₹${Number(val).toLocaleString('en-IN')}`;
};

export default function Recruitment() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExp, setSelectedExp] = useState('all');
  const [statusTab, setStatusTab] = useState(() => searchParams.get('status') || 'all');
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, candidate: null });

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadCandidates = useCallback(() => {
    const list = getStoredCandidates();
    setCandidates(list);
  }, []);

  useEffect(() => {
    loadCandidates();

    const handleUpdate = () => loadCandidates();
    window.addEventListener('recruitment-data-updated', handleUpdate);
    return () => window.removeEventListener('recruitment-data-updated', handleUpdate);
  }, [loadCandidates]);

  // Sync tab with URL
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusTab(status);
    }
  }, [searchParams]);

  const handleStatusTabChange = (statusId) => {
    setStatusTab(statusId);
    if (statusId === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: statusId });
    }
  };

  const handleStatusChange = (candidateId, newStatus) => {
    updateCandidateStatus(candidateId, newStatus);
    const label = CANDIDATE_STATUSES.find((s) => s.id === newStatus)?.label || newStatus;
    showToast(`Status updated to "${label}"`, 'success');
    loadCandidates();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedExp('all');
    setStatusTab('all');
    navigate('/admin/recruitment');
  };

  const handleMoveToOnboard = (candidate, e) => {
    e.stopPropagation();
    try {
      transferCandidateToOnboarding(candidate, {
        offeredSalary: candidate.expectedSalary,
        offeredDesignation: candidate.appliedFor
      });
      updateCandidateStatus(candidate.id, 'moved_to_onboarding');
      showToast(`${candidate.name} has been processed for Onboarding!`, 'success');
      loadCandidates();
    } catch (err) {
      showToast('Failed to transfer candidate to onboarding', 'error');
    }
  };

  const confirmDelete = () => {
    if (!deleteModal.candidate) return;
    deleteCandidate(deleteModal.candidate.id);
    showToast(`Candidate ${deleteModal.candidate.name} removed.`, 'success');
    setDeleteModal({ isOpen: false, candidate: null });
    loadCandidates();
  };

  // Metrics calculation (No interview round metrics)
  const metrics = useMemo(() => {
    const total = candidates.length;
    const applied = candidates.filter((c) => c.status === 'applied').length;
    const selected = candidates.filter((c) => c.status === 'selected').length;
    const moved = candidates.filter((c) => c.status === 'moved_to_onboarding').length;
    return { total, applied, selected, moved };
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Status Tab filter
      if (statusTab !== 'all' && c.status !== statusTab) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && !(Array.isArray(c.jobCategory) ? c.jobCategory : (c.jobCategory || '').split(',').map((x) => x.trim())).some((cat) => cat.toLowerCase() === selectedCategory.toLowerCase())) {
        return false;
      }
      // Experience filter
      if (selectedExp !== 'all' && c.experience !== selectedExp) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = (c.name || '').toLowerCase().includes(query);
        const matchId = (c.id || '').toLowerCase().includes(query);
        const matchMobile = (c.mobile || '').includes(query);
        const matchRole = (c.appliedFor || '').toLowerCase().includes(query);
        const matchCity = (c.city || '').toLowerCase().includes(query);
        const matchCompany = (c.lastCompany || '').toLowerCase().includes(query);
        const matchSkills = (c.skills || []).some((s) => s.toLowerCase().includes(query));
        if (!matchName && !matchId && !matchMobile && !matchRole && !matchCity && !matchCompany && !matchSkills) {
          return false;
        }
      }
      return true;
    });
  }, [candidates, statusTab, selectedCategory, selectedExp, searchTerm]);

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/admin/dashboard" className={styles.crumbLink}>
            Dashboard
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbLink}>Talent & Recruitment</span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Recruitment</span>
        </nav>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>
              <Users className={styles.titleIcon} size={28} />
              Candidate Directory & Recruitment
            </h1>
            <p className={styles.description}>
              Walk-in registrations, candidate profiles, fitment evaluation, and status-driven onboarding pipeline.
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link to="/admin/recruitment/add" className={styles.primaryBtn}>
              <UserPlus size={16} />
              <span>Add New Candidate</span>
            </Link>
          </div>
        </header>

        {/* KPI Metrics Summary */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Candidates</span>
              <span className={styles.metricValue}>{metrics.total}</span>
              <span className={styles.metricSubtext}>In Talent Pool</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Applied (New Entries)</span>
              <span className={styles.metricValue}>{metrics.applied}</span>
              <span className={styles.metricSubtext}>Awaiting Review</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Clock size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Selected</span>
              <span className={styles.metricValue}>{metrics.selected}</span>
              <span className={styles.metricSubtext}>Ready to Onboard</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#ecfdf5', color: '#10b981' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>In Onboarding</span>
              <span className={styles.metricValue}>{metrics.moved}</span>
              <span className={styles.metricSubtext}>Deploying to Clients</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#ecfeff', color: '#0891b2' }}>
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filter Controls (Status converted to Filter Select, Job Categories shown first) */}
        <div className={styles.toolbarCard}>
          <div className={styles.filterControls}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search candidate name, ID, phone, skill, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* 1. All Job Categories (Shown First as requested) */}
            <select
              className={styles.filterSelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Job Categories</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* 2. Candidate Status Filter (Converted from Tabs to Filter Select) */}
            <select
              className={styles.filterSelect}
              value={statusTab}
              onChange={(e) => handleStatusTabChange(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {CANDIDATE_STATUSES.filter((s) => s.id !== 'all').map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>

            {/* 3. All Experience Levels */}
            <select
              className={styles.filterSelect}
              value={selectedExp}
              onChange={(e) => setSelectedExp(e.target.value)}
            >
              <option value="all">All Experience Levels</option>
              <option value="Fresher">Freshers</option>
              <option value="Experienced">Experienced Candidates</option>
            </select>

            {(searchTerm || selectedCategory !== 'all' || selectedExp !== 'all' || statusTab !== 'all') && (
              <button className={styles.resetBtn} onClick={handleResetFilters}>
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Candidates Table (Structured Exactly According to Add Form Fields) */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.candidateTable}>
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Candidate Name</th>
                  <th>Reg. Date</th>
                  <th>Job Category & Applied For</th>
                  <th>Contact Details</th>
                  <th>Address & Location</th>
                  <th>Experience</th>
                  <th>Previous Org & Last Salary</th>
                  <th>Expected Salary Band</th>
                  <th>Skills</th>
                  <th>Source</th>
                  <th>Resume</th>
                  <th>Candidate Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={14}>
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <Users size={28} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>No candidates found</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                          Try adjusting your search criteria or register a new candidate.
                        </p>
                        <Link to="/admin/recruitment/add" className={styles.primaryBtn} style={{ marginTop: 8 }}>
                          <UserPlus size={16} />
                          Add New Candidate
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => {
                    const isSelected = c.status === 'selected';
                    const isMoved = c.status === 'moved_to_onboarding';

                    return (
                      <tr key={c.id} className={styles.candidateRow}>
                        {/* 1. Candidate ID */}
                        <td>
                          <span
                            className={styles.candidateIdBadge}
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 12,
                              background: '#eff6ff',
                              color: '#1d4ed8'
                            }}
                          >
                            {c.id}
                          </span>
                        </td>

                        {/* 2. Candidate Photo & Full Name */}
                        <td>
                          <div className={styles.candidateCell}>
                            {c.photo ? (
                              <img src={c.photo} alt={c.name} className={styles.avatar} />
                            ) : (
                              <div className={styles.avatarFallback}>
                                {(c.name || 'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <Link to={`/admin/recruitment/${c.id}`} className={styles.candidateNameLink}>
                                {c.name}
                              </Link>
                              {c.remarks && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    maxWidth: 160,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={c.remarks}
                                >
                                  {c.remarks}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Registration Date */}
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {c.registrationDate || '—'}
                          </span>
                        </td>

                        {/* 4. Job Category & Applied For */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                            {c.appliedFor || c.jobCategory}
                          </div>
                          <span className={styles.badgeCategory} style={{ marginTop: 2 }}>
                            {Array.isArray(c.jobCategory) ? c.jobCategory.join(', ') : c.jobCategory}
                          </span>
                        </td>

                        {/* 5. Contact Details (Primary, Alt, WhatsApp, Email) */}
                        <td>
                          <div className={styles.contactCell}>
                            <span className={styles.contactPhone}>
                              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                              {c.mobile || '—'}
                            </span>
                            <div className={styles.contactLinks}>
                              {c.whatsapp && (
                                <a
                                  href={`https://wa.me/91${c.whatsapp.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.contactIconBtn}
                                  title="WhatsApp Candidate"
                                >
                                  <MessageCircle size={13} style={{ color: '#16a34a' }} />
                                </a>
                              )}
                              {c.email && (
                                <a
                                  href={`mailto:${c.email}`}
                                  className={styles.contactIconBtn}
                                  title={`Email: ${c.email}`}
                                >
                                  <Mail size={13} style={{ color: '#2563eb' }} />
                                </a>
                              )}
                              {c.altMobile && (
                                <span
                                  style={{ fontSize: 10.5, color: 'var(--text-muted)' }}
                                  title={`Alt Mobile: ${c.altMobile}`}
                                >
                                  Alt: {c.altMobile}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 6. Present Address & Preferred Location */}
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {c.city ? `${c.city}, ${c.state || ''}` : '—'}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={`Preferred: ${c.preferredLocation || 'Any'} | Address: ${c.address || ''}`}
                          >
                            Pref: {c.preferredLocation || 'Any'}
                          </div>
                        </td>

                        {/* 7. Experience (Fresher / Experienced & Total Years) */}
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {c.experience === 'Fresher'
                              ? 'Fresher'
                              : `${c.totalExperienceYears || 0} Years`}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {c.experience}
                          </span>
                        </td>

                        {/* 8. Previous Employment (Last Company & Last Salary) */}
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 12,
                              color: 'var(--text-primary)',
                              maxWidth: 140,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={c.lastCompany || 'None'}
                          >
                            {c.lastCompany || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Last Sal: {c.lastSalary ? formatINR(c.lastSalary) : '—'}
                          </div>
                        </td>

                        {/* 9. Expected Salary Band */}
                        <td>
                          <div className={styles.salaryBand}>
                            <span className={styles.targetSalary}>{formatINR(c.expectedSalary)}</span>
                            <span className={styles.minMaxSalary}>
                              Range: {formatINR(c.minExpectedSalary)} - {formatINR(c.maxExpectedSalary)}
                            </span>
                          </div>
                        </td>

                        {/* 10. Skills (Multiple Skills) */}
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 150 }}>
                            {(c.skills || []).slice(0, 2).map((s) => (
                              <span key={s} className={styles.skillPillSmall}>
                                {s}
                              </span>
                            ))}
                            {(c.skills || []).length > 2 && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                                +{(c.skills || []).length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 11. Source */}
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '3px 8px',
                              borderRadius: 4,
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {c.source || 'Walk-in'}
                          </span>
                        </td>

                        {/* 12. Resume Upload */}
                        <td>
                          {c.resumeUrl ? (
                            <a
                              href={`#`}
                              onClick={(e) => {
                                e.preventDefault();
                                showToast(`Attached Resume: ${c.resumeUrl} (${c.resumeSize || 'Verified'})`, 'info');
                              }}
                              className={styles.resumeLink}
                              title={`Download/View ${c.resumeUrl}`}
                            >
                              <FileText size={12} />
                              <span>Resume</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        {/* 13. Candidate Status (Direct Status Dropdown - No interview rounds) */}
                        <td>
                          <select
                            value={c.status}
                            onChange={(e) => handleStatusChange(c.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              height: 32,
                              padding: '0 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              outline: 'none',
                              border: '1px solid #cbd5e1',
                              background:
                                c.status === 'selected'
                                  ? '#ecfdf5'
                                  : c.status === 'moved_to_onboarding'
                                  ? '#ecfeff'
                                  : c.status === 'rejected'
                                  ? '#fef2f2'
                                  : c.status === 'on_hold'
                                  ? '#fdf2f8'
                                  : '#eff6ff',
                              color:
                                c.status === 'selected'
                                  ? '#059669'
                                  : c.status === 'moved_to_onboarding'
                                  ? '#0891b2'
                                  : c.status === 'rejected'
                                  ? '#dc2626'
                                  : c.status === 'on_hold'
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
                        </td>

                        {/* 14. Actions */}
                        <td>
                          <div className={styles.actionCell}>
                            {/* If status is selected, allow 1-click move to onboard */}
                            {isSelected && (
                              <button
                                className={styles.onboardBtn}
                                onClick={(e) => handleMoveToOnboard(c, e)}
                                title="Move Selected Candidate to Onboarding"
                              >
                                <Sparkles size={13} />
                                Move to Onboard
                              </button>
                            )}

                            {isMoved && (
                              <Link
                                to="/admin/onboarding"
                                className={styles.inOnboardBtn}
                                title="View in Onboarding Pipeline"
                              >
                                <UserCheck size={13} />
                                <span>In Onboard</span>
                              </Link>
                            )}

                            <Link
                              to={`/admin/recruitment/${c.id}`}
                              className={styles.viewBtn}
                              title="View Full Candidate Profile"
                            >
                              <Eye size={13} />
                            </Link>

                            <Link
                              to={`/admin/recruitment/${c.id}/edit`}
                              className={styles.editBtn}
                              title="Edit Candidate"
                            >
                              <Edit2 size={13} />
                            </Link>

                            <button
                              className={styles.deleteBtn}
                              onClick={() => setDeleteModal({ isOpen: true, candidate: c })}
                              title="Delete Candidate Record"
                            >
                              <Trash2 size={13} />
                            </button>
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          title="Delete Candidate Record"
          message={`Are you sure you want to delete candidate ${deleteModal.candidate?.name} (${deleteModal.candidate?.id})? This action cannot be undone.`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ isOpen: false, candidate: null })}
        />

        {/* Toast Notification */}
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
