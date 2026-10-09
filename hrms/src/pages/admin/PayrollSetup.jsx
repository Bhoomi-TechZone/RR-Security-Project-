import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  DollarSign, Calendar, Clock, CalendarDays, Calculator, Plus, 
  Search, Filter, CheckCircle2, AlertCircle, Layers, ArrowUpRight,
  MoreVertical, Edit2, Eye, ToggleLeft, ToggleRight, Sparkles,
  Loader2, RefreshCw
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

function PayrollSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  const { company } = useCompany();
  const companyId = company?.companyId || company?.id || 'RRS8392014SEC';

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
        showToast('✓ Pay Group updated successfully in database.');
      } else {
        await payrollSetupService.createPayGroup(companyId, formData);
        showToast('✓ Pay Group created successfully in database.');
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
        showToast('✓ Pay Schedule updated successfully in database.');
      } else {
        await payrollSetupService.createPaySchedule(companyId, formData);
        showToast('✓ Pay Schedule created successfully in database.');
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
        showToast('✓ Pay Cycle updated successfully in database.');
      } else {
        await payrollSetupService.createPayCycle(companyId, formData);
        showToast('✓ Pay Cycle created successfully in database.');
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
        showToast('✓ Pay Day rule updated successfully in database.');
      } else {
        await payrollSetupService.createPayDay(companyId, formData);
        showToast('✓ Pay Day rule created successfully in database.');
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
      showToast('✓ Default Salary Calculation Method updated in database.');
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

      showToast(`✓ Record marked as ${newStatus} in database.`);
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
            {!isFromOrgSettings && (
              <button
                type="button"
                className={styles.mastersLinkBtn}
                onClick={() => navigate('/admin/masters')}
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
            <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Connecting to MongoDB database...</span>
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
                      description="No pay groups match your current filter criteria or database is empty."
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
      </div>
    </AdminLayout>
  );
}

export default PayrollSetup;
