import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellDot,
  BellOff,
  BellRing,
  CalendarCheck,
  Check,
  CheckCheck,
  ChevronRight,
  FileWarning,
  IndianRupee,
  Megaphone,
  Search,
  X,
} from 'lucide-react';
import {
  allEmployeeNotifications,
  employeeAlerts,
  employeeAnnouncements,
  friendlyDate,
} from '../../data/employeeNotificationsData';
import styles from './EmployeeNotifications.module.css';

/* ─────────────────────────────────────────
   Constants
   ───────────────────────────────────────── */

const TABS = [
  { key: 'all',           label: 'All' },
  { key: 'unread',        label: 'Unread' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'alerts',        label: 'Alerts' },
];

const TYPE_FILTER_OPTIONS = [
  { value: 'all',          label: 'All Types' },
  { value: 'leave',        label: 'Leave' },
  { value: 'salary',       label: 'Salary' },
  { value: 'document',     label: 'Document' },
  { value: 'announcement', label: 'Announcement' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'all',       label: 'All Dates' },
  { value: 'today',     label: 'Today' },
  { value: 'week',      label: 'This Week' },
  { value: 'month',     label: 'This Month' },
];

const TODAY = new Date('2026-08-26'); // simulated "today"

const INITIAL_VISIBLE = 5; // items shown before "Load more"

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */

function typeIcon(type, className) {
  const props = { size: 18, 'aria-hidden': true };
  switch (type) {
    case 'leave':        return <CalendarCheck  {...props} />;
    case 'salary':       return <IndianRupee    {...props} />;
    case 'document':     return <FileWarning    {...props} />;
    case 'announcement': return <Megaphone      {...props} />;
    default:             return <Bell           {...props} />;
  }
}

function typeIconClass(type) {
  switch (type) {
    case 'leave':        return styles.iconLeave;
    case 'salary':       return styles.iconSalary;
    case 'document':     return styles.iconDocument;
    case 'announcement': return styles.iconAnnounce;
    default:             return styles.iconLeave;
  }
}

function typeBadgeClass(type) {
  switch (type) {
    case 'leave':        return styles.badgeLeave;
    case 'salary':       return styles.badgeSalary;
    case 'document':     return styles.badgeDocument;
    case 'announcement': return styles.badgeAnn;
    default:             return styles.badgeLeave;
  }
}

function typeBadgeLabel(type) {
  switch (type) {
    case 'leave':        return 'Leave';
    case 'salary':       return 'Salary';
    case 'document':     return 'Document';
    case 'announcement': return 'Announcement';
    default:             return type;
  }
}

function dateMatchesFilter(isoDate, filter) {
  if (filter === 'all') return true;
  const d = new Date(isoDate);
  const diffMs = TODAY - d;
  const diffDays = diffMs / 86400000;
  if (filter === 'today') return diffDays < 1;
  if (filter === 'week')  return diffDays < 7;
  if (filter === 'month') return diffDays < 30;
  return true;
}

/* ─────────────────────────────────────────
   Notification Details Modal
   ───────────────────────────────────────── */

