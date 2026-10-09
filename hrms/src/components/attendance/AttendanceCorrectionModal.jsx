import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, User, FileSpreadsheet, Calculator } from 'lucide-react';
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
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sept: 8, sep: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
  };
  const mLower = String(monthName || '').trim().toLowerCase();
  const mIdx = months[mLower] !== undefined ? months[mLower] : new Date().getMonth();
  const y = Number(year) || new Date().getFullYear();
  return new Date(y, mIdx + 1, 0).getDate();
};

function AttendanceCorrectionModal({ record, onClose, onSubmit }) {
  const currentYear = new Date().getFullYear();

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

  // If record has explicit present, ensure it stays within month days or auto-deducts
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
    remarks: record?.remarks || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!record) return null;

  // Days in selected month & year (Working Days)
  const monthDays = useMemo(() => {
    return getDaysInMonth(form.month, form.year);
  }, [form.month, form.year]);

  // Real-time calculated Total Paid Days (Present + Week Off + Holidays + CL + SL + EL)
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

  // When Month or Year changes, recalculate month days and auto-adjust present days
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

  // When User modifies any Leave (CL, SL, EL, LWP), Week Off, or Holidays:
  // Automatically deduct from Present days to maintain exact total month working days
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

  // User directly edits present days
  const handlePresentChange = (rawVal) => {
    const num = rawVal === '' ? '' : Math.max(0, Number(rawVal));
    setForm((prev) => ({ ...prev, present: num }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Edit Attendance Record</h3>
            <p className={styles.sub}>
              Update employee attendance & leave metrics matching the Excel format
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form className={styles.body} onSubmit={handleSubmit}>
          {/* Section 1: Employee & Period Identification */}
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

          {/* Section 2: Attendance & Leave Days Breakdown */}
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
                title="Present days automatically adjust when leaves or off-days are changed"
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

          {/* Real-time Working Days Summary Box */}
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
              placeholder="e.g. Updated monthly attendance summary from attendance register"
              value={form.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
            />
          </div>

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
