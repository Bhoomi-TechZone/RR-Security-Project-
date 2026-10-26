import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, Calendar, Clock, CalendarDays, Calculator, Plus, 
  Search, Filter, CheckCircle2, AlertCircle, Layers, ArrowUpRight,
  MoreVertical, Edit2, Eye, ToggleLeft, ToggleRight, Sparkles,
  Loader2, RefreshCw, ArrowLeft, ArrowRight, X, SlidersHorizontal
} from 'lucide-react';
import styles from './PayrollSetup.module.css';

import AdminLayout from '../../components/layout/AdminLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';

import PayGroupModal from '../../components/payrollSetup/PayGroupModal';
import PayGroupDetailsModal from '../../components/payrollSetup/PayGroupDetailsModal';
import PayScheduleModal from '../../components/payrollSetup/PayScheduleModal';
import PayCycleModal from '../../components/payrollSetup/PayCycleModal';
import PayDayModal from '../../components/payrollSetup/PayDayModal';

import { useCompany } from '../../context/CompanyContext';
import { payrollSetupService } from '../../services/payrollSetupService';
import { masterService } from '../../services/masterService';

const ITEMS_PER_PAGE = 8;

const TABS = [
  { id: 'pay-groups', label: 'Pay Groups', icon: DollarSign },
  { id: 'pay-schedules', label: 'Pay Schedules', icon: Calendar },
  { id: 'pay-cycles', label: 'Pay Cycles', icon: Clock },
  { id: 'pay-days', label: 'Pay Days', icon: CalendarDays },
  { id: 'calculation-methods', label: 'Salary Calculation Methods', icon: Calculator }
];

const SETUP_CATEGORIES = [
  { id: 'master-setup', label: 'Master Setup', route: '/admin/company-setup' },
  { id: 'payroll-setup', label: 'Payroll Setup', route: '/admin/payroll-setup' }
];

const ALL_SETUP_CATALOG = [
  {
    id: 'pay-groups',
    tab: 'pay-groups',
    title: 'Pay Groups',
    desc: 'Configure salary structures, payment frequencies, and assign employee groups to pay brackets.',
    icon: DollarSign,
    badge: 'Structure',
    iconColor: '#2563eb'
  },
  {
    id: 'salary-components',
    tab: 'salary-components',
    externalRoute: '/admin/masters?tab=salary-components',
    title: 'Salary Components',
    desc: 'Manage earnings, basic pay, HRA, standard allowances, reimbursements, and deduction rules.',
    icon: Layers,
    badge: 'Earnings & Deductions',
    iconColor: '#059669'
  },
  {
    id: 'pay-schedules',
    tab: 'pay-schedules',
    title: 'Pay Schedules',
    desc: 'Set up recurring disbursement frequency timelines such as Monthly, Bi-Weekly, and Weekly.',
    icon: Calendar,
    badge: 'Timeline',
    iconColor: '#0284c7'
  },
  {
    id: 'pay-cycles',
    tab: 'pay-cycles',
    title: 'Pay Cycles',
    desc: 'Define attendance cutoff bounds, calculation periods, and processing dates for payroll runs.',
    icon: Clock,
    badge: 'Cutoff',
    iconColor: '#7c3aed'
  },
  {
    id: 'pay-days',
    tab: 'pay-days',
    title: 'Pay Days',
    desc: 'Configure fixed payout dates, last working day of month, or custom disbursement rules.',
    icon: CalendarDays,
    badge: 'Disbursement',
    iconColor: '#d97706'
  },
  {
    id: 'calculation-methods',
    tab: 'calculation-methods',
    title: 'Salary Calculation Methods',
    desc: 'Define daily salary rate formulas using Calendar Days, Fixed Days, or Working Days basis.',
    icon: Calculator,
    badge: 'Formulas',
    iconColor: '#db2777'
  }
];

const TAB_LABELS = {
  'pay-groups': 'Pay Groups',
  'pay-schedules': 'Pay Schedules',
  'pay-cycles': 'Pay Cycles',
  'pay-days': 'Pay Days',
  'calculation-methods': 'Salary Calculation Methods'
};

function PayrollSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  const { company } = useCompany();
  const companyId = company?.companyId || company?.id || 'RRS8392014SEC';

  // Active Setup Tab & Explorer View
  const rawTab = searchParams.get('tab');
  const isExplorerView = !rawTab;
  const initialTab = rawTab || 'pay-groups';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [catalogSearch, setCatalogSearch] = useState('');
  const [explorerCategory, setExplorerCategory] = useState('payroll-setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('pay-groups');
    }
  }, [searchParams]);

  const handleOpenModule = (item) => {
    if (item.externalRoute) {
      navigate(item.externalRoute);
    } else {
      setActiveTab(item.tab);
      setSearchParams({ tab: item.tab });
    }
  };

  const handleBackToSetup = () => {
    navigate('/admin/company-setup?category=payroll-setup');
  };

  // MongoDB State Collections
  const [payGroups, setPayGroups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [payDays, setPayDays] = useState([]);
  const [calculationMethods, setCalculationMethods] = useState([]);
  const [salaryComponents, setSalaryComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Action Menu tracker
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);

  const [isPayDayModalOpen, setIsPayDayModalOpen] = useState(false);
  const [editingPayDay, setEditingPayDay] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: '',
    variant: 'danger',
    item: null,
    itemType: null,
    actionType: null // 'activate' | 'deactivate'
  });

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch all payroll setup data from MongoDB
  const fetchSetupData = useCallback(async () => {
    try {
      setLoading(true);
      const [setupData, componentsData] = await Promise.all([
        payrollSetupService.getPayrollSetup(companyId),
        masterService.getMasters('salary-components', companyId).catch(() => [])
      ]);

      if (setupData) {
        setPayGroups(setupData.payGroups || []);
        setSchedules(setupData.schedules || []);
        setCycles(setupData.cycles || []);
        setPayDays(setupData.payDays || []);
        setCalculationMethods(setupData.calculationMethods || []);
      }
      setSalaryComponents(componentsData || []);
    } catch (err) {
      console.error('Error fetching payroll setup from MongoDB:', err);
      showToast(err.message || 'Failed to fetch payroll setup configuration', 'danger');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSetupData();
  }, [fetchSetupData]);

  // Reset pagination on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
    setActiveMenuId(null);
  }, [activeTab, searchTerm, statusFilter, frequencyFilter]);

  // Click outside to close action menus
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getModuleCount = (tabId) => {
    switch (tabId) {
      case 'pay-groups': return payGroups.length;
      case 'salary-components': return salaryComponents.length;
      case 'pay-schedules': return schedules.length;
      case 'pay-cycles': return cycles.length;
      case 'pay-days': return payDays.length;
      case 'calculation-methods': return calculationMethods.length;
      default: return 0;
    }
  };

  const getCategoryCount = (catId) => {
    if (catId === 'master-setup') return 6;
    if (catId === 'payroll-setup' || catId === 'all') return ALL_SETUP_CATALOG.length;
    return getModuleCount(catId);
  };

  const filteredCatalog = useMemo(() => {
    return ALL_SETUP_CATALOG.filter((item) => {
      const matchesCategory =
        explorerCategory === 'all' || explorerCategory === 'payroll-setup' || item.id === explorerCategory;
      const q = catalogSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [explorerCategory, catalogSearch]);

  // Pay Groups Filtering
  const filteredPayGroups = payGroups.filter(pg => {
    const matchesSearch = !searchTerm.trim() || 
      (pg.name && pg.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (pg.code && pg.code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || pg.status === statusFilter;
    
    const matchesFrequency = frequencyFilter === 'all' || 
      (pg.payCycle && pg.payCycle.toLowerCase().includes(frequencyFilter.toLowerCase())) ||
      (pg.paySchedule && pg.paySchedule.toLowerCase().includes(frequencyFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesFrequency;
  });

  const paginatedPayGroups = filteredPayGroups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Pay Group Submissions
  const handleGroupSubmit = async (formData) => {
    try {
      if (editingGroup) {
        const targetId = editingGroup._id || editingGroup.id;
        await payrollSetupService.updatePayGroup(companyId, targetId, formData);
        showToast('✓ Pay Group updated successfully.');
      } else {
        await payrollSetupService.createPayGroup(companyId, formData);
        showToast('✓ Pay Group created successfully.');
      }
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      fetchSetupData();
    } catch (err) {
      console.error('Error saving pay group:', err);
      showToast(err.message || 'Failed to save pay group', 'danger');
    }
  };

  // Schedule Submissions
  const handleScheduleSubmit = async (formData) => {
    try {
      if (editingSchedule) {
        const targetId = editingSchedule._id || editingSchedule.id;
        await payrollSetupService.updatePaySchedule(companyId, targetId, formData);
        showToast('✓ Pay Schedule updated successfully.');
      } else {
        await payrollSetupService.createPaySchedule(companyId, formData);
        showToast('✓ Pay Schedule created successfully.');
      }
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      fetchSetupData();
    } catch (err) {
      console.error('Error saving pay schedule:', err);
      showToast(err.message || 'Failed to save pay schedule', 'danger');
    }
  };

  // Cycle Submissions
  const handleCycleSubmit = async (formData) => {
    try {
      if (editingCycle) {
        const targetId = editingCycle._id || editingCycle.id;
        await payrollSetupService.updatePayCycle(companyId, targetId, formData);
        showToast('✓ Pay Cycle updated successfully.');
      } else {
        await payrollSetupService.createPayCycle(companyId, formData);
        showToast('✓ Pay Cycle created successfully.');
      }
      setIsCycleModalOpen(false);
      setEditingCycle(null);
      fetchSetupData();
    } catch (err) {
      console.error('Error saving pay cycle:', err);
      showToast(err.message || 'Failed to save pay cycle', 'danger');
    }
  };

  // Pay Day Submissions
  const handlePayDaySubmit = async (formData) => {
    try {
      if (editingPayDay) {
        const targetId = editingPayDay._id || editingPayDay.id;
        await payrollSetupService.updatePayDay(companyId, targetId, formData);
        showToast('✓ Pay Day rule updated successfully.');
      } else {
        await payrollSetupService.createPayDay(companyId, formData);
        showToast('✓ Pay Day rule created successfully.');
      }
      setIsPayDayModalOpen(false);
      setEditingPayDay(null);
      fetchSetupData();
    } catch (err) {
      console.error('Error saving pay day:', err);
      showToast(err.message || 'Failed to save pay day rule', 'danger');
    }
  };

  // Set Default Calculation Method
  const handleSetDefaultMethod = async (methodId) => {
    try {
      await payrollSetupService.setDefaultCalculationMethod(companyId, methodId);
      showToast('✓ Default Salary Calculation Method updated.');
      fetchSetupData();
    } catch (err) {
      console.error('Error setting default calculation method:', err);
      showToast(err.message || 'Failed to update default method', 'danger');
    }
  };

  // Activate / Deactivate Trigger
  const triggerStatusChange = (item, itemType, newStatus) => {
    setConfirmModal({
      isOpen: true,
      title: `${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} ${item.name}?`,
      description: `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} ${item.name}? It will ${newStatus === 'inactive' ? 'no longer be assigned to active employee structures.' : 'become available for employee assignments.'}`,
      confirmLabel: newStatus === 'inactive' ? 'Deactivate' : 'Activate',
      variant: newStatus === 'inactive' ? 'danger' : 'primary',
      item,
      itemType,
      actionType: newStatus
    });
  };

  // Confirm Status Execution
  const handleConfirmStatus = async () => {
    const { item, itemType, actionType } = confirmModal;
    if (!item) return;

    const targetId = item._id || item.id;
    const newStatus = actionType;

    try {
      if (itemType === 'payGroup') {
        await payrollSetupService.updatePayGroup(companyId, targetId, { status: newStatus });
      } else if (itemType === 'schedule') {
        await payrollSetupService.updatePaySchedule(companyId, targetId, { status: newStatus });
      } else if (itemType === 'cycle') {
        await payrollSetupService.updatePayCycle(companyId, targetId, { status: newStatus });
      } else if (itemType === 'payDay') {
        await payrollSetupService.updatePayDay(companyId, targetId, { status: newStatus });
      }

      showToast(`✓ Record marked as ${newStatus}.`);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      fetchSetupData();
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast(err.message || 'Failed to update status', 'danger');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Toast Alert */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        {/* Modals */}
        <PayGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => { setIsGroupModalOpen(false); setEditingGroup(null); }}
          onSubmit={handleGroupSubmit}
          editingItem={editingGroup}
          schedules={schedules.filter(s => s.status === 'active')}
          cycles={cycles.filter(c => c.status === 'active')}
          payDays={payDays.filter(pd => pd.status === 'active')}
          calculationMethods={calculationMethods.filter(m => m.status === 'active')}
          salaryComponents={salaryComponents}
        />

        <PayGroupDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => { setIsDetailsModalOpen(false); setSelectedGroup(null); }}
          payGroup={selectedGroup}
          salaryComponents={salaryComponents}
        />

        <PayScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => { setIsScheduleModalOpen(false); setEditingSchedule(null); }}
          onSubmit={handleScheduleSubmit}
          editingItem={editingSchedule}
        />

        <PayCycleModal
          isOpen={isCycleModalOpen}
          onClose={() => { setIsCycleModalOpen(false); setEditingCycle(null); }}
          onSubmit={handleCycleSubmit}
          editingItem={editingCycle}
        />

        <PayDayModal
          isOpen={isPayDayModalOpen}
          onClose={() => { setIsPayDayModalOpen(false); setEditingPayDay(null); }}
          onSubmit={handlePayDaySubmit}
          editingItem={editingPayDay}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={handleConfirmStatus}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />

        {isExplorerView ? (
          <>
            {/* Explorer Breadcrumb */}
            <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
              <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
                Dashboard
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbLink} onClick={() => navigate('/admin/payroll')}>
                Payroll
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive}>Payroll Setup</span>
              {explorerCategory !== 'all' && explorerCategory !== 'payroll-setup' && (
                <>
                  <span className={styles.separator}>/</span>
                  <span className={styles.crumbActive}>
                    {SETUP_CATEGORIES.find((c) => c.id === explorerCategory)?.label}
                  </span>
                </>
              )}
            </div>

            {/* Explorer Header */}
            <header className={styles.header} style={{ marginBottom: '16px' }}>
              <div className={styles.titleArea}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <SlidersHorizontal size={24} color="#2563eb" />
                  <h1 className={styles.title} style={{ fontSize: '22px' }}>Payroll Setup</h1>
                </div>
                <p className={styles.description} style={{ marginTop: '6px' }}>
                  Configure payroll schedules, pay cycles, salary calculation rules, and pay groups.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={fetchSetupData}
                  title="Refresh from MongoDB"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>
            </header>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px' }}>
                <Loader2 size={28} className={styles.spin} />
                <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Loading setup configurations...</span>
              </div>
            ) : (
              /* 2-Column Payroll Setup Explorer Layout */
              <div className={styles.payrollExplorerLayout}>
                {/* Left Sidebar Filter Panel */}
                <aside className={styles.explorerSidebar}>
                  <div className={styles.explorerSearchWrap}>
                    <input
                      type="text"
                      className={styles.explorerSearchInput}
                      placeholder="Search Setup Modules"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                    {catalogSearch ? (
                      <button
                        type="button"
                        className={styles.explorerClearBtn}
                        onClick={() => setCatalogSearch('')}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <span style={{ position: 'absolute', right: 10, color: '#94a3b8', pointerEvents: 'none', display: 'flex' }}>
                        <Search size={14} />
                      </span>
                    )}
                  </div>

                  <ul className={styles.categoryList}>
                    {SETUP_CATEGORIES.map((cat) => {
                      const count = getCategoryCount(cat.id);
                      const isActive = explorerCategory === cat.id;
                      return (
                        <li key={cat.id}>
                          <button
                            type="button"
                            className={`${styles.categoryBtn} ${isActive ? styles.categoryBtnActive : ''}`}
                            onClick={() => {
                              if (cat.route && cat.route !== '/admin/payroll-setup') {
                                navigate(cat.route);
                              } else {
                                setExplorerCategory(cat.id);
                              }
                            }}
                          >
                            <span className={isActive ? styles.sidebarActiveDot : styles.sidebarDot} />
                            <span>{cat.label}</span>
                            <span className={styles.categoryBadge}>{count}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>

                {/* Right Grid of Setup Cards */}
                <main style={{ minWidth: 0 }}>
                  {filteredCatalog.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No setup modules found matching "{catalogSearch}".</p>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => { setCatalogSearch(''); setExplorerCategory('payroll-setup'); }}
                        style={{ marginTop: '12px', fontSize: '13px' }}
                      >
                        Show All Setup Modules
                      </button>
                    </div>
                  ) : (
                    <div className={styles.explorerCardsGrid}>
                      {filteredCatalog.map((item) => {
                        const Icon = item.icon;
                        const count = getModuleCount(item.tab);
                        return (
                          <div key={item.id} className={styles.referenceReportCard}>
                            <div>
                              <div className={styles.cardFormatIcons}>
                                <span style={{ display: 'inline-flex', color: item.iconColor || 'var(--primary, #2563eb)' }}>
                                  <Icon size={16} />
                                </span>
                                <span className={styles.recordCountPill} style={{ marginLeft: 'auto' }}>
                                  {count} {count === 1 ? 'Record' : 'Records'}
                                </span>
                              </div>
                              <div className={styles.cardBody}>
                                <h4 className={styles.cardTitle}>{item.title}</h4>
                                <p className={styles.cardDesc}>{item.desc}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={styles.cardOpenBtn}
                              onClick={() => handleOpenModule(item)}
                            >
                              Open <ArrowRight size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </main>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
              <span className={styles.crumbLink} onClick={() => navigate('/admin/dashboard')}>
                Dashboard
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbLink} onClick={() => navigate('/admin/payroll')}>
                Payroll
              </span>
              <span className={styles.separator}>/</span>
              <span
                className={styles.crumbLink}
                onClick={handleBackToSetup}
                style={{ color: 'var(--primary, #2563eb)', cursor: 'pointer' }}
              >
                Payroll Setup
              </span>
              <span className={styles.separator}>/</span>
              <span className={styles.crumbActive}>{TAB_LABELS[activeTab] || activeTab}</span>
            </div>

            {/* Header */}
            <header className={styles.header}>
              <div className={styles.titleArea}>
                <div className={styles.titleWithBadge}>
                  <h1 className={styles.title}>{TAB_LABELS[activeTab] || 'Payroll Setup'}</h1>
                  <span className={styles.adminBadge}>Admin Configuration</span>
                </div>
                <p className={styles.description}>
                  Configure payroll schedules, pay cycles, salary calculation rules and pay groups.
                </p>
              </div>

              <div className={styles.headerActions}>
                <button
                  type="button"
                  onClick={handleBackToSetup}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '8px 16px',
                    background: 'rgb(215 119 5)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgb(180 83 9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgb(215 119 5)';
                  }}
                >
                  <ArrowLeft size={15} color="#fff" /> Back to Payroll Setup
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={fetchSetupData}
                  title="Refresh from MongoDB"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
                {!isFromOrgSettings && (
                  <button
                    type="button"
                    className={styles.mastersLinkBtn}
                    onClick={() => navigate('/admin/masters?tab=salary-components')}
                    title="Go to Salary Components Master"
                  >
                    <span>Salary Components</span>
                    <ArrowUpRight size={15} />
                  </button>
                )}
              </div>
            </header>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px' }}>
            <Loader2 size={28} className={styles.spin} />
            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Loading setup configurations...</span>
          </div>
        ) : (
          <>
            {/* Overview Summary Cards */}
            <div className={styles.summaryGrid}>
              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Configured Pay Groups</span>
                  <div className={styles.statNumbers}>
                    <span className={styles.statValue}>{payGroups.length}</span>
                    <span className={styles.statSub}>
                      ({payGroups.filter(g => g.status === 'active').length} Active)
                    </span>
                  </div>
                </div>
                <div className={`${styles.iconBox} ${styles.blue}`}>
                  <DollarSign size={20} />
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Active Pay Schedules</span>
                  <div className={styles.statNumbers}>
                    <span className={styles.statValue}>
                      {schedules.filter(s => s.status === 'active').length}
                    </span>
                    <span className={styles.statSub}>Schedules</span>
                  </div>
                </div>
                <div className={`${styles.iconBox} ${styles.green}`}>
                  <Calendar size={20} />
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Configured Pay Cycles</span>
                  <div className={styles.statNumbers}>
                    <span className={styles.statValue}>
                      {cycles.filter(c => c.status === 'active').length}
                    </span>
                    <span className={styles.statSub}>Cycles Active</span>
                  </div>
                </div>
                <div className={`${styles.iconBox} ${styles.purple}`}>
                  <Clock size={20} />
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Salary Calculation</span>
                  <div className={styles.statNumbers}>
                    <span className={styles.statValueText}>
                      {calculationMethods.find(m => m.isDefault)?.name || 'Calendar Days Basis'}
                    </span>
                    <span className={styles.statSub}>Default Basis</span>
                  </div>
                </div>
                <div className={`${styles.iconBox} ${styles.orange}`}>
                  <Calculator size={20} />
                </div>
              </div>
            </div>

            {/* TAB 1: PAY GROUPS */}
            {activeTab === 'pay-groups' && (
              <div className={styles.tabContent}>
                {/* Toolbar */}
                <div className={styles.toolbarContainer}>
                  <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search pay group name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search pay groups"
                    />
                  </div>

                  <div className={styles.filterControls}>
                    <select
                      className={styles.filterSelect}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by status"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <select
                      className={styles.filterSelect}
                      value={frequencyFilter}
                      onChange={(e) => setFrequencyFilter(e.target.value)}
                      aria-label="Filter by pay cycle"
                    >
                      <option value="all">All Cycles</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                    </select>

                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => {
                        setEditingGroup(null);
                        setIsGroupModalOpen(true);
                      }}
                    >
                      <Plus size={16} />
                      <span>Add Pay Group</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                {filteredPayGroups.length === 0 ? (
                  <div className={styles.emptyWrapper}>
                    <EmptyState
                      title="No Pay Groups Found"
                      description="No pay groups match your current filter criteria."
                      actionLabel="Clear Filters"
                      onAction={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setFrequencyFilter('all');
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Pay Group Name</th>
                            <th>Code</th>
                            <th>Pay Schedule</th>
                            <th>Pay Cycle</th>
                            <th>Pay Day</th>
                            <th>Calculation Method</th>
                            <th>Components</th>
                            <th>Status</th>
                            <th className={styles.textCenter}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPayGroups.map((pg) => (
                            <tr key={pg._id || pg.id}>
                              <td>
                                <div className={styles.nameStack}>
                                  <span className={styles.primaryText}>{pg.name}</span>
                                  {pg.description && (
                                    <span className={styles.descSub}>{pg.description}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={styles.codeBadge}>{pg.code}</span>
                              </td>
                              <td>
                                <span className={styles.scheduleText}>{pg.paySchedule}</span>
                              </td>
                              <td>
                                <span className={styles.cycleBadge}>{pg.payCycle}</span>
                              </td>
                              <td>
                                <span className={styles.dayText}>{pg.payDay}</span>
                              </td>
                              <td>
                                <span className={styles.methodBadge}>{pg.salaryCalculationMethod}</span>
                              </td>
                              <td>
                                <span className={styles.compCountBadge}>
                                  {(pg.salaryComponentIds || []).length} Components
                                </span>
                              </td>
                              <td>
                                <StatusBadge status={pg.status} />
                              </td>
                              <td className={styles.textCenter}>
                                <div className={styles.actionMenuWrapper} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className={styles.actionIconBtn}
                                    onClick={() => setActiveMenuId(activeMenuId === (pg._id || pg.id) ? null : (pg._id || pg.id))}
                                    aria-label="Pay group actions"
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {activeMenuId === (pg._id || pg.id) && (
                                    <div className={styles.actionDropdown}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedGroup(pg);
                                          setIsDetailsModalOpen(true);
                                          setActiveMenuId(null);
                                        }}
                                      >
                                        <Eye size={14} />
                                        <span>View Details</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingGroup(pg);
                                          setIsGroupModalOpen(true);
                                          setActiveMenuId(null);
                                        }}
                                      >
                                        <Edit2 size={14} />
                                        <span>Edit Pay Group</span>
                                      </button>
                                      <button
                                        type="button"
                                        className={pg.status === 'active' ? styles.dangerItem : styles.successItem}
                                        onClick={() => {
                                          triggerStatusChange(
                                            pg,
                                            'payGroup',
                                            pg.status === 'active' ? 'inactive' : 'active'
                                          );
                                          setActiveMenuId(null);
                                        }}
                                      >
                                        {pg.status === 'active' ? (
                                          <>
                                            <ToggleRight size={14} />
                                            <span>Deactivate</span>
                                          </>
                                        ) : (
                                          <>
                                            <ToggleLeft size={14} />
                                            <span>Activate</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredPayGroups.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalItems={filteredPayGroups.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        label="pay groups"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PAY SCHEDULES */}
            {activeTab === 'pay-schedules' && (
              <div className={styles.tabContent}>
                <div className={styles.subHeader}>
                  <div>
                    <h3 className={styles.subTitle}>Pay Schedules</h3>
                    <p className={styles.subDescription}>
                      Configured payroll timeline frequencies (Monthly, Weekly, Bi-Weekly)
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => { setEditingSchedule(null); setIsScheduleModalOpen(true); }}
                  >
                    <Plus size={16} />
                    <span>Add Pay Schedule</span>
                  </button>
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Schedule Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th className={styles.textCenter}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s) => (
                          <tr key={s._id || s.id}>
                            <td><span className={styles.primaryText}>{s.name}</span></td>
                            <td><span className={styles.descText}>{s.description || '—'}</span></td>
                            <td><StatusBadge status={s.status} /></td>
                            <td className={styles.textCenter}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title="Edit Schedule"
                                  onClick={() => { setEditingSchedule(s); setIsScheduleModalOpen(true); }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title={s.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => triggerStatusChange(s, 'schedule', s.status === 'active' ? 'inactive' : 'active')}
                                >
                                  {s.status === 'active' ? <ToggleRight size={17} color="#ef4444" /> : <ToggleLeft size={17} color="#10b981" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PAY CYCLES */}
            {activeTab === 'pay-cycles' && (
              <div className={styles.tabContent}>
                <div className={styles.subHeader}>
                  <div>
                    <h3 className={styles.subTitle}>Pay Cycles</h3>
                    <p className={styles.subDescription}>
                      Attendance cutoff bounds and verification periods for salary computations
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => { setEditingCycle(null); setIsCycleModalOpen(true); }}
                  >
                    <Plus size={16} />
                    <span>Add Pay Cycle</span>
                  </button>
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Cycle Name</th>
                          <th>Frequency</th>
                          <th>Cutoff Bounds</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th className={styles.textCenter}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cycles.map((c) => (
                          <tr key={c._id || c.id}>
                            <td><span className={styles.primaryText}>{c.name}</span></td>
                            <td><span className={styles.cycleBadge}>{c.frequency}</span></td>
                            <td>
                              <span className={styles.dayText}>
                                Day {c.cycleStartDay} to {c.cycleEndDay}
                              </span>
                            </td>
                            <td><span className={styles.descText}>{c.description || '—'}</span></td>
                            <td><StatusBadge status={c.status} /></td>
                            <td className={styles.textCenter}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title="Edit Cycle"
                                  onClick={() => { setEditingCycle(c); setIsCycleModalOpen(true); }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title={c.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => triggerStatusChange(c, 'cycle', c.status === 'active' ? 'inactive' : 'active')}
                                >
                                  {c.status === 'active' ? <ToggleRight size={17} color="#ef4444" /> : <ToggleLeft size={17} color="#10b981" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PAY DAYS */}
            {activeTab === 'pay-days' && (
              <div className={styles.tabContent}>
                <div className={styles.subHeader}>
                  <div>
                    <h3 className={styles.subTitle}>Pay Day Rules</h3>
                    <p className={styles.subDescription}>
                      Configured disbursement timing rules (Fixed Day, Last Working Day, Last Calendar Day)
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => { setEditingPayDay(null); setIsPayDayModalOpen(true); }}
                  >
                    <Plus size={16} />
                    <span>Add Pay Day Rule</span>
                  </button>
                </div>

                <div className={styles.tableCard}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Rule Name</th>
                          <th>Pay Day Type</th>
                          <th>Disbursement Timing</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th className={styles.textCenter}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payDays.map((pd) => (
                          <tr key={pd._id || pd.id}>
                            <td><span className={styles.primaryText}>{pd.name}</span></td>
                            <td><span className={styles.codeBadge}>{pd.payDayType}</span></td>
                            <td>
                              <span className={styles.dayText}>
                                {pd.payDayType === 'Fixed Day' ? `${pd.fixedDay}th of Month` : pd.payDayType}
                              </span>
                            </td>
                            <td><span className={styles.descText}>{pd.description || '—'}</span></td>
                            <td><StatusBadge status={pd.status} /></td>
                            <td className={styles.textCenter}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title="Edit Pay Day"
                                  onClick={() => { setEditingPayDay(pd); setIsPayDayModalOpen(true); }}
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.editIconBtn}
                                  title={pd.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => triggerStatusChange(pd, 'payDay', pd.status === 'active' ? 'inactive' : 'active')}
                                >
                                  {pd.status === 'active' ? <ToggleRight size={17} color="#ef4444" /> : <ToggleLeft size={17} color="#10b981" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SALARY CALCULATION METHODS */}
            {activeTab === 'calculation-methods' && (
              <div className={styles.tabContent}>
                <div className={styles.subHeader}>
                  <div>
                    <h3 className={styles.subTitle}>Salary Calculation Methods</h3>
                    <p className={styles.subDescription}>
                      Configures daily rate derivation formulas used across pay groups
                    </p>
                  </div>
                </div>

                <div className={styles.methodCardsGrid}>
                  {calculationMethods.map((m) => (
                    <div key={m._id || m.id} className={`${styles.methodCard} ${m.isDefault ? styles.methodCardDefault : ''}`}>
                      <div className={styles.methodHeader}>
                        <div className={styles.methodTitleRow}>
                          <span className={styles.methodCodeBadge}>{m.code}</span>
                          <h4 className={styles.methodName}>{m.name}</h4>
                        </div>
                        {m.isDefault ? (
                          <span className={styles.defaultBadge}>
                            <Sparkles size={13} />
                            <span>System Default</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.makeDefaultBtn}
                            onClick={() => handleSetDefaultMethod(m._id || m.id)}
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <div className={styles.formulaBox}>
                        <span className={styles.formulaLabel}>Calculation Formula:</span>
                        <code className={styles.formulaCode}>{m.formula}</code>
                      </div>

                      <p className={styles.methodDesc}>{m.description}</p>

                      <div className={styles.methodFooter}>
                        <StatusBadge status={m.status} />
                        <span className={styles.methodRuleHint}>Configuration Ready</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default PayrollSetup;