function NotificationDetailsModal({ notif, onClose, onNavigate }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!notif) return null;

  const { type, title, description, date, time, details = {}, priority } = notif;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <span className={`${styles.modalIcon} ${typeIconClass(type)}`}>
              {typeIcon(type)}
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close notification details"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* ── Leave notification ── */}
          {type === 'leave' && details && (
            <>
              <dl className={styles.detailsGrid}>
                {details.leaveType && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Leave Type</dt>
                    <dd className={styles.detailValue}>{details.leaveType}</dd>
                  </div>
                )}
                {details.from && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>From</dt>
                    <dd className={styles.detailValue}>{details.from}</dd>
                  </div>
                )}
                {details.to && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>To</dt>
                    <dd className={styles.detailValue}>{details.to}</dd>
                  </div>
                )}
                {details.days != null && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Days</dt>
                    <dd className={styles.detailValue}>{details.days} {details.days === 1 ? 'Day' : 'Days'}</dd>
                  </div>
                )}
                {details.status && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Status</dt>
                    <dd className={`${styles.detailValue} ${
                      details.status === 'Approved'
                        ? styles.detailStatusApproved
                        : details.status === 'Rejected'
                          ? styles.detailStatusRejected
                          : ''
                    }`}>
                      {details.status}
                    </dd>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Date</dt>
                  <dd className={styles.detailValue}>{friendlyDate(date)}{time ? ` • ${time}` : ''}</dd>
                </div>
              </dl>
              {details.status === 'Rejected' && details.rejectionReason && (
                <div className={styles.rejectionBlock}>
                  <strong>Rejection Reason: </strong>{details.rejectionReason}
                </div>
              )}
            </>
          )}

          {/* ── Salary notification ── */}
          {type === 'salary' && details && (
            <dl className={styles.detailsGrid}>
              {details.salaryMonth && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Salary Month</dt>
                  <dd className={styles.detailValue}>{details.salaryMonth}</dd>
                </div>
              )}
              {details.status && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Status</dt>
                  <dd className={`${styles.detailValue} ${styles.detailStatusProcessed}`}>
                    {details.status}
                  </dd>
                </div>
              )}
              {details.processedDate && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Processed Date</dt>
                  <dd className={styles.detailValue}>{details.processedDate}</dd>
                </div>
              )}
              {details.netSalary && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Net Salary</dt>
                  <dd className={styles.detailValue}>{details.netSalary}</dd>
                </div>
              )}
            </dl>
          )}

          {/* ── Document notification ── */}
          {type === 'document' && details && (
            <dl className={styles.detailsGrid}>
              {details.document && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Document</dt>
                  <dd className={styles.detailValue}>{details.document}</dd>
                </div>
              )}
              {details.expiryDate && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Expiry Date</dt>
                  <dd className={styles.detailValue}>{details.expiryDate}</dd>
                </div>
              )}
              {details.status && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Status</dt>
                  <dd className={`${styles.detailValue} ${styles.detailStatusWarning}`}>
                    {details.status}
                  </dd>
                </div>
              )}
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Date</dt>
                <dd className={styles.detailValue}>{friendlyDate(date)}{time ? ` • ${time}` : ''}</dd>
              </div>
            </dl>
          )}

          {/* ── Announcement ── */}
          {type === 'announcement' && details && (
            <>
              <dl className={styles.detailsGrid}>
                {details.effectiveFrom && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Effective From</dt>
                    <dd className={styles.detailValue}>{details.effectiveFrom}</dd>
                  </div>
                )}
                {details.postedDate && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Posted</dt>
                    <dd className={styles.detailValue}>{details.postedDate}</dd>
                  </div>
                )}
                {details.postedBy && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Posted By</dt>
                    <dd className={styles.detailValue}>{details.postedBy}</dd>
                  </div>
                )}
                {details.audience && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Audience</dt>
                    <dd className={styles.detailValue}>{details.audience}</dd>
                  </div>
                )}
              </dl>
              {details.message && (
                <div className={styles.announcementMsg}>{details.message}</div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className={styles.modalFooter}>
          {type === 'leave' && (
            <button
              type="button"
              className={styles.modalPrimaryBtn}
              onClick={() => { onClose(); onNavigate('/employee/leave'); }}
            >
              <CalendarCheck size={14} aria-hidden="true" />
              View Leave
            </button>
          )}
          {type === 'salary' && (
            <button
              type="button"
              className={styles.modalPrimaryBtn}
              onClick={() => { onClose(); onNavigate('/employee/salary-slips'); }}
            >
              <IndianRupee size={14} aria-hidden="true" />
              View Salary Slip
            </button>
          )}
          <button
            type="button"
            className={styles.modalSecondaryBtn}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Notification Item
   ───────────────────────────────────────── */

function NotifItem({ notif, onMarkRead, onOpen }) {
  const isUnread = !notif.read;
  const isImportant = notif.priority === 'important';

  return (
    <li
      className={`${styles.notifItem} ${isUnread ? styles.unread : ''} ${isImportant ? styles.important : ''}`}
      onClick={() => onOpen(notif)}
      role="button"
      tabIndex={0}
      aria-label={`Notification: ${notif.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(notif); } }}
    >
      {/* Icon */}
      <span className={`${styles.notifIconWrap} ${typeIconClass(notif.type)}`} aria-hidden="true">
        {typeIcon(notif.type)}
      </span>

      {/* Content */}
      <div className={styles.notifContent}>
        <p className={styles.notifTitle}>
          {notif.title}
          {isImportant && <span className={styles.importantTag}>Important</span>}
        </p>
        <p className={styles.notifDesc}>{notif.description}</p>
        <div className={styles.notifMeta}>
          <span className={`${styles.notifTypeBadge} ${typeBadgeClass(notif.type)}`}>
            {typeBadgeLabel(notif.type)}
          </span>
          <span className={styles.notifDate}>
            {friendlyDate(notif.date)}{notif.time ? ` • ${notif.time}` : ''}
          </span>
          {isUnread && (
            <button
              type="button"
              className={styles.markReadBtn}
              onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
              aria-label="Mark as read"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {isUnread && <span className={styles.unreadIndicator} aria-hidden="true" />}
    </li>
  );
}

/* ─────────────────────────────────────────
   Main Page Component
   ───────────────────────────────────────── */

function EmployeeNotifications() {
  const navigate = useNavigate();

  // All notifications state (read/unread tracking in local state)
  const [notifs, setNotifs] = useState(() => allEmployeeNotifications);

  // Filter state (draft = uncommitted)
  const [activeTab, setActiveTab]           = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [draftType, setDraftType]           = useState('all');
  const [draftDate, setDraftDate]           = useState('all');
  const [appliedType, setAppliedType]       = useState('all');
  const [appliedDate, setAppliedDate]       = useState('all');

  // Load more
  const [visibleCount, setVisibleCount]     = useState(INITIAL_VISIBLE);

  // Detail modal
  const [selectedNotif, setSelectedNotif]   = useState(null);

  // Toast
  const [showToast, setShowToast]           = useState(false);

  // ── Counts for summary cards & tabs ──
  const totalCount        = notifs.length;
  const unreadCount       = notifs.filter((n) => !n.read).length;
  const announcementCount = notifs.filter((n) => n.type === 'announcement').length;
  const alertCount        = notifs.filter((n) => n.type !== 'announcement').length;

  // ── Apply filters ──
  const filteredNotifs = useMemo(() => {
    return notifs.filter((n) => {
      // Tab filter
      if (activeTab === 'unread'        && n.read)              return false;
      if (activeTab === 'announcements' && n.type !== 'announcement') return false;
      if (activeTab === 'alerts'        && n.type === 'announcement') return false;

      // Type filter
      if (appliedType !== 'all' && n.type !== appliedType) return false;

      // Date filter
      if (!dateMatchesFilter(n.date, appliedDate)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (
          !n.title.toLowerCase().includes(q) &&
          !n.description.toLowerCase().includes(q)
        ) return false;
      }

      return true;
    });
  }, [notifs, activeTab, appliedType, appliedDate, searchQuery]);

  const visibleNotifs = filteredNotifs.slice(0, visibleCount);
  const hasMore       = filteredNotifs.length > visibleCount;

  // ── Handlers ──
  const handleMarkRead = useCallback((id) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const handleApplyFilters = () => {
    setAppliedType(draftType);
    setAppliedDate(draftDate);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleResetFilters = () => {
    setDraftType('all');
    setDraftDate('all');
    setAppliedType('all');
    setAppliedDate('all');
    setSearchQuery('');
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleSummaryCardClick = (tab) => {
    setActiveTab(tab);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleOpenDetail = (notif) => {
    // Auto-mark read when opened
    if (!notif.read) handleMarkRead(notif.id);
    setSelectedNotif(notif);
  };

  // ── Empty state copy ──
  function emptyStateContent() {
    if (activeTab === 'unread') {
      return { heading: "You're all caught up!", body: "You have no unread notifications." };
    }
    if (searchQuery || appliedType !== 'all' || appliedDate !== 'all') {
      return { heading: "No matching notifications found.", body: "Try changing your filters." };
    }
    return { heading: "No notifications yet", body: "Important updates and alerts will appear here." };
  }

  const { heading: emptyHeading, body: emptyBody } = emptyStateContent();

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ── Page Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              Dashboard <ChevronRight size={11} aria-hidden="true" /> Notifications
            </nav>
            <h1>Notifications</h1>
            <p>Stay updated with important HR announcements and notifications.</p>
          </div>

          <button
            type="button"
            className={styles.markAllBtn}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            aria-label="Mark all notifications as read"
            id="mark-all-read-btn"
          >
            <CheckCheck size={15} aria-hidden="true" />
            Mark all as read
          </button>
        </header>

        {/* ── Toast ── */}
        {showToast && (
          <div className={styles.toast} role="status" aria-live="polite">
            <Check size={15} aria-hidden="true" />
            All notifications marked as read.
          </div>
        )}

        {/* ── Summary Cards ── */}
        <section className={styles.summaryGrid} aria-label="Notification summary">
          {[
            {
              tab: 'all',
              label: 'All Notifications',
              count: totalCount,
              icon: Bell,
              tone: 'all',
              subtext: 'Total updates'
            },
            {
              tab: 'unread',
              label: 'Unread',
              count: unreadCount,
              icon: BellDot,
              tone: 'unread',
              subtext: 'Requires attention'
            },
            {
              tab: 'announcements',
              label: 'Announcements',
              count: announcementCount,
              icon: Megaphone,
              tone: 'announcements',
              subtext: 'From HR & Admin'
            },
            {
              tab: 'alerts',
              label: 'My Alerts',
              count: alertCount,
              icon: CalendarCheck,
              tone: 'alerts',
              subtext: 'System generated'
            },
          ].map(({ tab, label, count, icon: CardIcon, tone, subtext }) => (
            <button
              key={tab}
              type="button"
              className={`${styles.summaryCard} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => handleSummaryCardClick(tab)}
              aria-pressed={activeTab === tab}
              id={`notif-summary-${tab}`}
            >
              <div className={styles.summaryCardContent}>
                <span className={styles.summaryLabel}>{label}</span>
                <span className={styles.summaryCount}>{count}</span>
                <span className={styles.summarySubtext}>{subtext}</span>
              </div>
              <div className={`${styles.summaryCardIcon} ${styles[tone]}`}>
                <CardIcon size={20} />
              </div>
            </button>
          ))}
        </section>

        {/* ── Search + Filters ── */}
        <div className={styles.filterBar} role="search" aria-label="Filter notifications">
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              id="notif-search"
              type="text"
              className={styles.searchInput}
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notifications"
            />
          </div>

          <div className={styles.filterField}>
            <label htmlFor="notif-type-filter">Type</label>
            <select
              id="notif-type-filter"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
            >
              {TYPE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="notif-date-filter">Date</label>
            <select
              id="notif-date-filter"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
            >
              {DATE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApplyFilters}
              id="notif-filter-apply"
            >
              Apply
            </button>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetFilters}
              id="notif-filter-reset"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className={styles.tabBar} role="tablist" aria-label="Filter by category">
          {TABS.map(({ key, label }) => {
            const count =
              key === 'all'           ? totalCount
              : key === 'unread'      ? unreadCount
              : key === 'announcements' ? announcementCount
              : alertCount;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                className={`${styles.tabBtn} ${activeTab === key ? styles.tabActive : ''}`}
                onClick={() => handleTabChange(key)}
                id={`notif-tab-${key}`}
              >
                {label}
                <span className={styles.tabCount}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main content ── */}
        {activeTab === 'all' || activeTab === 'unread' ? (
          /* All / Unread tab: show alerts section + announcements section */
          <div className={styles.mainLayout}>
            {/* Alerts */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>
                  <span className={`${styles.sectionHeaderIcon} ${styles.iconAlerts}`} aria-hidden="true">
                    <Bell size={14} />
                  </span>
                  My Alerts
                </h2>
                <span className={styles.sectionCount}>
                  {filteredNotifs.filter((n) => n.type !== 'announcement').length}
                </span>
              </div>

              {filteredNotifs.filter((n) => n.type !== 'announcement').length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconWrap}>
                    <BellOff size={24} aria-hidden="true" />
                  </div>
                  <h3>{emptyHeading}</h3>
                  <p>{emptyBody}</p>
                </div>
              ) : (
                <>
                  <ul className={styles.notifList} aria-label="My alerts">
                    {filteredNotifs
                      .filter((n) => n.type !== 'announcement')
                      .slice(0, visibleCount)
                      .map((n) => (
                        <NotifItem
                          key={n.id}
                          notif={n}
                          onMarkRead={handleMarkRead}
                          onOpen={handleOpenDetail}
                        />
                      ))}
                  </ul>
                  {filteredNotifs.filter((n) => n.type !== 'announcement').length > visibleCount && (
                    <div className={styles.loadMoreWrap}>
                      <button
                        type="button"
                        className={styles.loadMoreBtn}
                        onClick={() => setVisibleCount((c) => c + 5)}
                        id="notif-load-more"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Announcements panel (sidebar) */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>
                  <span className={`${styles.sectionHeaderIcon} ${styles.iconAnn}`} aria-hidden="true">
                    <Megaphone size={14} />
                  </span>
                  Announcements
                </h2>
                <span className={styles.sectionCount}>
                  {filteredNotifs.filter((n) => n.type === 'announcement').length}
                </span>
              </div>

              {filteredNotifs.filter((n) => n.type === 'announcement').length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconWrap}>
                    <Megaphone size={22} aria-hidden="true" />
                  </div>
                  <h3>No announcements</h3>
                  <p>There are no announcements for you right now.</p>
                </div>
              ) : (
                <ul className={styles.notifList} aria-label="Announcements">
                  {filteredNotifs
                    .filter((n) => n.type === 'announcement')
                    .map((n) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onMarkRead={handleMarkRead}
                        onOpen={handleOpenDetail}
                      />
                    ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* Announcements / Alerts tab: single full-width list */
          <div className={`${styles.mainLayout} ${styles.fullWidth}`}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>
                  <span
                    className={`${styles.sectionHeaderIcon} ${
                      activeTab === 'announcements' ? styles.iconAnn : styles.iconAlerts
                    }`}
                    aria-hidden="true"
                  >
                    {activeTab === 'announcements' ? <Megaphone size={14} /> : <Bell size={14} />}
                  </span>
                  {activeTab === 'announcements' ? 'Announcements' : 'My Alerts'}
                </h2>
                <span className={styles.sectionCount}>{filteredNotifs.length}</span>
              </div>

              {filteredNotifs.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconWrap}>
                    <BellOff size={24} aria-hidden="true" />
                  </div>
                  <h3>{emptyHeading}</h3>
                  <p>{emptyBody}</p>
                </div>
              ) : (
                <>
                  <ul className={styles.notifList}>
                    {visibleNotifs.map((n) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onMarkRead={handleMarkRead}
                        onOpen={handleOpenDetail}
                      />
                    ))}
                  </ul>
                  {hasMore && (
                    <div className={styles.loadMoreWrap}>
                      <button
                        type="button"
                        className={styles.loadMoreBtn}
                        onClick={() => setVisibleCount((c) => c + 5)}
                        id="notif-load-more-tab"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Notification Details Modal ── */}
      {selectedNotif && (
        <NotificationDetailsModal
          notif={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onNavigate={navigate}
        />
      )}
    </main>
  );
}

export default EmployeeNotifications;
