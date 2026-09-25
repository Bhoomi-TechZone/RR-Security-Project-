import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Building,
  Filter,
  Check,
  Megaphone,
  Receipt,
  Users,
  Clock
} from 'lucide-react';
import styles from './ClientNotifications.module.css';
import { useClientAuth } from '../../context/ClientAuthContext';
import { CLIENT_NOTIFICATIONS } from '../../data/clientPortalData';
import Toast from '../../components/common/Toast';

function ClientNotifications() {
  const { clientCompany } = useClientAuth();

  const [notifications, setNotifications] = useState(CLIENT_NOTIFICATIONS);
  const [filterType, setFilterType] = useState('all');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    showToast('Notification marked as read.', 'success');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read.', 'success');
  };

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return n.unread;
    return n.type === filterType;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone size={16} />;
      case 'billing':
        return <Receipt size={16} />;
      case 'workforce':
        return <Users size={16} />;
      default:
        return <Bell size={16} />;
    }
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

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Notifications & Announcements</h1>
          <p className={styles.pageSubtitle}>
            Administrative broadcasts, billing alerts, and operational notices for your organization.
          </p>
        </div>

        {unreadCount > 0 && (
          <button type="button" className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <Check size={15} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${filterType === 'all' ? styles.tabActive : ''}`}
          onClick={() => setFilterType('all')}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${filterType === 'unread' ? styles.tabActive : ''}`}
          onClick={() => setFilterType('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${filterType === 'announcement' ? styles.tabActive : ''}`}
          onClick={() => setFilterType('announcement')}
        >
          Announcements
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${filterType === 'billing' ? styles.tabActive : ''}`}
          onClick={() => setFilterType('billing')}
        >
          Billing Updates
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${filterType === 'workforce' ? styles.tabActive : ''}`}
          onClick={() => setFilterType('workforce')}
        >
          Workforce Alerts
        </button>
      </div>

      {/* Notifications List */}
      <div className={styles.notificationsCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={32} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No notifications found</h3>
            <p className={styles.emptySubtitle}>You're all caught up with your company alerts.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`${styles.item} ${item.unread ? styles.itemUnread : ''}`}
              >
                <div className={`${styles.iconWrap} ${styles[`type_${item.type}`]}`}>
                  {getTypeIcon(item.type)}
                </div>

                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <div className={styles.titleWithBadge}>
                      <h3 className={styles.itemTitle}>{item.title}</h3>
                      {item.unread && <span className={styles.newBadge}>NEW</span>}
                    </div>
                    <span className={styles.timeTag}>
                      <Clock size={12} />
                      <span>{item.date} at {item.time}</span>
                    </span>
                  </div>

                  <p className={styles.message}>{item.message}</p>

                  <div className={styles.footerRow}>
                    <span className={styles.categoryBadge}>
                      {item.type.toUpperCase()}
                    </span>
                    {item.unread && (
                      <button
                        type="button"
                        className={styles.markReadBtn}
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientNotifications;
