import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  Search,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import styles from './OnLeaveTodayModal.module.css';

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

function OnLeaveTodayModal({
  isOpen,
  onClose,
  todayLeaves = [],
  companyName = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine current active date label
  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // Filtered based on search query
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return todayLeaves;
    const q = searchTerm.toLowerCase();

    return todayLeaves.filter((item) => {
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
  }, [todayLeaves, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className={styles.title}>
                <span>On Leave Today</span>
                <span className={styles.headerBadge}>{todayLeaves.length}</span>
              </h2>
              <p className={styles.sub}>
                {todayDateStr} • Workforce members on approved leave today for {companyName || 'RR Security & Facilities'}.
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar (shown when there are leaves on file) */}
        {todayLeaves.length > 0 && (
          <div className={styles.controlsBar}>
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search employee, ID, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className={styles.body}>
          {todayLeaves.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconSuccess}>
                <CheckCircle2 size={34} />
              </div>
              <h4 className={styles.emptyTitle}>No Employees On Leave Today</h4>
              <p className={styles.emptyDesc}>
                All workforce staff are currently active or scheduled on duty today ({todayDateStr}). There are no approved leaves recorded for today.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={28} color="#94a3b8" />
              <h4 className={styles.emptyTitle}>No matching employees</h4>
              <p className={styles.emptyDesc}>
                No employees on leave today matched your search criteria.
              </p>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredItems.map((item, idx) => {
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

                const isPaid = String(item.category || '').toLowerCase() === 'paid';
                const fromFormatted = formatDateDisplay(item.fromDate);
                const toFormatted = formatDateDisplay(item.toDate);
                const isSingleDay = item.fromDate === item.toDate;

                return (
                  <div
                    key={item.id || item.leaveId || idx}
                    className={`${styles.leaveCard} ${styles.leaveCardToday}`}
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

                      <span className={styles.badgeToday}>
                        🏖️ On Leave Today
                      </span>
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

                      {item.contact && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Contact</span>
                          <span className={styles.detailValue}>{item.contact}</span>
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
          <span className={styles.footerInfo}>
            {todayLeaves.length === 0
              ? 'No staff members on leave today.'
              : `Showing ${filteredItems.length} of ${todayLeaves.length} employees on leave today.`}
          </span>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnLeaveTodayModal;
