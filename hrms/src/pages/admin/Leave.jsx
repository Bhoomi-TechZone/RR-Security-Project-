import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  CircleCheck,
  CircleX,
  Download,
  Search,
  X,
  MoreVertical,
  Check,
  Ban,
  Filter,
  CalendarRange,
  Building2,
  Plus,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Users,
  Eye,
  Settings,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import EmptyState from '../../components/common/EmptyState';

import LeaveMasterSection from '../../components/leave/LeaveMasterSection';
import LeaveTypeModal from '../../components/leave/LeaveTypeModal';
import EmployeeLeavePolicySection from '../../components/leave/EmployeeLeavePolicySection';
import LeavePolicyAssignModal from '../../components/leave/LeavePolicyAssignModal';
import LeaveApprovalDrawer from '../../components/leave/LeaveApprovalDrawer';
import LeaveReasonModal from '../../components/leave/LeaveReasonModal';
import LeaveApplicationModal from '../../components/leave/LeaveApplicationModal';

import {
  INITIAL_LEAVE_TYPES,
  INITIAL_EMPLOYEE_BALANCES,
  INITIAL_LEAVE_POLICIES,
  ENHANCED_LEAVE_REQUESTS,
  INITIAL_SITE_MANPOWER
} from '../../data/leaveMasterData';
import { mockCompanies } from '../../data/companyData';
import { mockDepartments } from '../../data/employeeData';
import styles from './Leave.module.css';

const REQUESTS_STORAGE_KEY = 'novaspark_leave_requests';
const TYPES_STORAGE_KEY = 'novaspark_leave_types';
const BALANCES_STORAGE_KEY = 'novaspark_employee_balances';
const PAGE_SIZE = 8;

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const getDaysLabel = (days) => `${days} ${days === 1 ? 'Day' : 'Days'}`;

const getDateRange = (fromDate, toDate) => {
  if (!fromDate || !toDate) return [];
  const dates = [];
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diff = Math.round((end - start) / 86400000);

  for (let i = 0; i <= diff; i += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    dates.push(next.toISOString().slice(0, 10));
  }

  return dates;
};

function LeaveSummaryCards({ requests }) {
  const total = requests.length;
  const pendingSup = requests.filter((r) => r.status === 'Pending Supervisor Approval' || r.status === 'pending').length;
  const pendingHr = requests.filter((r) => r.status === 'Pending HR Approval').length;
  const approved = requests.filter((r) => r.status === 'Approved' || r.status === 'approved').length;
  const rejected = requests.filter((r) => r.status === 'Rejected' || r.status === 'rejected').length;

  const cards = [
    { label: 'Total Requests', value: total, sub: 'All submissions', icon: CalendarDays, style: styles.blue },
    { label: 'Pending Supervisor', value: pendingSup, sub: 'Site-level review', icon: Clock3, style: styles.yellow },
    { label: 'Pending HR', value: pendingHr, sub: 'Final sanction', icon: Clock3, style: styles.purple },
    { label: 'Approved & Synced', value: approved, sub: 'Attendance linked', icon: CircleCheck, style: styles.green },
    { label: 'Rejected / Sent Back', value: rejected, sub: 'Actioned', icon: CircleX, style: styles.red }
  ];

  return (
    <div className={styles.summaryGrid5}>
      {cards.map(({ label, value, sub, icon: Icon, style }) => (
        <div key={label} className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            <span className={styles.summaryLabel}>{label}</span>
            <span className={styles.summaryNumber}>{value}</span>
            <span className={styles.summarySubtext}>{sub}</span>
          </div>
          <div className={`${styles.iconWrap} ${style}`}>
            <Icon size={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaveCalendar({ requests }) {
  const month = new Date('2026-09-01');
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const startingIndex = (firstDay + 6) % 7;
  const cells = [];

  for (let i = 0; i < startingIndex; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const leaveMap = new Map();
  requests.forEach((item) => {
    if (item.status === 'Cancelled' || item.status === 'Rejected') return;
    const dates = getDateRange(item.fromDate, item.toDate);
    dates.forEach((date) => {
      const key = date.slice(8, 10);
      leaveMap.set(key, (leaveMap.get(key) || 0) + 1);
    });
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={styles.calendarCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>Monthly Leave & Duty Roster Calendar</h3>
          <p className={styles.sectionSubtext}>September 2026 • Live on-site personnel availability snapshot</p>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        {weekdays.map((day) => (
          <div key={day} className={styles.calendarHead}>{day}</div>
        ))}
        {cells.map((day, index) => {
          const key = day !== null ? String(day).padStart(2, '0') : null;
          const count = key ? leaveMap.get(key) || 0 : 0;
          return (
            <div key={`${day ?? 'empty'}-${index}`} className={`${styles.calendarDay} ${day === null ? styles.calendarDayMuted : ''}`}>
              {day !== null && <span className={styles.dayNumber}>{day}</span>}
              {day !== null && count > 0 && (
                <span className={styles.dayIndicator}>
                  <span className={styles.dayDot} />
                  {count} {count === 1 ? 'staff on leave' : 'staff on leave'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaveExportModal({ open, filters, onClose, onExport, setExportFilters, clients, departments, leaveTypes }) {
  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleWrap}>
            <FileSpreadsheet size={20} className={styles.modalIcon} />
            <div>
              <h3 className={styles.modalTitle}>Export Comprehensive Leave & Attendance Report</h3>
              <p className={styles.modalSub}>Download site-wise leave registers, payroll impact summaries, and balance ledgers</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.filterGrid2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>From Date</label>
              <input type="date" className={styles.input} value={filters.fromDate} onChange={(e) => setExportFilters((prev) => ({ ...prev, fromDate: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>To Date</label>
              <input type="date" className={styles.input} value={filters.toDate} onChange={(e) => setExportFilters((prev) => ({ ...prev, toDate: e.target.value }))} />
            </div>
          </div>

          <div className={styles.filterGrid2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Client</label>
              <select className={styles.select} value={filters.clientFilter} onChange={(e) => setExportFilters((prev) => ({ ...prev, clientFilter: e.target.value }))}>
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id || client.name} value={client.name}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Department</label>
              <select className={styles.select} value={filters.departmentFilter} onChange={(e) => setExportFilters((prev) => ({ ...prev, departmentFilter: e.target.value }))}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterGrid3}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Leave Type</label>
              <select className={styles.select} value={filters.leaveTypeFilter} onChange={(e) => setExportFilters((prev) => ({ ...prev, leaveTypeFilter: e.target.value }))}>
                <option value="">All Types</option>
                {leaveTypes.map((t) => (
                  <option key={t.code} value={t.name}>{t.code} - {t.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Workflow Status</label>
              <select className={styles.select} value={filters.statusFilter} onChange={(e) => setExportFilters((prev) => ({ ...prev, statusFilter: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="Pending Supervisor Approval">Pending Supervisor</option>
                <option value="Pending HR Approval">Pending HR</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Sent Back">Sent Back</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Format</label>
              <select className={styles.select} value={filters.format} onChange={(e) => setExportFilters((prev) => ({ ...prev, format: e.target.value }))}>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF Document (.pdf)</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.primaryBtn} onClick={() => onExport(filters)}>
            <Download size={15} />
            <span>Generate & Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leave() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isFromOrgSettings = location.state?.fromOrganisationSettings === true;

  const initialTab = searchParams.get('tab') || 'requests';
  const [activeTab, setActiveTab] = useState(initialTab); // 'requests' | 'balances' | 'master' | 'calendar'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Master State
  const [leaveRequests, setLeaveRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ENHANCED_LEAVE_REQUESTS;
    } catch {
      return ENHANCED_LEAVE_REQUESTS;
    }
  });

  const [leaveTypes, setLeaveTypes] = useState(() => {
    try {
      const saved = localStorage.getItem(TYPES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_LEAVE_TYPES;
    } catch {
      return INITIAL_LEAVE_TYPES;
    }
  });

  const [employeeBalances, setEmployeeBalances] = useState(() => {
    try {
      const saved = localStorage.getItem(BALANCES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEE_BALANCES;
    } catch {
      return INITIAL_EMPLOYEE_BALANCES;
    }
  });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Drawers state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveTypeModalState, setLeaveTypeModalState] = useState({ isOpen: false, mode: 'add', data: null });
  const [policyAssignModalState, setPolicyAssignModalState] = useState({ isOpen: false, employee: null });
  const [reasonModalState, setReasonModalState] = useState({ isOpen: false, type: 'reject', request: null });
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [exportFilters, setExportFilters] = useState({
    fromDate: '',
    toDate: '',
    clientFilter: '',
    departmentFilter: '',
    leaveTypeFilter: '',
    statusFilter: '',
    format: 'excel'
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem(TYPES_STORAGE_KEY, JSON.stringify(leaveTypes));
  }, [leaveTypes]);

  useEffect(() => {
    localStorage.setItem(BALANCES_STORAGE_KEY, JSON.stringify(employeeBalances));
  }, [employeeBalances]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const clients = mockCompanies.map((c) => ({ id: c.id, name: c.name }));

  // Filter requests
  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return leaveRequests.filter((item) => {
      if (query) {
        const hitsEmployee = item.employeeName?.toLowerCase().includes(query);
        const hitsId = (item.employeeId || item.id)?.toLowerCase().includes(query);
        const hitsCode = item.leaveCode?.toLowerCase().includes(query);
        if (!hitsEmployee && !hitsId && !hitsCode) return false;
      }

      if (clientFilter && item.clientName !== clientFilter) return false;
      if (departmentFilter && item.department !== departmentFilter) return false;
      if (leaveTypeFilter && item.leaveType !== leaveTypeFilter) return false;

      if (statusFilter) {
        if (item.status !== statusFilter) return false;
      }

      if (fromDate && item.fromDate < fromDate) return false;
      if (toDate && item.toDate > toDate) return false;

      return true;
    });
  }, [leaveRequests, searchTerm, clientFilter, departmentFilter, leaveTypeFilter, statusFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, clientFilter, departmentFilter, leaveTypeFilter, statusFilter, fromDate, toDate]);

  const resetFilters = () => {
    setSearchTerm('');
    setClientFilter('');
    setDepartmentFilter('');
    setLeaveTypeFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  // Workflow Handlers
  const handleSupervisorApprove = (request) => {
    setLeaveRequests((prev) =>
      prev.map((r) => {
        if (r.id === request.id) {
          const updatedTimeline = [...(r.timeline || [])];
          if (updatedTimeline[1]) {
            updatedTimeline[1] = {
              stage: 'Site Supervisor Approval',
              actor: 'Site Supervisor (Amit Kumar)',
              status: 'Approved',
              timestamp: new Date().toLocaleString(),
              remarks: 'Site manpower checked. Reliever arranged. Forwarded to HR.'
            };
          }
          if (updatedTimeline[2]) {
            updatedTimeline[2] = {
              ...updatedTimeline[2],
              status: 'Pending'
            };
          }

          return {
            ...r,
            status: 'Pending HR Approval',
            currentApprover: 'HR Manager (Priya Nair)',
            workflowStage: 3,
            timeline: updatedTimeline,
            rejectionReason: null,
            sendBackReason: null
          };
        }
        return r;
      })
    );

    setSelectedLeave(null);
    showToast('✓ Approved by Site Supervisor. Forwarded to HR for final sanction.');
  };

  const handleHrApprove = (request) => {
    setLeaveRequests((prev) =>
      prev.map((r) => {
        if (r.id === request.id) {
          const updatedTimeline = [...(r.timeline || [])];
          if (updatedTimeline[2]) {
            updatedTimeline[2] = {
              stage: 'HR Approval',
              actor: 'HR Manager (Priya Nair)',
              status: 'Approved',
              timestamp: new Date().toLocaleString(),
              remarks: 'Leave verified and approved as per enterprise policy.'
            };
          }
          if (updatedTimeline[3]) {
            updatedTimeline[3] = {
              stage: 'Attendance Update',
              actor: 'Automated System',
              status: 'Completed',
              timestamp: new Date().toLocaleString(),
              remarks: `Attendance marked as ${r.attendanceImpact?.status || 'Leave'}`
            };
          }
          if (updatedTimeline[4]) {
            updatedTimeline[4] = {
              stage: 'Payroll Calculation',
              actor: 'Payroll Engine',
              status: 'Completed',
              timestamp: new Date().toLocaleString(),
              remarks: r.category === 'Paid' ? 'Paid leave credited: No salary deduction.' : '1 Day LWP salary deduction scheduled.'
            };
          }

          return {
            ...r,
            status: 'Approved',
            currentApprover: 'Fully Processed',
            workflowStage: 5,
            timeline: updatedTimeline,
            processedOn: new Date().toISOString().slice(0, 10),
            processedBy: 'HR Manager'
          };
        }
        return r;
      })
    );

    // Update Employee Balance
    setEmployeeBalances((prev) =>
      prev.map((b) => {
        if (b.employeeCode === request.employeeId && b.balances && b.balances[request.leaveCode]) {
          const currentBal = b.balances[request.leaveCode];
          const newUsed = currentBal.used + request.days;
          const newPending = Math.max(0, currentBal.pending - request.days);
          return {
            ...b,
            balances: {
              ...b.balances,
              [request.leaveCode]: {
                ...currentBal,
                used: newUsed,
                pending: newPending
              }
            }
          };
        }
        return b;
      })
    );

    setSelectedLeave(null);
    showToast('✓ Leave request approved & synchronized with Attendance & Payroll.');
  };

  const handleConfirmReject = (reasonText) => {
    const { request } = reasonModalState;
    if (!request) return;

    setLeaveRequests((prev) =>
      prev.map((r) => {
        if (r.id === request.id) {
          const updatedTimeline = [...(r.timeline || [])];
          const activeIdx = r.workflowStage === 2 ? 1 : 2;
          if (updatedTimeline[activeIdx]) {
            updatedTimeline[activeIdx] = {
              ...updatedTimeline[activeIdx],
              status: 'Rejected',
              timestamp: new Date().toLocaleString(),
              remarks: reasonText
            };
          }

          return {
            ...r,
            status: 'Rejected',
            currentApprover: 'Rejected',
            rejectionReason: reasonText,
            timeline: updatedTimeline
          };
        }
        return r;
      })
    );

    setReasonModalState({ isOpen: false, type: 'reject', request: null });
    setSelectedLeave(null);
    showToast('✓ Leave request rejected.', 'danger');
  };

  const handleConfirmSendBack = (reasonText) => {
    const { request } = reasonModalState;
    if (!request) return;

    setLeaveRequests((prev) =>
      prev.map((r) => {
        if (r.id === request.id) {
          const updatedTimeline = [...(r.timeline || [])];
          updatedTimeline.push({
            stage: 'Sent Back for Clarification',
            actor: 'Reviewer',
            status: 'Sent Back',
            timestamp: new Date().toLocaleString(),
            remarks: reasonText
          });

          return {
            ...r,
            status: 'Sent Back',
            currentApprover: `Employee (${r.employeeName})`,
            sendBackReason: reasonText,
            timeline: updatedTimeline
          };
        }
        return r;
      })
    );

    setReasonModalState({ isOpen: false, type: 'send_back', request: null });
    setSelectedLeave(null);
    showToast('✓ Leave request sent back to employee for revision.', 'warning');
  };

  // Leave Master Type Save
  const handleSaveLeaveType = (typeData) => {
    if (leaveTypeModalState.mode === 'edit') {
      setLeaveTypes((prev) =>
        prev.map((t) => (t.code === typeData.code ? { ...t, ...typeData } : t))
      );
      showToast('✓ Leave type updated successfully.');
    } else {
      const exists = leaveTypes.some((t) => t.code.toUpperCase() === typeData.code.toUpperCase());
      if (exists) {
        showToast('Leave code already exists.', 'danger');
        return;
      }
      const newType = {
        ...typeData,
        id: `LT-${Math.floor(10 + Math.random() * 90)}`
      };
      setLeaveTypes((prev) => [...prev, newType]);
      showToast('✓ New leave type added successfully.');
    }
    setLeaveTypeModalState({ isOpen: false, mode: 'add', data: null });
  };

  const handleToggleLeaveTypeStatus = (item) => {
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t))
    );
    showToast(`Leave type ${item.code} marked as ${newStatus}.`);
  };

  // Policy Assignment Save
  const handleSavePolicyAssign = ({ employeeCode, policyName, openingBalances }) => {
    setEmployeeBalances((prev) =>
      prev.map((emp) => {
        if (emp.employeeCode === employeeCode) {
          return {
            ...emp,
            policyName,
            balances: {
              CL: { ...emp.balances?.CL, opening: openingBalances.CL },
              SL: { ...emp.balances?.SL, opening: openingBalances.SL },
              EL: { ...emp.balances?.EL, opening: openingBalances.EL },
              LWP: { ...emp.balances?.LWP, opening: openingBalances.LWP }
            }
          };
        }
        return emp;
      })
    );
    setPolicyAssignModalState({ isOpen: false, employee: null });
    showToast('✓ Employee leave policy & opening balances assigned.');
  };

  // Apply Leave Submission Handler
  const handleApplyLeaveSubmit = (newRequest) => {
    setLeaveRequests((prev) => [newRequest, ...prev]);
    setEmployeeBalances((prev) =>
      prev.map((emp) => {
        if (emp.employeeCode === newRequest.employeeCode) {
          const currentBal = emp.balances?.[newRequest.leaveCode];
          if (currentBal) {
            return {
              ...emp,
              balances: {
                ...emp.balances,
                [newRequest.leaveCode]: {
                  ...currentBal,
                  pending: (currentBal.pending || 0) + (newRequest.requestedDays || newRequest.days || 1)
                }
              }
            };
          }
        }
        return emp;
      })
    );
    setIsApplyModalOpen(false);
    showToast('✓ Leave application submitted successfully and sent for approval.');
  };

  const onExport = (payload) => {
    if (payload.fromDate && payload.toDate && payload.fromDate > payload.toDate) {
      showToast('Start date cannot be later than end date.', 'danger');
      return;
    }

    setExportModalOpen(false);
    showToast('Preparing leave register & attendance report...', 'success');
    setTimeout(() => {
      showToast('✓ Leave report exported successfully.', 'success');
    }, 600);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Breadcrumb */}
        <div className={styles.breadcrumb} role="navigation" aria-label="Breadcrumb">
          <span className={styles.crumbLink} onClick={() => window.location.href = '/admin/dashboard'}>Dashboard</span>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>Leave Management</span>
        </div>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Enterprise Leave Management</h1>
            <p className={styles.subtitle}>
              Leave Master rules, employee quotas, review site manpower, and approvals with Attendance & Payroll.
            </p>
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.exportBtn}
              onClick={() => setExportModalOpen(true)}
            >
              <Download size={16} />
              <span>Export Report</span>
            </button>
            <button
              type="button"
              className={styles.primaryAddBtn}
              onClick={() => setIsApplyModalOpen(true)}
            >
              <Plus size={16} />
              <span>Apply Leave</span>
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        {loading ? (
          <div className={styles.summaryGrid5}>
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className={styles.summaryCard} style={{ opacity: 0.55 }}>
                <div className={styles.summaryValue}>
                  <span className={styles.summaryLabel}>Loading</span>
                  <span className={styles.summaryNumber}>--</span>
                </div>
                <div className={`${styles.iconWrap} ${styles.blue}`}><CalendarDays size={20} /></div>
              </div>
            ))}
          </div>
        ) : (
          <LeaveSummaryCards requests={leaveRequests} />
        )}

        {/* Tabs Bar */}
        <div className={styles.tabsRow}>
          {(!isFromOrgSettings || activeTab === 'requests') && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'requests' ? styles.tabBtnActive : ''}`}
              onClick={isFromOrgSettings ? undefined : () => setActiveTab('requests')}
              style={isFromOrgSettings ? { pointerEvents: 'none', cursor: 'default' } : undefined}
            >
              Leave Requests & Approvals ({leaveRequests.filter(r => r.status.includes('Pending')).length})
            </button>
          )}
          {(!isFromOrgSettings || activeTab === 'balances') && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'balances' ? styles.tabBtnActive : ''}`}
              onClick={isFromOrgSettings ? undefined : () => setActiveTab('balances')}
              style={isFromOrgSettings ? { pointerEvents: 'none', cursor: 'default' } : undefined}
            >
              Employee Balances & Policy ({employeeBalances.length})
            </button>
          )}
          {(!isFromOrgSettings || activeTab === 'master') && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'master' ? styles.tabBtnActive : ''}`}
              onClick={isFromOrgSettings ? undefined : () => setActiveTab('master')}
              style={isFromOrgSettings ? { pointerEvents: 'none', cursor: 'default' } : undefined}
            >
              Leave Master ({leaveTypes.length})
            </button>
          )}
          {(!isFromOrgSettings || activeTab === 'calendar') && (
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'calendar' ? styles.tabBtnActive : ''}`}
              onClick={isFromOrgSettings ? undefined : () => setActiveTab('calendar')}
              style={isFromOrgSettings ? { pointerEvents: 'none', cursor: 'default' } : undefined}
            >
              Roster & Calendar View
            </button>
          )}
        </div>

        {/* TAB 1: Leave Requests & Approvals */}
        {activeTab === 'requests' && (
          <div className={styles.tabContent}>
            {/* Filter Card */}
            <div className={styles.filterCard}>
              <div className={styles.filterRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Search Employee / ID</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="Search name, code, or leave..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '34px' }}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Client</label>
                  <select className={styles.select} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                    <option value="">All Clients</option>
                    {clients.map((client) => (
                      <option key={client.id || client.name} value={client.name}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Department</label>
                  <select className={styles.select} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {mockDepartments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Leave Type</label>
                  <select className={styles.select} value={leaveTypeFilter} onChange={(e) => setLeaveTypeFilter(e.target.value)}>
                    <option value="">All Leave Types</option>
                    {leaveTypes.map((type) => (
                      <option key={type.code} value={type.name}>{type.code} - {type.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Workflow Status</label>
                  <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Pending Supervisor Approval">Pending Supervisor</option>
                    <option value="Pending HR Approval">Pending HR</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Sent Back">Sent Back</option>
                  </select>
                </div>

                <div className={styles.dateField}>
                  <label className={styles.fieldLabel}>From Date</label>
                  <input className={styles.input} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>

                <div className={styles.dateField}>
                  <label className={styles.fieldLabel}>To Date</label>
                  <input className={styles.input} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Action</label>
                  <button type="button" className={styles.resetBtn} onClick={resetFilters}>
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            {filteredRequests.length === 0 ? (
              <div className={styles.tableCard}>
                <div className={styles.emptyWrap}>
                  <EmptyState
                    title="No leave requests found."
                    description="Try adjusting your search criteria or date filters."
                    actionLabel="Reset Filters"
                    onAction={resetFilters}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Leave ID</th>
                        <th>Employee</th>
                        <th>Client & Site</th>
                        <th>Leave Type</th>
                        <th>Duration</th>
                        <th>Days</th>
                        <th>Manpower Impact</th>
                        <th>Current Approver</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRequests.map((request) => {
                        const siteSnapshot = request.siteManpower || INITIAL_SITE_MANPOWER[request.site];
                        const isShortage = siteSnapshot && (siteSnapshot.onDuty - 1) < siteSnapshot.minimumRequired;

                        return (
                          <tr key={request.id}>
                            <td>
                              <span className={styles.leaveIdText}>{request.id}</span>
                            </td>
                            <td>
                              <div className={styles.employeeCell}>
                                <div className={styles.employeeAvatar}>
                                  {request.initials || request.employeeName?.slice(0, 2).toUpperCase()}
                                </div>
                                <div className={styles.empInfo}>
                                  <span className={styles.employeeName}>{request.employeeName}</span>
                                  <span className={styles.employeeId}>{request.employeeId}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className={styles.clientCell}>
                                <span className={styles.clientText}>{request.clientName}</span>
                                <span className={styles.siteText}>{request.site || 'Site Post A'}</span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.typeCell}>
                                <span className={styles.typeText}>{request.leaveType}</span>
                                <span className={request.category === 'Paid' ? styles.paidBadge : styles.unpaidBadge}>
                                  {request.category || 'Paid'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.durationCell}>
                                <span className={styles.dateText}>{formatDate(request.fromDate)} - {formatDate(request.toDate)}</span>
                                <span className={styles.durationTypeText}>{request.durationType || 'Full Day'}</span>
                              </div>
                            </td>
                            <td className={styles.daysText}>
                              <strong>{request.days} d</strong>
                            </td>
                            <td>
                              {isShortage ? (
                                <span className={styles.manpowerWarnPill} title="May reduce duty guards below minimum">
                                  <ShieldAlert size={12} />
                                  <span>Shortage Risk</span>
                                </span>
                              ) : (
                                <span className={styles.manpowerOkPill}>
                                  <CheckCircle2 size={12} />
                                  <span>Adequate</span>
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={styles.approverText}>
                                {request.currentApprover || 'HR Operations'}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={request.status.toLowerCase().includes('pending') ? 'pending' : request.status.toLowerCase()} />
                            </td>
                            <td className={styles.actionCell}>
                              <div className={styles.actionBtnsRow}>
                                <button
                                  type="button"
                                  className={styles.viewBtn}
                                  onClick={() => setSelectedLeave(request)}
                                  title="Review Details & Timeline"
                                >
                                  <Eye size={14} />
                                  <span>Review</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredRequests.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  label="leave requests"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Employee Balances & Policy */}
        {activeTab === 'balances' && (
          <EmployeeLeavePolicySection
            employeeBalances={employeeBalances}
            clients={clients}
            departments={mockDepartments}
            onAssignPolicyClick={(emp) => setPolicyAssignModalState({ isOpen: true, employee: emp })}
            onViewEmployeeLedger={(emp) => showToast(`Opening ledger for ${emp.employeeName}`)}
          />
        )}

        {/* TAB 3: Leave Master */}
        {activeTab === 'master' && (
          <LeaveMasterSection
            leaveTypes={leaveTypes}
            onAddClick={() => setLeaveTypeModalState({ isOpen: true, mode: 'add', data: null })}
            onEditClick={(type) => setLeaveTypeModalState({ isOpen: true, mode: 'edit', data: type })}
            onViewClick={(type) => setLeaveTypeModalState({ isOpen: true, mode: 'view', data: type })}
            onToggleStatus={handleToggleLeaveTypeStatus}
          />
        )}

        {/* TAB 4: Calendar */}
        {activeTab === 'calendar' && (
          <LeaveCalendar requests={leaveRequests} />
        )}

        {/* Leave Approval Drawer */}
        <LeaveApprovalDrawer
          selectedLeave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onSupervisorApprove={handleSupervisorApprove}
          onHrApprove={handleHrApprove}
          onRejectClick={(req) => setReasonModalState({ isOpen: true, type: 'reject', request: req })}
          onSendBackClick={(req) => setReasonModalState({ isOpen: true, type: 'send_back', request: req })}
        />

        {/* Rejection / Send Back Reason Modal */}
        <LeaveReasonModal
          isOpen={reasonModalState.isOpen}
          type={reasonModalState.type}
          request={reasonModalState.request}
          onClose={() => setReasonModalState({ isOpen: false, type: 'reject', request: null })}
          onConfirm={reasonModalState.type === 'reject' ? handleConfirmReject : handleConfirmSendBack}
        />

        {/* Add/Edit Leave Type Modal */}
        <LeaveTypeModal
          isOpen={leaveTypeModalState.isOpen}
          mode={leaveTypeModalState.mode}
          initialData={leaveTypeModalState.data}
          onClose={() => setLeaveTypeModalState({ isOpen: false, mode: 'add', data: null })}
          onSave={handleSaveLeaveType}
        />

        {/* Assign Leave Policy Modal */}
        <LeavePolicyAssignModal
          isOpen={policyAssignModalState.isOpen}
          initialEmployee={policyAssignModalState.employee}
          employees={employeeBalances}
          policies={INITIAL_LEAVE_POLICIES}
          onClose={() => setPolicyAssignModalState({ isOpen: false, employee: null })}
          onAssign={handleSavePolicyAssign}
        />

        {/* Apply Leave Modal */}
        {isApplyModalOpen && (
          <LeaveApplicationModal
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            onSubmit={handleApplyLeaveSubmit}
            employees={employeeBalances}
            leaveTypes={leaveTypes}
            employeeBalances={employeeBalances}
          />
        )}

        {/* Export Modal */}
        <LeaveExportModal
          open={exportModalOpen}
          filters={exportFilters}
          onClose={() => setExportModalOpen(false)}
          onExport={onExport}
          setExportFilters={setExportFilters}
          clients={clients}
          departments={mockDepartments}
          leaveTypes={leaveTypes}
        />
      </div>
    </AdminLayout>
  );
}
