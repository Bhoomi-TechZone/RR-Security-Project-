import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  CircleHelp,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Users
} from 'lucide-react';
import styles from './UserHeader.module.css';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import { useUserAuth } from '../../context/UserAuthContext';
import ExternalLinksDrawer from './ExternalLinksDrawer';

function UserHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, switchUser, availableDemoUsers } = useUserAuth();
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/user/dashboard')) return 'Dashboard';
    if (path.startsWith('/user/employees')) return 'Management / Employees';
    if (path.startsWith('/user/attendance')) return 'Management / Attendance';
    if (path.startsWith('/user/leave')) return 'Management / Leave';
    if (path.startsWith('/user/overtime')) return 'Management / Overtime';
    if (path.startsWith('/user/shifts')) return 'Management / Shifts';
    if (path.startsWith('/user/inventory')) return 'Management / Inventory';
    if (path.startsWith('/user/advances-loans')) return 'Management / Advances & Loans';
    if (path.startsWith('/user/payroll')) return 'Payroll / Payroll';
    if (path.startsWith('/user/reports')) return 'Reports / Reports';
    if (path.startsWith('/user/notifications')) return 'System / Notifications';
    return 'Dashboard';
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

      {/* Right side: Role Switcher, Notifications, Profile dropdown */}
      <div className={styles.right}>
        {/* Demo Role Switcher for previewing different roles */}
        {availableDemoUsers && availableDemoUsers.length > 1 && (
          <div className={styles.roleSwitcherWrap}>
            <label htmlFor="demo-role-select" className={styles.switcherLabel}>
              <Users size={13} />
              <span className={styles.switcherText}>Role:</span>
            </label>
            <select
              id="demo-role-select"
              className={styles.roleSelect}
              value={currentUser?.id}
              onChange={(e) => switchUser(e.target.value)}
              title="Switch active user to preview role permissions"
            >
              {availableDemoUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.actionBtn}
            onClick={() => navigate('/user/notifications')}
            aria-label="View recent alerts"
            title="Notifications"
          >
            <Bell size={19} strokeWidth={2} />
            <span className={styles.badge} aria-label="3 unread notifications">3</span>
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
                initials={currentUser?.initials || 'US'}
                size="sm"
                name={currentUser?.name || 'User'}
              />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>{currentUser?.name || 'HRMS User'}</span>
                <span className={styles.profileRole}>{currentUser?.role || 'Portal User'}</span>
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
            <li className={styles.dropdownItem}>
              <a href="#" onClick={(e) => e.preventDefault()} className={styles.dropdownLink}>
                <Settings size={14} />
                <span>Account Settings</span>
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
