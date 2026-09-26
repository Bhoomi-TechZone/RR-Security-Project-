import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  FileText, DollarSign, Award, HeartHandshake, FileCheck, 
  Mail, Save, RotateCcw, Eye, Plus, Search, Edit2, Copy, 
  Trash2, ArrowRight, Check, X, Shield, Sparkles, SlidersHorizontal,
  Printer, Download, Building2, UserCheck, Layers, Info
} from 'lucide-react';
import styles from './Templates.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

// Reusing existing SalarySlipPreview component
import SalarySlipPreview from '../../components/payroll/SalarySlipPreview';

// Centralized Placeholders & Initial Mock Data
import { 
  TEMPLATE_PLACEHOLDERS, 
  mockSalarySlipConfig, 
  mockAppointmentLetterConfig, 
  mockJoiningLetterConfig, 
  mockExperienceLetterConfig, 
  mockFullFinalLetterConfig, 
  mockEmailTemplates, 
  EMAIL_CATEGORIES 
} from '../../data/templatesData';

const TABS = [
  { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
  { id: 'salary-slip', label: 'Salary Slip', icon: DollarSign },
  { id: 'appointment-letter', label: 'Appointment Letter', icon: FileCheck },
  { id: 'joining-letter', label: 'Joining Letter', icon: UserCheck },
  { id: 'experience-letter', label: 'Experience Letter', icon: Award },
  { id: 'full-final-letter', label: 'Full & Final Letter', icon: HeartHandshake },
  { id: 'email', label: 'Email Templates', icon: Mail }
];

// Helper to replace template placeholders with mock sample values
function renderPlaceholders(content) {
  if (!content) return '';
  let rendered = content;
  TEMPLATE_PLACEHOLDERS.forEach(item => {
    rendered = rendered.replaceAll(item.key, item.sample);
  });
  return rendered;
}

// Sample slip data for Salary Slip Preview
const SAMPLE_PREVIEW_SLIP = {
  slipNumber: 'SLIP-AUG-2026-001',
  salaryMonth: 'August 2026',
  employeeName: 'Rahul Kumar',
  employeeId: 'EMP001',
  designation: 'Security Officer',
  department: 'Security Operations',
  clientName: 'DLF Cyber City, Tower B',
  bankDetails: {
    bank: 'State Bank of India',
    accountNumber: 'XXXX XXXX 4521'
  },
  uan: '100904582194',
  workingDays: 31,
  presentDays: 26,
  leaveDays: 3,
  absentDays: 2,
  paidDays: 29,
  earnings: {
    basicSalary: 20000,
    hra: 8000,
    transportAllowance: 2000,
    otherAllowance: 2000,
    overtime: 4500,
    grossSalary: 36500
  },
  deductions: {
    pf: 2400,
    esi: 550,
    advanceAdjustment: 1000,
    otherDeduction: 250,
    totalDeductions: 4200
  },
  netSalary: 32300
};

function Templates() {
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
    } else if (!tabParam) {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'overview' ? {} : { tab: newTab }, { state: location.state });
  };

  // --- STATE FOR TEMPLATES ---
  // 1. Salary Slip
  const [salarySlipConfig, setSalarySlipConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_template_salary_slip');
    return saved ? JSON.parse(saved) : mockSalarySlipConfig;
  });
  const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);

  // 2. Appointment Letter
  const [appointmentConfig, setAppointmentConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_template_appointment');
    return saved ? JSON.parse(saved) : mockAppointmentLetterConfig;
  });

  // 3. Joining Letter
  const [joiningConfig, setJoiningConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_template_joining');
    return saved ? JSON.parse(saved) : mockJoiningLetterConfig;
  });

  // 4. Experience Letter
  const [experienceConfig, setExperienceConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_template_experience');
    return saved ? JSON.parse(saved) : mockExperienceLetterConfig;
  });

  // 5. Full & Final Letter
  const [fullFinalConfig, setFullFinalConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_template_full_final');
    return saved ? JSON.parse(saved) : mockFullFinalLetterConfig;
  });

  // 6. Email Templates
  const [emailTemplates, setEmailTemplates] = useState(() => {
    const saved = localStorage.getItem('novaspark_email_templates');
    return saved ? JSON.parse(saved) : mockEmailTemplates;
  });

  // Email Templates Search & Filters
  const [emailSearch, setEmailSearch] = useState('');
  const [emailCategory, setEmailCategory] = useState('All Categories');
  const [emailStatusFilter, setEmailStatusFilter] = useState('All');

  // Email Template Edit Modal / Drawer
  const [editingEmailTemplate, setEditingEmailTemplate] = useState(null); // null when closed
  const [previewingEmailTemplate, setPreviewingEmailTemplate] = useState(null); // null when closed

  // Active Textarea Reference for placeholder insertions
  const letterTextareaRef = useRef(null);
  const emailBodyRef = useRef(null);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Reset / Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- SAVE / RESET HANDLERS ---
  const saveSalarySlip = () => {
    const updated = { ...salarySlipConfig, lastUpdated: new Date().toLocaleString() };
    setSalarySlipConfig(updated);
    localStorage.setItem('novaspark_template_salary_slip', JSON.stringify(updated));
    showToast('Salary Slip template preferences saved successfully!');
  };

  const resetSalarySlip = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Salary Slip Template?',
      message: 'This will revert all salary slip visible sections and options to default configuration.',
      onConfirm: () => {
        setSalarySlipConfig(mockSalarySlipConfig);
        localStorage.setItem('novaspark_template_salary_slip', JSON.stringify(mockSalarySlipConfig));
        showToast('Salary Slip template reset to default.', 'info');
      }
    });
  };

  const saveAppointment = () => {
    const updated = { ...appointmentConfig, lastUpdated: new Date().toLocaleString() };
    setAppointmentConfig(updated);
    localStorage.setItem('novaspark_template_appointment', JSON.stringify(updated));
    showToast('Appointment Letter template saved successfully!');
  };

  const resetAppointment = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Appointment Letter Template?',
      message: 'This will revert the Appointment Letter content and terms to standard draft.',
      onConfirm: () => {
        setAppointmentConfig(mockAppointmentLetterConfig);
        localStorage.setItem('novaspark_template_appointment', JSON.stringify(mockAppointmentLetterConfig));
        showToast('Appointment Letter reset to default.', 'info');
      }
    });
  };

  const saveJoining = () => {
    const updated = { ...joiningConfig, lastUpdated: new Date().toLocaleString() };
    setJoiningConfig(updated);
    localStorage.setItem('novaspark_template_joining', JSON.stringify(updated));
    showToast('Joining Letter template saved successfully!');
  };

  const resetJoining = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Joining Letter Template?',
      message: 'This will revert Joining Letter terms and onboarding content to standard draft.',
      onConfirm: () => {
        setJoiningConfig(mockJoiningLetterConfig);
        localStorage.setItem('novaspark_template_joining', JSON.stringify(mockJoiningLetterConfig));
        showToast('Joining Letter reset to default.', 'info');
      }
    });
  };

  const saveExperience = () => {
    const updated = { ...experienceConfig, lastUpdated: new Date().toLocaleString() };
    setExperienceConfig(updated);
    localStorage.setItem('novaspark_template_experience', JSON.stringify(updated));
    showToast('Experience Letter template saved successfully!');
  };

  const resetExperience = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Experience Certificate Template?',
      message: 'This will revert Experience & Service certificate content to default text.',
      onConfirm: () => {
        setExperienceConfig(mockExperienceLetterConfig);
        localStorage.setItem('novaspark_template_experience', JSON.stringify(mockExperienceLetterConfig));
        showToast('Experience Letter reset to default.', 'info');
      }
    });
  };

  const saveFullFinal = () => {
    const updated = { ...fullFinalConfig, lastUpdated: new Date().toLocaleString() };
    setFullFinalConfig(updated);
    localStorage.setItem('novaspark_template_full_final', JSON.stringify(updated));
    showToast('Full & Final statement template saved successfully!');
  };

  const resetFullFinal = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Full & Final Letter Template?',
      message: 'This will revert the F&F settlement statement formatting to default layout.',
      onConfirm: () => {
        setFullFinalConfig(mockFullFinalLetterConfig);
        localStorage.setItem('novaspark_template_full_final', JSON.stringify(mockFullFinalLetterConfig));
        showToast('Full & Final Letter reset to default.', 'info');
      }
    });
  };

  // --- EMAIL TEMPLATES CRUD ---
  const filteredEmailTemplates = useMemo(() => {
    return emailTemplates.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(emailSearch.toLowerCase()) || 
                            item.subject.toLowerCase().includes(emailSearch.toLowerCase());
      const matchesCategory = emailCategory === 'All Categories' || item.category === emailCategory;
      const matchesStatus = emailStatusFilter === 'All' || item.status === emailStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [emailTemplates, emailSearch, emailCategory, emailStatusFilter]);

  const handleOpenAddEmailTemplate = () => {
    setEditingEmailTemplate({
      id: `em-${Date.now()}`,
      name: '',
      category: 'Onboarding',
      subject: '',
      body: '',
      status: 'Active',
      isDefault: false
    });
  };

  const handleSaveEmailTemplateModal = (e) => {
    e.preventDefault();
    if (!editingEmailTemplate.name.trim() || !editingEmailTemplate.subject.trim()) {
      showToast('Please provide both Template Name and Subject.', 'error');
      return;
    }

    let updatedList;
    const exists = emailTemplates.some(t => t.id === editingEmailTemplate.id);
    const stamped = { ...editingEmailTemplate, lastUpdated: new Date().toLocaleString() };

    if (exists) {
      updatedList = emailTemplates.map(t => t.id === stamped.id ? stamped : t);
    } else {
      updatedList = [stamped, ...emailTemplates];
    }

    // If marked as default, unset previous default for same category
    if (stamped.isDefault) {
      updatedList = updatedList.map(t => {
        if (t.id !== stamped.id && t.category === stamped.category) {
          return { ...t, isDefault: false };
        }
        return t;
      });
    }

    setEmailTemplates(updatedList);
    localStorage.setItem('novaspark_email_templates', JSON.stringify(updatedList));
    setEditingEmailTemplate(null);
    showToast(`Email template "${stamped.name}" saved successfully!`);
  };

  const handleDuplicateEmailTemplate = (template) => {
    const duplicated = {
      ...template,
      id: `em-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      lastUpdated: new Date().toLocaleString()
    };
    const updated = [duplicated, ...emailTemplates];
    setEmailTemplates(updated);
    localStorage.setItem('novaspark_email_templates', JSON.stringify(updated));
    showToast(`Duplicated "${template.name}" successfully!`);
  };

  const handleToggleEmailStatus = (template) => {
    const nextStatus = template.status === 'Active' ? 'Inactive' : 'Active';
    const updated = emailTemplates.map(t => t.id === template.id ? { ...t, status: nextStatus } : t);
    setEmailTemplates(updated);
    localStorage.setItem('novaspark_email_templates', JSON.stringify(updated));
    showToast(`Template "${template.name}" marked as ${nextStatus}.`);
  };

  const handleDeleteEmailTemplate = (template) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete Email Template?`,
      message: `Are you sure you want to remove "${template.name}"? This action cannot be undone.`,
      onConfirm: () => {
        const updated = emailTemplates.filter(t => t.id !== template.id);
        setEmailTemplates(updated);
        localStorage.setItem('novaspark_email_templates', JSON.stringify(updated));
        showToast(`Email template deleted.`, 'info');
      }
    });
  };

  // Insert placeholder pill into active letter textarea
  const insertPlaceholderIntoLetter = (placeholderKey, targetConfigStateSetter, currentConfigState) => {
    const textarea = letterTextareaRef.current;
    if (!textarea) {
      targetConfigStateSetter({
        ...currentConfigState,
        content: currentConfigState.content + ` ${placeholderKey}`
      });
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentConfigState.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = before + placeholderKey + after;
    targetConfigStateSetter({
      ...currentConfigState,
      content: newContent
    });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholderKey.length, start + placeholderKey.length);
    }, 0);
  };

  // Insert placeholder into email modal body
  const insertPlaceholderIntoEmail = (placeholderKey) => {
    const textarea = emailBodyRef.current;
    if (!textarea || !editingEmailTemplate) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = editingEmailTemplate.body || '';
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newBody = before + placeholderKey + after;
    setEditingEmailTemplate({
      ...editingEmailTemplate,
      body: newBody
    });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholderKey.length, start + placeholderKey.length);
    }, 0);
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

        {/* Reused SalarySlipPreview Modal */}
        <SalarySlipPreview 
          isOpen={isSalarySlipModalOpen}
          slip={SAMPLE_PREVIEW_SLIP}
          onClose={() => setIsSalarySlipModalOpen(false)}
          onDownload={() => showToast('Downloading generated Payslip PDF...')}
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
                Templates
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
            <h1 className={styles.pageTitle}>Templates</h1>
            <p className={styles.pageSubtitle}>
              Manage salary slips, employee letters and communication templates used across NovaSpark HRMS.
            </p>
          </div>
        </header>

        {/* Tabs Bar with Scroller */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsScroller}>
            {TABS.filter(t => t.id === activeTab).map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${styles.tabButtonActive}`}
                  style={{ cursor: 'default' }}
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
              
              {/* Card 1: Salary Slip */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Salary Slip Template</h3>
                    <StatusBadge status={salarySlipConfig.status} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Configure visible ledger sections, company header branding, attendance matrix and signatory notes on employee payslips.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Template Name:</span>
                    <span className={styles.metaValue}>{salarySlipConfig.templateName}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Default Template:</span>
                    <span className={styles.metaValue}>{salarySlipConfig.isDefault ? 'Yes (Primary)' : 'Custom'}</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('salary-slip')}
                  >
                    <span>Configure Payslip</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Appointment Letter */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Appointment Letter</h3>
                    <StatusBadge status={appointmentConfig.status} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Standardized formal offer and appointment terms with dynamic salary breakdown, CTC placeholders & probation clauses.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Template Name:</span>
                    <span className={styles.metaValue}>{appointmentConfig.templateName}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Clauses:</span>
                    <span className={styles.metaValue}>CTC, Probation, Notice, Schedule</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('appointment-letter')}
                  >
                    <span>Configure Letter</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Joining Letter */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Joining Letter</h3>
                    <StatusBadge status={joiningConfig.status} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Official joining confirmation, branch/site deployment instructions and reporting officer assignment.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Template Name:</span>
                    <span className={styles.metaValue}>{joiningConfig.templateName}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Reporting Hierarchy:</span>
                    <span className={styles.metaValue}>Site/Branch Supervisor Linked</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('joining-letter')}
                  >
                    <span>Configure Letter</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 4: Experience Letter */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Experience Letter</h3>
                    <StatusBadge status={experienceConfig.status} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Service tenure certificate, conduct statement and relieving acknowledgment issued upon exit.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Template Name:</span>
                    <span className={styles.metaValue}>{experienceConfig.templateName}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Seal &amp; Signature:</span>
                    <span className={styles.metaValue}>HR Director Authorized</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('experience-letter')}
                  >
                    <span>Configure Letter</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 5: Full & Final Letter */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Full &amp; Final Letter</h3>
                    <StatusBadge status={fullFinalConfig.status} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    F&amp;F settlement voucher statement, leave encashment, asset clearance declaration and final payout breakdown.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Template Name:</span>
                    <span className={styles.metaValue}>{fullFinalConfig.templateName}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Settlement Structure:</span>
                    <span className={styles.metaValue}>Earnings, Deductions &amp; Clearance</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('full-final-letter')}
                  >
                    <span>Configure Statement</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 6: Email Templates */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Email Templates</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Automated transactional emails for onboarding, leave approvals, salary slips, overtime and password resets.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Total Templates:</span>
                    <span className={styles.metaValue}>{emailTemplates.length} System Templates</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Active Categories:</span>
                    <span className={styles.metaValue}>Onboarding, Leave, Payroll, Security</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('email')}
                  >
                    <span>Manage Email Templates</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. SALARY SLIP CONFIGURATION TAB */}
          {activeTab === 'salary-slip' && (
            <div className={styles.editorLayout}>
              {/* Left Column: Form & Visible Section Toggles */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Salary Slip Layout &amp; Section Visibility</h2>
                    <p className={styles.cardSubtitle}>
                      Configure which information blocks and statutory details appear on employee downloadable payslips.
                    </p>
                  </div>
                  <StatusBadge status={salarySlipConfig.status} />
                </div>

                <div className={styles.cardBody}>
                  {/* Template Meta */}
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Name</label>
                      <input 
                        type="text" 
                        className={styles.input}
                        value={salarySlipConfig.templateName}
                        onChange={(e) => setSalarySlipConfig({ ...salarySlipConfig, templateName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Status</label>
                      <select 
                        className={styles.select}
                        value={salarySlipConfig.status}
                        onChange={(e) => setSalarySlipConfig({ ...salarySlipConfig, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* 1. Company Information */}
                  <div className={styles.sectionGroup}>
                    <span className={styles.sectionGroupTitle}>
                      <Building2 size={16} color="#4f46e5" />
                      <span>Company Information</span>
                    </span>
                    <div className={styles.checkboxGrid}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.companyInfo.showLogo}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            companyInfo: { ...salarySlipConfig.companyInfo, showLogo: e.target.checked }
                          })}
                        />
                        <span>Company Logo</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.companyInfo.showCompanyName}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            companyInfo: { ...salarySlipConfig.companyInfo, showCompanyName: e.target.checked }
                          })}
                        />
                        <span>Company Name</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.companyInfo.showAddress}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            companyInfo: { ...salarySlipConfig.companyInfo, showAddress: e.target.checked }
                          })}
                        />
                        <span>Registered Address</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.companyInfo.showContact}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            companyInfo: { ...salarySlipConfig.companyInfo, showContact: e.target.checked }
                          })}
                        />
                        <span>Contact &amp; Email</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.companyInfo.showGstPan}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            companyInfo: { ...salarySlipConfig.companyInfo, showGstPan: e.target.checked }
                          })}
                        />
                        <span>PAN / GST Details</span>
                      </label>
                    </div>
                  </div>

                  {/* 2. Employee Information */}
                  <div className={styles.sectionGroup}>
                    <span className={styles.sectionGroupTitle}>
                      <UserCheck size={16} color="#047857" />
                      <span>Employee Information</span>
                    </span>
                    <div className={styles.checkboxGrid}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showName}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showName: e.target.checked }
                          })}
                        />
                        <span>Employee Name</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showEmpCode}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showEmpCode: e.target.checked }
                          })}
                        />
                        <span>Employee Code / ID</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showDepartment}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showDepartment: e.target.checked }
                          })}
                        />
                        <span>Department</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showDesignation}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showDesignation: e.target.checked }
                          })}
                        />
                        <span>Designation</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showLocation}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showLocation: e.target.checked }
                          })}
                        />
                        <span>Location / Site</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showBankDetails}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showBankDetails: e.target.checked }
                          })}
                        />
                        <span>Bank &amp; Account No</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showUanPf}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showUanPf: e.target.checked }
                          })}
                        />
                        <span>UAN / PF Number</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.employeeInfo.showEsiNo}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            employeeInfo: { ...salarySlipConfig.employeeInfo, showEsiNo: e.target.checked }
                          })}
                        />
                        <span>ESI Number</span>
                      </label>
                    </div>
                  </div>

                  {/* 3. Salary & Ledger Details */}
                  <div className={styles.sectionGroup}>
                    <span className={styles.sectionGroupTitle}>
                      <DollarSign size={16} color="#d97706" />
                      <span>Salary &amp; Ledger Details</span>
                    </span>
                    <div className={styles.checkboxGrid}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.salaryInfo.showEarnings}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            salaryInfo: { ...salarySlipConfig.salaryInfo, showEarnings: e.target.checked }
                          })}
                        />
                        <span>Earnings Breakdown</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.salaryInfo.showDeductions}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            salaryInfo: { ...salarySlipConfig.salaryInfo, showDeductions: e.target.checked }
                          })}
                        />
                        <span>Deductions Breakdown</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.salaryInfo.showGrossSalary}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            salaryInfo: { ...salarySlipConfig.salaryInfo, showGrossSalary: e.target.checked }
                          })}
                        />
                        <span>Gross Salary Total</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.salaryInfo.showNetSalary}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            salaryInfo: { ...salarySlipConfig.salaryInfo, showNetSalary: e.target.checked }
                          })}
                        />
                        <span>Net Payable Amount</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.salaryInfo.showEmployerContribution}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            salaryInfo: { ...salarySlipConfig.salaryInfo, showEmployerContribution: e.target.checked }
                          })}
                        />
                        <span>Employer Contribution (PF/ESI)</span>
                      </label>
                    </div>
                  </div>

                  {/* 4. Attendance Summary */}
                  <div className={styles.sectionGroup}>
                    <span className={styles.sectionGroupTitle}>
                      <Layers size={16} color="#7c3aed" />
                      <span>Attendance Summary</span>
                    </span>
                    <div className={styles.checkboxGrid}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.attendanceInfo.showWorkingDays}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            attendanceInfo: { ...salarySlipConfig.attendanceInfo, showWorkingDays: e.target.checked }
                          })}
                        />
                        <span>Working Days</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.attendanceInfo.showPresentDays}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            attendanceInfo: { ...salarySlipConfig.attendanceInfo, showPresentDays: e.target.checked }
                          })}
                        />
                        <span>Present Days</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.attendanceInfo.showPaidLeave}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            attendanceInfo: { ...salarySlipConfig.attendanceInfo, showPaidLeave: e.target.checked }
                          })}
                        />
                        <span>Paid Leave</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.attendanceInfo.showLwp}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            attendanceInfo: { ...salarySlipConfig.attendanceInfo, showLwp: e.target.checked }
                          })}
                        />
                        <span>Loss of Pay (LWP)</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          className={styles.checkboxInput}
                          checked={salarySlipConfig.attendanceInfo.showOvertimeHours}
                          onChange={(e) => setSalarySlipConfig({
                            ...salarySlipConfig,
                            attendanceInfo: { ...salarySlipConfig.attendanceInfo, showOvertimeHours: e.target.checked }
                          })}
                        />
                        <span>Overtime Hours</span>
                      </label>
                    </div>
                  </div>

                  {/* 5. Footer & Notes */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Custom Payslip Footer Notes</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      value={salarySlipConfig.footerInfo.customNotes}
                      onChange={(e) => setSalarySlipConfig({
                        ...salarySlipConfig,
                        footerInfo: { ...salarySlipConfig.footerInfo, customNotes: e.target.value }
                      })}
                    />
                  </div>

                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{salarySlipConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button 
                      type="button" 
                      className={styles.btnSecondary}
                      onClick={() => setIsSalarySlipModalOpen(true)}
                    >
                      <Eye size={14} />
                      <span>Full Screen Preview</span>
                    </button>
                    <button type="button" className={styles.btnSecondary} onClick={resetSalarySlip}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={saveSalarySlip}>
                      <Save size={14} />
                      <span>Save Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Responsive Salary Slip Preview */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Real-time Payslip Preview</h3>
                    <p className={styles.cardSubtitle}>Shows dynamic layout reflecting visible section toggles</p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => setIsSalarySlipModalOpen(true)}
                  >
                    <Printer size={13} />
                    <span>Print Mock</span>
                  </button>
                </div>

                <div className={styles.cardBody} style={{ background: '#f8fafc' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div>
                        {salarySlipConfig.companyInfo.showCompanyName && (
                          <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            RR Security HRMS
                          </h4>
                        )}
                        {salarySlipConfig.companyInfo.showAddress && (
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                            Sector 18, Gurugram, Haryana - 122008
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, background: '#0f172a', color: 'white', padding: '3px 8px', borderRadius: '4px' }}>
                          PAYSPLY
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>August 2026</div>
                      </div>
                    </div>

                    {/* Employee Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                      {salarySlipConfig.employeeInfo.showName && <div><strong>Name:</strong> Rahul Kumar</div>}
                      {salarySlipConfig.employeeInfo.showEmpCode && <div><strong>ID:</strong> EMP001</div>}
                      {salarySlipConfig.employeeInfo.showDepartment && <div><strong>Dept:</strong> Security Operations</div>}
                      {salarySlipConfig.employeeInfo.showDesignation && <div><strong>Role:</strong> Security Officer</div>}
                      {salarySlipConfig.employeeInfo.showLocation && <div><strong>Site:</strong> DLF Cyber City</div>}
                      {salarySlipConfig.employeeInfo.showBankDetails && <div><strong>Bank:</strong> SBI (****4521)</div>}
                    </div>

                    {/* Attendance summary strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#eef2ff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#3730a3', marginBottom: '14px' }}>
                      {salarySlipConfig.attendanceInfo.showWorkingDays && <span>Work: 31d</span>}
                      {salarySlipConfig.attendanceInfo.showPresentDays && <span>Pres: 26d</span>}
                      {salarySlipConfig.attendanceInfo.showPaidLeave && <span>Leave: 3d</span>}
                      {salarySlipConfig.attendanceInfo.showOvertimeHours && <span>OT: 18 hrs</span>}
                      <span>Paid: 29d</span>
                    </div>

                    {/* Ledger */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px', marginBottom: '14px' }}>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', color: '#047857' }}>
                          Earnings
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Basic</span><span>₹20,000</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>HRA</span><span>₹8,000</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>OT</span><span>₹4,500</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px dashed #cbd5e1', paddingTop: '4px', marginTop: '6px' }}>
                          <span>Gross</span><span>₹36,500</span>
                        </div>
                      </div>

                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', color: '#b91c1c' }}>
                          Deductions
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>PF</span><span>₹2,400</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>ESI</span><span>₹550</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Advance</span><span>₹1,000</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px dashed #cbd5e1', paddingTop: '4px', marginTop: '6px' }}>
                          <span>Total</span><span>-₹4,200</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Pay Banner */}
                    <div style={{ background: '#0f172a', color: 'white', padding: '10px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>NET SALARY PAYABLE</span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>₹32,300</span>
                    </div>

                    {/* Footer note */}
                    {salarySlipConfig.footerInfo.showNotes && (
                      <p style={{ margin: '12px 0 0', fontSize: '10px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
                        {salarySlipConfig.footerInfo.customNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. APPOINTMENT LETTER TAB */}
          {activeTab === 'appointment-letter' && (
            <div className={styles.editorLayout}>
              {/* Left: Template Content Editor */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Appointment Letter Template</h2>
                    <p className={styles.cardSubtitle}>Configure joining offer terms, probation period, and CTC breakdown structure.</p>
                  </div>
                  <StatusBadge status={appointmentConfig.status} />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Title</label>
                      <input 
                        type="text" 
                        className={styles.input}
                        value={appointmentConfig.templateName}
                        onChange={(e) => setAppointmentConfig({ ...appointmentConfig, templateName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Status</label>
                      <select 
                        className={styles.select}
                        value={appointmentConfig.status}
                        onChange={(e) => setAppointmentConfig({ ...appointmentConfig, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Document Heading</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      value={appointmentConfig.headerTitle}
                      onChange={(e) => setAppointmentConfig({ ...appointmentConfig, headerTitle: e.target.value })}
                    />
                  </div>

                  {/* Placeholders Helper Panel */}
                  <div className={styles.placeholdersPanel}>
                    <div className={styles.placeholdersHeader}>
                      <span>Insert Dynamic Placeholders (Click to insert at cursor)</span>
                      <Sparkles size={14} color="#6366f1" />
                    </div>
                    <div className={styles.placeholdersPills}>
                      {TEMPLATE_PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className={styles.placeholderPill}
                          onClick={() => insertPlaceholderIntoLetter(p.key, setAppointmentConfig, appointmentConfig)}
                          title={`Insert ${p.label} (Sample: ${p.sample})`}
                        >
                          <span>{p.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Letter Body Content &amp; Clauses</label>
                    <textarea 
                      ref={letterTextareaRef}
                      className={styles.textarea}
                      rows={14}
                      value={appointmentConfig.content}
                      onChange={(e) => setAppointmentConfig({ ...appointmentConfig, content: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{appointmentConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnSecondary} onClick={resetAppointment}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={saveAppointment}>
                      <Save size={14} />
                      <span>Save Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Real-time Printable Letter Preview */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Document Preview</h3>
                    <p className={styles.cardSubtitle}>Live resolution with sample candidate values</p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => window.print()}
                  >
                    <Printer size={13} />
                    <span>Print Letter</span>
                  </button>
                </div>

                <div className={styles.cardBody} style={{ background: '#f8fafc' }}>
                  <div className={styles.previewPaper}>
                    <div className={styles.previewWatermark}>APPOINTMENT</div>
                    <div>
                      <div className={styles.previewPaperHeader}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            RR SECURITY SERVICES
                          </h3>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Plot 45, Sector 18, Gurugram, Haryana</span>
                        </div>
                        <div className={styles.previewDocTitle}>{appointmentConfig.headerTitle}</div>
                      </div>
                      <div className={styles.previewDocBody}>
                        {renderPlaceholders(appointmentConfig.content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. JOINING LETTER TAB */}
          {activeTab === 'joining-letter' && (
            <div className={styles.editorLayout}>
              {/* Left: Template Content Editor */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Joining Letter Template</h2>
                    <p className={styles.cardSubtitle}>Configure onboarding confirmation, station/site instructions and supervisor assignment.</p>
                  </div>
                  <StatusBadge status={joiningConfig.status} />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Title</label>
                      <input 
                        type="text" 
                        className={styles.input}
                        value={joiningConfig.templateName}
                        onChange={(e) => setJoiningConfig({ ...joiningConfig, templateName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Status</label>
                      <select 
                        className={styles.select}
                        value={joiningConfig.status}
                        onChange={(e) => setJoiningConfig({ ...joiningConfig, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Document Heading</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      value={joiningConfig.headerTitle}
                      onChange={(e) => setJoiningConfig({ ...joiningConfig, headerTitle: e.target.value })}
                    />
                  </div>

                  {/* Placeholders Helper Panel */}
                  <div className={styles.placeholdersPanel}>
                    <div className={styles.placeholdersHeader}>
                      <span>Insert Dynamic Placeholders (Click to insert at cursor)</span>
                      <Sparkles size={14} color="#6366f1" />
                    </div>
                    <div className={styles.placeholdersPills}>
                      {TEMPLATE_PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className={styles.placeholderPill}
                          onClick={() => insertPlaceholderIntoLetter(p.key, setJoiningConfig, joiningConfig)}
                        >
                          <span>{p.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Letter Body Content</label>
                    <textarea 
                      ref={letterTextareaRef}
                      className={styles.textarea}
                      rows={14}
                      value={joiningConfig.content}
                      onChange={(e) => setJoiningConfig({ ...joiningConfig, content: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{joiningConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnSecondary} onClick={resetJoining}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={saveJoining}>
                      <Save size={14} />
                      <span>Save Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Real-time Printable Letter Preview */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Document Preview</h3>
                    <p className={styles.cardSubtitle}>Live resolution with sample onboarding values</p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => window.print()}
                  >
                    <Printer size={13} />
                    <span>Print Letter</span>
                  </button>
                </div>

                <div className={styles.cardBody} style={{ background: '#f8fafc' }}>
                  <div className={styles.previewPaper}>
                    <div className={styles.previewWatermark}>JOINING</div>
                    <div>
                      <div className={styles.previewPaperHeader}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            RR SECURITY SERVICES
                          </h3>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Operations &amp; Guard Deployment Cell</span>
                        </div>
                        <div className={styles.previewDocTitle}>{joiningConfig.headerTitle}</div>
                      </div>
                      <div className={styles.previewDocBody}>
                        {renderPlaceholders(joiningConfig.content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. EXPERIENCE LETTER TAB */}
          {activeTab === 'experience-letter' && (
            <div className={styles.editorLayout}>
              {/* Left: Template Content Editor */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Experience Certificate Template</h2>
                    <p className={styles.cardSubtitle}>Configure employment duration certification, conduct statements, and relieving sign-offs.</p>
                  </div>
                  <StatusBadge status={experienceConfig.status} />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Title</label>
                      <input 
                        type="text" 
                        className={styles.input}
                        value={experienceConfig.templateName}
                        onChange={(e) => setExperienceConfig({ ...experienceConfig, templateName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Status</label>
                      <select 
                        className={styles.select}
                        value={experienceConfig.status}
                        onChange={(e) => setExperienceConfig({ ...experienceConfig, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Document Heading</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      value={experienceConfig.headerTitle}
                      onChange={(e) => setExperienceConfig({ ...experienceConfig, headerTitle: e.target.value })}
                    />
                  </div>

                  {/* Placeholders Helper Panel */}
                  <div className={styles.placeholdersPanel}>
                    <div className={styles.placeholdersHeader}>
                      <span>Insert Dynamic Placeholders (Click to insert at cursor)</span>
                      <Sparkles size={14} color="#6366f1" />
                    </div>
                    <div className={styles.placeholdersPills}>
                      {TEMPLATE_PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className={styles.placeholderPill}
                          onClick={() => insertPlaceholderIntoLetter(p.key, setExperienceConfig, experienceConfig)}
                        >
                          <span>{p.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Certificate Body Content</label>
                    <textarea 
                      ref={letterTextareaRef}
                      className={styles.textarea}
                      rows={14}
                      value={experienceConfig.content}
                      onChange={(e) => setExperienceConfig({ ...experienceConfig, content: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{experienceConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnSecondary} onClick={resetExperience}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={saveExperience}>
                      <Save size={14} />
                      <span>Save Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Real-time Printable Letter Preview */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Document Preview</h3>
                    <p className={styles.cardSubtitle}>Official Service Certificate format</p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => window.print()}
                  >
                    <Printer size={13} />
                    <span>Print Certificate</span>
                  </button>
                </div>

                <div className={styles.cardBody} style={{ background: '#f8fafc' }}>
                  <div className={styles.previewPaper}>
                    <div className={styles.previewWatermark}>EXPERIENCE</div>
                    <div>
                      <div className={styles.previewPaperHeader}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            RR SECURITY SERVICES
                          </h3>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Department of Human Resources &amp; Personnel</span>
                        </div>
                        <div className={styles.previewDocTitle}>{experienceConfig.headerTitle}</div>
                      </div>
                      <div className={styles.previewDocBody}>
                        {renderPlaceholders(experienceConfig.content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. FULL & FINAL LETTER TAB */}
          {activeTab === 'full-final-letter' && (
            <div className={styles.editorLayout}>
              {/* Left: Template Content Editor */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h2 className={styles.cardTitle}>Full &amp; Final Statement Template</h2>
                    <p className={styles.cardSubtitle}>Configure exit settlement statement layout, dues clearance acknowledgment and signatory block.</p>
                  </div>
                  <StatusBadge status={fullFinalConfig.status} />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Title</label>
                      <input 
                        type="text" 
                        className={styles.input}
                        value={fullFinalConfig.templateName}
                        onChange={(e) => setFullFinalConfig({ ...fullFinalConfig, templateName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Template Status</label>
                      <select 
                        className={styles.select}
                        value={fullFinalConfig.status}
                        onChange={(e) => setFullFinalConfig({ ...fullFinalConfig, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Document Heading</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      value={fullFinalConfig.headerTitle}
                      onChange={(e) => setFullFinalConfig({ ...fullFinalConfig, headerTitle: e.target.value })}
                    />
                  </div>

                  {/* Placeholders Helper Panel */}
                  <div className={styles.placeholdersPanel}>
                    <div className={styles.placeholdersHeader}>
                      <span>Insert Dynamic Placeholders (Click to insert at cursor)</span>
                      <Sparkles size={14} color="#6366f1" />
                    </div>
                    <div className={styles.placeholdersPills}>
                      {TEMPLATE_PLACEHOLDERS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className={styles.placeholderPill}
                          onClick={() => insertPlaceholderIntoLetter(p.key, setFullFinalConfig, fullFinalConfig)}
                        >
                          <span>{p.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Settlement Statement Body</label>
                    <textarea 
                      ref={letterTextareaRef}
                      className={styles.textarea}
                      rows={14}
                      value={fullFinalConfig.content}
                      onChange={(e) => setFullFinalConfig({ ...fullFinalConfig, content: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{fullFinalConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button type="button" className={styles.btnSecondary} onClick={resetFullFinal}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="button" className={styles.btnPrimary} onClick={saveFullFinal}>
                      <Save size={14} />
                      <span>Save Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Real-time Printable Letter Preview */}
              <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleWrap}>
                    <h3 className={styles.cardTitle}>Document Preview</h3>
                    <p className={styles.cardSubtitle}>Full &amp; Final Settlement Clearance Slip</p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => window.print()}
                  >
                    <Printer size={13} />
                    <span>Print Statement</span>
                  </button>
                </div>

                <div className={styles.cardBody} style={{ background: '#f8fafc' }}>
                  <div className={styles.previewPaper}>
                    <div className={styles.previewWatermark}>F&amp;F CLEARANCE</div>
                    <div>
                      <div className={styles.previewPaperHeader}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            RR SECURITY SERVICES
                          </h3>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Finance &amp; Accounts Settlement Wing</span>
                        </div>
                        <div className={styles.previewDocTitle}>{fullFinalConfig.headerTitle}</div>
                      </div>
                      <div className={styles.previewDocBody}>
                        {renderPlaceholders(fullFinalConfig.content)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. EMAIL TEMPLATES TAB */}
          {activeTab === 'email' && (
            <div className={styles.singleColumnLayout}>
              
              {/* Toolbar */}
              <div className={styles.tableToolbar}>
                <div className={styles.searchBox}>
                  <Search size={15} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Search template name or subject..." 
                    value={emailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                  />
                </div>

                <div className={styles.filtersRow}>
                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={emailCategory}
                    onChange={(e) => setEmailCategory(e.target.value)}
                  >
                    {EMAIL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.select}
                    style={{ width: 'auto' }}
                    value={emailStatusFilter}
                    onChange={(e) => setEmailStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>

                  <button 
                    type="button" 
                    className={styles.btnPrimary}
                    onClick={handleOpenAddEmailTemplate}
                  >
                    <Plus size={14} />
                    <span>Add Email Template</span>
                  </button>
                </div>
              </div>

              {/* Email Templates Data Table */}
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Category</th>
                      <th>Subject Line</th>
                      <th>Status</th>
                      <th>Default</th>
                      <th>Last Updated</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmailTemplates.length > 0 ? (
                      filteredEmailTemplates.map((template) => (
                        <tr key={template.id}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{template.name}</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '11.5px', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {template.category}
                            </span>
                          </td>
                          <td style={{ color: '#475569', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {template.subject}
                          </td>
                          <td>
                            <StatusBadge status={template.status} />
                          </td>
                          <td>
                            {template.isDefault ? (
                              <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                Default
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>
                            {template.lastUpdated}
                          </td>
                          <td>
                            <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                              <button 
                                type="button" 
                                className={styles.iconBtn}
                                onClick={() => setPreviewingEmailTemplate(template)}
                                title="Live Preview"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                type="button" 
                                className={styles.iconBtn}
                                onClick={() => setEditingEmailTemplate(template)}
                                title="Edit Template"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                type="button" 
                                className={styles.iconBtn}
                                onClick={() => handleDuplicateEmailTemplate(template)}
                                title="Duplicate"
                              >
                                <Copy size={14} />
                              </button>
                              <button 
                                type="button" 
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                onClick={() => handleDeleteEmailTemplate(template)}
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
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No email templates found</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Try adjusting your search query or filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Email Template Edit Modal / Drawer */}
              {editingEmailTemplate && (
                <div className={styles.modalOverlay} onClick={() => setEditingEmailTemplate(null)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>
                        {emailTemplates.some(t => t.id === editingEmailTemplate.id) ? 'Edit Email Template' : 'Add New Email Template'}
                      </h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setEditingEmailTemplate(null)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEmailTemplateModal}>
                      <div className={styles.modalBody}>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Template Name <span className={styles.requiredStar}>*</span>
                            </label>
                            <input 
                              type="text" 
                              className={styles.input}
                              placeholder="e.g. Leave Approval Notice"
                              value={editingEmailTemplate.name}
                              onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, name: e.target.value })}
                              required
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <select 
                              className={styles.select}
                              value={editingEmailTemplate.category}
                              onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, category: e.target.value })}
                            >
                              {EMAIL_CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            Subject Line <span className={styles.requiredStar}>*</span>
                          </label>
                          <input 
                            type="text" 
                            className={styles.input}
                            placeholder="e.g. Leave Approved: {{leaveType}} - {{companyName}}"
                            value={editingEmailTemplate.subject}
                            onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, subject: e.target.value })}
                            required
                          />
                        </div>

                        {/* Placeholders Helper Panel */}
                        <div className={styles.placeholdersPanel}>
                          <div className={styles.placeholdersHeader}>
                            <span>Click to insert variable into body:</span>
                            <Sparkles size={14} color="#6366f1" />
                          </div>
                          <div className={styles.placeholdersPills}>
                            {TEMPLATE_PLACEHOLDERS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                className={styles.placeholderPill}
                                onClick={() => insertPlaceholderIntoEmail(p.key)}
                              >
                                <span>{p.key}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Email Body (Text / HTML)</label>
                          <textarea 
                            ref={emailBodyRef}
                            className={styles.textarea}
                            rows={8}
                            placeholder="Type email body template here..."
                            value={editingEmailTemplate.body}
                            onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, body: e.target.value })}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
                          <label className={styles.checkboxLabel}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={editingEmailTemplate.isDefault}
                              onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, isDefault: e.target.checked })}
                            />
                            <span>Set as Default template for this category</span>
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>Status:</span>
                            <select 
                              className={styles.select}
                              style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                              value={editingEmailTemplate.status}
                              onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, status: e.target.value })}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Draft">Draft</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className={styles.modalFooter}>
                        <button 
                          type="button" 
                          className={styles.btnSecondary} 
                          onClick={() => setEditingEmailTemplate(null)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className={styles.btnPrimary}>
                          <Save size={14} />
                          <span>Save Template</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Email Template Live Preview Modal */}
              {previewingEmailTemplate && (
                <div className={styles.modalOverlay} onClick={() => setPreviewingEmailTemplate(null)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>
                        Email Preview: {previewingEmailTemplate.name}
                      </h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setPreviewingEmailTemplate(null)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className={styles.modalBody}>
                      {/* Email Client Header Preview */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <strong style={{ color: '#64748b' }}>From:</strong> <span>NovaSpark HRMS &lt;notifications@novasparkhrms.com&gt;</span>
                        </div>
                        <div>
                          <strong style={{ color: '#64748b' }}>To:</strong> <span>Rahul Kumar &lt;rahul.kumar@employee.com&gt;</span>
                        </div>
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                          <strong style={{ color: '#0f172a' }}>Subject: </strong> 
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>
                            {renderPlaceholders(previewingEmailTemplate.subject)}
                          </span>
                        </div>
                      </div>

                      {/* Rendered Email Body */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', fontSize: '13px', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', minHeight: '180px' }}>
                        {renderPlaceholders(previewingEmailTemplate.body)}
                      </div>
                    </div>

                    <div className={styles.modalFooter}>
                      <button 
                        type="button" 
                        className={styles.btnPrimary} 
                        onClick={() => setPreviewingEmailTemplate(null)}
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

export default Templates;
