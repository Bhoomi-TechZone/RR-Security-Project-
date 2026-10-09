import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  Building,
  Building2,
  Filter,
  Check,
  Megaphone,
  Receipt,
  Users,
  Clock,
  Calendar,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  BadgeCheck,
  Radio,
  Send,
  Info
} from 'lucide-react';
import styles from './ClientNotifications.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';
import announcementService from '../../services/announcementService';
import notificationService from '../../services/notificationService';
import authService from '../../services/authService';
import Toast from '../../components/common/Toast';

function getRelativeTime(dateInput) {
  if (!dateInput) return 'Today';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Today';
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function formatFullDateTime(item) {
  let d = null;
  if (item.isoDate) d = new Date(item.isoDate);
  else if (item.createdAt) d = new Date(item.createdAt);
  else if (item.createdDate) d = new Date(`${item.createdDate}T00:00:00`);

  if (!d || isNaN(d.getTime())) {
    return {
      date: item.timestamp || 'Today',
      time: item.time || '12:00 PM',
      relative: 'Today',
      full: item.fullTimestamp || item.timestamp || 'Today'
    };
  }

  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return {
    date,
    time,
    relative: getRelativeTime(d),
    full: `${date} • ${time}`
  };
}

function ClientNotifications() {
  const { clientCompany } = useClientAuth();
  const currentUser = authService.getCurrentUser() || {};
  const companyId = currentUser.companyId || clientCompany?.companyId || 'RRS8392014SEC';
  const clientId = clientCompany?.clientId || currentUser.clientId || currentUser.id || 'CLI-001';

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`novaspark_read_notifs_client_${clientId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [portalRes, annsRes, notifsRes] = await Promise.allSettled([
        clientPortalService.getNotifications(),
        announcementService.getAnnouncements(companyId, { role: 'client', clientId }),
        notificationService.getNotifications(companyId)
      ]);

      const list = [];
      const seen = new Set();

      const processItem = (item) => {
        const rawId = item.rawId || item.id || item.announcementId || item._id;
        const normalizedId = String(rawId || `${item.title}-${item.timestamp}`);
        const contentKey = `${(item.title || '').trim().toLowerCase()}:::${(item.message || '').trim().toLowerCase()}`;

        if (seen.has(normalizedId) || seen.has(contentKey)) return;
        seen.add(normalizedId);
        seen.add(contentKey);

        const isAnnouncement = item.type === 'announcement' || !item.type;
        const isBilling = item.type === 'billing' || item.type?.includes('invoice') || item.type?.includes('bill');
        const isWorkforce = item.type === 'workforce' || item.type === 'system' || item.type === 'employee';

        let derivedType = 'announcement';
        if (isBilling) derivedType = 'billing';
        else if (isWorkforce) derivedType = 'workforce';
        else if (isAnnouncement) derivedType = 'announcement';

        const isRead = item.read === true || item.status === 'read' || readIds.includes(normalizedId) || readIds.includes(`ann-${normalizedId}`) || readIds.includes(`notif-${normalizedId}`);

        const senderTitle = item.senderName || (item.createdBy === 'Admin' ? 'RR Security Administrator' : (item.createdBy || 'Executive Management'));
        const senderInitials = senderTitle.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';

        list.push({
          ...item,
          id: item.id?.startsWith('ann-') || item.id?.startsWith('notif-') ? item.id : `${derivedType === 'announcement' ? 'ann' : 'notif'}-${normalizedId}`,
          rawId: rawId,
          title: item.title || 'Official Notice',
          message: item.message || '',
          type: derivedType,
          senderName: senderTitle,
          senderRole: item.senderRole || (derivedType === 'billing' ? 'Accounts & Finance Desk' : 'Executive Administration'),
          senderDepartment: item.senderDepartment || 'RR Security Head Office',
          senderAvatar: item.senderAvatar || senderInitials,
          audience: item.audience || 'All Clients & Employees',
          priority: (item.priority || 'normal').toLowerCase(),
          isoDate: item.isoDate || item.createdAt || item.createdDate || item.date || new Date().toISOString(),
          read: isRead
        });
      };

      // 1. Portal Notifications
      if (portalRes.status === 'fulfilled' && Array.isArray(portalRes.value)) {
        portalRes.value.forEach(processItem);
      }

      // 2. Broadcast Announcements from MongoDB
      if (annsRes.status === 'fulfilled' && Array.isArray(annsRes.value)) {
        annsRes.value.forEach((ann) => {
          processItem({
            ...ann,
            type: 'announcement'
          });
        });
      }

      // 3. System Notifications
      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        const notifData = notifsRes.value.data || notifsRes.value.notifications || (Array.isArray(notifsRes.value) ? notifsRes.value : []);
        if (Array.isArray(notifData)) {
          notifData.forEach((n) => {
            if (n.recipientRole === 'all' || n.recipientRole === 'client' || n.clientName) {
              processItem({
                ...n,
                rawId: n._id || n.id,
                timestamp: n.date || 'Today'
              });
            }
          });
        }
      }

      // Sort by newest first
      list.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

      setNotifications(list);
    } catch (err) {
      console.warn('Error fetching client notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, clientId, readIds]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    const handleRefresh = () => fetchNotifications();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('user_logged_in', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('user_logged_in', handleRefresh);
    };
  }, [fetchNotifications]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleMarkAsRead = async (item) => {
    const id = item.id || item;
    const rawId = item.rawId;

    if (rawId) {
      try {
        await notificationService.markAsRead(companyId, rawId);
      } catch (e) {
        console.warn('Could not mark read on backend:', e);
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false, read: true } : n))
    );

    setReadIds((prev) => {
      const next = Array.from(new Set([...prev, id, rawId].filter(Boolean)));
      try {
        localStorage.setItem(`novaspark_read_notifs_client_${clientId}`, JSON.stringify(next));
      } catch {}
      return next;
    });

    showToast('✓ Notification marked as read.', 'success');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(companyId);
    } catch (e) {}

    const allIds = notifications.map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false, read: true })));

    setReadIds(allIds);
    try {
      localStorage.setItem(`novaspark_read_notifs_client_${clientId}`, JSON.stringify(allIds));
    } catch {}

    showToast('✓ All notifications marked as read.', 'success');
  };

  const filtered = notifications.filter((n) => {
    const isUnread = !n.read;
    let matchesTab = true;
    if (filterType === 'unread') matchesTab = isUnread;
    else if (filterType === 'announcement') matchesTab = n.type === 'announcement';
    else if (filterType === 'billing') matchesTab = n.type === 'billing';
    else if (filterType === 'workforce') matchesTab = n.type === 'workforce' || n.type === 'system';

    if (!matchesTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchMsg = (n.message || '').toLowerCase().includes(q);
      const matchSender = (n.senderName || '').toLowerCase().includes(q);
      return matchTitle || matchMsg || matchSender;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const announcementsCount = notifications.filter((n) => n.type === 'announcement').length;
  const billingCount = notifications.filter((n) => n.type === 'billing').length;
  const workforceCount = notifications.filter((n) => n.type === 'workforce' || n.type === 'system').length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone size={18} strokeWidth={2.2} />;
      case 'billing':
        return <Receipt size={18} strokeWidth={2.2} />;
      case 'workforce':
        return <Users size={18} strokeWidth={2.2} />;
      default:
        return <Bell size={18} strokeWidth={2.2} />;
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <span className={`${styles.priorityBadge} ${styles.priorityUrgent}`}>
          <span className={styles.pulseDot} />
          <span>Urgent Priority</span>
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className={`${styles.priorityBadge} ${styles.priorityImportant}`}>
          <AlertCircle size={12} />
          <span>Important</span>
        </span>
      );
    }
    return (
      <span className={`${styles.priorityBadge} ${styles.priorityNormal}`}>
        <Info size={12} />
        <span>General Notice</span>
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.companyScopeBadge}>
            <Building2 size={13} />
            <span>{clientCompany?.name || 'Star Track Pvt. Ltd.'} Client Portal</span>
          </div>
          <h1 className={styles.pageTitle}>Notifications &amp; Announcements</h1>
          <p className={styles.pageSubtitle}>
            Official broadcasts, administrative directives, billing invoices, and operational security updates.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchNotifications}
            title="Refresh notifications"
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button type="button" className={styles.markAllBtn} onClick={handleMarkAllRead}>
              <Check size={15} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Summary Row */}
      <div className={styles.filterBar}>
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterType === 'all' ? styles.tabActive : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Notifications
            <span className={styles.tabCount}>{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterType === 'unread' ? styles.tabActive : ''}`}
            onClick={() => setFilterType('unread')}
          >
            Unread
            {unreadCount > 0 ? (
              <span className={`${styles.tabCount} ${styles.tabCountHighlight}`}>{unreadCount}</span>
            ) : (
              <span className={styles.tabCount}>0</span>
            )}
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterType === 'announcement' ? styles.tabActive : ''}`}
            onClick={() => setFilterType('announcement')}
          >
            Announcements
            <span className={styles.tabCount}>{announcementsCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterType === 'billing' ? styles.tabActive : ''}`}
            onClick={() => setFilterType('billing')}
          >
            Billing Updates
            <span className={styles.tabCount}>{billingCount}</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${filterType === 'workforce' ? styles.tabActive : ''}`}
            onClick={() => setFilterType('workforce')}
          >
            Workforce Alerts
            <span className={styles.tabCount}>{workforceCount}</span>
          </button>
        </div>
      </div>

      {/* Notification Cards Feed */}
      <div className={styles.notificationsFeed}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.loadingSpinner}>
              <RefreshCw size={24} className={styles.spinning} />
            </div>
            <p className={styles.emptySubtitle}>Loading real-time company notices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <Bell size={32} />
            </div>
            <h3 className={styles.emptyTitle}>No notifications found</h3>
            <p className={styles.emptySubtitle}>You're all caught up with your company alerts.</p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filtered.map((item) => {
              const isUnread = !item.read;
              const dt = formatFullDateTime(item);

              return (
                <article
                  key={item.id}
                  className={`${styles.proCard} ${isUnread ? styles.proCardUnread : ''} ${styles[`priorityBorder_${item.priority}`] || ''}`}
                >
                  {/* Left Priority Accent Bar */}
                  <div className={`${styles.accentBar} ${styles[`accent_${item.priority}`] || styles.accent_normal}`} />

                  {/* Card Content */}
                  <div className={styles.cardInner}>
                    {/* Top Sender & Time Row */}
                    <div className={styles.senderHeader}>
                      {/* Sender Info Block */}
                      <div className={styles.senderBlock}>
                        <div className={`${styles.senderAvatar} ${styles[`senderAvatar_${item.type}`] || styles.senderAvatar_announcement}`}>
                          {item.senderAvatar || 'AD'}
                        </div>
                        <div className={styles.senderMeta}>
                          <div className={styles.senderNameRow}>
                            <span className={styles.senderName}>{item.senderName}</span>
                            <span className={styles.verifiedBadge} title="Verified Administrative Authority">
                              <BadgeCheck size={13} />
                              <span>Verified Broadcast</span>
                            </span>
                          </div>
                          <span className={styles.senderSubtext}>
                            {item.senderRole} • {item.senderDepartment}
                          </span>
                        </div>
                      </div>

                      {/* Exact Date & Time Meta */}
                      <div className={styles.timeBlock}>
                        <div className={styles.exactTimeTag}>
                          <Calendar size={13} className={styles.metaIcon} />
                          <span className={styles.dateText}>{dt.date}</span>
                          <span className={styles.timeSeparator}>•</span>
                          <Clock size={13} className={styles.metaIcon} />
                          <span className={styles.timeText}>{dt.time}</span>
                        </div>
                        <span className={styles.relativeTime}>{dt.relative}</span>
                      </div>
                    </div>

                    {/* Meta Tags Row: Target Audience & Priority */}
                    <div className={styles.tagsRow}>
                      <div className={styles.audienceTag}>
                        <Radio size={12} className={styles.audienceIcon} />
                        <span>Target: <strong>{item.audience || 'All Clients & Employees'}</strong></span>
                      </div>
                      {getPriorityBadge(item.priority)}
                      {isUnread && <span className={styles.newPulseBadge}>NEW</span>}
                    </div>

                    {/* Announcement Title & Message Box */}
                    <div className={styles.messageBox}>
                      <div className={styles.titleLine}>
                        <div className={`${styles.typeMiniIcon} ${styles[`typeMini_${item.type}`] || styles.typeMini_announcement}`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                      </div>

                      <div className={styles.messageContent}>
                        <p>{item.message}</p>
                      </div>
                    </div>

                    {/* Footer Row: Category & Action */}
                    <div className={styles.cardFooter}>
                      <div className={styles.footerInfo}>
                        <span className={`${styles.categoryPill} ${styles[`catPill_${item.type}`] || styles.catPill_announcement}`}>
                          {(item.type || 'Announcement').toUpperCase()}
                        </span>
                        <span className={styles.companyFooterTag}>
                          RR Security &amp; Facilities Management
                        </span>
                      </div>

                      <div className={styles.footerActions}>
                        {isUnread ? (
                          <button
                            type="button"
                            className={styles.actionMarkReadBtn}
                            onClick={() => handleMarkAsRead(item)}
                          >
                            <Check size={14} />
                            <span>Mark as Read</span>
                          </button>
                        ) : (
                          <span className={styles.readAcknowledge}>
                            <CheckCircle2 size={14} />
                            <span>Acknowledged</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientNotifications;
