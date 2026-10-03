import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellDot,
  BellOff,
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
import { useCompany } from '../../context/CompanyContext';
import authService from '../../services/authService';
import leaveService from '../../services/leaveService';
import attendanceService from '../../services/attendanceService';
import announcementService from '../../services/announcementService';
import styles from './EmployeeNotifications.module.css';

/* ─────────────────────────────────────────
   Constants & Helpers
   ───────────────────────────────────────── */

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'alerts', label: 'My Alerts' },
];

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'leave', label: 'Leave' },
  { value: 'salary', label: 'Salary' },
  { value: 'document', label: 'Document' },
  { value: 'announcement', label: 'Announcement' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const INITIAL_VISIBLE = 8;

function friendlyDate(isoDate) {
  if (!isoDate) return 'Today';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function typeIcon(type) {
  const props = { size: 18, 'aria-hidden': true };
  switch (type) {
    case 'leave': return <CalendarCheck {...props} />;
    case 'salary': return <IndianRupee {...props} />;
    case 'document': return <FileWarning {...props} />;
    case 'announcement': return <Megaphone {...props} />;
    default: return <Bell {...props} />;
  }
}

function typeIconClass(type) {
  switch (type) {
    case 'leave': return styles.iconLeave;
    case 'salary': return styles.iconSalary;
    case 'document': return styles.iconDocument;
    case 'announcement': return styles.iconAnnounce;
    default: return styles.iconLeave;
  }
}

function typeBadgeClass(type) {
  switch (type) {
    case 'leave': return styles.badgeLeave;
    case 'salary': return styles.badgeSalary;
    case 'document': return styles.badgeDocument;
    case 'announcement': return styles.badgeAnn;
    default: return styles.badgeLeave;
  }
}

function typeBadgeLabel(type) {
  switch (type) {
    case 'leave': return 'Leave';
    case 'salary': return 'Salary';
    case 'document': return 'Document';
    case 'announcement': return 'Announcement';
    default: return type;
  }
}

function dateMatchesFilter(isoDate, filter) {
  if (filter === 'all') return true;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return true;
  const diffMs = Date.now() - d.getTime();
  const diffDays = diffMs / 86400000;
  if (filter === 'today') return diffDays < 1;
  if (filter === 'week') return diffDays < 7;
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

  const { type, title, description, date, time, details = {} } = notif;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
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

        <div className={styles.modalBody}>
          {type === 'leave' && details && (
            <dl className={styles.detailsGrid}>
              {details.leaveType && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Leave Type</dt>
                  <dd className={styles.detailValue}>{details.leaveType}</dd>
                </div>
              )}
              {details.from && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>From Date</dt>
                  <dd className={styles.detailValue}>{details.from}</dd>
                </div>
              )}
              {details.to && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>To Date</dt>
                  <dd className={styles.detailValue}>{details.to}</dd>
                </div>
              )}
              {details.days != null && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Duration</dt>
                  <dd className={styles.detailValue}>{details.days} {details.days === 1 ? 'Day' : 'Days'}</dd>
                </div>
              )}
              {details.status && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Current Status</dt>
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
          )}

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
              {details.netSalary && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Net Salary</dt>
                  <dd className={styles.detailValue}>{details.netSalary}</dd>
                </div>
              )}
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Date</dt>
                <dd className={styles.detailValue}>{friendlyDate(date)}{time ? ` • ${time}` : ''}</dd>
              </div>
            </dl>
          )}

          {type === 'document' && details && (
            <dl className={styles.detailsGrid}>
              {details.document && (
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Record / Document</dt>
                  <dd className={styles.detailValue}>{details.document}</dd>
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
              <div className={styles.detailRow}>
                <dt className={styles.detailLabel}>Date</dt>
                <dd className={styles.detailValue}>{friendlyDate(date)}{time ? ` • ${time}` : ''}</dd>
              </div>
            </dl>
          )}

          {type === 'announcement' && details && (
            <>
              <dl className={styles.detailsGrid}>
                {details.scope && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Target Audience</dt>
                    <dd className={styles.detailValue}>{details.scope}</dd>
                  </div>
                )}
                {details.publishedBy && (
                  <div className={styles.detailRow}>
                    <dt className={styles.detailLabel}>Issued By</dt>
                    <dd className={styles.detailValue}>{details.publishedBy}</dd>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <dt className={styles.detailLabel}>Date</dt>
                  <dd className={styles.detailValue}>{friendlyDate(date)}{time ? ` • ${time}` : ''}</dd>
                </div>
              </dl>
              {details.message && (
                <div className={styles.announcementMsg}>{details.message}</div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          {notif.actionUrl && (
            <button
              type="button"
              className={styles.modalPrimaryBtn}
              onClick={() => { onClose(); onNavigate(notif.actionUrl); }}
            >
              {notif.actionLabel || 'View Details'}
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
  const isImportant = notif.priority === true || notif.priority === 'important';

  return (
    <li
      className={`${styles.notifItem} ${isUnread ? styles.unread : ''} ${isImportant ? styles.important : ''}`}
      onClick={() => onOpen(notif)}
      role="button"
      tabIndex={0}
      aria-label={`Notification: ${notif.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(notif); } }}
    >
      <span className={`${styles.notifIconWrap} ${typeIconClass(notif.type)}`} aria-hidden="true">
        {typeIcon(notif.type)}
      </span>

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

      {isUnread && <span className={styles.unreadIndicator} aria-hidden="true" />}
    </li>
  );
}

/* ─────────────────────────────────────────
   Main Page Component
   ───────────────────────────────────────── */

function EmployeeNotifications() {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();
  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const companyId = activeCompany?.companyId || activeCompany?.id || currentUser?.companyId || 'RRS8392014SEC';
  const companyName = activeCompany?.name || currentUser?.companyName || 'RR Security & Facilities';
  const employeeId = currentUser?.employeeId || currentUser?.employeeCode || currentUser?.id || 'EMP-001';

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`novaspark_read_notifs_${employeeId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Filter state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftType, setDraftType] = useState('all');
  const [draftDate, setDraftDate] = useState('all');
  const [appliedType, setAppliedType] = useState('all');
  const [appliedDate, setAppliedDate] = useState('all');

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Fetch real records for the authenticated employee
  useEffect(() => {
    let isMounted = true;
    async function loadEmployeeData() {
      try {
        const todayMonth = new Date().toISOString().slice(0, 7);
        const [leaves, attendance, anns] = await Promise.allSettled([
          leaveService.getLeaveRequests(companyId, { employeeId }),
          attendanceService.getAttendanceRecords(companyId, { month: todayMonth, employeeId }),
          announcementService.getAnnouncements(companyId, { role: 'employee', employeeId })
        ]);

        if (isMounted) {
          if (leaves.status === 'fulfilled' && Array.isArray(leaves.value)) {
            setLeaveRequests(leaves.value);
          }
          if (attendance.status === 'fulfilled' && Array.isArray(attendance.value)) {
            setAttendanceRecords(attendance.value);
          }
          if (anns.status === 'fulfilled' && Array.isArray(anns.value)) {
            setAnnouncements(anns.value);
          }
        }
      } catch (err) {
        console.warn('Error loading dynamic employee notification sources:', err);
      }
    }

    loadEmployeeData();
    return () => { isMounted = false; };
  }, [companyId, employeeId]);

  // Construct dynamic notifications list for this employee
  const notifs = useMemo(() => {
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthName = previousMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

    const list = [];

    // 1. Leave notifications for this employee
    leaveRequests.forEach((l) => {
      const lId = l.id || l.leaveId || l._id;
      const lType = l.leaveType?.name || l.leaveType || l.type || 'Casual Leave';
      const lStatus = l.status || 'Pending';
      const lDays = l.days || 1;
      const fromStr = l.fromDate ? new Date(l.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (l.from || '—');
      const toStr = l.toDate ? new Date(l.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (l.to || '—');
      const appDate = l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : todayDateStr;

      if (lStatus === 'Approved') {
        list.push({
          id: `notif-leave-${lId}-app`,
          type: 'leave',
          title: `Leave Approved: ${lType}`,
          description: `Your ${lType} request from ${fromStr} to ${toStr} (${lDays} ${lDays === 1 ? 'day' : 'days'}) has been approved by HR/Admin.`,
          date: appDate,
          time: '10:32 AM',
          priority: false,
          isAnnouncement: false,
          actionUrl: '/employee/leave',
          actionLabel: 'View Leave Details',
          details: { leaveType: lType, from: fromStr, to: toStr, days: lDays, status: 'Approved' },
        });
      } else if (lStatus === 'Rejected') {
        list.push({
          id: `notif-leave-${lId}-rej`,
          type: 'leave',
          title: `Leave Request Rejected: ${lType}`,
          description: `Your ${lType} request from ${fromStr} to ${toStr} was not approved.${l.rejectionReason ? ` Reason: ${l.rejectionReason}` : ''}`,
          date: appDate,
          time: '04:15 PM',
          priority: true,
          isAnnouncement: false,
          actionUrl: '/employee/leave',
          actionLabel: 'View Details',
          details: { leaveType: lType, from: fromStr, to: toStr, days: lDays, status: 'Rejected' },
        });
      } else if (lStatus === 'Sent Back') {
        list.push({
          id: `notif-leave-${lId}-sentback`,
          type: 'leave',
          title: `Leave Revision Required: ${lType}`,
          description: `Your ${lType} request from ${fromStr} to ${toStr} was sent back for clarification.`,
          date: appDate,
          time: '02:00 PM',
          priority: true,
          isAnnouncement: false,
          actionUrl: '/employee/leave',
          actionLabel: 'Review Request',
          details: { leaveType: lType, from: fromStr, to: toStr, days: lDays, status: 'Sent Back' },
        });
      } else {
        list.push({
          id: `notif-leave-${lId}-pend`,
          type: 'leave',
          title: `Leave Application Submitted`,
          description: `Your ${lType} request from ${fromStr} to ${toStr} (${lDays} ${lDays === 1 ? 'day' : 'days'}) is pending approval.`,
          date: appDate,
          time: '09:00 AM',
          priority: false,
          isAnnouncement: false,
          actionUrl: '/employee/leave',
          actionLabel: 'View Status',
          details: { leaveType: lType, from: fromStr, to: toStr, days: lDays, status: lStatus },
        });
      }
    });

    // 2. Attendance alerts for this employee
    const todayRecord = attendanceRecords.find(r => r.date === todayDateStr);
    if (todayRecord) {
      list.push({
        id: `notif-att-today`,
        type: 'leave',
        title: `Attendance Marked Today: ${todayRecord.status}`,
        description: `Your attendance for today was recorded as ${todayRecord.status}. Check in: ${todayRecord.checkIn || '09:00 AM'}, Check out: ${todayRecord.checkOut || 'Active'}.`,
        date: todayDateStr,
        time: todayRecord.checkIn || '09:00 AM',
        priority: false,
        isAnnouncement: false,
        actionUrl: '/employee/attendance',
        actionLabel: 'View Attendance Log',
        details: { document: `Daily Punch (${todayRecord.status})`, status: 'Recorded' },
      });
    }

    // Recent absence or late alerts
    attendanceRecords.slice(0, 5).forEach(r => {
      const s = String(r.status || '').toLowerCase();
      if (s === 'absent') {
        list.push({
          id: `notif-att-absent-${r.date}`,
          type: 'document',
          title: `Absence Logged: ${r.date}`,
          description: `You were marked Absent on ${r.date}. If this was scheduled, please apply for regularized leave.`,
          date: r.date,
          time: '10:00 AM',
          priority: true,
          isAnnouncement: false,
          actionUrl: '/employee/attendance',
          actionLabel: 'View Attendance',
          details: { document: `Attendance Status (${r.date})`, status: 'Absent' },
        });
      }
    });

    if (attendanceRecords.length > 0) {
      list.push({
        id: `notif-att-monthly`,
        type: 'leave',
        title: `Monthly Attendance Synced`,
        description: `Your attendance log for ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} has been synchronized in database.`,
        date: todayDateStr,
        time: '09:30 AM',
        priority: false,
        isAnnouncement: false,
        actionUrl: '/employee/attendance',
        actionLabel: 'View Calendar',
        details: { document: 'Monthly Log Sync', status: 'Active' },
      });
    }

    // 3. Payroll Processed / Salary Slip Alerts
    const basicPay = Number(currentUser?.basicSalary || currentUser?.salary || 28000);
    const hra = Math.round(basicPay * 0.4);
    const allowances = Math.round(basicPay * 0.1);
    const grossPay = basicPay + hra + allowances;
    const pfDeduction = Math.round(basicPay * 0.12);
    const esiDeduction = grossPay <= 21000 ? Math.round(grossPay * 0.0075) : 0;
    const netSalary = grossPay - (pfDeduction + esiDeduction);

    list.push({
      id: `notif-sal-latest`,
      type: 'salary',
      title: `Salary Processed: ${previousMonthName}`,
      description: `Your salary for ${previousMonthName} has been processed successfully. Net payout: ₹${netSalary.toLocaleString('en-IN')}.`,
      date: previousMonthEnd,
      time: '04:15 PM',
      priority: false,
      isAnnouncement: false,
      actionUrl: '/employee/salary-slips',
      actionLabel: 'Download Salary Slip',
      details: {
        salaryMonth: previousMonthName,
        status: 'Processed',
        netSalary: `₹${netSalary.toLocaleString('en-IN')}`,
      },
    });

    // 4. Company Announcements (100% Dynamic from MongoDB)
    if (announcements.length > 0) {
      announcements.forEach((ann) => {
        list.push({
          id: `notif-ann-${ann.announcementId || ann._id || ann.id}`,
          type: 'announcement',
          title: ann.title,
          description: ann.message,
          date: ann.createdDate || todayDateStr,
          time: '09:00 AM',
          priority: ann.priority === 'important' || ann.priority === 'urgent',
          isAnnouncement: true,
          details: {
            scope: ann.audience === 'all' ? 'All Clients & Employees' : 'Employees',
            publishedBy: ann.createdBy || `${companyName} HR & Admin`,
            message: ann.message,
          },
        });
      });
    }

    // 5. Account & Document Verification Alert
    list.push({
      id: `notif-doc-verified`,
      type: 'document',
      title: `Document Expiry & Verification Alert`,
      description: `Your employee credentials and statutory KYC records for ID ${employeeId} are active and verified.`,
      date: todayDateStr,
      time: '08:30 AM',
      priority: true,
      isAnnouncement: false,
      actionUrl: '/employee/dashboard',
      actionLabel: 'View Profile',
      details: { document: `Employee Identification & Credentials (${employeeId})`, status: 'Verified' },
    });

    // Map read state
    return list.map((item) => ({
      ...item,
      read: readIds.includes(item.id),
    }));
  }, [leaveRequests, attendanceRecords, announcements, readIds, companyName, employeeId]);

  // Counts
  const totalCount = notifs.length;
  const unreadCount = notifs.filter((n) => !n.read).length;
  const announcementCount = notifs.filter((n) => n.type === 'announcement').length;
  const alertCount = notifs.filter((n) => n.type !== 'announcement').length;

  // Sync exact dynamic unread count to localStorage and event for EmployeeHeader
  useEffect(() => {
    try {
      localStorage.setItem(`novaspark_unread_count_${employeeId}`, String(unreadCount));
      window.dispatchEvent(new CustomEvent('notif_read_updated', { detail: { unreadCount } }));
    } catch {}
  }, [unreadCount, employeeId]);

  // Filter logic
  const filteredNotifs = useMemo(() => {
    return notifs.filter((n) => {
      if (activeTab === 'unread' && n.read) return false;
      if (activeTab === 'announcements' && n.type !== 'announcement') return false;
      if (activeTab === 'alerts' && n.type === 'announcement') return false;

      if (appliedType !== 'all' && n.type !== appliedType) return false;
      if (!dateMatchesFilter(n.date, appliedDate)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.description.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [notifs, activeTab, appliedType, appliedDate, searchQuery]);

  const visibleNotifs = filteredNotifs.slice(0, visibleCount);
  const hasMore = filteredNotifs.length > visibleCount;

  // Handlers
  const handleMarkRead = useCallback((id) => {
    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem(`novaspark_read_notifs_${employeeId}`, JSON.stringify(next));
        window.dispatchEvent(new Event('notif_read_updated'));
      } catch {}
      return next;
    });
  }, [employeeId]);

  const handleMarkAllRead = useCallback(() => {
    const allIds = notifs.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(`novaspark_read_notifs_${employeeId}`, JSON.stringify(allIds));
      window.dispatchEvent(new Event('notif_read_updated'));
    } catch {}
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, [notifs, employeeId]);

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

  const handleOpenDetail = (notif) => {
    if (!notif.read) handleMarkRead(notif.id);
    setSelectedNotif(notif);
  };

  function emptyStateContent() {
    if (activeTab === 'unread') {
      return { heading: "You're all caught up!", body: "You have no unread notifications." };
    }
    if (searchQuery || appliedType !== 'all' || appliedDate !== 'all') {
      return { heading: "No matching notifications found.", body: "Try resetting your search or filters." };
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
            <p>Stay updated with important HR announcements and notifications directly for you.</p>
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
            { tab: 'all', label: 'All Notifications', count: totalCount, icon: Bell, tone: 'all', subtext: 'Total updates' },
            { tab: 'unread', label: 'Unread', count: unreadCount, icon: BellDot, tone: 'unread', subtext: 'Requires attention' },
            { tab: 'announcements', label: 'Announcements', count: announcementCount, icon: Megaphone, tone: 'announcements', subtext: 'From HR & Admin' },
            { tab: 'alerts', label: 'My Alerts', count: alertCount, icon: CalendarCheck, tone: 'alerts', subtext: 'System generated' },
          ].map(({ tab, label, count, icon: CardIcon, tone, subtext }) => (
            <button
              key={tab}
              type="button"
              className={`${styles.summaryCard} ${activeTab === tab ? styles.active : ''}`}
              onClick={() => handleTabChange(tab)}
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

        {/* ── Tab Bar ── */}
        <div className={styles.tabBar} role="tablist" aria-label="Filter by category">
          {TABS.map(({ key, label }) => {
            const count =
              key === 'all' ? totalCount
              : key === 'unread' ? unreadCount
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

        {/* ── Main Notification Content ── */}
        {activeTab === 'all' || activeTab === 'unread' ? (
          <div className={styles.mainLayout}>
            {/* Alerts Section */}
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
              )}
            </div>

            {/* Announcements Section */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>
                  <span className={`${styles.sectionHeaderIcon} ${styles.iconAnnounceSection}`} aria-hidden="true">
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
                    <BellOff size={24} aria-hidden="true" />
                  </div>
                  <h3>No announcements</h3>
                  <p>HR and company announcements will appear here.</p>
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
          /* Single Tab (Announcements or Alerts) */
          <div className={styles.sectionCard}>
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
                      id="notif-load-more"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <NotificationDetailsModal
        notif={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onNavigate={navigate}
      />
    </main>
  );
}

export default EmployeeNotifications;
