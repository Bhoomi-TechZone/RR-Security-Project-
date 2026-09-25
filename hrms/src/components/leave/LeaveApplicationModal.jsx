import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, FileText, Upload, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import styles from './LeaveApplicationModal.module.css';

export default function LeaveApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  employees = [],
  leaveTypes = [],
  employeeBalances = []
}) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedLeaveCode, setSelectedLeaveCode] = useState('CL');
  const [durationType, setDurationType] = useState('Full Day'); // 'Full Day' | 'Half Day' | 'Short Leave' | 'Multiple Days'
  const [halfDayType, setHalfDayType] = useState('First Half');
  const [shortStartTime, setShortStartTime] = useState('14:00');
  const [shortEndTime, setShortEndTime] = useState('16:00');
  const [fromDate, setFromDate] = useState('2026-09-08');
  const [toDate, setToDate] = useState('2026-09-08');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].employeeCode || employees[0].id || 'EMP001');
    }
  }, [employees, selectedEmpId, isOpen]);

  // Find selected employee object and their balance
  const currentEmployee = useMemo(() => {
    return employees.find(e => (e.employeeCode || e.id) === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  const currentEmpBalance = useMemo(() => {
    return employeeBalances.find(b => b.employeeCode === selectedEmpId);
  }, [employeeBalances, selectedEmpId]);

  const currentLeaveType = useMemo(() => {
    return leaveTypes.find(t => t.code === selectedLeaveCode) || leaveTypes[0];
  }, [leaveTypes, selectedLeaveCode]);

  // Compute available balance for current leave type
  const availableBalance = useMemo(() => {
    if (!currentEmpBalance || !currentEmpBalance.balances) return 8;
    const b = currentEmpBalance.balances[selectedLeaveCode];
    if (!b) return 0;
    return Math.max(0, b.opening + b.accrued - b.used - b.pending);
  }, [currentEmpBalance, selectedLeaveCode]);

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
    return Number(Math.max(0, availableBalance - requestedDays).toFixed(2));
  }, [availableBalance, requestedDays]);

  const isInsufficientBalance = currentLeaveType?.category === 'Paid' && requestedDays > availableBalance;

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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

    const payload = {
      id: `LV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: currentEmployee.employeeCode || currentEmployee.id,
      employeeName: currentEmployee.employeeName || currentEmployee.name,
      initials: (currentEmployee.employeeName || currentEmployee.name || 'EM').slice(0, 2).toUpperCase(),
      clientName: currentEmployee.client || 'ABC Security Services',
      site: currentEmployee.site || 'Delhi Site A',
      department: currentEmployee.department || 'Security',
      designation: currentEmployee.designation || 'Security Guard',
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
      supportingDocName: fileName || null,
      remarks: remarks.trim() || null,
      availableBalanceBefore: availableBalance,
      requestedDays,
      balanceAfter,
      siteManpower: {
        siteName: currentEmployee.site || 'Delhi Site A',
        totalGuards: 25,
        onDuty: 20,
        onLeave: 3,
        absent: 2,
        relieverAvailable: 2,
        minimumRequired: 20
      },
      status: 'Pending Supervisor Approval',
      currentApprover: 'Site Supervisor',
      workflowStage: 2,
      timeline: [
        {
          stage: 'Employee Applied',
          actor: `${currentEmployee.employeeName || currentEmployee.name} (${currentEmployee.employeeCode || currentEmployee.id})`,
          status: 'Completed',
          timestamp: new Date().toLocaleString(),
          remarks: reason.trim()
        },
        {
          stage: 'Site Supervisor Approval',
          actor: 'Assigned Site Supervisor',
          status: 'Pending',
          timestamp: null,
          remarks: null
        },
        {
          stage: 'HR Approval',
          actor: 'HR Manager',
          status: 'Queued',
          timestamp: null,
          remarks: null
        },
        {
          stage: 'Attendance Update',
          actor: 'Automated System',
          status: 'Queued',
          timestamp: null,
          remarks: 'Will sync to attendance upon HR sanction'
        },
        {
          stage: 'Payroll Calculation',
          actor: 'Payroll Engine',
          status: 'Queued',
          timestamp: null,
          remarks: currentLeaveType?.category === 'Paid' ? 'Paid Leave: No salary deduction' : 'Unpaid: Prorated deduction'
        }
      ],
      attendanceImpact: {
        status: currentLeaveType?.category === 'Paid' ? `Leave (${currentLeaveType.code})` : 'Leave Without Pay (LWP)',
        dailyCode: `L-${currentLeaveType?.code || 'CL'}`,
        salaryDeduction: currentLeaveType?.category === 'Unpaid',
        deductionDays: currentLeaveType?.category === 'Unpaid' ? requestedDays : 0
      },
      payrollImpact: {
        monthlySalary: 18000,
        monthlyWorkingDays: 30,
        paidLeaveDays: currentLeaveType?.category === 'Paid' ? requestedDays : 0,
        lwpDays: currentLeaveType?.category === 'Unpaid' ? requestedDays : 0,
        absentDays: 0,
        payableDays: currentLeaveType?.category === 'Unpaid' ? (30 - requestedDays) : 30,
        deductionAmount: currentLeaveType?.category === 'Unpaid' ? Math.round((18000 / 30) * requestedDays) : 0,
        note: currentLeaveType?.category === 'Paid'
          ? 'No deduction applicable for paid quota.'
          : `${requestedDays} day(s) salary deduction in monthly payroll.`
      },
      rejectionReason: null,
      sendBackReason: null
    };

    onSubmit(payload);
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
              <h2 className={styles.title}>Submit Leave Application</h2>
              <p className={styles.subtitle}>Apply for full-day, half-day, short leave, or multi-day absences</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
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
                onChange={(e) => setSelectedEmpId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.employeeCode || emp.id} value={emp.employeeCode || emp.id}>
                    {emp.employeeCode || emp.id} - {emp.employeeName || emp.name} ({emp.site || 'Site'})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Leave Type <span className={styles.req}>*</span></label>
              <select
                className={styles.select}
                value={selectedLeaveCode}
                onChange={(e) => setSelectedLeaveCode(e.target.value)}
              >
                {leaveTypes.map((type) => (
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
              {['Full Day', 'Half Day', 'Short Leave', 'Multiple Days'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.durationBtn} ${durationType === t ? styles.durationBtnActive : ''}`}
                  onClick={() => setDurationType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Duration Specific Fields */}
          {durationType === 'Half Day' && (
            <div className={styles.halfDayBox}>
              <label className={styles.label}>Select Half Day Shift</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="halfDay"
                    value="First Half"
                    checked={halfDayType === 'First Half'}
                    onChange={() => setHalfDayType('First Half')}
                  />
                  <span>First Half (Morning Shift / Before 1:30 PM)</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="halfDay"
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
            <div className={styles.shortLeaveBox}>
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
              <div className={styles.shortInfo}>
                <Clock size={15} />
                <span>Max 2 hours permitted as official permission pass</span>
              </div>
            </div>
          )}

          {/* Dates */}
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
                  onChange={(e) => setToDate(e.target.value)}
                />
                {errors.dateRange && <span className={styles.errorText}>{errors.dateRange}</span>}
              </div>
            )}
          </div>

          {/* Date-wise Breakdown for Multiple Days */}
          {durationType === 'Multiple Days' && dateBreakdown.length > 0 && (
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownTitle}>Date-wise Schedule Breakdown:</span>
              <div className={styles.breakdownList}>
                {dateBreakdown.map((item, idx) => (
                  <div key={idx} className={styles.breakdownChip}>
                    <span className={styles.chipDate}>{item.date}</span>
                    <span className={styles.chipType}>{item.dayType} ({item.units}d)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Balance Summary Bar */}
          <div className={styles.balanceSummaryBar}>
            <div className={styles.balanceCol}>
              <span className={styles.balColLabel}>Current Available</span>
              <span className={styles.balColVal}>{availableBalance} Days</span>
            </div>
            <div className={styles.balanceOp}>-</div>
            <div className={styles.balanceCol}>
              <span className={styles.balColLabel}>Requested Leave</span>
              <span className={`${styles.balColVal} ${styles.valReq}`}>{requestedDays} Days</span>
            </div>
            <div className={styles.balanceOp}>=</div>
            <div className={styles.balanceCol}>
              <span className={styles.balColLabel}>Balance After</span>
              <span className={`${styles.balColVal} ${styles.valAfter}`}>{balanceAfter} Days</span>
            </div>
          </div>

          {isInsufficientBalance && (
            <div className={styles.warningNote}>
              <AlertCircle size={16} />
              <span>
                <strong>Quota Exceeded:</strong> Requested duration ({requestedDays} days) exceeds available paid balance ({availableBalance} days). The excess leave may be marked as LWP upon approval.
              </span>
            </div>
          )}

          {/* Reason & Remarks */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Reason for Leave <span className={styles.req}>*</span></label>
            <textarea
              rows="2"
              placeholder="State the reason for leave application..."
              className={`${styles.textarea} ${errors.reason ? styles.inputError : ''}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {errors.reason && <span className={styles.errorText}>{errors.reason}</span>}
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Supporting Document (Optional)</label>
              <div className={styles.uploadArea}>
                <Upload size={16} className={styles.uploadIcon} />
                <label className={styles.uploadLabel}>
                  <span>{fileName ? fileName : 'Upload Prescription / Proof'}</span>
                  <input type="file" className={styles.hiddenFileInput} onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Internal Remarks / Handover Notes</label>
              <input
                type="text"
                placeholder="e.g. Reliever briefed for duty"
                className={styles.input}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Fixed Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button type="submit" form="leaveAppForm" className={styles.submitBtn}>
            <CheckCircle size={16} />
            <span>Submit Application</span>
          </button>
        </div>
      </div>
    </div>
  );
}
