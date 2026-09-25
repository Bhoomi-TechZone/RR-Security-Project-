import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  SlidersHorizontal, UserCheck, ShieldCheck, Mail, Bell, 
  GitMerge, CheckCircle2, AlertCircle, Save, RotateCcw, 
  Send, Eye, EyeOff, Plus, Trash2, ArrowUp, ArrowDown, 
  ArrowRight, Info, ShieldAlert, Sparkles, X, Check
} from 'lucide-react';
import styles from './Preferences.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';

// Initial Mock data
import { 
  mockEmployeePortalConfig, 
  mockReportingManagerConfig, 
  mockEmailConfig, 
  mockNotificationConfig, 
  mockApprovalConfig, 
  APPROVER_ROLES 
} from '../../data/preferencesData';

const TABS = [
  { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
  { id: 'employee-portal', label: 'Employee Portal', icon: UserCheck },
  { id: 'reporting-manager', label: 'Reporting Manager Permissions', icon: ShieldCheck },
  { id: 'email', label: 'Email Settings', icon: Mail },
  { id: 'notifications', label: 'Notification Settings', icon: Bell },
  { id: 'approvals', label: 'Approval Settings', icon: GitMerge }
];

function Preferences() {
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

  // 1. Employee Portal State
  const [employeePortal, setEmployeePortal] = useState(() => {
    const saved = localStorage.getItem('novaspark_preferences_employee_portal');
    return saved ? JSON.parse(saved) : mockEmployeePortalConfig;
  });

  // 2. Reporting Manager Permissions State
  const [reportingManager, setReportingManager] = useState(() => {
    const saved = localStorage.getItem('novaspark_preferences_reporting_manager');
    return saved ? JSON.parse(saved) : mockReportingManagerConfig;
  });

  // 3. Email Settings State
  const [emailConfig, setEmailConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_preferences_email');
    return saved ? JSON.parse(saved) : mockEmailConfig;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // 4. Notification Settings State
  const [notificationConfig, setNotificationConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_preferences_notifications');
    return saved ? JSON.parse(saved) : mockNotificationConfig;
  });

  // 5. Approval Settings State
  const [approvalConfig, setApprovalConfig] = useState(() => {
    const saved = localStorage.getItem('novaspark_preferences_approvals');
    return saved ? JSON.parse(saved) : mockApprovalConfig;
  });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Reset Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // --- SAVE HANDLERS ---
  const saveEmployeePortal = () => {
    const updated = { ...employeePortal, lastUpdated: new Date().toLocaleString() };
    setEmployeePortal(updated);
    localStorage.setItem('novaspark_preferences_employee_portal', JSON.stringify(updated));
    showToast('Employee Portal preferences saved successfully!');
  };

  const resetEmployeePortal = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Employee Portal Settings?',
      message: 'This will revert Employee Portal preferences to system defaults.',
      onConfirm: () => {
        setEmployeePortal(mockEmployeePortalConfig);
        localStorage.setItem('novaspark_preferences_employee_portal', JSON.stringify(mockEmployeePortalConfig));
        showToast('Employee Portal preferences reset to default.', 'info');
      }
    });
  };

  const saveReportingManager = () => {
    const updated = { ...reportingManager, lastUpdated: new Date().toLocaleString() };
    setReportingManager(updated);
    localStorage.setItem('novaspark_preferences_reporting_manager', JSON.stringify(updated));
    showToast('Reporting Manager permissions saved successfully!');
  };

  const resetReportingManager = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Reporting Manager Permissions?',
      message: 'This will revert manager default permissions to system defaults.',
      onConfirm: () => {
        setReportingManager(mockReportingManagerConfig);
        localStorage.setItem('novaspark_preferences_reporting_manager', JSON.stringify(mockReportingManagerConfig));
        showToast('Reporting Manager permissions reset to default.', 'info');
      }
    });
  };

  const saveEmailConfig = (e) => {
    if (e) e.preventDefault();
    if (!emailConfig.smtpHost || !emailConfig.smtpPort || !emailConfig.fromEmail) {
      showToast('Please fill all required SMTP fields.', 'error');
      return;
    }
    const updated = { ...emailConfig, lastUpdated: new Date().toLocaleString() };
    setEmailConfig(updated);
    localStorage.setItem('novaspark_preferences_email', JSON.stringify(updated));
    showToast('Email & SMTP settings saved successfully!');
  };

  const resetEmailConfig = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Email Configuration?',
      message: 'This will reset SMTP server and sender settings to defaults.',
      onConfirm: () => {
        setEmailConfig(mockEmailConfig);
        localStorage.setItem('novaspark_preferences_email', JSON.stringify(mockEmailConfig));
        showToast('Email settings reset to default.', 'info');
      }
    });
  };

  const handleSendTestEmail = (e) => {
    e.preventDefault();
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      setIsTestEmailOpen(false);
      setTestEmailRecipient('');
      showToast(`Test email successfully sent to ${testEmailRecipient}!`);
    }, 1200);
  };

  const saveNotificationConfig = () => {
    const updated = { ...notificationConfig, lastUpdated: new Date().toLocaleString() };
    setNotificationConfig(updated);
    localStorage.setItem('novaspark_preferences_notifications', JSON.stringify(updated));
    showToast('Notification settings saved successfully!');
  };

  const resetNotificationConfig = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Notification Settings?',
      message: 'This will reset notification events and channels to system defaults.',
      onConfirm: () => {
        setNotificationConfig(mockNotificationConfig);
        localStorage.setItem('novaspark_preferences_notifications', JSON.stringify(mockNotificationConfig));
        showToast('Notification settings reset to default.', 'info');
      }
    });
  };

  const saveApprovalConfig = () => {
    const updated = { ...approvalConfig, lastUpdated: new Date().toLocaleString() };
    setApprovalConfig(updated);
    localStorage.setItem('novaspark_preferences_approvals', JSON.stringify(updated));
    showToast('Approval workflow chains saved successfully!');
  };

  const resetApprovalConfig = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Approval Workflows?',
      message: 'This will reset all module approval hierarchies to system defaults.',
      onConfirm: () => {
        setApprovalConfig(mockApprovalConfig);
        localStorage.setItem('novaspark_preferences_approvals', JSON.stringify(mockApprovalConfig));
        showToast('Approval workflows reset to default.', 'info');
      }
    });
  };

  // --- APPROVAL LEVEL MUTATION HELPERS ---
  const handleAddApprovalLevel = (moduleKey) => {
    const current = approvalConfig[moduleKey];
    const newLvlNum = current.levels.length + 1;
    const newLevel = {
      id: `lvl-${Date.now()}`,
      level: newLvlNum,
      role: APPROVER_ROLES[0],
      isMandatory: true
    };
    setApprovalConfig({
      ...approvalConfig,
      [moduleKey]: {
        ...current,
        levels: [...current.levels, newLevel]
      }
    });
  };

  const handleRemoveApprovalLevel = (moduleKey, index) => {
    const current = approvalConfig[moduleKey];
    if (current.levels.length <= 1) {
      showToast('At least one approval level is required.', 'error');
      return;
    }
    const updatedLevels = current.levels.filter((_, idx) => idx !== index).map((lvl, idx) => ({
      ...lvl,
      level: idx + 1
    }));
    setApprovalConfig({
      ...approvalConfig,
      [moduleKey]: {
        ...current,
        levels: updatedLevels
      }
    });
  };

  const handleMoveApprovalLevel = (moduleKey, index, direction) => {
    const current = approvalConfig[moduleKey];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.levels.length) return;

    const newLevels = [...current.levels];
    const [movedItem] = newLevels.splice(index, 1);
    newLevels.splice(targetIndex, 0, movedItem);

    const reindexed = newLevels.map((lvl, idx) => ({
      ...lvl,
      level: idx + 1
    }));

    setApprovalConfig({
      ...approvalConfig,
      [moduleKey]: {
        ...current,
        levels: reindexed
      }
    });
  };

  const handleLevelRoleChange = (moduleKey, index, newRole) => {
    const current = approvalConfig[moduleKey];
    const updatedLevels = [...current.levels];
    updatedLevels[index] = { ...updatedLevels[index], role: newRole };
    setApprovalConfig({
      ...approvalConfig,
      [moduleKey]: {
        ...current,
        levels: updatedLevels
      }
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
          confirmText="Confirm Reset"
          confirmType="danger"
        />

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <button 
                type="button" 
                className={styles.breadcrumbLink}
                onClick={() => navigate('/admin/dashboard')}
              >
                Admin
              </button>
              <span>/</span>
              <button 
                type="button" 
                className={styles.breadcrumbLink}
                onClick={() => openOrganisationSettingsModal()}
              >
                Organisation Settings
              </button>
              <span>/</span>
              <span>Preferences</span>
            </nav>
            <h1 className={styles.pageTitle}>Preferences</h1>
            <p className={styles.pageSubtitle}>
              Configure employee portal access, reporting manager permissions, notifications, email and approval workflows.
            </p>
          </div>
        </header>

        {/* Tabs Bar with Scroller */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsScroller}>
            {(isFromOrgSettings ? TABS.filter(t => t.id === activeTab) : TABS).map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
                  onClick={isFromOrgSettings ? undefined : () => handleTabChange(tab.id)}
                  style={isFromOrgSettings ? { pointerEvents: 'none', cursor: 'default' } : undefined}
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
              
              {/* Card 1: Employee Portal */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Employee Portal</h3>
                    <StatusBadge status={employeePortal.enabled ? 'Active' : 'Inactive'} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Control organisation-level self-service features for all active workforce members.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Portal Access:</span>
                    <span className={styles.metaValue}>{employeePortal.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Active Features:</span>
                    <span className={styles.metaValue}>
                      {[
                        employeePortal.allowDashboard,
                        employeePortal.allowAttendance,
                        employeePortal.allowApplyLeave,
                        employeePortal.allowLeaveBalance,
                        employeePortal.allowOvertime,
                        employeePortal.allowSalarySlips,
                        employeePortal.allowNotifications,
                        employeePortal.allowProfile
                      ].filter(Boolean).length} / 8 Allowed
                    </span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('employee-portal')}
                  >
                    <span>Configure Portal</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Reporting Manager Permissions */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Reporting Manager Permissions</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Organisation-level default permissions and operational restrictions for managers.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Active Permissions:</span>
                    <span className={styles.metaValue}>
                      {[
                        reportingManager.viewAssignedEmployees,
                        reportingManager.viewEmployeeAttendance,
                        reportingManager.approveLeave,
                        reportingManager.approveOvertime,
                        reportingManager.viewOvertime,
                        reportingManager.viewEmployeeDocuments,
                        reportingManager.viewEmployeeReports,
                        reportingManager.viewAssignedSiteBranchEmployees
                      ].filter(Boolean).length} / 8 Enabled
                    </span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Attendance Regularization:</span>
                    <span className={styles.metaValue}>{reportingManager.allowAttendanceRegularization ? 'Allowed' : 'Restricted'}</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('reporting-manager')}
                  >
                    <span>Configure Manager Roles</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Email Settings */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Email Settings</h3>
                    <StatusBadge status={emailConfig.enabled ? 'Active' : 'Inactive'} />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Configure SMTP mail server credentials, encryption protocol and sender identities.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>SMTP Server:</span>
                    <span className={styles.metaValue}>{emailConfig.smtpHost}:{emailConfig.smtpPort}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Encryption:</span>
                    <span className={styles.metaValue}>{emailConfig.encryption}</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('email')}
                  >
                    <span>Configure SMTP</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 4: Notification Settings */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Notification Settings</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Manage automated event notifications across in-app activity bell and email dispatch.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Active Channels:</span>
                    <span className={styles.metaValue}>
                      {[notificationConfig.channels.inApp && 'In-App', notificationConfig.channels.email && 'Email'].filter(Boolean).join(' + ')}
                    </span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Configured Events:</span>
                    <span className={styles.metaValue}>{Object.keys(notificationConfig.events).length} Event Rules</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('notifications')}
                  >
                    <span>Configure Alerts</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 5: Approval Settings */}
              <div className={styles.overviewCard}>
                <div>
                  <div className={styles.overviewCardHeader}>
                    <h3 className={styles.overviewCardTitle}>Approval Settings</h3>
                    <StatusBadge status="Active" />
                  </div>
                  <p className={styles.overviewCardDesc}>
                    Define single & multi-level workflow escalation chains for leave, OT and reimbursements.
                  </p>
                </div>
                <div className={styles.cardMetaSummary}>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Reimbursement Chain:</span>
                    <span className={styles.metaValue}>{approvalConfig.reimbursement.levels.map(l => l.role).join(' → ')}</span>
                  </div>
                  <div className={styles.metaSummaryRow}>
                    <span className={styles.metaLabel}>Leave Workflow:</span>
                    <span className={styles.metaValue}>{approvalConfig.leave.levels.length} Tier Hierarchy</span>
                  </div>
                </div>
                <div className={styles.overviewCardFooter}>
                  <button 
                    type="button" 
                    className={styles.btnOutlinePrimary}
                    onClick={() => handleTabChange('approvals')}
                  >
                    <span>Configure Workflows</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 2. EMPLOYEE PORTAL CONFIGURATION TAB */}
          {activeTab === 'employee-portal' && (
            <div className={styles.configCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleWrap}>
                  <h2 className={styles.cardTitle}>Employee Portal Configuration</h2>
                  <p className={styles.cardSubtitle}>
                    Enable or disable the employee self-service portal and specify available features for workforce members.
                  </p>
                </div>
                <StatusBadge status={employeePortal.enabled ? 'Active' : 'Inactive'} />
              </div>

              <div className={styles.cardBody}>
                {/* Master Portal Switch */}
                <div className={styles.toggleRow}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleTitle}>Enable Employee Portal Access</span>
                    <span className={styles.toggleDesc}>
                      Master toggle to permit staff logins into self-service dashboards and mobile panel.
                    </span>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={employeePortal.enabled} 
                      onChange={(e) => setEmployeePortal({ ...employeePortal, enabled: e.target.checked })} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '20px 0 12px', color: '#0f172a' }}>
                  Allow Employees To:
                </h3>

                {/* 8 Feature Checkboxes */}
                <div className={styles.checklistGrid}>
                  
                  <label className={`${styles.checklistItem} ${employeePortal.allowDashboard ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowDashboard}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowDashboard: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Dashboard</span>
                      <span className={styles.checklistDesc}>Access self-service summary metrics, quick attendance & shift status.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowAttendance ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowAttendance}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowAttendance: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Attendance</span>
                      <span className={styles.checklistDesc}>View monthly punch logs, daily work hours and check-in timeline.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowApplyLeave ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowApplyLeave}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowApplyLeave: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>Apply Leave</span>
                      <span className={styles.checklistDesc}>Submit new leave requests with reason and attachments for supervisor review.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowLeaveBalance ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowLeaveBalance}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowLeaveBalance: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Leave Balance</span>
                      <span className={styles.checklistDesc}>Track available Casual, Sick, Paid and Earned leave quotas.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowOvertime ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowOvertime}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowOvertime: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Overtime</span>
                      <span className={styles.checklistDesc}>Track extra duty hours, compensatory off credits & OT claims.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowSalarySlips ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowSalarySlips}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowSalarySlips: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Salary Slips</span>
                      <span className={styles.checklistDesc}>View and download monthly generated payslips in secure PDF format.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowNotifications ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowNotifications}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowNotifications: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Notifications</span>
                      <span className={styles.checklistDesc}>Receive organisation bulletins, leave updates and system broadcasts.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${employeePortal.allowProfile ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={employeePortal.allowProfile}
                      disabled={!employeePortal.enabled}
                      onChange={(e) => setEmployeePortal({ ...employeePortal, allowProfile: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Profile</span>
                      <span className={styles.checklistDesc}>View personal details, bank data, statutory numbers and assigned post.</span>
                    </div>
                  </label>

                </div>

                {/* Information Callout */}
                <div className={styles.calloutBox}>
                  <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Organisation Scope Note:</strong> These preferences govern organization-wide feature availability.
                    Specific role and module permissions continue to be strictly enforced via <em>Role & Permission Management</em>.
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                  Last updated: <strong>{employeePortal.lastUpdated || 'Not configured'}</strong>
                </div>
                <div className={styles.footerActions}>
                  <button type="button" className={styles.btnSecondary} onClick={resetEmployeePortal}>
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button type="button" className={styles.btnPrimary} onClick={saveEmployeePortal}>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. REPORTING MANAGER PERMISSIONS TAB */}
          {activeTab === 'reporting-manager' && (
            <div className={styles.configCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleWrap}>
                  <h2 className={styles.cardTitle}>Reporting Manager Permissions</h2>
                  <p className={styles.cardSubtitle}>
                    Configure default organization-level operational boundaries and authorities for supervisors and reporting managers.
                  </p>
                </div>
                <StatusBadge status="Active" />
              </div>

              <div className={styles.cardBody}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px', color: '#0f172a' }}>
                  Manager Default Authorities:
                </h3>

                {/* 8 Reporting Manager Checkboxes */}
                <div className={styles.checklistGrid}>
                  
                  <label className={`${styles.checklistItem} ${reportingManager.viewAssignedEmployees ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.viewAssignedEmployees}
                      onChange={(e) => setReportingManager({ ...reportingManager, viewAssignedEmployees: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Assigned Employees</span>
                      <span className={styles.checklistDesc}>Permit managers to view list of direct reports and assigned team roster.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.viewEmployeeAttendance ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.viewEmployeeAttendance}
                      onChange={(e) => setReportingManager({ ...reportingManager, viewEmployeeAttendance: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Employee Attendance</span>
                      <span className={styles.checklistDesc}>Inspect real-time daily check-ins, punch anomalies & muster roll.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.approveLeave ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.approveLeave}
                      onChange={(e) => setReportingManager({ ...reportingManager, approveLeave: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>Approve Leave</span>
                      <span className={styles.checklistDesc}>Authorize managers to review, approve or reject subordinates' leave requests.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.approveOvertime ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.approveOvertime}
                      onChange={(e) => setReportingManager({ ...reportingManager, approveOvertime: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>Approve Overtime</span>
                      <span className={styles.checklistDesc}>Sanction extra hours, extended shift assignments & OT claim payout.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.viewOvertime ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.viewOvertime}
                      onChange={(e) => setReportingManager({ ...reportingManager, viewOvertime: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Overtime</span>
                      <span className={styles.checklistDesc}>View overtime logs, comp-off accruals and historical OT analytics.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.viewEmployeeDocuments ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.viewEmployeeDocuments}
                      onChange={(e) => setReportingManager({ ...reportingManager, viewEmployeeDocuments: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Employee Documents</span>
                      <span className={styles.checklistDesc}>Permit inspection of ID proofs, certificates & compliance files.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.viewEmployeeReports ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.viewEmployeeReports}
                      onChange={(e) => setReportingManager({ ...reportingManager, viewEmployeeReports: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Employee Reports</span>
                      <span className={styles.checklistDesc}>Generate team performance, attendance compliance & duty summary reports.</span>
                    </div>
                  </label>

                  <label className={`${styles.checklistItem} ${reportingManager.viewAssignedSiteBranchEmployees ? styles.checklistItemActive : ''}`}>
                    <input 
                      type="checkbox" 
                      className={styles.checkboxInput}
                      checked={reportingManager.viewAssignedSiteBranchEmployees}
                      onChange={(e) => setReportingManager({ ...reportingManager, viewAssignedSiteBranchEmployees: e.target.checked })}
                    />
                    <div className={styles.checklistText}>
                      <span className={styles.checklistLabel}>View Assigned Site/Branch Employees</span>
                      <span className={styles.checklistDesc}>Grant site-wide employee visibility when stationed as site supervisor.</span>
                    </div>
                  </label>

                </div>

                {/* Clarification Callout */}
                <div className={styles.calloutBox}>
                  <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Permission Matrix Formula:</strong> <code>Role Permission + Organisation Preference = Effective Access</code>.
                    This configuration sets organisation-level boundaries without altering custom granular roles in <em>Role & Permission Management</em>.
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                  Last updated: <strong>{reportingManager.lastUpdated || 'Not configured'}</strong>
                </div>
                <div className={styles.footerActions}>
                  <button type="button" className={styles.btnSecondary} onClick={resetReportingManager}>
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button type="button" className={styles.btnPrimary} onClick={saveReportingManager}>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. EMAIL SETTINGS TAB */}
          {activeTab === 'email' && (
            <div className={styles.configCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleWrap}>
                  <h2 className={styles.cardTitle}>Email & SMTP Configuration</h2>
                  <p className={styles.cardSubtitle}>
                    Configure mail server host, port, security encryption and outbound sender profile for system notifications.
                  </p>
                </div>
                <StatusBadge status={emailConfig.enabled ? 'Active' : 'Inactive'} />
              </div>

              <form onSubmit={saveEmailConfig}>
                <div className={styles.cardBody}>
                  {/* Master Email Switch */}
                  <div className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Enable Email Notifications</span>
                      <span className={styles.toggleDesc}>
                        Global switch to enable outgoing emails for payslips, leaves, approvals and alerts.
                      </span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={emailConfig.enabled} 
                        onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        SMTP Host <span className={styles.requiredStar}>*</span>
                      </label>
                      <input 
                        type="text" 
                        className={styles.input}
                        placeholder="e.g. smtp.gmail.com or mail.domain.com"
                        value={emailConfig.smtpHost}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        required
                      />
                      <span className={styles.helperText}>Outgoing mail server hostname or IP</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        SMTP Port <span className={styles.requiredStar}>*</span>
                      </label>
                      <input 
                        type="text" 
                        className={styles.input}
                        placeholder="e.g. 587 or 465"
                        value={emailConfig.smtpPort}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                        required
                      />
                      <span className={styles.helperText}>Typical ports: 587 (TLS), 465 (SSL), 25 (None)</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Encryption Protocol <span className={styles.requiredStar}>*</span>
                      </label>
                      <select 
                        className={styles.select}
                        value={emailConfig.encryption}
                        onChange={(e) => setEmailConfig({ ...emailConfig, encryption: e.target.value })}
                      >
                        <option value="TLS">TLS (Recommended)</option>
                        <option value="SSL">SSL</option>
                        <option value="None">None (Insecure)</option>
                      </select>
                      <span className={styles.helperText}>Transport layer security for outbound socket</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        SMTP Username
                      </label>
                      <input 
                        type="text" 
                        className={styles.input}
                        placeholder="e.g. notifications@domain.com"
                        value={emailConfig.smtpUsername}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
                      />
                      <span className={styles.helperText}>Authentication account identifier</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        SMTP Password <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={styles.passwordInputWrapper}>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          className={styles.input}
                          placeholder="••••••••••••••••"
                          value={emailConfig.smtpPassword}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                          required
                        />
                        <button 
                          type="button" 
                          className={styles.passwordToggleBtn}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <span className={styles.helperText}>Encrypted and securely stored in environment</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        From Email Address <span className={styles.requiredStar}>*</span>
                      </label>
                      <input 
                        type="email" 
                        className={styles.input}
                        placeholder="e.g. noreply@novasparkhrms.com"
                        value={emailConfig.fromEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                        required
                      />
                      <span className={styles.helperText}>Public sender email displayed to recipients</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        From Name <span className={styles.requiredStar}>*</span>
                      </label>
                      <input 
                        type="text" 
                        className={styles.input}
                        placeholder="e.g. NovaSpark HRMS"
                        value={emailConfig.fromName}
                        onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                        required
                      />
                      <span className={styles.helperText}>Friendly sender name header</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    Last updated: <strong>{emailConfig.lastUpdated || 'Not configured'}</strong>
                  </div>
                  <div className={styles.footerActions}>
                    <button 
                      type="button" 
                      className={styles.btnSecondary} 
                      onClick={() => setIsTestEmailOpen(true)}
                    >
                      <Send size={14} />
                      <span>Test Email</span>
                    </button>
                    <button type="button" className={styles.btnSecondary} onClick={resetEmailConfig}>
                      <RotateCcw size={14} />
                      <span>Reset</span>
                    </button>
                    <button type="submit" className={styles.btnPrimary}>
                      <Save size={14} />
                      <span>Save Settings</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Test Email Modal */}
              {isTestEmailOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsTestEmailOpen(false)}>
                  <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <h3 className={styles.modalTitle}>Send Test Email</h3>
                      <button 
                        type="button" 
                        className={styles.iconBtn} 
                        onClick={() => setIsTestEmailOpen(false)}
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <form onSubmit={handleSendTestEmail}>
                      <div className={styles.modalBody}>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                          Send a diagnostic verification email via configured SMTP server (<code>{emailConfig.smtpHost}:{emailConfig.smtpPort}</code>) to confirm connection handshake.
                        </p>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            Recipient Email Address <span className={styles.requiredStar}>*</span>
                          </label>
                          <input 
                            type="email" 
                            className={styles.input}
                            placeholder="e.g. admin@company.com"
                            value={testEmailRecipient}
                            onChange={(e) => setTestEmailRecipient(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className={styles.modalFooter}>
                        <button 
                          type="button" 
                          className={styles.btnSecondary} 
                          onClick={() => setIsTestEmailOpen(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className={styles.btnPrimary} 
                          disabled={isSendingTest}
                        >
                          {isSendingTest ? 'Sending Verification...' : 'Send Test Mail'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. NOTIFICATION SETTINGS TAB */}
          {activeTab === 'notifications' && (
            <div className={styles.configCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleWrap}>
                  <h2 className={styles.cardTitle}>Notification Settings</h2>
                  <p className={styles.cardSubtitle}>
                    Manage organisation-wide notification preferences across activity channels and functional event triggers.
                  </p>
                </div>
                <StatusBadge status="Active" />
              </div>

              <div className={styles.cardBody}>
                {/* Global Channel Switches */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                  <div className={styles.toggleRow} style={{ margin: 0 }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>In-App Notifications</span>
                      <span className={styles.toggleDesc}>Show alerts in top header bell and notifications drawer.</span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={notificationConfig.channels.inApp} 
                        onChange={(e) => setNotificationConfig({
                          ...notificationConfig,
                          channels: { ...notificationConfig.channels, inApp: e.target.checked }
                        })} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleRow} style={{ margin: 0 }}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleTitle}>Email Notifications</span>
                      <span className={styles.toggleDesc}>Dispatch transactional event emails to recipients.</span>
                    </div>
                    <label className={styles.switch}>
                      <input 
                        type="checkbox" 
                        checked={notificationConfig.channels.email} 
                        onChange={(e) => setNotificationConfig({
                          ...notificationConfig,
                          channels: { ...notificationConfig.channels, email: e.target.checked }
                        })} 
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 14px', color: '#0f172a' }}>
                  Event Notification Matrix:
                </h3>

                {/* Matrix Table */}
                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <table className={styles.matrixTable}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: '220px' }}>Event Category</th>
                        <th>Trigger Description</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>In-App</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(notificationConfig.events).map(([key, event]) => (
                        <tr key={key}>
                          <td>
                            <strong style={{ color: '#0f172a' }}>{event.name}</strong>
                          </td>
                          <td style={{ color: '#64748b', fontSize: '12.5px' }}>
                            {event.description}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={event.inApp}
                              disabled={!notificationConfig.channels.inApp}
                              onChange={(e) => {
                                setNotificationConfig({
                                  ...notificationConfig,
                                  events: {
                                    ...notificationConfig.events,
                                    [key]: { ...event, inApp: e.target.checked }
                                  }
                                });
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              className={styles.checkboxInput}
                              checked={event.email}
                              disabled={!notificationConfig.channels.email}
                              onChange={(e) => {
                                setNotificationConfig({
                                  ...notificationConfig,
                                  events: {
                                    ...notificationConfig.events,
                                    [key]: { ...event, email: e.target.checked }
                                  }
                                });
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                  Last updated: <strong>{notificationConfig.lastUpdated || 'Not configured'}</strong>
                </div>
                <div className={styles.footerActions}>
                  <button type="button" className={styles.btnSecondary} onClick={resetNotificationConfig}>
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button type="button" className={styles.btnPrimary} onClick={saveNotificationConfig}>
                    <Save size={14} />
                    <span>Save Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. APPROVAL SETTINGS TAB */}
          {activeTab === 'approvals' && (
            <div className={styles.configCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleWrap}>
                  <h2 className={styles.cardTitle}>Approval Workflow Chains</h2>
                  <p className={styles.cardSubtitle}>
                    Configure dynamic single and multi-level approval hierarchies for Leave, Overtime, Reimbursements and Employee Requests.
                  </p>
                </div>
                <StatusBadge status="Active" />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.workflowContainer}>

                  {/* 1. REIMBURSEMENT WORKFLOW (CLIENT HIGHLIGHTED) */}
                  <div className={styles.moduleWorkflowCard} style={{ borderLeft: '4px solid #4f46e5' }}>
                    <div className={styles.workflowHeader}>
                      <div className={styles.workflowTitleWrap}>
                        <span className={styles.moduleBadge} style={{ background: '#e0e7ff', color: '#4338ca' }}>
                          Client Workflow
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          Reimbursement Workflow
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select 
                          className={styles.select}
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                          value={approvalConfig.reimbursement.type}
                          onChange={(e) => setApprovalConfig({
                            ...approvalConfig,
                            reimbursement: { ...approvalConfig.reimbursement, type: e.target.value }
                          })}
                        >
                          <option value="single">Single Level</option>
                          <option value="multi">Multi Level Approval</option>
                        </select>
                        <button 
                          type="button" 
                          className={styles.btnOutlinePrimary}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleAddApprovalLevel('reimbursement')}
                        >
                          <Plus size={13} />
                          <span>Add Level</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Configured Workflow Chain: <code>Employee → {approvalConfig.reimbursement.levels.map(l => l.role).join(' → ')}</code>
                    </div>

                    {/* Levels List */}
                    <div className={styles.levelsChain}>
                      {approvalConfig.reimbursement.levels.map((lvl, index) => (
                        <div key={lvl.id || index} className={styles.levelRow}>
                          <span className={styles.levelBadge}>{lvl.level}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', minWidth: '60px' }}>
                            Level {lvl.level}:
                          </span>
                          <select 
                            className={`${styles.select} ${styles.levelSelect}`}
                            value={lvl.role}
                            onChange={(e) => handleLevelRoleChange('reimbursement', index, e.target.value)}
                          >
                            {APPROVER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <div className={styles.levelActions}>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === 0}
                              onClick={() => handleMoveApprovalLevel('reimbursement', index, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === approvalConfig.reimbursement.levels.length - 1}
                              onClick={() => handleMoveApprovalLevel('reimbursement', index, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              disabled={approvalConfig.reimbursement.levels.length <= 1}
                              onClick={() => handleRemoveApprovalLevel('reimbursement', index)}
                              title="Remove Level"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. LEAVE WORKFLOW */}
                  <div className={styles.moduleWorkflowCard}>
                    <div className={styles.workflowHeader}>
                      <div className={styles.workflowTitleWrap}>
                        <span className={styles.moduleBadge} style={{ background: '#ecfdf5', color: '#047857' }}>
                          HR Module
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          Leave Approval Workflow
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select 
                          className={styles.select}
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                          value={approvalConfig.leave.type}
                          onChange={(e) => setApprovalConfig({
                            ...approvalConfig,
                            leave: { ...approvalConfig.leave, type: e.target.value }
                          })}
                        >
                          <option value="single">Single Level</option>
                          <option value="multi">Multi Level Approval</option>
                        </select>
                        <button 
                          type="button" 
                          className={styles.btnOutlinePrimary}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleAddApprovalLevel('leave')}
                        >
                          <Plus size={13} />
                          <span>Add Level</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.levelsChain}>
                      {approvalConfig.leave.levels.map((lvl, index) => (
                        <div key={lvl.id || index} className={styles.levelRow}>
                          <span className={styles.levelBadge}>{lvl.level}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', minWidth: '60px' }}>
                            Level {lvl.level}:
                          </span>
                          <select 
                            className={`${styles.select} ${styles.levelSelect}`}
                            value={lvl.role}
                            onChange={(e) => handleLevelRoleChange('leave', index, e.target.value)}
                          >
                            {APPROVER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <div className={styles.levelActions}>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === 0}
                              onClick={() => handleMoveApprovalLevel('leave', index, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === approvalConfig.leave.levels.length - 1}
                              onClick={() => handleMoveApprovalLevel('leave', index, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              disabled={approvalConfig.leave.levels.length <= 1}
                              onClick={() => handleRemoveApprovalLevel('leave', index)}
                              title="Remove Level"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. OVERTIME WORKFLOW */}
                  <div className={styles.moduleWorkflowCard}>
                    <div className={styles.workflowHeader}>
                      <div className={styles.workflowTitleWrap}>
                        <span className={styles.moduleBadge} style={{ background: '#fef3c7', color: '#b45309' }}>
                          Operations
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          Overtime Approval Workflow
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select 
                          className={styles.select}
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                          value={approvalConfig.overtime.type}
                          onChange={(e) => setApprovalConfig({
                            ...approvalConfig,
                            overtime: { ...approvalConfig.overtime, type: e.target.value }
                          })}
                        >
                          <option value="single">Single Level</option>
                          <option value="multi">Multi Level Approval</option>
                        </select>
                        <button 
                          type="button" 
                          className={styles.btnOutlinePrimary}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleAddApprovalLevel('overtime')}
                        >
                          <Plus size={13} />
                          <span>Add Level</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.levelsChain}>
                      {approvalConfig.overtime.levels.map((lvl, index) => (
                        <div key={lvl.id || index} className={styles.levelRow}>
                          <span className={styles.levelBadge}>{lvl.level}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', minWidth: '60px' }}>
                            Level {lvl.level}:
                          </span>
                          <select 
                            className={`${styles.select} ${styles.levelSelect}`}
                            value={lvl.role}
                            onChange={(e) => handleLevelRoleChange('overtime', index, e.target.value)}
                          >
                            {APPROVER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <div className={styles.levelActions}>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === 0}
                              onClick={() => handleMoveApprovalLevel('overtime', index, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === approvalConfig.overtime.levels.length - 1}
                              onClick={() => handleMoveApprovalLevel('overtime', index, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              disabled={approvalConfig.overtime.levels.length <= 1}
                              onClick={() => handleRemoveApprovalLevel('overtime', index)}
                              title="Remove Level"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. EMPLOYEE REQUESTS WORKFLOW */}
                  <div className={styles.moduleWorkflowCard}>
                    <div className={styles.workflowHeader}>
                      <div className={styles.workflowTitleWrap}>
                        <span className={styles.moduleBadge} style={{ background: '#fce7f3', color: '#be185d' }}>
                          General
                        </span>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          Employee-Related Requests (Profile & Docs)
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select 
                          className={styles.select}
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                          value={approvalConfig.employeeRequests.type}
                          onChange={(e) => setApprovalConfig({
                            ...approvalConfig,
                            employeeRequests: { ...approvalConfig.employeeRequests, type: e.target.value }
                          })}
                        >
                          <option value="single">Single Level</option>
                          <option value="multi">Multi Level Approval</option>
                        </select>
                        <button 
                          type="button" 
                          className={styles.btnOutlinePrimary}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleAddApprovalLevel('employeeRequests')}
                        >
                          <Plus size={13} />
                          <span>Add Level</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.levelsChain}>
                      {approvalConfig.employeeRequests.levels.map((lvl, index) => (
                        <div key={lvl.id || index} className={styles.levelRow}>
                          <span className={styles.levelBadge}>{lvl.level}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', minWidth: '60px' }}>
                            Level {lvl.level}:
                          </span>
                          <select 
                            className={`${styles.select} ${styles.levelSelect}`}
                            value={lvl.role}
                            onChange={(e) => handleLevelRoleChange('employeeRequests', index, e.target.value)}
                          >
                            {APPROVER_ROLES.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <div className={styles.levelActions}>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === 0}
                              onClick={() => handleMoveApprovalLevel('employeeRequests', index, -1)}
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={styles.iconBtn} 
                              disabled={index === approvalConfig.employeeRequests.levels.length - 1}
                              onClick={() => handleMoveApprovalLevel('employeeRequests', index, 1)}
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                            <button 
                              type="button" 
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              disabled={approvalConfig.employeeRequests.levels.length <= 1}
                              onClick={() => handleRemoveApprovalLevel('employeeRequests', index)}
                              title="Remove Level"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.footerLeft}>
                  Last updated: <strong>{approvalConfig.lastUpdated || 'Not configured'}</strong>
                </div>
                <div className={styles.footerActions}>
                  <button type="button" className={styles.btnSecondary} onClick={resetApprovalConfig}>
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                  <button type="button" className={styles.btnPrimary} onClick={saveApprovalConfig}>
                    <Save size={14} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

export default Preferences;
