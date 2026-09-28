import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, FileText, Upload, AlertCircle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import styles from './LeaveApplicationModal.module.css';

export default function LeaveApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialData = null,
  employees = [],
  leaveTypes = [],
  employeeBalances = []
}) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter active leave types configured in Leave Master
  const activeLeaveTypes = useMemo(() => {
    if (!Array.isArray(leaveTypes) || leaveTypes.length === 0) {
      return [
        { code: 'CL', name: 'Casual Leave', category: 'Paid', quota: 12, status: 'Active' },
        { code: 'SL', name: 'Sick / Medical Leave', category: 'Paid', quota: 8, status: 'Active' },
        { code: 'EL', name: 'Earned / Privilege Leave', category: 'Paid', quota: 15, status: 'Active' },
        { code: 'LWP', name: 'Leave Without Pay', category: 'Unpaid', quota: 30, status: 'Active' },
      ];
    }
    const filtered = leaveTypes.filter((t) => {
      const s = String(t.status || 'Active').toLowerCase();
      return s === 'active';
    });
    return filtered.length > 0 ? filtered : leaveTypes;
  }, [leaveTypes]);

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedLeaveCode, setSelectedLeaveCode] = useState('CL');
  const [durationType, setDurationType] = useState('Full Day'); // 'Full Day' | 'Half Day' | 'Short Leave' | 'Multiple Days'
  const [halfDayType, setHalfDayType] = useState('First Half');
  const [shortStartTime, setShortStartTime] = useState('14:00');
  const [shortEndTime, setShortEndTime] = useState('16:00');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setSelectedEmpId(initialData.employeeId || initialData.employeeCode || '');
        setSelectedLeaveCode(initialData.leaveCode || activeLeaveTypes[0]?.code || 'CL');
        setDurationType(initialData.durationType || 'Full Day');
        setHalfDayType(initialData.halfDayType || 'First Half');
        setShortStartTime(initialData.shortLeaveTime?.start || '14:00');
        setShortEndTime(initialData.shortLeaveTime?.end || '16:00');
        setFromDate(initialData.fromDate || initialData.from || todayStr);
        setToDate(initialData.toDate || initialData.to || initialData.fromDate || initialData.from || todayStr);
        setReason(initialData.reason || '');
        setRemarks(initialData.remarks || '');
      } else {
        if (employees && employees.length > 0) {
          const exists = employees.some(
            (e) => (e.employeeId || e.employeeCode || e.id || e._id) === selectedEmpId
          );
          if (!selectedEmpId || !exists) {
            const first = employees[0];
            setSelectedEmpId(first.employeeId || first.employeeCode || first.id || first._id || '');
          }
        }
        if (!selectedLeaveCode || !activeLeaveTypes.some((t) => t.code === selectedLeaveCode)) {
          setSelectedLeaveCode(activeLeaveTypes[0]?.code || 'CL');
        }
        setFromDate(todayStr);
        setToDate(todayStr);
        setReason('');
        setRemarks('');
      }
    } else {
      setIsSubmitting(false);
      setErrors({});
    }
  }, [isOpen, initialData, mode, employees, activeLeaveTypes]);


  // Find selected employee object
  const currentEmployee = useMemo(() => {
    if (!employees || employees.length === 0) return null;
    return (
      employees.find((e) => {
        const id = e.employeeId || e.employeeCode || e.id || e._id;
        return id === selectedEmpId;
      }) || employees[0]
    );
  }, [employees, selectedEmpId]);

  // Find balance record for selected employee
  const currentEmpBalance = useMemo(() => {
    if (!employeeBalances || employeeBalances.length === 0) return null;
    const empId = currentEmployee ? (currentEmployee.employeeId || currentEmployee.employeeCode || currentEmployee.id || currentEmployee._id) : selectedEmpId;
    return employeeBalances.find((b) => {
      const bId = b.employeeId || b.employeeCode || b.id || b._id;
      return bId === selectedEmpId || bId === empId;
    });
  }, [employeeBalances, selectedEmpId, currentEmployee]);

  const currentLeaveType = useMemo(() => {
    return (
      activeLeaveTypes.find((t) => t.code === selectedLeaveCode) ||
      (Array.isArray(leaveTypes) && leaveTypes.find((t) => t.code === selectedLeaveCode)) ||
      activeLeaveTypes[0] ||
      { code: 'CL', name: 'Casual Leave', category: 'Paid', quota: 12 }
    );
  }, [activeLeaveTypes, leaveTypes, selectedLeaveCode]);

  // Compute available balance for current employee & current leave type
  const availableBalance = useMemo(() => {
    if (currentLeaveType?.category === 'Unpaid' || currentLeaveType?.code === 'LWP') return 0;
    if (!currentEmpBalance || !currentEmpBalance.balances) {
      return Number(currentLeaveType?.quota ?? currentLeaveType?.annualQuota) || 12;
    }
    const b = currentEmpBalance.balances[selectedLeaveCode];
    if (!b) {
      return Number(currentLeaveType?.quota ?? currentLeaveType?.annualQuota) || 12;
    }
    const opening = Number(b.opening) || 0;
    const accrued = Number(b.accrued) || 0;
    const used = Number(b.used) || 0;
    const pending = Number(b.pending) || 0;
    return Math.max(0, opening + accrued - used - pending);
  }, [currentEmpBalance, selectedLeaveCode, currentLeaveType]);

  // Calculate requested days & date-wise breakdown
  const { requestedDays, dateBreakdown } = useMemo(() => {
    if (durationType === 'Half Day') {
      return {
        requestedDays: 0.5,
        dateBreakdown: [{ date: fromDate, dayType: `${halfDayType} (0.5 Day)`, units: 0.5 }]
      };
    }
    if (durationType === 'Short Leave') {
      return {
        requestedDays: 0.25,
        dateBreakdown: [{ date: fromDate, dayType: `Short Leave (${shortStartTime} - ${shortEndTime})`, units: 0.25 }]
      };
    }
    if (durationType === 'Full Day') {
      return {
        requestedDays: 1.0,
        dateBreakdown: [{ date: fromDate, dayType: 'Full Day', units: 1.0 }]
      };
    }

    // Multiple Days
    if (!fromDate || !toDate || fromDate > toDate) {
      return { requestedDays: 0, dateBreakdown: [] };
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffDays = Math.round((end - start) / 86400000) + 1;
    const list = [];

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      list.push({ date: str, dayType: 'Full Day', units: 1.0 });
    }

    return {
      requestedDays: Number(diffDays.toFixed(1)),
      dateBreakdown: list
    };
  }, [durationType, halfDayType, shortStartTime, shortEndTime, fromDate, toDate]);

  const balanceAfter = useMemo(() => {
    if (currentLeaveType?.category === 'Unpaid') return 0;
    return Number(Math.max(0, availableBalance - requestedDays).toFixed(2));
  }, [availableBalance, requestedDays, currentLeaveType]);

  const isInsufficientBalance = currentLeaveType?.category === 'Paid' && requestedDays > availableBalance;

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errs = {};
    if (!selectedEmpId) errs.selectedEmpId = 'Please select an employee';
    if (!reason.trim()) errs.reason = 'Leave reason is required';
    if (durationType === 'Multiple Days' && fromDate > toDate) {
      errs.dateRange = 'To Date cannot be before From Date';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const empId = currentEmployee ? (currentEmployee.employeeId || currentEmployee.employeeCode || currentEmployee.id) : selectedEmpId;
    const empName = currentEmployee ? (currentEmployee.name || currentEmployee.employeeName) : 'Employee';
    const clientName = currentEmployee ? (currentEmployee.clientName || currentEmployee.client || 'RR Security') : 'RR Security';
    const site = currentEmployee ? (currentEmployee.siteLocation || currentEmployee.dutyPost || currentEmployee.site || 'Main Site') : 'Main Site';
    const department = currentEmployee ? (currentEmployee.department || 'Security') : 'Security';
    const designation = currentEmployee ? (currentEmployee.designation || 'Security Guard') : 'Security Guard';

    const payload = {
      ...(initialData || {}),
      id: initialData?.id || initialData?.leaveId || `LV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      _id: initialData?._id,
      employeeId: empId,
      employeeName: empName,
      initials: (empName || 'EM').slice(0, 2).toUpperCase(),
      clientName,
      site,
      department,
      designation,
      leaveCode: currentLeaveType?.code || 'CL',
      leaveType: currentLeaveType?.name || 'Casual Leave',
      category: currentLeaveType?.category || 'Paid',
      durationType,
      halfDayType: durationType === 'Half Day' ? halfDayType : null,
      shortLeaveTime: durationType === 'Short Leave' ? { start: shortStartTime, end: shortEndTime } : null,
      fromDate,
      toDate: durationType === 'Multiple Days' ? toDate : fromDate,
      days: requestedDays,
      dateBreakdown,
      reason: reason.trim(),
      supportingDocName: fileName || initialData?.supportingDocName || null,
      remarks: remarks.trim() || null,
      availableBalanceBefore: availableBalance,
      requestedDays,
      balanceAfter,
      siteManpower: initialData?.siteManpower || {
        siteName: site,
        totalGuards: 25,
        onDuty: 20,
        onLeave: 3,
        absent: 2,
        relieverAvailable: 2,
        minimumRequired: 20
      },
      status: initialData?.status || 'Approved',
      currentApprover: initialData?.currentApprover || 'Fully Processed',
      workflowStage: initialData?.workflowStage || 3,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      console.error('Error submitting leave:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <Calendar size={18} />
            </div>
            <div>
              <h2 className={styles.title}>
                {mode === 'edit' ? 'Edit Leave Record' : 'Submit Leave Application'}
              </h2>
              <p className={styles.subtitle}>
                {mode === 'edit'
                  ? 'Update leave dates, duration, employee assignment, or reason'
                  : 'Apply for full-day, half-day, short leave, or multi-day absences'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onClose} 
            disabled={isSubmitting} 
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form id="leaveAppForm" onSubmit={handleSubmit} className={styles.body}>
          {/* Employee & Type Selection */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Employee <span className={styles.req}>*</span></label>
              <select
                className={styles.select}
                value={selectedEmpId}
                disabled={isSubmitting}
                onChange={(e) => setSelectedEmpId(e.target.value)}
              >
                {employees.map((emp) => {
                  const idVal = emp.employeeId || emp.employeeCode || emp.id || emp._id;
                  const nameVal = emp.name || emp.employeeName || 'Employee';
                  const siteVal = emp.siteLocation || emp.dutyPost || emp.site || emp.clientName || 'Main Site';
                  return (
                    <option key={idVal} value={idVal}>
                      {idVal} - {nameVal} ({siteVal})
                    </option>
                  );
                })}
              </select>
              {errors.selectedEmpId && <span className={styles.errorText}>{errors.selectedEmpId}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Leave Type <span className={styles.req}>*</span></label>
              <select
                className={styles.select}
                value={selectedLeaveCode}
                disabled={isSubmitting}
                onChange={(e) => setSelectedLeaveCode(e.target.value)}
              >
                {activeLeaveTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.code} - {type.name} ({type.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration Type Selector Buttons */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Leave Duration Type <span className={styles.req}>*</span></label>
            <div className={styles.durationTypeGrid}>
              {['Full Day', 'Half Day', 'Short Leave', 'Multiple Days'].map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={isSubmitting}
                  className={`${styles.durationBtn} ${durationType === type ? styles.durationBtnActive : ''}`}
                  onClick={() => setDurationType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Duration Options */}
          {durationType === 'Half Day' && (
            <div className={styles.halfDayBox}>
              <label className={styles.label}>Select Half-Day Session</label>
              <div className={styles.radioGroup}>
                {['First Half (Shift Start - Midday)', 'Second Half (Midday - Shift End)'].map((opt) => (
                  <label key={opt} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="halfDayType"
                      disabled={isSubmitting}
                      value={opt.split(' ')[0]}
                      checked={halfDayType === opt.split(' ')[0]}
                      onChange={(e) => setHalfDayType(e.target.value)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {durationType === 'Short Leave' && (
            <div className={styles.shortLeaveBox}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Exit / Start Time</label>
                <input
                  type="time"
                  className={styles.input}
                  disabled={isSubmitting}
                  value={shortStartTime}
                  onChange={(e) => setShortStartTime(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Return / End Time</label>
                <input
                  type="time"
                  className={styles.input}
                  disabled={isSubmitting}
                  value={shortEndTime}
                  onChange={(e) => setShortEndTime(e.target.value)}
                />
              </div>
              <div className={styles.shortInfo}>
                <Clock size={16} />
                <span>Short leave permits up to 2 hours with supervisor handover.</span>
              </div>
            </div>
          )}

          {/* Date Picker Range */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {durationType === 'Multiple Days' ? 'From Date' : 'Leave Date'} <span className={styles.req}>*</span>
              </label>
              <input
                type="date"
                className={styles.input}
                disabled={isSubmitting}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {durationType === 'Multiple Days' ? (
              <div className={styles.formGroup}>
                <label className={styles.label}>To Date <span className={styles.req}>*</span></label>
                <input
                  type="date"
                  className={styles.input}
                  disabled={isSubmitting}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                {errors.dateRange && <span className={styles.errorText}>{errors.dateRange}</span>}
              </div>
            ) : (
              <div className={styles.formGroup}>
                <label className={styles.label}>Duration Summary</label>
                <input
                  type="text"
                  className={styles.input}
                  style={{ background: 'var(--surface-alt)', cursor: 'default' }}
                  readOnly
                  value={`${requestedDays} Day (${durationType})`}
                />
              </div>
            )}
          </div>

          {/* Date-wise schedule breakdown preview */}
          {durationType === 'Multiple Days' && dateBreakdown.length > 0 && (
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownTitle}>Date-wise Schedule Breakdown:</span>
              <div className={styles.breakdownList}>
                {dateBreakdown.map((b) => (
                  <span key={b.date} className={styles.breakdownChip}>
                    <span className={styles.chipDate}>{b.date}:</span>
                    <span className={styles.chipType}>Full Day (1d)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Dynamic Balance Calculator per selected Employee */}
          <div className={styles.balanceSummaryBar}>
            <div className={styles.balanceCol}>
              <span className={styles.balColLabel}>Current Available</span>
              <span className={styles.balColVal}>{availableBalance} Days</span>
            </div>
            <span className={styles.balanceOp}>-</span>
            <div className={styles.balanceCol}>
              <span className={styles.balColLabel}>Requested Leave</span>
              <span className={`${styles.balColVal} ${styles.valReq}`}>{requestedDays} Days</span>
            </div>
            <span className={styles.balanceOp}>=</span>
            <div className={styles.balanceCol}>
              <span className={styles.balColLabel}>Balance After</span>
              <span className={`${styles.balColVal} ${styles.valAfter}`}>
                {balanceAfter} Days
              </span>
            </div>
          </div>

          {isInsufficientBalance && (
            <div className={styles.warningNote}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Requested leave ({requestedDays} d) exceeds available paid quota ({availableBalance} d).
                Remaining days will be treated as Leave Without Pay (LWP).
              </span>
            </div>
          )}

          {/* Reason */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Reason for Leave <span className={styles.req}>*</span></label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="State the reason for leave application..."
              value={reason}
              disabled={isSubmitting}
              onChange={(e) => setReason(e.target.value)}
            />
            {errors.reason && <span className={styles.errorText}>{errors.reason}</span>}
          </div>

          {/* Supporting Document & Internal Remarks */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Supporting Document (Optional)</label>
              <label className={styles.uploadArea} style={isSubmitting ? { pointerEvents: 'none', opacity: 0.6 } : {}}>
                <Upload size={14} className={styles.uploadIcon} />
                <span className={styles.uploadLabel}>{fileName ? fileName : 'Upload Prescription / Proof'}</span>
                <input type="file" onChange={handleFileChange} disabled={isSubmitting} className={styles.hiddenFileInput} />
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Internal Remarks / Handover Notes</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Reliever briefed for duty"
                value={remarks}
                disabled={isSubmitting}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <button 
            type="button" 
            className={styles.cancelBtn} 
            onClick={onClose} 
            disabled={isSubmitting}
            style={isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="leaveAppForm" 
            className={styles.submitBtn} 
            disabled={isSubmitting}
            style={isSubmitting ? { opacity: 0.75, cursor: 'not-allowed' } : {}}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                <span>{mode === 'edit' ? 'Updating Leave...' : 'Applying Leave...'}</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{mode === 'edit' ? 'Update Leave' : 'Submit Application'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
