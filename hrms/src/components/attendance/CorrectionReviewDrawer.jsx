import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { formatTime } from '../../data/attendanceData';
import { formatCorrectionDateTime } from '../../data/attendanceCorrectionData';
import styles from './CorrectionReviewDrawer.module.css';

function CorrectionReviewDrawer({ request, onClose, onApprove, onReject }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectError, setRejectError] = useState('');

  if (!request) return null;

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Please provide a rejection reason.');
      return;
    }
    onReject(request.id, rejectReason);
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Review Correction</h3>
            <p className={styles.subtitle}>ID: {request.id}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Employee */}
        <div className={styles.empSection}>
          <div className={styles.avatar}>{request.initials}</div>
          <div>
            <div className={styles.empName}>{request.employeeName}</div>
            <div className={styles.empMeta}>{request.companyName} · {request.site}</div>
            <div className={styles.empMeta}>Date: {request.date}</div>
          </div>
        </div>

        {/* Comparison */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Attendance Comparison</div>
          <div className={styles.compareGrid}>
            <div className={styles.compareCol}>
              <div className={styles.compareHeader}>Original</div>
              <div className={styles.compareRow}>
                <Clock size={13} />
                In: <strong>{formatTime(request.originalCheckIn)}</strong>
              </div>
              <div className={styles.compareRow}>
                <Clock size={13} />
                Out: <strong>{formatTime(request.originalCheckOut)}</strong>
              </div>
              <div className={styles.compareRow}>
                Status: <strong>{request.originalStatus}</strong>
              </div>
            </div>
            <div className={styles.arrowCol}>
              <ArrowRight size={20} className={styles.arrow} />
            </div>
            <div className={`${styles.compareCol} ${styles.requestedCol}`}>
              <div className={styles.compareHeader}>Requested</div>
              <div className={styles.compareRow}>
                <Clock size={13} />
                In: <strong>{formatTime(request.requestedCheckIn)}</strong>
              </div>
              <div className={styles.compareRow}>
                <Clock size={13} />
                Out: <strong>{formatTime(request.requestedCheckOut)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Employee's Reason</div>
          <div className={styles.reasonBox}>{request.reason}</div>
        </div>

        {/* Submitted info */}
        <div className={styles.section}>
          <div className={styles.metaRow}>
            <span>Submitted by</span>
            <span>{request.submittedBy}</span>
          </div>
          <div className={styles.metaRow}>
            <span>Submitted at</span>
            <span>{formatCorrectionDateTime(request.submittedAt)}</span>
          </div>
        </div>

        {/* Reject input */}
        {showRejectInput && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Rejection Reason</div>
            <textarea
              className={styles.rejectInput}
              placeholder="Provide a reason for rejection…"
              rows={3}
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            />
            {rejectError && <p className={styles.errorText}>{rejectError}</p>}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {!showRejectInput ? (
            <>
              <button className={styles.rejectBtn} onClick={() => setShowRejectInput(true)}>
                <XCircle size={16} /> Reject
              </button>
              <button className={styles.approveBtn} onClick={() => onApprove(request.id)}>
                <CheckCircle size={16} /> Approve
              </button>
            </>
          ) : (
            <>
              <button className={styles.cancelRejectBtn} onClick={() => { setShowRejectInput(false); setRejectReason(''); }}>
                Cancel
              </button>
              <button className={styles.confirmRejectBtn} onClick={handleReject}>
                Confirm Rejection
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default CorrectionReviewDrawer;
