import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, 
  ShieldAlert, Bell, Plus, Search, Edit2, Trash2, Eye, 
  Save, RotateCcw, ArrowRight, Check, X, Info, Sparkles, 
  SlidersHorizontal, Clock, UserCheck, Shield, HelpCircle,
  BellRing, AlertCircle, ExternalLink, RefreshCw, Send,
  User, CheckCircle
} from 'lucide-react';
import styles from './DocumentCompliance.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useCompany } from '../../context/CompanyContext';
import complianceService from '../../services/complianceService';

const TABS = [
  { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
  { id: 'verification-rules', label: 'Verification Rules', icon: ShieldCheck },
  { id: 'expiry-alert', label: 'Expiry Alert & License Tracker', icon: Bell },
  { id: 'police-verification', label: 'Police Verification', icon: ShieldAlert }
];

const VERIFICATION_METHODS = [
  'Physical Verification',
  'Portal Verification',
  'Third-Party / District Magistrate Cross-Check',
  'Parivahan Sarathi Portal Check',
  'Police Station / Special Branch Dispatch'
];

const VERIFIER_ROLES = [
  'HR Verifier',
  'Admin Verifier',
  'Site Supervisor',
  'Reporting Manager',
  'Operations Manager'
];

const EXPIRY_DAY_OPTIONS = [
  { value: 15, label: '15 Days Before' },
  { value: 30, label: '30 Days Before (Standard)' },
  { value: 45, label: '45 Days Before' },
  { value: 60, label: '60 Days Before' },
  { value: 90, label: '90 Days Before' }
];

// Strictly Workforce License types matching Add Employee options
const WORKFORCE_LICENSE_OPTIONS = [
  { name: 'Driving License', category: 'Identity' },
  { name: 'Arms / Gun License', category: 'Security License' },
  { name: 'Commercial Driving License', category: 'Identity' },
  { name: 'Heavy Motor Vehicle (HMV)', category: 'Identity' },
  { name: 'Light Motor Vehicle (LMV)', category: 'Identity' },
  { name: 'Two Wheeler (MCWG)', category: 'Identity' },
  { name: 'Security Guard License / Badge', category: 'Security License' },
  { name: 'Other License', category: 'Compliance' }
];

function DocumentCompliance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany } = useCompany();
  const companyId = activeCompany?._id || activeCompany?.companyId || 'RRS8392014SEC';

  // Active Tab from query param or default 'overview'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab === 'document-master' ? 'overview' : initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'document-master') {
      handleTabChange('overview');
    } else if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'overview' ? {} : { tab: newTab }, { state: location.state });
  };

  // --- LOADING & ERROR STATES ---
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingTracker, setIsRefreshingTracker] = useState(false);

  // --- DYNAMIC DATABASE STATES ---
  // 1. Verification Rules State
  const [verificationRules, setVerificationRules] = useState([]);
  const [vrSearch, setVrSearch] = useState('');
  const [vrMethodFilter, setVrMethodFilter] = useState('All');
  const [vrVerifierFilter, setVrVerifierFilter] = useState('All');
  const [vrStatusFilter, setVrStatusFilter] = useState('All');
  const [editingRule, setEditingRule] = useState(null);

  // 2. Global Expiry Alert Settings & Rules State
  const [expiryConfig, setExpiryConfig] = useState({
    enabled: true,
    defaultAlertDays: 30,
    repeatFrequencyDays: 7,
    recipients: { admin: true, hr: true, reportingManager: true, siteSupervisor: false },
    channels: { inApp: true, email: true },
    lastUpdated: ''
  });
  const [expiryRules, setExpiryRules] = useState([]);
  const [editingExpiryRule, setEditingExpiryRule] = useState(null);

  // 3. Live Workforce License Expiry Tracker State (Calculated from Employees in DB)
  const [trackerSummary, setTrackerSummary] = useState({
    totalTracked: 0,
    expiredCount: 0,
    criticalCount: 0,
    expiringSoonCount: 0,
    validCount: 0,
    activeAlertsTotal: 0
  });
  const [trackedLicenses, setTrackedLicenses] = useState([]);
  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerStatusFilter, setTrackerStatusFilter] = useState('All');
  const [trackerTypeFilter, setTrackerTypeFilter] = useState('All');

  // 4. Police Verification Governance State
  const [policeConfig, setPoliceConfig] = useState({
    enabled: true,
    mandatoryFor: 'Security Guards & Armed Personnel',
    verificationAuthority: 'District Police Special Branch / Local Police Station',
    verificationDeadline: 30,
    validityPeriodYears: 1,
    reverificationRequired: true,
    blockDeploymentIfPending: true,
    stages: [],
    supportingDocuments: [],
    lastUpdated: ''
  });

  // Modal & Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    title: '',
    photo: '',
    licenseNo: '',
    employeeName: '',
    expiryDate: ''
  });

  // --- FETCH DATA FROM MONGODB DATABASE ---
  const loadComplianceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [configData, trackerData] = await Promise.all([
        complianceService.getComplianceConfig(companyId).catch(() => null),
        complianceService.getExpiryTracker(companyId).catch(() => null)
      ]);

      if (configData) {
        if (configData.expiryConfig) setExpiryConfig(configData.expiryConfig);
        if (configData.expiryRules) setExpiryRules(configData.expiryRules);
        if (configData.verificationRules) setVerificationRules(configData.verificationRules);
        if (configData.policeConfig) setPoliceConfig(configData.policeConfig);
      }

      if (trackerData) {
        if (trackerData.summary) setTrackerSummary(trackerData.summary);
        if (Array.isArray(trackerData.trackedLicenses)) setTrackedLicenses(trackerData.trackedLicenses);
      }
    } catch (err) {
      console.error('Error loading compliance data:', err);
      showToast('Failed to load compliance data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const refreshTracker = async () => {
    try {
      setIsRefreshingTracker(true);
      const trackerData = await complianceService.getExpiryTracker(companyId);
      if (trackerData) {
        if (trackerData.summary) setTrackerSummary(trackerData.summary);
        if (Array.isArray(trackerData.trackedLicenses)) setTrackedLicenses(trackerData.trackedLicenses);
        showToast('Workforce license expiry tracker refreshed successfully.');
      }
    } catch (err) {
      showToast('Failed to refresh license tracker.', 'error');
    } finally {
      setIsRefreshingTracker(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  // --- 1. VERIFICATION RULES HANDLERS (MongoDB) ---
  const filteredVerificationRules = useMemo(() => {
    return verificationRules.filter(rule => {
      const matchesSearch = (rule.documentName || '').toLowerCase().includes(vrSearch.toLowerCase());
      const matchesMethod = vrMethodFilter === 'All' || rule.verificationMethod === vrMethodFilter;
      const matchesVerifier = vrVerifierFilter === 'All' || rule.verifierRole === vrVerifierFilter;
      const matchesStatus = vrStatusFilter === 'All' || rule.status === vrStatusFilter;
      return matchesSearch && matchesMethod && matchesVerifier && matchesStatus;
    });
  }, [verificationRules, vrSearch, vrMethodFilter, vrVerifierFilter, vrStatusFilter]);

  const handleOpenAddRule = () => {
    // Pick the first unconfigured license
    const unconfigured = allAvailableLicenseOptions.find(
      opt => !verificationRules.some(r => r.documentName?.trim().toLowerCase() === opt.name.toLowerCase())
    );

    if (!unconfigured) {
      showToast('All workforce license types already have a verification rule configured. You can edit existing rules directly.', 'info');
      return;
    }

    setEditingRule({
      id: `vr-${Date.now()}`,
      documentName: unconfigured.name,
      category: unconfigured.category || 'Security License',
      verificationRequired: true,
      verificationMethod: VERIFICATION_METHODS[0],
      verifierRole: VERIFIER_ROLES[0],
      verificationDeadline: '7 Days from Joining',
      validity: '1 Year (365 Days)',
      requireBeforeActivation: true,
      reverifyAfterExpiry: true,
      remarks: '',
      status: 'Active'
    });
  };

  const handleSaveRuleModal = async (e) => {
    e.preventDefault();
    if (!editingRule.documentName.trim()) {
      showToast('Document name is required', 'error');
      return;
    }

    // Check duplicate
    const isDuplicate = verificationRules.some(
      r => r.documentName?.trim().toLowerCase() === editingRule.documentName.trim().toLowerCase() && r.id !== editingRule.id
    );
    if (isDuplicate) {
      showToast(`A verification rule for "${editingRule.documentName}" already exists. Each license can have only 1 rule.`, 'error');
      return;
    }

    try {
      const res = await complianceService.saveVerificationRule(companyId, editingRule);
      if (res.verificationRules) {
        setVerificationRules(res.verificationRules);
      } else {
        await loadComplianceData();
      }
      setEditingRule(null);
      showToast(`Verification rule for "${editingRule.documentName}" saved successfully!`);
    } catch (err) {
      showToast(err.message || 'Failed to save verification rule', 'error');
    }
  };

  const handleDeleteRule = (rule) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Verification Rule?`,
      message: `Are you sure you want to delete the verification rule for "${rule.documentName}"?`,
      onConfirm: async () => {
        try {
          const res = await complianceService.deleteVerificationRule(companyId, rule.id);
          if (res.verificationRules) {
            setVerificationRules(res.verificationRules);
          } else {
            setVerificationRules(prev => prev.filter(r => r.id !== rule.id));
          }
          showToast(`Verification rule deleted successfully.`, 'info');
        } catch (err) {
          showToast('Failed to delete verification rule.', 'error');
        }
      }
    });
  };

  // --- 2. GLOBAL EXPIRY ALERT SETTINGS & RULES HANDLERS (MongoDB) ---
  const saveExpiryConfig = async () => {
    try {
      const res = await complianceService.updateExpiryConfig(companyId, expiryConfig);
      if (res.expiryConfig) {
        setExpiryConfig(res.expiryConfig);
      }
      showToast('Global expiry alert preferences saved successfully!');
      refreshTracker();
      // Notify header bell icon to immediately refresh unread count
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch (err) {
      showToast(err.message || 'Failed to save expiry alert settings', 'error');
    }
  };

  const handleOpenAddExpiryRule = () => {
    // Pick the first unconfigured license
    const unconfigured = allAvailableLicenseOptions.find(
      opt => !expiryRules.some(r => r.documentName?.trim().toLowerCase() === opt.name.toLowerCase())
    );

    if (!unconfigured) {
      showToast('All workforce license types already have an active expiry tracker rule configured. You can edit existing rules directly.', 'info');
      return;
    }

    setEditingExpiryRule({
      id: `er-${Date.now()}`,
      documentName: unconfigured.name,
      category: unconfigured.category || 'Security License',
      alertDays: 30,
      escalationLevel: 'Admin & HR',
      repeatFrequency: 'Every 7 Days',
      channels: 'In-App + Email',
      status: 'Active'
    });
  };

  const handleSaveExpiryRuleModal = async (e) => {
    e.preventDefault();
    if (!editingExpiryRule.documentName.trim()) {
      showToast('License type is required', 'error');
      return;
    }

    // Check duplicate
    const isDuplicate = expiryRules.some(
      r => r.documentName?.trim().toLowerCase() === editingExpiryRule.documentName.trim().toLowerCase() && r.id !== editingExpiryRule.id
    );
    if (isDuplicate) {
      showToast(`An expiry tracker for "${editingExpiryRule.documentName}" already exists. Each license can have only 1 tracker.`, 'error');
      return;
    }

    try {
      const res = await complianceService.saveExpiryRule(companyId, editingExpiryRule);
      if (res.expiryRules) {
        setExpiryRules(res.expiryRules);
      } else {
        await loadComplianceData();
      }
      setEditingExpiryRule(null);
      showToast(`Expiry alert rule for "${editingExpiryRule.documentName}" saved successfully!`);
      refreshTracker();
    } catch (err) {
      showToast(err.message || 'Failed to save expiry rule', 'error');
    }
  };

  const handleDeleteExpiryRule = (rule) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Expiry Rule?`,
      message: `Are you sure you want to delete the expiry alert rule for "${rule.documentName}"?`,
      onConfirm: async () => {
        try {
          const res = await complianceService.deleteExpiryRule(companyId, rule.id);
          if (res.expiryRules) {
            setExpiryRules(res.expiryRules);
          } else {
            setExpiryRules(prev => prev.filter(r => r.id !== rule.id));
          }
          showToast(`Expiry alert rule deleted successfully.`, 'info');
          refreshTracker();
        } catch (err) {
          showToast('Failed to delete expiry rule.', 'error');
        }
      }
    });
  };

  // --- 3. LIVE LICENSE EXPIRY TRACKER FILTERING ---
  const filteredTrackedLicenses = useMemo(() => {
    return trackedLicenses.filter(item => {
      const matchesSearch = 
        (item.employeeName || '').toLowerCase().includes(trackerSearch.toLowerCase()) ||
        (item.employeeCode || '').toLowerCase().includes(trackerSearch.toLowerCase()) ||
        (item.employeeId || '').toLowerCase().includes(trackerSearch.toLowerCase()) ||
        (item.licenseNo || '').toLowerCase().includes(trackerSearch.toLowerCase()) ||
        (item.siteLocation || '').toLowerCase().includes(trackerSearch.toLowerCase());

      const matchesStatus = 
        trackerStatusFilter === 'All' ||
        (trackerStatusFilter === 'Expired' && item.status === 'Expired') ||
        (trackerStatusFilter === 'Critical' && item.status === 'Critical') ||
        (trackerStatusFilter === 'Expiring Soon' && (item.status === 'Expiring Soon' || item.status === 'Critical' || item.status === 'Expired')) ||
        (trackerStatusFilter === 'Valid' && (item.status === 'Valid' || item.status === 'Upcoming'));

      const matchesType = 
        trackerTypeFilter === 'All' ||
        item.licenseType.toLowerCase().includes(trackerTypeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [trackedLicenses, trackerSearch, trackerStatusFilter, trackerTypeFilter]);

  const uniqueLicenseTypes = useMemo(() => {
    const set = new Set();
    trackedLicenses.forEach(t => {
      if (t.licenseType) set.add(t.licenseType);
    });
    return Array.from(set);
  }, [trackedLicenses]);

  // Combined list of all standard licenses + any custom license found in employee records
  const allAvailableLicenseOptions = useMemo(() => {
    const list = [...WORKFORCE_LICENSE_OPTIONS];
    trackedLicenses.forEach(t => {
      const typeLower = (t.licenseType || '').toLowerCase();
      const isLicense = 
        typeLower.includes('license') || 
        typeLower.includes('gun') || 
        typeLower.includes('arms') || 
        typeLower.includes('driving') || 
        typeLower.includes('hmv') || 
        typeLower.includes('lmv') || 
        typeLower.includes('mcwg');

      if (isLicense && !list.some(l => l.name.toLowerCase() === t.licenseType.toLowerCase())) {
        list.push({
          name: t.licenseType,
          category: t.licenseCategory || 'Compliance'
        });
      }
    });
    return list;
  }, [trackedLicenses]);

  const handleSendInstantAlert = async (item) => {
    try {
      await complianceService.sendExpiryAlert(companyId, {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        licenseType: item.licenseType,
        licenseNo: item.licenseNo,
        expiryDate: item.expiryDate,
        daysRemaining: item.daysRemaining
      });
      showToast(`Expiry reminder notification sent to HR & Admin for ${item.employeeName}!`);
    } catch (err) {
      showToast('Failed to dispatch alert notification.', 'error');
    }
  };

  // --- 4. POLICE VERIFICATION HANDLERS (MongoDB) ---
  const savePoliceConfig = async () => {
    try {
      const res = await complianceService.updatePoliceConfig(companyId, policeConfig);
      if (res.policeConfig) {
        setPoliceConfig(res.policeConfig);
      }
      showToast('Police verification compliance rules saved successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save police verification rules', 'error');
    }
  };

  const handleDocRequirementChange = (docId, newRequirement) => {
    const updatedDocs = (policeConfig.supportingDocuments || []).map(doc => 
      doc.id === docId ? { ...doc, required: newRequirement } : doc
    );
    setPoliceConfig({
      ...policeConfig,
      supportingDocuments: updatedDocs
    });
  };

  return (
    <AdminLayout>
      <div className={styles.pageContainer}>
        {/* Toast Notification */}
        {toast.show && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ ...toast, show: false })} 
          />
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal({ ...confirmModal, isOpen: false });
          }}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          confirmText="Confirm"
          confirmType="danger"
        />

        {/* Preview Document Copy Modal */}
        {previewDocModal.isOpen && (
          <div className={styles.modalOverlay} onClick={() => setPreviewDocModal({ isOpen: false, title: '', photo: '', licenseNo: '', employeeName: '', expiryDate: '' })}>
            <div className={styles.modalCard} style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{previewDocModal.title}</h3>
                <button 
                  type="button" 
                  className={styles.iconBtn} 
                  onClick={() => setPreviewDocModal({ isOpen: false, title: '', photo: '', licenseNo: '', employeeName: '', expiryDate: '' })}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Employee:</strong> {previewDocModal.employeeName}</div>
                  <div><strong>License / Doc Number:</strong> <code>{previewDocModal.licenseNo}</code></div>
                  <div><strong>Expiry Date:</strong> {previewDocModal.expiryDate || 'N/A'}</div>
                </div>
                {previewDocModal.photo ? (
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    {previewDocModal.photo.startsWith('data:application/pdf') ? (
                      <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '6px' }}>
                        <FileText size={40} color="#4f46e5" style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>PDF Document Attached</p>
                        <a href={previewDocModal.photo} download="license_document.pdf" className={styles.btnPrimary} style={{ display: 'inline-flex', marginTop: '12px', textDecoration: 'none' }}>
                          Download PDF Document
                        </a>
                      </div>
                    ) : (
                      <img 
                        src={previewDocModal.photo} 
                        alt="License Document Preview" 
                        style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '6px', border: '1px solid #cbd5e1', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    <Info size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                    <p style={{ margin: 0 }}>No digital scan attached for this credential.</p>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.btnSecondary}
                  onClick={() => setPreviewDocModal({ isOpen: false, title: '', photo: '', licenseNo: '', employeeName: '', expiryDate: '' })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <span 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/admin/dashboard')}
              >
                Dashboard
              </span>
              <span>/</span>
              <span 
                className={styles.breadcrumbLink}
                onClick={() => handleTabChange('overview')}
                style={{ cursor: activeTab !== 'overview' ? 'pointer' : 'default', color: activeTab !== 'overview' ? 'var(--primary-color, #2563eb)' : 'inherit', fontWeight: activeTab !== 'overview' ? 500 : 600 }}
              >
                Document &amp; Compliance
              </span>
              {activeTab !== 'overview' && (
                <>
                  <span>/</span>
                  <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: 600 }}>
                    {TABS.find(t => t.id === activeTab)?.label || activeTab}
                  </span>
                </>
              )}
            </nav>
            <h1 className={styles.pageTitle}>Document &amp; Compliance</h1>
            <p className={styles.pageSubtitle}>
              Workforce credential tracking, verification rules, statutory PSARA police compliance, and automated expiry alert management.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button" 
              className={styles.btnSecondary}
              onClick={refreshTracker}
              disabled={isRefreshingTracker}
              title="Refresh live workforce records"
            >
              <RefreshCw size={14} className={isRefreshingTracker ? 'animate-spin' : ''} />
              <span>{isRefreshingTracker ? 'Updating...' : 'Refresh Records'}</span>
            </button>
          </div>
        </header>

        {/* Tabs Bar with Scroller */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsScroller}>
            {TABS.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <IconComponent size={15} />
                  <span>{tab.label}</span>
                  {tab.id === 'expiry-alert' && trackerSummary.activeAlertsTotal > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '10.5px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                      {trackerSummary.activeAlertsTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className={styles.tabContent}>

          {/* 1. OVERVIEW LANDING TAB */}
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              
              {/* Card 1: Verification Rules */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Verification Rules</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Configure document verification workflows, verifier assignments (HR / Admin / Manager), and pre-activation clearance.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Active Verification Rules:</span>
                    <span className={styles.metaValue}>{verificationRules.length} Active Rules</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Pre-Activation Required:</span>
                    <span className={styles.metaValue}>{verificationRules.filter(r => r.requireBeforeActivation).length} Critical Mandates</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('verification-rules')}
                  >
                    <span>Configure Rules</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Expiry Alert & License Tracker */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Workforce Expiry Tracker</h3>
                    <StatusBadge status={expiryConfig.enabled ? 'Active' : 'Inactive'} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Automated tracking and validity monitoring of Arms/Gun Licenses, Driving Licenses, and Police Certificates added during employee onboarding.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Total Tracked Licenses:</span>
                    <span className={styles.metaValue}>{trackerSummary.totalTracked} Workforce Licenses</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Expired / Critical Alerts:</span>
                    <span className={styles.metaValue} style={{ color: trackerSummary.activeAlertsTotal > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>
                      {trackerSummary.activeAlertsTotal} Pending Actions
                    </span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('expiry-alert')}
                  >
                    <span>View License Tracker</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Police Verification */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Police Verification &amp; PSARA</h3>
                    <StatusBadge status={policeConfig.enabled ? 'Active' : 'Inactive'} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    PSARA compliance governance, statutory background check tracking, 5-stage verification flow &amp; required dossier rules.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Applicable For:</span>
                    <span className={styles.metaValue}>{policeConfig.mandatoryFor}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Validity Cycle:</span>
                    <span className={styles.metaValue}>{policeConfig.validityPeriodYears} Year (Annual Re-verification)</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('police-verification')}
                  >
                    <span>Configure Police Rules</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. VERIFICATION RULES TAB */}
          {activeTab === 'verification-rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Toolbar */}
              <div className={styles.tableToolbar}>
                <div className={styles.searchBox}>
                  <Search size={15} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Search verified document..." 
                    value={vrSearch}
                    onChange={(e) => setVrSearch(e.target.value)}
                  />
                </div>

                <div className={styles.filtersRow}>
                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={vrMethodFilter}
                    onChange={(e) => setVrMethodFilter(e.target.value)}
                  >
                    <option value="All">All Verification Methods</option>
                    {VERIFICATION_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={vrVerifierFilter}
                    onChange={(e) => setVrVerifierFilter(e.target.value)}
                  >
                    <option value="All">All Verifiers</option>
                    {VERIFIER_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={vrStatusFilter}
                    onChange={(e) => setVrStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <button 
                    type="button" 
                    className={styles.btnPrimary}
                    onClick={handleOpenAddRule}
                  >
                    <Plus size={14} />
                    <span>Add Verification Rule</span>
                  </button>
                </div>
              </div>

              {/* Rules Table */}
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Verification Method</th>
                      <th>Verifier Role</th>
                      <th>Deadline</th>
                      <th>Validity</th>
                      <th>Pre-Activation Required</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVerificationRules.length > 0 ? (
                      filteredVerificationRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{rule.documentName}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{rule.category}</div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {rule.verificationMethod}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: 700 }}>
                              {rule.verifierRole}
                            </span>
                          </td>
                          <td style={{ color: '#475569', fontSize: '12.5px' }}>
                            {rule.verificationDeadline}
                          </td>
                          <td style={{ color: '#475569', fontSize: '12.5px' }}>
                            {rule.validity}
                          </td>
                          <td>
                            {rule.requireBeforeActivation ? (
                              <span style={{ fontSize: '11px', color: '#b91c1c', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                Mandated
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Optional</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={rule.status} />
                          </td>
                          <td>
                            <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                              <button 
                                type="button" 
                                className={styles.iconBtn}
                                onClick={() => setEditingRule(rule)}
                                title="Edit Rule"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                type="button" 
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => handleDeleteRule(rule)}
                                title="Delete Rule"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No verification rules configured</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Try adjusting your search query or filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add / Edit Verification Rule Modal */}
              {editingRule && (
                <div className={styles.modalOverlay} onClick={() => setEditingRule(null)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>
                        {verificationRules.some(r => r.id === editingRule.id) ? 'Edit Verification Rule' : 'Add Verification Rule'}
                      </h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setEditingRule(null)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveRuleModal}>
                      <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              License Type <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingRule.documentName}
                              disabled={verificationRules.some(r => r.id === editingRule.id)}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                const matched = allAvailableLicenseOptions.find(l => l.name === selectedName);
                                setEditingRule({
                                  ...editingRule,
                                  documentName: selectedName,
                                  category: matched ? matched.category : editingRule.category
                                });
                              }}
                              required
                            >
                              <option value="" disabled>Select License from Add Employee...</option>
                              {allAvailableLicenseOptions.map(opt => {
                                const isConfigured = verificationRules.some(
                                  r => r.documentName?.trim().toLowerCase() === opt.name.toLowerCase() && r.id !== editingRule.id
                                );
                                return (
                                  <option key={opt.name} value={opt.name} disabled={isConfigured}>
                                    {opt.name} {isConfigured ? '(Already Configured)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            <span className={styles.helperText}>
                              {verificationRules.some(r => r.id === editingRule.id)
                                ? 'License type is fixed. Each license type has exactly one verification rule.'
                                : 'Select from unconfigured license types (1 rule per license).'}
                            </span>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Verification Method <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingRule.verificationMethod}
                              onChange={(e) => setEditingRule({ ...editingRule, verificationMethod: e.target.value })}
                            >
                              {VERIFICATION_METHODS.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Verifier Role <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingRule.verifierRole}
                              onChange={(e) => setEditingRule({ ...editingRule, verifierRole: e.target.value })}
                            >
                              {VERIFIER_ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Verification Deadline</label>
                            <input 
                              type="text" 
                              className={styles.input}
                              placeholder="e.g. 7 Days from Joining"
                              value={editingRule.verificationDeadline}
                              onChange={(e) => setEditingRule({ ...editingRule, verificationDeadline: e.target.value })}
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Validity Period</label>
                            <input 
                              type="text" 
                              className={styles.input}
                              placeholder="e.g. 1 Year (365 Days) or Lifetime"
                              value={editingRule.validity}
                              onChange={(e) => setEditingRule({ ...editingRule, validity: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Special Checkboxes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingRule.requireBeforeActivation}
                              onChange={(e) => setEditingRule({ ...editingRule, requireBeforeActivation: e.target.checked })}
                            />
                            <span>Require verification before employee profile activation &amp; deployment</span>
                          </label>

                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingRule.reverifyAfterExpiry}
                              onChange={(e) => setEditingRule({ ...editingRule, reverifyAfterExpiry: e.target.checked })}
                            />
                            <span>Require re-verification upon document renewal / expiry</span>
                          </label>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Remarks / Guidance</label>
                          <input 
                            type="text" 
                            className={styles.input}
                            placeholder="Verification portal link or compliance protocol details..."
                            value={editingRule.remarks}
                            onChange={(e) => setEditingRule({ ...editingRule, remarks: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className={styles.modalFooter}>
                        <button 
                          type="button" 
                          className={styles.btnSecondary} 
                          onClick={() => setEditingRule(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className={styles.btnPrimary}>
                          <Save size={14} />
                          <span>Save Verification Rule</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. EXPIRY ALERT & LIVE LICENSE TRACKER TAB */}
          {activeTab === 'expiry-alert' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SECTION A: LIVE WORKFORCE LICENSE & CREDENTIAL EXPIRY TRACKER */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Live Workforce License Expiry Tracker</h2>
                    <p className={styles.cardSubtitle}>
                      Automatically monitors Gun Licenses, Driving Licenses, and Police Clearances added in employee profiles and warns before expiration.
                    </p>
                  </div>

                  <button 
                    type="button" 
                    className={styles.btnSecondary}
                    onClick={refreshTracker}
                    disabled={isRefreshingTracker}
                  >
                    <RefreshCw size={13} className={isRefreshingTracker ? 'animate-spin' : ''} />
                    <span>Refresh Tracker</span>
                  </button>
                </div>

                <div className={styles.cardBody} style={{ gap: '20px' }}>
                  
                  {/* KPI Summary Cards */}
                  <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                      <div className={styles.kpiIconWrap} style={{ background: '#eef2ff', color: '#4f46e5' }}>
                        <Shield size={22} />
                      </div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{trackerSummary.totalTracked}</span>
                        <span className={styles.kpiLabel}>Total Tracked Licenses</span>
                      </div>
                    </div>

                    <div className={styles.kpiCard} style={{ borderColor: trackerSummary.expiredCount > 0 ? '#fecaca' : '#e2e8f0' }}>
                      <div className={styles.kpiIconWrap} style={{ background: '#fef2f2', color: '#dc2626' }}>
                        <AlertCircle size={22} />
                      </div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiValue} style={{ color: '#dc2626' }}>{trackerSummary.expiredCount}</span>
                        <span className={styles.kpiLabel}>Expired (Urgent Action)</span>
                      </div>
                    </div>

                    <div className={styles.kpiCard} style={{ borderColor: trackerSummary.criticalCount + trackerSummary.expiringSoonCount > 0 ? '#fed7aa' : '#e2e8f0' }}>
                      <div className={styles.kpiIconWrap} style={{ background: '#fff7ed', color: '#ea580c' }}>
                        <Clock size={22} />
                      </div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiValue} style={{ color: '#ea580c' }}>{trackerSummary.criticalCount + trackerSummary.expiringSoonCount}</span>
                        <span className={styles.kpiLabel}>Expiring Within Horizon</span>
                      </div>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={styles.kpiIconWrap} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <CheckCircle2 size={22} />
                      </div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiValue} style={{ color: '#16a34a' }}>{trackerSummary.validCount}</span>
                        <span className={styles.kpiLabel}>Compliant &amp; Valid</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className={styles.tableToolbar} style={{ background: '#f8fafc' }}>
                    <div className={styles.searchBox} style={{ width: '280px' }}>
                      <Search size={15} color="#94a3b8" />
                      <input 
                        type="text" 
                        placeholder="Search employee, ID, license no..." 
                        value={trackerSearch}
                        onChange={(e) => setTrackerSearch(e.target.value)}
                      />
                    </div>

                    <div className={styles.filtersRow}>
                      <select 
                        className={styles.select}
                        style={{ width: 'auto' }}
                        value={trackerStatusFilter}
                        onChange={(e) => setTrackerStatusFilter(e.target.value)}
                      >
                        <option value="All">All Expiry Statuses</option>
                        <option value="Expired">🚨 Expired Only</option>
                        <option value="Critical">⚠️ Critical (&le; 15 Days)</option>
                        <option value="Expiring Soon">⏳ Expiring Soon</option>
                        <option value="Valid">✅ Valid &amp; Compliant</option>
                      </select>

                      <select 
                        className={styles.select}
                        style={{ width: 'auto' }}
                        value={trackerTypeFilter}
                        onChange={(e) => setTrackerTypeFilter(e.target.value)}
                      >
                        <option value="All">All License Types</option>
                        {uniqueLicenseTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tracker Data Table */}
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>License / Credential</th>
                          <th>License No.</th>
                          <th>Expiry Date</th>
                          <th>Days Remaining</th>
                          <th>Alert Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrackedLicenses.length > 0 ? (
                          filteredTrackedLicenses.map((item) => (
                            <tr key={item.id}>
                              {/* Employee Cell */}
                              <td>
                                <div className={styles.empUserCell}>
                                  {item.employeePhoto ? (
                                    <img 
                                      src={item.employeePhoto} 
                                      alt={item.employeeName} 
                                      className={styles.empAvatar}
                                    />
                                  ) : (
                                    <div className={styles.empAvatar}>
                                      <User size={16} />
                                    </div>
                                  )}
                                  <div className={styles.empMetaText}>
                                    <span 
                                      className={styles.empNameLink}
                                      onClick={() => navigate(`/admin/employees/${item.employeeId}`)}
                                      title="Click to view employee profile"
                                    >
                                      {item.employeeName}
                                    </span>
                                    <span className={styles.empSubText}>
                                      ID: {item.employeeCode || item.employeeId} &bull; {item.designation}
                                    </span>
                                    <span className={styles.empSubText} style={{ color: '#4338ca' }}>
                                      {item.siteLocation || item.clientName}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* License Type */}
                              <td>
                                <strong style={{ color: '#0f172a', fontSize: '13px' }}>{item.licenseType}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                                    {item.licenseCategory}
                                  </span>
                                </div>
                              </td>

                              {/* License Number */}
                              <td>
                                <code style={{ fontSize: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 6px', borderRadius: '4px' }}>
                                  {item.licenseNo}
                                </code>
                                {item.photoCopy && (
                                  <button 
                                    type="button" 
                                    className={styles.iconBtn}
                                    style={{ width: '22px', height: '22px', marginLeft: '6px', verticalAlign: 'middle' }}
                                    title="Preview attached document"
                                    onClick={() => setPreviewDocModal({
                                      isOpen: true,
                                      title: `${item.licenseType} Copy`,
                                      photo: item.photoCopy,
                                      licenseNo: item.licenseNo,
                                      employeeName: item.employeeName,
                                      expiryDate: item.expiryDate
                                    })}
                                  >
                                    <Eye size={12} />
                                  </button>
                                )}
                              </td>

                              {/* Expiry Date */}
                              <td>
                                <span style={{ fontWeight: 600, color: '#334155' }}>
                                  {item.expiryDate || 'No Date Recorded'}
                                </span>
                              </td>

                              {/* Days Remaining / Status Badge */}
                              <td>
                                {item.status === 'Expired' && (
                                  <span className={styles.badgeExpired}>
                                    <AlertTriangle size={12} />
                                    <span>{item.statusLabel}</span>
                                  </span>
                                )}
                                {item.status === 'Critical' && (
                                  <span className={styles.badgeCritical}>
                                    <Clock size={12} />
                                    <span>{item.statusLabel}</span>
                                  </span>
                                )}
                                {item.status === 'Expiring Soon' && (
                                  <span className={styles.badgeWarning}>
                                    <Clock size={12} />
                                    <span>{item.statusLabel}</span>
                                  </span>
                                )}
                                {(item.status === 'Valid' || item.status === 'Upcoming') && (
                                  <span className={styles.badgeValid}>
                                    <CheckCircle2 size={12} />
                                    <span>{item.statusLabel}</span>
                                  </span>
                                )}
                                {item.status === 'No Expiry' && (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Lifetime / No Expiry</span>
                                )}
                              </td>

                              {/* Alert Status */}
                              <td>
                                {item.isAlertTriggered ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#b91c1c', fontWeight: 700, background: '#fef2f2', padding: '2px 8px', borderRadius: '12px' }}>
                                    <BellRing size={12} />
                                    <span>Alert Active (&le; {item.thresholdDays}d)</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                                    Compliant
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td>
                                <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                                  <button 
                                    type="button" 
                                    className={styles.iconBtn}
                                    title="Send Expiry Reminder Notification"
                                    onClick={() => handleSendInstantAlert(item)}
                                  >
                                    <Send size={13} color="#4f46e5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    className={styles.iconBtn}
                                    title="View Employee Profile"
                                    onClick={() => navigate(`/admin/employees/${item.employeeId}`)}
                                  >
                                    <ExternalLink size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                              <p style={{ margin: 0, fontWeight: 600 }}>No licenses or credentials match your filter</p>
                              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>All licenses entered during employee creation appear here dynamically.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>

              {/* SECTION B: GLOBAL EXPIRY ALERT SETTINGS */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Global Expiry Alert Settings</h3>
                    <p className={styles.cardSubtitle}>
                      Configure default notification horizons, alert recipients, and escalation channels for expiring workforce credentials.
                    </p>
                  </div>
                  <StatusBadge status={expiryConfig.enabled ? 'Active' : 'Inactive'} />
                </div>

                <div className={styles.cardBody}>
                  {/* Master Switch */}
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Enable Automated Expiry Alerts</span>
                      <span className={styles.toggleDesc}>
                        Dispatch advance alerts before Gun Licenses, Police Clearances, and Driving Licenses reach expiration.
                      </span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={expiryConfig.enabled} 
                        onChange={(e) => setExpiryConfig({ ...expiryConfig, enabled: e.target.checked })} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Default Alert Horizon</label>
                      <select 
                        className={styles.select}
                        value={expiryConfig.defaultAlertDays}
                        onChange={(e) => setExpiryConfig({ ...expiryConfig, defaultAlertDays: Number(e.target.value) })}
                      >
                        {EXPIRY_DAY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <span className={styles.helperText}>Standard threshold to initiate first notification</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Repeat Reminder Interval</label>
                      <select 
                        className={styles.select}
                        value={expiryConfig.repeatFrequencyDays}
                        onChange={(e) => setExpiryConfig({ ...expiryConfig, repeatFrequencyDays: Number(e.target.value) })}
                      >
                        <option value={3}>Every 3 Days</option>
                        <option value={5}>Every 5 Days</option>
                        <option value={7}>Every 7 Days (Weekly)</option>
                        <option value={15}>Every 15 Days</option>
                      </select>
                      <span className={styles.helperText}>Frequency of reminders until renewed</span>
                    </div>
                  </div>

                  {/* Recipients & Channels */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', background: '#f8fafc' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                        Notification Recipients:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            className={styles.checkboxInput}
                            checked={expiryConfig.recipients?.admin}
                            onChange={(e) => setExpiryConfig({
                              ...expiryConfig,
                              recipients: { ...expiryConfig.recipients, admin: e.target.checked }
                            })}
                          />
                          <span>Admin</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            className={styles.checkboxInput}
                            checked={expiryConfig.recipients?.hr}
                            onChange={(e) => setExpiryConfig({
                              ...expiryConfig,
                              recipients: { ...expiryConfig.recipients, hr: e.target.checked }
                            })}
                          />
                          <span>HR</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            className={styles.checkboxInput}
                            checked={expiryConfig.recipients?.reportingManager}
                            onChange={(e) => setExpiryConfig({
                              ...expiryConfig,
                              recipients: { ...expiryConfig.recipients, reportingManager: e.target.checked }
                            })}
                          />
                          <span>Reporting Manager</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            className={styles.checkboxInput}
                            checked={expiryConfig.recipients?.siteSupervisor}
                            onChange={(e) => setExpiryConfig({
                              ...expiryConfig,
                              recipients: { ...expiryConfig.recipients, siteSupervisor: e.target.checked }
                            })}
                          />
                          <span>Site Supervisor</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', background: '#f8fafc' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                        Notification Channels:
                      </span>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            className={styles.checkboxInput}
                            checked={expiryConfig.channels?.inApp}
                            onChange={(e) => setExpiryConfig({
                              ...expiryConfig,
                              channels: { ...expiryConfig.channels, inApp: e.target.checked }
                            })}
                          />
                          <span>In-App Activity Bell</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            className={styles.checkboxInput}
                            checked={expiryConfig.channels?.email}
                            onChange={(e) => setExpiryConfig({
                              ...expiryConfig,
                              channels: { ...expiryConfig.channels, email: e.target.checked }
                            })}
                          />
                          <span>Email Alerts</span>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{expiryConfig.lastUpdated || 'Active'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnPrimary} onClick={saveExpiryConfig}>
                      <Save size={14} />
                      <span>Save Settings</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION C: DOCUMENT-SPECIFIC EXPIRY RULES */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Document-Specific Expiry Rules</h3>
                    <p className={styles.cardSubtitle}>Override global alert thresholds for high-compliance credentials.</p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnPrimary}
                    onClick={handleOpenAddExpiryRule}
                  >
                    <Plus size={14} />
                    <span>Add Custom Expiry Rule</span>
                  </button>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Category</th>
                        <th>Alert Days</th>
                        <th>Escalation Level</th>
                        <th>Repeat Frequency</th>
                        <th>Channels</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiryRules.length > 0 ? (
                        expiryRules.map((rule) => (
                          <tr key={rule.id}>
                            <td>
                              <strong style={{ color: '#0f172a' }}>{rule.documentName}</strong>
                            </td>
                            <td>
                              <span style={{ fontSize: '11.5px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                {rule.category}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: 700 }}>
                                {rule.alertDays} Days Before
                              </span>
                            </td>
                            <td style={{ color: '#475569', fontSize: '12.5px' }}>
                              {rule.escalationLevel}
                            </td>
                            <td style={{ color: '#475569', fontSize: '12.5px' }}>
                              {rule.repeatFrequency}
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: 600 }}>
                                {rule.channels}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={rule.status} />
                            </td>
                            <td>
                              <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                                <button 
                                  type="button" 
                                  className={styles.iconBtn}
                                  onClick={() => setEditingExpiryRule(rule)}
                                  title="Edit Rule"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  type="button" 
                                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                  onClick={() => handleDeleteExpiryRule(rule)}
                                  title="Delete Rule"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>No custom document expiry rules configured</p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
                              All workforce licenses currently follow the <strong>Global Expiry Alert Horizon ({expiryConfig.defaultAlertDays} Days)</strong>. Click <strong>"+ Add Custom Expiry Rule"</strong> above to configure custom alert thresholds.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Edit Expiry Rule Modal */}
              {editingExpiryRule && (
                <div className={styles.modalOverlay} onClick={() => setEditingExpiryRule(null)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>
                        {expiryRules.some(r => r.id === editingExpiryRule.id) ? 'Edit Expiry Alert Rule' : 'Add Custom Expiry Rule'}
                      </h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setEditingExpiryRule(null)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveExpiryRuleModal}>
                      <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              License Type <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingExpiryRule.documentName}
                              disabled={expiryRules.some(r => r.id === editingExpiryRule.id)}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                const matched = allAvailableLicenseOptions.find(l => l.name === selectedName);
                                setEditingExpiryRule({
                                  ...editingExpiryRule,
                                  documentName: selectedName,
                                  category: matched ? matched.category : editingExpiryRule.category
                                });
                              }}
                              required
                            >
                              <option value="" disabled>Select License from Add Employee...</option>
                              {allAvailableLicenseOptions.map(opt => {
                                const isConfigured = expiryRules.some(
                                  r => r.documentName?.trim().toLowerCase() === opt.name.toLowerCase() && r.id !== editingExpiryRule.id
                                );
                                return (
                                  <option key={opt.name} value={opt.name} disabled={isConfigured}>
                                    {opt.name} {isConfigured ? '(Already Configured)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            <span className={styles.helperText}>
                              {expiryRules.some(r => r.id === editingExpiryRule.id)
                                ? 'License type is locked. Each license type has exactly one active expiry tracker rule.'
                                : 'Select an unconfigured license. Each license can only have 1 active tracker.'}
                            </span>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Alert Horizon (Days Before)</label>
                            <input 
                              type="number" 
                              className={styles.input}
                              min={1}
                              max={180}
                              value={editingExpiryRule.alertDays}
                              onChange={(e) => setEditingExpiryRule({ ...editingExpiryRule, alertDays: Number(e.target.value) })}
                              required
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Escalation Level</label>
                            <select 
                              className={styles.select}
                              value={editingExpiryRule.escalationLevel}
                              onChange={(e) => setEditingExpiryRule({ ...editingExpiryRule, escalationLevel: e.target.value })}
                            >
                              <option value="Admin & HR">Admin &amp; HR</option>
                              <option value="HR & Manager">HR &amp; Manager</option>
                              <option value="HR & Supervisor">HR &amp; Supervisor</option>
                              <option value="Reporting Manager">Reporting Manager</option>
                              <option value="HR">HR Only</option>
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Repeat Frequency</label>
                            <select 
                              className={styles.select}
                              value={editingExpiryRule.repeatFrequency}
                              onChange={(e) => setEditingExpiryRule({ ...editingExpiryRule, repeatFrequency: e.target.value })}
                            >
                              <option value="Every 3 Days">Every 3 Days</option>
                              <option value="Every 5 Days">Every 5 Days</option>
                              <option value="Every 7 Days">Every 7 Days</option>
                              <option value="Every 15 Days">Every 15 Days</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Notification Channels</label>
                          <select 
                            className={styles.select}
                            value={editingExpiryRule.channels}
                            onChange={(e) => setEditingExpiryRule({ ...editingExpiryRule, channels: e.target.value })}
                          >
                            <option value="In-App + Email">In-App + Email</option>
                            <option value="In-App">In-App Only</option>
                            <option value="Email">Email Only</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.modalFooter}>
                        <button 
                          type="button" 
                          className={styles.btnSecondary} 
                          onClick={() => setEditingExpiryRule(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className={styles.btnPrimary}>
                          <Save size={14} />
                          <span>Save Expiry Rule</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 4. POLICE VERIFICATION TAB */}
          {activeTab === 'police-verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Configuration Settings Card */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Police Verification Governance &amp; PSARA Rules</h2>
                    <p className={styles.cardSubtitle}>
                      Configure statutory background check mandates, verification authority, dossier criteria and lifecycle stages under PSARA standards.
                    </p>
                  </div>
                  <StatusBadge status={policeConfig.enabled ? 'Active' : 'Inactive'} />
                </div>

                <div className={styles.cardBody}>
                  {/* Master Switch */}
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Mandatory Police Verification</span>
                      <span className={styles.toggleDesc}>
                        Enforce statutory police background verification under PSARA Security Rules.
                      </span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={policeConfig.enabled} 
                        onChange={(e) => setPoliceConfig({ ...policeConfig, enabled: e.target.checked })} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mandatory For Workforce Group</label>
                      <select 
                        className={styles.select}
                        value={policeConfig.mandatoryFor}
                        onChange={(e) => setPoliceConfig({ ...policeConfig, mandatoryFor: e.target.value })}
                      >
                        <option value="All Employees">All Employees</option>
                        <option value="Security Guards & Armed Personnel">Security Guards &amp; Armed Personnel</option>
                        <option value="Supervisors & Field Officers">Supervisors &amp; Field Officers</option>
                        <option value="Site-Specific Workforce">Site-Specific Workforce</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Verification Authority</label>
                      <input 
                        type="text" 
                        className={styles.input}
                        value={policeConfig.verificationAuthority}
                        onChange={(e) => setPoliceConfig({ ...policeConfig, verificationAuthority: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Verification Deadline (Days from Joining)</label>
                      <input 
                        type="number" 
                        className={styles.input}
                        value={policeConfig.verificationDeadline}
                        onChange={(e) => setPoliceConfig({ ...policeConfig, verificationDeadline: Number(e.target.value) })}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Validity &amp; Re-verification Cycle</label>
                      <select 
                        className={styles.select}
                        value={policeConfig.validityPeriodYears}
                        onChange={(e) => setPoliceConfig({ ...policeConfig, validityPeriodYears: Number(e.target.value) })}
                      >
                        <option value={1}>1 Year (Annual Renewal)</option>
                        <option value={2}>2 Years</option>
                        <option value={3}>3 Years</option>
                      </select>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={policeConfig.reverificationRequired}
                        onChange={(e) => setPoliceConfig({ ...policeConfig, reverificationRequired: e.target.checked })}
                      />
                      <span>Mandate annual re-verification upon completion of validity period</span>
                    </label>

                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        className={styles.checkboxInput}
                        checked={policeConfig.blockDeploymentIfPending}
                        onChange={(e) => setPoliceConfig({ ...policeConfig, blockDeploymentIfPending: e.target.checked })}
                      />
                      <span>Block client site deployment if verification exceeds deadline</span>
                    </label>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{policeConfig.lastUpdated || 'Active'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnPrimary} onClick={savePoliceConfig}>
                      <Save size={14} />
                      <span>Save Police Rules</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5 Lifecycle Stages Overview */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>5-Stage Verification Lifecycle</h3>
                    <p className={styles.cardSubtitle}>Standard stages followed across verification workflow.</p>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.stagesGrid}>
                    {(policeConfig.stages || []).map((stg) => (
                      <div key={stg.stage} className={styles.stageCard}>
                        <span className={styles.stageNumber}>{stg.stage}</span>
                        <span className={styles.stageName}>{stg.name}</span>
                        <span className={styles.stageDesc}>{stg.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Required Supporting Documents Dossier */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Required Supporting Documents Dossier</h3>
                    <p className={styles.cardSubtitle}>Configure required vs optional documents for police verification submission.</p>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Document Requirement</th>
                        <th>Dossier Instructions</th>
                        <th style={{ width: '160px', textAlign: 'right' }}>Requirement Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(policeConfig.supportingDocuments || []).map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{doc.name}</strong>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                            {doc.description}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select 
                              className={styles.select}
                              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                              value={doc.required}
                              onChange={(e) => handleDocRequirementChange(doc.id, e.target.value)}
                            >
                              <option value="Mandatory">Mandatory</option>
                              <option value="Optional">Optional</option>
                              <option value="Not Required">Not Required</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

export default DocumentCompliance;
