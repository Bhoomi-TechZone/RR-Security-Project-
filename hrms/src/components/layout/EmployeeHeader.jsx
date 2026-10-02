import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Menu, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import ExternalLinksDrawer from './ExternalLinksDrawer';
import authService from '../../services/authService';
import styles from './EmployeeHeader.module.css';

function EmployeeHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
  const section = location.pathname.split('/')[2] || 'dashboard';
  const title = section === 'dashboard' ? 'My Dashboard' : section.replace('-', ' ');

  const currentUser = authService.getCurrentUser() || authService.getUser() || {};
  const userName = currentUser.name || currentUser.employeeName || 'Employee';
  const userInitials = (userName.split(' ').map((n) => n[0]).join('').substring(0, 2) || 'EM').toUpperCase();
  const userRole = currentUser.designation || currentUser.role || 'Employee';
  const employeeId = currentUser.employeeId || currentUser.employeeCode || currentUser.id || 'EMP-001';

  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const stored = localStorage.getItem(`novaspark_unread_count_${employeeId}`);
      if (stored !== null) return parseInt(stored, 10) || 0;
      return 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const updateUnread = (e) => {
      try {
        if (e && e.detail && typeof e.detail.unreadCount === 'number') {
          setUnreadCount(e.detail.unreadCount);
          return;
        }
        const stored = localStorage.getItem(`novaspark_unread_count_${employeeId}`);
        setUnreadCount(stored !== null ? (parseInt(stored, 10) || 0) : 0);
      } catch {
        setUnreadCount(0);
      }
    };

    window.addEventListener('storage', updateUnread);
    window.addEventListener('notif_read_updated', updateUnread);
    return () => {
      window.removeEventListener('storage', updateUnread);
      window.removeEventListener('notif_read_updated', updateUnread);
    };
  }, [employeeId]);

  return (
    <header className={styles.header} aria-label="Employee header">
      <div className={styles.left}>
        <button onClick={onToggleSidebar} className={styles.toggleBtn} aria-label="Toggle sidebar panel">
          <Menu size={20} strokeWidth={2.2} />
        </button>
        <span className={styles.breadcrumb}>{title}</span>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => navigate('/employee/notifications')}
          aria-label="View notifications"
        >
          <Bell size={19} strokeWidth={2} />
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
        </button>
        <span className={styles.divider} />
        <Dropdown
          align="right"
          trigger={
            <button className={styles.profileTrigger} aria-label="Profile options menu">
              <Avatar initials={userInitials} size="sm" status={null} name={userName} />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>{userName}</span>
                <span className={styles.profileRole}>{userRole}</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </button>
          }
        >
          <ul className={styles.dropdownMenu}>
            <li className={styles.dropdownItem}>
              <button type="button" className={styles.dropdownLink} onClick={() => navigate('/employee/dashboard')}>
                <User size={14} />
                <span>My Profile</span>
              </button>
            </li>
            <li className={styles.dropdownItem}>
              <button type="button" className={`${styles.dropdownLink} ${styles.logoutOption}`} onClick={onLogout}>
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

export default EmployeeHeader;
