import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, 
  ShieldAlert, Bell, Plus, Search, Edit2, Trash2, Eye, 
  Save, RotateCcw, ArrowRight, Check, X, Info, Sparkles, 
  SlidersHorizontal, Clock, UserCheck, Shield, HelpCircle
} from 'lucide-react';
import styles from './DocumentCompliance.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

// Initial Mock data
import { 
  DOCUMENT_CATEGORIES, 
  APPLICABLE_AUDIENCES, 
  VERIFICATION_METHODS, 
  VERIFIER_ROLES, 
  EXPIRY_DAY_OPTIONS, 
  mockDocumentMasterList, 
  mockVerificationRules, 
  mockExpiryAlertConfig, 
  mockExpiryRules, 
  mockPoliceVerificationConfig 
} from '../../data/documentComplianceData';

const TABS = [
  { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
  { id: 'document-master', label: 'Document Master', icon: FileText },
  { id: 'verification-rules', label: 'Verification Rules', icon: ShieldCheck },
  { id: 'expiry-alert', label: 'Expiry Alert', icon: Bell },
  { id: 'police-verification', label: 'Police Verification', icon: ShieldAlert }
];

function DocumentCompliance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  // Active Tab from query param or default 'overview'
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'overview' ? {} : { tab: newTab }, { state: location.state });
  };

  // --- STATE FOR 4 MODULES ---
  // 1. Document Master State
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('novaspark_compliance_documents');
    return saved ? JSON.parse(saved) : mockDocumentMasterList;
  });
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('All Categories');
  const [docMandatoryFilter, setDocMandatoryFilter] = useState('All');
  const [docExpiryFilter, setDocExpiryFilter] = useState('All');
  const [docStatusFilter, setDocStatusFilter] = useState('All');
  
  // Modals for Document Master
  const [editingDoc, setEditingDoc] = useState(null); // null when closed
  const [viewingDoc, setViewingDoc] = useState(null); // null when closed

  // 2. Verification Rules State
  const [verificationRules, setVerificationRules] = useState(() => {
    const saved = localStorage.getItem('novaspark_compliance_verification_rules');
    return saved ? JSON.parse(saved) : mockVerificationRules;
  });
  const [vrSearch, setVrSearch] = useState('');
  const [vrMethodFilter, setVrMethodFilter] = useState('All');
  const [vrVerifierFilter, setVrVerifierFilter] = useState('All');
  const [vrStatusFilter, setVrStatusFilter] = useState('All');
  
  // Modal for Verification Rule
  const [editingRule, setEditingRule] = useState(null); // null when closed

  // 3. Expiry Alert State
  const [expiryConfig, setExpiryConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_compliance_expiry_config');
    return saved ? JSON.parse(saved) : mockExpiryAlertConfig;
  });
  const [expiryRules, setExpiryRules] = useState(() => {
    const saved = localStorage.getItem('novaspark_compliance_expiry_rules');
    return saved ? JSON.parse(saved) : mockExpiryRules;
  });
  const [editingExpiryRule, setEditingExpiryRule] = useState(null);

  // 4. Police Verification State
  const [policeConfig, setPoliceConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_compliance_police_config');
    return saved ? JSON.parse(saved) : mockPoliceVerificationConfig;
  });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- 1. DOCUMENT MASTER HANDLERS ---
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(docSearch.toLowerCase()) || 
                            doc.code.toLowerCase().includes(docSearch.toLowerCase());
      const matchesCategory = docCategoryFilter === 'All Categories' || doc.category === docCategoryFilter;
      const matchesMandatory = docMandatoryFilter === 'All' || 
                               (docMandatoryFilter === 'Yes' ? doc.mandatory : !doc.mandatory);
      const matchesExpiry = docExpiryFilter === 'All' || 
                            (docExpiryFilter === 'Yes' ? doc.expiryApplicable : !doc.expiryApplicable);
      const matchesStatus = docStatusFilter === 'All' || doc.status === docStatusFilter;
      return matchesSearch && matchesCategory && matchesMandatory && matchesExpiry && matchesStatus;
    });
  }, [documents, docSearch, docCategoryFilter, docMandatoryFilter, docExpiryFilter, docStatusFilter]);

  const handleOpenAddDoc = () => {
    setEditingDoc({
      id: `doc-${Date.now()}`,
      name: '',
      code: '',
      category: 'Identity',
      applicableTo: 'All Employees',
      mandatory: true,
      verificationRequired: true,
      expiryApplicable: false,
      multipleAllowed: false,
      description: '',
      status: 'Active'
    });
  };

  const handleSaveDocModal = (e) => {
    e.preventDefault();
    if (!editingDoc.name.trim() || !editingDoc.code.trim()) {
      showToast('Please provide both Document Name and Code.', 'error');
      return;
    }

    const stamped = { ...editingDoc, lastUpdated: new Date().toLocaleString() };
    const exists = documents.some(d => d.id === stamped.id);
    let updatedList;
    if (exists) {
      updatedList = documents.map(d => d.id === stamped.id ? stamped : d);
    } else {
      updatedList = [stamped, ...documents];
    }
    setDocuments(updatedList);
    localStorage.setItem('novaspark_compliance_documents', JSON.stringify(updatedList));
    setEditingDoc(null);
    showToast(`Document "${stamped.name}" saved successfully!`);
  };

  const handleToggleDocStatus = (doc) => {
    const nextStatus = doc.status === 'Active' ? 'Inactive' : 'Active';
    const updated = documents.map(d => d.id === doc.id ? { ...d, status: nextStatus } : d);
    setDocuments(updated);
    localStorage.setItem('novaspark_compliance_documents', JSON.stringify(updated));
    showToast(`Document "${doc.name}" marked as ${nextStatus}.`);
  };

  const handleDeleteDoc = (doc) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Document Definition?`,
      message: `Are you sure you want to delete "${doc.name}" (${doc.code}) from Document Master?`,
      onConfirm: () => {
        const updated = documents.filter(d => d.id !== doc.id);
        setDocuments(updated);
        localStorage.setItem('novaspark_compliance_documents', JSON.stringify(updated));
        showToast(`Document "${doc.name}" deleted.`, 'info');
      }
    });
  };

  // --- 2. VERIFICATION RULES HANDLERS ---
  const filteredVerificationRules = useMemo(() => {
    return verificationRules.filter(rule => {
      const matchesSearch = rule.documentName.toLowerCase().includes(vrSearch.toLowerCase());
      const matchesMethod = vrMethodFilter === 'All' || rule.verificationMethod === vrMethodFilter;
      const matchesVerifier = vrVerifierFilter === 'All' || rule.verifierRole === vrVerifierFilter;
      const matchesStatus = vrStatusFilter === 'All' || rule.status === vrStatusFilter;
      return matchesSearch && matchesMethod && matchesVerifier && matchesStatus;
    });
  }, [verificationRules, vrSearch, vrMethodFilter, vrVerifierFilter, vrStatusFilter]);

  const handleOpenAddRule = () => {
    setEditingRule({
      id: `vr-${Date.now()}`,
      documentId: documents[0]?.id || 'doc-1',
      documentName: documents[0]?.name || 'Aadhaar Card',
      category: documents[0]?.category || 'Identity',
      verificationRequired: true,
      verificationMethod: VERIFICATION_METHODS[0],
      verifierRole: VERIFIER_ROLES[0],
      verificationDeadline: '7 Days from Joining',
      validity: '1 Year',
      requireBeforeActivation: true,
      reverifyAfterExpiry: true,
      remarks: '',
      status: 'Active'
    });
  };

  const handleSaveRuleModal = (e) => {
    e.preventDefault();
    const targetDoc = documents.find(d => d.id === editingRule.documentId);
    const stamped = {
      ...editingRule,
      documentName: targetDoc ? targetDoc.name : editingRule.documentName,
      category: targetDoc ? targetDoc.category : editingRule.category,
      lastUpdated: new Date().toLocaleString()
    };

    const exists = verificationRules.some(r => r.id === stamped.id);
    let updatedList;
    if (exists) {
      updatedList = verificationRules.map(r => r.id === stamped.id ? stamped : r);
    } else {
      updatedList = [stamped, ...verificationRules];
    }
    setVerificationRules(updatedList);
    localStorage.setItem('novaspark_compliance_verification_rules', JSON.stringify(updatedList));
    setEditingRule(null);
    showToast(`Verification rule for "${stamped.documentName}" saved!`);
  };

  const handleToggleRuleStatus = (rule) => {
    const nextStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
    const updated = verificationRules.map(r => r.id === rule.id ? { ...r, status: nextStatus } : r);
    setVerificationRules(updated);
    localStorage.setItem('novaspark_compliance_verification_rules', JSON.stringify(updated));
    showToast(`Rule for "${rule.documentName}" marked as ${nextStatus}.`);
  };

  const handleDeleteRule = (rule) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Verification Rule?`,
      message: `Are you sure you want to remove the verification rule for "${rule.documentName}"?`,
      onConfirm: () => {
        const updated = verificationRules.filter(r => r.id !== rule.id);
        setVerificationRules(updated);
        localStorage.setItem('novaspark_compliance_verification_rules', JSON.stringify(updated));
        showToast(`Verification rule deleted.`, 'info');
      }
    });
  };

  // --- 3. EXPIRY ALERT HANDLERS ---
  const saveExpiryConfig = () => {
    const updated = { ...expiryConfig, lastUpdated: new Date().toLocaleString() };
    setExpiryConfig(updated);
    localStorage.setItem('novaspark_compliance_expiry_config', JSON.stringify(updated));
    showToast('Expiry alert preferences saved successfully!');
  };

  const resetExpiryConfig = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Expiry Alert Settings?',
      message: 'This will revert all global expiry alert thresholds to defaults.',
      onConfirm: () => {
        setExpiryConfig(mockExpiryAlertConfig);
        localStorage.setItem('novaspark_compliance_expiry_config', JSON.stringify(mockExpiryAlertConfig));
        showToast('Expiry alert settings reset to default.', 'info');
      }
    });
  };

  const handleOpenAddExpiryRule = () => {
    setEditingExpiryRule({
      id: `er-${Date.now()}`,
      documentId: documents.find(d => d.expiryApplicable)?.id || documents[0]?.id,
      documentName: documents.find(d => d.expiryApplicable)?.name || documents[0]?.name,
      category: documents.find(d => d.expiryApplicable)?.category || documents[0]?.category,
      alertDays: 30,
      escalationLevel: 'Admin & HR',
      repeatFrequency: 'Every 7 Days',
      channels: 'In-App + Email',
      status: 'Active'
    });
  };

  const handleSaveExpiryRuleModal = (e) => {
    e.preventDefault();
    const targetDoc = documents.find(d => d.id === editingExpiryRule.documentId);
    const stamped = {
      ...editingExpiryRule,
      documentName: targetDoc ? targetDoc.name : editingExpiryRule.documentName,
      category: targetDoc ? targetDoc.category : editingExpiryRule.category
    };

    const exists = expiryRules.some(r => r.id === stamped.id);
    let updatedList;
    if (exists) {
      updatedList = expiryRules.map(r => r.id === stamped.id ? stamped : r);
    } else {
      updatedList = [stamped, ...expiryRules];
    }
    setExpiryRules(updatedList);
    localStorage.setItem('novaspark_compliance_expiry_rules', JSON.stringify(updatedList));
    setEditingExpiryRule(null);
    showToast(`Expiry alert rule for "${stamped.documentName}" saved!`);
  };

  const handleDeleteExpiryRule = (rule) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Expiry Rule?`,
      message: `Are you sure you want to remove the expiry alert rule for "${rule.documentName}"?`,
      onConfirm: () => {
        const updated = expiryRules.filter(r => r.id !== rule.id);
        setExpiryRules(updated);
        localStorage.setItem('novaspark_compliance_expiry_rules', JSON.stringify(updated));
        showToast(`Expiry alert rule deleted.`, 'info');
      }
    });
  };

  // --- 4. POLICE VERIFICATION HANDLERS ---
  const savePoliceConfig = () => {
    const updated = { ...policeConfig, lastUpdated: new Date().toLocaleString() };
    setPoliceConfig(updated);
    localStorage.setItem('novaspark_compliance_police_config', JSON.stringify(updated));
    showToast('Police verification compliance rules saved successfully!');
  };

  const resetPoliceConfig = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Police Verification Rules?',
      message: 'This will revert Police Verification rules and document requirements to default standards.',
      onConfirm: () => {
        setPoliceConfig(mockPoliceVerificationConfig);
        localStorage.setItem('novaspark_compliance_police_config', JSON.stringify(mockPoliceVerificationConfig));
        showToast('Police verification rules reset to default.', 'info');
      }
    });
  };

  const handleDocRequirementChange = (docId, newRequirement) => {
    const updatedDocs = policeConfig.supportingDocuments.map(doc => 
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

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <span 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/admin/dashboard')}
                style={{ cursor: 'pointer' }}
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
              Manage employee document requirements, verification rules and compliance alerts.
            </p>
          </div>
        </header>

        {/* Tabs Bar with Scroller */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsScroller}>
            {TABS.filter(t => t.id === activeTab).map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  style={{ pointerEvents: 'none', cursor: 'default' }}
                >
                  <IconComponent size={15} />
                  <span>{tab.label}</span>
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
              
              {/* Card 1: Document Master */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Document Master</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Define organization-wide document types, applicability filters, mandatory rules, and expiry tracking flags.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Total Documents:</span>
                    <span className={styles.metaValue}>{documents.length} Master Types</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Mandatory Docs:</span>
                    <span className={styles.metaValue}>{documents.filter(d => d.mandatory).length} Documents</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('document-master')}
                  >
                    <span>Configure Master</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Verification Rules */}
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
                    <span className={styles.metaLabel}>Active Rules:</span>
                    <span className={styles.metaValue}>{verificationRules.length} Verification Rules</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Pre-Activation Required:</span>
                    <span className={styles.metaValue}>{verificationRules.filter(r => r.requireBeforeActivation).length} Critical Docs</span>
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

              {/* Card 3: Expiry Alert */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Expiry Alert</h3>
                    <StatusBadge status={expiryConfig.enabled ? 'Active' : 'Inactive'} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Automated proactive notifications and escalation triggers before employee licenses, ID cards, and police certificates expire.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Default Alert Horizon:</span>
                    <span className={styles.metaValue}>{expiryConfig.defaultAlertDays} Days Before Expiry</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Custom Rules:</span>
                    <span className={styles.metaValue}>{expiryRules.length} Document Rules</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('expiry-alert')}
                  >
                    <span>Configure Alerts</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 4: Police Verification */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Police Verification</h3>
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
                    <span>Configure Police Verification</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. DOCUMENT MASTER TAB */}
          {activeTab === 'document-master' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Toolbar */}
              <div className={styles.tableToolbar}>
                <div className={styles.searchBox}>
                  <Search size={15} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Search document name or code..." 
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                </div>

                <div className={styles.filtersRow}>
                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={docCategoryFilter}
                    onChange={(e) => setDocCategoryFilter(e.target.value)}
                  >
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={docMandatoryFilter}
                    onChange={(e) => setDocMandatoryFilter(e.target.value)}
                  >
                    <option value="All">All Mandatory</option>
                    <option value="Yes">Mandatory Only</option>
                    <option value="No">Optional Only</option>
                  </select>

                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={docExpiryFilter}
                    onChange={(e) => setDocExpiryFilter(e.target.value)}
                  >
                    <option value="All">All Expiry Types</option>
                    <option value="Yes">Expiry Applicable</option>
                    <option value="No">No Expiry</option>
                  </select>

                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <button 
                    type="button" 
                    className={styles.btnPrimary}
                    onClick={handleOpenAddDoc}
                  >
                    <Plus size={14} />
                    <span>Add Document Type</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Code</th>
                      <th>Category</th>
                      <th>Applicable To</th>
                      <th>Mandatory</th>
                      <th>Verification</th>
                      <th>Expiry</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <tr key={doc.id}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{doc.name}</strong>
                          </td>
                          <td>
                            <code style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {doc.code}
                            </code>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', background: '#eef2ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {doc.category}
                            </span>
                          </td>
                          <td style={{ color: '#475569', fontSize: '12.5px' }}>
                            {doc.applicableTo}
                          </td>
                          <td>
                            {doc.mandatory ? (
                              <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 700, background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>
                                Required
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Optional</span>
                            )}
                          </td>
                          <td>
                            {doc.verificationRequired ? (
                              <span style={{ fontSize: '11.5px', color: '#047857', fontWeight: 600 }}>Yes</span>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>No</span>
                            )}
                          </td>
                          <td>
                            {doc.expiryApplicable ? (
                              <span style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 600 }}>Tracked</span>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={doc.status} />
                          </td>
                          <td>
                            <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                              <button 
                                type="button" 
                                className={styles.iconBtn}
                                onClick={() => setViewingDoc(doc)}
                                title="View Configuration Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                type="button" 
                                className={styles.iconBtn}
                                onClick={() => setEditingDoc(doc)}
                                title="Edit Document"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                type="button" 
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => handleDeleteDoc(doc)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No documents found matching filters</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Try adjusting your search query or categories.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add / Edit Document Modal */}
              {editingDoc && (
                <div className={styles.modalOverlay} onClick={() => setEditingDoc(null)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>
                        {documents.some(d => d.id === editingDoc.id) ? 'Edit Document Type' : 'Add New Document Type'}
                      </h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setEditingDoc(null)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveDocModal}>
                      <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Document Name <span className={styles.requiredStar}>*</span>
                            </label>
                            <input 
                              type="text" 
                              className={styles.input}
                              placeholder="e.g. Aadhaar Card"
                              value={editingDoc.name}
                              onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                              required
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Document Code <span className={styles.requiredStar}>*</span>
                            </label>
                            <input 
                              type="text" 
                              className={styles.input}
                              placeholder="e.g. DOC-AADHAAR"
                              value={editingDoc.code}
                              onChange={(e) => setEditingDoc({ ...editingDoc, code: e.target.value.toUpperCase() })}
                              required
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Category <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingDoc.category}
                              onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                            >
                              {DOCUMENT_CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Applicable To</label>
                            <select 
                              className={styles.select}
                              value={editingDoc.applicableTo}
                              onChange={(e) => setEditingDoc({ ...editingDoc, applicableTo: e.target.value })}
                            >
                              {APPLICABLE_AUDIENCES.map(aud => (
                                <option key={aud} value={aud}>{aud}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Description / Instructions</label>
                          <textarea 
                            className={styles.textarea}
                            rows={2}
                            placeholder="Briefly describe validity, issuance authority, and compliance usage..."
                            value={editingDoc.description}
                            onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                          />
                        </div>

                        {/* Settings Checkboxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingDoc.mandatory}
                              onChange={(e) => setEditingDoc({ ...editingDoc, mandatory: e.target.checked })}
                            />
                            <span>Mandatory Document</span>
                          </label>

                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingDoc.verificationRequired}
                              onChange={(e) => setEditingDoc({ ...editingDoc, verificationRequired: e.target.checked })}
                            />
                            <span>Verification Required</span>
                          </label>

                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingDoc.expiryApplicable}
                              onChange={(e) => setEditingDoc({ ...editingDoc, expiryApplicable: e.target.checked })}
                            />
                            <span>Expiry Date Applicable</span>
                          </label>

                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingDoc.multipleAllowed}
                              onChange={(e) => setEditingDoc({ ...editingDoc, multipleAllowed: e.target.checked })}
                            />
                            <span>Multiple Attachments Allowed</span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>Status:</span>
                          <select 
                            className={styles.select}
                            style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                            value={editingDoc.status}
                            onChange={(e) => setEditingDoc({ ...editingDoc, status: e.target.value })}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.modalFooter}>
                        <button 
                          type="button" 
                          className={styles.btnSecondary} 
                          onClick={() => setEditingDoc(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className={styles.btnPrimary}>
                          <Save size={14} />
                          <span>Save Document</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* View Document Details Modal */}
              {viewingDoc && (
                <div className={styles.modalOverlay} onClick={() => setViewingDoc(null)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>Document Specification Details</h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setViewingDoc(null)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className={styles.modalBody}>
                      <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Document Name</span>
                          <span className={styles.detailVal}>{viewingDoc.name}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Document Code</span>
                          <span className={styles.detailVal}><code>{viewingDoc.code}</code></span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Category</span>
                          <span className={styles.detailVal}>{viewingDoc.category}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Applicability</span>
                          <span className={styles.detailVal}>{viewingDoc.applicableTo}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Mandatory Status</span>
                          <span className={styles.detailVal}>{viewingDoc.mandatory ? 'Mandatory (Required)' : 'Optional'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Verification Required</span>
                          <span className={styles.detailVal}>{viewingDoc.verificationRequired ? 'Yes (Must be Verified)' : 'No'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Expiry Tracking</span>
                          <span className={styles.detailVal}>{viewingDoc.expiryApplicable ? 'Yes (Has Validity Expiry)' : 'No (Lifetime)'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Multiple Attachments</span>
                          <span className={styles.detailVal}>{viewingDoc.multipleAllowed ? 'Allowed' : 'Single Only'}</span>
                        </div>
                      </div>

                      {viewingDoc.description && (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' }}>
                          <span className={styles.detailLabel}>Compliance Notes:</span>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                            {viewingDoc.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className={styles.modalFooter}>
                      <button 
                        type="button" 
                        className={styles.btnPrimary} 
                        onClick={() => setViewingDoc(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. VERIFICATION RULES TAB */}
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
                          <p style={{ margin: 0, fontWeight: 600 }}>No verification rules found</p>
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
                              Document Type <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingRule.documentId}
                              onChange={(e) => setEditingRule({ ...editingRule, documentId: e.target.value })}
                            >
                              {documents.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                              ))}
                            </select>
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
                          <span>Save Rule</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 4. EXPIRY ALERT TAB */}
          {activeTab === 'expiry-alert' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Global Expiry Config Card */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Global Expiry Alert Settings</h2>
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
                            checked={expiryConfig.recipients.admin}
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
                            checked={expiryConfig.recipients.hr}
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
                            checked={expiryConfig.recipients.reportingManager}
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
                            checked={expiryConfig.recipients.siteSupervisor}
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
                            checked={expiryConfig.channels.inApp}
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
                            checked={expiryConfig.channels.email}
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
                    Last updated: <strong>{expiryConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnSecondary} onClick={resetExpiryConfig}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={saveExpiryConfig}>
                      <Save size={14} />
                      <span>Save Settings</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Document-Specific Expiry Alert Rules Table */}
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
                      {expiryRules.map((rule) => (
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
                      ))}
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
                              Document Type <span className={styles.requiredStar}>*</span>
                            </label>
                            <select 
                              className={styles.select}
                              value={editingExpiryRule.documentId}
                              onChange={(e) => setEditingExpiryRule({ ...editingExpiryRule, documentId: e.target.value })}
                            >
                              {documents.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                              ))}
                            </select>
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
                          <span>Save Rule</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 5. POLICE VERIFICATION TAB */}
          {activeTab === 'police-verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Configuration Settings Card */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Police Verification Governance &amp; PSARA Rules</h2>
                    <p className={styles.cardSubtitle}>
                      Configure statutory background check mandates, verification authority, dossier criteria and lifecycle stages.
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
                        <option value="Security Guards">Security Guards &amp; Armed Personnel</option>
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
                    Last updated: <strong>{policeConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnSecondary} onClick={resetPoliceConfig}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={savePoliceConfig}>
                      <Save size={14} />
                      <span>Save Changes</span>
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
                    {policeConfig.stages.map((stg) => (
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
                      {policeConfig.supportingDocuments.map((doc) => (
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
