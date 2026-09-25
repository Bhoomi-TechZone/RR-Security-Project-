import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, Calendar, Clock, CalendarDays, Calculator, Plus, 
  Search, Filter, CheckCircle2, AlertCircle, Layers, ArrowUpRight,
  MoreVertical, Edit2, Eye, ToggleLeft, ToggleRight, Sparkles
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

// Initial Mock data
import { 
  mockPaySchedules, 
  mockPayCycles, 
  mockPayDayConfigs, 
  mockSalaryCalculationMethods, 
  mockPayGroups 
} from '../../data/payrollSetupData';

// Consumes existing Salary Components from Masters
import { mockSalaryComponents } from '../../data/masters/salaryComponentData';

const ITEMS_PER_PAGE = 8;

const TABS = [
  { id: 'pay-groups', label: 'Pay Groups', icon: DollarSign },
  { id: 'pay-schedules', label: 'Pay Schedules', icon: Calendar },
  { id: 'pay-cycles', label: 'Pay Cycles', icon: Clock },
  { id: 'pay-days', label: 'Pay Days', icon: CalendarDays },
  { id: 'calculation-methods', label: 'Salary Calculation Methods', icon: Calculator }
];

function PayrollSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  // Active Setup Tab
  const initialTab = searchParams.get('tab') || 'pay-groups';
  const [activeTab, setActiveTab] = useState(initialTab);
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

  // Persistence State Collections
  const [payGroups, setPayGroups] = useState(() => {
    const saved = localStorage.getItem('novaspark_payroll_setup_pay_groups');
    return saved ? JSON.parse(saved) : mockPayGroups;
  });

  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('novaspark_payroll_setup_schedules');
    return saved ? JSON.parse(saved) : mockPaySchedules;
  });

  const [cycles, setCycles] = useState(() => {
    const saved = localStorage.getItem('novaspark_payroll_setup_cycles');
    return saved ? JSON.parse(saved) : mockPayCycles;
  });

  const [payDays, setPayDays] = useState(() => {
    const saved = localStorage.getItem('novaspark_payroll_setup_pay_days');
    return saved ? JSON.parse(saved) : mockPayDayConfigs;
  });

  const [calculationMethods, setCalculationMethods] = useState(() => {
    const saved = localStorage.getItem('novaspark_payroll_setup_calc_methods');
    return saved ? JSON.parse(saved) : mockSalaryCalculationMethods;
  });

  // Consumes Salary Components from Masters
  const [salaryComponents] = useState(() => {
    const saved = localStorage.getItem('novaspark_masters_salary_components');
    return saved ? JSON.parse(saved) : mockSalaryComponents;
  });

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

  // Persistence Effects
  useEffect(() => { localStorage.setItem('novaspark_payroll_setup_pay_groups', JSON.stringify(payGroups)); }, [payGroups]);
  useEffect(() => { localStorage.setItem('novaspark_payroll_setup_schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem('novaspark_payroll_setup_cycles', JSON.stringify(cycles)); }, [cycles]);
  useEffect(() => { localStorage.setItem('novaspark_payroll_setup_pay_days', JSON.stringify(payDays)); }, [payDays]);
  useEffect(() => { localStorage.setItem('novaspark_payroll_setup_calc_methods', JSON.stringify(calculationMethods)); }, [calculationMethods]);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Pay Groups Filtering
  const filteredPayGroups = payGroups.filter(pg => {
    const matchesSearch = !searchTerm.trim() || 
      pg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      pg.code.toLowerCase().includes(searchTerm.toLowerCase());

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
  const handleGroupSubmit = (formData) => {
    if (editingGroup) {
      setPayGroups(prev => prev.map(item => item.id === editingGroup.id ? { ...item, ...formData } : item));
      showToast('✓ Pay Group updated successfully.');
    } else {
      const newGroup = {
        id: `pg-${Date.now()}`,
        employeeCount: 0,
        ...formData
      };
      setPayGroups(prev => [newGroup, ...prev]);
      showToast('✓ Pay Group created successfully.');
    }
    setIsGroupModalOpen(false);
    setEditingGroup(null);
  };

  // Schedule Submissions
  const handleScheduleSubmit = (formData) => {
    if (editingSchedule) {
      setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? { ...s, ...formData } : s));
      showToast('✓ Pay Schedule updated successfully.');
    } else {
      const newSchedule = { id: `ps-${Date.now()}`, ...formData };
      setSchedules(prev => [newSchedule, ...prev]);
      showToast('✓ Pay Schedule created successfully.');
    }
    setIsScheduleModalOpen(false);
    setEditingSchedule(null);
  };

  // Cycle Submissions
  const handleCycleSubmit = (formData) => {
    if (editingCycle) {
      setCycles(prev => prev.map(c => c.id === editingCycle.id ? { ...c, ...formData } : c));
      showToast('✓ Pay Cycle updated successfully.');
    } else {
      const newCycle = { id: `pc-${Date.now()}`, ...formData };
      setCycles(prev => [newCycle, ...prev]);
      showToast('✓ Pay Cycle created successfully.');
    }
    setIsCycleModalOpen(false);
    setEditingCycle(null);
  };

  // Pay Day Submissions
  const handlePayDaySubmit = (formData) => {
    if (editingPayDay) {
      setPayDays(prev => prev.map(pd => pd.id === editingPayDay.id ? { ...pd, ...formData } : pd));
      showToast('✓ Pay Day rule updated successfully.');
    } else {
      const newPayDay = { id: `pd-${Date.now()}`, ...formData };
      setPayDays(prev => [newPayDay, ...prev]);
      showToast('✓ Pay Day rule created successfully.');
    }
    setIsPayDayModalOpen(false);
    setEditingPayDay(null);
  };

  // Set Default Calculation Method
  const handleSetDefaultMethod = (methodId) => {
    setCalculationMethods(prev => prev.map(m => ({
      ...m,
      isDefault: m.id === methodId
    })));
    showToast('✓ Default Salary Calculation Method updated.');
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
  const handleConfirmStatus = () => {
    const { item, itemType, actionType } = confirmModal;
    if (!item) return;

    const newStatus = actionType;
    const updateList = (list) => list.map(i => i.id === item.id ? { ...i, status: newStatus } : i);

    if (itemType === 'payGroup') setPayGroups(updateList);
    else if (itemType === 'schedule') setSchedules(updateList);
    else if (itemType === 'cycle') setCycles(updateList);
    else if (itemType === 'payDay') setPayDays(updateList);
    else if (itemType === 'calcMethod') setCalculationMethods(updateList);

    showToast(`✓ Record marked as ${newStatus}.`);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
          <span className={styles.crumbActive}>Payroll Setup</span>
        </div>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleWithBadge}>
              <h1 className={styles.title}>Payroll Setup</h1>
              <span className={styles.adminBadge}>Admin Configuration</span>
            </div>
            <p className={styles.description}>
              Configure payroll schedules, pay cycles, salary calculation rules and pay groups.
            </p>
          </div>

          {!isFromOrgSettings && (
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.mastersLinkBtn}
                onClick={() => navigate('/admin/masters')}
                title="Go to Salary Components Master"
              >
                <span>Salary Components</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}
        </header>

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
                  {calculationMethods.find(m => m.isDefault)?.name || 'Calendar Days'}
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
                        <tr key={pg.id}>
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
                                onClick={() => setActiveMenuId(activeMenuId === pg.id ? null : pg.id)}
                                aria-label="Pay group actions"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeMenuId === pg.id && (
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
                      <tr key={s.id}>
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
                      <tr key={c.id}>
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
                      <tr key={pd.id}>
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
                <div key={m.id} className={`${styles.methodCard} ${m.isDefault ? styles.methodCardDefault : ''}`}>
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
                        onClick={() => handleSetDefaultMethod(m.id)}
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
      </div>
    </AdminLayout>
  );
}

export default PayrollSetup;
