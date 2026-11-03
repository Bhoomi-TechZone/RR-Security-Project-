import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Filter,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Phone,
  AlertCircle,
  BadgeCheck
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Toast from '../../components/common/Toast';
import {
  getStoredOnboarding,
  convertToEmployee,
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

  const [onboardingList, setOnboardingList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState(() => searchParams.get('stage') || 'all');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => setToast({ message, type });

  const loadData = useCallback(() => {
    const list = getStoredOnboarding();
    setOnboardingList(list);
  }, []);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('onboarding-data-updated', handleUpdate);
    return () => window.removeEventListener('onboarding-data-updated', handleUpdate);
  }, [loadData]);

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

  const handleDirectConvert = (item) => {
    const generatedEmpCode = `RR-${Math.floor(200 + Math.random() * 700)}`;
    convertToEmployee(item.id, generatedEmpCode);
    showToast(
      `Congratulations! ${item.candidateName} is now officially converted to Employee (${generatedEmpCode})!`,
      'success'
    );
    loadData();
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = onboardingList.length;
    const docsPending = onboardingList.filter((i) => i.stage === 'document_verification').length;
    const uniformPending = onboardingList.filter((i) => i.stage === 'uniform_allocation').length;
    const readyToDeploy = onboardingList.filter((i) => i.stage === 'ready_to_deploy').length;
    const completed = onboardingList.filter((i) => i.stage === 'completed').length;
    return { total, docsPending, uniformPending, readyToDeploy, completed };
  }, [onboardingList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return onboardingList.filter((item) => {
      if (selectedStage !== 'all' && item.stage !== selectedStage) {
        return false;
      }
      if (selectedCategory !== 'all' && item.jobCategory !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (item.candidateName || '').toLowerCase().includes(q);
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchCandidateId = (item.candidateId || '').toLowerCase().includes(q);
        const matchRole = (item.appliedFor || '').toLowerCase().includes(q);
        const matchSite = (item.assignedSite || '').toLowerCase().includes(q);
        const matchClient = (item.assignedClient || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCandidateId && !matchRole && !matchSite && !matchClient) {
          return false;
        }
      }
      return true;
    });
  }, [onboardingList, selectedStage, selectedCategory, searchTerm]);

  const getStageBadge = (stage) => {
    const found = ONBOARDING_STAGES.find((s) => s.id === stage);
    let bg = '#eff6ff';
    let color = '#2563eb';
    if (stage === 'ready_to_deploy') {
      bg = '#ecfdf5';
      color = '#059669';
    } else if (stage === 'completed') {
      bg = '#ecfeff';
      color = '#0891b2';
    } else if (stage === 'uniform_allocation') {
      bg = '#fffbeb';
      color = '#d97706';
    } else if (stage === 'document_verification') {
      bg = '#f5f3ff';
      color = '#7c3aed';
    }

    return (
      <span className={styles.stageBadge} style={{ backgroundColor: bg, color }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
        {found?.label || stage}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/admin/dashboard" className={styles.crumbLink}>Home</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.separator}>Talent Acquisition</span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Onboarding</span>
        </div>

        {/* Page Header */}
        <div className={styles.header}>
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
              Direct Add Employee
            </Link>
            <Link to="/admin/onboarding/add" className={styles.primaryBtn}>
              <UserPlus size={16} />
              <span>New Onboard</span>
            </Link>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>In Onboarding</span>
              <span className={styles.metricValue}>{metrics.total}</span>
              <span className={styles.metricSubtext}>Active in pipeline</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={24} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Document Verification</span>
              <span className={styles.metricValue}>{metrics.docsPending}</span>
              <span className={styles.metricSubtext}>Aadhaar/Police checks</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <FileCheck2 size={24} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Ready for Deploy</span>
              <span className={styles.metricValue}>{metrics.readyToDeploy}</span>
              <span className={styles.metricSubtext}>Uniform & site assigned</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#ecfdf5', color: '#059669' }}>
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Converted to Staff</span>
              <span className={styles.metricValue}>{metrics.completed}</span>
              <span className={styles.metricSubtext}>Officially joined</span>
            </div>
            <div className={styles.metricIconWrap} style={{ background: '#ecfeff', color: '#0891b2' }}>
              <BadgeCheck size={24} />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters (Stage Tabs converted to Dropdown Select) */}
        <div className={styles.toolbarCard}>
          <div className={styles.filterControls}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search candidate name, ID, client, role, or site..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 1. All Job Categories (Shown first matching Recruitment) */}
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

            {/* 2. Onboarding Stage Filter (Converted from Tabs to Select) */}
            <select
              className={styles.filterSelect}
              value={selectedStage}
              onChange={(e) => handleStageChange(e.target.value)}
            >
              <option value="all">All Stages ({metrics.total})</option>
              {ONBOARDING_STAGES.filter((s) => s.id !== 'all').map((stg) => {
                const count = onboardingList.filter((i) => i.stage === stg.id).length;
                return (
                  <option key={stg.id} value={stg.id}>
                    {stg.label} ({count})
                  </option>
                );
              })}
            </select>

            {(searchTerm || selectedStage !== 'all' || selectedCategory !== 'all') && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  handleStageChange('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Onboarding Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.onboardingTable}>
              <thead>
                <tr>
                  <th>Candidate / Onboarding ID</th>
                  <th>Contact Details</th>
                  <th>Assigned Role & Client</th>
                  <th>Joining Date</th>
                  <th>Documents Status</th>
                  <th>Uniform Kit</th>
                  <th>Current Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No candidates currently found in this onboarding stage.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => {
                    const docKeys = Object.keys(item.documents || {});
                    const verifiedCount = docKeys.filter((k) => item.documents[k]?.status === 'Verified').length;
                    const isAllDocsVerified = verifiedCount === docKeys.length;

                    return (
                      <tr key={item.id} className={styles.tableRow}>
                        {/* Candidate Cell */}
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
                              <Link to={`/admin/onboarding/${item.id}`} className={styles.candidateLink}>
                                {item.candidateName}
                              </Link>
                              <span className={styles.badgeId}>{item.id}</span>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                Ref: {item.candidateId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                              {item.mobile || '—'}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {item.email || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Assigned Role & Client */}
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.appliedFor}
                          </div>
                          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                            {item.assignedClient || 'Unassigned Client'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {item.assignedSite || 'Site Pending'}
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
                          <span
                            className={styles.progressPill}
                            style={{
                              background: isAllDocsVerified ? '#ecfdf5' : '#fefce8',
                              color: isAllDocsVerified ? '#059669' : '#854d0e',
                              border: `1px solid ${isAllDocsVerified ? '#a7f3d0' : '#fef08a'}`
                            }}
                          >
                            <FileCheck2 size={13} />
                            {verifiedCount} of {docKeys.length} Verified
                          </span>
                        </td>

                        {/* Uniform Kit */}
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>
                            Shirt: {item.uniformKit?.shirtSize || '—'} | Boot: {item.uniformKit?.bootSize || '—'}
                          </span>
                          <div style={{ fontSize: 11, color: item.uniformKit?.badgeIssued ? '#059669' : '#d97706', marginTop: 2 }}>
                            {item.uniformKit?.badgeIssued ? '✓ Kit Issued' : '⏳ Kit Pending'}
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
                                Convert to Employee
                              </button>
                            ) : (
                              <span className={styles.convertedTag}>
                                <CheckCircle2 size={13} />
                                {item.createdEmployeeCode}
                              </span>
                            )}

                            <Link
                              to={`/admin/onboarding/${item.id}`}
                              className={styles.viewBtn}
                              title="Open Full Onboarding Dossier"
                            >
                              <Eye size={13} />
                              Dossier
                            </Link>
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

