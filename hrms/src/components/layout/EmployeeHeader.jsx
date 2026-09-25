import React, { useState } from 'react';
import { Bell, ChevronDown, Menu, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Dropdown from '../common/Dropdown';
import ExternalLinksDrawer from './ExternalLinksDrawer';
import styles from './EmployeeHeader.module.css';

function EmployeeHeader({ onToggleSidebar, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLinksDrawerOpen, setIsLinksDrawerOpen] = useState(false);
  const section = location.pathname.split('/')[2] || 'dashboard';
  const title = section === 'dashboard' ? 'My Dashboard' : section.replace('-', ' ');

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
          <span className={styles.badge}>3</span>
        </button>
        <span className={styles.divider} />
        <Dropdown
          align="right"
          trigger={
            <button className={styles.profileTrigger} aria-label="Profile options menu">
              <Avatar initials="RS" size="sm" status={null} name="Rahul Sharma" />
              <div className={styles.profileMeta}>
                <span className={styles.profileName}>Rahul Sharma</span>
                <span className={styles.profileRole}>Employee</span>
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
