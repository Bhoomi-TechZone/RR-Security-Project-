import React, { useState } from 'react';
import { X, AlertCircle, RotateCcw, Ban } from 'lucide-react';
import styles from './LeaveReasonModal.module.css';

export default function LeaveReasonModal({
  isOpen,
  type = 'reject', // 'reject' | 'send_back'
  request = null,
  onClose,
  onConfirm
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const isReject = type === 'reject';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(isReject ? 'Please provide a clear rejection reason.' : 'Please provide a reason for sending back the request.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={`${styles.iconWrap} ${isReject ? styles.rejectIcon : styles.sendBackIcon}`}>
              {isReject ? <Ban size={18} /> : <RotateCcw size={18} />}
            </div>
            <div>
              <h3 className={styles.title}>
                {isReject ? 'Reject Leave Request' : 'Send Back Leave Request'}
              </h3>
              <p className={styles.subtitle}>
                Request ID: <strong>{request.id}</strong> • {request.employeeName}
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form id="reasonForm" onSubmit={handleSubmit} className={styles.body}>
          <div className={styles.summaryBox}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Leave Type</span>
              <span className={styles.summaryVal}>{request.leaveType} ({request.category})</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Duration</span>
              <span className={styles.summaryVal}>{request.fromDate} to {request.toDate} ({request.days} Days)</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Client & Site</span>
              <span className={styles.summaryVal}>{request.clientName} • {request.site || 'Site'}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {isReject ? 'Mandatory Rejection Reason' : 'Mandatory Send-Back / Clarification Reason'} <span className={styles.req}>*</span>
            </label>
            <textarea
              rows="4"
              className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
              placeholder={
                isReject
                  ? 'Specify why this leave request cannot be approved (e.g. site manpower shortfall, blackout dates, insufficient notice)...'
                  : 'Specify what corrections or additional documentation the applicant needs to provide...'
              }
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
            />
            {error && (
              <div className={styles.errorRow}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </form>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="reasonForm"
            className={isReject ? styles.rejectBtn : styles.sendBackBtn}
          >
            {isReject ? 'Confirm Rejection' : 'Send Back for Revision'}
          </button>
        </div>
      </div>
    </div>
  );
}
