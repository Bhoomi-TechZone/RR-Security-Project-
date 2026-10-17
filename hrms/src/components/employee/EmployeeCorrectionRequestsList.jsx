import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ArrowRight, Plus, RefreshCw, FileText } from 'lucide-react';
import styles from './EmployeeCorrectionRequestsList.module.css';

function EmployeeCorrectionRequestsList({
  requests = [],
  onRequestNew,
  onRefresh,
  isLoading = false
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const pendingCount = requests.filter(r => (r.status || '').toLowerCase().includes('pending')).length;
  const approvedCount = requests.filter(r => (r.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = requests.filter(r => (r.status || '').toLowerCase() === 'rejected').length;

  const filtered = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    const s = (r.status || '').toLowerCase();
    if (filterStatus === 'PENDING') return s.includes('pending');
    if (filterStatus === 'APPROVED') return s === 'approved';
    if (filterStatus === 'REJECTED') return s === 'rejected';
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          <Clock size={12} />
          <span>Pending Review</span>
        </span>
      );
    }
    if (s === 'approved') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
          <CheckCircle2 size={12} />
          <span>Approved</span>
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusRejected}`}>
          <XCircle size={12} />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.statusDefault}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      {/* KPI Counters */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap}>
            <FileText size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Total Requests</span>
            <strong className={styles.statValue}>{requests.length}</strong>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statWarning}`}>
          <div className={styles.statIconWrap}>
            <Clock size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Pending Admin Review</span>
            <strong className={styles.statValue}>{pendingCount}</strong>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statSuccess}`}>
          <div className={styles.statIconWrap}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Approved</span>
            <strong className={styles.statValue}>{approvedCount}</strong>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statDanger}`}>
          <div className={styles.statIconWrap}>
            <XCircle size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Rejected</span>
            <strong className={styles.statValue}>{rejectedCount}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.cardTitle}>My Attendance Correction Requests</h2>
            <p className={styles.cardSubtitle}>
              Track status of your submitted punch adjustment and correction requests.
            </p>
          </div>

          <div className={styles.headerActions}>
            {onRefresh && (
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh requests"
              >
                <RefreshCw size={14} className={isLoading ? styles.spinning : ''} />
                <span>Refresh</span>
              </button>
            )}
            <button
              type="button"
              className={styles.newRequestBtn}
              onClick={onRequestNew}
            >
              <Plus size={16} />
              <span>New Correction Request</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className={styles.filterBar}>
          {[
            { key: 'ALL', label: `All (${requests.length})` },
            { key: 'PENDING', label: `Pending (${pendingCount})` },
            { key: 'APPROVED', label: `Approved (${approvedCount})` },
            { key: 'REJECTED', label: `Rejected (${rejectedCount})` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.filterPill} ${filterStatus === tab.key ? styles.filterPillActive : ''}`}
              onClick={() => setFilterStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests Table / List */}
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Clock size={32} />
            </div>
            <h3>No correction requests found</h3>
            <p>
              {filterStatus === 'ALL'
                ? 'You have not submitted any attendance correction requests yet.'
                : `No requests with status "${filterStatus.toLowerCase()}" found.`}
            </p>
            {filterStatus === 'ALL' && (
              <button
                type="button"
                className={styles.emptyActionBtn}
                onClick={onRequestNew}
              >
                <Plus size={15} />
                <span>Request Attendance Correction</span>
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Target Date</th>
                  <th>Original Punch</th>
                  <th>Requested Punch</th>
                  <th>Category / Reason</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => {
                  const reqId = req.id || req._id || req.correctionId || Math.random();
                  const origIn = req.originalCheckIn || '—';
                  const origOut = req.originalCheckOut || '—';
                  const reqIn = req.requestedCheckIn || '—';
                  const reqOut = req.requestedCheckOut || '—';

                  return (
                    <tr key={reqId}>
                      {/* Date */}
                      <td>
                        <div className={styles.dateCell}>
                          <Calendar size={14} className={styles.dateIcon} />
                          <strong>{formatDate(req.date)}</strong>
                        </div>
                      </td>

                      {/* Original Timings */}
                      <td>
                        <div className={styles.timeBlock}>
                          <span>In: {origIn}</span>
                          <span>Out: {origOut}</span>
                        </div>
                      </td>

                      {/* Requested Timings */}
                      <td>
                        <div className={styles.requestedBlock}>
                          <div className={styles.timeTag}>
                            <span>In: <strong>{reqIn}</strong></span>
                            <ArrowRight size={12} className={styles.arrowIcon} />
                            <span>Out: <strong>{reqOut}</strong></span>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td>
                        <div className={styles.reasonCell}>
                          {req.category && <span className={styles.categoryPill}>{req.category}</span>}
                          <p className={styles.reasonText} title={req.reason}>
                            {req.reason || 'No detailed explanation provided.'}
                          </p>
                        </div>
                      </td>

                      {/* Submitted At */}
                      <td className={styles.subText}>
                        {formatDate(req.submittedAt || req.createdAt)}
                      </td>

                      {/* Status */}
                      <td>
                        {getStatusBadge(req.status)}
                      </td>

                      {/* Admin Remarks */}
                      <td>
                        {req.rejectReason || req.remarks || req.adminRemarks ? (
                          <span className={styles.remarksText}>
                            {req.rejectReason || req.remarks || req.adminRemarks}
                          </span>
                        ) : (
                          <span className={styles.noRemarks}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeCorrectionRequestsList;
