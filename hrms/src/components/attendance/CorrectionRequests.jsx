import React, { useState } from 'react';
import { MoreVertical, Clock, CheckCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { formatTime } from '../../data/attendanceData';
import { formatCorrectionDateTime } from '../../data/attendanceCorrectionData';
import styles from './CorrectionRequests.module.css';

function CorrectionRequests({ requests, onReview }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="No pending corrections"
        description="All attendance correction requests have been reviewed."
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Client / Site</th>
              <th>Original In / Out</th>
              <th>Requested In / Out</th>
              <th>Reason</th>
              <th>Submitted</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className={styles.row}>
                <td>
                  <div className={styles.empCell}>
                    <div className={styles.avatar}>{req.initials}</div>
                    <div>
                      <div className={styles.empName}>{req.employeeName}</div>
                      <div className={styles.empId}>{req.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.dateCell}>{req.date}</td>
                <td>
                  <div className={styles.companyCell}>
                    <span>{req.companyName}</span>
                    <span className={styles.site}>{req.site}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.timeCell}>
                    <span>{formatTime(req.originalCheckIn)}</span>
                    <span className={styles.timeSep}>→</span>
                    <span>{formatTime(req.originalCheckOut)}</span>
                  </div>
                </td>
                <td>
                  <div className={`${styles.timeCell} ${styles.requested}`}>
                    <span>{formatTime(req.requestedCheckIn)}</span>
                    <span className={styles.timeSep}>→</span>
                    <span>{formatTime(req.requestedCheckOut)}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.reasonCell} title={req.reason}>
                    {req.reason.length > 60 ? req.reason.slice(0, 60) + '…' : req.reason}
                  </div>
                </td>
                <td className={styles.submittedCell}>
                  {formatCorrectionDateTime(req.submittedAt)}
                </td>
                <td>
                  <StatusBadge status="pendingCorrection">Pending</StatusBadge>
                </td>
                <td>
                  <button
                    className={styles.reviewBtn}
                    onClick={() => onReview(req)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className={styles.cards}>
        {requests.map((req) => (
          <div key={req.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.empCell}>
                <div className={styles.avatar}>{req.initials}</div>
                <div>
                  <div className={styles.empName}>{req.employeeName}</div>
                  <div className={styles.empId}>{req.date} · {req.site}</div>
                </div>
              </div>
              <StatusBadge status="pendingCorrection">Pending</StatusBadge>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardRow}>
                <span>Original</span>
                <span>{formatTime(req.originalCheckIn)} → {formatTime(req.originalCheckOut)}</span>
              </div>
              <div className={styles.cardRow}>
                <span>Requested</span>
                <span className={styles.requested}>
                  {formatTime(req.requestedCheckIn)} → {formatTime(req.requestedCheckOut)}
                </span>
              </div>
              <div className={styles.reasonCell}>{req.reason}</div>
            </div>
            <div className={styles.cardFooter}>
              <button className={styles.reviewBtn} onClick={() => onReview(req)}>
                Review Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default CorrectionRequests;
