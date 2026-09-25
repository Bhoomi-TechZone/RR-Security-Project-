import React, { useMemo, useState, useEffect } from 'react';
import {
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  Clock3,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Ban,
  Plus,
  Eye,
  X,
  FileText,
  Upload,
  Trash2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Building2,
  MapPin,
  Briefcase,
  User,
  ArrowRight,
  Info
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Toast from '../../components/common/Toast';
import {
  currentEmployeeProfile,
  employeeLeaveBalances,
  policyLeaveTypes,
  employeeLeaveHistory
} from '../../data/employeeLeaveData';
import styles from './MyLeave.module.css';

const STORAGE_KEY = 'novaspark_emp_my_leave_requests';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
};

// Summary KPI Grid
function MyLeaveSummaryCards({ requests, balances }) {
  const totalAvailable = balances.reduce((sum, b) => sum + (b.category === 'Paid' ? b.available : 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
  const totalPending = requests.filter(r => r.status.includes('Pending')).reduce((sum, r) => sum + r.days, 0);
  const totalApproved = requests.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.days, 0);
  const totalRejected = requests.filter(r => r.status === 'Rejected').length;
  const lwpUsed = balances.find(b => b.code === 'LWP')?.used || 0;

  const cards = [
    { label: 'Available Leave', value: `${totalAvailable} d`, sub: 'Paid balance quota', icon: CalendarDays, style: styles.blue },
    { label: 'Used Leave', value: `${totalUsed} d`, sub: 'Taken this cycle', icon: CheckCircle2, style: styles.slate },
    { label: 'Pending Approval', value: `${totalPending} d`, sub: 'Awaiting reviews', icon: Clock3, style: styles.amber },
    { label: 'Approved Leave', value: `${totalApproved} d`, sub: 'Sanctioned & synced', icon: CalendarCheck, style: styles.green },
    { label: 'Rejected / Sent Back', value: totalRejected, sub: 'Requires attention', icon: XCircle, style: styles.red },
    { label: 'LWP (Unpaid)', value: `${lwpUsed} d`, sub: 'Salary deduction applied', icon: AlertCircle, style: styles.purple }
  ];

  return (
    <div className={styles.summaryGrid6}>
      {cards.map(({ label, value, sub, icon: Icon, style }) => (
        <div key={label} className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            <span className={styles.summaryLabel}>{label}</span>
            <span className={styles.summaryNumber}>{value}</span>
            <span className={styles.summarySub}>{sub}</span>
          </div>
          <div className={`${styles.iconWrap} ${style}`}>
            <Icon size={20} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Detailed Leave Balances Card Grid
function MyLeaveBalancesSection({ balances }) {
  return (
    <section className={styles.balancesSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>My Leave Balances & Policy Quota</h2>
          <p className={styles.sectionSub}>
            Standard security guard leave allocation for current policy period. Available = Opening + Accrued - Used - Pending.
          </p>
        </div>
      </div>

      <div className={styles.balanceCardsGrid}>
        {balances.map((item) => {
          const totalEntitled = item.opening + item.accrued;
          const usedPct = totalEntitled > 0 ? Math.min(100, Math.round((item.used / totalEntitled) * 100)) : 0;

          return (
            <article key={item.id} className={styles.balanceCard}>
              <div className={styles.balanceCardTop}>
                <div className={styles.typeCodeBadge}>{item.code}</div>
                <div>
                  <h3 className={styles.balanceTypeName}>{item.name}</h3>
                  <span className={item.category === 'Paid' ? styles.paidTag : styles.unpaidTag}>
                    {item.category} Leave
                  </span>
                </div>
              </div>

              <div className={styles.availDisplay}>
                <strong className={styles.availVal}>
                  {item.category === 'Paid' ? item.available : item.used}
                </strong>
                <span className={styles.availUnit}>
                  {item.category === 'Paid' ? 'Days Available' : 'Days Used (LWP)'}
                </span>
              </div>

              {item.category === 'Paid' && (
                <div className={styles.progressTrack}>
                  <span style={{ width: `${usedPct}%` }} />
                </div>
              )}

              <div className={styles.balanceBreakdown}>
                <div className={styles.bbItem}>
                  <span>Opening:</span>
                  <strong>{item.opening}d</strong>
                </div>
                <div className={styles.bbItem}>
                  <span>Accrued:</span>
                  <strong>{item.accrued}d</strong>
                </div>
                <div className={styles.bbItem}>
                  <span>Used:</span>
                  <strong>{item.used}d</strong>
                </div>
                <div className={styles.bbItem}>
                  <span>Pending:</span>
                  <strong style={{ color: item.pending > 0 ? '#d97706' : 'inherit' }}>{item.pending}d</strong>
                </div>
              </div>

              <p className={styles.balanceDesc}>{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// Apply Leave Modal / Edit Resubmit Modal
function ApplyLeaveModal({
  isOpen,
  onClose,
  onSubmit,
  balances,
  profile,
  initialData = null
}) {
  const [leaveCode, setLeaveCode] = useState('CL');
  const [durationType, setDurationType] = useState('Full Day');
  const [halfDayType, setHalfDayType] = useState('First Half');
  const [shortStartTime, setShortStartTime] = useState('10:00');
  const [shortEndTime, setShortEndTime] = useState('12:00');
  const [fromDate, setFromDate] = useState('2026-09-10');
  const [toDate, setToDate] = useState('2026-09-10');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setLeaveCode(initialData.leaveCode || 'CL');
      setDurationType(initialData.durationType || 'Full Day');
      setHalfDayType(initialData.halfDayType || 'First Half');
      if (initialData.shortLeaveTime) {
        setShortStartTime(initialData.shortLeaveTime.start || '10:00');
        setShortEndTime(initialData.shortLeaveTime.end || '12:00');
      }
      setFromDate(initialData.from || '2026-09-10');
      setToDate(initialData.to || '2026-09-10');
      setReason(initialData.reason || '');
      setRemarks(initialData.remarks || '');
      if (initialData.supportingDocName) {
        setAttachedFile({ name: initialData.supportingDocName, size: initialData.supportingDocSize || '1.2 MB' });
      }
    } else {
      setLeaveCode('CL');
      setDurationType('Full Day');
      setHalfDayType('First Half');
      setShortStartTime('10:00');
      setShortEndTime('12:00');
      setFromDate('2026-09-10');
      setToDate('2026-09-10');
      setReason('');
      setRemarks('');
      setAttachedFile(null);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const selectedBalance = useMemo(() => {
    return balances.find(b => b.code === leaveCode) || balances[0];
  }, [balances, leaveCode]);

  const availableBalance = selectedBalance?.category === 'Paid' ? (selectedBalance.available || 0) : 0;

  // Calculate requested days & breakdown
  const { requestedDays, dateBreakdown, shortDurationHours } = useMemo(() => {
    if (durationType === 'Half Day') {
      return {
        requestedDays: 0.5,
        dateBreakdown: [{ date: fromDate, dayType: `Half Day (${halfDayType})`, units: 0.5 }],
        shortDurationHours: null
      };
    }
    if (durationType === 'Short Leave') {
      return {
        requestedDays: 0.25,
        dateBreakdown: [{ date: fromDate, dayType: `Short Leave (${shortStartTime} - ${shortEndTime})`, units: 0.25 }],
        shortDurationHours: 2
      };
    }
    if (durationType === 'Full Day') {
      return {
        requestedDays: 1.0,
        dateBreakdown: [{ date: fromDate, dayType: 'Full Day', units: 1.0 }],
        shortDurationHours: null
      };
    }

    // Multiple Days
    if (!fromDate || !toDate || fromDate > toDate) {
      return { requestedDays: 0, dateBreakdown: [], shortDurationHours: null };
    }

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);
    const diff = Math.round((end - start) / 86400000) + 1;
    const list = [];
    for (let i = 0; i < diff; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push({ date: d.toISOString().slice(0, 10), dayType: 'Full Day', units: 1.0 });
    }

    return {
      requestedDays: diff,
      dateBreakdown: list,
      shortDurationHours: null
    };
  }, [durationType, halfDayType, shortStartTime, shortEndTime, fromDate, toDate]);

  const balanceAfter = useMemo(() => {
    if (selectedBalance?.category !== 'Paid') return 0;
    return Number(Math.max(0, availableBalance - requestedDays).toFixed(2));
  }, [availableBalance, requestedDays, selectedBalance]);

  const isExceeded = selectedBalance?.category === 'Paid' && requestedDays > availableBalance;

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const sz = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;
      setAttachedFile({ name: f.name, size: sz });
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!reason.trim()) nextErrors.reason = 'Please provide a reason for leave.';
    if (durationType === 'Multiple Days' && fromDate > toDate) {
      nextErrors.dateRange = 'To Date cannot be before From Date.';
    }
    if (isExceeded) {
      nextErrors.balance = `You have only ${availableBalance} days of ${selectedBalance.name} available. Please adjust requested days or select LWP.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const newRequest = {
      id: initialData?.id || `LV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      leaveCode: selectedBalance.code,
      type: selectedBalance.name,
      category: selectedBalance.category,
      durationType,
      halfDayType: durationType === 'Half Day' ? halfDayType : null,
      shortLeaveTime: durationType === 'Short Leave' ? { start: shortStartTime, end: shortEndTime } : null,
      from: fromDate,
      to: durationType === 'Multiple Days' ? toDate : fromDate,
      days: requestedDays,
      dateBreakdown,
      reason: reason.trim(),
      supportingDocName: attachedFile?.name || null,
      supportingDocSize: attachedFile?.size || null,
      remarks: remarks.trim() || null,
      appliedOn: new Date().toISOString().slice(0, 10),
      status: 'Pending Supervisor Approval',
      currentStage: 'Site Supervisor Approval',
      workflowStage: 2,
      timeline: [
        {
          stage: 'Employee Submitted',
          status: 'Completed',
          actor: `${profile.employeeName} (Self)`,
          timestamp: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          remarks: reason.trim()
        },
        {
          stage: 'Site Supervisor Approval',
          status: 'Pending',
          actor: 'Amit Kumar (Site Supervisor)',
          timestamp: null,
          remarks: 'Awaiting site manpower review'
        },
        {
          stage: 'HR Approval',
          status: 'Waiting',
          actor: 'HR Manager',
          timestamp: null,
          remarks: null
        },
        {
          stage: 'Attendance Update',
          status: 'Waiting',
          actor: 'Automated System',
          timestamp: null,
          remarks: 'Will sync to attendance upon approval'
        },
        {
          stage: 'Payroll Calculation',
          status: 'Waiting',
          actor: 'Payroll Engine',
          timestamp: null,
          remarks: selectedBalance.category === 'Paid' ? 'Paid Leave: No salary deduction' : 'LWP: Pro-rated salary deduction'
        }
      ],
      attendanceImpact: {
        status: selectedBalance.category === 'Paid' ? `Leave (${selectedBalance.code})` : 'Leave Without Pay (LWP)',
        dailyCode: `L-${selectedBalance.code}`,
        salaryDeduction: selectedBalance.category === 'Unpaid'
      },
      payrollImpact: {
        monthlySalary: profile.monthlySalary,
        monthlyWorkingDays: profile.monthlyWorkingDays,
        paidLeaveDays: selectedBalance.category === 'Paid' ? requestedDays : 0,
        lwpDays: selectedBalance.category === 'Unpaid' ? requestedDays : 0,
        payableDays: selectedBalance.category === 'Unpaid' ? (profile.monthlyWorkingDays - requestedDays) : profile.monthlyWorkingDays,
        deductionAmount: selectedBalance.category === 'Unpaid' ? Math.round((profile.monthlySalary / profile.monthlyWorkingDays) * requestedDays) : 0,
        note: selectedBalance.category === 'Paid' ? 'No salary deduction.' : `${requestedDays} day(s) salary deduction in monthly payroll.`
      },
      rejectionReason: null,
      sendBackReason: null
    };

    onSubmit(newRequest, !!initialData);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.eyebrow}>Employee Self-Service</span>
            <h2 className={styles.modalTitle}>
              {initialData ? 'Edit & Resubmit Leave Request' : 'Apply For Leave'}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="applyLeaveForm" onSubmit={handleSubmit} className={styles.modalBody}>
          {/* Read-only Employee Context */}
          <div className={styles.profileBadgeBox}>
            <div className={styles.profileRow}>
              <div>
                <span className={styles.profileName}>{profile.employeeName}</span>
                <span className={styles.profileCode}> ({profile.employeeCode})</span>
              </div>
              <span className={styles.profileDesig}>{profile.designation} • {profile.department}</span>
            </div>
            <div className={styles.profileSite}>
              <MapPin size={13} />
              <span>{profile.client} — {profile.site}</span>
            </div>
          </div>

          {/* Leave Type Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Select Leave Type <span className={styles.req}>*</span>
            </label>
            <select
              className={styles.select}
              value={leaveCode}
              onChange={(e) => setLeaveCode(e.target.value)}
            >
              {policyLeaveTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code} — {t.name} ({t.quotaNote})
                </option>
              ))}
            </select>
          </div>

          {/* Duration Type Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Leave Duration Type <span className={styles.req}>*</span></label>
            <div className={styles.durationSelector}>
              {['Full Day', 'Half Day', 'Short Leave', 'Multiple Days'].map((dt) => (
                <button
                  key={dt}
                  type="button"
                  className={`${styles.dtBtn} ${durationType === dt ? styles.dtBtnActive : ''}`}
                  onClick={() => setDurationType(dt)}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Sub-fields */}
          {durationType === 'Half Day' && (
            <div className={styles.subFieldBox}>
              <label className={styles.label}>Select Half-Day Session</label>
              <div className={styles.radioRow}>
                <label className={styles.radioItem}>
                  <input
                    type="radio"
                    name="halfDaySession"
                    value="First Half"
                    checked={halfDayType === 'First Half'}
                    onChange={() => setHalfDayType('First Half')}
                  />
                  <span>First Half (Morning Shift / Before 1:30 PM)</span>
                </label>
                <label className={styles.radioItem}>
                  <input
                    type="radio"
                    name="halfDaySession"
                    value="Second Half"
                    checked={halfDayType === 'Second Half'}
                    onChange={() => setHalfDayType('Second Half')}
                  />
                  <span>Second Half (Afternoon Shift / After 1:30 PM)</span>
                </label>
              </div>
            </div>
          )}

          {durationType === 'Short Leave' && (
            <div className={styles.shortLeaveGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Start Time</label>
                <input
                  type="time"
                  className={styles.input}
                  value={shortStartTime}
                  onChange={(e) => setShortStartTime(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>End Time</label>
                <input
                  type="time"
                  className={styles.input}
                  value={shortEndTime}
                  onChange={(e) => setShortEndTime(e.target.value)}
                />
              </div>
              <div className={styles.shortTimeHint}>
                <Clock3 size={14} />
                <span>2 Hours Official Permission Pass (0.25 Day)</span>
              </div>
            </div>
          )}

          {/* Date Picker(s) */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {durationType === 'Multiple Days' ? 'From Date' : 'Leave Date'} <span className={styles.req}>*</span>
              </label>
              <input
                type="date"
                className={styles.input}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {durationType === 'Multiple Days' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>To Date <span className={styles.req}>*</span></label>
                <input
                  type="date"
                  className={styles.input}
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                {errors.dateRange && <span className={styles.errorText}>{errors.dateRange}</span>}
              </div>
            )}
          </div>

          {/* Date-wise Breakdown for Multiple Days */}
          {durationType === 'Multiple Days' && dateBreakdown.length > 0 && (
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownHeading}>Requested Schedule Breakdown:</span>
              <div className={styles.breakdownChips}>
                {dateBreakdown.map((item, idx) => (
                  <div key={idx} className={styles.bChip}>
                    <span>{item.date}</span>
                    <strong>{item.dayType} ({item.units}d)</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Balance Summary Bar */}
          <div className={styles.balanceSummaryBar}>
            <div className={styles.bsCol}>
              <span className={styles.bsLabel}>Available Balance</span>
              <span className={styles.bsVal}>{selectedBalance?.category === 'Paid' ? `${availableBalance} Days` : 'N/A (LWP)'}</span>
            </div>
            <div className={styles.bsOp}>-</div>
            <div className={styles.bsCol}>
              <span className={styles.bsLabel}>Requested</span>
              <span className={`${styles.bsVal} ${styles.valReq}`}>{requestedDays} Days</span>
            </div>
            <div className={styles.bsOp}>=</div>
            <div className={styles.bsCol}>
              <span className={styles.bsLabel}>Balance After</span>
              <span className={`${styles.bsVal} ${styles.valAfter}`}>{selectedBalance?.category === 'Paid' ? `${balanceAfter} Days` : '0 Days'}</span>
            </div>
          </div>

          {/* LWP Warning Notice */}
          {selectedBalance?.category === 'Unpaid' && (
            <div className={styles.lwpWarningAlert}>
              <AlertCircle size={16} />
              <span>
                <strong>Leave Without Pay (LWP):</strong> LWP will be recorded in attendance and may result in salary deduction according to enterprise payroll rules.
              </span>
            </div>
          )}

          {/* Exceeded Balance Warning */}
          {isExceeded && (
            <div className={styles.exceededAlert}>
              <AlertTriangle size={16} />
              <span>
                <strong>Insufficient Balance:</strong> You have only {availableBalance} days of {selectedBalance.name} available. Please reduce requested days or apply under LWP.
              </span>
            </div>
          )}
          {errors.balance && <span className={styles.errorText}>{errors.balance}</span>}

          {/* Reason */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Reason for Leave <span className={styles.req}>*</span>
            </label>
            <textarea
              rows="2"
              className={`${styles.textarea} ${errors.reason ? styles.inputError : ''}`}
              placeholder="State reason for absence..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors(prev => ({ ...prev, reason: null }));
              }}
            />
            {errors.reason && <span className={styles.errorText}>{errors.reason}</span>}
          </div>

          {/* Supporting Document Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Supporting Document (e.g. Medical Certificate / Proof)</label>
            {attachedFile ? (
              <div className={styles.attachedFileBox}>
                <div className={styles.fileInfo}>
                  <FileText size={16} className={styles.fileIcon} />
                  <span className={styles.fileName}>{attachedFile.name}</span>
                  <span className={styles.fileSize}>({attachedFile.size})</span>
                </div>
                <button type="button" className={styles.removeFileBtn} onClick={handleRemoveFile}>
                  <Trash2 size={14} />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <div className={styles.uploadDropzone}>
                <Upload size={16} />
                <label className={styles.uploadLabel}>
                  <span>Click to browse and attach document</span>
                  <input type="file" className={styles.hiddenFile} onChange={handleFileSelect} />
                </label>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Handover / Shift Remarks (Optional)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Reliever informed for gate post duty"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </form>

        {/* Fixed Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="applyLeaveForm"
            className={styles.primaryButton}
            disabled={isExceeded}
          >
            <Plus size={16} />
            <span>{initialData ? 'Resubmit Leave Request' : 'Submit Leave Request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Cancel Request Modal
function CancelConfirmModal({ request, isOpen, onClose, onConfirm }) {
  if (!isOpen || !request) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.confirmCard}>
        <div className={styles.confirmHeader}>
          <div className={styles.confirmIconWrap}>
            <Ban size={20} />
          </div>
          <div>
            <h3 className={styles.confirmTitle}>Cancel Leave Request?</h3>
            <p className={styles.confirmSub}>Request ID: {request.id}</p>
          </div>
        </div>

        <div className={styles.confirmBody}>
          <p>
            Are you sure you want to cancel your leave application for{' '}
            <strong>{request.type}</strong> ({request.from} to {request.to} • {request.days} Days)?
          </p>
          <span className={styles.confirmNote}>
            Your requested quota will be released and returned to your available balance.
          </span>
        </div>

        <div className={styles.confirmFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Keep Request
          </button>
          <button type="button" className={styles.cancelActionBtn} onClick={() => onConfirm(request)}>
            Yes, Cancel Leave
          </button>
        </div>
      </div>
    </div>
  );
}

// Employee Leave Details Drawer
function EmployeeLeaveDetailsDrawer({
  selectedLeave,
  onClose,
  onCancelClick,
  onEditResubmitClick
}) {
  if (!selectedLeave) return null;

  const isCancellable = selectedLeave.status === 'Pending Supervisor Approval' || selectedLeave.status === 'Pending HR Approval';
  const isSentBack = selectedLeave.status === 'Sent Back';

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} aria-label="Leave Request Details Drawer">
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.headerTop}>
              <span className={styles.leaveIdBadge}>{selectedLeave.id}</span>
              <span className={selectedLeave.category === 'Paid' ? styles.paidTag : styles.unpaidTag}>
                {selectedLeave.category || 'Paid'} Leave
              </span>
            </div>
            <h3 className={styles.drawerTitle}>Leave Application & Workflow Status</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          {/* Status Message Banner */}
          <div className={`${styles.statusBanner} ${styles[`banner_${(selectedLeave.status || 'pending').toLowerCase().replace(/\s+/g, '_')}`]}`}>
            <div className={styles.statusBannerContent}>
              <span className={styles.sbTitle}>Current Status: {selectedLeave.status}</span>
              <span className={styles.sbSub}>
                {selectedLeave.status === 'Approved'
                  ? 'Your leave has been sanctioned by HR and synchronized with Attendance.'
                  : selectedLeave.status === 'Pending Supervisor Approval'
                  ? 'Awaiting site manpower review and sign-off by your Site Supervisor.'
                  : selectedLeave.status === 'Pending HR Approval'
                  ? 'Supervisor approved. Awaiting final sanction from HR operations.'
                  : selectedLeave.status === 'Sent Back'
                  ? 'Request sent back for correction. Please review reason and resubmit.'
                  : selectedLeave.status === 'Rejected'
                  ? 'Your leave application was rejected.'
                  : 'Leave application cancelled.'}
              </span>
            </div>
          </div>

          {/* Section 1: Employee Information */}
          <div className={styles.drawerSection}>
            <h4 className={styles.dsHeading}>
              <Briefcase size={15} />
              <span>Employee Information</span>
            </h4>
            <div className={styles.infoGrid2}>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Employee Name</span>
                <span className={styles.infoValHighlight}>{currentEmployeeProfile.employeeName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Employee Code</span>
                <span className={styles.infoVal}>{currentEmployeeProfile.employeeCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Department & Role</span>
                <span className={styles.infoVal}>{currentEmployeeProfile.department} • {currentEmployeeProfile.designation}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Assigned Client & Site</span>
                <span className={styles.infoVal}>{currentEmployeeProfile.client} — {currentEmployeeProfile.site}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Leave Information */}
          <div className={styles.drawerSection}>
            <h4 className={styles.dsHeading}>
              <CalendarDays size={15} />
              <span>Leave Application Details</span>
            </h4>
            <div className={styles.infoGrid3}>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Leave Type</span>
                <span className={styles.infoValHighlight}>{selectedLeave.type}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Duration Type</span>
                <span className={styles.infoVal}>{selectedLeave.durationType || 'Full Day'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>Total Days</span>
                <span className={styles.infoValHighlight}>{selectedLeave.days} Days</span>
              </div>
            </div>

            <div className={styles.infoGrid2} style={{ marginTop: '10px' }}>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>From Date</span>
                <span className={styles.infoVal}>{formatDate(selectedLeave.from)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLbl}>To Date</span>
                <span className={styles.infoVal}>{formatDate(selectedLeave.to)}</span>
              </div>
            </div>

            {/* Date-wise breakdown */}
            {selectedLeave.dateBreakdown && selectedLeave.dateBreakdown.length > 0 && (
              <div className={styles.drawerBreakdown}>
                <span className={styles.dbHeading}>Daily Schedule Breakdown:</span>
                <div className={styles.dbChips}>
                  {selectedLeave.dateBreakdown.map((item, idx) => (
                    <span key={idx} className={styles.dbChip}>
                      <strong>{item.date}:</strong> {item.dayType}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.reasonCard}>
              <span className={styles.infoLbl}>Reason for Leave:</span>
              <p className={styles.reasonTxt}>{selectedLeave.reason}</p>
            </div>

            {selectedLeave.supportingDocName && (
              <div className={styles.docCard}>
                <FileText size={15} />
                <span>Attachment: <strong>{selectedLeave.supportingDocName}</strong> ({selectedLeave.supportingDocSize || 'Document'})</span>
              </div>
            )}

            {selectedLeave.remarks && (
              <div className={styles.remarksCard}>
                <span className={styles.infoLbl}>Remarks / Handover:</span>
                <p className={styles.remarksTxt}>{selectedLeave.remarks}</p>
              </div>
            )}
          </div>

          {/* Section 3: 5-Stage Approval Workflow Visualizer */}
          <div className={styles.drawerSection}>
            <h4 className={styles.dsHeading}>
              <ShieldCheck size={15} />
              <span>5-Stage Approval & Synchronization Timeline</span>
            </h4>

            <div className={styles.timelineList}>
              {(selectedLeave.timeline || [
                { stage: 'Employee Submitted', status: 'Completed', actor: 'Rahul Kumar', timestamp: formatDate(selectedLeave.appliedOn), remarks: selectedLeave.reason },
                { stage: 'Site Supervisor Approval', status: selectedLeave.status.includes('Supervisor') ? 'Pending' : 'Approved', actor: 'Amit Kumar', timestamp: null, remarks: null },
                { stage: 'HR Approval', status: selectedLeave.status === 'Approved' ? 'Approved' : 'Waiting', actor: 'HR Manager', timestamp: null, remarks: null },
                { stage: 'Attendance Update', status: selectedLeave.status === 'Approved' ? 'Completed' : 'Waiting', actor: 'Automated System', timestamp: null, remarks: null },
                { stage: 'Payroll Calculation', status: selectedLeave.status === 'Approved' ? 'Completed' : 'Waiting', actor: 'Payroll Engine', timestamp: null, remarks: null }
              ]).map((step, idx) => {
                const isCompleted = step.status === 'Completed' || step.status === 'Approved';
                const isPending = step.status === 'Pending';
                const isRejected = step.status === 'Rejected';
                const isSentBackStep = step.status === 'Sent Back';

                return (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineNodeWrap}>
                      <div className={`${styles.timelineNode} ${isCompleted ? styles.nodeDone : isPending ? styles.nodePending : isRejected ? styles.nodeRejected : isSentBackStep ? styles.nodeSentBack : styles.nodeWaiting}`}>
                        {idx + 1}
                      </div>
                      {idx < 4 && <div className={styles.timelineLine} />}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.stageTitle}>{step.stage}</span>
                        <span className={`${styles.stageBadge} ${isCompleted ? styles.badgeDone : isPending ? styles.badgePending : isRejected ? styles.badgeRejected : isSentBackStep ? styles.badgeSentBack : styles.badgeWaiting}`}>
                          {step.status}
                        </span>
                      </div>
                      <div className={styles.stageMeta}>
                        <span>{step.actor}</span>
                        {step.timestamp && <span> • {step.timestamp}</span>}
                      </div>
                      {step.remarks && <p className={styles.stageRemarks}>&ldquo;{step.remarks}&rdquo;</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Attendance & Payroll Impact */}
          <div className={styles.drawerSection}>
            <h4 className={styles.dsHeading}>
              <CreditCard size={15} />
              <span>Attendance & Payroll Synchronization</span>
            </h4>

            <div className={styles.integrationGrid}>
              <div className={styles.intBox}>
                <span className={styles.intTitle}>Attendance Status</span>
                <div className={styles.intContent}>
                  <div className={styles.intRow}>
                    <span>Marked Status:</span>
                    <strong>{selectedLeave.attendanceImpact?.status || `Leave (${selectedLeave.leaveCode || 'CL'})`}</strong>
                  </div>
                  <div className={styles.intRow}>
                    <span>Daily Code:</span>
                    <span className={styles.codePill}>{selectedLeave.attendanceImpact?.dailyCode || 'L-CL'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.intBox}>
                <span className={styles.intTitle}>Payroll Impact</span>
                <div className={styles.intContent}>
                  <div className={styles.intRow}>
                    <span>Working Days:</span>
                    <strong>{selectedLeave.payrollImpact?.monthlyWorkingDays || 30} Days</strong>
                  </div>
                  <div className={styles.intRow}>
                    <span>Net Payable Days:</span>
                    <strong>{selectedLeave.payrollImpact?.payableDays || 30} Days</strong>
                  </div>
                </div>
                <p className={styles.payrollNote}>
                  {selectedLeave.payrollImpact?.note || (selectedLeave.category === 'Paid' ? 'Paid leave: No salary deduction.' : 'Subject to salary deduction.')}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection / Send-Back Reason Alert */}
          {selectedLeave.rejectionReason && (
            <div className={styles.rejectionNotice}>
              <XCircle size={18} />
              <div>
                <strong>Rejection Reason:</strong>
                <p>{selectedLeave.rejectionReason}</p>
              </div>
            </div>
          )}

          {selectedLeave.sendBackReason && (
            <div className={styles.sendBackNotice}>
              <RotateCcw size={18} />
              <div>
                <strong>Clarification / Send-Back Reason:</strong>
                <p>{selectedLeave.sendBackReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Close
          </button>

          {isCancellable && (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => onCancelClick(selectedLeave)}
            >
              <Ban size={15} />
              <span>Cancel Request</span>
            </button>
          )}

          {isSentBack && (
            <button
              type="button"
              className={styles.resubmitBtn}
              onClick={() => onEditResubmitClick(selectedLeave)}
            >
              <RotateCcw size={15} />
              <span>Edit & Resubmit</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

// Main Page Component
function MyLeave() {
  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : employeeLeaveHistory;
    } catch {
      return employeeLeaveHistory;
    }
  });

  const [balances, setBalances] = useState(employeeLeaveBalances);
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterYear, setFilterYear] = useState('2026');

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelModalState, setCancelModalState] = useState({ isOpen: false, request: null });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (filterType !== 'All' && r.type !== filterType && r.leaveCode !== filterType) return false;
      if (filterStatus !== 'All') {
        if (filterStatus === 'Pending' && !r.status.includes('Pending')) return false;
        if (filterStatus !== 'Pending' && r.status !== filterStatus) return false;
      }
      if (filterYear && !r.from.startsWith(filterYear)) return false;
      return true;
    });
  }, [requests, filterType, filterStatus, filterYear]);

  // Add / Resubmit Leave handler
  const handleApplyLeaveSubmit = (newReq, isEditing) => {
    if (isEditing) {
      setRequests((prev) => prev.map((r) => (r.id === newReq.id ? newReq : r)));
      showToast('✓ Leave request resubmitted for Site Supervisor review.');
    } else {
      setRequests((prev) => [newReq, ...prev]);

      // Update balance pending count
      setBalances((prev) =>
        prev.map((b) => {
          if (b.code === newReq.leaveCode) {
            return {
              ...b,
              pending: b.pending + newReq.days
            };
          }
          return b;
        })
      );
      showToast('✓ Leave application submitted successfully.');
    }

    setIsApplyModalOpen(false);
    setEditingRequest(null);
  };

  // Cancel leave handler
  const handleConfirmCancel = (request) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === request.id) {
          return {
            ...r,
            status: 'Cancelled',
            currentStage: 'Cancelled by Employee',
            timeline: [
              ...(r.timeline || []),
              {
                stage: 'Cancelled by Employee',
                status: 'Cancelled',
                actor: `${currentEmployeeProfile.employeeName} (Self)`,
                timestamp: new Date().toLocaleString(),
                remarks: 'Request withdrawn by employee'
              }
            ]
          };
        }
        return r;
      })
    );

    // Revert pending balance
    setBalances((prev) =>
      prev.map((b) => {
        if (b.code === request.leaveCode) {
          return {
            ...b,
            pending: Math.max(0, b.pending - request.days)
          };
        }
        return b;
      })
    );

    setCancelModalState({ isOpen: false, request: null });
    setSelectedRequest(null);
    showToast('✓ Leave request cancelled.', 'warning');
  };

  const handleEditResubmit = (request) => {
    setSelectedRequest(null);
    setEditingRequest(request);
    setIsApplyModalOpen(true);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <span>Employee Portal</span> / <strong>My Leave</strong>
            </div>
            <h1 className={styles.pageTitle}>My Leave & Attendance Portal</h1>
            <p className={styles.pageSubtitle}>
              View your leave entitlement, submit leave requests, monitor 2-level supervisor/HR sign-offs, and track attendance synchronization.
            </p>
          </div>

          <button
            type="button"
            className={styles.primaryAddBtn}
            onClick={() => {
              setEditingRequest(null);
              setIsApplyModalOpen(true);
            }}
          >
            <Plus size={17} />
            <span>Apply Leave</span>
          </button>
        </header>

        {/* KPI Summary Cards */}
        <MyLeaveSummaryCards requests={requests} balances={balances} />

        {/* Detailed Balances Section */}
        <MyLeaveBalancesSection balances={balances} />

        {/* Leave History Table Section */}
        <section className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>My Leave Application History</h2>
              <p className={styles.sectionSub}>
                Track live progress of your submitted leave applications through Site Supervisor and HR approval stages.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filtersBar}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Leave Type</label>
              <select
                className={styles.filterSelect}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Types</option>
                {policyLeaveTypes.map((t) => (
                  <option key={t.code} value={t.name}>{t.code} - {t.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Approval Status</label>
              <select
                className={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">All Pending</option>
                <option value="Pending Supervisor Approval">Pending Supervisor</option>
                <option value="Pending HR Approval">Pending HR</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Sent Back">Sent Back</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Year</label>
              <select
                className={styles.filterSelect}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setFilterType('All');
                setFilterStatus('All');
                setFilterYear('2026');
              }}
            >
              Reset Filters
            </button>
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <div className={styles.emptyWrap}>
              <p className={styles.emptyTitle}>No leave records found</p>
              <p className={styles.emptySub}>Try clearing your filters or apply for a new leave.</p>
              <button
                type="button"
                className={styles.primaryAddBtn}
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setEditingRequest(null);
                  setIsApplyModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Apply Leave</span>
              </button>
            </div>
          ) : (
            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Leave ID</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Days</th>
                      <th>Paid / Unpaid</th>
                      <th>Submitted Date</th>
                      <th>Approval Stage</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => {
                      const isPending = request.status.includes('Pending');
                      const isSentBack = request.status === 'Sent Back';

                      return (
                        <tr key={request.id}>
                          <td>
                            <span className={styles.tableId}>{request.id}</span>
                          </td>
                          <td>
                            <div className={styles.tableType}>
                              <strong>{request.type}</strong>
                              <span className={styles.tableCode}>[{request.leaveCode || 'CL'}]</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.tableDuration}>
                              <span>{formatDate(request.from)} - {formatDate(request.to)}</span>
                              <span className={styles.tableDt}>{request.durationType || 'Full Day'}</span>
                            </div>
                          </td>
                          <td>
                            <strong className={styles.tableDays}>{request.days} d</strong>
                          </td>
                          <td>
                            <span className={request.category === 'Paid' ? styles.paidBadge : styles.unpaidBadge}>
                              {request.category || 'Paid'}
                            </span>
                          </td>
                          <td>
                            <span className={styles.tableDate}>{formatDate(request.appliedOn)}</span>
                          </td>
                          <td>
                            <span className={styles.tableStage}>{request.currentStage || 'HR Review'}</span>
                          </td>
                          <td>
                            <StatusBadge status={isPending ? 'pending' : request.status.toLowerCase()} />
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                type="button"
                                className={styles.viewActionBtn}
                                onClick={() => setSelectedRequest(request)}
                                title="View Leave Details & Timeline"
                              >
                                <Eye size={14} />
                                <span>Details</span>
                              </button>

                              {isSentBack && (
                                <button
                                  type="button"
                                  className={styles.resubmitActionBtn}
                                  onClick={() => handleEditResubmit(request)}
                                  title="Edit and resubmit request"
                                >
                                  <RotateCcw size={13} />
                                  <span>Edit</span>
                                </button>
                              )}

                              {isPending && (
                                <button
                                  type="button"
                                  className={styles.cancelActionSmallBtn}
                                  onClick={() => setCancelModalState({ isOpen: true, request })}
                                  title="Cancel pending leave"
                                >
                                  <Ban size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Apply / Edit Resubmit Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setEditingRequest(null);
        }}
        onSubmit={handleApplyLeaveSubmit}
        balances={balances}
        profile={currentEmployeeProfile}
        initialData={editingRequest}
      />

      {/* Cancel Confirmation Modal */}
      <CancelConfirmModal
        isOpen={cancelModalState.isOpen}
        request={cancelModalState.request}
        onClose={() => setCancelModalState({ isOpen: false, request: null })}
        onConfirm={handleConfirmCancel}
      />

      {/* Employee Leave Details Drawer */}
      <EmployeeLeaveDetailsDrawer
        selectedLeave={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onCancelClick={(req) => setCancelModalState({ isOpen: true, request: req })}
        onEditResubmitClick={handleEditResubmit}
      />
    </main>
  );
}

export default MyLeave;
