import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Calendar,
  Building2,
  FileSpreadsheet,
  Calculator,
  Check,
} from 'lucide-react';
import styles from './AttendanceCorrectionModal.module.css';

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns exact days in a given month & year (e.g. Sept -> 30, Jan -> 31, Feb -> 28/29)
 */
export const getDaysInMonth = (monthName, year) => {
  const months = {
    january: 0, jan: 0, '01': 0, '1': 0,
    february: 1, feb: 1, '02': 1, '2': 1,
    march: 2, mar: 2, '03': 2, '3': 2,
    april: 3, apr: 3, '04': 3, '4': 3,
    may: 4, '05': 4, '5': 4,
    june: 5, jun: 5, '06': 5, '6': 5,
    july: 6, jul: 6, '07': 6, '7': 6,
    august: 7, aug: 7, '08': 7, '8': 7,
    september: 8, sept: 8, sep: 8, '09': 8, '9': 8,
    october: 9, oct: 9, '10': 9,
    november: 10, nov: 10, '11': 10,
    december: 11, dec: 11, '12': 11
  };
  const mLower = String(monthName || '').trim().toLowerCase();
  let mIdx = new Date().getMonth();
  let y = Number(year) || new Date().getFullYear();

  if (/^\d{4}-\d{1,2}$/.test(mLower)) {
    const [yPart, mPart] = mLower.split('-');
    y = Number(yPart) || y;
    mIdx = months[mPart] !== undefined ? months[mPart] : (Number(mPart) - 1);
  } else if (months[mLower] !== undefined) {
    mIdx = months[mLower];
  }

  return new Date(y, mIdx + 1, 0).getDate();
};

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  { value: 'absent', label: 'Absent', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  { value: 'halfDay', label: 'Half Day', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' },
  { value: 'onLeave', label: 'On Leave', color: '#7c3aed', bg: '#ede9fe', border: '#d8b4fe' },
  { value: 'late', label: 'Late', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { value: 'weekOff', label: 'Week Off', color: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
  { value: 'holiday', label: 'Holiday', color: '#ea580c', bg: '#ffedd5', border: '#fdba74' },
];

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '—';
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return str;
};

const getInitialsBg = (initials = '') => {
  const colors = [
    '#2563eb', '#7c3aed', '#059669', '#d97706',
    '#dc2626', '#0891b2', '#4f46e5', '#ca8a04'
  ];
  let sum = 0;
  for (let i = 0; i < initials.length; i++) {
    sum += initials.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

function AttendanceCorrectionModal({ isOpen, record, onClose, onSubmit, activeTab }) {
  if (!isOpen || !record) return null;

  const isSimpleMode = activeTab !== 'overview';
  const currentYear = new Date().getFullYear();

  // Normalize initial status
  let initialStatus = record?.status ? String(record.status).toLowerCase().replace(/[-_ ]/g, '') : 'present';
  if (initialStatus === 'leave') initialStatus = 'onLeave';
  if (initialStatus === 'half_day') initialStatus = 'halfDay';
  if (initialStatus === 'week_off' || initialStatus === 'weeklyoff') initialStatus = 'weekOff';
  const matchedOpt = STATUS_OPTIONS.find((opt) => opt.value.toLowerCase() === initialStatus);
  const normalizedStatus = matchedOpt ? matchedOpt.value : (record?.status || 'present');

  // Derive initial values from record
  const initialMonth = record?.month || (record?.date ? new Date(record.date).toLocaleString('default', { month: 'long' }) : 'October');
  const initialYear = record?.year || (record?.date ? new Date(record.date).getFullYear() : currentYear);

  const initialWeekOff = record?.weekOff !== undefined ? Number(record.weekOff) : 0;
  const initialHolidays = record?.holidays !== undefined ? Number(record.holidays) : 0;
  const initialCl = record?.cl !== undefined ? Number(record.cl) : 0;
  const initialSl = record?.sl !== undefined ? Number(record.sl) : 0;
  const initialEl = record?.el !== undefined ? Number(record.el) : 0;
  const initialLwp = record?.lwp !== undefined ? Number(record.lwp) : 0;

  const monthDaysAtStart = getDaysInMonth(initialMonth, initialYear);
  const nonPresentTotalAtStart = initialWeekOff + initialHolidays + initialCl + initialSl + initialEl + initialLwp;

  let initialPresent = record?.present !== undefined ? Number(record.present) : Math.max(0, monthDaysAtStart - nonPresentTotalAtStart);
  if (initialPresent + nonPresentTotalAtStart > monthDaysAtStart) {
    initialPresent = Math.max(0, monthDaysAtStart - nonPresentTotalAtStart);
  }

  const [form, setForm] = useState({
    employeeId: record?.employeeId || '',
    employeeName: record?.employeeName || '',
    fatherName: record?.fatherName || '',
    month: initialMonth,
    year: initialYear,
    present: initialPresent,
    weekOff: initialWeekOff,
    holidays: initialHolidays,
    cl: initialCl,
    sl: initialSl,
    el: initialEl,
    lwp: initialLwp,
    status: normalizedStatus,
    remarks: record?.remarks || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Days in selected month & year (Working Days)
  const monthDays = useMemo(() => {
    return getDaysInMonth(form.month, form.year);
  }, [form.month, form.year]);

  // Real-time calculated Total Paid Days
  const computedPaidDays = useMemo(() => {
    const p = Number(form.present) || 0;
    const wo = Number(form.weekOff) || 0;
    const h = Number(form.holidays) || 0;
    const cl = Number(form.cl) || 0;
    const sl = Number(form.sl) || 0;
    const el = Number(form.el) || 0;
    return p + wo + h + cl + sl + el;
  }, [form.present, form.weekOff, form.holidays, form.cl, form.sl, form.el]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePeriodChange = (key, value) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      const totalDays = getDaysInMonth(updated.month, updated.year);
      const wo = Number(updated.weekOff) || 0;
      const h = Number(updated.holidays) || 0;
      const cl = Number(updated.cl) || 0;
      const sl = Number(updated.sl) || 0;
      const el = Number(updated.el) || 0;
      const lwp = Number(updated.lwp) || 0;
      const nonPresent = wo + h + cl + sl + el + lwp;
      const autoPresent = Math.max(0, totalDays - nonPresent);

      return {
        ...updated,
        present: autoPresent,
      };
    });
  };

  const handleLeaveChange = (key, rawVal) => {
    const num = rawVal === '' ? '' : Math.max(0, Number(rawVal));
    setForm((prev) => {
      const updated = { ...prev, [key]: num };
      const totalDays = getDaysInMonth(updated.month, updated.year);
      const wo = Number(key === 'weekOff' ? (rawVal === '' ? 0 : num) : updated.weekOff) || 0;
      const h = Number(key === 'holidays' ? (rawVal === '' ? 0 : num) : updated.holidays) || 0;
      const cl = Number(key === 'cl' ? (rawVal === '' ? 0 : num) : updated.cl) || 0;
      const sl = Number(key === 'sl' ? (rawVal === '' ? 0 : num) : updated.sl) || 0;
      const el = Number(key === 'el' ? (rawVal === '' ? 0 : num) : updated.el) || 0;
      const lwp = Number(key === 'lwp' ? (rawVal === '' ? 0 : num) : updated.lwp) || 0;

      const nonPresent = wo + h + cl + sl + el + lwp;
      const autoPresent = Math.max(0, totalDays - nonPresent);

      return {
        ...updated,
        present: autoPresent,
      };
    });
  };

  const handlePresentChange = (rawVal) => {
    const num = rawVal === '' ? '' : Math.max(0, Number(rawVal));
    setForm((prev) => ({ ...prev, present: num }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isSimpleMode) {
        await onSubmit({
          ...record,
          attendanceId: record.id || record._id,
          employeeId: String(form.employeeId).trim(),
          employeeName: String(form.employeeName).trim(),
          fatherName: String(form.fatherName).trim(),
          status: form.status,
          remarks: form.remarks,
        });
      } else {
        const present = Number(form.present) || 0;
        const weekOff = Number(form.weekOff) || 0;
        const holidays = Number(form.holidays) || 0;
        const cl = Number(form.cl) || 0;
        const sl = Number(form.sl) || 0;
        const el = Number(form.el) || 0;
        const lwp = Number(form.lwp) || 0;
        const totalPaidDays = computedPaidDays;
        const workingDays = monthDays;

        await onSubmit({
          ...record,
          attendanceId: record.id || record._id,
          employeeId: String(form.employeeId).trim(),
          employeeName: String(form.employeeName).trim(),
          fatherName: String(form.fatherName).trim(),
          month: form.month,
          year: Number(form.year) || currentYear,
          present,
          weekOff,
          holidays,
          cl,
          sl,
          el,
          lwp,
          totalPaidDays,
          workingDays,
          workingHours: `${present} days`,
          status: present > 0 ? 'present' : (lwp > 0 ? 'absent' : 'onLeave'),
          remarks: form.remarks,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const activeStatusConfig = STATUS_OPTIONS.find((opt) => opt.value === form.status) || STATUS_OPTIONS[0];
  const empInitials = record.initials || (record.employeeName || 'EM').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`${styles.modal} ${isSimpleMode ? styles.simpleModal : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Edit Attendance Record</h3>
            <p className={styles.sub}>
              {isSimpleMode
                ? 'Update attendance status and remarks for this record'
                : 'Update employee attendance & leave metrics matching the Excel format'}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form className={styles.body} onSubmit={handleSubmit}>
          {isSimpleMode ? (
            <>
              {/* Context Information Card */}
              <div className={styles.contextCard}>
                <div className={styles.contextHeader}>
                  <div className={styles.contextEmp}>
                    <div
                      className={styles.avatar}
                      style={{ background: getInitialsBg(empInitials) }}
                    >
                      {empInitials}
                    </div>
                    <div className={styles.empDetails}>
                      <span className={styles.empName}>{record.employeeName || 'Employee'}</span>
                      <span className={styles.empId}>
                        {record.employeeId} {record.fatherName ? `• S/O ${record.fatherName}` : ''}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        background: activeStatusConfig.bg,
                        color: activeStatusConfig.color,
                        border: `1px solid ${activeStatusConfig.border}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}
                    >
                      {activeStatusConfig.label}
                    </span>
                  </div>
                </div>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <Calendar size={13} color="#64748b" />
                    <span>{formatDisplayDate(record.date)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Building2 size={13} color="#64748b" />
                    <span>{record.companyName || record.clientName || 'RR Security & Facilities'}</span>
                  </div>
                  {record.site && (
                    <div className={styles.metaItem}>
                      <span>Site: <strong>{record.site}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Field */}
              <div className={styles.formGroup} style={{ marginTop: '4px' }}>
                <label className={styles.formLabel}>ATTENDANCE STATUS *</label>
                <select
                  className={styles.formInput}
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  style={{ fontWeight: 600, cursor: 'pointer' }}
                  required
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Quick Select Status Pills */}
                <div className={styles.statusPillsGrid}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = form.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={`${styles.statusPillBtn} ${isSelected ? styles.statusPillBtnActive : ''}`}
                        onClick={() => handleChange('status', opt.value)}
                        style={
                          isSelected
                            ? {
                                background: opt.bg,
                                borderColor: opt.border,
                                color: opt.color,
                              }
                            : {}
                        }
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Remarks Field (Input field) */}
              <div className={styles.formGroup} style={{ marginTop: '4px' }}>
                <label className={styles.formLabel}>REMARKS</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Enter remarks (e.g. Duty adjusted, approved leave, biometric issue)"
                  value={form.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  autoFocus
                />
              </div>
            </>
          ) : (
            <>
              {/* Overview Tab: Full Monthly Breakdown */}
              <div className={styles.sectionHeader}>
                <User size={15} color="#2563eb" />
                <span>Employee & Period Details</span>
              </div>

              <div className={styles.formGrid5}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>EMPID *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.employeeId}
                    onChange={(e) => handleChange('employeeId', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>EMPLOYEE NAME *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.employeeName}
                    onChange={(e) => handleChange('employeeName', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>FATHER NAME</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Father's Name"
                    value={form.fatherName}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>MONTH</label>
                  <select
                    className={styles.formInput}
                    value={form.month}
                    onChange={(e) => handlePeriodChange('month', e.target.value)}
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>YEAR</label>
                  <input
                    type="number"
                    min="2020"
                    max="2035"
                    className={styles.formInput}
                    value={form.year}
                    onChange={(e) => handlePeriodChange('year', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.sectionHeader}>
                <FileSpreadsheet size={15} color="#16a34a" />
                <span>Attendance & Leaves Breakdown (Days)</span>
              </div>

              <div className={styles.formGrid7}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#16a34a' }}>
                    PRESENT *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={`${styles.formInput} ${styles.inputHighlight}`}
                    value={form.present}
                    onChange={(e) => handlePresentChange(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#2563eb' }}>
                    WEEK OFF
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={styles.formInput}
                    value={form.weekOff}
                    onChange={(e) => handleLeaveChange('weekOff', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#d97706' }}>
                    HOLIDAYS
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={styles.formInput}
                    value={form.holidays}
                    onChange={(e) => handleLeaveChange('holidays', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#7c3aed' }}>
                    CL (Casual)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={styles.formInput}
                    value={form.cl}
                    onChange={(e) => handleLeaveChange('cl', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#0284c7' }}>
                    SL (Sick)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={styles.formInput}
                    value={form.sl}
                    onChange={(e) => handleLeaveChange('sl', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#0d9488' }}>
                    EL (Earn)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={styles.formInput}
                    value={form.el}
                    onChange={(e) => handleLeaveChange('el', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#dc2626' }}>
                    LWP (Unpaid)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={monthDays}
                    className={styles.formInput}
                    value={form.lwp}
                    onChange={(e) => handleLeaveChange('lwp', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.totalSummaryCard}>
                <div className={styles.totalInfo}>
                  <Calculator size={18} color="#166534" />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#166534' }}>
                      Working Days ({form.month} {form.year}):
                    </span>
                    <div style={{ fontSize: 11, color: '#15803d', fontWeight: 500, marginTop: 1 }}>
                      Total days in {form.month} {form.year} (Present: {form.present}d + Off/Holidays: {(Number(form.weekOff) || 0) + (Number(form.holidays) || 0)}d + Leaves: {(Number(form.cl) || 0) + (Number(form.sl) || 0) + (Number(form.el) || 0) + (Number(form.lwp) || 0)}d)
                    </div>
                  </div>
                </div>
                <div className={styles.totalDaysValue}>
                  {monthDays} Days
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Remarks / Edit Reason (Optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Updated monthly attendance summary from register"
                  value={form.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Update Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AttendanceCorrectionModal;
