import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { ATTENDANCE_STATUS_OPTIONS } from '../../data/attendanceData';
import styles from './AttendanceCorrectionModal.module.css';

const INITIAL_FORM = {
  checkIn: '',
  checkOut: '',
  status: 'present',
  reason: ''
};

function AttendanceCorrectionModal({ record, onClose, onSubmit }) {
  const [form, setForm] = useState({
    checkIn: record?.checkIn || '',
    checkOut: record?.checkOut || '',
    status: record?.status === 'pendingCorrection' ? 'present' : (record?.status || 'present'),
    reason: ''
  });
  const [error, setError] = useState('');

  if (!record) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      setError('Please provide a reason for the correction.');
      return;
    }
    onSubmit({ ...form, attendanceId: record.id });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Edit Attendance</h3>
            <p className={styles.sub}>{record.employeeName} · {record.date}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.infoNote}>
            <AlertCircle size={14} />
            Submitting this correction will change the status to <strong>Pending Correction</strong> and send it for admin review.
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Check In Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Check Out Time</label>
              <input
                type="time"
                className={styles.formInput}
                value={form.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Requested Status</label>
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
            <label className={styles.formLabel}>
              Reason for Correction <span className={styles.required}>*</span>
            </label>
            <textarea
              className={`${styles.formInput} ${styles.textarea}`}
              placeholder="Explain why this correction is needed…"
              value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={3}
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AttendanceCorrectionModal;
