import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Filter,
  Info,
  Plus,
  Search,
  X,
  XCircle
} from 'lucide-react';
import Toast from '../../components/common/Toast';
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import leaveService from '../../services/leaveService';
import { leaveTypeOptions } from '../../data/leaveTypes';
import { employeeLeaveBalances, currentEmployeeProfile } from '../../data/employeeLeaveData';
import { SEPARATION_REASONS } from '../../data/fnfData';
import { ApplyLeaveModal } from './MyLeave';
import EmployeeAttendanceCorrectionModal from '../../components/employee/EmployeeAttendanceCorrectionModal';
import {
  REQUEST_CATEGORIES,
  addHubRequest,
  getStoredHubRequests,
  updateHubRequestStatus
} from '../../data/requestHubData';
import styles from '../admin/HRRequestCategory.module.css';

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected'];
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const EMPLOYEE_EXIT_REASONS = (SEPARATION_REASONS || []).filter(
  (r) => r !== 'Termination' && r !== 'Absconding'
);

const CATEGORY_TYPE_CONFIG = {
  leaves: {
    label: 'Leave Type',
    allLabel: 'All Leaves',
    defaults: leaveTypeOptions
  },
  reimbursement: {
    label: 'Expense Type',
    allLabel: 'All Expense Types',
    defaults: ['Travel & Conveyance', 'Medical', 'Food & Refreshment', 'Site Operations']
  },
  'letter-request': {
    label: 'Letter Type',
    allLabel: 'All Letter Types',
    defaults: ['Salary Certificate', 'Bonafide Certificate', 'Experience Letter', 'NOC']
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
};

export default function EmployeeRequestCategory() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser() || {};
  const employeeId =
    currentUser?.employeeCode || currentUser?.employeeId || currentUser?.id || 'RRS0104';
  const employeeName =
    currentUser?.name || currentUser?.employeeName || 'Rajeshwar Dayal Singh';
  const { activeCompany } = useCompany();
  const compId = activeCompany?.id || activeCompany?._id || currentUser?.companyId || null;

  const category = useMemo(
    () => REQUEST_CATEGORIES.find((cat) => cat.id === categoryId) || null,
    [categoryId]
  );

  const [allRequests, setAllRequests] = useState(() => getStoredHubRequests());
  const [moduleLeaveTypes, setModuleLeaveTypes] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isAttCorrectionOpen, setIsAttCorrectionOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [newForm, setNewForm] = useState({
    date: todayStr,
    toDate: todayStr,
    subType: '',
    amountOrValue: '',
    extraField1: '',
    extraField2: '',
    reason: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const syncFromStorage = () => {
      setAllRequests(getStoredHubRequests());
    };
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('novaspark:hub-requests-updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('novaspark:hub-requests-updated', syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!compId || categoryId !== 'leaves') return;
    let cancelled = false;
    leaveService
      .getLeaveTypes(compId)
      .then((types) => {
        if (!cancelled && Array.isArray(types)) {
          setModuleLeaveTypes(types.map((t) => t.name || t.leaveType).filter(Boolean));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [compId, categoryId]);

  const categoryRequests = useMemo(() => {
    const curId = String(employeeId || '').toLowerCase();
    return allRequests.filter((req) => {
      if (req.categoryId !== categoryId) return false;
      const rId = String(req.employeeId || '').toLowerCase();
      return !curId || rId === curId || rId === 'rrs0104' || rId.startsWith('rrs');
    });
  }, [allRequests, categoryId, employeeId]);

  const typeConfig = CATEGORY_TYPE_CONFIG[categoryId] || null;

  const typeOptions = useMemo(() => {
    if (!typeConfig) return [];
    const fromModule = categoryId === 'leaves' ? moduleLeaveTypes : [];
    const fromRequests = categoryRequests
      .map(
        (r) =>
          r.details?.['Leave Type'] ||
          r.details?.['Expense Type'] ||
          r.details?.['Letter Type']
      )
      .filter(Boolean);
    const set = new Set([...fromModule, ...typeConfig.defaults, ...fromRequests]);
    return ['All', ...Array.from(set)];
  }, [categoryId, typeConfig, moduleLeaveTypes, categoryRequests]);

  const filteredRequests = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    return categoryRequests.filter((req) => {
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (typeFilter !== 'All') {
        const subType = String(
          req.details?.['Leave Type'] ||
            req.details?.['Expense Type'] ||
            req.details?.['Letter Type'] ||
            req.details?.Item ||
            req.amountOrMetric ||
            ''
        ).toLowerCase();
        const target = typeFilter.toLowerCase();
        if (!subType.includes(target) && !target.includes(subType)) return false;
      }
      if (fromDate && req.submittedDate && req.submittedDate < fromDate) return false;
      if (toDate && req.submittedDate && req.submittedDate > toDate) return false;

      if (!q) return true;
      return (
        String(req.id || '').toLowerCase().includes(q) ||
        String(req.summary || '').toLowerCase().includes(q) ||
        String(req.reason || '').toLowerCase().includes(q)
      );
    });
  }, [categoryRequests, typeFilter, statusFilter, fromDate, toDate, appliedSearch]);

  const visibleRequests = useMemo(
    () => filteredRequests.slice(0, pageSize),
    [filteredRequests, pageSize]
  );

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
  };

  const handleNewRequest = () => {
    if (!category) return;
    if (categoryId === 'leaves') {
      setIsApplyLeaveOpen(true);
      return;
    }
    if (categoryId === 'attendance-correction') {
      setIsAttCorrectionOpen(true);
      return;
    }
    const defaultLwd = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();
    const defaultSubTypeMap = {
      'reimbursement': 'Travel & Conveyance',
      'letter-request': 'Salary Certificate',
      'time-relaxation': 'Late Arrival',
      'it-declaration': 'Old Tax Regime',
      'shift-change': 'Morning Shift (08 AM – 08 PM)',
      'overtime': 'Night Shift',
      'loans': 'Personal Loan',
      'comp-off': '1 Day',
      'asset-requisition': 'Equipment',
      'uniform': 'Uniform Set',
      'resignation': ''
    };
    setNewForm({
      date: todayStr,
      toDate: categoryId === 'resignation' ? defaultLwd : todayStr,
      subType: defaultSubTypeMap[categoryId] || '',
      amountOrValue:
        categoryId === 'time-relaxation'
          ? '30 Minutes'
          : categoryId === 'loans'
          ? '6 Months'
          : categoryId === 'asset-requisition' || categoryId === 'uniform'
          ? '1'
          : '',
      extraField1:
        categoryId === 'attendance-correction'
          ? '09:00'
          : categoryId === 'shift-change'
          ? 'Night Shift (08 PM – 08 AM)'
          : categoryId === 'uniform'
          ? 'L / Navy Blue'
          : categoryId === 'overtime'
          ? currentUser?.site || currentEmployeeProfile.site
          : categoryId === 'letter-request'
          ? 'Signed PDF'
          : '',
      extraField2:
        categoryId === 'attendance-correction'
          ? '18:00'
          : categoryId === 'letter-request'
          ? 'Normal'
          : '',
      reason: ''
    });
    setShowNewModal(true);
  };

  const resignationTimelineText = useMemo(() => {
    if (categoryId !== 'resignation' || !newForm.date || !newForm.toDate) return '';
    const d1 = new Date(`${newForm.date}T00:00:00`);
    const d2 = new Date(`${newForm.toDate}T00:00:00`);
    const diff = Math.round((d2 - d1) / 86400000);
    if (diff < 0) return 'Last working date cannot be before resignation date';
    if (diff >= 30) return `Serving ${diff} days notice (Full Notice Completed)`;
    return `Serving ${diff} days notice (Shortfall of ${30 - diff} days)`;
  }, [categoryId, newForm.date, newForm.toDate]);

  const handleSubmitNewRequest = (e) => {
    e.preventDefault();
    if (!category) return;
    if (categoryId === 'resignation') {
      if (!newForm.subType) {
        showToast('Please choose a reason of exit.', 'error');
        return;
      }
      if (newForm.toDate < newForm.date) {
        showToast('Last working date cannot be before resignation date.', 'error');
        return;
      }
    } else if (!newForm.reason.trim()) {
      showToast('Please enter reason / remarks.', 'error');
      return;
    }

    const rand = Math.floor(1000 + Math.random() * 8999);
    const id = `REQ-${category.shortTitle.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase()}-${rand}`;
    let summary = `${category.title} Request`;
    let amountOrMetric = newForm.amountOrValue.trim() || category.shortTitle;
    let priority = 'Normal';
    let details = { Date: formatDate(newForm.date) };

    if (categoryId === 'attendance-correction') {
      summary = `Attendance Correction on ${formatDate(newForm.date)} (${newForm.extraField1 || '09:00'} → ${newForm.extraField2 || '18:00'})`;
      amountOrMetric = 'Regularisation';
      details = {
        Date: formatDate(newForm.date),
        'Requested In': newForm.extraField1 || '09:00',
        'Requested Out': newForm.extraField2 || '18:00'
      };
    } else if (categoryId === 'time-relaxation') {
      summary = `${newForm.subType} Relaxation (${newForm.amountOrValue || '30 Minutes'}) on ${formatDate(newForm.date)}`;
      amountOrMetric = newForm.amountOrValue || '30 Minutes';
      details = {
        Date: formatDate(newForm.date),
        'Relaxation Type': newForm.subType,
        'Duration Requested': amountOrMetric
      };
    } else if (categoryId === 'leave-encashment') {
      const days = newForm.amountOrValue.trim() || '5';
      summary = `Earned Leave (EL) Encashment – ${days} Days`;
      amountOrMetric = `${days} Days`;
      details = {
        'Leave Type': 'Earned Leave (EL)',
        'Encash Days': `${days} Days`
      };
    } else if (categoryId === 'comp-off') {
      summary = `Comp Off (${newForm.subType || '1 Day'}) for Duty on ${formatDate(newForm.date)}`;
      amountOrMetric = newForm.subType || '1 Day';
      details = {
        'Worked On': formatDate(newForm.date),
        'Avail Date': formatDate(newForm.toDate),
        'Comp Off Days': amountOrMetric
      };
    } else if (categoryId === 'overtime') {
      const hrs = Number(newForm.amountOrValue || 2);
      const otPay = hrs * 150;
      summary = `${hrs} hrs Overtime on ${newForm.subType || 'Day Shift'} (${formatDate(newForm.date)})`;
      amountOrMetric = `${hrs} hrs`;
      details = {
        Date: formatDate(newForm.date),
        Shift: newForm.subType || 'Day Shift',
        'Site / Post': newForm.extraField1 || currentEmployeeProfile.site,
        'OT Hours': `${hrs} hrs (@ ₹150/hr = ₹${otPay})`
      };
    } else if (categoryId === 'shift-change') {
      summary = `Shift Change: ${newForm.extraField1.split('(')[0].trim()} → ${newForm.subType.split('(')[0].trim()}`;
      amountOrMetric = 'Shift Swap';
      details = {
        'Current Shift': newForm.extraField1,
        'Requested Shift': newForm.subType,
        'Effective Period': `${formatDate(newForm.date)} – ${formatDate(newForm.toDate)}`,
        ...(newForm.extraField2 ? { 'Swap Colleague': newForm.extraField2 } : {})
      };
    } else if (categoryId === 'week-off-change') {
      summary = `Week Off Change: ${formatDate(newForm.date)} → ${formatDate(newForm.toDate)}`;
      amountOrMetric = '1 Day Swap';
      details = {
        'Current Week Off': formatDate(newForm.date),
        'Requested Week Off': formatDate(newForm.toDate),
        ...(newForm.extraField1 ? { 'Reliever Guard': newForm.extraField1 } : {})
      };
    } else if (categoryId === 'loans') {
      const amt = newForm.extraField1.trim() || '10000';
      const tenure = newForm.amountOrValue || '6 Months';
      summary = `${newForm.subType || 'Loan'} ₹${amt} (${tenure})`;
      amountOrMetric = `₹${amt}`;
      details = {
        'Loan Type': newForm.subType || 'Personal Loan',
        'Loan Principal': `₹${amt}`,
        Tenure: tenure
      };
    } else if (categoryId === 'reimbursement') {
      const amt = newForm.amountOrValue.trim() || '0';
      summary = `${newForm.subType}${newForm.extraField1 ? ` – ${newForm.extraField1.trim()}` : ''}`;
      amountOrMetric = `₹${amt}`;
      details = {
        'Expense Date': formatDate(newForm.date),
        'Expense Type': newForm.subType,
        'Merchant / Vendor': newForm.extraField1.trim() || '—',
        'Claimed Amount': amountOrMetric,
        'Bill / Receipt': newForm.extraField2.trim() || 'Attached'
      };
    } else if (categoryId === 'it-declaration') {
      const amt = newForm.amountOrValue.trim() || '0';
      summary = `Form 12BB FY 2026-27 (${newForm.subType})`;
      amountOrMetric = `₹${amt}`;
      details = {
        Regime: newForm.subType,
        'Declared Deductions': amountOrMetric
      };
    } else if (categoryId === 'bank-change') {
      const masked = newForm.extraField1 ? `XXXX XXXX ${newForm.extraField1.slice(-4)}` : 'XXXX';
      summary = `Salary Account Update: ${newForm.extraField2 || 'Bank'} (${masked})`;
      amountOrMetric = 'Bank Update';
      details = {
        'New Bank': newForm.extraField2 || '—',
        'Account No': masked,
        'IFSC Code': (newForm.amountOrValue || '—').toUpperCase()
      };
    } else if (categoryId === 'asset-requisition') {
      const qty = newForm.amountOrValue.trim() || '1';
      summary = `${newForm.extraField1.trim() || 'Field Equipment'} – Qty ${qty}`;
      amountOrMetric = `${qty} Unit`;
      details = {
        Item: newForm.extraField1.trim() || 'Field Equipment',
        Category: newForm.subType || 'Equipment',
        Quantity: qty
      };
    } else if (categoryId === 'uniform') {
      const qty = newForm.amountOrValue.trim() || '1';
      summary = `${newForm.subType || 'Uniform Set'} (${newForm.extraField1 || 'Standard'}) – Qty ${qty}`;
      amountOrMetric = `${qty} Pcs`;
      details = {
        Item: newForm.subType || 'Uniform Set',
        'Size / Color': newForm.extraField1 || 'L / Navy Blue',
        Quantity: qty
      };
    } else if (categoryId === 'letter-request') {
      summary = `${newForm.subType} Request`;
      amountOrMetric = 'Official Letter';
      priority = newForm.extraField2 || 'Normal';
      details = {
        'Letter Type': newForm.subType,
        'Delivery Format': newForm.extraField1 || 'Signed PDF',
        Priority: newForm.extraField2 || 'Normal',
        Purpose: newForm.reason.trim()
      };
    } else if (categoryId === 'transfer-request') {
      summary = `Site Transfer → ${newForm.extraField1.trim() || 'Preferred Site'}`;
      amountOrMetric = 'Site Change';
      details = {
        'Current Site': currentUser?.site || 'Main Site',
        'Preferred Site': newForm.extraField1.trim() || '—',
        'Preferred Date': formatDate(newForm.date)
      };
    } else if (categoryId === 'resignation') {
      const d1 = new Date(`${newForm.date}T00:00:00`);
      const d2 = new Date(`${newForm.toDate}T00:00:00`);
      const served = Math.max(0, Math.round((d2 - d1) / 86400000));
      summary = `${newForm.subType} (LWD: ${formatDate(newForm.toDate)})`;
      amountOrMetric = `LWD: ${formatDate(newForm.toDate)}`;
      details = {
        'Resignation Date': formatDate(newForm.date),
        'Last Working Date': formatDate(newForm.toDate),
        'Notice Period': `30 Days (${served} Days Served)`,
        'Reason of Exit': newForm.subType
      };
    }

    const newEntry = {
      id,
      categoryId,
      categoryLabel: category.title,
      employeeId,
      employeeName,
      designation: currentUser?.designation || 'Staff Member',
      site: currentUser?.site || 'DLF CyberCity Tech Park',
      submittedDate: todayStr,
      summary,
      amountOrMetric,
      priority,
      stage: 'Pending HR / Supervisor Review',
      status: 'Pending',
      reason:
        categoryId === 'resignation'
          ? `${newForm.subType}${newForm.reason.trim() ? ` — ${newForm.reason.trim()}` : ''}`
          : newForm.reason.trim(),
      remarks: '',
      details
    };

    const updated = addHubRequest(newEntry);
    setAllRequests(updated);
    window.dispatchEvent(new Event('novaspark:hub-requests-updated'));
    setShowNewModal(false);
    showToast(`${category.title} request (${id}) submitted!`);
  };

  const handleApplyLeaveSubmit = (newReq) => {
    const id = `REQ-LVE-${Math.floor(2100 + Math.random() * 7800)}`;
    const leaveLabel = `${newReq.type} (${newReq.leaveCode})`;
    const durationText =
      newReq.from === newReq.to
        ? formatDate(newReq.from)
        : `${formatDate(newReq.from)} – ${formatDate(newReq.to)}`;
    const daysText = `${newReq.days} ${newReq.days === 1 ? 'Day' : 'Days'}${
      newReq.category === 'Paid' ? ' (Paid)' : ' (Unpaid)'
    }`;

    const newEntry = {
      id,
      categoryId: 'leaves',
      categoryLabel: 'Leaves',
      employeeId,
      employeeName,
      designation: currentUser?.designation || currentEmployeeProfile.designation,
      site: currentUser?.site || currentEmployeeProfile.site,
      submittedDate: todayStr,
      summary: `${leaveLabel} for ${newReq.days} ${newReq.days === 1 ? 'day' : 'days'} (${durationText})`,
      amountOrMetric: `${newReq.days} ${newReq.days === 1 ? 'Day' : 'Days'}`,
      priority: 'Normal',
      stage: 'Pending Supervisor Approval',
      status: 'Pending',
      reason: newReq.reason,
      remarks: newReq.remarks || '',
      details: {
        'Leave Type': leaveLabel,
        'Duration Mode': newReq.durationType,
        Duration: durationText,
        'Total Days': daysText
      }
    };

    const updated = addHubRequest(newEntry);
    setAllRequests(updated);
    window.dispatchEvent(new Event('novaspark:hub-requests-updated'));
    setIsApplyLeaveOpen(false);
    showToast(`Leave request (${id}) submitted!`);
  };

  const handleAttendanceCorrectionSubmit = (payload) => {
    const id = `REQ-ATT-${Math.floor(1100 + Math.random() * 8800)}`;
    const newEntry = {
      id,
      categoryId: 'attendance-correction',
      categoryLabel: 'Attendance Correction',
      employeeId,
      employeeName,
      designation: currentUser?.designation || currentEmployeeProfile.designation,
      site: currentUser?.site || payload.site || currentEmployeeProfile.site,
      submittedDate: todayStr,
      summary: `${payload.category} on ${formatDate(payload.date)} (${payload.requestedCheckIn} → ${payload.requestedCheckOut})`,
      amountOrMetric: payload.requestedStatus || 'Present',
      priority: 'Normal',
      stage: 'HR / Admin Review',
      status: 'Pending',
      reason: payload.reason,
      remarks: '',
      details: {
        Date: formatDate(payload.date),
        Category: payload.category,
        'Original Punch': `${payload.originalCheckIn} → ${payload.originalCheckOut}`,
        'Requested Punch': `${payload.requestedCheckIn} → ${payload.requestedCheckOut}`,
        'Requested Status': payload.requestedStatus || 'Present'
      }
    };

    const updated = addHubRequest(newEntry);
    setAllRequests(updated);
    window.dispatchEvent(new Event('novaspark:hub-requests-updated'));
    setIsAttCorrectionOpen(false);
    showToast(`Attendance correction (${id}) submitted!`);
  };

  const handleWithdrawRequest = (req) => {
    const updated = updateHubRequestStatus(
      req.id,
      'Cancelled',
      'Withdrawn by Employee',
      employeeName
    );
    setAllRequests(updated);
    window.dispatchEvent(new Event('novaspark:hub-requests-updated'));
    if (selectedRequest?.id === req.id) {
      setSelectedRequest(null);
    }
    showToast(`${req.id} withdrawn.`, 'warning');
  };

  const getStatusClass = (status) => {
    if (status === 'Approved') return styles.statusApproved;
    if (status === 'Rejected') return styles.statusRejected;
    if (status === 'Cancelled') return styles.statusCancelled;
    return styles.statusOpen;
  };

  const getSubTypeLabel = (req) =>
    req.details?.['Leave Type'] ||
    req.details?.['Expense Type'] ||
    req.details?.['Letter Type'] ||
    req.details?.Item ||
    req.amountOrMetric ||
    req.categoryLabel;

  return (
    <main style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span onClick={() => navigate('/employee/dashboard')}>Employee Portal</span>
          <span className={styles.separator}>/</span>
          <span onClick={() => navigate('/employee/requests')}>Requests</span>
          <span className={styles.separator}>/</span>
          <strong>{category ? category.title : 'Requests'}</strong>
        </nav>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.pageTitle}>
              {category ? `My ${category.title}` : 'My Requests'}
            </h1>
            <p className={styles.pageSubtitle}>
              {category ? category.employeeDesc : 'Track and manage your submitted requests.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {category && (
              <button
                type="button"
                className={styles.modalApproveBtn}
                style={{ height: 36 }}
                onClick={handleNewRequest}
              >
                <Plus size={15} />
                <span>New {category.shortTitle} Request</span>
              </button>
            )}
            <button
              type="button"
              className={styles.backToRequestsBtn}
              onClick={() => navigate('/employee/requests')}
            >
              <ArrowLeft size={15} strokeWidth={2.2} />
              <span>Back to Requests</span>
            </button>
          </div>
        </div>

        {/* Row 1: Filter Dropdowns + Date Range */}
        <div className={styles.filtersRow}>
          {typeConfig && (
            <div className={styles.filterGroup}>
              <label>{typeConfig.label}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={styles.filterSelect}
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? typeConfig.allLabel : t}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.filterGroup}>
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st === 'Pending' ? 'Open / Pending' : st}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.dateLabel}>
              <span>Date Range</span>
              <Info size={13} className={styles.infoIcon} />
            </label>
            <div className={styles.dateRangeInputs}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.dateInput}
                aria-label="From Date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.dateInput}
                aria-label="To Date"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Search + Download + Records Count */}
        <div className={styles.toolbarRow}>
          <form className={styles.searchGroup} onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value) setAppliedSearch('');
              }}
              placeholder="Search request # or reason"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>

          <div className={styles.rightControls}>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={styles.recordsSelect}
              aria-label="Records per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} records
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Request Cards List */}
        <div className={styles.cardsList}>
          {visibleRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <Filter size={32} className={styles.emptyIcon} />
              <h3>No requests found</h3>
              <p>
                {appliedSearch || statusFilter !== 'All'
                  ? 'Try adjusting your filters or submit a new request.'
                  : `You have no requests under ${category?.title || 'this category'} yet.`}
              </p>
            </div>
          ) : (
            visibleRequests.map((req) => (
              <div key={req.id} className={styles.requestCard}>
                {/* Col 1: Request # */}
                <div className={styles.colRequestNo}>
                  <span className={styles.colLabel}>Request #</span>
                  <strong className={styles.reqNumber}>{req.id}</strong>
                </div>

                {/* Col 2: Category / Date / Sub-type */}
                <div className={styles.colTypeDate}>
                  <span className={styles.colLabel}>{category?.shortTitle || 'Request'}</span>
                  <strong className={styles.dateHighlight}>{formatDate(req.submittedDate)}</strong>
                  <span className={styles.subTypeText}>{getSubTypeLabel(req)}</span>
                </div>

                {/* Col 3: Requested By */}
                <div className={styles.colRequestedBy}>
                  <span className={styles.colLabel}>Requested By</span>
                  <strong className={styles.empName}>
                    {req.employeeName} ({req.employeeId})
                  </strong>
                  <span className={styles.reasonText}>{req.reason || req.summary}</span>
                  <span className={styles.timestampText}>{formatDate(req.submittedDate)}</span>
                </div>

                {/* Col 4: Approval Status */}
                <div className={styles.colApprovalStatus}>
                  <span className={styles.colLabel}>Approval Status</span>
                  <span className={styles.stageText}>
                    {req.stage || '(No Approver Assigned)'}
                  </span>
                </div>

                {/* Col 5: Status Pill + Action Taken By */}
                <div className={styles.colStatus}>
                  <span className={`${styles.statusPill} ${getStatusClass(req.status)}`}>
                    {req.status === 'Pending' ? 'Open' : req.status}
                  </span>
                  {req.actionBy && (
                    <div className={styles.actionMeta}>
                      <span>Action taken by {req.actionBy}</span>
                      {req.actionAt && <span>{req.actionAt}</span>}
                    </div>
                  )}
                </div>

                {/* Col 6: Actions */}
                <div className={styles.colActions}>
                  <button
                    type="button"
                    className={styles.viewDetailsBtn}
                    onClick={() => setSelectedRequest(req)}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                  {req.status === 'Pending' && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleWithdrawRequest(req)}
                    >
                      <XCircle size={14} />
                      <span>Withdraw</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Details Modal */}
        {selectedRequest &&
          createPortal(
            <div className={styles.modalBackdrop} onClick={() => setSelectedRequest(null)}>
              <div
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Request Details"
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>Request Details</h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setSelectedRequest(null)}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.submittedMeta}>
                    <div className={styles.modalCategoryTitle}>
                      {category?.shortTitle || selectedRequest.categoryLabel}
                    </div>
                    <div className={styles.submittedLine}>
                      Submitted by:{' '}
                      <strong>
                        {selectedRequest.employeeName} ({selectedRequest.employeeId})
                      </strong>
                    </div>
                    <div className={styles.submittedDateLine}>
                      Submitted on: {formatDate(selectedRequest.submittedDate)}
                    </div>
                  </div>

                  <div className={styles.modalSection}>
                    <h4 className={styles.sectionLabel}>Request Details</h4>
                    <div className={styles.detailsTableWrap}>
                      <table className={styles.detailsTable}>
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.details &&
                            Object.entries(selectedRequest.details).map(([key, val]) => (
                              <tr key={key}>
                                <td>{key}</td>
                                <td>{val}</td>
                              </tr>
                            ))}
                          <tr>
                            <td>Comments</td>
                            <td>{selectedRequest.reason || selectedRequest.summary || '—'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={styles.modalSection}>
                    <h4 className={styles.sectionLabel}>Approval Workflow</h4>
                    <div className={styles.workflowBox}>
                      {selectedRequest.status === 'Pending' ? (
                        <span>{selectedRequest.stage || 'Pending Review'}</span>
                      ) : (
                        <span>
                          {selectedRequest.status}
                          {selectedRequest.actionBy
                            ? ` • Action taken by ${selectedRequest.actionBy}`
                            : ''}
                          {selectedRequest.actionAt ? ` (${selectedRequest.actionAt})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.completedActionFooter}>
                    {selectedRequest.remarks && (
                      <div className={styles.savedRemarks}>
                        <strong>Remarks:</strong> {selectedRequest.remarks}
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setSelectedRequest(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Submit New Request Modal */}
        {showNewModal &&
          createPortal(
            <div className={styles.modalBackdrop} onClick={() => setShowNewModal(false)}>
              <form
                className={styles.modalCard}
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmitNewRequest}
                role="dialog"
                aria-modal="true"
                aria-label="Submit New Request"
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>
                    {categoryId === 'resignation'
                      ? 'Separation & Exit Information'
                      : `New ${category?.title || 'Request'}`}
                  </h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setShowNewModal(false)}
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {categoryId === 'resignation' && (
                    <>
                      <div className={styles.kvGrid} style={{ padding: 0, background: 'transparent' }}>
                        <div className={styles.formGroup}>
                          <label>Resignation Date *</label>
                          <input
                            type="date"
                            required
                            className={styles.commentsInput}
                            value={newForm.date}
                            onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Last Working Date *</label>
                          <input
                            type="date"
                            required
                            className={styles.commentsInput}
                            value={newForm.toDate}
                            onChange={(e) => setNewForm({ ...newForm, toDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className={styles.takeActionBox} style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.04em' }}>
                              NOTICE PERIOD
                            </div>
                            <strong style={{ fontSize: 14, color: '#0f172a' }}>30 days</strong>
                          </div>
                          <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.04em' }}>
                              TIMELINE SUMMARY
                            </div>
                            <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                              {resignationTimelineText}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Reason of Exit *</label>
                        <select
                          required
                          className={styles.commentsInput}
                          value={newForm.subType}
                          onChange={(e) => setNewForm({ ...newForm, subType: e.target.value })}
                        >
                          <option value="">- Select -</option>
                          {EMPLOYEE_EXIT_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {(categoryId === 'reimbursement' ||
                    categoryId === 'letter-request' ||
                    categoryId === 'time-relaxation' ||
                    categoryId === 'it-declaration' ||
                    categoryId === 'shift-change' ||
                    categoryId === 'overtime' ||
                    categoryId === 'loans' ||
                    categoryId === 'comp-off' ||
                    categoryId === 'asset-requisition' ||
                    categoryId === 'uniform') && (
                    <div className={styles.formGroup}>
                      <label>
                        {categoryId === 'reimbursement'
                          ? 'Expense Type'
                          : categoryId === 'letter-request'
                          ? 'Letter Type'
                          : categoryId === 'time-relaxation'
                          ? 'Relaxation Type'
                          : categoryId === 'it-declaration'
                          ? 'Tax Regime'
                          : categoryId === 'shift-change'
                          ? 'Requested Shift'
                          : categoryId === 'overtime'
                          ? 'Shift'
                          : categoryId === 'loans'
                          ? 'Loan Type'
                          : categoryId === 'comp-off'
                          ? 'Comp Off Days'
                          : categoryId === 'asset-requisition'
                          ? 'Asset Category'
                          : categoryId === 'uniform'
                          ? 'Uniform Item'
                          : 'Notice Period'}
                      </label>
                      <select
                        className={styles.commentsInput}
                        value={newForm.subType}
                        onChange={(e) => setNewForm({ ...newForm, subType: e.target.value })}
                      >
                        {categoryId === 'reimbursement' && (
                          <>
                            <option>Travel & Conveyance</option>
                            <option>Medical</option>
                            <option>Food & Refreshment</option>
                            <option>Site Operations</option>
                          </>
                        )}
                        {categoryId === 'letter-request' && (
                          <>
                            <option>Salary Certificate</option>
                            <option>Bonafide Certificate</option>
                            <option>Experience Letter</option>
                            <option>NOC</option>
                          </>
                        )}
                        {categoryId === 'time-relaxation' && (
                          <>
                            <option>Late Arrival</option>
                            <option>Early Departure</option>
                            <option>Short Leave Grace</option>
                          </>
                        )}
                        {categoryId === 'it-declaration' && (
                          <>
                            <option>Old Tax Regime</option>
                            <option>New Tax Regime</option>
                          </>
                        )}
                        {categoryId === 'shift-change' && (
                          <>
                            <option>Morning Shift (08 AM – 08 PM)</option>
                            <option>Night Shift (08 PM – 08 AM)</option>
                            <option>General Shift (09 AM – 06 PM)</option>
                          </>
                        )}
                        {categoryId === 'overtime' && (
                          <>
                            <option>Morning Shift</option>
                            <option>Evening Shift</option>
                            <option>Night Shift</option>
                            <option>General Shift</option>
                            <option>Holiday / Week-Off Duty</option>
                          </>
                        )}
                        {categoryId === 'loans' && (
                          <>
                            <option>Personal Loan</option>
                            <option>Salary Advance</option>
                            <option>Emergency Loan</option>
                          </>
                        )}
                        {categoryId === 'comp-off' && (
                          <>
                            <option>1 Day</option>
                            <option>0.5 Day</option>
                          </>
                        )}
                        {categoryId === 'asset-requisition' && (
                          <>
                            <option>Equipment</option>
                            <option>ID Card</option>
                            <option>Safety Gear</option>
                          </>
                        )}
                        {categoryId === 'uniform' && (
                          <>
                            <option>Uniform Set</option>
                            <option>Winter Guard Jacket</option>
                            <option>Safety Shoes</option>
                          </>
                        )}
                        {categoryId === 'resignation' && (
                          <>
                            <option>30 Days</option>
                            <option>15 Days</option>
                            <option>Waiver Requested</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}

                  {categoryId !== 'resignation' &&
                    (categoryId === 'bank-change' ? (
                    <>
                      <div className={styles.formGroup}>
                        <label>New Bank Name *</label>
                        <input
                          type="text"
                          required
                          className={styles.commentsInput}
                          value={newForm.extraField2}
                          onChange={(e) => setNewForm({ ...newForm, extraField2: e.target.value })}
                          placeholder="e.g., HDFC Bank"
                        />
                      </div>
                      <div className={styles.kvGrid} style={{ padding: 0, background: 'transparent' }}>
                        <div className={styles.formGroup}>
                          <label>Account Number *</label>
                          <input
                            type="text"
                            required
                            className={styles.commentsInput}
                            value={newForm.extraField1}
                            onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                            placeholder="Account number"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>IFSC Code *</label>
                          <input
                            type="text"
                            required
                            className={styles.commentsInput}
                            value={newForm.amountOrValue}
                            onChange={(e) => setNewForm({ ...newForm, amountOrValue: e.target.value })}
                            placeholder="e.g., HDFC0001420"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.kvGrid} style={{ padding: 0, background: 'transparent' }}>
                      <div className={styles.formGroup}>
                        <label>
                          {categoryId === 'week-off-change'
                            ? 'Current Week Off'
                            : categoryId === 'comp-off'
                            ? 'Worked On Date'
                            : categoryId === 'resignation'
                            ? 'Resignation Date'
                            : 'Date / From Date'}
                        </label>
                        <input
                          type="date"
                          className={styles.commentsInput}
                          value={newForm.date}
                          onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                        />
                      </div>

                      {(categoryId === 'shift-change' ||
                        categoryId === 'week-off-change' ||
                        categoryId === 'comp-off' ||
                        categoryId === 'resignation') && (
                        <div className={styles.formGroup}>
                          <label>
                            {categoryId === 'week-off-change'
                              ? 'Requested Week Off'
                              : categoryId === 'comp-off'
                              ? 'Avail Date'
                              : categoryId === 'resignation'
                              ? 'Last Working Day'
                              : 'To Date'}
                          </label>
                          <input
                            type="date"
                            className={styles.commentsInput}
                            value={newForm.toDate}
                            onChange={(e) => setNewForm({ ...newForm, toDate: e.target.value })}
                          />
                        </div>
                      )}

                      {categoryId === 'attendance-correction' && (
                        <>
                          <div className={styles.formGroup}>
                            <label>Requested In Time</label>
                            <input
                              type="time"
                              className={styles.commentsInput}
                              value={newForm.extraField1}
                              onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Requested Out Time</label>
                            <input
                              type="time"
                              className={styles.commentsInput}
                              value={newForm.extraField2}
                              onChange={(e) => setNewForm({ ...newForm, extraField2: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {categoryId === 'loans' && (
                        <>
                          <div className={styles.formGroup}>
                            <label>Loan Amount (₹) *</label>
                            <input
                              type="number"
                              required
                              className={styles.commentsInput}
                              value={newForm.extraField1}
                              onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                              placeholder="e.g., 15000"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Tenure</label>
                            <input
                              type="text"
                              className={styles.commentsInput}
                              value={newForm.amountOrValue}
                              onChange={(e) => setNewForm({ ...newForm, amountOrValue: e.target.value })}
                              placeholder="e.g., 6 Months"
                            />
                          </div>
                        </>
                      )}

                      {(categoryId === 'asset-requisition' || categoryId === 'uniform') && (
                        <>
                          <div className={styles.formGroup}>
                            <label>
                              {categoryId === 'uniform' ? 'Size / Color' : 'Item Name *'}
                            </label>
                            <input
                              type="text"
                              className={styles.commentsInput}
                              value={newForm.extraField1}
                              onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                              placeholder={
                                categoryId === 'uniform' ? 'e.g., L / Navy Blue' : 'e.g., Torch / ID Card'
                              }
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Quantity</label>
                            <input
                              type="number"
                              min="1"
                              className={styles.commentsInput}
                              value={newForm.amountOrValue}
                              onChange={(e) => setNewForm({ ...newForm, amountOrValue: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {categoryId === 'overtime' && (
                        <>
                          <div className={styles.formGroup}>
                            <label>Site / Post *</label>
                            <input
                              type="text"
                              required
                              className={styles.commentsInput}
                              value={newForm.extraField1}
                              onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Overtime Hours *</label>
                            <input
                              type="number"
                              min="0.5"
                              max="16"
                              step="0.5"
                              required
                              className={styles.commentsInput}
                              value={newForm.amountOrValue}
                              onChange={(e) => setNewForm({ ...newForm, amountOrValue: e.target.value })}
                              placeholder="e.g., 4"
                            />
                          </div>
                        </>
                      )}

                      {categoryId === 'reimbursement' && (
                        <>
                          <div className={styles.formGroup}>
                            <label>Merchant / Vendor *</label>
                            <input
                              type="text"
                              required
                              className={styles.commentsInput}
                              value={newForm.extraField1}
                              onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                              placeholder="e.g., IndianOil, Uber"
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Claimed Amount (₹) *</label>
                            <input
                              type="number"
                              min="1"
                              required
                              className={styles.commentsInput}
                              value={newForm.amountOrValue}
                              onChange={(e) => setNewForm({ ...newForm, amountOrValue: e.target.value })}
                              placeholder="e.g., 1200"
                            />
                          </div>
                        </>
                      )}

                      {categoryId === 'letter-request' && (
                        <>
                          <div className={styles.formGroup}>
                            <label>Delivery Format</label>
                            <select
                              className={styles.commentsInput}
                              value={newForm.extraField1}
                              onChange={(e) => setNewForm({ ...newForm, extraField1: e.target.value })}
                            >
                              <option value="Signed PDF">Signed Digital PDF</option>
                              <option value="Hard Copy + PDF">Hard Copy + Digital PDF</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Priority</label>
                            <select
                              className={styles.commentsInput}
                              value={newForm.extraField2}
                              onChange={(e) => setNewForm({ ...newForm, extraField2: e.target.value })}
                            >
                              <option value="Normal">Normal (3-5 Working Days)</option>
                              <option value="High">High (Within 48 Hours)</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                          </div>
                        </>
                      )}

                      {categoryId !== 'attendance-correction' &&
                        categoryId !== 'week-off-change' &&
                        categoryId !== 'shift-change' &&
                        categoryId !== 'comp-off' &&
                        categoryId !== 'resignation' &&
                        categoryId !== 'loans' &&
                        categoryId !== 'asset-requisition' &&
                        categoryId !== 'uniform' &&
                        categoryId !== 'overtime' &&
                        categoryId !== 'reimbursement' &&
                        categoryId !== 'letter-request' && (
                          <div className={styles.formGroup}>
                            <label>
                              {categoryId === 'it-declaration'
                                ? 'Amount (₹)'
                                : categoryId === 'time-relaxation'
                                ? 'Duration (e.g. 30 mins)'
                                : categoryId === 'leave-encashment'
                                ? 'Encash Days'
                                : categoryId === 'transfer-request'
                                ? 'Preferred Site *'
                                : 'Value'}
                            </label>
                            <input
                              type="text"
                              className={styles.commentsInput}
                              value={
                                categoryId === 'transfer-request'
                                  ? newForm.extraField1
                                  : newForm.amountOrValue
                              }
                              onChange={(e) =>
                                categoryId === 'transfer-request'
                                  ? setNewForm({ ...newForm, extraField1: e.target.value })
                                  : setNewForm({ ...newForm, amountOrValue: e.target.value })
                              }
                              placeholder="Enter value..."
                            />
                          </div>
                        )}
                    </div>
                  ))}

                  <div className={styles.formGroup}>
                    <label>
                      {categoryId === 'resignation' ? 'Remarks' : 'Reason / Comments *'}
                    </label>
                    <textarea
                      rows={3}
                      required={categoryId !== 'resignation'}
                      className={styles.textarea}
                      value={newForm.reason}
                      onChange={(e) => setNewForm({ ...newForm, reason: e.target.value })}
                      placeholder={
                        categoryId === 'resignation'
                          ? 'Add any context, operational notes, or handover remarks relevant to this exit...'
                          : 'Enter clear reason for your request...'
                      }
                    />
                  </div>

                  <div className={styles.takeActionButtons}>
                    <button
                      type="button"
                      className={styles.cancelTextBtn}
                      onClick={() => setShowNewModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.modalApproveBtn}>
                      {categoryId === 'resignation' ? 'Submit Exit Request' : 'Submit Request'}
                    </button>
                  </div>
                </div>
              </form>
            </div>,
            document.body
          )}

        <ApplyLeaveModal
          isOpen={isApplyLeaveOpen}
          onClose={() => setIsApplyLeaveOpen(false)}
          onSubmit={handleApplyLeaveSubmit}
          balances={employeeLeaveBalances}
          profile={{
            ...currentEmployeeProfile,
            employeeCode: employeeId,
            employeeName
          }}
        />

        <EmployeeAttendanceCorrectionModal
          isOpen={isAttCorrectionOpen}
          record={null}
          employeeInfo={{
            employeeId,
            name: employeeName,
            companyName: activeCompany?.name || currentUser?.companyName || 'General'
          }}
          onClose={() => setIsAttCorrectionOpen(false)}
          onSubmit={handleAttendanceCorrectionSubmit}
        />

        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}
      </div>
    </main>
  );
}
