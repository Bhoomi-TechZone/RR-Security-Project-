import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield
} from 'lucide-react';
import styles from './UserHeader.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import { usePermissions } from '../../context/PermissionContext';
import notificationService from '../../services/notificationService';
import ExternalLinksDrawer from './ExternalLinksDrawer';

function UserHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userRole } = usePermissions();
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const companyId = currentUser?.companyId || 'RRS8392014SEC';

  React.useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount(companyId);
        if (isMounted) setUnreadCount(count);
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [companyId]);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/user/dashboard')) return 'Dashboard';
    if (path.startsWith('/user/clients')) return 'Workforce / Clients';
    if (path.startsWith('/user/companies')) return 'Workforce / Clients';
    if (path.startsWith('/user/employees')) return 'Workforce / Employees';
    if (path.startsWith('/user/attendance')) return 'Workforce / Attendance';
    if (path.startsWith('/user/shifts')) return 'Workforce / Shift Management';
    if (path.startsWith('/user/payroll-setup')) return 'Payroll Management / Payroll Setup';
    if (path.startsWith('/user/statutory-setup')) return 'Payroll Management / Statutory Setup';
    if (path.startsWith('/user/advances-loans')) return 'Payroll Management / Advances & Loans';
    if (path.startsWith('/user/reimbursements')) return 'Payroll Management / Reimbursements';
    if (path.startsWith('/user/overtime')) return 'Payroll Management / Overtime';
    if (path.startsWith('/user/payroll')) return 'Payroll Management / Payroll';
    if (path.startsWith('/user/leave')) return 'Management / Leave';
    if (path.startsWith('/user/inventory')) return 'Management / Inventory';
    if (path.startsWith('/user/reports')) return 'Management / Reports';
    if (path.startsWith('/user/company-setup')) return 'System / Company Setup';
    if (path.startsWith('/user/work-locations')) return 'System / Work Locations';
    if (path.startsWith('/user/masters')) return 'System / Masters';
    if (path.startsWith('/user/roles-permissions')) return 'System / Role & Permissions';
    if (path.startsWith('/user/users')) return 'System / User Management';
    if (path.startsWith('/user/preferences')) return 'System / Preferences';
    if (path.startsWith('/user/templates')) return 'System / Templates';
    if (path.startsWith('/user/document-compliance')) return 'System / Docs & Compliance';
    if (path.startsWith('/user/notifications')) return 'System / Notifications';
    return 'User Portal';
  };

  return (
    <header className={styles.header} aria-label="User portal header">
      {/* Left side: Toggle button and section label */}
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

      {/* Right side: Notifications, Profile dropdown */}
      <div className={styles.right}>
        {/* Notifications */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.actionBtn}
            onClick={() => navigate('/user/notifications')}
            aria-label="View recent alerts"
            title="Notifications"
          >
            <Bell size={19} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className={styles.badge} aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Vertical divider */}
        <span className={styles.divider} />

        {/* User profile dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button className={styles.profileTrigger} aria-label="Profile options menu">
              <Avatar
                initials={currentUser?.initials || (currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : 'US')}
                size="sm"
                name={currentUser?.name || 'User'}
              />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>{currentUser?.name || 'User'}</span>
                <span className={styles.profileRole}>{userRole || currentUser?.roleName || currentUser?.role || 'Custom Role'}</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </button>
          }
        >
          <ul className={styles.dropdownMenu}>
            <li className={styles.dropdownItem}>
              <a href="#" onClick={(e) => e.preventDefault()} className={styles.dropdownLink}>
                <User size={14} />
                <span>My Profile</span>
              </a>
            </li>
            <li className={styles.dropdownItemDivider} />
            <li className={styles.dropdownItem}>
              <button onClick={onLogout} className={`${styles.dropdownLink} ${styles.logoutOption}`}>
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </Dropdown>

        {/* External Portals / Apps Trigger (9-dots icon) */}
        <button
          type="button"
          className={styles.appsGridBtn}
          onClick={() => setIsLinksDrawerOpen(true)}
          title="Government & Statutory Portals"
          aria-label="Open Government & Statutory Portals"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="4" cy="4" r="2.5" />
            <circle cx="12" cy="4" r="2.5" />
            <circle cx="20" cy="4" r="2.5" />
            <circle cx="4" cy="12" r="2.5" />
            <circle cx="12" cy="12" r="2.5" />
            <circle cx="20" cy="12" r="2.5" />
            <circle cx="4" cy="20" r="2.5" />
            <circle cx="12" cy="20" r="2.5" />
            <circle cx="20" cy="20" r="2.5" />
          </svg>
        </button>
      </div>

      {/* External Statutory Links Drawer */}
      <ExternalLinksDrawer
        isOpen={isLinksDrawerOpen}
        onClose={() => setIsLinksDrawerOpen(false)}
      />
    </header>
  );
}

export default UserHeader;
