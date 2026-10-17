import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, CheckCircle2, Calendar, FileText, Send, HelpCircle, Loader2 } from 'lucide-react';
import styles from './EmployeeAttendanceCorrectionModal.module.css';

const CATEGORIES = [
  'Forgot to Punch In / Out',
  'Biometric Machine / Device Error',
  'On-Duty / Outdoor Client Visit',
  'Shift Schedule Timing Mismatch',
  'System / Network Glitch',
  'Other'
];

function EmployeeAttendanceCorrectionModal({
  isOpen,
  record,
  onClose,
  onSubmit,
  employeeInfo = {}
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [requestedCheckIn, setRequestedCheckIn] = useState('09:00');
  const [requestedCheckOut, setRequestedCheckOut] = useState('18:00');
  const [requestedStatus, setRequestedStatus] = useState('Present');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state when record changes
  useEffect(() => {
    if (record) {
      setSelectedDate(record.date || new Date().toISOString().split('T')[0]);
      
      // Try to parse existing checkIn time or default
      if (record.checkIn && record.checkIn !== '—') {
        const timeMatch = record.checkIn.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const isPM = /pm/i.test(record.checkIn);
          let h = parseInt(timeMatch[1], 10);
          if (isPM && h < 12) h += 12;
          if (!isPM && h === 12) h = 0;
          setRequestedCheckIn(`${String(h).padStart(2, '0')}:${timeMatch[2]}`);
        } else {
          setRequestedCheckIn('09:00');
        }
      } else {
        setRequestedCheckIn('09:00');
      }

      if (record.checkOut && record.checkOut !== '—') {
        const timeMatch = record.checkOut.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const isPM = /pm/i.test(record.checkOut);
          let h = parseInt(timeMatch[1], 10);
          if (isPM && h < 12) h += 12;
          if (!isPM && h === 12) h = 0;
          setRequestedCheckOut(`${String(h).padStart(2, '0')}:${timeMatch[2]}`);
        } else {
          setRequestedCheckOut('18:00');
        }
      } else {
        setRequestedCheckOut('18:00');
      }

      setRequestedStatus(record.status || 'Present');
      setReason('');
      setErrors({});
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setRequestedCheckIn('09:00');
      setRequestedCheckOut('18:00');
      setRequestedStatus('Present');
      setReason('');
      setErrors({});
    }
  }, [record, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!selectedDate) {
      errs.date = 'Date is required.';
    }
    if (!requestedCheckIn) {
      errs.checkIn = 'Requested Check-In time is required.';
    }
    if (!requestedCheckOut) {
      errs.checkOut = 'Requested Check-Out time is required.';
    }
    if (!reason.trim()) {
      errs.reason = 'Please explain the reason for this correction.';
    } else if (reason.trim().length < 10) {
      errs.reason = 'Reason must be at least 10 characters long.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '—';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        attendanceId: record?.id || record?._id || `att_${Date.now()}`,
        employeeId: employeeInfo.employeeId || record?.employeeId || 'EMP001',
        employeeName: employeeInfo.name || record?.employeeName || 'Employee',
        clientName: record?.clientName || record?.companyName || employeeInfo.companyName || 'General',
        companyName: record?.companyName || record?.clientName || employeeInfo.companyName || 'General',
        site: record?.site || 'Main Site',
        date: selectedDate,
        originalCheckIn: record?.checkIn || 'Missing',
        originalCheckOut: record?.checkOut || 'Missing',
        originalStatus: record?.status || 'Absent',
        requestedCheckIn: formatTo12Hour(requestedCheckIn),
        requestedCheckOut: formatTo12Hour(requestedCheckOut),
        requestedStatus,
        category,
        reason: reason.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pendingCorrection'
      };

      await onSubmit(payload);
    } catch (err) {
      console.error('Error submitting correction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const originalIn = record?.checkIn || 'Not Recorded';
  const originalOut = record?.checkOut || 'Not Recorded';
  const originalStatus = record?.status || 'Absent';

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.headerIcon}>
              <Clock size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Request Attendance Correction</h2>
              <p className={styles.subtitle}>
                Submit an adjustment request for missed punches or attendance discrepancies.
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className={styles.formBody}>
          {/* Record Summary Banner */}
          <div className={styles.contextCard}>
            <div className={styles.contextHeader}>
              <span className={styles.contextTag}>Original Attendance Record</span>
              <span className={styles.contextDate}>{selectedDate}</span>
            </div>
            <div className={styles.contextGrid}>
              <div className={styles.contextCol}>
                <span className={styles.contextLabel}>Current Check-In</span>
                <strong className={styles.contextValue}>{originalIn}</strong>
              </div>
              <div className={styles.contextCol}>
                <span className={styles.contextLabel}>Current Check-Out</span>
                <strong className={styles.contextValue}>{originalOut}</strong>
              </div>
              <div className={styles.contextCol}>
                <span className={styles.contextLabel}>Current Status</span>
                <span className={`${styles.statusBadge} ${styles[originalStatus.toLowerCase().replace(/\s+/g, '')] || ''}`}>
                  {originalStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.fieldsGrid}>
            {/* Target Date */}
            <div className={styles.fieldGroup}>
              <label htmlFor="corrDate" className={styles.label}>
                Attendance Date <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <Calendar size={16} className={styles.fieldIcon} />
                <input
                  id="corrDate"
                  type="date"
                  className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                />
              </div>
              {errors.date && <p className={styles.errorText}>{errors.date}</p>}
            </div>

            {/* Category */}
            <div className={styles.fieldGroup}>
              <label htmlFor="corrCat" className={styles.label}>
                Correction Category <span className={styles.required}>*</span>
              </label>
              <select
                id="corrCat"
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Requested Check-In */}
            <div className={styles.fieldGroup}>
              <label htmlFor="reqIn" className={styles.label}>
                Requested Check-In <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <Clock size={16} className={styles.fieldIcon} />
                <input
                  id="reqIn"
                  type="time"
                  className={`${styles.input} ${errors.checkIn ? styles.inputError : ''}`}
                  value={requestedCheckIn}
                  onChange={(e) => setRequestedCheckIn(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <span className={styles.helperText}>Converted: {formatTo12Hour(requestedCheckIn)}</span>
              {errors.checkIn && <p className={styles.errorText}>{errors.checkIn}</p>}
            </div>

            {/* Requested Check-Out */}
            <div className={styles.fieldGroup}>
              <label htmlFor="reqOut" className={styles.label}>
                Requested Check-Out <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <Clock size={16} className={styles.fieldIcon} />
                <input
                  id="reqOut"
                  type="time"
                  className={`${styles.input} ${errors.checkOut ? styles.inputError : ''}`}
                  value={requestedCheckOut}
                  onChange={(e) => setRequestedCheckOut(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <span className={styles.helperText}>Converted: {formatTo12Hour(requestedCheckOut)}</span>
              {errors.checkOut && <p className={styles.errorText}>{errors.checkOut}</p>}
            </div>

            {/* Requested Status */}
            <div className={styles.fieldGroupFull}>
              <label htmlFor="reqStatus" className={styles.label}>
                Requested Attendance Status
              </label>
              <div className={styles.statusRadioGroup}>
                {['Present', 'Half Day'].map((st) => (
                  <label key={st} className={`${styles.radioCard} ${requestedStatus === st ? styles.radioCardActive : ''}`}>
                    <input
                      type="radio"
                      name="requestedStatus"
                      value={st}
                      checked={requestedStatus === st}
                      onChange={(e) => setRequestedStatus(e.target.value)}
                      className={styles.radioInput}
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className={styles.fieldGroupFull}>
              <label htmlFor="corrReason" className={styles.label}>
                Detailed Reason & Justification <span className={styles.required}>*</span>
              </label>
              <textarea
                id="corrReason"
                rows={3}
                className={`${styles.textarea} ${errors.reason ? styles.inputError : ''}`}
                placeholder="Explain why punch was missed or discrepancy occurred (e.g., worked on outdoor site, biometric scanner failed)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
              <div className={styles.textareaFooter}>
                <span className={styles.charCount}>{reason.length} characters (min 10)</span>
                {errors.reason && <p className={styles.errorText}>{errors.reason}</p>}
              </div>
            </div>
          </div>

          {/* Guidelines Notice */}
          <div className={styles.noticeBox}>
            <AlertCircle size={17} className={styles.noticeIcon} />
            <p className={styles.noticeText}>
              Your request will be submitted to HR / Operations Admin for verification. Once approved, your daily attendance record and working hours will be automatically recalculated.
            </p>
          </div>

          {/* Action Buttons */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Submit Correction Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeAttendanceCorrectionModal;
