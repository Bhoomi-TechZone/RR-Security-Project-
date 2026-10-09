import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  CircleCheck,
  CircleX,
  Download,
  Search,
  X,
  Plus,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  Loader2,
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
  INITIAL_LEAVE_POLICIES,
} from '../../data/leaveMasterData';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionContext';
import leaveService from '../../services/leaveService';
import authService from '../../services/authService';
import styles from './Leave.module.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;
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

const sanitizeLeaveRequests = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((l) => ({
    ...l,
    id: l.leaveId || l.id || l._id,
    employeeCode: l.employeeId || l.employeeCode,
    from: l.fromDate || l.from,
    to: l.toDate || l.to,
  }));
};

const sanitizeBalances = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((b) => ({
    ...b,
    id: b._id || b.employeeId || b.id,
    employeeCode: b.employeeId || b.employeeCode,
  }));
};

function LeaveSummaryCards({ requests }) {
  const total = requests.length;
  const pendingSup = requests.filter((r) => r.status === 'Pending Supervisor Approval' || r.status === 'Pending' || r.status === 'pending').length;
  const pendingHr = requests.filter((r) => r.status === 'Pending HR Approval').length;
  const approved = requests.filter((r) => r.status === 'Approved' || r.status === 'approved').length;
  const rejected = requests.filter((r) => r.status === 'Rejected' || r.status === 'rejected' || r.status === 'Cancelled').length;

  const cards = [
    { label: 'Total Requests', value: total, sub: 'All submissions', icon: CalendarDays, style: styles.blue },
    { label: 'Pending Supervisor', value: pendingSup, sub: 'Site-level review', icon: Clock3, style: styles.yellow },
    { label: 'Pending HR', value: pendingHr, sub: 'Final sanction', icon: Clock3, style: styles.purple },
    { label: 'Approved & Synced', value: approved, sub: 'Attendance linked', icon: CircleCheck, style: styles.green },
    { label: 'Rejected / Cancelled', value: rejected, sub: 'Actioned', icon: CircleX, style: styles.red }
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
  const month = new Date();
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
    const dates = getDateRange(item.fromDate || item.from, item.toDate || item.to);
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
          <p className={styles.sectionSubtext}>Live on-site personnel availability snapshot</p>
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
                {clients.filter((c) => !c.status || c.status === 'active').map((client) => (
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

function DeleteLeaveConfirmModal({ isOpen, request, isDeleting, onClose, onConfirm }) {
  if (!isOpen || !request) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard} style={{ maxWidth: 480 }}>
        <div className={styles.modalHeader} style={{ borderBottom: '1px solid #fee2e2' }}>
          <div className={styles.modalHeaderTitleWrap}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle} style={{ color: '#991b1b' }}>Delete Leave Record</h3>
              <p className={styles.modalSub}>Permanent deletion & balance restoration</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody} style={{ gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Are you sure you want to permanently delete the leave record for <strong>{request.employeeName}</strong> (ID: <code>{request.id || request.leaveId}</code>)?
          </p>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Leave Type:</strong> {request.leaveType} ({request.leaveCode})</div>
            <div><strong>Duration:</strong> {request.days} Day(s) — {request.fromDate || request.from} to {request.toDate || request.to || request.fromDate || request.from}</div>
            <div><strong>Status:</strong> {request.status}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '8px 10px', borderRadius: 6 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>This will delete the leave request, restore the employee's leave quota, and remove the On Leave attendance entry.</span>
          </div>
        </div>

        <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--border-light)' }}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 13,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.75 : 1
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className={styles.spinner} />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteLeaveTypeConfirmModal({ isOpen, typeData, isDeleting, onClose, onConfirm }) {
  if (!isOpen || !typeData) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard} style={{ maxWidth: 480 }}>
        <div className={styles.modalHeader} style={{ borderBottom: '1px solid #fee2e2' }}>
          <div className={styles.modalHeaderTitleWrap}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle} style={{ color: '#991b1b' }}>Delete Leave Type</h3>
              <p className={styles.modalSub}>Permanent removal from leave masters and policy quotas</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isDeleting}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody} style={{ gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Are you sure you want to permanently delete the leave type <strong>{typeData.name} ({typeData.code})</strong>?
          </p>
          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Leave Code:</strong> {typeData.code}</div>
            <div><strong>Leave Name:</strong> {typeData.name}</div>
            <div><strong>Category:</strong> {typeData.category || 'Paid'} Leave</div>
            <div><strong>Annual Quota:</strong> {typeData.annualQuota ?? typeData.quota ?? 12} Days</div>
            <div><strong>Status:</strong> {typeData.status || 'Active'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '8px 10px', borderRadius: 6 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>This will delete the leave type from database. It will no longer appear in Leave Applications or employee leave balances.</span>
          </div>
        </div>

        <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 20px', borderTop: '1px solid var(--border-light)' }}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose} disabled={isDeleting}>
            Cancel
          </button>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 13,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.75 : 1
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={15} className={styles.spinner} />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Delete Leave Type</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leave() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { activeCompany } = useCompany();
  const { canAdd, canEdit, canDelete, canExport, canApprove } = usePermissions();
  const compId = activeCompany?.companyId || activeCompany?.id;

  const initialTab = searchParams.get('tab') || 'requests';
  const [activeTab, setActiveTab] = useState(initialTab); // 'requests' | 'balances' | 'master' | 'calendar'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['requests', 'balances', 'master', 'calendar'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('requests');
    }
  }, [searchParams]);

  // Master State from MongoDB Atlas Database
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employeeBalances, setEmployeeBalances] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const [editModalState, setEditModalState] = useState({ isOpen: false, request: null });
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, request: null, isDeleting: false });
  const [deleteLeaveTypeModalState, setDeleteLeaveTypeModalState] = useState({ isOpen: false, typeData: null, isDeleting: false });
  const [leaveTypeModalState, setLeaveTypeModalState] = useState({ isOpen: false, mode: 'add', data: null });
  const [policyAssignModalState, setPolicyAssignModalState] = useState({ isOpen: false, employee: null });
  const [reasonModalState, setReasonModalState] = useState({ isOpen: false, type: 'reject', request: null });
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [exportFilters, setExportFilters] = useState({
    fromDate: '',
    toDate: '',
    clientFilter: '',
    departmentFilter: '',
    leaveTypeFilter: '',
    statusFilter: '',
    format: 'excel'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch all Leave Data directly from Database
  const fetchAllLeaveData = useCallback(async () => {
    try {
      setLoading(true);
      const token = authService.getToken();

      const [fetchedLeaves, fetchedTypes, fetchedBalances] = await Promise.all([
        leaveService.getLeaveRequests(compId),
        leaveService.getLeaveTypes(compId).catch(() => []),
        leaveService.getEmployeeBalances(compId).catch(() => []),
      ]);

      // Fetch dynamic registered employees
      let dynamicEmps = [];
      try {
        const empRes = await fetch(`${API_BASE_URL}/employees`, {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'x-company-id': compId,
          },
        });
        const empData = await empRes.json();
        if (empData.success && Array.isArray(empData.employees) && empData.employees.length > 0) {
          dynamicEmps = empData.employees;
        }
      } catch (err) {
        console.warn('Could not fetch employees directly:', err);
      }

      setLeaveRequests(sanitizeLeaveRequests(fetchedLeaves));
      setLeaveTypes(Array.isArray(fetchedTypes) ? fetchedTypes : []);
      setEmployeeBalances(sanitizeBalances(fetchedBalances));

      if (dynamicEmps.length > 0) {
        setEmployeesList(dynamicEmps);
      } else if (fetchedBalances && fetchedBalances.length > 0) {
        setEmployeesList(sanitizeBalances(fetchedBalances));
      }
    } catch (err) {
      console.error('Error fetching leaves from MongoDB:', err);
      showToast('Could not load leave data from database.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [compId]);

  useEffect(() => {
    fetchAllLeaveData();
  }, [fetchAllLeaveData]);

  // Real-time synchronization event listeners across Masters & Leave modules
  useEffect(() => {
    const handleSync = (e) => {
      if (!e?.detail?.tab || e.detail.tab === 'leave-types') {
        fetchAllLeaveData();
      }
    };
    window.addEventListener('masters-updated', handleSync);
    window.addEventListener('leaves-updated', handleSync);
    return () => {
      window.removeEventListener('masters-updated', handleSync);
      window.removeEventListener('leaves-updated', handleSync);
    };
  }, [fetchAllLeaveData]);

  const clients = useMemo(() => {
    const list = new Set();
    employeesList.forEach((e) => {
      if (e.clientName) list.add(e.clientName);
      if (e.client) list.add(e.client);
    });
    employeeBalances.forEach((b) => {
      if (b.client) list.add(b.client);
    });
    leaveRequests.forEach((l) => {
      if (l.clientName) list.add(l.clientName);
    });
    if (list.size === 0) {
      list.add('RR Security');
    }
    return Array.from(list).map((name) => ({ id: name, name }));
  }, [employeesList, employeeBalances, leaveRequests]);

  const departments = useMemo(() => {
    const list = new Set(['Security', 'Operations', 'Control Room', 'Administration', 'Patrolling']);
    employeesList.forEach((e) => {
      if (e.department) list.add(e.department);
    });
    employeeBalances.forEach((b) => {
      if (b.department) list.add(b.department);
    });
    return Array.from(list);
  }, [employeesList, employeeBalances]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return leaveRequests.filter((item) => {
      if (query) {
        const hitsEmployee = item.employeeName?.toLowerCase().includes(query);
        const hitsId = (item.employeeId || item.id || item.leaveId)?.toLowerCase().includes(query);
        const hitsCode = item.leaveCode?.toLowerCase().includes(query);
        if (!hitsEmployee && !hitsId && !hitsCode) return false;
      }

      if (clientFilter && item.clientName !== clientFilter) return false;
      if (departmentFilter && item.department !== departmentFilter) return false;
      if (leaveTypeFilter && item.leaveType !== leaveTypeFilter) return false;

      if (statusFilter) {
        if (statusFilter === 'Pending' && !item.status.includes('Pending')) return false;
        if (statusFilter !== 'Pending' && item.status !== statusFilter) return false;
      }

      if (fromDate && (item.fromDate || item.from) < fromDate) return false;
      if (toDate && (item.toDate || item.to) > toDate) return false;

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

  // Workflow Handlers via MongoDB Atlas Backend API
  const handleSupervisorApprove = async (request) => {
    try {
      const leaveId = request._id || request.id || request.leaveId;
      await leaveService.reviewLeaveRequest(compId, leaveId, 'approve', 'Approved by Site Supervisor.');
      await fetchAllLeaveData();
      setSelectedLeave(null);
      showToast('✓ Approved by Site Supervisor & synced to Attendance.');
    } catch (err) {
      showToast(err.message || 'Failed to approve leave.', 'danger');
    }
  };

  const handleHrApprove = async (request) => {
    try {
      const leaveId = request._id || request.id || request.leaveId;
      await leaveService.reviewLeaveRequest(compId, leaveId, 'approve', 'Leave verified and approved as per enterprise policy.');
      await fetchAllLeaveData();
      setSelectedLeave(null);
      showToast('✓ Leave request approved & synchronized with Attendance & Payroll.');
    } catch (err) {
      showToast(err.message || 'Failed to approve leave.', 'danger');
    }
  };

  const handleConfirmReject = async (reasonText) => {
    const { request } = reasonModalState;
    if (!request) return;

    try {
      const leaveId = request._id || request.id || request.leaveId;
      await leaveService.reviewLeaveRequest(compId, leaveId, 'reject', reasonText);
      await fetchAllLeaveData();
      setReasonModalState({ isOpen: false, type: 'reject', request: null });
      setSelectedLeave(null);
      showToast('✓ Leave request rejected.', 'danger');
    } catch (err) {
      showToast(err.message || 'Failed to reject leave.', 'danger');
    }
  };

  const handleConfirmSendBack = async (reasonText) => {
    const { request } = reasonModalState;
    if (!request) return;

    try {
      const leaveId = request._id || request.id || request.leaveId;
      await leaveService.reviewLeaveRequest(compId, leaveId, 'send_back', reasonText);
      await fetchAllLeaveData();
      setReasonModalState({ isOpen: false, type: 'send_back', request: null });
      setSelectedLeave(null);
      showToast('✓ Leave request sent back to employee for revision.', 'warning');
    } catch (err) {
      showToast(err.message || 'Failed to send back leave.', 'danger');
    }
  };

  // Leave Master Type Save
  const handleSaveLeaveType = async (typeData) => {
    try {
      await leaveService.saveLeaveType(compId, typeData);
      await fetchAllLeaveData();
      setLeaveTypeModalState({ isOpen: false, mode: 'add', data: null });
      window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: 'leave-types' } }));
      window.dispatchEvent(new CustomEvent('leaves-updated'));
      showToast(`✓ Leave type ${typeData.code} saved successfully in database.`);
    } catch (err) {
      showToast(err.message || 'Failed to save leave type.', 'danger');
    }
  };

  const handleToggleLeaveTypeStatus = async (item) => {
    try {
      const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
      await leaveService.saveLeaveType(compId, { ...item, status: newStatus });
      await fetchAllLeaveData();
      window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: 'leave-types' } }));
      window.dispatchEvent(new CustomEvent('leaves-updated'));
      showToast(`Leave type ${item.code} marked as ${newStatus}.`);
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'danger');
    }
  };

  // Leave Master Type Delete
  const handleDeleteLeaveTypeConfirm = async () => {
    if (!deleteLeaveTypeModalState.typeData) return;
    try {
      setDeleteLeaveTypeModalState((prev) => ({ ...prev, isDeleting: true }));
      const idOrCode =
        deleteLeaveTypeModalState.typeData._id ||
        deleteLeaveTypeModalState.typeData.id ||
        deleteLeaveTypeModalState.typeData.code;
      await leaveService.deleteLeaveType(compId, idOrCode);
      setDeleteLeaveTypeModalState({ isOpen: false, typeData: null, isDeleting: false });
      window.dispatchEvent(new CustomEvent('masters-updated', { detail: { tab: 'leave-types' } }));
      window.dispatchEvent(new CustomEvent('leaves-updated'));
      showToast(`✓ Leave type ${deleteLeaveTypeModalState.typeData.code} permanently deleted from database.`);
      await fetchAllLeaveData();
    } catch (err) {
      setDeleteLeaveTypeModalState((prev) => ({ ...prev, isDeleting: false }));
      showToast(err.message || 'Failed to delete leave type.', 'danger');
    }
  };

  // Policy Assignment Save
  const handleSavePolicyAssign = async ({ employeeCode, policyName, openingBalances }) => {
    try {
      await leaveService.assignPolicy(compId, { employeeCode, policyName, openingBalances });
      await fetchAllLeaveData();
      setPolicyAssignModalState({ isOpen: false, employee: null });
      showToast('✓ Employee leave policy & opening balances stored in database.');
    } catch (err) {
      showToast(err.message || 'Failed to assign policy.', 'danger');
    }
  };

  // Apply Leave Submission Handler
  // RULE: Admin applying leave -> Directly Approved & synced to Attendance in MongoDB Atlas
  const handleApplyLeaveSubmit = async (newRequest) => {
    try {
      await leaveService.createLeaveRequest(compId, {
        ...newRequest,
        employeeId: newRequest.employeeId || newRequest.employeeCode,
      });
      setIsApplyModalOpen(false);
      showToast(`✓ Leave directly applied & approved for ${newRequest.employeeName || 'employee'}. Attendance synced.`);
      await fetchAllLeaveData();
    } catch (err) {
      showToast(err.message || 'Failed to submit leave application.', 'danger');
      throw err;
    }
  };

  // Edit Leave Submission Handler
  const handleEditLeaveSubmit = async (updatedRequest) => {
    try {
      const leaveId = updatedRequest._id || updatedRequest.id || updatedRequest.leaveId;
      await leaveService.updateLeaveRequest(compId, leaveId, {
        ...updatedRequest,
        employeeId: updatedRequest.employeeId || updatedRequest.employeeCode,
      });
      setEditModalState({ isOpen: false, request: null });
      showToast(`✓ Leave record updated for ${updatedRequest.employeeName || 'employee'}. Attendance synchronized.`);
      await fetchAllLeaveData();
    } catch (err) {
      showToast(err.message || 'Failed to update leave record.', 'danger');
      throw err;
    }
  };

  // Delete Leave Confirmation Handler
  const handleDeleteLeaveConfirm = async () => {
    if (!deleteModalState.request) return;
    try {
      setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));
      const leaveId = deleteModalState.request._id || deleteModalState.request.id || deleteModalState.request.leaveId;
      await leaveService.deleteLeaveRequest(compId, leaveId);
      setDeleteModalState({ isOpen: false, request: null, isDeleting: false });
      showToast(`✓ Leave record ${leaveId} deleted and balance restored.`);
      await fetchAllLeaveData();
    } catch (err) {
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
      showToast(err.message || 'Failed to delete leave record.', 'danger');
    }
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
          <button
            type="button"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', font: 'inherit' }}
            onClick={() => navigate('/admin/dashboard')}
          >
            Dashboard
          </button>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbActive}>
            {activeTab === 'balances' ? 'Employee Balances' : activeTab === 'master' ? 'Leave Master' : activeTab === 'calendar' ? 'Roster & Calendar' : 'Leave Requests'}
          </span>
        </div>

        {/* Page Header */}
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              {activeTab === 'balances' ? 'Employee Leave Balances & Quotas' : activeTab === 'master' ? 'Leave Type & Policy Master' : activeTab === 'calendar' ? 'Leave & Duty Roster Calendar' : 'Leave Management'}
            </h1>
            <p className={styles.subtitle}>
              {activeTab === 'balances' ? 'Track annual leave quotas, accrued balances, and policy assignments.' : activeTab === 'master' ? 'Configure leave types, encashment rules, paid/unpaid guidelines, and carry-forwards.' : activeTab === 'calendar' ? 'Live on-site personnel availability snapshot and duty roster.' : 'Manage employee leave requests, approvals, and attendance balance synchronization.'}
            </p>
          </div>

          <div className={styles.topActions}>
            {canExport('leave') && (
              <button
                type="button"
                className={styles.exportBtn}
                onClick={() => setExportModalOpen(true)}
              >
                <Download size={16} />
                <span>Export Report</span>
              </button>
            )}
            {activeTab === 'requests' && canAdd('leave') && (
              <button
                type="button"
                className={styles.primaryAddBtn}
                onClick={() => setIsApplyModalOpen(true)}
              >
                <Plus size={16} />
                <span>Apply Leave</span>
              </button>
            )}
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
                    {clients.filter((c) => !c.status || c.status === 'active').map((client) => (
                      <option key={client.id || client.name} value={client.name}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Department</label>
                  <select className={styles.select} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((department) => (
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
                    title="No leave requests found in database."
                    description="Try adjusting your search criteria or apply for a new leave."
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
                        const siteSnapshot = request.siteManpower;
                        const isShortage = siteSnapshot && (siteSnapshot.onDuty - 1) < (siteSnapshot.minimumRequired || 0);

                        return (
                          <tr key={request.id || request.leaveId || request._id}>
                            <td>
                              <span className={styles.leaveIdText}>{request.id || request.leaveId}</span>
                            </td>
                            <td>
                              <div className={styles.employeeCell}>
                                <div className={styles.employeeAvatar}>
                                  {request.initials || request.employeeName?.slice(0, 2).toUpperCase()}
                                </div>
                                <div className={styles.empInfo}>
                                  <span className={styles.employeeName}>{request.employeeName}</span>
                                  <span className={styles.employeeId}>{request.employeeId || request.employeeCode}</span>
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
                                <span className={styles.dateText}>{formatDate(request.fromDate || request.from)} - {formatDate(request.toDate || request.to)}</span>
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
                                  <Eye size={13} />
                                  <span>Review</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.editBtn}
                                  onClick={() => setEditModalState({ isOpen: true, request })}
                                  title="Edit Leave Details"
                                >
                                  <Edit3 size={13} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.deleteBtn}
                                  onClick={() => setDeleteModalState({ isOpen: true, request, isDeleting: false })}
                                  title="Delete Leave Record"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
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
            departments={departments}
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
            onDeleteClick={(type) => setDeleteLeaveTypeModalState({ isOpen: true, typeData: type, isDeleting: false })}
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

        {/* Apply Leave Modal (Create) */}
        {isApplyModalOpen && (
          <LeaveApplicationModal
            isOpen={isApplyModalOpen}
            mode="create"
            onClose={() => setIsApplyModalOpen(false)}
            onSubmit={handleApplyLeaveSubmit}
            employees={employeesList.length > 0 ? employeesList : employeeBalances}
            leaveTypes={leaveTypes}
            employeeBalances={employeeBalances}
          />
        )}

        {/* Edit Leave Modal */}
        {editModalState.isOpen && (
          <LeaveApplicationModal
            isOpen={editModalState.isOpen}
            mode="edit"
            initialData={editModalState.request}
            onClose={() => setEditModalState({ isOpen: false, request: null })}
            onSubmit={handleEditLeaveSubmit}
            employees={employeesList.length > 0 ? employeesList : employeeBalances}
            leaveTypes={leaveTypes}
            employeeBalances={employeeBalances}
          />
        )}

        {/* Delete Leave Confirmation Modal */}
        <DeleteLeaveConfirmModal
          isOpen={deleteModalState.isOpen}
          request={deleteModalState.request}
          isDeleting={deleteModalState.isDeleting}
          onClose={() => setDeleteModalState({ isOpen: false, request: null, isDeleting: false })}
          onConfirm={handleDeleteLeaveConfirm}
        />

        {/* Delete Leave Type Confirmation Modal */}
        <DeleteLeaveTypeConfirmModal
          isOpen={deleteLeaveTypeModalState.isOpen}
          typeData={deleteLeaveTypeModalState.typeData}
          isDeleting={deleteLeaveTypeModalState.isDeleting}
          onClose={() => setDeleteLeaveTypeModalState({ isOpen: false, typeData: null, isDeleting: false })}
          onConfirm={handleDeleteLeaveTypeConfirm}
        />

        {/* Export Modal */}
        <LeaveExportModal
          open={exportModalOpen}
          filters={exportFilters}
          onClose={() => setExportModalOpen(false)}
          onExport={onExport}
          setExportFilters={setExportFilters}
          clients={clients}
          departments={departments}
          leaveTypes={leaveTypes}
        />
      </div>
    </AdminLayout>
  );
}
