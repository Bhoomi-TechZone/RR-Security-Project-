import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileClock,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight
} from 'lucide-react';
import leaveService from '../../services/leaveService';
import styles from './LeaveRequestsModal.module.css';

function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function LeaveRequestsModal({
  isOpen,
  onClose,
  initialList = [],
  companyId = '',
  companyName = ''
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialList && initialList.length > 0) {
      setLeaveRequests(initialList);
      return;
    }

    let isMounted = true;
    const fetchLeaves = async () => {
      setLoading(true);
      try {
        const data = await leaveService.getLeaveRequests(companyId);
        if (isMounted && data) {
          setLeaveRequests(data);
        }
      } catch (err) {
        console.error('Failed to load leave requests for modal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaves();

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialList, companyId]);

  // Tab counts
  const allCount = leaveRequests.length;
  const pendingCount = leaveRequests.filter(
    (l) => String(l.status || '').toLowerCase() === 'pending'
  ).length;
  const approvedCount = leaveRequests.filter(
    (l) => String(l.status || '').toLowerCase() === 'approved'
  ).length;
  const rejectedCount = leaveRequests.filter(
    (l) => String(l.status || '').toLowerCase() === 'rejected'
  ).length;

  // Filter by Tab and Search
  const filteredRequests = useMemo(() => {
    let result = leaveRequests;

    if (activeTab === 'pending') {
      result = result.filter((l) => String(l.status || '').toLowerCase() === 'pending');
    } else if (activeTab === 'approved') {
      result = result.filter((l) => String(l.status || '').toLowerCase() === 'approved');
    } else if (activeTab === 'rejected') {
      result = result.filter((l) => String(l.status || '').toLowerCase() === 'rejected');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return (
          String(item.name || item.employeeName || '').toLowerCase().includes(q) ||
          String(item.employeeId || '').toLowerCase().includes(q) ||
          String(item.department || '').toLowerCase().includes(q) ||
          String(item.designation || '').toLowerCase().includes(q) ||
          String(item.clientName || '').toLowerCase().includes(q) ||
          String(item.leaveType || '').toLowerCase().includes(q) ||
          String(item.reason || '').toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [leaveRequests, activeTab, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FileClock size={24} />
            </div>
            <div>
              <h2 className={styles.title}>
                <span>Leave Requests</span>
              </h2>
              <p className={styles.sub}>
                All submitted employee leave applications for {companyName || 'RR Security & Facilities'}.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Controls Bar (Tabs + Search) */}
        <div className={styles.controlsBar}>
          <div className={styles.tabsGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All Requests</span>
              <span className={styles.countBadge}>{allCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span>Pending</span>
              <span className={styles.countBadge}>{pendingCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'approved' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <span>Approved</span>
              <span className={styles.countBadge}>{approvedCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'rejected' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('rejected')}
            >
              <span>Rejected</span>
              <span className={styles.countBadge}>{rejectedCount}</span>
            </button>
          </div>

          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search employee, ID, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.emptyState}>
              <Clock size={32} color="#a855f7" className="animate-spin" />
              <p className={styles.emptyTitle}>Loading leave requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FileClock size={28} />
              </div>
              <h4 className={styles.emptyTitle}>No Leave Requests Found</h4>
              <p className={styles.emptyDesc}>
                {activeTab === 'pending'
                  ? 'There are currently no pending leave requests awaiting approval.'
                  : activeTab === 'approved'
                  ? 'No approved leave records found in this category.'
                  : activeTab === 'rejected'
                  ? 'No rejected leave records found in this category.'
                  : 'No leave applications have been submitted for this company.'}
              </p>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredRequests.map((item, idx) => {
                const empName = item.name || item.employeeName || 'Staff Member';
                const empCode = item.employeeId || '—';
                const initials = empName
                  ? empName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'EM';

                const statusStr = String(item.status || 'Pending').toLowerCase();
                const isPaid = String(item.category || '').toLowerCase() === 'paid';
                const fromFormatted = formatDateDisplay(item.fromDate);
                const toFormatted = formatDateDisplay(item.toDate);
                const isSingleDay = item.fromDate === item.toDate;

                return (
                  <div
                    key={item.id || item.leaveId || idx}
                    className={`${styles.requestCard} ${
                      statusStr === 'pending'
                        ? styles.requestCardPending
                        : statusStr === 'approved'
                        ? styles.requestCardApproved
                        : styles.requestCardRejected
                    }`}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.empProfile}>
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={empName}
                            className={styles.avatar}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={styles.avatarFallback}
                          style={{ display: item.photo ? 'none' : 'flex' }}
                        >
                          {initials}
                        </div>
                        <div className={styles.empMeta}>
                          <h4 className={styles.empName} title={empName}>
                            {empName}
                          </h4>
                          <span className={styles.empCode}>{empCode}</span>
                        </div>
                      </div>

                      {statusStr === 'pending' ? (
                        <span className={styles.badgePending}>
                          <Clock size={12} />
                          <span>Pending</span>
                        </span>
                      ) : statusStr === 'approved' ? (
                        <span className={styles.badgeApproved}>
                          <CheckCircle2 size={12} />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className={styles.badgeRejected}>
                          <XCircle size={12} />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    {/* Detailed Metadata Grid */}
                    <div className={styles.cardDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Leave Type</span>
                        <span className={`${styles.detailValue} ${styles.highlightLeaveType}`}>
                          {item.leaveType || 'Casual Leave'}
                          {item.category && (
                            <span className={isPaid ? styles.paidBadge : styles.unpaidBadge}>
                              {item.category}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Leave Period</span>
                        <span className={styles.detailValue}>
                          {isSingleDay ? fromFormatted : `${fromFormatted} → ${toFormatted}`} ({item.days || 1} {item.days > 1 ? 'Days' : 'Day'})
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Duration</span>
                        <span className={styles.detailValue}>{item.durationType || 'Full Day'}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Department</span>
                        <span className={styles.detailValue}>{item.department || 'Security'}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Designation</span>
                        <span className={styles.detailValue}>{item.designation || 'Staff'}</span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Client Unit</span>
                        <span className={styles.detailValue} title={item.clientName}>
                          {item.clientName || 'RR Security & Facilities'}
                        </span>
                      </div>

                      {item.appliedOn && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Applied On</span>
                          <span className={styles.detailValue}>{formatDateDisplay(item.appliedOn)}</span>
                        </div>
                      )}

                      {item.reason && (
                        <div className={styles.reasonBox}>
                          <span className={styles.reasonLabel}>Reason:</span>
                          <p className={styles.reasonText}>{item.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerInfo}>
              Showing {filteredRequests.length} of {allCount} total leave requests.
            </span>
            <a href="/admin/leave" className={styles.leavePortalLink}>
              <span>Manage Requests in HRMS</span>
              <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </a>
          </div>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaveRequestsModal;
