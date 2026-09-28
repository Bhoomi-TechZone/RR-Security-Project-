import React, { useState } from 'react';
import { X, CheckCircle2, Clock, User, Building2 } from 'lucide-react';
import { ATTENDANCE_STATUS_OPTIONS } from '../../data/attendanceData';
import styles from './AttendanceCorrectionModal.module.css';

const to24Hour = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return `${String(match24[1]).padStart(2, '0')}:${match24[2]}`;
  }
  return '';
};

const to12Hour = (time24) => {
  if (!time24) return null;
  const match = String(time24).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time24;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m} ${period}`;
};

function AttendanceCorrectionModal({ record, onClose, onSubmit }) {
  const [form, setForm] = useState({
    checkIn: to24Hour(record?.checkIn),
    checkOut: to24Hour(record?.checkOut),
    status: record?.status === 'pendingCorrection' ? 'present' : (record?.status || 'present'),
    lateMinutes: record?.lateMinutes || 0,
    remarks: record?.remarks || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!record) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formattedCheckIn = form.status === 'absent' || form.status === 'onLeave' || form.status === 'leave' 
        ? null 
        : to12Hour(form.checkIn);
      const formattedCheckOut = form.status === 'absent' || form.status === 'onLeave' || form.status === 'leave' 
        ? null 
        : to12Hour(form.checkOut);

      await onSubmit({
        ...record,
        attendanceId: record.id || record._id,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        clientName: record.clientName || record.companyName,
        companyName: record.companyName || record.clientName,
        site: record.site,
        department: record.department,
        date: record.date,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        status: form.status,
        lateMinutes: Number(form.lateMinutes) || (form.status === 'late' ? 15 : 0),
        remarks: form.remarks,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Edit Attendance Record</h3>
            <p className={styles.sub}>{record.employeeName} ({record.employeeId}) · {record.date}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.instantNotice}>
            <CheckCircle2 size={16} color="#16a34a" />
            <span>Admin direct edit mode: Updates will be saved instantly to the database.</span>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Check In Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)}
                disabled={form.status === 'absent' || form.status === 'onLeave' || form.status === 'leave'}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Check Out Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)}
                disabled={form.status === 'absent' || form.status === 'onLeave' || form.status === 'leave'}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Attendance Status</label>
              <select
                className={styles.formInput}
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {ATTENDANCE_STATUS_OPTIONS.filter(o => o.value !== 'pendingCorrection').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Late Minutes (optional)</label>
              <input
                type="number"
                min="0"
                className={styles.formInput}
                value={form.lateMinutes}
                onChange={(e) => handleChange('lateMinutes', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Remarks / Reason for Edit</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="e.g. Approved manual check-in adjustment"
              value={form.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Update Immediately'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AttendanceCorrectionModal;
