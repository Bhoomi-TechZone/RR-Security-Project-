import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  Building
} from 'lucide-react';
import styles from './ClientHeader.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import { useClientAuth } from '../../context/ClientAuthContext';
import clientPortalService from '../../services/clientPortalService';

function ClientHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clientCompany, clientUser } = useClientAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const notifs = await clientPortalService.getNotifications();
        if (isMounted && Array.isArray(notifs)) {
          const stored = localStorage.getItem(`novaspark_read_notifs_client_${clientCompany?.clientId || 'CLI-001'}`);
          const readIds = stored ? JSON.parse(stored) : [];
          const unread = notifs.filter(n => !n.read && !readIds.includes(n.id) && !readIds.includes(n.rawId)).length;
          setUnreadCount(unread);
        }
      } catch (_) {}
    };

    loadUnread();
    const interval = setInterval(loadUnread, 5000);
    const handleRefresh = () => loadUnread();

    window.addEventListener('focus', handleRefresh);
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('user_logged_in', handleRefresh);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleRefresh);
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('user_logged_in', handleRefresh);
    };
  }, [clientCompany?.clientId, location.pathname]);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/client/dashboard')) return 'Client Portal / Overview';
    if (path.startsWith('/client/employees')) return 'Workforce / Employees';
    if (path.startsWith('/client/attendance')) return 'Workforce / Attendance';
    if (path.startsWith('/client/billing')) return 'Finance / Billing & Invoices';
    if (path.startsWith('/client/reports')) return 'Reports / Company Reports';
    if (path.startsWith('/client/notifications')) return 'Communication / Notifications';
    if (path.startsWith('/client/profile')) return 'Account / Company Profile';
    return 'Client Portal';
  };

  const clientInitials = clientUser?.initials ||
    (clientUser?.name || 'Client')
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  const clientCode = clientCompany?.clientCode || clientCompany?.clientId || 'CLI-001';

  return (
    <header className={styles.header} aria-label="Client portal header">
      {/* Left side: Toggle button and breadcrumb */}
      <div className={styles.left}>
        <button
          onClick={onToggleSidebar}
          className={styles.toggleBtn}
          aria-label="Toggle sidebar panel"
        >
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <span className={styles.breadcrumb}>{getBreadcrumb()}</span>
      </div>

      {/* Right side: Mapped Company Badge, Notifications, Profile Dropdown */}
      <div className={styles.right}>
        {/* Company Identity & Client Code Tag */}
        <div className={styles.companyPill} title="Authenticated Client Company">
          <Building size={14} className={styles.companyPillIcon} />
          <span className={styles.companyPillText}>
            {clientCompany?.name || 'Client Company'}
          </span>
          <span className={styles.clientCodeBadge}>
            {clientCode}
          </span>
        </div>

        {/* Notifications Icon */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.actionBtn}
            onClick={() => navigate('/client/notifications')}
            aria-label="View notifications"
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={19} strokeWidth={2} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  padding: '2px 5px',
                  minWidth: '16px',
                  textAlign: 'center',
                  lineHeight: '1'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Vertical divider */}
        <span className={styles.divider} />

        {/* Client Profile Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button className={styles.profileTrigger} aria-label="Client profile options menu">
              <Avatar
                initials={clientInitials}
                size="sm"
                name={clientUser?.name || 'Client User'}
              />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>
                  {clientUser?.name || 'Client Representative'}
                </span>
                <span className={styles.profileRole}>Client</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </button>
          }
        >
          <ul className={styles.dropdownMenu}>
            <li className={styles.dropdownHeader}>
              <span className={styles.dropdownCompanyName}>
                {clientCompany?.name || 'Client Company'}
              </span>
              <span className={styles.dropdownClientCode}>
                Code: {clientCode}
              </span>
            </li>
            <li className={styles.dropdownItemDivider} />
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={() => navigate('/client/profile')}
                className={styles.dropdownLink}
              >
                <Building2 size={14} />
                <span>Company Profile</span>
              </button>
            </li>
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={() => navigate('/client/billing')}
                className={styles.dropdownLink}
              >
                <span>Billing Summary</span>
              </button>
            </li>
            <li className={styles.dropdownItemDivider} />
            <li className={styles.dropdownItem}>
              <button
                type="button"
                onClick={onLogout}
                className={`${styles.dropdownLink} ${styles.logoutOption}`}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </Dropdown>
      </div>
    </header>
  );
}

export default ClientHeader;
