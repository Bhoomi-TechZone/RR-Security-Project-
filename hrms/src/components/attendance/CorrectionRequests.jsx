import React, { useState } from 'react';
import { MoreVertical, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { formatTime } from '../../data/attendanceData';
import { formatCorrectionDateTime } from '../../data/attendanceCorrectionData';
import styles from './CorrectionRequests.module.css';

function CorrectionRequests({ requests = [], onReview }) {
  const [activeFilter, setActiveFilter] = useState('pending');

  const pendingRequests = requests.filter(
    (r) => !r.status || r.status === 'pendingCorrection' || r.status.toLowerCase().includes('pending')
  );
  const approvedRequests = requests.filter(
    (r) => r.status && r.status.toLowerCase() === 'approved'
  );
  const rejectedRequests = requests.filter(
    (r) => r.status && r.status.toLowerCase() === 'rejected'
  );

  const displayedRequests = requests.filter((r) => {
    if (activeFilter === 'all') return true;
    const s = (r.status || 'pendingCorrection').toLowerCase();
    if (activeFilter === 'pending') return s.includes('pending');
    if (activeFilter === 'approved') return s === 'approved';
    if (activeFilter === 'rejected') return s === 'rejected';
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Filter Tabs */}
      <div className={styles.tabBar}>
        {[
          { key: 'pending', label: 'Pending Review', count: pendingRequests.length, tone: 'warning' },
          { key: 'approved', label: 'Approved', count: approvedRequests.length, tone: 'success' },
          { key: 'rejected', label: 'Rejected', count: rejectedRequests.length, tone: 'danger' },
          { key: 'all', label: 'All Requests', count: requests.length, tone: 'default' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn} ${activeFilter === tab.key ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveFilter(tab.key)}
          >
            <span>{tab.label}</span>
            <span className={`${styles.badge} ${styles[tab.tone]}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {displayedRequests.length === 0 ? (
        <EmptyState
          icon={activeFilter === 'pending' ? CheckCircle : AlertCircle}
          title={
            activeFilter === 'pending'
              ? 'No pending corrections'
              : `No ${activeFilter} correction requests`
          }
          description={
            activeFilter === 'pending'
              ? 'All attendance correction requests have been reviewed.'
              : `There are currently no attendance corrections with ${activeFilter} status.`
          }
        />
      ) : (
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedRequests.map((req) => {
                  const isPending =
                    !req.status ||
                    req.status === 'pendingCorrection' ||
                    req.status.toLowerCase().includes('pending');
                  const isApproved = req.status && req.status.toLowerCase() === 'approved';
                  const isRejected = req.status && req.status.toLowerCase() === 'rejected';

                  return (
                    <tr key={req.id || req._id || req.correctionId} className={styles.row}>
                      <td>
                        <div className={styles.empCell}>
                          <div className={styles.avatar}>{req.initials || 'EM'}</div>
                          <div>
                            <div className={styles.empName}>{req.employeeName}</div>
                            <div className={styles.empId}>{req.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.dateCell}>{req.date}</td>
                      <td>
                        <div className={styles.companyCell}>
                          <span>{req.companyName || req.clientName || 'General'}</span>
                          <span className={styles.site}>{req.site || 'Main Site'}</span>
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
                          {req.category && <span className={styles.categoryTag}>{req.category}</span>}
                          <p className={styles.reasonText}>
                            {req.reason && req.reason.length > 55 ? req.reason.slice(0, 55) + '…' : req.reason || '—'}
                          </p>
                          {isRejected && req.rejectReason && (
                            <span className={styles.rejectionNote}>
                              Reject Reason: {req.rejectReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.submittedCell}>
                        {formatCorrectionDateTime(req.submittedAt || req.createdAt)}
                      </td>
                      <td>
                        {isPending && (
                          <StatusBadge status="pendingCorrection">Pending</StatusBadge>
                        )}
                        {isApproved && (
                          <span className={styles.approvedPill}>
                            <CheckCircle size={12} />
                            <span>Approved</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className={styles.rejectedPill}>
                            <XCircle size={12} />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {isPending ? (
                          <button
                            type="button"
                            className={styles.reviewBtn}
                            onClick={() => onReview(req)}
                          >
                            Review
                          </button>
                        ) : (
                          <span className={styles.reviewedLabel}>
                            {isApproved ? 'Reviewed (✓)' : 'Reviewed (✗)'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={styles.cards}>
            {displayedRequests.map((req) => {
              const isPending =
                !req.status ||
                req.status === 'pendingCorrection' ||
                req.status.toLowerCase().includes('pending');
              const isApproved = req.status && req.status.toLowerCase() === 'approved';
              const isRejected = req.status && req.status.toLowerCase() === 'rejected';

              return (
                <div key={req.id || req._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.empCell}>
                      <div className={styles.avatar}>{req.initials || 'EM'}</div>
                      <div>
                        <div className={styles.empName}>{req.employeeName}</div>
                        <div className={styles.empId}>{req.date} · {req.site || 'Main Site'}</div>
                      </div>
                    </div>
                    {isPending && <StatusBadge status="pendingCorrection">Pending</StatusBadge>}
                    {isApproved && <span className={styles.approvedPill}>Approved</span>}
                    {isRejected && <span className={styles.rejectedPill}>Rejected</span>}
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
                    <div className={styles.reasonCell}>
                      <span className={styles.reasonText}>{req.reason}</span>
                      {isRejected && req.rejectReason && (
                        <div className={styles.rejectionNote}>Reason: {req.rejectReason}</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    {isPending ? (
                      <button type="button" className={styles.reviewBtn} onClick={() => onReview(req)}>
                        Review Request
                      </button>
                    ) : (
                      <span className={styles.reviewedLabel}>Reviewed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CorrectionRequests;
